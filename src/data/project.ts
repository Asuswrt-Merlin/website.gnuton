import { branchById } from './routers';
import { site } from './site';

export interface Value {
  title: string;
  description: string;
}

export const values: Value[] = [
  {
    title: 'Upstream first',
    description:
      'Every build starts from the official Asuswrt-Merlin source. GNUton adds model support, not a parallel feature set — if it is in Merlin, it should be here.',
  },
  {
    title: 'Transparent builds',
    description:
      'Images are compiled in the cloud through a public build pipeline. Some vendor components supplied by ASUS remain prebuilt, but releases stay traceable to their build run and source history.',
  },
  {
    title: 'Community tested',
    description:
      'Beta builds go out to testers before they become stable. Bug reports, forum threads and chat feedback are part of the release process.',
  },
];

export interface Credit {
  name: string;
  role: string;
  description: string;
  initials: string;
  href: string;
}

export const credits: Credit[] = [
  {
    name: 'ASUS',
    role: 'Hardware & GPL sources',
    description:
      'ASUS provides the GPL source releases and hardware samples that make builds for additional models possible.',
    initials: 'AS',
    href: site.asus,
  },
  {
    name: 'Asuswrt-Merlin',
    role: 'Upstream project',
    description:
      'The upstream Merlin developers maintain the firmware foundation, features and documentation this fork builds on.',
    initials: 'RM',
    href: site.upstream,
  },
  {
    name: 'GitHub',
    role: 'Cloud build infrastructure',
    description:
      'GitHub Actions compiles and publishes the images, keeping every release traceable to its build run and source history.',
    initials: 'GH',
    href: 'https://github.com',
  },
  {
    name: 'CircleCI',
    role: 'CI infrastructure',
    description:
      'CircleCI provided powerful CI infrastructure for the project and is still part of its build history.',
    initials: 'CI',
    href: 'https://circleci.com/',
  },
  {
    name: 'The community',
    role: 'Testing & support',
    description:
      'Forum members, Discord regulars and everyone who files a clear bug report or tests a beta build.',
    initials: 'CO',
    href: site.discord,
  },
];

export interface Step {
  title: string;
  description: string;
  linkLabel?: string;
  linkHref?: string;
}

export const setupSteps: Step[] = [
  {
    title: 'Identify your hardware',
    description:
      'Connect over SSH and run nvram get productid. Note the exact model and hardware revision — v1 and v2 can need different files.',
    linkLabel: 'How to check your version',
    linkHref: '/guides/which-router-version-do-i-have/',
  },
  {
    title: 'Pick the matching firmware',
    description:
      'Choose the WiFi generation that matches your router: WiFi 7, WiFi 6 or WiFi 5 for the DSL-AC68U. Never flash a build made for different hardware.',
    linkLabel: 'Browse supported models',
    linkHref: '/firmware',
  },
  {
    title: 'Download and flash',
    description:
      'Read the release notes, download from GitHub, and update through the ASUS web interface. Keep a known-good firmware and your settings backup nearby.',
    linkLabel: 'Open the flashing guide',
    linkHref: '/guides/how-to-flash-gnuton-firmware/',
  },
];

export interface ReleaseChannel {
  name: string;
  description: string;
  href: string;
  cta: string;
  highlighted?: boolean;
}

export const releaseChannels: ReleaseChannel[] = [
  {
    name: 'Stable',
    description:
      'Recommended for everyday use. Promoted from beta once the build has had real-world testing.',
    href: `${site.releases}?q=prerelease%3Afalse`,
    cta: 'Browse stable builds',
    highlighted: true,
  },
  {
    name: 'Pre-release',
    description:
      'For advanced users and testing new features. Read the release notes before flashing a beta.',
    href: `${site.releases}?q=prerelease%3Atrue`,
    cta: 'Browse pre-releases',
  },
  {
    name: 'Experimental',
    description:
      'One-off builds that explore extra functionality, such as Repeater Mode on the WiFi 5 DSL model.',
    href: 'https://github.com/gnuton/asuswrt-merlin.ng/releases/tag/gnuton-snapshot-feature-repeater',
    cta: 'Browse experimental builds',
  },
];

export interface HelpLink {
  label: string;
  href: string;
}

export interface HelpOption {
  id?: string;
  title: string;
  description: string;
  href?: string;
  label?: string;
  /** Several destinations, e.g. one issue tracker per firmware line. */
  links?: HelpLink[];
}

const wifi7 = branchById('3006');
const wifi65 = branchById('3004');

export const helpOptions: HelpOption[] = [
  {
    id: 'report-a-bug',
    title: 'Report a firmware bug',
    description:
      'WiFi 7 builds are tracked in the 3006 repository; WiFi 6 and WiFi 5 builds share the 3004 repository. Open the form for your firmware line so the report reaches the right maintainers.',
    links: [
      { label: 'WiFi 7 · 3006 repository', href: wifi7.issueUrl },
      { label: 'WiFi 6 / WiFi 5 · 3004 repository', href: wifi65.issueUrl },
    ],
  },
  {
    id: 'request-a-feature',
    title: 'Request a feature',
    description:
      'Have an idea that fits the upstream Merlin feature set? Start a feature request in the repository for your firmware line so it can be discussed.',
    links: [
      { label: 'WiFi 7 · 3006 repository', href: wifi7.featureRequestUrl },
      { label: 'WiFi 6 / WiFi 5 · 3004 repository', href: wifi65.featureRequestUrl },
    ],
  },
  {
    title: 'Ask in Discord',
    description:
      'Quick questions, beta feedback and day-to-day troubleshooting with other GNUton build users.',
    href: site.discord,
    label: 'Join the Discord',
  },
  {
    title: 'SNBForums thread',
    description:
      'The long-running support thread for release announcements and detailed community troubleshooting.',
    href: site.forum,
    label: 'Open the forum thread',
  },
  {
    title: 'Upstream documentation',
    description:
      'Merlin’s own wiki explains the shared feature set, configuration and router administration.',
    href: site.docs,
    label: 'Read the Merlin wiki',
  },
  {
    title: 'Build from source',
    description:
      'Developer notes for anyone who wants to compile the firmware, add a model or send a patch.',
    href: site.devDocs,
    label: 'Read the developer notes',
  },
];

export const beforeYouPost = [
  'Your exact model and hardware version (v1, v2, …).',
  'The firmware version from the router’s web interface.',
  'What you expected to happen and what happened instead.',
  'The steps that reproduce the problem, with logs or screenshots where useful.',
  'Whether you are on the stable, pre-release or an experimental build.',
];

export interface HelpWay {
  title: string;
  description: string;
  href: string;
  label: string;
}

export const helpWays: HelpWay[] = [
  {
    title: 'Star the project',
    description: 'A star helps other ASUS owners find the builds.',
    href: site.repo,
    label: 'Star on GitHub',
  },
  {
    title: 'Report bugs',
    description: 'Clear reports make the next release better for everyone.',
    href: '/support/#report-a-bug',
    label: 'Choose your repository',
  },
  {
    title: 'Send code',
    description: 'Patches, model support and build fixes are welcome.',
    href: site.devDocs,
    label: 'Read the dev notes',
  },
  {
    title: 'Help the community',
    description: 'Answer questions in Discord or on the support thread.',
    href: site.discord,
    label: 'Join the chat',
  },
];
