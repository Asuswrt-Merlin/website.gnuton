/**
 * GitHub community statistics shown on the home page.
 *
 * `github-stats.json` is refreshed by scripts/fetch-github-stats.mjs. The
 * committed file is the offline fallback, so builds never depend on the API.
 */
import snapshot from './github-stats.json';

export interface LatestRelease {
  tag: string;
  name: string;
  url: string;
  publishedAt: string;
  repository: string;
  /** Firmware line derived from the tag, e.g. "3006". */
  branch: '3006' | '3004' | '386' | null;
}

export interface GitHubStats {
  generatedAt: string;
  repository: string;
  releases: number;
  releaseDownloads: number;
  stars: number;
  forks: number;
  firstRelease: string | null;
  latestRelease: LatestRelease | null;
}

const isBranch = (value: string): value is '3006' | '3004' | '386' =>
  value === '3006' || value === '3004' || value === '386';

// JSON imports type every string as `string`; narrow the tag-derived branch.
export const githubStats: GitHubStats = {
  ...snapshot,
  latestRelease: snapshot.latestRelease
    ? {
        ...snapshot.latestRelease,
        branch: isBranch(snapshot.latestRelease.branch)
          ? snapshot.latestRelease.branch
          : null,
      }
    : null,
};
