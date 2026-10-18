# Makes the share images (assets/og) and Pinterest pins (assets/pins) for every page.
# Run after adding pages:  node build.mjs && python3 tools/make-images.py
# Needs Pillow and the two fonts in tools/fonts/.
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "tools", "fonts")
PAPER, INK, SOFT, VIOLET, ROSE, ROSE_SOFT = "#F3EEF8", "#2A1736", "#5E4D6B", "#5B3A86", "#D9A5B1", "#F4E1E6"

def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)

SERIF_I = "CormorantGaramond_500Medium_Italic.ttf"
SANS = "DMSans_400Regular.ttf"
SANS_M = "DMSans_500Medium.ttf"

# Pages that get a photo on their pin.
PHOTOS = {
    "home": "hallie.jpg",
    "walk-with-me": "walk-porch.jpg",
    "talk-with-hallie": "walk-trail.jpg",
    "work-with-me": "hallie-laptop.jpg",
}

def wrap(draw, text, fnt, width):
    words, lines, line = text.split(), [], ""
    for w in words:
        t = (line + " " + w).strip()
        if draw.textlength(t, font=fnt) <= width:
            line = t
        else:
            if line: lines.append(line)
            line = w
    if line: lines.append(line)
    return lines

def fit_title(draw, text, width, max_lines, start, smallest):
    size = start
    while size > smallest:
        f = font(SERIF_I, size)
        lines = wrap(draw, text, f, width)
        if len(lines) <= max_lines:
            return f, lines, size
        size -= 4
    f = font(SERIF_I, smallest)
    return f, wrap(draw, text, f, width)[:max_lines], smallest

def decor(img, cx, cy, r):
    d = ImageDraw.Draw(img)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ROSE_SOFT)
    d.ellipse([cx - r * 0.62, cy - r * 0.62, cx + r * 0.62, cy + r * 0.62], outline=ROSE, width=3)

def text_block(img, c, x, y, width, title_start, max_lines, kick_size, sub_size):
    d = ImageDraw.Draw(img)
    kf = font(SANS_M, kick_size)
    d.text((x, y), c["kicker"].upper(), font=kf, fill=VIOLET, spacing=0)
    y += kick_size + int(kick_size * 1.4)
    tf, lines, size = fit_title(d, c["title"], width, max_lines, title_start, 44)
    for ln in lines:
        d.text((x, y), ln, font=tf, fill=INK)
        y += int(size * 1.08)
    y += int(sub_size * 1.2)
    sf = font(SANS, sub_size)
    for ln in wrap(d, c["sub"], sf, width)[:3]:
        d.text((x, y), ln, font=sf, fill=SOFT)
        y += int(sub_size * 1.45)
    return y

def wordmark(img, x, y, size):
    d = ImageDraw.Draw(img)
    d.text((x, y), "Hallie Who", font=font(SERIF_I, size), fill=INK)
    w = d.textlength("Hallie Who", font=font(SERIF_I, size))
    d.text((x + w + 18, y + size * 0.28), "halliewho.com", font=font(SANS, int(size * 0.5)), fill=SOFT)

def og(c, out):
    img = Image.new("RGB", (1200, 630), PAPER)
    decor(img, 1170, 40, 210)
    text_block(img, c, 80, 92, 860, 80, 3, 22, 30)
    d = ImageDraw.Draw(img)
    d.line([(80, 532), (1120, 532)], fill="#E4DCEC", width=2)
    wordmark(img, 80, 552, 44)
    img.save(out, quality=86, optimize=True)

def pin(c, out):
    img = Image.new("RGB", (1000, 1500), PAPER)
    photo = PHOTOS.get(c["key"])
    if photo and os.path.exists(os.path.join(ROOT, "assets", photo)):
        ph = ImageOps.fit(Image.open(os.path.join(ROOT, "assets", photo)).convert("RGB"), (1000, 760), centering=(0.5, 0.35))
        img.paste(ph, (0, 0))
        y0, lines = 830, 3
        text_block(img, c, 80, y0, 840, 88, lines, 28, 36)
    else:
        decor(img, 930, 150, 300)
        # Measure first, then center the text in the open space.
        tmp = Image.new("RGB", (1000, 3000), PAPER)
        h = text_block(tmp, c, 80, 0, 840, 120, 4, 30, 40)
        y0 = max(400, int(400 + (1260 - 400 - h) / 2))
        text_block(img, c, 80, y0, 840, 120, 4, 30, 40)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([80, 1300, 920, 1300 + 2], radius=1, fill="#E4DCEC")
    wordmark(img, 80, 1340, 60)
    img.save(out, quality=86, optimize=True)

def main():
    cards = json.load(open(os.path.join(ROOT, "dist", "cards.json")))
    for sub in ("og", "pins"):
        os.makedirs(os.path.join(ROOT, "assets", sub), exist_ok=True)
    only = set(sys.argv[1:])
    for c in cards:
        if only and c["key"] not in only:
            continue
        og(c, os.path.join(ROOT, "assets", "og", c["key"] + ".jpg"))
        pin(c, os.path.join(ROOT, "assets", "pins", c["key"] + ".jpg"))
    print("Made", len(cards), "share images and pins")

main()
