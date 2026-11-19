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
      'Images are compiled in the cloud from public code, so you can trace a release back to its source, its changes and its CI run.',
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
      'GitHub Actions compiles and publishes the images, keeping every release reproducible from public source.',
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
    title: 'Pick the matching branch',
    description:
      'WiFi 7 uses 3006, WiFi 6 uses 3004, and the DSL-AC68U uses 386. Never flash a build from a different branch.',
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
      'Recommended for everyday use. Promoted from beta once the branch has had real-world testing.',
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
      'One-off branches that explore extra functionality, such as Repeater Mode on the 386 DSL build.',
    href: 'https://github.com/gnuton/asuswrt-merlin.ng/releases/tag/gnuton-snapshot-feature-repeater',
    cta: 'Browse experimental builds',
  },
];

export interface HelpOption {
  title: string;
  description: string;
  href: string;
  label: string;
}

export const helpOptions: HelpOption[] = [
  {
    title: 'Report a firmware bug',
    description:
      'Open an issue with your router model, hardware revision, firmware version and clear reproduction steps.',
    href: site.bugReport,
    label: 'Use the bug report form',
  },
  {
    title: 'Request a feature',
    description:
      'Have an idea that fits the upstream Merlin feature set? Start a feature request so it can be discussed.',
    href: site.featureRequest,
    label: 'Request a feature',
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
    href: site.bugReport,
    label: 'Open an issue',
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
