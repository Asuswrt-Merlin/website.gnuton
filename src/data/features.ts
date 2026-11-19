/**
 * Feature copy for /features.
 *
 * The upstream groups and the "first seen in Merlin" list mirror
 * https://www.asuswrt-merlin.net/features . Keep this file in sync with that
 * page and make it obvious which entries come from upstream Merlin and which
 * are specific to GNUton's builds.
 */
import { site } from './site';

export interface FeatureLink {
  label: string;
  href: string;
}

export interface FeatureItem {
  text: string;
  link?: FeatureLink;
}

export interface FeatureGroup {
  id: string;
  title: string;
  description: string;
  items: FeatureItem[];
}

export const upstreamFeaturesUrl = site.upstreamFeatures;

export const upstreamGroups: FeatureGroup[] = [
  {
    id: 'system',
    title: 'System',
    description: 'Maintenance, scripting and the tools that make the router easier to extend.',
    items: [
      { text: 'Various bug fixes across the firmware.' },
      { text: 'Performance optimizations to CPU-bound components such as OpenVPN.' },
      {
        text: 'Updated components for improved stability and security.',
      },
      {
        text: 'User scripts that run on specific events, such as a firewall restart.',
        link: {
          label: 'User scripts',
          href: 'https://github.com/RMerl/asuswrt-merlin.ng/wiki/User-scripts',
        },
      },
      {
        text: 'Cron jobs for scheduled tasks.',
        link: {
          label: 'Cron jobs',
          href: 'https://github.com/RMerl/asuswrt-merlin.ng/wiki/Scheduled-tasks-(cron-jobs)',
        },
      },
      {
        text: 'Customizable config files for router services.',
        link: {
          label: 'Custom config files',
          href: 'https://github.com/RMerl/asuswrt-merlin.ng/wiki/Custom-config-files',
        },
      },
      {
        text: 'Third-party software through Entware, with an easy setup script.',
        link: {
          label: 'Entware',
          href: 'https://github.com/RMerl/asuswrt-merlin.ng/wiki/Entware',
        },
      },
      { text: 'SNMP support on some models.' },
      { text: 'Nano text editor for friendlier script editing.' },
      { text: 'NTP daemon that can synchronize your client devices.' },
      {
        text: 'Third-party add-ons managed through AMTM.',
        link: {
          label: 'AMTM',
          href: 'https://github.com/RMerl/asuswrt-merlin.ng/wiki/AMTM',
        },
      },
    ],
  },
  {
    id: 'disk-sharing',
    title: 'Disk sharing',
    description: 'Small but useful improvements when USB storage is attached.',
    items: [
      { text: 'Optionally use shorter share names (folder name only).' },
      { text: 'NFS exporting of USB drives on some models.' },
    ],
  },
  {
    id: 'networking',
    title: 'Networking',
    description: 'Routing, VPN, DNS and traffic-control features beyond stock ASUSWRT.',
    items: [
      { text: 'Act as an SMB Master Browser.' },
      { text: 'Act as a WINS server.' },
      { text: 'Tweak TCP/UDP connection-tracking timeouts.' },
      { text: 'CIFS client support for mounting a remote SMB share on the router.' },
      { text: 'Advanced OpenVPN client and server.' },
      { text: 'Netfilter ipset module for efficient blacklist implementations.' },
      { text: 'Wireless site survey page.' },
      {
        text: 'DNS Director, enforcing a specific DNS server globally or per client.',
        link: {
          label: 'DNS Director',
          href: 'https://github.com/RMerl/asuswrt-merlin.ng/wiki/DNS-Director',
        },
      },
      {
        text: 'Custom DDNS through a user script.',
        link: {
          label: 'Custom DDNS',
          href: 'https://github.com/RMerl/asuswrt-merlin.ng/wiki/Custom-DDNS',
        },
      },
      { text: 'TOR support with individual client access control.' },
      {
        text: 'Policy-based routing for OpenVPN clients by source or destination IP — selective routing or split tunnelling.',
        link: {
          label: 'Policy-based routing',
          href: 'https://github.com/RMerl/asuswrt-merlin.ng/wiki/Policy-based-routing',
        },
      },
      { text: "Redirect NTP client queries to the router's own NTP daemon." },
      {
        text: 'Cake SQM QoS on newer HND models.',
        link: {
          label: 'Cake SQM',
          href: 'https://www.bufferbloat.net/projects/codel/wiki/Cake/',
        },
      },
    ],
  },
  {
    id: 'web-interface',
    title: 'Web interface',
    description: 'A faster, more informative way to see what the router is doing.',
    items: [
      { text: 'Performance improvements.' },
      { text: 'Optionally save traffic stats to disk (USB or the JFFS partition).' },
      { text: 'Enhanced traffic monitoring with graphical charts and per-client IP stats.' },
      { text: 'Hostname field on the DHCP reservation and Wireless ACL lists.' },
      { text: 'System info summary page.' },
      { text: 'WiFi icon that reports the state of both radios.' },
      { text: 'Wireless site survey.' },
      { text: 'Advanced wireless client list with automatic refresh.' },
      { text: 'Redesigned layout for the various System Log sections.' },
      { text: 'Editable entries on some pages.' },
    ],
  },
];

/**
 * Features that debuted in Asuswrt-Merlin and were later adopted by the
 * official ASUS firmware, as listed upstream.
 */
export const upstreamFirsts: string[] = [
  'HTTPS configuration interface',
  'Persistent JFFS partition',
  'LED control — Stealth Mode turns off every LED',
  'WPS button as a radio on/off toggle',
  'MAC address lookup in the OUI database for unidentified clients',
  'WakeOnLan web interface with pre-configured targets',
  'Display of active and tracked network connections',
  'VPN Status page',
  'DualWAN and Repeater mode, while ASUS was still developing them',
  'Basic OpenVPN client and server support',
  'Configurable IPv6 firewall',
  'Improved compatibility with 3TB+ and Advanced Format HDDs',
  'SSH access',
  'Disk spindown after a user-configurable inactivity timeout',
  'Samba 3.6 with SMB2.0 support',
  'TLS 1.3 support for some services (OpenSSL 1.1.1)',
  'Modern DDNS client (In-a-Dyn) with HTTPS',
  'Full cone NAT on some models',
  'User-provided SSL certificate',
  'Ethernet port state display',
  'TLS support for the FTP server',
  'WAN access toggle for the FTP server',
  'User-defined options for WAN DHCP requests',
  'DNS-over-TLS',
  'DNSSEC validation',
];

export interface ModelFeature {
  title: string;
  description: string;
  badge?: string;
  links?: FeatureLink[];
}

/**
 * Additions that are specific to GNUton's builds. These do not come from
 * upstream Merlin, so they are kept separate from the upstream lists.
 */
export const modelFeatures: ModelFeature[] = [
  {
    title: 'Non-ROG theme on GT and TUF models',
    description:
      "GNUton's images use the standard non-ROG web interface on GT and TUF hardware, including ROG GT routers and TUF gaming models. Models that support the vendor look also get separate _rog or _tuf images, while the default image stays on the regular interface.",
    links: [
      {
        label: 'See supported models',
        href: '/firmware',
      },
    ],
  },
  {
    title: 'Repeater mode on the DSL-AC68U',
    description:
      'The experimental WiFi 5 image adds Repeater alongside the other operational modes on the DSL-AC68U. Repeater helps when AiMesh is not an option; standard images support AiMesh, which is faster when both ends are ASUS routers.',
    badge: 'Experimental',
    links: [
      {
        label: 'Open the Repeater build',
        href: 'https://github.com/gnuton/asuswrt-merlin.ng/releases/tag/gnuton-snapshot-feature-repeater',
      },
      {
        label: 'Read the Repeater guide',
        href: '/guides/repeater-mode-experimental/',
      },
    ],
  },
];
