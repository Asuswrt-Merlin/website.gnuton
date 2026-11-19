---
title: Which router version do I have?
description: Hardware revisions matter. Here is how to read the model name and confirm the exact revision before downloading a firmware image.
pubDate: 2026-11-12
tags: ['models', 'install']
---

ASUS sells several routers under the same name with different hardware inside. The
RT-AX82U **v1** and **v2**, and the TUF-AX3000 **v1** and **v2**, are separate builds in
the support list. Flashing the wrong revision is one of the easiest ways to turn a
five-minute update into a recovery project.

## Check the label first

Look at the sticker on the bottom of the router. It shows the full model name, including
the revision when ASUS printed one. Write it down exactly — “RT-AX82U” and “RT-AX82U V2”
are not interchangeable.

## Confirm from the firmware

If the label is missing or unclear, enable SSH in the router's web interface
(**Administration → System → Enable SSH**, LAN only), then connect from a computer on the
same network:

```sh
ssh <your-router-username>@router.asus.com
nvram get productid
```

The command prints the product identifier the firmware uses. Compare it with the model
and revision in the [supported models list](../../firmware/). If the output does not make
the revision obvious, ask in [Discord](https://discord.gg/pm7q6KFSzp) and include the
full output — do not guess.

## Match the model to a branch

Every supported build belongs to one firmware branch:

- **3006** — WiFi 7 models including the GT-BE98 / GT-BE25000, RT-BE58U, RT-BE82U and RT-BE82M.
- **3004** — WiFi 6 routers and mesh systems, including both RT-AX82U revisions.
- **386** — the DSL-AC68U.

The branch name is part of the release title, so a quick search on the
[releases page](https://github.com/Asuswrt-Merlin/asuswrt-merlin.ng-3004.gnuton/releases) is usually enough.
The [guide to WiFi generations](../understanding-wifi-generations/) explains what changes
between them.

## When in doubt, stop

A wrong image is worse than a delayed update. If the model, revision or branch is not
100% clear, ask before flashing. Include the label photo or the `nvram get productid`
output, the firmware version you are running today, and the download you are considering.
