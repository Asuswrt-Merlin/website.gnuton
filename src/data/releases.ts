/**
 * Firmware release history for the changelog.
 *
 * `github-releases.json` is refreshed by scripts/fetch-github-stats.mjs. The
 * committed snapshot keeps the site build offline-friendly, exactly like the
 * GitHub stats file. Current firmware lines get their own URL segment
 * (`/changelog/3004/<tag>/`); older 384/388 builds are grouped as `legacy`.
 */
import snapshot from './github-releases.json';

export type ChangelogBranch = '3006' | '3004' | '386' | 'legacy';

export interface ChangelogRelease {
  tag: string;
  name: string;
  /** GitHub release page, used for assets, checksums and build logs. */
  url: string;
  publishedAt: string;
  repository: string;
  branch: ChangelogBranch;
  prerelease: boolean;
  body: string;
}

const isChangelogBranch = (value: string): value is ChangelogBranch =>
  value === '3006' || value === '3004' || value === '386' || value === 'legacy';

const normalizeRelease = (
  release: (typeof snapshot.releases)[number],
): ChangelogRelease => ({
  tag: release.tag,
  name: release.name,
  url: release.url,
  publishedAt: release.publishedAt,
  repository: release.repository,
  branch: isChangelogBranch(release.branch) ? release.branch : 'legacy',
  prerelease: release.prerelease,
  body: release.body,
});

export const changelogReleases: ChangelogRelease[] = snapshot.releases
  .map(normalizeRelease)
  .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

export const changelogReleasesFor = (branch: ChangelogBranch): ChangelogRelease[] =>
  changelogReleases.filter((release) => release.branch === branch);

export const findChangelogRelease = (tag: string): ChangelogRelease | undefined =>
  changelogReleases.find((release) => release.tag === tag);

export const changelogPath = (
  release: Pick<ChangelogRelease, 'branch' | 'tag'>,
): string => `/changelog/${release.branch}/${release.tag}/`;

/** Keep the descending release order while grouping entries by year. */
export const groupReleasesByYear = (
  releases: ChangelogRelease[],
): Array<[number, ChangelogRelease[]]> => {
  const byYear = new Map<number, ChangelogRelease[]>();

  for (const release of releases) {
    const year = new Date(release.publishedAt).getUTCFullYear();
    const group = byYear.get(year);

    if (group) {
      group.push(release);
    } else {
      byYear.set(year, [release]);
    }
  }

  return [...byYear.entries()];
};

/**
 * GitHub release bodies start with their own changelog heading and a
 * Date/Release block. The page header already carries that metadata, so drop
 * the duplicate preamble before rendering the notes.
 */
const CHANGELOG_HEADING =
  /^[ \t]*#+[ \t]*GNUton'?s Asus Merlin changelog[ \t]*#*[ \t]*(?:\r?\n)+/i;
// Some releases put warnings or tester notes before the metadata block, so
// remove the Date/Release lines wherever they appear in the body.
const CHANGELOG_DATE = /^[ \t]*Date:[^\r\n]*(?:\r?\n)?/gim;
const CHANGELOG_RELEASE = /^[ \t]*Release:[^\r\n]*(?:\r?\n)?/gim;

/** Remove the indentation shared by every line, preserving nested Markdown. */
function dedent(text: string): string {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const margins = lines
    .filter((line) => line.trim() !== '')
    .map((line) => line.match(/^[ \t]*/)?.[0].length ?? 0);
  const margin = margins.length > 0 ? Math.min(...margins) : 0;

  return lines
    .map((line) => line.slice(margin))
    .join('\n')
    .trim();
}

export function releaseNotesBody(release: ChangelogRelease): string {
  const notes = release.body
    .trimStart()
    .replace(CHANGELOG_HEADING, '')
    .replace(CHANGELOG_DATE, '')
    .replace(CHANGELOG_RELEASE, '');

  return dedent(notes);
}
