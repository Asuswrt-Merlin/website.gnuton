---
name: Add Router Model
description: Add a newly supported ASUS router to the website, including its transparent product image, firmware branch, ASUS product link and model card.
---

# Add Router Model

Use this skill when a new ASUS model becomes supported by GNUton's builds, or when an
existing model line gets a new hardware revision.

This skill changes the **website only**. Confirm that the firmware model is actually
supported before touching the site. The source of truth is the project README for the
branch:
<https://github.com/Asuswrt-Merlin/asuswrt-merlin.ng-3006.gnuton/blob/master/README.md>
(WiFi 7 / 3006) and
<https://github.com/Asuswrt-Merlin/asuswrt-merlin.ng-3004.gnuton/blob/master/README.md>
(WiFi 6 / WiFi 5 / 3004 / 386).

## Workflow

1. **Confirm support and branch.** Read the upstream README and identify the exact model
   name, aliases and firmware branch (`3006`, `3004` or `386`). If the model is not listed,
   stop and ask — do not add speculative hardware. The website displays the friendly WiFi
   generation (WiFi 7 / 6 / 5), not the numeric branch.

2. **Collect the product page URL.** Use the ASUS product page linked from the README. If
   the README has no link, find the official ASUS page for that model. Avoid retailer
   links except for regional variants (the RT-AX58U v2 currently uses an ASUS store link).

3. **Prepare a transparent PNG.**
   - Try the official ASUS product-icon CDN first:
     `http://nw-dlcdnet.asus.com/plugin/productIcons/<MODEL>.png`
     (use HTTP; the HTTPS endpoint often has an incomplete certificate chain).
   - If that returns 404, open the ASUS product page and use the hero image from
     `https://dlcdnwebimgs.asus.com/gain/<uuid>/` (the `og:image` or JSON-LD gallery).
   - Store the result at `public/images/routers/<kebab-case-model>.png` using the helper:
     ```sh
     python3 .opencode/skills/add-router-model/scripts/prepare-router-image.py \
       "<source-url-or-file>" \
       public/images/routers/<kebab-case-model>.png
     ```
   - The helper verifies real alpha transparency, crops the transparent border and
     downscales oversized images. If it reports “no transparent pixels”, the source is a
     JPG or a flattened screenshot — find a PNG with alpha instead.
   - Reuse an existing image for aliases and revisions that are physically identical
     (for example RT-AX82U v1/v2, or ZenWiFi XT8 / RT-AX95Q). Do not duplicate files.

4. **Add the model entry** to `src/data/routers.ts`. Follow the interface and keep entries
   grouped by branch. Required fields: `id`, `name`, `branch`, `image`, `asusUrl`.
   Optional: `aliases`, `badge` (`"New"`), `note` (hardware/firmware warning shown on
   the card), `featured` (home-page showcase only).
   Example:
   ```ts
   {
     id: 'rt-ax86u-pro',
     name: 'RT-AX86U Pro',
     branch: '3004',
     image: 'rt-ax86u-pro.png',
     asusUrl: 'https://www.asus.com/.../rt-ax86u-pro/',
   },
   ```

5. **Check derived content.** The home-page counters, WiFi generation counts, firmware page,
   jump links and the search index all derive from `src/data/routers.ts`; no manual count or
   search update is needed. Only adjust copy if the new model changes a description or
   introduces a new WiFi generation.

6. **Write a guide if the model has a gotcha.** If the new model needs a special flashing
   step, a revision check or a known limitation, add a post under `src/content/guides/`
   and link it from the firmware page. Keep links relative (`../../firmware/`) so the site
   works under the GitHub Pages base path.

7. **Verify.**
   ```sh
   pnpm check
   pnpm build
   ```
   Then inspect the model page and the home page with both themes and a narrow viewport.
   Confirm:
   - the PNG renders with transparency on the card;
   - the ASUS link resolves;
   - the model is under the correct branch anchor on `/firmware`;
   - no layout shift or stretched image.

8. **Open a pull request.** Mention the firmware support reference, the branch, the image
   source and the local checks you ran. Include a screenshot of the new card.

## References

- [`references/router-data.md`](references/router-data.md) — field reference and branch map.
- [`references/image-sources.md`](references/image-sources.md) — where to find official
  transparent images and how to verify them.
