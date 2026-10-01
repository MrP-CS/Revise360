"""Put the 3D model buttons in their uniform places, and add the new ones.

Model markers are player sprites positioned from the experience JSON, not drawn
into the 360 image, so this changes nothing about the rendered scenes and needs
no rebuild.

It does two things, and is safe to run again at any time:

  1. Moves every model button that already exists onto the top right corner of
     the station panel it belongs to, which is where kit.py now puts them.
  2. Adds the placements listed in newmodels.py.

Most of these lessons have a specs module, and the models are written into that
too, so a rebuild keeps them. Three do not - nw-l04 and nw-l05 are drawn by
bespoke scripts, and 1.6's spec was lost - so for those this script is the only
record, and it must be re-run if those scenes are ever rebuilt.

  python3 applymodels.py            # show what would change
  python3 applymodels.py --write
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE
from kit import STATION_WALLS, MODEL_POS, MODEL_Y
from newmodels import PLACEMENTS, RELOCATE
import json

def station_of(face, x):
    for i, (f, x0) in enumerate(STATION_WALLS):
        if f == face and x0 <= x <= x0 + 880:
            return i
    return None

def load(eid):
    p = SITE / "experiences" / f"{eid}.json"
    return p, json.load(open(p))

def main(write):
    moved = added = 0
    touched = {}

    # 1. existing buttons -> the uniform position
    for p in sorted((SITE / "experiences").glob("*.json")):
        if p.name == "registry.json":
            continue
        d = json.load(open(p))
        if "scenes" not in d:
            continue
        eid, ch = p.stem, False
        for sc in d["scenes"]:
            for m in sc.get("models", []):
                st = station_of(m["face"], m["x"])
                if st is None:
                    st = RELOCATE.get((eid, m["model"]))
                if st is None:
                    print(f"  {eid}: '{m['title']}' is not on a station panel; "
                          f"add it to RELOCATE in newmodels.py")
                    continue
                face, x = MODEL_POS[st]
                if (m["face"], m["x"], m["y"]) != (face, x, MODEL_Y):
                    print(f"  move  {eid:10} {m['model']:12} -> station {st} top right")
                    m["face"], m["x"], m["y"] = face, x, MODEL_Y
                    ch = True; moved += 1
        if ch:
            touched[str(p)] = d

    # 2. the new placements
    by_exp = {}
    for eid, st, kind, title, text in PLACEMENTS:
        by_exp.setdefault(eid, []).append((st, kind, title, text))
    for eid, items in by_exp.items():
        p = SITE / "experiences" / f"{eid}.json"
        if not p.exists():
            print(f"  {eid}: no experience file, skipped"); continue
        d = touched.get(str(p)) or json.load(open(p))
        sc = d["scenes"][0]
        have = {(m["model"], m["x"], m["face"]) for m in sc.get("models", [])}
        models = list(sc.get("models", []))
        n_core = len([s for s in sc["stations"] if s.get("label") != "★"])
        for st, kind, title, text in items:
            if st >= n_core:
                print(f"  {eid}: station {st} does not exist ({n_core} stations)"); continue
            face, x = MODEL_POS[st]
            if (kind, x, face) in have:
                continue
            models.append(dict(id="", face=face, x=x, y=MODEL_Y,
                               model=kind, title=title, text=text))
            print(f"  add   {eid:10} {kind:12} -> station {st} '"
                  f"{[s['name'] for s in sc['stations'] if s.get('label') != '★'][st]}'")
            added += 1
        for i, m in enumerate(models):
            m["id"] = f"m{i+1}"
        sc["models"] = models
        touched[str(p)] = d

    print(f"\n{moved} buttons moved, {added} models added, {len(touched)} experiences touched")
    if write:
        for path, d in touched.items():
            json.dump(d, open(path, "w"), indent=1, ensure_ascii=False)
        print("written")
    else:
        print("(dry run; pass --write to apply)")

if __name__ == "__main__":
    main("--write" in sys.argv)
