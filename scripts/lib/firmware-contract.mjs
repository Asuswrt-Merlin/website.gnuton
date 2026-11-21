/**
 * Firmware release contract helpers.
 *
 * The 3004 and 3006 release workflows publish `firmware-release.json` next to
 * every firmware image. The website validates that manifest before trusting
 * any checksum and falls back to the portable `.md5` companion asset for
 * releases that predate the contract.
 *
 * Keep this module dependency-free: it runs in the stats script before Astro
 * or the project dependencies are needed.
 */
import variantConfig from '../../src/data/firmware-variants.json' with { type: 'json' };

export const SUPPORTED_SCHEMA_VERSION = 1;
export const FIRMWARE_MANIFEST_NAME = 'firmware-release.json';

/** Human labels for the schema v1 theme vocabulary (shared with the UI). */
export const VARIANT_LABELS = Object.freeze({ ...variantConfig.labels });

/** Primary download first, then the known themes, then future keys. */
export const VARIANT_PREFERENCE = Object.freeze([...variantConfig.preference]);

const MD5_PATTERN = /^[a-f0-9]{32}$/i;
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const MD5_LINE = /^([a-f0-9]{32})\s+\*?(.+?)\s*$/im;

export class FirmwareContractError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FirmwareContractError';
  }
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

/** "tuf" -> "TUF Gaming", "special" -> "Special", "foo-bar" -> "Foo Bar". */
export function variantLabel(variant) {
  const key = typeof variant === 'string' ? variant.trim() : '';
  if (!key) return VARIANT_LABELS.default;
  if (VARIANT_LABELS[key]) return VARIANT_LABELS[key];

  return key
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

/** Lower is more preferred: default, tuf, rog, then unknown keys. */
export function variantRank(variant) {
  const index = VARIANT_PREFERENCE.indexOf(variant);
  return index === -1 ? VARIANT_PREFERENCE.length : index;
}

/** Sort images/variants in preference order, then alphabetically by key. */
export function compareVariants(first, second) {
  const firstKey = typeof first === 'string' ? first : first?.variant ?? first?.key;
  const secondKey = typeof second === 'string' ? second : second?.variant ?? second?.key;
  const rank = variantRank(firstKey) - variantRank(secondKey);
  if (rank !== 0) return rank;
  return String(firstKey).localeCompare(String(secondKey));
}

/**
 * Parse a portable `.md5` file. Accepted formats are
 * `<32-hex>  <basename>` and `<32-hex>  <path>` (with `*` binary markers).
 * Returns the lower-case hash and the final path component, or null when the
 * text has no valid checksum line.
 */
export function parseMd5(text) {
  if (typeof text !== 'string') return null;

  const match = text.match(MD5_LINE);
  if (!match) return null;

  const path = match[2].trim();
  const filename = path.split(/[\\/]/).filter(Boolean).pop();
  if (!filename) return null;

  return {
    md5: match[1].toLowerCase(),
    filename,
    path,
  };
}

/** Parse JSON without leaking a raw SyntaxError to the caller. */
export function parseFirmwareManifest(text) {
  let manifest;

  try {
    manifest = JSON.parse(text);
  } catch (error) {
    throw new FirmwareContractError(
      `Invalid ${FIRMWARE_MANIFEST_NAME}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!isObject(manifest)) {
    throw new FirmwareContractError(`${FIRMWARE_MANIFEST_NAME} must contain a JSON object.`);
  }

  return manifest;
}

/**
 * Validate a schema v1 manifest against the release it was downloaded from.
 *
 * @param {unknown} manifest Parsed manifest object.
 * @param {object} expected
 * @param {string} expected.repository Release repository, `owner/name`.
 * @param {string} expected.tag Release tag.
 * @param {string} expected.branch Firmware branch (`3006`, `3004`, ...).
 * @param {Array<{name: string, size: number}>} expected.assets Release assets.
 * @returns {object} Normalised manifest with lower-case hexadecimal checksums.
 */
export function validateFirmwareManifest(manifest, expected) {
  const { repository, tag, branch, assets } = expected ?? {};

  if (!isObject(manifest)) {
    throw new FirmwareContractError(`${FIRMWARE_MANIFEST_NAME} must contain a JSON object.`);
  }

  if (manifest.schemaVersion !== SUPPORTED_SCHEMA_VERSION) {
    throw new FirmwareContractError(
      `Unsupported ${FIRMWARE_MANIFEST_NAME} schemaVersion ` +
        `${JSON.stringify(manifest.schemaVersion)}; expected ${SUPPORTED_SCHEMA_VERSION}.`,
    );
  }

  for (const [field, value] of [
    ['repository', repository],
    ['tag', tag],
    ['branch', branch],
  ]) {
    if (!isNonEmptyString(manifest[field]) || manifest[field] !== value) {
      throw new FirmwareContractError(
        `Manifest ${field} ${JSON.stringify(manifest[field])} does not match ` +
          `the release ${field} ${JSON.stringify(value)}.`,
      );
    }
  }

  if (!Array.isArray(manifest.images) || manifest.images.length === 0) {
    throw new FirmwareContractError('Manifest images must be a non-empty array.');
  }

  if (!Array.isArray(assets)) {
    throw new FirmwareContractError('Release assets must be an array.');
  }

  const assetsByName = new Map(assets.map((asset) => [asset?.name, asset]));
  const seen = new Set();
  const images = manifest.images.map((image, index) => {
    const label = `images[${index}]`;

    if (!isObject(image)) {
      throw new FirmwareContractError(`Manifest ${label} must be an object.`);
    }

    for (const field of ['model', 'variant', 'file']) {
      if (!isNonEmptyString(image[field])) {
        throw new FirmwareContractError(`Manifest ${label}.${field} must be a non-empty string.`);
      }
    }

    if (!Number.isInteger(image.size) || image.size <= 0) {
      throw new FirmwareContractError(`Manifest ${label}.size must be a positive integer.`);
    }

    if (typeof image.md5 !== 'string' || !MD5_PATTERN.test(image.md5)) {
      throw new FirmwareContractError(`Manifest ${label}.md5 must be a 32-character hex digest.`);
    }

    if (typeof image.sha256 !== 'string' || !SHA256_PATTERN.test(image.sha256)) {
      throw new FirmwareContractError(
        `Manifest ${label}.sha256 must be a 64-character hex digest.`,
      );
    }

    const uniqueKey = `${image.model}\u0000${image.variant}`;
    if (seen.has(uniqueKey)) {
      throw new FirmwareContractError(
        `Manifest ${label} duplicates model ${JSON.stringify(image.model)} ` +
          `with variant ${JSON.stringify(image.variant)}.`,
      );
    }
    seen.add(uniqueKey);

    const asset = assetsByName.get(image.file);
    if (!asset) {
      throw new FirmwareContractError(
        `Manifest ${label}.file ${JSON.stringify(image.file)} is not a release asset.`,
      );
    }

    if (asset.size !== image.size) {
      throw new FirmwareContractError(
        `Manifest ${label}.size ${image.size} does not match release asset ` +
          `${JSON.stringify(image.file)} size ${asset.size}.`,
      );
    }

    return {
      model: image.model,
      variant: image.variant,
      file: image.file,
      size: image.size,
      md5: image.md5.toLowerCase(),
      sha256: image.sha256.toLowerCase(),
    };
  });

  return {
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    repository: manifest.repository,
    tag: manifest.tag,
    branch: manifest.branch,
    images,
  };
}
