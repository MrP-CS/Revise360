"""Check the numbers the site claims about itself against the registry.

The home page advertises how many topics, experiences and lesson PowerPoints
there are. Those are typed by hand, so they go stale every time content is
added, and nothing fails when they do: the page just quietly understates the
site. This compares each claim with what is actually in the registry.

  python3 qcclaims.py
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE
import json, re

def counts():
    reg = json.load(open(SITE / "experiences" / "registry.json"))["experiences"]
    interactive = [e for e in reg if e.get("type") != "worksheet"]
    return {
        "topics to explore": len({e["topic"] for e in reg if e.get("topic")}),
        "interactive experiences": len(interactive),
        "lesson PowerPoints": len([e for e in reg if e.get("powerpoint")]),
        "lesson rooms": len([e for e in interactive if not e["id"].endswith("-bonus")]),
        "worksheets": len([e for e in reg if e.get("worksheet")]),
    }

def main():
    c = counts()
    html = (SITE / "index.html").read_text()
    # the hero strip: <strong>NN</strong><span>label</span>
    claims = re.findall(r"<strong>([^<]+)</strong><span>([^<]+)</span>", html)
    print("what the home page claims, against the registry:\n")
    bad = 0
    for value, label in claims:
        label = label.strip()
        if label not in c:
            print(f"  {label:26} {value:>6}   (not a counted figure, skipped)")
            continue
        real = c[label]
        ok = value.strip().lstrip("0") == str(real) or value.strip() == str(real)
        print(f"  {label:26} {value:>6}   registry says {real:>3}   {'ok' if ok else 'STALE'}")
        bad += 0 if ok else 1

    # every topic with content should be linked from the course preview
    # Topic ids are not all spec numbers - the Python course is "PY"
    linked = set(re.findall(r'topics\.html\?topic=([0-9A-Za-z.]+)', html))
    reg = json.load(open(SITE / "experiences" / "registry.json"))["experiences"]
    live = {e["topic"] for e in reg if e.get("topic")}
    missing = sorted(live - linked)
    print(f"\n  topics with content but not linked from the home page: {missing or 'none'}")
    bad += len(missing)

    # claims about which topics have decks go stale the same way
    stale_phrases = [p for p in re.findall(r"[^<>]*(?:currently cover|cover Topics)[^<>]*", html)]
    if stale_phrases:
        print("\n  phrases naming specific topics (check these by hand):")
        for p in stale_phrases: print("   ", p.strip()[:110])
        bad += len(stale_phrases)

    print("\n" + ("All figures match." if not bad else f"{bad} thing(s) to fix."))
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main())
