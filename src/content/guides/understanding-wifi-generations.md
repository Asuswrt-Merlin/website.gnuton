---
title: Understanding the WiFi 5, 6 and 7 builds
description: GNUton's builds follow ASUS WiFi generations. Here is what the firmware numbers mean, which models use which generation, and why you cannot cross-flash.
pubDate: 2026-11-06
tags: ['firmware', 'models']
---

Every release title starts with a number: **3006**, **3004** or **386**. Behind that
number is the ASUS firmware generation, and it is tied to the router hardware and the
software generation the build is based on. It is not a version you can choose freely.

## The three branches

| Branch | Hardware generation | Models |
| --- | --- | --- |
| **3006** | WiFi 7 | GT-BE98 / GT-BE25000 |
| **3004** | WiFi 6 and WiFi 6E | DSL-AX82U, RT-AX82U, RT-AX92U, TUF-AX5400, TUF-AX3000, RT-AX58U v2, RT-AX5400, ZenWiFi XT8, ZenWiFi ET8 |
| **386** | WiFi 5 DSL | DSL-AC68U |

The [firmware page](../../firmware/) lists every supported revision under the correct
branch. Both RT-AX82U revisions and both TUF-AX3000 revisions are supported on 3004, but
they still need their matching image.

## Stable and pre-release are channels, not branches

Inside each branch there are release channels:

- **Stable** — recommended for everyday use.
- **Pre-release** — beta builds for advanced users and testing new features.
- **Experimental** — one-off branches for specific features, such as Repeater Mode on the
  386 DSL build.

A pre-release is still the same branch. A 3004 beta will never install on a 3006 router,
and a 386 experimental image will not install on a WiFi 6 model.

## Why cross-flashing is a bad idea

The branch determines the kernel, drivers, bootloader expectations and the web interface
for that hardware family. Forcing an image across branches can leave the router unable to
boot normally. If the model is not listed, the firmware is not supported — wait for a
build instead of trying a neighbouring model's image.

## Choose in this order

1. Confirm the exact model and hardware revision.
2. Find that model in the [supported list](../../firmware/).
3. Pick stable, or a pre-release if you can test and report back.
4. Read the release notes before downloading.
5. Follow the [flashing guide](../how-to-flash-gnuton-firmware/).

If the model is missing from the list, ask in [Discord](https://discord.gg/pm7q6KFSzp)
whether support is planned. Do not assume a similar model's image is compatible.
