/**
 * Global site metadata and navigation.
 * All links point at the real project resources so the site stays a thin,
 * honest layer over the GitHub repository.
 */
const repo3004Url = 'https://github.com/Asuswrt-Merlin/asuswrt-merlin.ng-3004.gnuton';
const repo3006Url = 'https://github.com/Asuswrt-Merlin/asuswrt-merlin.ng-3006.gnuton';
const repo386Url = `${repo3004Url}/tree/386.12_0-gnuton1`;

const issueTemplate = (repo: string, template: string, label: string) =>
  `${repo}/issues/new?assignees=&labels=${label}&template=${template}`;

const bugReport = (repo: string) => issueTemplate(repo, 'bug_report.md', 'bug');
const featureRequest = (repo: string) =>
  issueTemplate(repo, 'feature_request.md', 'enhancement');

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
  repo: 'https://github.com/Asuswrt-Merlin/asuswrt-merlin.ng-3004.gnuton',
  repoLabel: 'Asuswrt-Merlin/asuswrt-merlin.ng-3004.gnuton',
  // The 3004 line.
  repo3004: repo3004Url,
  repo3006: repo3006Url,
  // 386 code lives in the 3004 repository; pin to the latest stable 386 tag.
  repo386: repo386Url,
  releases: 'https://github.com/Asuswrt-Merlin/asuswrt-merlin.ng-3004.gnuton/releases',
  docs: 'https://github.com/RMerl/asuswrt-merlin.ng/wiki/About-Asuswrt',
  devDocs: 'https://github.com/Asuswrt-Merlin/asuswrt-merlin.ng-3004.gnuton/blob/master/www/DEV.md',
  issues: `${repo3004Url}/issues`,
  // Each firmware line has its own issue tracker after the repository split:
  // 3006 builds in the WiFi 7 repository, 3004 and 386 builds in the 3004 one.
  bugReport3004: bugReport(repo3004Url),
  bugReport3006: bugReport(repo3006Url),
  featureRequest3004: featureRequest(repo3004Url),
  featureRequest3006: featureRequest(repo3006Url),
  forum:
    'https://www.snbforums.com/threads/gnutons-merlin-builds-for-dsl-router-386-1_2-released.70980/',
  discord: 'https://discord.gg/pm7q6KFSzp',
  mastodon: 'https://retro.pizza/@gnuton',
  asus: 'https://www.asus.com/',
  template: 'https://github.com/Domenico-Tenace-Open-Labs/astro-wellness',
} as const;

export interface NavLink {
  label: string;
  href: string;
}

export interface NavItem extends NavLink {
  /** External project resources open in a new tab. */
  external?: boolean;
  /** Optional submenu, e.g. the per-generation source repositories. */
  children?: NavLink[];
}

export const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Downloads', href: '/firmware' },
  { label: 'About', href: '/about' },
  { label: 'Guides', href: '/guides' },
  { label: 'Help', href: '/support' },
  {
    label: 'Code',
    href: site.repo3004,
    external: true,
    children: [
      { label: '3006 · WiFi 7', href: site.repo3006 },
      { label: '3004 · WiFi 6', href: site.repo3004 },
      { label: '386 · DSL-AC68U', href: site.repo386 },
    ],
  },
];

export const projectLinks = [
  { label: 'Latest releases', href: site.releases },
  { label: 'Source code', href: site.repo },
  { label: 'Report a bug', href: '/support/#report-a-bug' },
  { label: 'Upstream Merlin', href: site.upstream },
];

export const communityLinks = [
  { label: 'Discord chat', href: site.discord },
  { label: 'SNBForums thread', href: site.forum },
  { label: 'Mastodon', href: site.mastodon },
  { label: 'Developer notes', href: site.devDocs },
];
