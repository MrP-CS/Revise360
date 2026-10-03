"""Does the public site say anything that is not true of what it ships?

Marketing copy ages badly: a count was right when it was written, a topic was
added, a generator stopped producing answer slides. Nobody notices, because the
sentence still reads well. So each claim that can be checked against the product
is written here as a rule, with the thing it is checked against, and the build
fails when one stops being true.

Rules are deliberately specific. "Every lesson across all ten topics has a lesson
PowerPoint" is checkable: count the topics, count the lessons, count the decks.
A claim that cannot be checked - "gives revision a new perspective" - is not in
here, because a test that passes on anything is not a test.

    python3 tools/audit_claims.py           # report
    python3 tools/audit_claims.py --fix-me  # also print what each should say
"""
import os
import re
import sys
import glob
import json
import html
import zipfile
import collections

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from paths import SITE_S                                       # noqa: E402

ROOT = SITE_S.rstrip("/")
PAGES = ["index.html", "about.html", "teachers.html", "topics.html", "guides.html",
         "signup.html", "join.html"]


def visible(page):
    """The words a visitor reads: no scripts, no styles, no tags."""
    try:
        s = open(os.path.join(ROOT, page), encoding="utf-8").read()
    except FileNotFoundError:
        return ""
    s = re.sub(r"<script.*?</script>|<style.*?</style>|<!--.*?-->", " ", s, flags=re.S)
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", s)).split())


def facts():
    """What is actually true, counted from the product."""
    inv = json.load(open(os.path.join(ROOT, "build", "inventory.json"), encoding="utf-8"))
    lessons = [l for u in inv["units"] for l in u["lessons"]]
    kinds = collections.Counter(l["kind"] for l in lessons)
    decks = [l for l in lessons if l.get("deck")]
    sheets = [l for l in lessons if l.get("worksheet")]
    answer_decks = 0
    for f in glob.glob(os.path.join(ROOT, "presentations", "*.pptx")):
        try:
            z = zipfile.ZipFile(f)
            t = " ".join(" ".join(re.findall(r"<a:t>([^<]*)</a:t>", z.read(n).decode()))
                         for n in z.namelist()
                         if n.startswith("ppt/slides/slide") and n.endswith(".xml"))
        except Exception:
            continue
        if re.search(r"(?i)(sample answers|: answers|model answer)", t):
            answer_decks += 1
    packs = {}
    p = os.path.join(ROOT, "packs", "index.json")
    if os.path.exists(p):
        packs = json.load(open(p, encoding="utf-8")).get("units", {})
    plans = {}
    p = os.path.join(ROOT, "lessonplans", "index.json")
    if os.path.exists(p):
        plans = json.load(open(p, encoding="utf-8")).get("plans", {})
    return dict(
        topics=len(inv["units"]), lessons=len(lessons),
        experiences=kinds["experience"] + kinds["challenge"],
        decks=len(decks), worksheets=len(sheets),
        lessons_without_deck=len(lessons) - len(decks),
        decks_total=len(glob.glob(os.path.join(ROOT, "presentations", "*.pptx"))),
        answer_decks=answer_decks,
        units_with_packs=len(packs), plans=len(plans),
        python_lessons=sum(1 for l in lessons if l["topic"] == "PY"),
    )


def main(argv):
    f = facts()
    bad = []

    def rule(name, ok_, says, truth):
        print(("  ok  " if ok_ else " FAIL ") + name)
        if not ok_:
            print("        it says: %s" % says)
            print("        truth:   %s" % truth)
            bad.append(name)

    text = {p: visible(p) for p in PAGES}
    everywhere = " ".join(text.values())

    # 1. how many topics
    wrong = [p for p, t in text.items()
             if re.search(r"(?i)\ball (?:ten|nine|eleven) topics\b", t)
             or re.search(r"(?i)\bExplore (?:nine|ten|eleven) topics\b", t)]
    rule("the number of topics is right",
         not wrong, "a fixed number of topics on %s" % (wrong or "-"),
         "there are %d" % f["topics"])

    # 2. every lesson has a deck
    claims_all = [p for p, t in text.items()
                  if re.search(r"(?i)every lesson [^.]*has (?:a lesson powerpoint|one)", t)]
    rule("no page claims every lesson has a PowerPoint",
         not claims_all or f["lessons_without_deck"] == 0,
         "every lesson has a lesson PowerPoint (%s)" % (claims_all or "-"),
         "%d of %d lessons have one; %d do not"
         % (f["decks"], f["lessons"], f["lessons_without_deck"]))

    # 3. answers in the decks
    says_answers = [p for p, t in text.items()
                    if re.search(r"(?i)(plenary (?:model )?answers|answers appear later "
                                 r"in the deck|plenary answers)", t)]
    rule("no page promises answers in every deck",
         not says_answers or f["answer_decks"] == f["decks_total"],
         "the decks carry plenary answers (%s)" % (says_answers or "-"),
         "%d of %d decks carry an answers slide" % (f["answer_decks"], f["decks_total"]))

    # 4. the counts shown on the homepage
    for label, key in (("topics to explore", "topics"),
                       ("interactive experiences", "experiences"),
                       ("lesson PowerPoint", "decks_total")):
        m = re.search(r"(\d+)\s+" + re.escape(label), text.get("index.html", ""))
        if not m:
            continue
        rule("the homepage count for %r" % label, int(m.group(1)) == f[key],
             "%s %s" % (m.group(1), label), "%d" % f[key])

    # 5. nothing claims a feature that is not built
    cfg = open(os.path.join(ROOT, "js", "config.js"), encoding="utf-8").read()
    has_backend = bool(re.search(r'backendUrl:\s*["\'][^"\']+["\']', cfg))
    for phrase, what in (
            (r"(?i)microsoft sign[- ]in", "Microsoft sign-in"),
            (r"(?i)\bsubscription", "subscriptions"),
            (r"(?i)set an assignment|assignments for your class", "assignments")):
        guilty = []
        for p, t in text.items():
            for m in re.finditer(phrase, t):
                near = t[max(0, m.start() - 120):m.end() + 120]
                if re.search(r"(?i)not (?:yet )?(?:enabled|available)|require[sd]? the hosted|"
                             r"coming|not supported", near):
                    continue
                guilty.append(p)
        rule("%s is not promised as working" % what, not guilty,
             "%s on %s" % (what, sorted(set(guilty)) or "-"),
             "there is no backend in this build" if not has_backend
             else "a backend is configured")

    # 6. nothing invents evidence
    for phrase, what in ((r"(?i)\b\d+% of (?:students|pupils|teachers)", "a statistic"),
                         (r"(?i)guaranteed? (?:a )?grade", "a grade guarantee"),
                         (r"(?i)proven to (?:improve|raise)", "a proven-outcome claim"),
                         (r"[“\"][^”\"]{40,}[”\"]\s*[-—]\s*[A-Z][a-z]+ [A-Z]",
                          "something that reads like a testimonial")):
        hit = [p for p, t in text.items() if re.search(phrase, t)]
        rule("no %s" % what, not hit, "%s on %s" % (what, hit or "-"), "none exists")

    # 7. the downloads are only advertised if they are there
    says_units = [p for p, t in text.items()
                  if re.search(r"(?i)whole[- ]unit download|download (?:the )?(?:whole|entire) unit", t)]
    rule("whole-unit downloads are only advertised when built",
         not says_units or f["units_with_packs"] == f["topics"],
         "whole-unit downloads (%s)" % (says_units or "-"),
         "%d of %d units have packs" % (f["units_with_packs"], f["topics"]))
    says_plans = [p for p, t in text.items()
                  if re.search(r"(?i)lesson plan for (?:each|every)", t)]
    rule("a lesson plan per experience is only advertised when built",
         not says_plans or f["plans"] >= f["lessons"],
         "a lesson plan for every experience (%s)" % (says_plans or "-"),
         "%d plans for %d lessons" % (f["plans"], f["lessons"]))

    # 8. the experiences are not implied to be downloadable
    rule("nothing implies the experiences can be downloaded",
         not re.search(r"(?i)(download (?:the )?experience|offline (?:copy|version) of "
                       r"(?:the )?(?:experience|revise)|export the unit)", everywhere),
         "a downloadable experience", "they are website-only")

    # 9. instant marking
    says_all_marked = [p for p, t in text.items()
                       if re.search(r"(?i)every (?:question|answer) is marked", t)]
    rule("marking is not overstated", not says_all_marked,
         "every question is marked (%s)" % (says_all_marked or "-"),
         "a Try it is completed by running it and is not marked; the course says so "
         "on the activity itself")

    print()
    print("the facts, for writing copy against:")
    for k, v in sorted(f.items()):
        print("   %-22s %s" % (k, v))
    print()
    if bad:
        print("%d claim(s) the product does not support" % len(bad))
        return 1
    print("every checkable claim on the public pages is true of what ships")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
