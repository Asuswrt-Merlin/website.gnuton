/**
 * GitHub community statistics shown on the home page.
 *
 * `github-stats.json` is refreshed by scripts/fetch-github-stats.mjs. The
 * committed file is the offline fallback, so builds never depend on the API.
 */
import snapshot from './github-stats.json';

export interface GitHubStats {
  generatedAt: string;
  repository: string;
  releases: number;
  releaseDownloads: number;
  stars: number;
  forks: number;
}

export const githubStats: GitHubStats = snapshot;
