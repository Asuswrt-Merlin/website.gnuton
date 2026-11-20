/**
 * Resolve the best downloadable firmware image for each supported router.
 *
 * The release snapshot stores every asset from both GitHub repositories. Cards
 * show the newest stable release that actually contains an image for the
 * model; a pre-release is used only when no stable image exists yet, so the
 * default download never silently switches to a beta build.
 *
 * MD5 values are refreshed for the newest stable and pre-release of each
 * branch. If a model falls back to an older release, its dialog still links the
 * image and GitHub release but reports that the checksum is not in the snapshot.
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

export interface RouterFirmware {
  router: RouterModel;
  branch: FirmwareBranch;
  release: ChangelogRelease;
  asset: FirmwareAsset;
  notesHtml: string;
}

const IMAGE_ASSET = /\.(pkgtb|w|trx|bin|img|chk)$/i;

const matchesAsset = (asset: FirmwareAsset, router: RouterModel): boolean =>
  IMAGE_ASSET.test(asset.name) &&
  asset.name.startsWith(router.assetPrefix) &&
  !(router.assetExclude ?? []).some((fragment) => asset.name.includes(fragment));

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
      asset: release.assets.find((asset) => matchesAsset(asset, router)),
    }))
    .filter(
      (
        candidate,
      ): candidate is { release: ChangelogRelease; asset: FirmwareAsset } =>
        candidate.asset !== undefined,
    );

  const selected =
    candidates.find(({ release }) => !release.prerelease) ??
    candidates.find(({ release }) => release.prerelease);

  if (!selected) return null;

  return {
    router,
    branch: branchById(router.branch),
    release: selected.release,
    asset: selected.asset,
    notesHtml: notesFor(selected.release),
  };
}

export const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};
