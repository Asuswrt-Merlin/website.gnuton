---
title: How to flash GNUton's firmware
description: A careful, generic flashing checklist for ASUS routers running GNUton's Asuswrt-Merlin builds, from backup to post-flash verification.
pubDate: 2026-11-02
tags: ['install', 'firmware']
---

This is the generic flow for updating an ASUS router to a GNUton build. Release notes
always win: if a specific release asks for a factory reset, a different upgrade path or a
minimum source firmware, follow those instructions instead.

> **Caution.** Flashing firmware is not risk-free. Never install an image for a
> different model or WiFi generation, never flash over a flaky wireless connection, and
> never cut power during the update. Keep the router's recovery method at hand.

## Before you start

1. **Confirm the model and revision.** Check the label or run `nvram get productid` over
   SSH. See [which router version do I have](../which-router-version-do-i-have/).
2. **Confirm the WiFi generation.** WiFi 7, WiFi 6, or WiFi 5 for the DSL-AC68U.
   The [supported list](../../firmware/) shows where your model belongs.
3. **Read the release notes** for the exact download. They list known issues and any
   special upgrade requirements.
4. **Back up your settings** from the web interface (Administration → Restore/Save/Upload
   Setting). Keep the file, but do not assume it can be restored across Wi-Fi generations or
   after a major upgrade. A written list of WAN, LAN, Wi-Fi and port-forward settings is
   more reliable.
5. **Download the correct `.w` file** from the release page. Do not rename or unpack it.

## Flash it

1. Connect the computer to the router with an Ethernet cable. Avoid flashing over Wi-Fi.
2. Open the router's web interface and sign in.
3. Go to **Administration → Firmware Upgrade**.
4. Select the downloaded `.w` file and start the upload.
5. Wait. The router will reboot; some updates take several minutes. Do not power it off
   and do not close the browser tab until the interface returns.
6. Sign in again and verify the firmware version shown on the dashboard.

If the page does not come back after a reasonable wait, check the router LEDs and follow
the recovery instructions in the release notes or the upstream Merlin documentation
before trying anything else.

## After the update

- Confirm that the version string matches the release you downloaded.
- Check WAN, Wi-Fi, DHCP and any custom port forwards.
- If the router behaves strangely, a factory reset followed by manual configuration is
  the cleanest path. Restoring settings from a different firmware generation can carry old
  problems forward.
- If you moved from stock ASUS firmware to Merlin for the first time, expect to
  reconfigure the router. The two interfaces are similar, but they are not the same
  firmware.

## If something goes wrong

ASUS routers generally provide a firmware restoration utility and a rescue mode. The
exact button sequence and tool differ by model, so use the ASUS support page for your
router rather than a generic tutorial. Ask in [Discord](https://discord.gg/pm7q6KFSzp) or
open a [bug report](https://github.com/gnuton/asuswrt-merlin.ng/issues/new?assignees=&labels=bug&template=bug_report.md)
with the exact model, revision, source firmware and the step where it failed.
