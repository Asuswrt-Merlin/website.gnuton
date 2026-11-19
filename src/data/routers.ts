/**
 * Supported routers and firmware branches.
 *
 * This is the single source of truth for the model grid, the home-page
 * counters, and the downloads page. Keep it in sync with the upstream README:
 * https://github.com/Asuswrt-Merlin/asuswrt-merlin.ng-3004.gnuton/blob/master/README.md
 *
 * Adding a model? Use the "add-router-model" skill in .opencode/skills.
 */
import { site } from './site';

export type BranchId = '3006' | '3004' | '386';

export interface FirmwareBranch {
  /** Anchor used on /firmware and in navigation links. */
  id: 'wifi-7' | 'wifi-6' | 'wifi-5';
  version: BranchId;
  name: string;
  description: string;
  stableUrl: string;
  prereleaseUrl: string;
  /** Issue tracker for this firmware line (3006 and 3004 are separate repos). */
  issueUrl: string;
  featureRequestUrl: string;
  experimental?: {
    label: string;
    description: string;
    url: string;
  };
}

export interface RouterModel {
  id: string;
  /** Primary model name shown on the card. */
  name: string;
  /** Other commercial names for the same hardware. */
  aliases?: string[];
  branch: BranchId;
  image: string;
  asusUrl: string;
  /** Short badge, e.g. "New". */
  badge?: string;
  featured?: boolean;
}

const releaseQuery = (filter: string, prerelease: boolean) =>
  `${site.releases}?q=${filter}+prerelease%3A${prerelease}`;

export const firmwareBranches: FirmwareBranch[] = [
  {
    id: 'wifi-7',
    version: '3006',
    name: 'WiFi 7',
    description:
      'The newest Merlin line for ASUS WiFi 7 hardware. Same upstream feature set, including the flagship ROG router.',
    stableUrl: releaseQuery('3006*', false),
    prereleaseUrl: releaseQuery('3006*', true),
    issueUrl: site.bugReport3006,
    featureRequestUrl: site.featureRequest3006,
  },
  {
    id: 'wifi-6',
    version: '3004',
    name: 'WiFi 6',
    description:
      'The main GNUton line: WiFi 6 routers, mesh systems and DSL gateways. Most supported models live here.',
    stableUrl: releaseQuery('3004*', false),
    prereleaseUrl: releaseQuery('3004*', true),
    issueUrl: site.bugReport3004,
    featureRequestUrl: site.featureRequest3004,
  },
  {
    id: 'wifi-5',
    version: '386',
    name: 'WiFi 5',
    description:
      'The long-lived build for the DSL-AC68U, including the optional experimental Repeater Mode images.',
    stableUrl: releaseQuery('386', false),
    prereleaseUrl: releaseQuery('386', true),
    issueUrl: site.bugReport3004,
    featureRequestUrl: site.featureRequest3004,
    experimental: {
      label: 'Repeater Mode',
      description:
        'Experimental WiFi 5 builds that expose Repeater alongside the standard operational modes. AiMesh on regular images remains faster where both ends are ASUS routers.',
      url: 'https://github.com/Asuswrt-Merlin/asuswrt-merlin.ng-3004.gnuton/releases/tag/gnuton-snapshot-feature-repeater',
    },
  },
];

export const routers: RouterModel[] = [
  {
    id: 'gt-be98',
    name: 'GT-BE98',
    aliases: ['GT-BE25000'],
    branch: '3006',
    image: 'gt-be98.png',
    asusUrl: 'https://rog.asus.com/networking/rog-rapture-gt-be98-model',
    featured: true,
  },
  {
    id: 'dsl-ax82u',
    name: 'DSL-AX82U',
    aliases: ['DSL-AX5400'],
    branch: '3004',
    image: 'dsl-ax82u.png',
    asusUrl:
      'https://www.asus.com/Networking-IoT-Servers/WiFi-6/All-series/DSL-AX82U/',
    featured: true,
  },
  {
    id: 'rt-ax82u-v1',
    name: 'RT-AX82U v1',
    branch: '3004',
    image: 'rt-ax82u.png',
    asusUrl:
      'https://www.asus.com/Networking-IoT-Servers/WiFi-6/All-series/RT-AX82U/',
  },
  {
    id: 'rt-ax82u-v2',
    name: 'RT-AX82U v2',
    branch: '3004',
    image: 'rt-ax82u.png',
    asusUrl:
      'https://www.asus.com/Networking-IoT-Servers/WiFi-6/All-series/RT-AX82U/',
  },
  {
    id: 'rt-ax92u',
    name: 'RT-AX92U',
    branch: '3004',
    image: 'rt-ax92u.png',
    asusUrl:
      'https://www.asus.com/Networking-IoT-Servers/WiFi-Routers/ASUS-Gaming-Routers/RT-AX92U/',
  },
  {
    id: 'tuf-ax5400-v1',
    name: 'TUF-AX5400 v1',
    branch: '3004',
    image: 'tuf-ax5400.png',
    asusUrl:
      'https://www.asus.com/Networking-IoT-Servers/WiFi-Routers/ASUS-Gaming-Routers/TUF-Gaming-AX5400/',
  },
  {
    id: 'tuf-ax3000-v1',
    name: 'TUF-AX3000 v1',
    branch: '3004',
    image: 'tuf-ax3000.png',
    asusUrl:
      'https://www.asus.com/Networking-IoT-Servers/WiFi-Routers/ASUS-Gaming-Routers/TUF-Gaming-AX3000/',
  },
  {
    id: 'tuf-ax3000-v2',
    name: 'TUF-AX3000 v2',
    branch: '3004',
    image: 'tuf-ax3000.png',
    asusUrl:
      'https://www.asus.com/networking-iot-servers/wifi-routers/asus-gaming-routers/tuf-gaming-ax3000-v2/',
  },
  {
    id: 'rt-ax58u-v2',
    name: 'RT-AX58U v2',
    branch: '3004',
    image: 'rt-ax58u.png',
    asusUrl: 'https://uk.store.asus.com/rt-ac58u-v2-122214131-90ig06q0-mu9b00.html',
  },
  {
    id: 'rt-ax5400',
    name: 'RT-AX5400',
    branch: '3004',
    image: 'rt-ax5400.png',
    asusUrl:
      'https://www.asus.com/networking-iot-servers/wifi-routers/asus-wifi-routers/rt-ax5400/',
    badge: 'New',
    featured: true,
  },
  {
    id: 'zenwifi-xt8',
    name: 'ZenWiFi XT8',
    aliases: ['RT-AX95Q v1'],
    branch: '3004',
    image: 'zenwifi-xt8.png',
    asusUrl:
      'https://www.asus.com/Networking-IoT-Servers/Whole-Home-Mesh-WiFi-System/ZenWiFi-WiFi-Systems/ASUS-ZenWiFi-AX-XT8/',
    featured: true,
  },
  {
    id: 'zenwifi-et8',
    name: 'ZenWiFi ET8',
    aliases: ['RT-AXE95Q'],
    branch: '3004',
    image: 'zenwifi-et8.png',
    asusUrl:
      'https://www.asus.com/networking-iot-servers/whole-home-mesh-wifi-system/zenwifi-wifi-systems/asus-zenwifi-et8/',
    featured: true,
  },
  {
    id: 'dsl-ac68u',
    name: 'DSL-AC68U',
    branch: '386',
    image: 'dsl-ac68u.png',
    asusUrl:
      'https://www.asus.com/Networking-IoT-Servers/Modem-Routers/All-series/DSLAC68U/',
    featured: true,
  },
];

export const routersForBranch = (version: BranchId): RouterModel[] =>
  routers.filter((router) => router.branch === version);

export const branchById = (version: BranchId): FirmwareBranch => {
  const branch = firmwareBranches.find((item) => item.version === version);
  if (!branch) throw new Error(`Unknown firmware branch: ${version}`);
  return branch;
};
