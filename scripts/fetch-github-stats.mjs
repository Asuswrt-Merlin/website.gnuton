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
 */
import { rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

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

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'gnuton-website-stats',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

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

function summarizeReleases(releases) {
  const releaseDownloads = releases.reduce(
    (total, release) =>
      total + release.assets.reduce((sum, asset) => sum + (asset.download_count ?? 0), 0),
    0,
  );

  const firstRelease = releases.reduce((oldest, release) => {
    const date = release.published_at ?? release.created_at;
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
    const latestStable = currentLineReleases.find((release) => !release.prerelease) ?? null;
    const generatedAt = new Date().toISOString();
    const summary = summarizeReleases(mainReleases);

    const stats = {
      generatedAt,
      repository: REPOSITORY,
      ...summary,
      ...repository,
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
    console.warn(
      '::warning::Could not refresh GitHub data; keeping the previous snapshots. ' +
        `${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

await main();
