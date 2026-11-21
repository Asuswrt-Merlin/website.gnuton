# Firmware release contract (schema v1)

The 3004 and 3006 firmware repositories publish firmware images as GitHub
Release assets. This document is the contract between those repositories and
the website. The website validates it before showing a checksum and falls back
to the legacy `.md5` behavior for older releases.

Binaries stay in GitHub Releases. There is no mirror, Actions-artifact link or
package registry in this contract.

## Release assets

Every release from the 3004 and 3006 workflows must contain:

| Asset | Required | Purpose |
| --- | --- | --- |
| `<MODEL>_..._<ext>` | yes | firmware image (`.pkgtb`, `.w`, `.trx`, …) |
| `<image>.md5` | yes | MD5 for compatibility with existing tooling and guides |
| `SHA256SUMS` | yes | batch-verifiable SHA-256 checksums |
| `firmware-release.json` | yes | manifest consumed by the website |
| `CHANGELOG` | existing | notes asset; the release body stays canonical |

Checksum files must be portable:

```text
# <image>.md5
169f9aa6d2246e9b886698ca029e07ce  GT-BE98_3006_102.9_1-gnuton1_nand_squashfs.pkgtb

# SHA256SUMS (sorted, one line per image)
16520fb8e19153c3f41f1b91b5ca7813699f07d6ec9c0686a2ca518c08c664f5  GT-BE98_3006_102.9_1-gnuton1_nand_squashfs.pkgtb
```

Write basenames, not absolute build paths. The website accepts both basenames
and paths in `.md5` files for backward compatibility, but new releases should
use the portable form.

## Manifest

`firmware-release.json` is a single JSON object:

```json
{
  "schemaVersion": 1,
  "repository": "Asuswrt-Merlin/asuswrt-merlin.ng-3006.gnuton",
  "tag": "3006.102.9_1-gnuton1",
  "branch": "3006",
  "images": [
    {
      "model": "GT-BE98",
      "variant": "default",
      "file": "GT-BE98_3006_102.9_1-gnuton1_nand_squashfs.pkgtb",
      "size": 78681280,
      "md5": "169f9aa6d2246e9b886698ca029e07ce",
      "sha256": "16520fb8e19153c3f41f1b91b5ca7813699f07d6ec9c0686a2ca518c08c664f5"
    },
    {
      "model": "GT-BE98",
      "variant": "rog",
      "file": "GT-BE98_3006_102.9_1-gnuton1_rog_nand_squashfs.pkgtb",
      "size": 81007292,
      "md5": "2eae054470913ccb7d44c67c00ad5c51",
      "sha256": "af100c0f04b7d2b60f007d6a81752a242b8db2874085d76209c0f440e4822190"
    }
  ]
}
```

Rules:

- `schemaVersion` must be `1`. Unknown versions are treated as invalid and the
  release stays on the legacy `.md5` path.
- `repository` (`owner/name`), `tag` and `branch` must match the release the
  manifest was downloaded from. A mismatch rejects the whole manifest.
- `images` is a non-empty array with one entry per firmware file, including
  **every theme variant**.
- `model` is the packaging prefix (`GT-BE98`, `RT-BE82M`, `RT-BE58U`), not the
  lower-case build-matrix id.
- `variant` is the theme key. Schema v1 defines `default`, `tuf` and `rog`.
  Consumers must preserve unknown keys and label them generically.
- `model` + `variant` must be unique within one release. The same model may
  appear multiple times with different variants.
- `file` is the exact release asset name.
- `size` is the asset size in bytes and must match the GitHub Release asset.
- `md5` is 32 hexadecimal characters; `sha256` is 64 hexadecimal characters.
  The parser lower-cases both.
- A release with a manifest must not collapse or deduplicate theme variants.

The matrix entry that produces an image carries the packaging model and theme:
`{model: "gt-be98", asset: "GT-BE98", sdk: "...", ui: "rog"}`. The release job
writes `model: asset` and `variant: ui`.

## Theme variants

| Key | Label | Notes |
| --- | --- | --- |
| `default` | Default | standard ASUS/Merlin theme; preferred card download |
| `tuf` | TUF Gaming | TUF-styled image, same hardware firmware |
| `rog` | ROG | ROG-styled image, same hardware firmware |
| other | title-cased key | future themes; preserved, not rejected |

Preference order is `default`, `tuf`, `rog`, then other keys alphabetically.
The website uses `default` as the card and no-JavaScript download. If a release
has no `default` image, the first variant in that order is used and labelled as
such. The download dialog offers a theme selector when a model has more than
one variant in the selected release.

## Publish notification

Each firmware repository has a `notify-website.yml` workflow. It runs on
`release: published` (not `released`, to avoid a duplicate event) and sends a
`repository_dispatch` event to `Asuswrt-Merlin/website.gnuton`:

```json
{
  "event_type": "firmware-release",
  "client_payload": {
    "repository": "Asuswrt-Merlin/asuswrt-merlin.ng-3006.gnuton",
    "tag": "3006.102.9_1-gnuton1",
    "prerelease": false
  }
}
```

The dispatch requires a token with `Contents: write` on `website.gnuton`. The
preferred setup is a GitHub App installed **only** on `website.gnuton`; the
firmware repositories store the App id and private key as
`WEBSITE_APP_ID` / `WEBSITE_APP_PRIVATE_KEY` secrets (repository or
organisation level). A fine-grained PAT is a fallback only.

The website workflow passes the payload as `FIRMWARE_REPOSITORY` and
`FIRMWARE_TAG` to `pnpm stats`. If the GitHub API has not caught up with the
new tag yet, the refresh warns and keeps the previous snapshots; the daily cron
is the reconciliation path.

## Website validation and fallback

`scripts/fetch-github-stats.mjs` reads every non-legacy release:

1. If `firmware-release.json` exists, download and validate it against the
   release repository, tag, branch, assets and sizes.
2. On success, attach `model`, `variant`, `md5` and `sha256` to the matching
   asset. Every variant is kept.
3. Cross-check the manifest SHA-256 against the GitHub API asset `digest`
   (`sha256:<hex>`) when present. On a mismatch, warn and drop SHA-256 instead
   of displaying an unverified value.
4. If the manifest is missing or invalid, warn once and use the legacy path:
   read the `.md5` companion asset for the newest stable and pre-release of the
   branch. A valid manifest is never accompanied by an extra `.md5` download.
5. For releases without a manifest, keep the API asset digest as `sha256` when
   GitHub provides one.
6. Build failure keeps the previous snapshots; a bad manifest never fails the
   whole refresh.

`src/data/firmware.ts` then matches manifest assets by
`asset.model === assetPrefix.replace(/_$/, '')`, keeps every variant, and
prefers the newest stable release with a `default` image. Legacy assets still
match by name prefix plus `assetExclude`.

## Checks before publishing

- `firmware-release.json` covers every image and every theme variant.
- `jq -e '.schemaVersion == 1' firmware-release.json`.
- `md5sum -c *.md5` and `sha256sum -c SHA256SUMS` pass in the download
  directory.
- `model` + `variant` is unique.
- `size`, `md5` and `sha256` in the manifest match the uploaded images.
- The release job fails before upload when any of the above is wrong.

On the website side:

```sh
pnpm test
FIRMWARE_TAG=3006.102.9_1-gnuton1 GITHUB_TOKEN="$(gh auth token)" pnpm stats
pnpm check && pnpm build
```

Use the GitHub Actions run summary from `pnpm stats` to confirm the trigger,
per-branch latest releases, manifest coverage, model/variant counts and
warnings.
