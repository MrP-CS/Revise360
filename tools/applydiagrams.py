"""Put the 2D diagram buttons into the experiences.

Diagram markers are player sprites positioned from the experience JSON, not
drawn into the 360 image, so this changes nothing about the rendered scenes and
needs no rebuild. The button goes at the top LEFT of its station panel, opposite
the 3D button at the top right, with the info icon centred between them.

Safe to run again at any time: a diagram already on the right panel is left
alone.

  python3 applydiagrams.py            # show what would change
  python3 applydiagrams.py --write
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE
from kit import DIAG_POS, DIAG_Y
from newdiagrams import PLACEMENTS
import json

def main(write):
    added = 0
    touched = {}
    by_exp = {}
    for eid, st, kind, title, text in PLACEMENTS:
        by_exp.setdefault(eid, []).append((st, kind, title, text))

    for eid, items in sorted(by_exp.items()):
        p = SITE / "experiences" / f"{eid}.json"
        if not p.exists():
            print(f"  {eid}: no experience file, skipped"); continue
        d = json.load(open(p))
        sc = d["scenes"][0]
        n_core = len([s for s in sc["stations"] if s.get("label") != "★"])
        names = [s["name"] for s in sc["stations"] if s.get("label") != "★"]
        diagrams = list(sc.get("diagrams", []))
        have = {(m["diagram"], m["x"], m["face"]) for m in diagrams}
        changed = False
        for st, kind, title, text in items:
            if st >= n_core:
                print(f"  {eid}: station {st} does not exist ({n_core} stations)"); continue
            face, x = DIAG_POS[st]
            if (kind, x, face) in have:
                continue
            diagrams.append(dict(id="", face=face, x=x, y=DIAG_Y,
                                 diagram=kind, title=title, text=text))
            print(f"  add   {eid:10} {kind:14} -> station {st} '{names[st]}'")
            added += 1; changed = True
        if not changed:
            continue
        for i, m in enumerate(diagrams):
            m["id"] = f"d{i+1}"
        sc["diagrams"] = diagrams
        touched[str(p)] = d

    print(f"\n{added} diagrams added, {len(touched)} experiences touched")
    if write:
        for path, d in touched.items():
            json.dump(d, open(path, "w"), indent=1, ensure_ascii=False)
        print("written")
    else:
        print("(dry run; pass --write to apply)")

if __name__ == "__main__":
    main("--write" in sys.argv)
