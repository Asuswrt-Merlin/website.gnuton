#!/usr/bin/env node
/**
 * Refresh the GitHub stats snapshot used by the home page.
 *
 * The public GitHub REST API needs no dependencies and no token for a handful
 * of requests; CI supplies GITHUB_TOKEN so the build is not limited by the
 * anonymous rate limit. If a request fails, the committed snapshot is left
 * untouched and the build continues with the previous numbers.
 *
 * Counts every release asset (firmware images, checksums, build logs and
 * changelogs), matching the "release downloads" label on the page.
 */
import { rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const REPOSITORY = 'Asuswrt-Merlin/asuswrt-merlin.ng-gnuton';
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

async function main() {
  try {
    const [repository, releases] = await Promise.all([fetchRepository(), fetchReleases()]);
    const snapshot = {
      generatedAt: new Date().toISOString(),
      repository: REPOSITORY,
      ...releases,
      ...repository,
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
