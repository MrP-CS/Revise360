"""Find illustrations whose text does not fit the box it is drawn in.

qcscenes.py measures text against the station PANEL, so it never saw text
overflowing a box drawn INSIDE a panel: a tile label running past its tile and
colliding with the next one, or a table cell running out of its column. Topic
1.5 shipped with both for months.

Rather than re-render every scene to find them, this replays the layout
arithmetic from kit.py against the spec data, under the old sizing rule and the
new one, and reports every illustration where they disagree. A disagreement
means that scene renders differently now, and so needs rebuilding.

  python3 qcfit.py              # report
  python3 qcfit.py --ids        # just the experience ids needing a re-render
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE
import importlib, json
from PIL import Image, ImageDraw
from lib360 import font
from kit import _wrap

SPECS = ["specs11", "specs12a", "specs12b", "specs12c", "specs13",
         "specs14a", "specs14b", "specs15", "specs21", "specspy", "specs23", "specs24"]
D = ImageDraw.Draw(Image.new("RGB", (10, 10)))

# Default: does anything overflow its box as things are rendered NOW? That is
# the regression test. --changed instead lists the scenes whose rendering moved
# when the sizing rule was fixed, which is the list of scenes to rebuild.
CHANGED = "--changed" in sys.argv

# station_fit: the illustration box is x0+40 .. x0+w-40, height ill_h, and
# ill_h is whichever of these leaves the bullets and challenge inside the panel.
ILL_HEIGHTS = [360, 340, 320, 300, 280, 260]
PANEL_W = 880

def tiles_size(items, cols, w_box, h_box, new):
    """Font size the tiles renderer settles on, old rule vs new."""
    n = len(items)
    rows = (n + cols - 1) // cols
    gap = 14
    w = (w_box - gap * (cols - 1)) / cols
    h = min(150, (h_box - gap * (rows - 1)) / rows)
    out = []
    for it in items:
        text = it[0] if isinstance(it, (list, tuple)) else it
        fs = int(min(40, max(22, h * 0.3))); f = font(fs, True)
        lines = _wrap(D, text, f, w - 30)
        if new:
            def over(lines, f):
                return (len(lines) > 2 or len(lines) * f.size * 1.15 > h - 10
                        or max(D.textlength(ln, font=f) for ln in lines) > w - 24)
            while over(lines, f) and fs > 13:
                fs -= 1; f = font(fs, True); lines = _wrap(D, text, f, w - 30)
        else:
            while (len(lines) > 2 or len(lines) * fs * 1.15 > h - 10) and fs > 18:
                fs -= 2; f = font(fs, True); lines = _wrap(D, text, f, w - 30)
        widest = max(D.textlength(ln, font=f) for ln in lines)
        out.append((text, fs, widest, w - 24))
    return out

def table_size(head, rows, w_box, new):
    n = len(head)
    w = w_box / n
    out = []
    for t, bold in [(h, True) for h in head] + [(c, False) for r in rows for c in r]:
        if new:
            f = font(24, bold)
            while D.textlength(t, font=f) > w - 20 and f.size > 14:
                f = font(f.size - 1, bold)
        else:
            f = font(24, bold) if bold else (font(22) if D.textlength(t, font=font(24)) > w - 20 else font(24))
        out.append((t, f.size, D.textlength(t, font=f), w - 20))
    return out

def check(L):
    """Illustrations in one lesson whose rendering changes under the new rule."""
    found = []
    ills = [(s["name"], s.get("ill")) for s in L["stations"]]
    fin = L.get("final", {})
    if fin.get("ill"): ills.append(("final: " + fin.get("name", ""), fin["ill"]))
    for where, il in ills:
        if not il: continue
        kind = il[0]
        if kind == "tiles":
            items = il[1]; cols = il[2] if len(il) > 2 else 2
            # the final challenge box is a different size from a station's
            is_final = where.startswith("final")
            wb, hb = (PANEL_W - 80, 360) if not is_final else (2048 - 760, 710)
            for hcand in ([None] if is_final else ILL_HEIGHTS):
                h = hb if is_final else hcand
                old = tiles_size(items, cols, wb, h, False)
                new = tiles_size(items, cols, wb, h, True)
                if CHANGED:
                    bad = [(o[0], o[1], n[1], round(o[2]), round(o[3]))
                           for o, n in zip(old, new) if o[1] != n[1]]
                else:
                    bad = [(n[0], n[1], n[1], round(n[2]), round(n[3]))
                           for n in new if n[2] > n[3]]
                if bad:
                    found.append((where, kind, bad)); break
        elif kind == "table":
            head, rows = il[1], il[2]
            is_final = where.startswith("final")
            wb = (PANEL_W - 80) if not is_final else (2048 - 760)
            old = table_size(head, rows, wb, False)
            new = table_size(head, rows, wb, True)
            if CHANGED:
                bad = [(o[0], o[1], n[1], round(o[2]), round(o[3]))
                       for o, n in zip(old, new) if o[1] != n[1]]
            else:
                bad = [(n[0], n[1], n[1], round(n[2]), round(n[3]))
                       for n in new if n[2] > n[3]]
            if bad:
                found.append((where, kind, bad))
    return found

if __name__ == "__main__":
    ids_only = "--ids" in sys.argv
    need, total = [], 0
    for nm in SPECS:
        m = importlib.import_module(nm)
        for a in sorted(dir(m)):
            L = getattr(m, a)
            if not (isinstance(L, dict) and "stations" in L and "lesson" in L): continue
            probs = check(L)
            if not probs: continue
            need.append((nm, a, L["id"]))
            total += sum(len(p[2]) for p in probs)
            if not ids_only:
                print(f"{L['id']}  ({nm}.{a})")
                for where, kind, bad in probs:
                    print(f"   {kind:6} at {where}")
                    for text, o, n, wide, avail in bad:
                        flag = "OVERFLOWED" if wide > avail else "tightened"
                        print(f"      {text[:42]:44} {o}pt -> {n}pt   {flag} ({wide}px in {avail}px)")
    if ids_only:
        print(" ".join(f"{nm}:{a}" for nm, a, _ in need))
    elif CHANGED:
        print(f"\n{len(need)} scenes render differently under the fixed sizing rule "
              f"({total} labels/cells affected)")
    else:
        print(f"{len(need)} scenes contain text that overflows its box "
              f"({total} labels/cells)" if need else
              "No illustration text overflows its box.")
