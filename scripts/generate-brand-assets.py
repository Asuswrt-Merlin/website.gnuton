#!/usr/bin/env python3
"""Generate the social share image and PNG icons for the website.

Usage:
    python3 scripts/generate-brand-assets.py

Requires Pillow. The router artwork is the same transparent PNG used on the
site, so the social card stays in sync with the product pages.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ROUTER = ROOT / "public/images/routers/gt-be98.png"
OUT_OG = ROOT / "public/og-image.png"
OUT_ICON = ROOT / "public/apple-touch-icon.png"
OUT_ICO = ROOT / "public/favicon.ico"

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

INK = (11, 16, 22)
INK_SOFT = (18, 25, 33)
TEXT = (244, 247, 249)
MUTED = (154, 167, 176)
ACCENT = (255, 107, 53)


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def radial_glow(size: tuple[int, int], center: tuple[int, int], radius: int, color: tuple[int, int, int], opacity: int) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    steps = 36
    for step in range(steps, 0, -1):
        ratio = step / steps
        r = int(radius * ratio)
        alpha = int(opacity * (1 - ratio) ** 2)
        draw.ellipse(
            (center[0] - r, center[1] - r, center[0] + r, center[1] + r),
            fill=(*color, alpha),
        )
    return layer.filter(ImageFilter.GaussianBlur(30))


def router_icon(size: int) -> Image.Image:
    scale = 4
    canvas = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    s = size * scale
    radius = int(s * 0.22)
    draw.rounded_rectangle((0, 0, s - 1, s - 1), radius=radius, fill=(14, 18, 22, 255))

    def m(value: float) -> int:
        return int(s * value)

    line = max(2, int(s * 0.045))
    for x in (0.28, 0.5, 0.72):
        draw.line((m(x), m(0.58), m(x), m(0.34)), fill=ACCENT, width=line)
    draw.rounded_rectangle(
        (m(0.14), m(0.58), m(0.86), m(0.79)), radius=int(s * 0.06), fill=TEXT
    )
    for x in (0.25, 0.36, 0.47):
        r = int(s * 0.032)
        draw.ellipse((m(x) - r, m(0.685) - r, m(x) + r, m(0.685) + r), fill=ACCENT)
    lw = max(2, int(s * 0.035))
    draw.line((m(0.64), m(0.685), m(0.77), m(0.685)), fill=INK, width=lw)
    draw.line((m(0.72), m(0.635), m(0.77), m(0.685), m(0.72), m(0.735)), fill=INK, width=lw)

    return canvas.resize((size, size), Image.Resampling.LANCZOS)


def make_og() -> None:
    width, height = 1200, 630
    image = Image.new("RGB", (width, height), INK)
    draw = ImageDraw.Draw(image)

    # Soft brand glows and a faint diagonal texture.
    image = Image.alpha_composite(
        image.convert("RGBA"), radial_glow((width, height), (1020, 90), 560, ACCENT, 64)
    )
    image = Image.alpha_composite(
        image.convert("RGBA"), radial_glow((width, height), (150, 650), 520, ACCENT, 34)
    )
    texture = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(texture)
    for x in range(-height, width, 58):
        tdraw.line((x, 0, x + height, height), fill=(255, 255, 255, 8), width=1)
    image = Image.alpha_composite(image, texture)
    draw = ImageDraw.Draw(image)

    # Router artwork. Keep the glow inside the product's own alpha mask,
    # otherwise the transparent canvas turns into a dark rectangle.
    router = Image.open(ROUTER).convert("RGBA")
    router.thumbnail((400, 400), Image.Resampling.LANCZOS)
    glow = router.copy().filter(ImageFilter.GaussianBlur(26))
    glow.putalpha(glow.getchannel("A").point(lambda value: value * 0.32))
    router_x = 930 - router.width // 2
    router_y = 330 - router.height // 2
    image.alpha_composite(glow, (router_x, router_y))
    image.alpha_composite(router, (router_x, router_y))

    # Brand lockup.
    icon = router_icon(46)
    image.alpha_composite(icon, (80, 66))
    draw.text((140, 72), "GNUton's", font=font(FONT_BOLD, 27), fill=ACCENT)
    draw.text((140, 101), "Merlin Builds", font=font(FONT_BOLD, 27), fill=TEXT)

    draw.text((80, 180), "OFFICIAL ASUSWRT-MERLIN FORK", font=font(FONT_BOLD, 18), fill=ACCENT)
    draw.text((80, 218), "More routers.", font=font(FONT_BOLD, 76), fill=TEXT)
    draw.text((80, 306), "Same Merlin.", font=font(FONT_BOLD, 76), fill=TEXT)
    draw.text(
        (80, 410),
        "GNUton's builds extend Asuswrt-Merlin",
        font=font(FONT_REGULAR, 25),
        fill=MUTED,
    )
    draw.text(
        (80, 442),
        "to more ASUS routers — WiFi 7, WiFi 6 and DSL.",
        font=font(FONT_REGULAR, 25),
        fill=MUTED,
    )

    # Branch chips.
    chips = ["WiFi 7 · 3006", "WiFi 6 · 3004", "DSL · 386"]
    x = 80
    for label in chips:
        f = font(FONT_BOLD, 18)
        box = draw.textbbox((0, 0), label, font=f)
        w = box[2] - box[0] + 36
        draw.rounded_rectangle((x, 488, x + w, 532), radius=22, outline=(255, 255, 255, 40), width=1)
        draw.text((x + 18, 498), label, font=f, fill=TEXT)
        x += w + 12

    draw.line((80, 560, 1120, 560), fill=(255, 255, 255, 28), width=1)
    draw.text((80, 580), "github.com/gnuton/asuswrt-merlin.ng", font=font(FONT_REGULAR, 19), fill=MUTED)
    draw.text((1120, 580), "Built in the cloud · Open source", font=font(FONT_REGULAR, 19), fill=MUTED, anchor="ra")

    image.convert("RGB").save(OUT_OG, "PNG", optimize=True)
    print(f"saved {OUT_OG}")


def make_icons() -> None:
    icon = router_icon(512)
    icon.save(OUT_ICON, "PNG", optimize=True)
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    icon.save(OUT_ICO, "ICO", sizes=sizes)
    print(f"saved {OUT_ICON} and {OUT_ICO}")


if __name__ == "__main__":
    make_og()
    make_icons()
