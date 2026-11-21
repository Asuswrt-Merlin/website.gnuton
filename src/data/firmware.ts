/**
 * Resolve the best downloadable firmware image for each supported router.
 *
 * The release snapshot stores every asset from both GitHub repositories.
 * Releases with a `firmware-release.json` manifest identify each image by its
 * packaging model and theme variant; older releases keep the asset-name
 * prefix match. Cards show one entry per model:
 *
 * - prefer the newest stable release with a `default` image for the model;
 * - otherwise the newest stable release with any variant;
 * - then the same rules for pre-releases.
 *
 * Every matching theme variant is kept for the download dialog. The card and
 * the no-JavaScript link always use the primary asset: `default` when present,
 * otherwise the first variant in the preference order `default`, `tuf`, `rog`,
 * then future keys.
 *
 * MD5 and SHA-256 values are refreshed from the manifest, or from the `.md5`
 * companion asset for legacy releases. If a model falls back to an older
 * release, its dialog still links the image and GitHub release but reports
 * that the checksum is not in the snapshot.
 */
import {
  changelogReleases,
  renderReleaseNotes,
  type ChangelogRelease,
  type FirmwareAsset,
} from './releases';
import {
  branchById,
  type FirmwareBranch,
  type RouterModel,
} from './routers';
import variantConfig from './firmware-variants.json';

export interface FirmwareVariant {
  key: string;
  label: string;
  asset: FirmwareAsset;
}

export interface RouterFirmware {
  router: RouterModel;
  branch: FirmwareBranch;
  release: ChangelogRelease;
  /** Primary/default download used by the card. */
  asset: FirmwareAsset;
  /** Every theme variant in the selected release, in preference order. */
  variants: FirmwareVariant[];
  notesHtml: string;
}

const IMAGE_ASSET = /\.(pkgtb|w|trx|bin|img|chk)$/i;

// Shared with scripts/lib/firmware-contract.mjs so the Node refresh and the UI
// agree on labels and preference order.
const VARIANT_LABELS: Record<string, string> = variantConfig.labels;
const VARIANT_PREFERENCE: string[] = variantConfig.preference;

/** `tuf` -> "TUF Gaming", `special` -> "Special", `foo-bar` -> "Foo Bar". */
export const variantLabel = (key: string): string => {
  if (VARIANT_LABELS[key]) return VARIANT_LABELS[key];
  if (!key) return VARIANT_LABELS.default;

  return key
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const variantRank = (key: string): number => {
  const index = VARIANT_PREFERENCE.indexOf(key);
  return index === -1 ? VARIANT_PREFERENCE.length : index;
};

const packagingModel = (router: RouterModel): string =>
  router.assetPrefix.replace(/_$/, '');

/**
 * Manifest assets match only by packaging model. Legacy assets have no model
 * and keep the prefix + exclusion match.
 */
const matchesAsset = (asset: FirmwareAsset, router: RouterModel): boolean => {
  if (asset.model) return asset.model === packagingModel(router);

  return (
    IMAGE_ASSET.test(asset.name) &&
    asset.name.startsWith(router.assetPrefix) &&
    !(router.assetExclude ?? []).some((fragment) => asset.name.includes(fragment))
  );
};

/**
 * Keep every theme variant for the model. The same variant can only appear
 * once: a manifest-labelled asset wins over an unlabelled legacy match.
 */
const variantsForRelease = (
  release: ChangelogRelease,
  router: RouterModel,
): FirmwareVariant[] => {
  const assetsByVariant = new Map<string, FirmwareAsset>();

  for (const asset of release.assets) {
    if (!matchesAsset(asset, router)) continue;

    const key = asset.variant ?? 'default';
    const existing = assetsByVariant.get(key);
    if (!existing || (!existing.model && asset.model)) {
      assetsByVariant.set(key, asset);
    }
  }

  return [...assetsByVariant.entries()]
    .map(([key, asset]) => ({ key, label: variantLabel(key), asset }))
    .sort(
      (first, second) =>
        variantRank(first.key) - variantRank(second.key) ||
        first.key.localeCompare(second.key),
    );
};

const hasDefaultVariant = (variants: FirmwareVariant[]): boolean =>
  variants.some((variant) => variant.key === 'default');

const notesCache = new Map<string, string>();

const notesFor = (release: ChangelogRelease): string => {
  const cached = notesCache.get(release.tag);
  if (cached !== undefined) return cached;

  const notes = renderReleaseNotes(release);
  notesCache.set(release.tag, notes);
  return notes;
};

export function firmwareForRouter(router: RouterModel): RouterFirmware | null {
  const candidates = changelogReleases
    .filter((release) => release.branch === router.branch)
    .map((release) => ({
      release,
      variants: variantsForRelease(release, router),
    }))
    .filter((candidate) => candidate.variants.length > 0);

  const stable = candidates.filter(({ release }) => !release.prerelease);
  const prerelease = candidates.filter(({ release }) => release.prerelease);

  const selected =
    stable.find(({ variants }) => hasDefaultVariant(variants)) ??
    stable[0] ??
    prerelease.find(({ variants }) => hasDefaultVariant(variants)) ??
    prerelease[0];

  if (!selected) return null;

  const primary =
    selected.variants.find((variant) => variant.key === 'default') ??
    selected.variants[0];

  return {
    router,
    branch: branchById(router.branch),
    release: selected.release,
    asset: primary.asset,
    variants: selected.variants,
    notesHtml: notesFor(selected.release),
  };
}

export const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};
