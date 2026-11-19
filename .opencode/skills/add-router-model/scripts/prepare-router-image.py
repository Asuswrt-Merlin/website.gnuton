#!/usr/bin/env python3
"""Prepare a transparent router product image for the website.

Usage:
    python3 prepare-router-image.py <source> <output.png> [--max 900x700]

<source> can be an http(s) URL or a local file. The script verifies that the
image has real alpha transparency, crops the transparent margins, and only
downscales when the image is larger than --max. It never flattens the image
onto a background.

Requires Pillow:  python3 -m pip install --user Pillow
"""

from __future__ import annotations

import argparse
import io
import sys
import urllib.request
from pathlib import Path

from PIL import Image


def load(source: str) -> Image.Image:
    if source.startswith(("http://", "https://")):
        request = urllib.request.Request(source, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(request, timeout=60) as response:
            return Image.open(io.BytesIO(response.read())).convert("RGBA")
    return Image.open(source).convert("RGBA")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("source")
    parser.add_argument("output")
    parser.add_argument("--max", default="900x700", help="maximum output size, WxH")
    args = parser.parse_args()

    try:
        width, height = (int(value) for value in args.max.lower().split("x"))
    except ValueError:
        parser.error("--max must look like 900x700")

    image = load(args.source)
    alpha = image.getchannel("A")
    if alpha.getextrema() == (255, 255):
        print(
            "error: image has no transparent pixels. Use a PNG with an alpha channel "
            "instead of a JPG or a flattened product shot.",
            file=sys.stderr,
        )
        return 1

    bbox = alpha.getbbox()
    if not bbox:
        print("error: image is fully transparent", file=sys.stderr)
        return 1

    # Keep a small, even margin so the subject does not touch the card edge.
    pad = max(2, round(max(image.size) * 0.01))
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(image.width, bbox[2] + pad)
    bottom = min(image.height, bbox[3] + pad)
    image = image.crop((left, top, right, bottom))

    if image.width > width or image.height > height:
        image.thumbnail((width, height), Image.Resampling.LANCZOS)

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "PNG", optimize=True)

    alpha = image.getchannel("A")
    print(f"saved {output} ({image.width}x{image.height}, alpha {alpha.getextrema()})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
