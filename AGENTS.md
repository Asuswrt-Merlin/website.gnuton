# AGENTS.md

## Environment

- **Node >= 22.22.0** is required by Astro 7. `.nvmrc` pins `24.22.1`; the current shell
  uses a compatible Node 22 release.
- **pnpm only** (`pnpm-lock.yaml` is the source of truth). The version is pinned in
  `package.json` (`packageManager`) and available through Corepack:
  `corepack enable pnpm`.
- `typescript` is pinned **^6**; `astro check` fails with TS 7 (tsgo). Do not bump it
  without re-testing.

## Commands

- `pnpm dev` — dev server. Background mode:
  ```
  pnpm astro dev --background
  ```
  Manage it with `pnpm astro dev stop | status | logs`.
- `pnpm check` — type-check (`astro check`). Run before and after changes.
- `pnpm build` — static output in `dist/`, regenerate content types + sitemap.
- `pnpm assets` — regenerate OG image, `favicon.ico` and touch icon (needs Pillow).
- Order: `pnpm check` → `pnpm build`.
- To test the GitHub Pages sub-path locally:
  `BASE_PATH=/website.gnuton pnpm build`, then preview with the same env.
  `pnpm preview --port 4322` serves at `/website.gnuton/`.

## Architecture

- **Astro 7 + Bulma 1.0.4** (Sass `@use`), strict TypeScript, SPA navigation via
  `<ClientRouter />`. Navbar/theme JS uses **document-level event delegation** because the
  DOM is re-created on every client-side navigation; cached element refs go stale.
- **Content-driven pages**: project/site copy in `src/data/site.ts`, router data in
  `src/data/routers.ts`, values/credits/help links in `src/data/project.ts`. Components are
  presentational with typed props; pages assemble.
- **Router catalogue**: `src/data/routers.ts` is the single source of truth. Home counters,
  branch groups, firmware page cards and branch counts derive from `routers`,
  `firmwareBranches`, `routersForBranch()` and `branchLabel()`. Do not hardcode counts.
- **Guides**: Content Collections via `src/content.config.ts`, files in
  `src/content/guides/`. Import `z` from `astro/zod`, **not** `astro:content` (deprecated in
  Astro 7). Routes: `/guides` and `/guides/[slug]`.
- **Routes**: `/`, `/firmware`, `/about`, `/guides`, `/guides/[slug]`, `/support`,
  `/rss.xml`, `/robots.txt`, `404.astro`.
- **Images**: router PNGs live in `public/images/routers/` and must keep real alpha
  transparency. Reuse images for aliases/revisions that are physically identical.

## Base path and URLs

- Deployment injects `SITE_URL` and `BASE_PATH` (GitHub Pages project sites), resolved
  from the Pages API with a default-project fallback. Local builds default to a root base
  path. Preview builds also set `PUBLIC_IS_PREVIEW=true`, which adds `noindex` to every
  page and shows a “Preview build” banner.
- **All internal links/assets must go through `withBase()`** from `src/utils/url.ts`.
  Do not write `/about` or `/images/...` directly in components. Use `withoutBase()` for
  active-link checks.
- Markdown internal links must be **relative** (`../../firmware/`), because Markdown is not
  rewritten with the base path.
- Canonical URLs use `Astro.url.pathname` + `Astro.site`; RSS and robots use
  `withBase()`/`absoluteUrl()`. Sitemap handles the base path through the Astro config.
- Public URL helpers: `withBase`, `withoutBase`, `absoluteUrl`.

## Styling (Bulma via Sass)

- Single entry: `src/assets/styles/main.scss`. Tokens flow two ways: the `@use 'bulma/sass'
  with (...)` block and the `--gm-*` custom properties. Project classes are prefixed `gm-`.
- **Never override Bulma classes or use `!important`** — use a `gm-` class or token.
  Bulma's dark-theme `is-outlined` button resolves to a near-black colour, so the project
  uses its own `gm-button-outline` class.
- **Theming**: `data-theme` on `<html>`; `[data-theme='light']` flips every `--gm-*` token.
  First visit follows `prefers-color-scheme`, the navbar toggle persists to `localStorage`,
  and the theme is re-applied after SPA navigation. BaseLayout's inline script prevents a
  flash before paint. Don't hardcode colours.
- **Sass gotchas (Bulma 1.0.4 + Dart Sass 1.106)**:
  - `@use ... with`: commas separate variable/value pairs → font stack must be parenthesised.
  - Only some variables are configurable; adjust tokens in CSS instead.
  - Bulma 1.x removed `columns is-variable` — use `style="--column-gap: …"`.
  - `astro.config.mjs` silences Bulma's legacy `if()` Sass deprecations — keep.

## Routers and images

- To add support, use the skill at `.opencode/skills/add-router-model/SKILL.md` (or read
  `references/router-data.md` and `references/image-sources.md`).
- Image helper:
  `python3 .opencode/skills/add-router-model/scripts/prepare-router-image.py <source> <output>`.
- Preferred source: `http://nw-dlcdnet.asus.com/plugin/productIcons/<MODEL>.png` (HTTP).
  Fallback: ASUS product-page gallery (`dlcdnwebimgs.asus.com/gain/<uuid>/`).
- The script rejects images without transparent pixels, crops margins and only downscales.
  Never commit flattened JPGs or hotlink ASUS images.
- Keep the featured home-page list to six cards (`featured: true`).

## Deployment

- `.github/workflows/deploy.yml` builds on pushes to `main` (and manual runs) and pushes
  `dist/` to the `gh-pages` branch with `JamesIves/github-pages-deploy-action`. It uses
  `clean-exclude` for `pr-preview/` and `CNAME` plus `force: false` so production deploys
  never delete previews, a custom-domain file, or rewrite the whole branch.
- `.github/workflows/preview.yml` builds same-repository pull requests at
  `/<repo>/pr-preview/pr-<number>/` with `PUBLIC_IS_PREVIEW=true` (adds `noindex` and a
  preview banner) and uses `rossjrw/pr-preview-action` to deploy, comment a sticky link
  and remove the preview when the PR closes.
- `.github/workflows/ci.yml` runs the checks for all pull requests and non-`main` pushes.
- Both Pages workflows share the `gh-pages` concurrency group. Do not run two writers to
  `gh-pages` concurrently.
- GitHub Pages must be enabled with **Source: Deploy from a branch**, branch `gh-pages`,
  folder `/ (root)`. Do not switch it back to "GitHub Actions": PR previews live in
  subdirectories of the same branch.
- Fork PRs are skipped by the preview workflow; the preview action needs a write token.
  Their CI checks still run.
- The Pages origin/base path is resolved from the GitHub Pages API, with a fallback to the
  default project URL before Pages is enabled. Custom domains follow automatically.

## SEO / content rules

- Site URL is injected at build time; keep `astro.config.mjs` env-based. `site.url` in
  `src/data/site.ts` is a local fallback only.
- `robots.txt` and the RSS feed are generated routes, not public files.
- Keep factual firmware claims in sync with the upstream README: supported models, branch
  numbers, release links, Repeater/AiMesh note. Do not invent model support or version
  numbers.
- Flashing is risky: keep the warnings on the home, firmware and guide pages.
- Social share image is `public/og-image.png` (generated by `pnpm assets`).

## Verification

Before finishing:

1. `pnpm check`
2. `pnpm build` (and, for deployment-sensitive changes,
   `BASE_PATH=/website.gnuton pnpm build` + preview). To exercise the PR preview path:
   `SITE_URL=https://asuswrt-merlin.github.io BASE_PATH=/website.gnuton/pr-preview/pr-1 PUBLIC_IS_PREVIEW=true pnpm build`,
   then preview at `/website.gnuton/pr-preview/pr-1/`.
3. Browser pass: both themes, mobile width, keyboard navigation, mobile menu.
4. Router changes: check the PNG loads, card link resolves and the model appears under the
   right `/firmware#...` anchor.

## Documentation

- Astro: https://docs.astro.build
- Bulma: https://bulma.io/documentation/
- Content collections: https://docs.astro.build/en/guides/content-collections/
- GitHub Pages deployment: https://docs.github.com/en/pages
