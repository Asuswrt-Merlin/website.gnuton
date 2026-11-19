# Router data reference

File: `src/data/routers.ts`

## RouterModel fields

| Field | Required | Meaning |
| --- | --- | --- |
| `id` | yes | Stable, kebab-case identifier, unique across the file. |
| `name` | yes | Primary marketing name, including revision when relevant (`RT-AX82U v2`). |
| `aliases` | no | Other names for the same hardware (`GT-BE25000`, `RT-AX95Q v1`). |
| `branch` | yes | `3006`, `3004` or `386`. |
| `image` | yes | Filename inside `public/images/routers/`. Reuse for identical shells. |
| `asusUrl` | yes | Official ASUS product or store page. |
| `badge` | no | Short flag such as `New`. Do not leave stale badges behind. |
| `featured` | no | Show on the home page. Keep the featured list to six cards. |

## Branches

| ID | Anchor | Generation | Models |
| --- | --- | --- | --- |
| `3006` | `/firmware#wifi-7` | WiFi 7 | GT-BE98 / GT-BE25000 |
| `3004` | `/firmware#wifi-6` | WiFi 6 / WiFi 6E | DSL-AX82U, RT-AX82U, RT-AX92U, TUF-AX5400, TUF-AX3000, RT-AX58U, RT-AX5400, ZenWiFi XT8, ZenWiFi ET8 |
| `386` | `/firmware#dsl` | DSL / WiFi 5 | DSL-AC68U |

A new branch requires more than an entry: update `firmwareBranches`, the branch anchors in
`RouterCard.astro`, the stats/copy on the home page and the firmware page, and this table.

## Things that derive automatically

- `routers.length` — home-page “supported builds” counter and the firmware page button.
- `routersForBranch(version)` — counts and model grids per branch.
- `branchLabel(version)` — the small branch line on each card.

Do not hardcode new counts in pages.
