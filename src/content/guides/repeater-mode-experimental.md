---
title: Repeater Mode on the experimental WiFi 5 build
description: The DSL-AC68U has an experimental build that restores Repeater Mode. Here is what it is, who it helps, and why AiMesh is usually the better choice.
pubDate: 2026-10-26
tags: ['wifi-5', 'features', 'experimental']
---

The standard WiFi 5 build for the DSL-AC68U supports the usual operational modes and
AiMesh. There is also an experimental snapshot that adds **Repeater Mode** for people who
need it.

## What the experimental build adds

The snapshot exposes Repeater alongside the other operational modes. It is intended for
situations where a repeater is the right tool and AiMesh is not an option.

AiMesh is still the better experience when both routers are ASUS: the standard images
support it, and it performs better than repeater mode. Use the experimental build only
when you specifically need repeater functionality.

## What “experimental” means

- It is a snapshot, not a stable release.
- It may lag behind the current stable release.
- It can have bugs that never reach a stable build.
- It is the right place to test the feature and report what breaks.

## Try it carefully

1. Confirm you have a DSL-AC68U and are on the WiFi 5 build.
2. Read the release notes for the snapshot build.
3. Back up your settings and note your current firmware version so you can return to it.
4. Flash using the normal web interface flow — see the [flashing guide](../how-to-flash-gnuton-firmware/).
5. Test the repeater setup and report issues with logs, your topology and the exact build.

Download it from the
[Repeater Mode release tag](https://github.com/Asuswrt-Merlin/asuswrt-merlin.ng-3004.gnuton/releases/tag/gnuton-snapshot-feature-repeater).

If you only need a mesh with other ASUS routers, stay on the standard stable build and use
AiMesh. The [firmware page](../../firmware/#wifi-5) links the regular downloads.
