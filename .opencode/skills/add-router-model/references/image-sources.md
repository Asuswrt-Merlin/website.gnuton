# Router image sources

## Preferred: ASUS product icons

```
http://nw-dlcdnet.asus.com/plugin/productIcons/<MODEL>.png
```

These are small official PNGs with real alpha transparency (typically around 310 px
wide). Use HTTP — the HTTPS host may fail certificate verification on some machines.

Examples that exist:

- `GT-BE98.png`
- `DSL-AX82U.png` (also works for DSL-AX5400)
- `RT-AX82U.png`
- `RT-AX92U.png`
- `TUF-AX5400.png`
- `TUF-AX3000.png`
- `RT-AX58U.png`
- `RT-AX5400.png`
- `RT-AX95Q.png` (ZenWiFi XT8)
- `DSL-AC68U.png`

The ET8 has no product icon at the time of writing. Its hero image came from the official
product page gallery:

```
https://dlcdnwebimgs.asus.com/gain/24e3e4bb-52d0-4102-a9d1-e95da8d04f15/
```

## Fallback: ASUS gallery images

Open the product page and inspect the HTML for:

- `<meta property="og:image" content="https://dlcdnwebimgs.asus.com/gain/...">`
- the JSON-LD `Product.image` array

Download the URL with `curl -L`. Confirm the file is a PNG with alpha — `file` saying
“PNG image data, ... RGBA” is a good sign, then run the helper to verify pixel-level
transparency.

## Preparing the file

```sh
python3 .opencode/skills/add-router-model/scripts/prepare-router-image.py \
  "<source>" public/images/routers/<model>.png
```

The script:

1. downloads HTTP(S) sources or reads a local file;
2. refuses images without transparent pixels;
3. crops the transparent border with a small margin;
4. downscales to fit `900x700` by default (never upscales);
5. saves an optimized RGBA PNG.

## Rules

- One local PNG per physical model family. Reuse files for aliases/revisions.
- Never commit a JPG, a white-background screenshot or a flattened composite.
- Keep the file small (tens of KB for icons; under ~100 KB for gallery images).
- Do not hotlink ASUS. The site must render without third-party image requests.
