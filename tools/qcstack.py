import os
# Detect the one defect the renderer really has: in a "stack" illustration row the
# label is drawn left-anchored and its description right-anchored with no width
# check, so long pairs run into each other.
import sys, json, os, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qcscenes import faces_from, EXP

def classify(arr):
    a = arr.astype(np.float32)
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    return (sat > 0.33) & (mx > 95), (sat < 0.20) & (mx > 165)

def scan(path):
    hits = []
    sc = 0.5
    for fname, arr in faces_from(path).items():
        if fname == "front": continue
        col, wht = classify(arr)
        for pi, (px0, px1) in enumerate(((100, 980), (1068, 1948))):
            X0, X1 = int(px0*sc)+38, int(px1*sc)-38
            W = X1 - X0
            y = int(495*sc)
            while y < int(885*sc):
                c = col[y:y+8, X0:X1].any(axis=0); w = wht[y:y+8, X0:X1].any(axis=0)
                if c.sum() > 12 and w.sum() > 12:
                    ci, wi = np.where(c)[0], np.where(w)[0]
                    label_left = ci.min() < wi.min()          # label sits left of the text
                    desc_right = wi.max() > W - 26            # description is right-anchored
                    gap = wi.min() - ci.max()
                    # a stack row is wrapped in a coloured box; icon captions are not
                    boxed = False
                    for dy in range(4, 32):
                        for yy in (y - dy, y + dy):
                            if 0 <= yy < col.shape[0] and col[yy, X0:X1].mean() > 0.55:
                                boxed = True
                        if boxed: break
                    if label_left and desc_right and boxed and -70 < gap < 12:
                        hits.append((fname, pi+1, int(y/sc), int(gap)))
                        y += 40; continue
                y += 8
    return hits

if __name__ == "__main__":
    reg = json.load(open(EXP + "registry.json"))
    total, scenes = 0, 0
    for e in reg["experiences"]:
        if e.get("type") == "worksheet": continue
        f = EXP + e["id"] + ".json"
        if not os.path.exists(f): continue
        for s in json.load(open(f))["scenes"]:
            p = EXP + s["img"]
            if not os.path.exists(p): continue
            scenes += 1
            h = scan(p)
            if h:
                total += len(h)
                print(f"{e['id']} [{s['id']}]  " + ", ".join(f"{a} panel {b} (gap {d}px)" for a, b, c, d in h))
    print(f"\n{total} colliding rows across {scenes} scenes")
