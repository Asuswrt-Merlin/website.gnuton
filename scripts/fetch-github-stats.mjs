#!/usr/bin/env node
/**
 * Refresh the GitHub snapshots used by the home page, the release banner and
 * the changelog.
 *
 * The public GitHub REST API needs no dependencies and no token for a handful
 * of requests; CI supplies GITHUB_TOKEN so the build is not limited by the
 * anonymous rate limit. If a request fails, the committed snapshots are left
 * untouched and the build continues with the previous numbers.
 *
 * Counts every release asset (firmware images, checksums, build logs and
 * changelogs), matching the "release downloads" label on the page. Releases
 * are read from both repositories: 3006 lives in its own repository after the
 * split, while 3004 and 386 share the original one. Copies of the same tag can
 * exist in both repositories; the snapshot keeps the canonical repository for
 * the branch and the earliest publication date so imported copies do not look
 * like new releases.
 *
 * Release assets are stored in the snapshot so the firmware page can show the
 * latest image per model and link straight to it. Releases that publish
 * `firmware-release.json` are read manifest-first: every image (including each
 * theme variant) gets its model, variant, MD5 and SHA-256 from the validated
 * manifest. Releases without a valid manifest keep the legacy behavior and
 * read the `.md5` companion asset for the newest stable and pre-release build
 * of each current branch.
 */
import { appendFile, rename, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import {
  FIRMWARE_MANIFEST_NAME,
  parseFirmwareManifest,
  parseMd5,
  validateFirmwareManifest,
} from './lib/firmware-contract.mjs';

const REPOSITORY = 'Asuswrt-Merlin/asuswrt-merlin.ng-3004.gnuton';
const WIFI7_REPOSITORY = 'Asuswrt-Merlin/asuswrt-merlin.ng-3006.gnuton';
// 3006 builds live in their own repository; 3004 and 386 share the other one.
const REPOSITORY_BY_BRANCH = {
  '3006': WIFI7_REPOSITORY,
  '3004': REPOSITORY,
  '386': REPOSITORY,
};
const CURRENT_BRANCHES = new Set(Object.keys(REPOSITORY_BY_BRANCH));
const STATS_OUTPUT = fileURLToPath(new URL('../src/data/github-stats.json', import.meta.url));
const RELEASES_OUTPUT = fileURLToPath(new URL('../src/data/github-releases.json', import.meta.url));
const TOKEN = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
const FIRMWARE_TAG = process.env.FIRMWARE_TAG?.trim() || undefined;
const FIRMWARE_REPOSITORY = process.env.FIRMWARE_REPOSITORY?.trim() || undefined;
const STEP_SUMMARY = process.env.GITHUB_STEP_SUMMARY;

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'gnuton-website-stats',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

const warnings = [];

function warn(message) {
  warnings.push(message);
  console.warn(`::warning::${message}`);
}

async function getJson(url) {
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }

  return response.json();
}

/** Release assets redirect to a download host; do not forward the API token. */
async function getText(url) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': headers['User-Agent'] },
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} for ${url}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await delay(attempt * 1_000);
    }
  }

  throw lastError;
}

async function fetchRepository() {
  const repository = await getJson(`https://api.github.com/repos/${REPOSITORY}`);
  return {
    stars: repository.stargazers_count,
    forks: repository.forks_count,
  };
}

async function fetchAllReleases(repository) {
  const releases = [];

  for (let page = 1; ; page += 1) {
    const batch = await getJson(
      `https://api.github.com/repos/${repository}/releases?per_page=100&page=${page}`,
    );
    releases.push(...batch);

    if (batch.length < 100) break;
  }

  return releases;
}

/** Derive the changelog group from the tag, falling back to the legacy archive. */
function branchFromTag(tag) {
  const branch = tag.match(/^(3006|3004|386)[._]/)?.[1];
  return branch && CURRENT_BRANCHES.has(branch) ? branch : 'legacy';
}

/** Keep the earlier of two ISO timestamps. */
function earliest(first, second) {
  return Date.parse(first) <= Date.parse(second) ? first : second;
}

/** GitHub exposes an asset SHA-256 as `sha256:<hex>`; older assets have none. */
function sha256FromDigest(digest) {
  if (typeof digest !== 'string') return undefined;
  const match = digest.match(/^sha256:([a-f0-9]{64})$/i);
  return match ? match[1].toLowerCase() : undefined;
}

/** Merge both repositories, preferring the repository that owns each line. */
function collectReleases(releasesByRepository) {
  const byTag = new Map();

  for (const [repository, releases] of Object.entries(releasesByRepository)) {
    for (const release of releases) {
      if (release.draft || !release.published_at) continue;

      const branch = branchFromTag(release.tag_name);
      const candidate = {
        tag: release.tag_name,
        name: release.name || release.tag_name,
        url: release.html_url,
        publishedAt: release.published_at,
        repository,
        branch,
        prerelease: release.prerelease,
        body: release.body ?? '',
        assets: (release.assets ?? []).map((asset) => {
          const sha256 = sha256FromDigest(asset.digest);
          return {
            name: asset.name,
            url: asset.browser_download_url,
            size: asset.size,
            downloadCount: asset.download_count ?? 0,
            ...(sha256 ? { sha256 } : {}),
          };
        }),
      };
      const existing = byTag.get(candidate.tag);

      if (!existing) {
        byTag.set(candidate.tag, candidate);
        continue;
      }

      const existingPreferred = REPOSITORY_BY_BRANCH[existing.branch] === existing.repository;
      const candidatePreferred =
        REPOSITORY_BY_BRANCH[candidate.branch] === candidate.repository;
      const preferred =
        candidatePreferred && !existingPreferred ? candidate : existing;

      byTag.set(candidate.tag, {
        ...preferred,
        // Imported copies can carry a later date than the original release.
        publishedAt: earliest(existing.publishedAt, candidate.publishedAt),
        body: preferred.body || existing.body || candidate.body,
      });
    }
  }

  return [...byTag.values()].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
}

/**
 * Attach the published MD5 checksum to the image asset it belongs to. The
 * checksum files may carry the path used during the build, so match on the
 * final filename rather than the asset name alone. A failed download only
 * leaves the checksum empty for that asset; it never aborts the whole snapshot
 * refresh.
 */
async function addChecksums(release) {
  const checksumAssets = release.assets.filter((asset) => asset.name.endsWith('.md5'));
  const checksums = [];

  await forEachLimit(checksumAssets, 4, async (asset) => {
    try {
      const parsed = parseMd5(await getText(asset.url));
      if (parsed) checksums.push({ md5: parsed.md5, filename: parsed.filename });
    } catch (error) {
      warn(
        `Could not read checksum ${asset.name}: ` +
          `${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  for (const checksum of checksums) {
    if (!checksum.filename) continue;
    const image = release.assets.find((asset) => asset.name === checksum.filename);
    if (image) image.md5 = checksum.md5;
  }
}

/**
 * Read and validate the release manifest, then attach its metadata to the
 * matching assets. Validation is all-or-nothing so a broken manifest never
 * leaves partially trusted checksums in the snapshot.
 *
 * @returns {Promise<{status: 'valid' | 'invalid' | 'none', manifest?: object}>}
 */
async function applyFirmwareManifest(release) {
  const manifestAsset = release.assets.find((asset) => asset.name === FIRMWARE_MANIFEST_NAME);
  if (!manifestAsset) return { status: 'none' };

  try {
    const raw = parseFirmwareManifest(await getText(manifestAsset.url));
    const manifest = validateFirmwareManifest(raw, {
      repository: release.repository,
      tag: release.tag,
      branch: release.branch,
      assets: release.assets,
    });

    for (const image of manifest.images) {
      const asset = release.assets.find((candidate) => candidate.name === image.file);
      if (!asset) continue;

      const digest = asset.sha256;
      asset.md5 = image.md5;
      asset.model = image.model;
      asset.variant = image.variant;

      if (digest && digest !== image.sha256) {
        warn(
          `SHA-256 mismatch for ${release.tag}/${image.file}: manifest ${image.sha256} ` +
            `does not match the GitHub asset digest ${digest}; dropping SHA-256.`,
        );
        delete asset.sha256;
      } else {
        asset.sha256 = image.sha256;
      }
    }

    return { status: 'valid', manifest };
  } catch (error) {
    warn(
      `Firmware manifest for ${release.tag} (${release.repository}) is invalid: ` +
        `${error instanceof Error ? error.message : String(error)}. Using the .md5 fallback.`,
    );
    return { status: 'invalid' };
  }
}

/** Newest stable and pre-release per current branch: enough for model cards. */
function releasesForChecksums(releases) {
  const selected = new Set();

  for (const branch of CURRENT_BRANCHES) {
    const branchReleases = releases.filter((release) => release.branch === branch);
    const stable = branchReleases.find((release) => !release.prerelease);
    const prerelease = branchReleases.find((release) => release.prerelease);
    if (stable) selected.add(stable);
    if (prerelease) selected.add(prerelease);
  }

  return [...selected];
}

/** Run a bounded number of downloads at once so a large history is polite. */
async function forEachLimit(items, limit, worker) {
  for (let index = 0; index < items.length; index += limit) {
    await Promise.all(items.slice(index, index + limit).map(worker));
  }
}

function summarizeReleases(releases) {
  const releaseDownloads = releases.reduce(
    (total, release) =>
      total + release.assets.reduce((sum, asset) => sum + (asset.downloadCount ?? 0), 0),
    0,
  );

  const firstRelease = releases.reduce((oldest, release) => {
    const date = release.publishedAt;
    if (!date) return oldest;
    return !oldest || date < oldest ? date : oldest;
  }, null);

  return { releases: releases.length, releaseDownloads, firstRelease };
}

async function writeJson(output, value) {
  const temporary = `${output}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, output);
}

function manifestSummary(manifest) {
  const models = new Set(manifest.images.map((image) => image.model));
  return { models: models.size, variants: manifest.images.length };
}

function latestFor(releases, branch, prerelease) {
  return releases.find(
    (release) => release.branch === branch && release.prerelease === prerelease,
  );
}

function buildRunSummary({
  allReleases,
  manifestStatus,
  manifests,
  legacyFallbacks,
  stats,
}) {
  const current = allReleases.filter((release) => release.branch !== 'legacy');
  const legacy = allReleases.length - current.length;
  const statusCount = (status) =>
    [...manifestStatus.values()].filter((value) => value === status).length;
  const trigger = FIRMWARE_TAG
    ? `\`repository_dispatch\` for \`${FIRMWARE_TAG}\`` +
      (FIRMWARE_REPOSITORY ? ` from \`${FIRMWARE_REPOSITORY}\`` : '')
    : 'scheduled/manual refresh';
  const lines = [
    '## Firmware snapshot refresh',
    '',
    `**Trigger:** ${trigger}`,
    '',
    `- Releases: **${allReleases.length}** (${current.length} current, ${legacy} legacy)`,
    `- Release downloads: **${stats.releaseDownloads.toLocaleString('en')}** across both repositories`,
    `- Manifests: **${statusCount('valid')}** valid, **${statusCount('invalid')}** invalid, ` +
      `**${statusCount('none')}** not published`,
    `- Legacy \`.md5\` fallbacks: **${legacyFallbacks}** selected releases`,
  ];

  const manifestModels = new Set();
  for (const manifest of manifests.values()) {
    for (const image of manifest.images) manifestModels.add(image.model);
  }
  if (manifestModels.size > 0) {
    lines.push(`- Models resolved from manifests: **${manifestModels.size}**`);
  }

  if (FIRMWARE_TAG) {
    lines.push(
      `- Dispatch tag in snapshot: **${allReleases.some((release) => release.tag === FIRMWARE_TAG) ? 'yes' : 'no'}**`,
    );
  }

  lines.push(
    '',
    '### Latest releases',
    '',
    '| Branch | Channel | Tag | Manifest | Models | Variants |',
    '| --- | --- | --- | --- | --- | --- |',
  );

  for (const branch of ['3006', '3004', '386']) {
    for (const [channel, prerelease] of [
      ['stable', false],
      ['pre-release', true],
    ]) {
      const release = latestFor(allReleases, branch, prerelease);
      if (!release) {
        lines.push(`| ${branch} | ${channel} | — | — | — | — |`);
        continue;
      }

      const status = manifestStatus.get(release) ?? 'none';
      const manifest = manifests.get(release);
      const counts = manifest ? manifestSummary(manifest) : { models: '—', variants: '—' };
      lines.push(
        `| ${branch} | ${channel} | \`${release.tag}\` | ${status} | ` +
          `${counts.models} | ${counts.variants} |`,
      );
    }
  }

  if (warnings.length > 0) {
    lines.push('', '### Warnings', '');
    for (const warning of warnings.slice(0, 10)) lines.push(`- ${warning}`);
    if (warnings.length > 10) lines.push(`- …and ${warnings.length - 10} more`);
  }

  return `${lines.join('\n')}\n`;
}

async function writeStepSummary(markdown) {
  if (!STEP_SUMMARY) return;

  try {
    await appendFile(STEP_SUMMARY, markdown);
  } catch (error) {
    console.warn(
      '::warning::Could not write the workflow step summary: ' +
        `${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function main() {
  try {
    const [repository, mainReleases, wifi7Releases] = await Promise.all([
      fetchRepository(),
      fetchAllReleases(REPOSITORY),
      fetchAllReleases(WIFI7_REPOSITORY),
    ]);
    const allReleases = collectReleases({
      [REPOSITORY]: mainReleases,
      [WIFI7_REPOSITORY]: wifi7Releases,
    });
    const currentLineReleases = allReleases.filter(
      (release) => release.branch !== 'legacy',
    );

    // Manifests are checked for every current-line release, not just the latest
    // one, so an older release keeps its verified metadata in the changelog
    // snapshot. Releases without a manifest stay on the legacy path.
    const manifestStatus = new Map();
    const manifests = new Map();
    await forEachLimit(currentLineReleases, 8, async (release) => {
      const result = await applyFirmwareManifest(release);
      manifestStatus.set(release, result.status);
      if (result.manifest) manifests.set(release, result.manifest);
    });

    // Legacy fallback only for the selected card releases, and only when their
    // manifest was absent or invalid. A valid manifest already carries MD5.
    const legacyReleases = releasesForChecksums(allReleases).filter(
      (release) => manifestStatus.get(release) !== 'valid',
    );
    await forEachLimit(legacyReleases, 2, addChecksums);

    if (FIRMWARE_TAG && !allReleases.some((release) => release.tag === FIRMWARE_TAG)) {
      warn(
        `Firmware release ${FIRMWARE_TAG}` +
          (FIRMWARE_REPOSITORY ? ` from ${FIRMWARE_REPOSITORY}` : '') +
          ' is not in the refreshed snapshot yet. The GitHub API may not have caught up; ' +
          'the next scheduled refresh will retry.',
      );
    }

    const latestStable = currentLineReleases.find((release) => !release.prerelease) ?? null;
    const generatedAt = new Date().toISOString();
    const summary = summarizeReleases(allReleases);

    const stats = {
      generatedAt,
      repository: REPOSITORY,
      ...summary,
      ...repository,
      // Count the deduplicated changelog set so the home-page tile and
      // /changelog stay in agreement when a release exists in only one repo.
      releases: allReleases.length,
      latestRelease: latestStable
        ? {
            tag: latestStable.tag,
            name: latestStable.name,
            url: latestStable.url,
            publishedAt: latestStable.publishedAt,
            repository: latestStable.repository,
            branch: latestStable.branch,
          }
        : null,
    };

    const releases = {
      generatedAt,
      repository: REPOSITORY,
      releases: allReleases,
    };

    await Promise.all([
      writeJson(STATS_OUTPUT, stats),
      writeJson(RELEASES_OUTPUT, releases),
    ]);

    await writeStepSummary(
      buildRunSummary({
        allReleases,
        manifestStatus,
        manifests,
        legacyFallbacks: legacyReleases.length,
        stats,
      }),
    );

    console.log(
      `GitHub stats: ${stats.releaseDownloads.toLocaleString('en')} release downloads, ` +
        `${stats.releases} releases, ${stats.stars.toLocaleString('en')} stars, ` +
        `${stats.forks} forks.`,
    );
    console.log(
      `Changelog: ${allReleases.length} releases ` +
        `(${currentLineReleases.length} current, ${allReleases.length - currentLineReleases.length} legacy).`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      '::warning::Could not refresh GitHub data; keeping the previous snapshots. ' + message,
    );
    await writeStepSummary(
      `## Firmware snapshot refresh\n\n` +
        `⚠️ Refresh failed; the previous snapshots were kept.\n\n` +
        `\`${message}\`\n`,
    );
  }
}

await main();
