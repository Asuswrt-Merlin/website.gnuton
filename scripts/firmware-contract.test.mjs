import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseFirmwareManifest,
  parseMd5,
  validateFirmwareManifest,
  variantLabel,
} from './lib/firmware-contract.mjs';

const REPOSITORY = 'Asuswrt-Merlin/asuswrt-merlin.ng-3006.gnuton';
const TAG = '3006.102.9_1-gnuton1';
const DEFAULT_FILE = 'GT-BE98_3006_102.9_1-gnuton1_nand_squashfs.pkgtb';
const ROG_FILE = 'GT-BE98_3006_102.9_1-gnuton1_rog_nand_squashfs.pkgtb';

const assets = [
  { name: DEFAULT_FILE, size: 78_681_280 },
  { name: ROG_FILE, size: 81_007_292 },
];

const manifest = {
  schemaVersion: 1,
  repository: REPOSITORY,
  tag: TAG,
  branch: '3006',
  images: [
    {
      model: 'GT-BE98',
      variant: 'default',
      file: DEFAULT_FILE,
      size: 78_681_280,
      md5: '169F9AA6D2246E9B886698CA029E07CE',
      sha256: '16520FB8E19153C3F41F1B91B5CA7813699F07D6EC9C0686A2CA518C08C664F5',
    },
    {
      model: 'GT-BE98',
      variant: 'rog',
      file: ROG_FILE,
      size: 81_007_292,
      md5: '2EAE054470913CCB7D44C67C00AD5C51',
      sha256: 'AF100C0F04B7D2B60F007D6A81752A242B8DB2874085D76209C0F440E4822190',
    },
  ],
};

const expected = {
  repository: REPOSITORY,
  tag: TAG,
  branch: '3006',
  assets,
};

const clone = (value) => JSON.parse(JSON.stringify(value));

test('accepts a valid two-variant manifest and normalises checksums', () => {
  const parsed = parseFirmwareManifest(JSON.stringify(manifest));
  const validated = validateFirmwareManifest(parsed, expected);

  assert.equal(validated.schemaVersion, 1);
  assert.equal(validated.images.length, 2);
  assert.deepEqual(
    validated.images.map((image) => image.variant),
    ['default', 'rog'],
  );
  assert.equal(validated.images[0].md5, '169f9aa6d2246e9b886698ca029e07ce');
  assert.equal(
    validated.images[1].sha256,
    'af100c0f04b7d2b60f007d6a81752a242b8db2874085d76209c0f440e4822190',
  );
});

test('rejects unsupported manifest schema versions', () => {
  const unsupported = clone(manifest);
  unsupported.schemaVersion = 2;

  assert.throws(
    () => validateFirmwareManifest(unsupported, expected),
    /Unsupported .* schemaVersion 2; expected 1/,
  );
});

test('rejects a manifest whose repository does not match the release', () => {
  const wrongRepository = clone(manifest);
  wrongRepository.repository = 'Asuswrt-Merlin/asuswrt-merlin.ng-3004.gnuton';

  assert.throws(
    () => validateFirmwareManifest(wrongRepository, expected),
    /repository .* does not match the release repository/,
  );
});

test('rejects a manifest whose branch does not match the release', () => {
  const wrongBranch = clone(manifest);
  wrongBranch.branch = '3004';

  assert.throws(
    () => validateFirmwareManifest(wrongBranch, expected),
    /branch .* does not match the release branch/,
  );
});

test('rejects a manifest whose tag does not match the release', () => {
  const wrongTag = clone(manifest);
  wrongTag.tag = '3006.102.8_0-gnuton0';

  assert.throws(
    () => validateFirmwareManifest(wrongTag, expected),
    /tag .* does not match the release tag/,
  );
});

test('rejects a manifest that references a missing release asset', () => {
  const missingFile = clone(manifest);
  missingFile.images[1].file = 'GT-BE98_missing.pkgtb';

  assert.throws(
    () => validateFirmwareManifest(missingFile, expected),
    /is not a release asset/,
  );
});

test('rejects a manifest whose size does not match the release asset', () => {
  const mismatched = clone(manifest);
  mismatched.images[0].size += 1;

  assert.throws(
    () => validateFirmwareManifest(mismatched, expected),
    /does not match release asset/,
  );
});

test('rejects duplicate model and variant pairs', () => {
  const duplicate = clone(manifest);
  duplicate.images[1].variant = 'default';

  assert.throws(
    () => validateFirmwareManifest(duplicate, expected),
    /duplicates model "GT-BE98" with variant "default"/,
  );
});

test('parses a portable legacy .md5 file and lower-cases the hash', () => {
  const parsed = parseMd5(
    '169F9AA6D2246E9B886698CA029E07CE  /home/build/GT-BE98_3006_102.9_1-gnuton1_nand_squashfs.pkgtb\n',
  );

  assert.deepEqual(parsed, {
    md5: '169f9aa6d2246e9b886698ca029e07ce',
    filename: 'GT-BE98_3006_102.9_1-gnuton1_nand_squashfs.pkgtb',
    path: '/home/build/GT-BE98_3006_102.9_1-gnuton1_nand_squashfs.pkgtb',
  });
  assert.equal(parseMd5('not a checksum'), null);
});

test('labels known and future theme variants', () => {
  assert.equal(variantLabel('default'), 'Default');
  assert.equal(variantLabel('tuf'), 'TUF Gaming');
  assert.equal(variantLabel('rog'), 'ROG');
  assert.equal(variantLabel('merlin-special'), 'Merlin Special');
});
