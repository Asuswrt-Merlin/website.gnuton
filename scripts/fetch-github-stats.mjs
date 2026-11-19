#!/usr/bin/env node
/**
 * Refresh the GitHub stats snapshot used by the home page and the release
 * banner.
 *
 * The public GitHub REST API needs no dependencies and no token for a handful
 * of requests; CI supplies GITHUB_TOKEN so the build is not limited by the
 * anonymous rate limit. If a request fails, the committed snapshot is left
 * untouched and the build continues with the previous numbers.
 *
 * Counts every release asset (firmware images, checksums, build logs and
 * changelogs), matching the "release downloads" label on the page. The latest
 * stable release is picked from the repository that owns its firmware line
 * after the 3006/3004 split.
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
const OUTPUT = fileURLToPath(new URL('../src/data/github-stats.json', import.meta.url));
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

async function fetchReleases() {
  const releases = [];

  for (let page = 1; ; page += 1) {
    const batch = await getJson(
      `https://api.github.com/repos/${REPOSITORY}/releases?per_page=100&page=${page}`,
    );
    releases.push(...batch);

    if (batch.length < 100) break;
  }

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

async function fetchLatestRelease() {
  const repositories = [...new Set(Object.values(REPOSITORY_BY_BRANCH))];
  const candidates = [];

  for (const repository of repositories) {
    const releases = await getJson(
      `https://api.github.com/repos/${repository}/releases?per_page=100`,
    );

    for (const release of releases) {
      if (release.draft || release.prerelease || !release.published_at) continue;

      const branch = release.tag_name.match(/^(3006|3004|386)[._]/)?.[1];
      if (!branch || REPOSITORY_BY_BRANCH[branch] !== repository) continue;

      candidates.push({
        tag: release.tag_name,
        name: release.name || release.tag_name,
        url: release.html_url,
        publishedAt: release.published_at,
        repository,
        branch,
      });
    }
  }

  candidates.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  return candidates[0] ?? null;
}

async function main() {
  try {
    const [repository, releases, latestRelease] = await Promise.all([
      fetchRepository(),
      fetchReleases(),
      fetchLatestRelease(),
    ]);
    const snapshot = {
      generatedAt: new Date().toISOString(),
      repository: REPOSITORY,
      ...releases,
      ...repository,
      latestRelease,
    };

    const temporary = `${OUTPUT}.tmp`;
    await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`);
    await rename(temporary, OUTPUT);

    console.log(
      `GitHub stats: ${snapshot.releaseDownloads.toLocaleString('en')} release downloads, ` +
        `${snapshot.releases} releases, ${snapshot.stars.toLocaleString('en')} stars, ` +
        `${snapshot.forks} forks.`,
    );
  } catch (error) {
    console.warn(
      '::warning::Could not refresh GitHub stats; keeping the previous snapshot. ' +
        `${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

await main();
