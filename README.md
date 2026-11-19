# GNUton's Merlin Builds — website

[![Deploy to GitHub Pages](https://github.com/Asuswrt-Merlin/website.gnuton/actions/workflows/deploy.yml/badge.svg)](https://github.com/Asuswrt-Merlin/website.gnuton/actions/workflows/deploy.yml)
[![CI](https://github.com/Asuswrt-Merlin/website.gnuton/actions/workflows/ci.yml/badge.svg)](https://github.com/Asuswrt-Merlin/website.gnuton/actions/workflows/ci.yml)
[![PR preview](https://github.com/Asuswrt-Merlin/website.gnuton/actions/workflows/preview.yml/badge.svg)](https://github.com/Asuswrt-Merlin/website.gnuton/actions/workflows/preview.yml)

The website for **[GNUton's Asuswrt-Merlin builds](https://github.com/gnuton/asuswrt-merlin.ng)**:
supported routers, firmware downloads by branch, installation guides and community links.

Live site (after the first Pages deployment):
<https://asuswrt-merlin.github.io/website.gnuton/>

Built with [Astro](https://astro.build) and [Bulma](https://bulma.io), based on the
[Astro Wellness template](https://github.com/Domenico-Tenace-Open-Labs/astro-wellness).

## Features

- **Supported-router catalogue** — one card per supported build, grouped by firmware
  branch (3006 / 3004 / 386), with local transparent PNGs and links to ASUS product pages.
- **Download-first home page** — branch cards for stable and pre-release releases, plus a
  three-step flashing checklist.
- **Guides** — Markdown content collection with model-revision, branch, flashing and
  Repeater Mode articles, RSS feed and `TechArticle` structured data.
- **SEO-ready** — canonical URLs, Open Graph image, sitemap, generated `robots.txt`,
  JSON-LD and per-page metadata.
- **Responsive, accessible UI** — dark/light themes, keyboard-friendly mobile menu,
  skip link, visible focus states and reduced-motion support.
- **GitHub Pages pipeline** — type-check, build and deploy on every push to `main`,
  plus live previews with sticky links for pull requests.
- **No client framework** — Astro components and a few delegated scripts; zero hydration.

## Requirements

- Node.js **>= 22.22.0** (Astro 7 minimum)
- pnpm **10** (declared in `package.json`; use Corepack or install pnpm directly)

```sh
corepack enable pnpm
pnpm install
```

## Commands

| Command | Action |
| --- | --- |
| `pnpm dev` | Start the dev server at `localhost:4321` |
| `pnpm build` | Build the production site to `./dist/` |
| `pnpm check` | Type-check Astro + TypeScript |
| `pnpm preview` | Preview the production build |
| `pnpm assets` | Regenerate `og-image.png`, `favicon.ico` and the touch icon |

Run the dev server in the background with `pnpm astro dev --background`, then manage it
with `pnpm astro dev stop | status | logs`.

## Pages

| Route | Description |
| --- | --- |
| `/` | Hero, stats, firmware branches, featured routers, project values, flashing steps, latest guides |
| `/firmware` | Every supported model grouped by branch, release channels and downloads |
| `/about` | Project aim, values, credits and ways to help |
| `/guides` | Guide listing |
| `/guides/[slug]` | Individual guide with reading time and tags |
| `/support` | Bug reports, community channels, upstream docs and reporting checklist |
| `/rss.xml` | Guides RSS feed |
| `/robots.txt` | Generated robots file pointing at the sitemap |
| `/404` | Custom not-found page |

## Adding a router model

Router data is centralised in [`src/data/routers.ts`](src/data/routers.ts). Adding a model
means adding one entry, reusing or preparing a transparent PNG, and running the checks.

The repository ships an agent skill for this workflow:
[`.opencode/skills/add-router-model/SKILL.md`](.opencode/skills/add-router-model/SKILL.md).
It documents the ASUS image sources, the image-preparation script, the data schema and the
verification checklist.

Quick version:

```sh
python3 .opencode/skills/add-router-model/scripts/prepare-router-image.py \
  "<asus-image-url>" public/images/routers/<model>.png
```

Then add the model under the correct branch in `src/data/routers.ts` and run
`pnpm check && pnpm build`.

## Content sources

- Supported models, download links, branch names, credits and project aim come from the
  [upstream README](https://github.com/Asuswrt-Merlin/asuswrt-merlin.ng-gnuton/blob/master/README.md).
- Guides are written for this site and live in `src/content/guides/`.
- Router artwork is stored locally in `public/images/routers/` as transparent PNGs. The
  images come from ASUS product pages / product-icon CDN and are used for identification.

When support changes upstream, update `src/data/routers.ts` first; counts, filters and the
firmware page derive from it.

## Deployment

The workflow at `.github/workflows/deploy.yml` builds the site and pushes it to the
`gh-pages` branch, which GitHub Pages serves. Pull requests and non-`main` branches run
the CI workflow (`check` + `build`); same-repository pull requests also get a live preview.

**First-time setup:**

1. Push to `main` once. The deploy workflow creates the `gh-pages` branch even before
   Pages is enabled (it falls back to the default project-site URL).
2. In the repository, open **Settings → Pages**.
3. Set **Build and deployment → Source** to **Deploy from a branch**.
4. Choose branch **`gh-pages`** and folder **`/ (root)`**, then save.
5. Re-run the deploy workflow (or push to `main`) if Pages needs a fresh build.

If the workflows cannot push to `gh-pages`, allow write access under
**Settings → Actions → General → Workflow permissions** (read and write permissions).
The workflows request `contents: write`, but an organisation policy can still block it.

**How previews work:**

- `.github/workflows/preview.yml` builds same-repository PRs under
  `/<repo>/pr-preview/pr-<number>/` and posts a sticky preview link on the PR.
- Every push updates the preview; closing the PR removes it.
- Preview builds are marked `noindex` and show a “Preview build” banner.
- Fork PRs are skipped by the preview workflow because the deploy action needs a write
  token. Their CI checks still run. Add an external preview provider (Netlify,
  Cloudflare Pages, etc.) if fork previews are required.

The workflow resolves the Pages origin and base path from the GitHub Pages API, falling
back to the default project-site URL before Pages is enabled:

- `SITE_URL` — pages origin (for example `https://asuswrt-merlin.github.io`).
- `BASE_PATH` — project path (for example `/website.gnuton`), empty for root sites.

If you configure a custom domain in Pages, the resolved origin follows it automatically.
Do not hardcode domains in components; use `withBase()` for internal links and assets and
`Astro.site` for absolute URLs.

### Deploying elsewhere

`pnpm build` produces a static site in `dist/`, so any static host works. For a sub-path
deployment outside GitHub Pages, set `SITE_URL` and `BASE_PATH` when building:

```sh
SITE_URL=https://example.com BASE_PATH=/firmware pnpm build
```

## Project structure

```
/
├── .github/workflows/       # CI, PR previews + GitHub Pages deployment
├── .opencode/skills/        # "add-router-model" agent skill and image helper
├── public/
│   ├── images/routers/      # Local transparent router PNGs
│   ├── favicon.*            # Brand icon
│   └── og-image.png         # 1200×630 social share image
├── scripts/                 # Brand asset generator
├── src/
│   ├── assets/styles/       # Bulma modules + gm- project styles
│   ├── components/          # Navbar, footer, router/branch/release cards…
│   ├── content/guides/      # Markdown guides
│   ├── content.config.ts    # Guides schema
│   ├── data/                # site, routers and project content
│   ├── layouts/             # SEO-ready document shell
│   ├── pages/               # Routes
│   └── utils/               # Base-path, date and reading-time helpers
└── astro.config.mjs         # Site URL + base path from env, sitemap
```

## Credits

- Website template: [Astro Wellness](https://github.com/Domenico-Tenace-Open-Labs/astro-wellness)
  by Domenico Tenace, MIT licensed. See `LICENSE` and `NOTICE.md`.
- Firmware project: [gnuton/asuswrt-merlin.ng](https://github.com/gnuton/asuswrt-merlin.ng),
  an official [Asuswrt-Merlin](https://github.com/RMerl/asuswrt-merlin.ng) fork.
- ASUS and ROG are trademarks of ASUSTeK Computer Inc. Product images are used to identify
  supported hardware.
