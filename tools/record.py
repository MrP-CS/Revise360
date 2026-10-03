"""One canonical record per lesson, and the coverage matrix over all of them.

Everything about a lesson is already somewhere: the spec module that renders its
room, the bank its questions come from, the worksheet, the deck, the answer key.
Nothing here invents content. This gathers what exists into one record per
lesson so a teacher's pack, a lesson plan and a coverage claim can be built from
one source instead of four, and so the places where a resource and its
assessment do not line up become visible rather than staying plausible.

It writes:

  build/records/<id>.json     what a lesson is: outcomes, stations, activities,
                              the exact references, what is student-facing
  answers/records/<id>.json   the teacher half: expected answers, success
                              criteria, marking guidance. answers/ is gitignored,
                              so none of it can reach the public repository.
  build/coverage.json         every outcome traced through teaching, practice and
                              assessment, with the gaps named
  build/COVERAGE.md           the same thing to read

Three honest limits, stated in each record rather than hidden:

  * A lesson's wall panels are PAINTED INTO the 360 image. For the 79 lessons
    with a spec module the bullets are in the module too; for the rest they exist
    only as pixels, and the record says so instead of pretending the lesson has
    no explanation.
  * The outcome-to-station trace is DERIVED by matching content words, not
    authored. Every trace carries the words it matched so a human can see why,
    and `trace` is marked `derived` throughout. It is a prompt to look, not a
    claim that the alignment is right.
  * A diagnostic question's teaching response is whatever the author wrote in
    `fb`. Where a wrong option has no response of its own, the record says so;
    it does not manufacture one.

    python3 tools/record.py                 # build everything
    python3 tools/record.py --check         # build nothing, print the findings
    python3 tools/record.py pr-l01 sa-l01   # just these
"""
import os
import re
import sys
import json
import glob
import hashlib
import importlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from paths import SITE_S                                       # noqa: E402
from kit import task_marks                                     # noqa: E402

ROOT = SITE_S.rstrip("/")
OUT = os.path.join(ROOT, "build", "records")
KEYS = os.path.join(ROOT, "answers", "records")
INV = os.path.join(ROOT, "build", "inventory.json")

# How an activity's kind places it in the release of support.
#
# The line that matters is whether the answer is on the screen. A pupil
# choosing between four options can get there by eliminating three; a pupil
# deciding which of six statements is necessary and which is not, or putting
# five stages in order, or filling a table, has to produce the answer. The
# first is recognition. The second is the independent application the course
# is judged on.
#
# This table used to call `sort` and `order` guided, which counted a
# classification task - "For a satnav, is each of these details necessary or
# unnecessary?" - as recognition. That is wrong: nothing is offered per item.
# Correcting it moved 47 lessons out of "nothing is practised independently",
# which is a measurement being fixed and not a lesson being improved, and
# docs/COVERAGE.md says so where the number appears.
#
# `challenge` is set separately, from `opt`.
#
ROLE = {
    # the answer is on the screen and the pupil picks it
    "mcq": "recognise", "multi": "recognise", "match": "recognise",
    # the pupil arranges, classifies, fills in or works out - nothing is offered
    "sort": "construct", "order": "construct", "table": "construct",
    "convert": "construct", "addshift": "construct", "pixels": "construct",
    "sound": "construct", "memory": "construct", "permissions": "construct",
    "defrag": "construct", "impact": "construct", "trace": "construct",
    "calc": "construct",
    "bugline": "construct", "searchstep": "construct", "sortstep": "construct",
    "circuit": "construct", "expr": "construct",
    # a Python activity, by its stage in the release of support
    "try": "recognise", "predict": "recognise", "change": "construct",
    "complete": "construct", "debug": "produce", "build": "produce",
    "code": "produce",
    # timed games: practice, but not evidence of independent application
    "sprint": "game", "defence": "game", "blitz": "game", "lawgame": "game",
    "arena": "game",
}
# Which roles count as the pupil supplying the thinking.
INDEPENDENT = ("construct", "produce", "challenge")

STOP = set("""a an and are as at be been but by can cannot could do does for from
has have how in into is it its of on one only or over so some that the their them
then there these they this to two up use used uses using what when where which
while why will with without you your about after also any because before between
each more most not other than those through very each know knows understand
understands be able aware""".split())


def words(text):
    """The content words of a sentence, crudely stemmed so plural matches singular.

    A word written in capitals is kept whatever it is: this is a subject where
    AND, OR and NOT are the operators being taught, and LAN, WAN, CPU, RAM and
    ROM are the content. Dropping them as short words or as English stopwords
    made "understand the truth tables for AND, OR and NOT" untraceable to the
    station called "The AND gate".
    """
    out = set()
    for raw in re.findall(r"[A-Za-z][A-Za-z0-9_']*", str(text)):
        if len(raw) >= 2 and raw.isupper():
            out.add(raw.lower())
            continue
        w = raw.lower()
        if w in STOP or len(w) < 3:
            continue
        for suffix in ("ing", "ies", "ed", "es", "s"):
            if len(w) > 4 and w.endswith(suffix):
                w = w[: -len(suffix)] + ("y" if suffix == "ies" else "")
                break
        out.add(w)
    return out


def version_of(obj):
    """A short hash of the authored content, so a substantial change is visible.

    Positions, colours and file paths are left out: moving a station's panel on
    the wall is not a change to what the lesson teaches, and a version that moved
    every time the renderer did would tell a teacher nothing.
    """
    blob = json.dumps(obj, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()[:12]


# ------------------------------------------------------------------ sources
_mods = {}


def module_lesson(mod, lesson_id):
    """The lesson dict out of its spec module, or None."""
    if mod not in _mods:
        try:
            _mods[mod] = importlib.import_module(mod)
        except Exception:
            _mods[mod] = None
    m = _mods[mod]
    if not m:
        return None
    for name in dir(m):
        if not re.fullmatch(r"L\d+[A-Za-z]*", name):
            continue
        v = getattr(m, name)
        if isinstance(v, dict) and v.get("id") == lesson_id:
            return v
    return None


def scene_of(lesson_id):
    p = os.path.join(ROOT, "experiences", lesson_id + ".json")
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else None


def bank_of(lesson_id):
    p = os.path.join(HERE, "codebank", lesson_id + ".json")
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else None


def answers_of(lesson_id):
    p = os.path.join(ROOT, "answers", "codebank", lesson_id + ".json")
    return json.load(open(p, encoding="utf-8")).get("solutions", {}) \
        if os.path.exists(p) else {}


# A worksheet read back is not a structured source, and a lesson whose sheet has
# an unusual shape - nw-l01 is in three parts - can run the objective list
# straight on into the body of the sheet. An objective is a short clause at the
# top of the sheet; these are the things it is not.
NOT_AN_OUTCOME = re.compile(
    r"^(?:\d+\s|[a-z]\)|\u2605|\?|Challenge:|Key fact|Task:|Sketch|Complete the|"
    r"List |Copy it|Part \d|My scores|Objective$|Not yet$|Confident$|Getting there$|"
    r"Zoom out|Score$|Total$|Take the headset|Check your predictions|Problem$|"
    r"With a network|Section [A-Z]|Revision station|Lesson \d+:|\d+\.$|_+)", re.I)

# An outcome about the pupil's own progress rather than about the subject:
# "know which lessons I am secure on", "finish any outstanding tasks", "be ready
# for the test". A revision or consolidation lesson is supposed to have these, and
# no station teaches them, so reporting them as untaught would bury the ones that
# matter.
HOUSEKEEPING = re.compile(
    r"\b(?:secure on|which lessons|outstanding (?:tasks?|work)|be ready for|"
    r"ready for my|before the test|without notes|need to revise|still need|"
    r"lose marks|which parts of the topic)\b", re.I)


def tidy(lines, limit=6):
    """The leading run of lines that really are learning outcomes.

    Contiguous from the top, because that is where a worksheet lists them: the
    first line that is plainly part of the body ends the list, rather than being
    skipped so the rest of the sheet can be swallowed behind it.
    """
    out = []
    for ln in lines or []:
        ln = str(ln).strip()
        if not ln:
            continue
        if len(ln) > 150 or "___" in ln or NOT_AN_OUTCOME.match(ln):
            break
        out.append(ln)
        if len(out) >= limit:
            break
    return out


def test_topics(wsrel):
    """The topic list off an end-of-topic test's reflection sheet.

    A reflection sheet carries the test's topics, one row per question, so it is
    the authored record of what the unit actually assesses. Those lessons have no
    spec module and no scene - the test is on paper - so this is the only place
    their content exists.
    """
    if not wsrel:
        return []
    path = os.path.join(ROOT, wsrel)
    if not os.path.exists(path):
        return []
    try:
        import reconstruct
        lines = reconstruct.doc_lines(path)
    except Exception:
        return []
    out, on = [], False
    for ln in lines:
        ln = ln.strip()
        if ln == "My results":
            on = True
            continue
        if not on:
            continue
        if ln.startswith("Total:") or ln.startswith("What went well"):
            break
        if not ln or ln in ("Q", "Topic", "Marks", "My mark", "R / A / G"):
            continue
        if re.fullmatch(r"[\d\s./_]*", ln):
            continue
        out.append(ln)
    return out


def exit_questions(wsrel):
    """Exam questions off a worksheet that does not use the standard heading.

    reconstruct() looks for "Exam practice" and a "[3]" mark allocation. Some of
    the earlier sheets head the same thing "Exit questions" and give no marks -
    nw-l01's are "a) What is meant by a standalone computer?" - and reading them
    only under the strict shape reported those lessons as having no assessment at
    all, which is not true and would have told a teacher to write some.
    """
    if not wsrel:
        return []
    path = os.path.join(ROOT, wsrel)
    if not os.path.exists(path):
        return []
    try:
        import reconstruct
        lines = reconstruct.doc_lines(path)
    except Exception:
        return []
    out, on = [], False
    for ln in lines:
        ln = ln.strip()
        if re.match(r"^(?:\d+\s+)?(?:Exam practice|Exit questions)", ln, re.I):
            on = True
            continue
        if not on:
            continue
        if re.match(r"^(?:How confident|My scores|Revisit|Revise 360|Part \d)", ln, re.I):
            break
        m = re.match(r"^[a-z]\)\s*(.+?)\s*(?:\[(\d+)\])?$", ln)
        if m and len(m.group(1)) > 8:
            out.append({"q": m.group(1).strip(),
                        "marks": int(m.group(2)) if m.group(2) else None})
    return out


def from_worksheet(lesson_id, wspath=None):
    """What the worksheet .docx still holds for a lesson whose module is gone."""
    try:
        import reconstruct
        return reconstruct.reconstruct(lesson_id, wspath)
    except SystemExit:
        return None
    except Exception:
        return None


# ------------------------------------------------------- building a record
def misconceptions(bullets, tasks, sid):
    """What the lesson itself says pupils get wrong, from where it says it.

    Three authored places and no guessing. A wall bullet that opens "Common
    mistake:" states one outright. A wrong option on a multiple-choice question
    IS one - that is what a distractor is for. A Fix it activity is built round
    one, and its first hint names it.

    `fb` is deliberately not here. It is shown whether the answer was right or
    wrong, so most of them are an explanation or an encouragement, and filing
    every one as a misconception would bury the three that are real.
    """
    out = []
    for b in bullets or []:
        m = re.match(r"\s*Common mistake:\s*(.+)", str(b))
        if m:
            out.append({"says": m.group(1).strip(), "from": "wall panel"})
    for i, t in enumerate(tasks or []):
        kind = t.get("kind") or t.get("t")
        opts = t.get("a") or t.get("opts") or []
        if kind in ("mcq", "predict") and len(opts) > 1:
            out.append({"wrong_answers_offered": list(opts[1:]),
                        "on": t.get("q"),
                        "from": "%s-a%d, the distractors" % (sid, i + 1)})
        if kind == "debug":
            h = t.get("hint") or {}
            out.append({"says": (h.get("think") if isinstance(h, dict) else None)
                                or "a deliberate fault the pupil has to find",
                        "on": t.get("q"),
                        "from": "%s-a%d, a Fix it activity" % (sid, i + 1)})
    return out


def checks(tasks, prefix):
    """The diagnostic questions, with the teaching response the author wrote."""
    out = []
    for i, t in enumerate(tasks or []):
        kind = t.get("kind") or t.get("t")
        if kind not in ("mcq", "multi", "predict"):
            continue
        opts = t.get("a") or t.get("opts") or []
        right = opts[0] if opts else None
        entry = {
            "id": "%s-c%d" % (prefix, i + 1),
            "asks": t.get("q"),
            "kind": kind,
            "right": right,
            "distractors": [o for o in opts[1:]],
            "response": t.get("fb"),
        }
        if not t.get("fb"):
            entry["gap"] = "no teaching response is written for a wrong answer"
        elif len(opts) > 2:
            entry["gap"] = ("one response covers every wrong option; it does not say "
                            "what to revisit for each one")
        out.append(entry)
    return out


def activity(t, ref, prefix, n):
    """One activity, with the data it prescribes pulled out of the instruction."""
    kind = t.get("kind") or t.get("t") or "build"
    marked = re.findall(r"`([^`]*)`", " ".join(
        [str(t.get("q") or "")] + [str(x) for x in (t.get("brief") or [])]))
    a = {
        "id": "%s-a%d" % (prefix, n + 1),
        "ref": ref,
        "kind": kind,
        "role": "challenge" if t.get("opt") else ROLE.get(kind, "independent"),
        "marks": task_marks(t) if t.get("t") else t.get("marks", 1),
        "instruction": t.get("q"),
    }
    if t.get("brief"):
        a["brief"] = t["brief"]
    if marked:
        # The exact values the task prescribes, as marked in the instruction and
        # coloured with the editor's own tokens. See docs/PRESCRIBED-DATA.md.
        a["prescribed_data"] = marked
    if t.get("teach"):
        a["worked_example"] = {"says": t["teach"].get("say"),
                               "code": t["teach"].get("code"),
                               "shows": t["teach"].get("out"),
                               "note": "different data from the task, on purpose"}
    if t.get("lines"):
        a["line_notes"] = t["lines"]
    if t.get("hint"):
        a["hint"] = t["hint"]
    if t.get("tests"):
        a["tests"] = len(t["tests"])
    if t.get("starter"):
        a["starter"] = t["starter"]
    if t.get("forbid"):
        a["must_not_use"] = t["forbid"]
    if t.get("require"):
        a["must_use"] = t["require"]
    return a


def build(lesson, unit):
    """One lesson's record, from whichever source holds its content."""
    lid = lesson["id"]
    mod = lesson.get("source_module")
    spec = module_lesson(mod, lid) if mod else None
    scene = scene_of(lid)
    bank = bank_of(lid)
    sols = answers_of(lid)
    wsrel = (lesson.get("worksheet") or "").split("?")[0] or None
    salvage = None if spec else from_worksheet(lid, wsrel)

    held_by = []
    if spec:
        held_by.append("spec module " + mod)
    if scene:
        held_by.append("experiences/%s.json" % lid)
    if bank:
        held_by.append("tools/codebank/%s.json" % lid)
    if salvage:
        held_by.append("the worksheet, read back")

    ws = (spec or {}).get("ws") or {}
    if salvage:
        ws = {"objectives": tidy(salvage.get("objectives")),
              "keyterms": tidy(salvage.get("keyterms"), 12),
              "keyq": salvage.get("keyq"), "starter": salvage.get("starter"),
              "exam": [(e["q"], e["marks"]) for e in salvage.get("exam") or []],
              "confidence": tidy(salvage.get("confidence"), 8)}

    rec = {
        "id": lid,
        "unit": unit["id"],
        "unit_title": unit["title"],
        "lesson": lesson.get("lesson"),
        "title": lesson.get("title"),
        "kind": lesson.get("kind"),
        "audience": lesson.get("audience", "student"),
        "plan_id": "PLAN-" + lid.upper(),
        "content_held_by": held_by,
        "description": lesson.get("description"),
    }

    # --- prerequisites. The lesson before it in the same unit, which is what the
    # course actually requires, plus anything the lesson states for itself.
    order = [x["id"] for x in unit["lessons"]]
    at = order.index(lid)
    rec["prerequisites"] = {
        "lessons": order[:at],
        "immediately_before": order[at - 1] if at else None,
        "stated": [s for s in (spec or {}).get("requires", [])] or None,
    }

    # --- outcomes, exactly as the lesson states them
    rec["outcomes"] = [
        {"id": "%s-o%d" % (lid, i + 1), "text": o}
        for i, o in enumerate(ws.get("objectives") or lesson.get("objectives") or [])
    ]
    rec["vocabulary"] = ws.get("keyterms") or lesson.get("keywords") or []
    if ws.get("keyq"):
        rec["key_question"] = ws["keyq"]
    if ws.get("starter"):
        rec["retrieve"] = {"prompt": ws["starter"],
                           "lines": ws.get("starter_lines"),
                           "revisits": "prior knowledge for this lesson"}

    # --- stations, their explanations and their activities
    spec_st = (spec or {}).get("stations") or []
    scene_st = (scene["scenes"][0]["stations"] if scene else [])
    stations = []
    for i, st in enumerate(scene_st or spec_st):
        name = st.get("name")
        src = spec_st[i] if i < len(spec_st) else {}
        sid = "%s-s%d" % (lid, i + 1)
        tasks = st.get("tasks") or src.get("tasks") or []
        bullets = src.get("bullets")
        entry = {
            "id": sid,
            "n": i + 1 if not str(st.get("label", "")).startswith("★") else "final",
            "name": name,
            "explains": bullets,
            "challenge": src.get("challenge") or (salvage or {}).get("challenges", {}).get(name),
            "key_fact_prompt": src.get("fact") or (salvage or {}).get("facts", {}).get(name),
            "activities": [activity(t, "station %d activity %d" % (i + 1, j + 1), sid, j)
                           for j, t in enumerate(tasks)],
            "misconceptions": misconceptions(bullets, tasks, sid),
            "teaching_notes": [t["fb"] for t in tasks if t.get("fb")],
            "checks": checks(tasks, sid),
        }
        if bullets is None:
            entry["explains_note"] = (
                "the wall panel is painted into experiences/img/%s.jpg and exists "
                "nowhere as text; see tools/reconstruct.py"
                % ((spec or {}).get("img") or lid))
        stations.append(entry)
    rec["stations"] = stations

    # --- what the lesson reads as information rather than teaches
    info = (scene["scenes"][0].get("info") if scene else None) or []
    rec["information"] = [{"title": f.get("title"), "text": f.get("text")} for f in info]

    # --- assessment: the worksheet's exam practice, which is also the deck's
    rec["assessment"] = []
    for i, e in enumerate(ws.get("exam") or []):
        q, marks = (e[0], e[1]) if isinstance(e, (list, tuple)) else (e.get("q"), e.get("marks"))
        lines = e[2] if isinstance(e, (list, tuple)) and len(e) > 2 else None
        rec["assessment"].append({
            "id": "%s-x%d" % (lid, i + 1),
            "asks": q, "marks": marks, "answer_lines": lines,
            "appears_in": ["worksheet, Exam practice %s)" % "abcdefgh"[i],
                           "deck, Exam practice slide"],
        })
    if not rec["assessment"] and salvage is not None:
        for i, e in enumerate(exit_questions(wsrel)):
            rec["assessment"].append({
                "id": "%s-x%d" % (lid, i + 1),
                "asks": e["q"], "marks": e["marks"], "answer_lines": None,
                "appears_in": ["worksheet, Exit questions %s)" % "abcdefgh"[i]],
                "note": "read back from the worksheet; it carries no mark allocation"
                        if e["marks"] is None else None,
            })
    if not rec["assessment"] and lesson.get("kind") == "worksheet":
        for i, topic in enumerate(test_topics(wsrel)):
            rec["assessment"].append({
                "id": "%s-x%d" % (lid, i + 1),
                "asks": topic, "marks": None, "answer_lines": None,
                "appears_in": ["the unit test, question %d" % (i + 1),
                               "the reflection worksheet, My results"],
                "note": "a topic of the paper test, not a question printed here",
            })
    if not rec["outcomes"] and lesson.get("kind") in ("worksheet", "challenge"):
        rec["outcomes_note"] = (
            "this lesson states no outcomes of its own, which is correct for what "
            "it is: a %s. It %s." % (
                "test and reflection sheet" if lesson.get("kind") == "worksheet"
                else "bonus challenge",
                "assesses the outcomes taught across the unit"
                if lesson.get("kind") == "worksheet"
                else "stretches outcomes already taught and is optional"))
    rec["review"] = {"confidence": ws.get("confidence") or [],
                     "note": "a confidence rating supplements the evidence above, "
                             "it does not stand in for it"}

    # --- exactly where everything is
    rec["references"] = {
        "online": lesson.get("route"),
        "scene": lesson.get("scene"),
        "scene_image": "experiences/img/%s.jpg" % ((spec or {}).get("img") or ""),
        "deck": lesson.get("deck"),
        "worksheet": lesson.get("worksheet"),
        "code_bank": lesson.get("code_bank"),
        "lesson_plan": "lessonplans/%s_LessonPlan.pdf" % lid.upper().replace("-", "_"),
    }
    rec["teacher_only"] = [p for p in [
        ("answers/codebank/%s.json" % lid) if sols else None,
        ("answers/records/%s.json" % lid),
    ] if p]

    marks = sum(a.get("marks") or 0 for s in stations for a in s["activities"])
    rec["totals"] = {
        "stations": len([s for s in stations if s["n"] != "final"]),
        "activities": sum(len(s["activities"]) for s in stations),
        "marks": marks,
        # one count per role, and "independent" as the roles that count as the
        # pupil supplying the thinking - so a reader can see which it was
        "recognise": sum(1 for s in stations for a in s["activities"] if a["role"] == "recognise"),
        "construct": sum(1 for s in stations for a in s["activities"] if a["role"] == "construct"),
        "produce": sum(1 for s in stations for a in s["activities"] if a["role"] == "produce"),
        "game": sum(1 for s in stations for a in s["activities"] if a["role"] == "game"),
        "challenge": sum(1 for s in stations for a in s["activities"] if a["role"] == "challenge"),
        "guided": sum(1 for s in stations for a in s["activities"] if a["role"] == "recognise"),
        "independent": sum(1 for s in stations for a in s["activities"] if a["role"] in INDEPENDENT),
        "assessment_marks": sum(a.get("marks") or 0 for a in rec["assessment"]),
    }
    rec["version"] = version_of({k: rec[k] for k in
                                ("outcomes", "vocabulary", "stations", "assessment")})

    # --- the teacher half, kept out of the repository
    key = {
        "id": lid, "version": rec["version"],
        "note": "teacher-only. answers/ is gitignored: this must not be committed.",
        "model_solutions": sols,
        "success_criteria": [],
        "marking": [],
    }
    for s in stations:
        for a in s["activities"]:
            bank_q = None
            if bank:
                bank_q = next((q for q in bank["questions"]
                               if q.get("q") == a.get("instruction")), None)
            crit = {
                "activity": a["id"],
                "ref": a["ref"],
                "marks": a["marks"],
                "criteria": a.get("brief") or ([a["instruction"]] if a.get("instruction") else []),
            }
            if bank_q:
                crit["bank_id"] = bank_q["id"]
                crit["model_solution"] = sols.get(bank_q["id"])
                crit["tests"] = bank_q.get("tests")
                crit["how_marked"] = ("the pupil's program is run against %d test case(s); "
                                      "all must pass" % len(bank_q.get("tests") or []))
            elif a["kind"] in ("mcq", "multi", "match", "sort", "order"):
                crit["how_marked"] = "marked by the player against the authored answer"
            else:
                crit["how_marked"] = "teacher judgement against the criteria above"
            key["success_criteria"].append(crit)
    for x in rec["assessment"]:
        key["marking"].append({
            "assessment": x["id"], "marks": x["marks"],
            "guidance": "mark against the topic answer sheet in answers/; "
                        "the worksheet states the mark allocation",
        })
    return rec, key


# ---------------------------------------------------------- coverage matrix
# ---------------- authored alignment ----------------
#
# The trace below is derived: it matches an outcome to a station or an exam
# question by the words they share. That is a prompt to look, not a statement
# that the alignment is right, and for anything a school or a buyer would rely
# on it is not good enough.
#
# So a lesson may carry an authored file in alignment/<lesson>.json which says
# outright what teaches, practises and assesses each outcome. Where one exists
# it wins, and the row says so. The matcher stays as the fallback and as a way
# of finding things nobody has mapped yet.
#
# {
#   "lesson": "sa-l02",
#   "reviewed": "2026-10-03",
#   "outcomes": {
#     "sa-l02-o3": { "taught": ["sa-l02-s6"], "assessed": ["sa-l02-x4"],
#                    "note": "why, if it is not obvious" }
#   },
#   "assessment": { "sa-l02-x2": { "assesses": ["sa-l02-o2"] } }
# }
#
# Every status a row can carry:
#   authored  a person wrote this link down
#   auto      the matcher found it; nobody has checked it
#   gap       nothing found, and nothing authored
ALIGN_DIR = os.path.join(ROOT, "alignment")


def alignment(lid):
    """The authored mapping for one lesson, or an empty one."""
    p = os.path.join(ALIGN_DIR, lid + ".json")
    if not os.path.exists(p):
        return {"outcomes": {}, "assessment": {}, "reviewed": None}
    try:
        with open(p, encoding="utf-8") as f:
            a = json.load(f)
    except Exception as e:
        print("   %-14s alignment file could not be read: %s" % (lid, e))
        return {"outcomes": {}, "assessment": {}, "reviewed": None}
    a.setdefault("outcomes", {})
    a.setdefault("assessment", {})
    a.setdefault("reviewed", None)
    return a


def trace(rec, unit_pool, unit_outcomes=(), rare=frozenset()):
    """Follow each outcome through teaching, practice and assessment.

    Derived, not authored: an outcome is matched to a station by the content
    words they share, and the words are reported so the match can be judged. Two
    shared words is the threshold - one is coincidence in a subject where every
    sentence contains "data".

    Assessment is looked for across the WHOLE UNIT, not just the lesson. A lesson
    has three or four outcomes and three exam questions, so some of its outcomes
    are meant to be assessed by the end-of-unit test rather than on its own
    worksheet, and a trace that only looked at the lesson would report a hundred
    gaps that are not gaps. `unit_pool` is every assessment item in the unit, each
    tagged with the lesson it sits in.
    """
    rows = []
    A = alignment(rec["id"])
    st_ids = {s["id"] for s in rec["stations"]}
    st_words = [(s["id"], s["name"], words(s["name"]) |
                 words(" ".join(s.get("explains") or [])) |
                 words(" ".join(str(a.get("instruction") or "") for a in s["activities"])))
                for s in rec["stations"]]
    ex_words = [(x["id"], words(x["asks"])) for x in rec["assessment"]]
    pool = [(lid, xid, xw) for lid, xid, xw in unit_pool]
    for o in rec["outcomes"]:
        ow = words(o["text"])
        taught, evidence = [], {}
        for sid, name, sw in st_words:
            shared = ow & sw
            # Two words in common, or one distinctive one. "keyword" appears in
            # three lessons out of 115, so an outcome about keywords and a station
            # called Keywords are the same subject; "data" appears everywhere, so
            # two lessons sharing it means nothing.
            if len(shared) >= 2 or (shared and shared & rare):
                taught.append(sid)
                evidence[sid] = sorted(shared)
        practised = [a["id"] for s in rec["stations"] if s["id"] in taught
                     for a in s["activities"]]
        # An exam question is one sentence, so demanding two words in common with
        # a one-clause outcome throws away real matches. One is enough when either
        # side is that short - "understand what the CPU does" against "Describe
        # what the CPU does while a program is running" shares only "CPU".
        def hit(a, b):
            shared = a & b
            if not shared:
                return False
            return (len(shared) >= 2 or bool(shared & rare)
                    or min(len(a), len(b)) <= 4)
        assessed = [xid for lid, xid, xw in pool if hit(ow, xw)]
        here = [xid for xid, xw in ex_words if hit(ow, xw)]
        # An authored mapping wins. It is the thing a person wrote down, and
        # the matcher is only here to find what nobody has mapped yet.
        au = A["outcomes"].get(o["id"]) or {}
        status = {"taught": "auto" if taught else "gap",
                  "assessed": "auto" if assessed else "gap"}
        if au.get("taught") is not None:
            bad = [x for x in au["taught"] if x not in st_ids]
            if bad:
                print("   %-14s alignment names a station that is not in the "
                      "lesson: %s" % (rec["id"], ", ".join(bad)))
            taught = [x for x in au["taught"] if x in st_ids]
            evidence = {x: ["authored"] for x in taught}
            status["taught"] = "authored"
            practised = [a2["id"] for s2 in rec["stations"] if s2["id"] in taught
                         for a2 in s2["activities"]]
        if au.get("practised") is not None:
            practised = list(au["practised"])
            status["practised"] = "authored"
        if au.get("assessed") is not None:
            known = {xid for lid, xid, xw in pool}
            bad = [x for x in au["assessed"] if x not in known]
            if bad:
                print("   %-14s alignment names an exam item that is not in the "
                      "unit: %s" % (rec["id"], ", ".join(bad)))
            assessed = [x for x in au["assessed"] if x in known]
            status["assessed"] = "authored"
        gaps = []
        housekeeping = bool(HOUSEKEEPING.search(o["text"]))

        if not taught and not housekeeping:
            if all(s["explains"] is None for s in rec["stations"]):
                gaps.append("cannot be traced: this lesson's station text is only "
                            "in the rendered image, so there is nothing to match")
            else:
                gaps.append("no station's text matches it")
        if taught and not practised:
            gaps.append("taught but nothing to practise on")
        if not assessed and not housekeeping:
            gaps.append("nothing in this unit assesses it")
        if not rec["assessment"] and not housekeeping:
            gaps.append("the lesson carries no exam practice of its own")
        rows.append({"outcome": o["id"], "text": o["text"], "taught_at": taught,
                     "matched_words": evidence, "practised_by": practised[:40],
                     "practice_count": len(practised), "assessed_by": assessed,
                     "status": status, "note": au.get("note"), "gaps": gaps})
    # An exam question is an orphan only when NOTHING in the unit claims to teach
    # it. A test lesson's topics assess outcomes taught in earlier lessons, so
    # looking only at this lesson's outcomes would call every one of them an
    # orphan.
    orphan = []
    asks = {x["id"]: x.get("asks") for x in rec["assessment"]}
    for xid, xw in ex_words:
        au = A["assessment"].get(xid) or {}
        if au.get("assesses"):
            continue            # a person has said what this question assesses
        if not any(len(ow & xw) >= 2 or bool((ow & xw) & rare) for ow in unit_outcomes):
            orphan.append({"id": xid, "asks": asks.get(xid)})
    # Notes on the lesson's shape rather than on one outcome. A test and a bonus
    # challenge are judged differently: a test sheet has no key question or
    # starter because it is a test, and saying so every time would be noise.
    shape = []
    t = rec["totals"]
    teaching = rec.get("kind") == "experience"
    # A bonus challenge is one timed arcade game. It is neither recognition nor
    # independent application and judging it as either says nothing useful, so
    # the note is for teaching lessons.
    if teaching and t["activities"] and not t["independent"]:
        shape.append("every activity is recognition: the answer is always on the screen")
    elif teaching and t["activities"] and t["independent"] == 1 and t["recognise"] >= 6:
        # one constructed activity among a dozen recognition ones is thin rather
        # than absent, and is worth looking at without being called a hole
        shape.append("only one activity asks the pupil to produce an answer rather than choose one")
    if teaching and t["activities"] and not t["challenge"]:
        shape.append("no optional challenge activity")
    if teaching and not rec["vocabulary"]:
        shape.append("no key vocabulary is listed")
    if teaching and not rec.get("retrieve"):
        shape.append("no starter, so nothing retrieves prior knowledge")
    if teaching and not rec.get("key_question"):
        shape.append("no key question")
    return {"lesson": rec["id"], "unit": rec["unit"], "title": rec["title"],
            "shape": shape,
            "trace": "derived by matching content words, not authored - read the "
                     "matched words before relying on a row",
            "outcomes": rows,
            "assessed_but_not_an_outcome": orphan,
            "stations_no_outcome_matches": [
                sid for sid, name, sw in st_words
                if not any(len(words(o["text"]) & sw) >= 2 for o in rec["outcomes"])]}


def main(argv):
    check = "--check" in argv
    only = [a for a in argv if not a.startswith("--")]
    inv = json.load(open(INV, encoding="utf-8"))
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(KEYS, exist_ok=True)

    records, matrix, thin = [], [], []
    unit_recs, pending = {}, []
    for unit in inv["units"]:
        for lesson in unit["lessons"]:
            if only and lesson["id"] not in only:
                continue
            rec, key = build(lesson, unit)
            records.append(rec)
            unit_recs.setdefault(unit["id"], []).append(rec)
            pending.append((rec, unit))
            if not rec["outcomes"]:
                thin.append((rec["id"], "no learning outcomes could be found"))
            if not rec["stations"]:
                thin.append((rec["id"], "no stations could be found"))
            if rec["stations"] and all(s["explains"] is None for s in rec["stations"]):
                thin.append((rec["id"], "its wall panels exist only as pixels"))
            if not check:
                json.dump(rec, open(os.path.join(OUT, rec["id"] + ".json"), "w",
                                    encoding="utf-8"), ensure_ascii=False, indent=1)
                json.dump(key, open(os.path.join(KEYS, rec["id"] + ".json"), "w",
                                    encoding="utf-8"), ensure_ascii=False, indent=1)

    # Which words are distinctive. A word in the station text of three lessons or
    # fewer, out of 115, says something; one in forty says nothing. This is a
    # document frequency over the whole course, computed once.
    df = {}
    for rec, unit in pending:
        seen = set()
        for st in rec["stations"]:
            seen |= words(st["name"]) | words(" ".join(st.get("explains") or []))
        for w in seen:
            df[w] = df.get(w, 0) + 1
    rare = frozenset(w for w, n in df.items() if n <= 3)

    # Every assessment item in a unit, so an outcome taught in lesson 2 and
    # assessed by the end-of-unit test is traced to it rather than reported
    # missing.
    pools = {}
    for uid, recs in unit_recs.items():
        pools[uid] = [(r["id"], x["id"], words(x["asks"]))
                      for r in recs for x in r["assessment"] if x.get("asks")]
    outcomes_by_unit = {uid: [words(o["text"]) for r in recs for o in r["outcomes"]]
                        for uid, recs in unit_recs.items()}
    for rec, unit in pending:
        matrix.append(trace(rec, pools.get(unit["id"], []),
                           outcomes_by_unit.get(unit["id"], []), rare))

    gaps = sum(len(r["gaps"]) for m in matrix for r in m["outcomes"])
    orphans = sum(len(m["assessed_but_not_an_outcome"]) for m in matrix)
    if not check:
        json.dump({"built_from": "build/inventory.json", "lessons": matrix},
                  open(os.path.join(ROOT, "build", "coverage.json"), "w",
                       encoding="utf-8"), ensure_ascii=False, indent=1)
        write_md(matrix, records, thin)
        # build/ is gitignored, so the matrix is copied where a teacher and a
        # reviewer will find it. The records themselves stay generated output:
        # one command rebuilds them from the committed sources.
        import shutil
        shutil.copy(os.path.join(ROOT, "build", "COVERAGE.md"),
                    os.path.join(ROOT, "docs", "COVERAGE.md"))

    print("%d record(s), %d outcome(s)" % (len(records), sum(len(r["outcomes"]) for r in records)))
    print("%d outcome(s) with a gap, %d exam question(s) matching no outcome"
          % (gaps, orphans))
    if thin:
        print()
        print("%d lesson(s) whose content is not fully machine-readable:" % len(thin))
        for lid, why in thin[:20]:
            print("   %-14s %s" % (lid, why))
        if len(thin) > 20:
            print("   ... and %d more" % (len(thin) - 20))
    if not check:
        print()
        print("wrote build/records/, answers/records/, build/coverage.json, "
              "build/COVERAGE.md and docs/COVERAGE.md")
    return 0


def write_md(matrix, records, thin):
    by = {}
    for m in matrix:
        by.setdefault(m["unit"], []).append(m)
    out = ["# Coverage matrix", "",
           "Every learning outcome in the course, followed through the station that "
           "teaches it, the activities that practise it and the exam question that "
           "assesses it.", "",
           "**The trace is derived, not authored.** An outcome is matched to a station "
           "or an exam question by the content words they share: two words in common, "
           "or one that is distinctive across the course, or one where either side is "
           "only a few words long. Every match carries the words it matched, in "
           "`build/coverage.json`. Read them before relying on a row: this exists to "
           "show a teacher where to look, not to certify that the alignment is right. "
           "A row with no gap has not been checked by a human either.", "",
           "**Where a person has written the mapping down, it says so.** A lesson may "
           "carry `alignment/<lesson>.json`, which states outright which station "
           "teaches an outcome and which question assesses it. Those links beat the "
           "matcher and are marked **authored** in the *mapping* column; everything "
           "else is **auto**, which means a word match nobody has checked. Do not "
           "present an auto row as curriculum certification.", "",
           "Assessment is looked for across the whole unit, because a lesson has three "
           "or four outcomes and three exam questions: some of them are meant to be "
           "assessed by the end-of-unit test. An outcome about the pupil\u2019s own "
           "progress - \u201cknow which lessons I am secure on\u201d - is marked "
           "housekeeping and is not expected to have a station or an exam question.", "",
           "| unit | lesson | outcomes | taught | practised | assessed | mapping | outcome gaps | notes on the lesson |",
           "|---|---|---|---|---|---|---|---|---|"]
    for uid in sorted(by):
        for m in by[uid]:
            n = len(m["outcomes"])
            t = sum(1 for r in m["outcomes"] if r["taught_at"])
            p = sum(1 for r in m["outcomes"] if r["practised_by"])
            a = sum(1 for r in m["outcomes"] if r["assessed_by"])
            g = (sum(len(r["gaps"]) for r in m["outcomes"])
                 + len(m["assessed_but_not_an_outcome"]))
            auth = sum(1 for r in m["outcomes"]
                       if "authored" in (r.get("status") or {}).values())
            mapping = ("authored %d/%d" % (auth, n)) if auth else ("auto" if n else "")
            out.append("| %s | %s %s | %d | %d | %d | %d | %s | %s | %s |"
                       % (uid, m["lesson"], m["title"], n, t, p, a, mapping, g or "",
                          len(m.get("shape") or []) or ""))
    tot = sum(len(m["outcomes"]) for m in matrix)
    auth = sum(1 for m in matrix for r in m["outcomes"]
               if "authored" in (r.get("status") or {}).values())
    teach = [m for m in matrix
             if any("every activity is recognition" in x for x in (m.get("shape") or []))]
    thinp = [m for m in matrix
             if any("only one activity asks" in x for x in (m.get("shape") or []))]
    out += ["", "## Where the course stands", "",
            "| | count |", "|---|---|",
            "| outcomes in the course | %d |" % tot,
            "| of those, with an **authored** mapping | %d |" % auth,
            "| the rest, matched by words and unchecked | %d |" % (tot - auth),
            "| teaching lessons where every activity is recognition | %d |" % len(teach),
            "| teaching lessons with only one activity that asks for an answer | %d |" % len(thinp),
            "| outcomes nothing in their unit assesses | %d |"
            % sum(1 for m in matrix for r in m["outcomes"]
                  if any("nothing in this unit assesses" in g for g in r["gaps"])),
            "| outcomes no station's text matches | %d |"
            % sum(1 for m in matrix for r in m["outcomes"]
                  if any("no station's text matches" in g for g in r["gaps"])),
            "| outcomes that cannot be traced, because the teaching is only in the image | %d |"
            % sum(1 for m in matrix for r in m["outcomes"]
                  if any("cannot be traced" in g for g in r["gaps"])),
            "| exam questions matching no outcome stated in their unit | %d |"
            % sum(len(m["assessed_but_not_an_outcome"]) for m in matrix), ""]
    out += ["", "## Outcomes with a gap, and outcomes someone has checked", ""]
    any_gap = False
    for m in matrix:
        rows = [r for r in m["outcomes"] if r["gaps"] or r.get("note")]
        if not rows and not m["assessed_but_not_an_outcome"] and not m.get("shape"):
            continue
        any_gap = True
        out.append("### %s — %s" % (m["lesson"], m["title"]))
        for r in rows:
            out.append("- **%s** %s" % (r["outcome"], r["text"]))
            for g in r["gaps"]:
                out.append("  - %s" % g)
            if r.get("note"):
                out.append("  - *checked by hand:* %s" % r["note"])
        for x in m["assessed_but_not_an_outcome"]:
            out.append("- **%s** is assessed but matches no outcome stated anywhere in "
                       "this unit: %s" % (x["id"], x.get("asks")))
        for sh in m.get("shape") or []:
            out.append("- the lesson's shape: %s" % sh)
        out.append("")
    if not any_gap:
        out.append("None.")
    if thin:
        out += ["", "## Lessons whose content is not fully machine-readable", "",
                "These are not empty lessons. Their teaching text is in the rendered "
                "360 image, or in the worksheet, rather than in a spec module, so a "
                "record built from code cannot quote it. `tools/reconstruct.py` reads "
                "back what the worksheet still holds.", "",
                "| lesson | what is missing |", "|---|---|"]
        for lid, why in thin:
            out.append("| %s | %s |" % (lid, why))
    open(os.path.join(ROOT, "build", "COVERAGE.md"), "w", encoding="utf-8").write(
        "\n".join(out) + "\n")


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
