"""Derive a deck spec from the lesson specs, instead of hand-writing one.

deckspecs/deck21.json was written by hand. That was a mistake to repeat 23 more
times: every field in it already exists in the specs module that builds the
scene and the worksheet, so the deck can be derived from the same single source
and cannot drift from the experience it is teaching.

  python3 mkdeck.py 2.4                 # writes deckspecs/deck24.json
  python3 mkdeck.py 2.1 --check         # regenerate 2.1 and diff, writing nothing

The --check run on 2.1 is the test that this produces what was hand-authored.
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import TOOLS
import json, importlib

# topic -> (module names, lesson attribute names in teaching order)
TOPICS = {
    "1.4": (["specs14a", "specs14b"], None),
    "2.3": (["specs23"], None),
    "2.4": (["specs24"], None),
    "2.1": (["specs21"], None),
    "1.1": (["specs11"], None),
    "1.2": (["specs12a", "specs12b", "specs12c"], None),
    "1.3": (["specs13"], None),
}

def wsfile(L):
    return L["img"].replace("_360", "") + "_Worksheet.docx"

def reg_id(L):
    """The id the site uses. Some specs label lessons 'rp-lesson1' internally
    while the registry and the experience files use 'rp-l01'; the deck should
    carry the id you can actually look up."""
    pre = L["id"].split("-")[0]
    return f"{pre}-l{L['lesson']:02d}"

def entry(L):
    """One lesson, in the field order deck21.json established."""
    W = L["ws"]
    d = {}
    d["id"] = reg_id(L)
    d["lesson"] = L["lesson"]
    d["title"] = L["title"]
    d["topic"] = L["topic"]
    d["kicker"] = L["kicker"]
    d["subtitle"] = L["subtitle"]
    d["intro"] = L["intro"]
    d["keywords"] = L["keywords"]
    d["objectives"] = W["objectives"]
    if W.get("starter") is not None:
        d["starter"] = W["starter"]
    if W.get("keyq") is not None:
        d["keyq"] = W["keyq"]
    d["keyterms"] = W.get("keyterms", [])
    d["stations"] = [{k: s[k] for k in ("name", "bullets", "challenge", "fact") if k in s}
                     for s in L["stations"]]
    d["final"] = {k: L["final"][k] for k in ("name", "intro") if k in L["final"]}
    d["info"] = [dict(title=t, text=x) for (_, t, x) in L["info"]]
    d["exam"] = [dict(q=e[0], marks=e[1]) for e in W.get("exam", [])]
    d["confidence"] = W["confidence"]
    d["wsfile"] = wsfile(L)
    return d

def lessons_for(topic):
    """Every lesson object in the topic's spec modules, in lesson order."""
    mods, order = TOPICS[topic]
    found = {}
    for name in mods:
        m = importlib.import_module(name)
        for attr in dir(m):
            if attr.startswith("_"):
                continue
            v = getattr(m, attr)
            if isinstance(v, dict) and v.get("topic") == topic and "stations" in v and "ws" in v:
                found[v["lesson"]] = v
    return [found[k] for k in sorted(found)]

if __name__ == "__main__":
    topic = sys.argv[1]
    check = "--check" in sys.argv
    out = TOOLS / "deckspecs" / f"deck{topic.replace('.', '')}.json"
    deck = [entry(L) for L in lessons_for(topic)]
    text = json.dumps(deck, indent=1, ensure_ascii=False)
    if check:
        have = out.read_text() if out.exists() else ""
        if have.strip() == text.strip():
            print(f"{out.name}: identical ({len(deck)} lessons)")
        else:
            old = json.loads(have) if have else []
            print(f"{out.name}: DIFFERS  (generated {len(deck)} lessons, on disk {len(old)})")
            for i, (a, b) in enumerate(zip(deck, old)):
                for k in sorted(set(a) | set(b)):
                    if a.get(k) != b.get(k):
                        print(f"  lesson {i+1} field '{k}' differs")
                        print(f"    generated: {json.dumps(a.get(k), ensure_ascii=False)[:220]}")
                        print(f"    on disk  : {json.dumps(b.get(k), ensure_ascii=False)[:220]}")
        sys.exit(0)
    out.write_text(text)
    print(f"wrote {out} - {len(deck)} lessons: " + ", ".join(f"L{d['lesson']} {d['title']}" for d in deck))
