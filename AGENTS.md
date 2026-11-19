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
- `pnpm stats` — refresh `src/data/github-stats.json` from the GitHub API. CI runs it
  before the build; local builds use the committed snapshot.
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
  `firmwareBranches`, `routersForBranch()` and `branchById()`. Do not hardcode counts.
  The public UI groups routers by WiFi generation (WiFi 7 / 6 / 5); the numeric branch
  IDs are internal and only used to build release download links.
- **Router search**: `src/components/RouterSearch.astro` filters cards client-side using
  `data-router-*` attributes, updates branch counts and jump links, and uses
  document-level listeners so it survives `<ClientRouter />` navigation.
- **GitHub stats**: `src/data/github-stats.json` is refreshed by
  `scripts/fetch-github-stats.mjs` (`pnpm stats`) and read through `src/data/stats.ts`.
  The committed snapshot is the offline fallback; the daily Pages run refreshes it.
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

- `.github/workflows/pages.yml` is the single Pages pipeline:
  - `🧪 Check & build` runs for every push except `gh-pages`, every pull request except
    `closed`, and the daily `schedule`. It resolves the Pages origin/base path, refreshes
    `src/data/github-stats.json` with `pnpm stats` (`GITHUB_TOKEN`), runs `pnpm check` +
    `pnpm build`, and uploads `dist` as a one-day artifact. The build job has read-only
    permissions.
  - `🚀 Deploy to GitHub Pages` (`needs: build`) runs on `main` pushes, manual runs and the
    daily schedule, downloads `dist`, and pushes it to `gh-pages` with
    `JamesIves/github-pages-deploy-action`. It uses `clean-exclude` for `pr-preview/` and
    `CNAME` plus `force: false` so production deploys never delete previews, a custom-domain
    file, or rewrite the whole branch.
  - `👀 Publish PR preview` (`needs: build`) runs for same-repository pull requests at
    `/<repo>/pr-preview/pr-<number>/` with `PUBLIC_IS_PREVIEW=true` (adds `noindex` and a
    preview banner) and uses `rossjrw/pr-preview-action` to deploy and comment a sticky link.
  - `🧹 Remove PR preview` (`needs: build`, `always()`) runs when a same-repository PR
    closes and removes the preview.
- The deploy, preview and cleanup jobs share the `gh-pages` concurrency group. Do not run
  two writers to `gh-pages` concurrently. The build job uses `ci-${{ github.ref }}` and
  cancels superseded non-`main` builds.
- Artifact uploads must set `include-hidden-files: true`; `dist/.nojekyll` must survive or
  GitHub Pages can run Jekyll and drop the `_astro/` assets.
- GitHub Pages must be enabled with **Source: Deploy from a branch**, branch `gh-pages`,
  folder `/ (root)`. Do not switch it back to "GitHub Actions": PR previews live in
  subdirectories of the same branch.
- Fork PRs still run the read-only check/build job; preview and cleanup are skipped because
  the preview action needs a write token.
- The Pages origin/base path is resolved from the GitHub Pages API by the build job, with a
  fallback to the default project URL before Pages is enabled. Custom domains follow
  automatically.
- `docs/ci-pipeline.md` is the canonical trigger/job map. Update it when triggers or jobs
  change; the build and cleanup jobs write it into their run summaries.

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
4. Search changes: filter by model, alias and WiFi generation; test Clear, Escape and the
   no-results state.
5. Router changes: check the PNG loads, card link resolves and the model appears under the
   right `/firmware#wifi-*` anchor.
6. Workflow changes: validate with
   `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:latest`, then exercise a
   branch push (`🧪` only), a same-repo PR (`🧪 → 👀`), close (`🧹`), and merge (`🧪 → 🚀`).
   Confirm the run graph and the Mermaid job-summary map, and that `gh-pages/.nojekyll`
   survives the artifact handoff.

## Documentation

- Astro: https://docs.astro.build
- Bulma: https://bulma.io/documentation/
- Content collections: https://docs.astro.build/en/guides/content-collections/
- GitHub Pages deployment: https://docs.github.com/en/pages
