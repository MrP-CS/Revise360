# Quality control for the rendered experience scenes.
# Extracts true cube faces from each equirectangular image and looks for:
#   - text spilling past the bottom or side of its panel
#   - an illustration box that came out empty (a missing icon)
#   - the two halves of a "stack" row running into each other
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE
import numpy as np, json, glob, math
from PIL import Image

EXP = str(SITE / "experiences") + "/"
IMG = EXP + "img/"
FACE = 1024                      # working resolution per face
PANELS = [(100, 980), (1068, 1948)]      # panel x bounds at 2048 scale
TOP, BOT = 330, 1800

def faces_from(path, size=FACE):
    """Inverse cubemap projection: equirect -> the three station walls."""
    src = np.asarray(Image.open(path).convert("RGB"), dtype=np.uint8)
    H, W = src.shape[:2]
    g = (np.arange(size) + 0.5) / size * 2 - 1
    gx, gy = np.meshgrid(g, g)
    dirs = {
        "right": (np.ones_like(gx), -gy, -gx),
        "back":  (-gx, -gy, -np.ones_like(gx)),
        "left":  (-np.ones_like(gx), -gy, gx),
        "front": (gx, -gy, np.ones_like(gx)),
    }
    out = {}
    for name, (x, y, z) in dirs.items():
        n = np.sqrt(x*x + y*y + z*z)
        x, y, z = x/n, y/n, z/n
        lon = np.arctan2(x, z)              # matches the player's world() mapping
        lat = np.arcsin(np.clip(y, -1, 1))
        u = (lon / (2*math.pi) + 0.5) % 1.0
        v = 0.5 - lat / math.pi
        out[name] = src[np.clip((v*H).astype(int), 0, H-1), np.clip((u*W).astype(int), 0, W-1)]
    return out

def ink_mask(face):
    g = face.astype(np.float32).mean(axis=2)
    bg = np.percentile(g, 20)
    return (g - bg) > 30

def scan(path):
    """Return a list of problems found in one scene image."""
    out = []
    sc = FACE / 2048.0
    for fname, arr in faces_from(path).items():
        if fname == "front": continue
        m = ink_mask(arr)
        for pi, (px0, px1) in enumerate(PANELS):
            X0, X1 = int(px0*sc), int(px1*sc)
            # 1. text spilling below the panel
            band = m[int(1806*sc):int(1870*sc), X0+6:X1-6]
            if band.mean() > 0.055:
                out.append((fname, pi+1, "text below the panel", round(float(band.mean()), 3)))
            # 2. text spilling past the side of the panel
            left = m[int(TOP*sc):int(BOT*sc), max(0, X0-18):X0-2]
            right = m[int(TOP*sc):int(BOT*sc), X1+2:min(FACE, X1+18)]
            for side, b in (("left", left), ("right", right)):
                if b.size and b.mean() > 0.05:
                    out.append((fname, pi+1, f"text past the {side} edge", round(float(b.mean()), 3)))
            # 3. an empty illustration box
            box = m[int(500*sc):int(850*sc), X0+30:X1-30]
            if box.size and box.mean() < 0.012:
                out.append((fname, pi+1, "illustration looks empty", round(float(box.mean()), 4)))
            # 4. two labels colliding on one row (a "stack" row with no gap between
            #    the left label and the right description)
            ill = m[int(495*sc):int(880*sc), X0+34:X1-34]
            if ill.size:
                cols = ill.sum(axis=1)
                rows_with_text = np.where(cols > ill.shape[1] * 0.04)[0]
                # group them into text lines
                grp, cur = [], []
                for r in rows_with_text:
                    if cur and r - cur[-1] > 3: grp.append(cur); cur = []
                    cur.append(r)
                if cur: grp.append(cur)
                for lineset in grp:
                    strip = ill[lineset[0]:lineset[-1]+1]
                    colink = strip.any(axis=0)
                    if colink.mean() < 0.55: continue        # not a full-width line
                    # longest run of blank columns inside the inked span
                    idx = np.where(colink)[0]
                    if idx.size < 10: continue
                    inner = colink[idx[0]:idx[-1]+1]
                    best = run = 0
                    for v in inner:
                        run = 0 if v else run + 1
                        best = max(best, run)
                    if best < int(10*sc):
                        out.append((fname, pi+1, "labels collide on one row", f"gap {best}px"))
    return out

if __name__ == "__main__":
    reg = json.load(open(EXP + "registry.json"))
    imgs = []
    for e in reg["experiences"]:
        if e.get("type") == "worksheet": continue
        f = EXP + e["id"] + ".json"
        if not os.path.exists(f): continue
        for s in json.load(open(f))["scenes"]:
            p = EXP + s["img"]
            if os.path.exists(p): imgs.append((e["id"], s["id"], p))
    print(f"scanning {len(imgs)} scene images\n")
    total = 0
    for eid, sid, p in imgs:
        probs = scan(p)
        if probs:
            total += len(probs)
            print(f"{eid} [{sid}]")
            for q in probs: print("   ", q[0], "panel", q[1], "-", q[2], q[3])
    print(f"\n{total} issues across {len(imgs)} scenes")
