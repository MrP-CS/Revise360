"""Put the code-writing questions into their experiences.

Each one is added as an extra task on an existing station, so it sits with the
content it practises. Safe to run again: a question already there is left alone.

  python3 applycode.py            # show what would change
  python3 applycode.py --write
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE
from codequestions import QUESTIONS
import json

def main(write):
    added, touched = 0, {}
    for eid, station, q in QUESTIONS:
        p = SITE / "experiences" / f"{eid}.json"
        if not p.exists():
            print(f"  {eid}: no experience file, skipped"); continue
        d = touched.get(str(p)) or json.load(open(p))
        sc = d["scenes"][0]
        core = [s for s in sc["stations"] if s.get("label") != "★"]
        if station >= len(core):
            print(f"  {eid}: station {station} does not exist ({len(core)})"); continue
        st = core[station]
        if any(t.get("t") == "code" and t.get("q") == q["q"] for t in st["tasks"]):
            continue
        st["tasks"].append(q)
        print(f"  add   {eid:8} station {station} '{st['name']}'  {q['marks']} marks, {len(q['tests'])} tests")
        added += 1
        touched[str(p)] = d
    print(f"\n{added} code question(s) added, {len(touched)} experiences touched")
    if write:
        for path, d in touched.items():
            json.dump(d, open(path, "w"), indent=1, ensure_ascii=False)
        print("written")
    else:
        print("(dry run; pass --write to apply)")

if __name__ == "__main__":
    main("--write" in sys.argv)
