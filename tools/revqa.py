"""Is the revision bank sound? Every check section 65 asks for, and a few more.

  python3 tools/revqa.py
  python3 tools/revqa.py --topic 1.2

What it holds:

  * every id is unique, well formed, and names the topic it is filed under;
  * every question carries a type the renderers can draw and the marker can mark;
  * marks are a value a GCSE paper uses, and the answer can actually support them
    - a four-mark written question with two mark points is a four-mark question
      nobody can get four marks for;
  * a selected-response question has a unique correct answer and real
    distractors, with no option repeated and none of them left blank;
  * the station a question sends a learner back to exists, is in the same unit as
    the question, and can be opened in an experience;
  * every outcome id named is an outcome the lesson actually has;
  * feedback exists, and a hint exists where a question is hard enough to want one;
  * nothing in the public bank gives its own answer away in its stem or its hint.

The last one is the same rule the rest of the course lives by. The bank is
published; a question whose hint contains the answer is an answer sheet in the
repository, which is the one thing this repository must not contain.
"""
import collections
import json
import re
import sys

import revschema as S

HINT_WANTED = ("written", "extended", "num", "trace", "truth", "codeout", "binadd",
               "binshift")


def words(s):
    return set(re.findall(r"[a-z0-9]+", str(s).lower()))


def main():
    topics = None
    if "--topic" in sys.argv:
        topics = [sys.argv[sys.argv.index("--topic") + 1]]
    stations = S.load_stations()
    bank = S.load_bank(topics)
    bad, warn = [], []
    seen = {}

    for q in bank:
        qid = q.get("id", "<no id>")

        def fail(said):
            bad.append("%s  %s" % (qid, said))

        # ---- identity
        m = S.ID_RE.match(qid)
        if not m:
            fail("id is not of the form rq-<topic>-<slug>-NNNN")
        elif m.group(1) != q["topic"]:
            fail("id says topic %s, the file says %s" % (m.group(1), q["topic"]))
        if qid in seen:
            fail("id is used twice (also %s)" % seen[qid])
        seen[qid] = q["file"]

        # ---- shape
        if q["type"] not in S.TYPES:
            fail("type %r is not one the renderers draw" % q["type"])
            continue
        for field in S.REQUIRED[q["type"]]:
            if field not in q:
                fail("a %s question needs %r" % (q["type"], field))
        if q["marks"] not in S.MARKS_ALLOWED:
            fail("%s marks is not a value a GCSE paper uses" % q["marks"])
        imp = S.implied_marks(q)
        if imp is not None and imp != q["marks"]:
            fail("worth %d marks but its answer supports %d" % (q["marks"], imp))
        if q.get("difficulty") not in S.DIFFICULTY:
            fail("difficulty %r is not one of %s" % (q.get("difficulty"), ", ".join(S.DIFFICULTY)))
        if q.get("commandWord") and q["commandWord"] not in S.COMMAND_WORDS:
            fail("command word %r is not one of the ones tracked" % q["commandWord"])
        if q.get("reviewStatus") not in S.REVIEW_STATUS:
            fail("reviewStatus %r is not DRAFT, VALIDATED or HUMAN_REVIEWED" % q.get("reviewStatus"))

        # ---- answers
        if q["type"] in ("mcq", "tf"):
            opts = q.get("options") or []
            if len(opts) < 3 and q["type"] == "mcq":
                fail("a multiple choice with %d options is not one" % len(opts))
            if len(set(opts)) != len(opts):
                fail("an option is repeated")
            if any(not str(o).strip() for o in opts):
                fail("an option is blank")
            if not isinstance(q.get("correct"), int) or not 0 <= q["correct"] < len(opts):
                fail("correct is not the index of one of the options")
        if q["type"] == "multi":
            if not q.get("correct"):
                fail("no correct options")
            elif len(q["correct"]) >= len(q.get("options") or []):
                fail("every option is correct")
        if q["type"] in ("truth", "trace"):
            rows, ans = q.get("rows") or [], q.get("answer") or []
            if len(rows) != len(ans):
                fail("the grid has %d rows and %d rows of answers" % (len(rows), len(ans)))
            elif any(len(r) != len(a) for r, a in zip(rows, ans)):
                fail("a grid row and its answers are different widths")
            elif any(len(r) != len(q.get("cols") or []) for r in rows):
                fail("a grid row does not have one cell per column")
            for r, row in enumerate(rows):
                for c, v in enumerate(row):
                    if v != "" and v != ans[r][c]:
                        fail("row %d column %d is given as %r and answered %r"
                             % (r + 1, c + 1, v, ans[r][c]))
        if q["type"] in S.WRITTEN + S.SELF_REVIEW:
            for p in q.get("markPoints") or []:
                if not p.get("accept"):
                    fail("mark point %r accepts nothing" % p.get("concept"))
                if q["type"] != "extended" and not p.get("exemplar"):
                    fail("mark point %r has no exemplar" % p.get("concept"))
        if q["type"] == "num" and not isinstance(q.get("answer"), (int, float)):
            fail("a calculation's answer must be a number, not %r" % (q.get("answer"),))

        # ---- where it sends the learner
        for p in S.resolve(q, stations):
            fail(p.split(": ", 1)[-1])
        lid = q.get("revisitLessonId")
        if lid:
            have = set(stations["lessons"][lid]["outcomes"])
            for o in q.get("outcomes") or []:
                if o not in have:
                    fail("names outcome %s, which %s does not have" % (o, lid))
            if not q.get("outcomes"):
                warn.append("%s  names no outcome" % qid)

        # ---- what the learner is told
        if not str(q.get("feedback") or "").strip():
            fail("no feedback")
        if q["type"] in HINT_WANTED and not q.get("hint") and q["marks"] >= 3:
            warn.append("%s  %d marks and no hint" % (qid, q["marks"]))

        # ---- nothing gives itself away
        if q["type"] in ("mcq", "tf"):
            right = str((q.get("options") or [None])[q.get("correct", 0)] or "")
            stem = words(q["q"]) | words(q.get("hint"))
            rw = {w for w in words(right) if len(w) > 4}
            if rw and rw <= stem:
                fail("the stem or hint contains every long word of the right answer")
        if q["type"] in ("num", "convert", "binadd", "binshift", "codeout"):
            if str(q.get("answer")) and str(q["answer"]) in str(q.get("hint") or ""):
                fail("the hint contains the answer")
        for p in q.get("markPoints") or []:
            if p.get("exemplar") and q.get("hint") and p["exemplar"] in q["hint"]:
                fail("the hint contains a mark point's exemplar")

    # ---- the manifest has to describe what is on disk
    man = json.loads(S.MANIFEST.read_text(encoding="utf-8"))
    listed = {f for t in man["topics"] for f in t["files"]}
    on_disk = {str(p.relative_to(S.BANK)) for p in S.BANK.glob("*/*.json")}
    for f in sorted(on_disk - listed):
        bad.append("%s is on disk and not in the manifest, so nothing loads it" % f)
    for f in sorted(listed - on_disk):
        bad.append("%s is in the manifest and not on disk" % f)
    if not topics and man["questions"] != len(bank):
        bad.append("the manifest counts %d questions and the files hold %d"
                   % (man["questions"], len(bank)))

    # ---- what the bank looks like as a whole
    fam = collections.Counter(S.FAMILY[q["type"]] for q in bank)
    kinds = collections.Counter(q["type"] for q in bank)
    marks = collections.Counter(q["marks"] for q in bank)
    cw = collections.Counter(q.get("commandWord") for q in bank)
    n = len(bank) or 1
    print("%d questions, %d marks, %d topics"
          % (len(bank), sum(q["marks"] for q in bank), len({q["topic"] for q in bank})))
    print("types:     " + ", ".join("%s %d" % (k, v) for k, v in kinds.most_common()))
    print("marks:     " + ", ".join("%d mark %d" % (k, v) for k, v in sorted(marks.items())))
    print("commands:  " + ", ".join("%s %d" % (k or "none", v) for k, v in cw.most_common()))
    print("families:  " + ", ".join("%s %d%%" % (k, round(100 * v / n)) for k, v in sorted(fam.items())))
    print("exam-style %d%%" % round(100 * sum(1 for q in bank if q.get("examStyle")) / n))
    print("review:    " + ", ".join("%s %d" % (k, v) for k, v in
                                    collections.Counter(q["reviewStatus"] for q in bank).most_common()))
    # Section 8's ranges are for the whole bank, so they are only judged on one.
    if not topics:
        for family, (lo, hi) in S.BALANCE.items():
            share = fam[family] / n
            if not lo <= share <= hi:
                warn.append("%s questions are %d%% of the bank; section 8 asks for %d-%d%%"
                            % (family, round(100 * share), round(100 * lo), round(100 * hi)))
        ex = sum(1 for q in bank if q.get("examStyle")) / n
        if not S.EXAM_STYLE_BAND[0] <= ex <= S.EXAM_STYLE_BAND[1]:
            warn.append("exam-style questions are %d%% of the bank; section 46 asks for %d-%d%%"
                        % (round(100 * ex), round(100 * S.EXAM_STYLE_BAND[0]),
                           round(100 * S.EXAM_STYLE_BAND[1])))

    print()
    for w in warn[:30]:
        print("  note  " + w)
    for b in bad[:60]:
        print("  FAIL  " + b)
    print()
    print("the bank is sound" if not bad else "%d problem(s)" % len(bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
