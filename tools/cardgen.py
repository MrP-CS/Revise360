# Flat preview cards for the topic pages: a clear, readable summary of each experience
# rather than a warped slice of the 360 image.
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
import json, os
from PIL import Image, ImageDraw, ImageFont

SITE = SITE_S
W, H = 1200, 520
BG, PANEL, LINE, FG, SOFT, EDGE = (14, 22, 40), (21, 34, 59), (60, 90, 135), (240, 244, 250), (180, 196, 220), (255, 208, 70)
TOPIC_COL = {"1.1": (64, 196, 255), "1.2": (200, 140, 255), "1.3": (80, 220, 150),
             "1.4": (255, 120, 90), "1.5": (255, 176, 64), "1.6": (255, 140, 120),
             "2.1": (120, 200, 255), "2.2": (110, 230, 190), "2.3": (120, 160, 255),
             "2.2": (255, 190, 90), "2.4": (255, 95, 162), "PY": (120, 230, 170)}
TOPIC_NAME = {"PY": "Python"}
FONTS = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]

def font(size, bold=False):
    return ImageFont.truetype(FONTS[0 if bold else 1], size)

def wrap(d, text, f, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= width: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def chip(d, text, x, y, col):
    f = font(24)
    w = d.textlength(text, font=f) + 34
    d.rounded_rectangle((x, y, x + w, y + 44), 22, fill=None, outline=col, width=3)
    d.text((x + 17, y + 22), text, font=f, fill=col, anchor="lm")
    return x + w + 12

def card(out, topic, lesson, title, keywords=(), stations=None, badge=None, extras=()):
    col = TOPIC_COL.get(topic, EDGE)
    is_bonus = bool(badge)
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    for x in range(0, W, 48): d.line((x, 0, x, H), fill=(22, 34, 58))
    for y in range(0, H, 48): d.line((0, y, W, y), fill=(22, 34, 58))
    d.rectangle((0, 0, 16, H), fill=col)
    d.rounded_rectangle((52, 44, W - 52, H - 44), 26, fill=PANEL, outline=LINE, width=3)

    # The Python course is not a numbered topic, so the card names it.
    label = f"{TOPIC_NAME.get(topic, topic)}  ·  " + ("Bonus challenge" if is_bonus else f"Lesson {lesson}")
    d.text((100, 96), label.upper(), font=font(26, True), fill=col, anchor="lm")

    size = 66
    while size > 34:
        f = font(size, True)
        lines = wrap(d, title, f, W - 220)
        if len(lines) <= 2: break
        size -= 6
    y = 148
    for ln in lines:
        d.text((100, y), ln, font=f, fill=FG); y += int(size * 1.16)

    y += 10
    if keywords:
        x, row = 100, y
        for k in list(keywords)[:6]:
            w = d.textlength(k, font=font(24)) + 34
            if x + w > W - 150: x, row = 100, row + 54
            if row > H - 170: break
            x = chip(d, k, x, row, col)

    bits = []
    if stations and not is_bonus:
        bits.append(f"{stations} station" + ("s" if stations != 1 else ""))
    bits += list(extras)
    if bits:
        d.text((100, H - 74), "   ·   ".join(bits), font=font(26), fill=SOFT, anchor="lm")

    d.ellipse((W - 186, H - 134, W - 96, H - 44), outline=col, width=4)
    d.text((W - 141, H - 89), "360", font=font(30, True), fill=col, anchor="mm")
    im.save(out, quality=88)
    return out

def build_all():
    reg = json.load(open(SITE + "experiences/registry.json"))
    made = 0
    for e in reg["experiences"]:
        if e.get("type") == "worksheet":
            continue
        exp_path = SITE + "experiences/" + e["id"] + ".json"
        if not os.path.exists(exp_path):
            continue
        exp = json.load(open(exp_path))
        sc = exp["scenes"][0]
        stem = os.path.basename(sc["img"]).replace("_360.jpg", "").replace(".jpg", "").replace("_Part1", "")
        stations = sum(len(s["stations"]) for s in exp["scenes"])
        keywords = [st["name"] for s2 in exp["scenes"] for st in s2["stations"] if st.get("label") != "★"][:6]
        extras = []
        if e.get("worksheet"): extras.append("worksheet")
        if e.get("sprint"): extras = ["replayable", "personal best"]
        out_rel = "img/" + stem + "_card.jpg"
        card(SITE + "experiences/" + out_rel, e["topic"], e.get("lesson"), e["title"],
             keywords, stations, e.get("badge"), extras)
        e["thumb"] = out_rel
        made += 1
    json.dump(reg, open(SITE + "experiences/registry.json", "w"), indent=1, ensure_ascii=False)
    print("cards made:", made)

if __name__ == "__main__":
    build_all()
