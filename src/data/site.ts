/**
 * Global site metadata and navigation.
 * All links point at the real project resources so the site stays a thin,
 * honest layer over the GitHub repository.
 */
export const site = {
  name: "GNUton's Merlin Builds",
  shortName: 'GNUton',
  tagline: 'Merlin firmware for more ASUS routers.',
  description:
    "GNUton's builds extend Asuswrt-Merlin to more ASUS routers. WiFi 7, WiFi 6 and WiFi 5 firmware, supported by ASUS and RMerlin, built in the cloud with a public build pipeline.",
  // Fallback for local builds. The GitHub Pages workflow injects the real URL.
  url: 'https://asuswrt-merlin.github.io',
  author: 'GNUton',

  upstream: 'https://github.com/RMerl/asuswrt-merlin.ng',
  repo: 'https://github.com/gnuton/asuswrt-merlin.ng',
  repoLabel: 'gnuton/asuswrt-merlin.ng',
  releases: 'https://github.com/gnuton/asuswrt-merlin.ng/releases',
  docs: 'https://github.com/RMerl/asuswrt-merlin.ng/wiki/About-Asuswrt',
  devDocs: 'https://github.com/gnuton/asuswrt-merlin.ng/blob/master/www/DEV.md',
  issues: 'https://github.com/gnuton/asuswrt-merlin.ng/issues',
  bugReport:
    'https://github.com/gnuton/asuswrt-merlin.ng/issues/new?assignees=&labels=bug&template=bug_report.md',
  featureRequest:
    'https://github.com/gnuton/asuswrt-merlin.ng/issues/new?assignees=&labels=enhancement&template=feature_request.md',
  forum:
    'https://www.snbforums.com/threads/gnutons-merlin-builds-for-dsl-router-386-1_2-released.70980/',
  discord: 'https://discord.gg/pm7q6KFSzp',
  mastodon: 'https://retro.pizza/@gnuton',
  asus: 'https://www.asus.com/',
  template: 'https://github.com/Domenico-Tenace-Open-Labs/astro-wellness',
} as const;

export interface NavItem {
  label: string;
  href: string;
  /** External project resources open in a new tab. */
  external?: boolean;
}

export const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Downloads', href: '/firmware' },
  { label: 'About', href: '/about' },
  { label: 'Guides', href: '/guides' },
  { label: 'Help', href: '/support' },
  { label: 'Code', href: site.repo, external: true },
];

export const projectLinks = [
  { label: 'Latest releases', href: site.releases },
  { label: 'Source code', href: site.repo },
  { label: 'Report a bug', href: site.bugReport },
  { label: 'Upstream Merlin', href: site.upstream },
];

export const communityLinks = [
  { label: 'Discord chat', href: site.discord },
  { label: 'SNBForums thread', href: site.forum },
  { label: 'Mastodon', href: site.mastodon },
  { label: 'Developer notes', href: site.devDocs },
];
