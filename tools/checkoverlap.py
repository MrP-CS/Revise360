"""Find station, info and 3D badges that sit on top of wall text.

import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
A badge is a sprite 5.2 units across on a sphere of radius 38, so it covers about
7.8 degrees. The scene image is equirectangular 4096x2048, so 1 degree = 11.4 px.
We sample the disc the badge covers and measure how much 'ink' (text and panel edges)
is underneath it, ignoring the badge's own colour since it isn't in the image.
"""
import json, math, glob, os
import numpy as np
from PIL import Image

SITE = SITE_S
RAD = {"st": 5.2, "info": 2.6, "model": 3.4}     # sprite sizes from player.js

def cube_from(o):
    if isinstance(o.get("pos"), list): return o["pos"]
    u, v = o["x"] / 2048, o["y"] / 2048
    f = o.get("face", "down")
    return {"front": [2*u-1, 1-2*v, 1], "right": [1, 1-2*v, 1-2*u], "back": [1-2*u, 1-2*v, -1],
            "left": [-1, 1-2*v, 2*u-1], "up": [2*u-1, 1, 2*v-1]}.get(f, [2*u-1, -1, 1-2*v])

def to_equirect(p, W, H):
    # the player maps cube point p to world (-z, y, -x); the sphere texture is mapped
    # the same way the images were rendered by kit.py
    x, y, z = p
    d = np.array([x, y, z], dtype=float); d /= np.linalg.norm(d)
    lon = math.atan2(d[0], d[2]); lat = math.asin(max(-1, min(1, d[1])))
    return ((lon / (2*math.pi) + 0.5) % 1.0) * W, (0.5 - lat / math.pi) * H

def ink_fraction(img, cx, cy, r):
    W, H = img.size
    x0, x1 = int(cx - r), int(cx + r)
    y0, y1 = max(0, int(cy - r)), min(H, int(cy + r))
    if y1 <= y0: return 0.0, 0
    xs = [(x % W) for x in range(x0, x1)]
    a = np.asarray(img.convert("L"), dtype=np.int16)
    patch = a[y0:y1][:, xs]
    if patch.size == 0: return 0.0, 0
    # 'ink' = pixels much brighter than the local panel background (white/yellow text)
    bg = np.percentile(patch, 35)
    return float((patch > bg + 60).mean()), patch.size

rows = []
for f in sorted(glob.glob(SITE + "experiences/*.json")):
    if os.path.basename(f) in ("registry.json", "topics.json"): continue
    exp = json.load(open(f))
    for sc in exp.get("scenes", []):
        path = SITE + "experiences/" + sc["img"]
        if not os.path.exists(path): continue
        img = Image.open(path); W, H = img.size
        deg = lambda size: math.degrees(2 * math.atan((size / 2) / 38))
        for kind, items in (("st", sc.get("stations", [])), ("info", sc.get("info", [])), ("model", sc.get("models", []))):
            for it in items:
                p = cube_from(it)
                cx, cy = to_equirect(p, W, H)
                r = deg(RAD[kind]) / 360 * W / 2
                frac, n = ink_fraction(img, cx, cy, r)
                rows.append((exp["id"], sc["id"], kind, it.get("label") or it.get("id"), it.get("name") or it.get("title", ""), round(frac, 3)))

rows.sort(key=lambda r: -r[-1])
bad = [r for r in rows if r[-1] > 0.12]
print(f"{len(rows)} badges checked, {len(bad)} sitting on a lot of ink\n")
for r in bad[:40]: print(f"  {r[5]:.3f}  {r[0]:<14} {r[2]:<6} {str(r[3]):<3} {r[4][:42]}")
print("\nink fraction distribution:", [round(np.percentile([r[-1] for r in rows], q), 3) for q in (50, 75, 90, 95, 99)])
