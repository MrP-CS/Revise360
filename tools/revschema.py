"""What a Revision 360 question is, written down once.

Every tool that reads the bank reads it through here: the generators, the
validator, the duplicate report, the answer verifier and the written-response
probes. The alternative is each of them carrying its own idea of the shape, and
the course has already been bitten once by the same rule living in two files -
see the note above Store.marks in js/store.js.

A question on disk:

  {
    "id":        "rq-1.2-virtual-memory-0001",   # stable; never an array index
    "type":      "written",                      # one of TYPES
    "marks":     3,
    "topic":     "1.2",                          # filled in from the bank file
    "subtopic":  "Virtual memory",
    "difficulty":"apply",                        # retrieve | understand | apply | stretch
    "commandWord":"explain",                     # one of COMMAND_WORDS, or absent
    "examStyle": true,
    "q":         "the stem the learner reads",
    "revisit":   "ms-l02-s2",                    # a station id from revision/stations.json
    "revisitReason": "why that station answers this",
    "outcomes":  ["ms-l02-o1"],                  # outcome ids from the record
    "feedback":  "what is said once it is marked",
    "hint":      "a nudge, not the answer",
    "misconception": "what a wrong answer usually means",
    "reviewStatus": "VALIDATED",
    ... type-specific answer fields ...
  }

The type decides which answer fields are required, and REQUIRED below is the
only place that is written down. `topic`, `revisitLessonId`, `revisitStationId`
and `revisitLabel` are filled in when the bank is built, from the file the
question lives in and from the station index, so an author never types a lesson
id and a question can never point at a lesson its station is not in.
"""
import json
import re

from paths import SITE

BANK = SITE / "revision"
MANIFEST = BANK / "manifest.json"
STATIONS = BANK / "stations.json"

# Paper 1 and Paper 2, as OCR J277 divides them.
PAPER = {
    "1.1": 1, "1.2": 1, "1.3": 1, "1.4": 1, "1.5": 1, "1.6": 1,
    "2.1": 2, "2.2": 2, "2.3": 2, "2.4": 2, "2.5": 2,
}
TOPIC_TITLE = {
    "1.1": "Systems architecture",
    "1.2": "Memory and storage",
    "1.3": "Computer networks, connections and protocols",
    "1.4": "Network security",
    "1.5": "Systems software",
    "1.6": "Ethical, legal, cultural and environmental impacts",
    "2.1": "Algorithms",
    "2.2": "Programming fundamentals",
    "2.3": "Producing robust programs",
    "2.4": "Boolean logic",
    "2.5": "Programming languages and IDEs",
}

# Which course lesson prefixes teach which topic. Used to check that a question
# tagged 1.2 points at a station in a 1.2 lesson rather than wherever the author
# happened to look.
UNIT_OF_TOPIC = dict(TOPIC_TITLE)

SELECTED = ("mcq", "tf", "multi", "match", "order", "sort")
WRITTEN = ("short", "written")
SELF_REVIEW = ("extended",)
COMPUTED = ("num", "convert", "binadd", "binshift", "truth", "trace", "codeout")
TYPES = SELECTED + WRITTEN + SELF_REVIEW + COMPUTED

# What section 8 asks the whole bank to look like. Checked, not assumed.
FAMILY = {}
for t in SELECTED:
    FAMILY[t] = "recognition"
for t in WRITTEN + SELF_REVIEW:
    FAMILY[t] = "written"
for t in COMPUTED:
    FAMILY[t] = "computed"
BALANCE = {"recognition": (0.25, 0.42), "written": (0.22, 0.42), "computed": (0.14, 0.30)}
EXAM_STYLE_BAND = (0.18, 0.30)

COMMAND_WORDS = ("state", "identify", "give", "name", "define", "describe", "explain",
                 "compare", "justify", "calculate", "convert", "complete", "discuss",
                 "evaluate", "tick", "draw", "write", "trace", "show")
DIFFICULTY = ("retrieve", "understand", "apply", "stretch")
REVIEW_STATUS = ("DRAFT", "VALIDATED", "HUMAN_REVIEWED")
MARKS_ALLOWED = (1, 2, 3, 4, 5, 6)

# The answer fields each type must carry, beyond the common ones.
REQUIRED = {
    "mcq": ["options", "correct"],
    "tf": ["options", "correct"],
    "multi": ["options", "correct"],
    "match": ["pairs"],
    "order": ["steps"],
    "sort": ["cats", "items"],
    "short": ["markPoints", "example"],
    "written": ["markPoints", "example"],
    "extended": ["markPoints", "example"],
    "num": ["answer"],
    "convert": ["answer", "exact"],
    "binadd": ["answer", "exact"],
    "binshift": ["answer", "exact"],
    "truth": ["cols", "rows", "answer"],
    "trace": ["cols", "rows", "answer"],
    "codeout": ["code", "answer", "exact"],
}

ID_RE = re.compile(r"^rq-(\d\.\d)-([a-z0-9]+(?:-[a-z0-9]+)*)-(\d{4})$")


def marks_of(q):
    """What a question is worth. Authored, because a mark value is a judgement -
    but checked against the answer so a four-mark question cannot have one mark
    point and a truth table cannot be worth fewer marks than it has blanks."""
    return int(q["marks"])


def implied_marks(q):
    """The largest mark total the answer itself can support, or None where the
    answer does not decide it (a multiple choice is worth what it says)."""
    t = q["type"]
    if t in ("short", "written", "extended"):
        return sum(p.get("worth", 1) for p in q.get("markPoints", []))
    if t == "match":
        return len(q.get("pairs", []))
    if t == "order":
        return len(q.get("steps", []))
    if t == "sort":
        return len(q.get("items", []))
    if t == "multi":
        return len(q.get("correct", []))
    if t in ("truth", "trace"):
        rows, ans = q.get("rows") or [], q.get("answer") or []
        return sum(1 for r, row in enumerate(ans) for c, _ in enumerate(row)
                   if not rows or rows[r][c] == "")
    return None


def load_stations():
    return json.loads(STATIONS.read_text(encoding="utf-8"))


def bank_files():
    """Every question file, in manifest order. The manifest is the list; a file
    that is on disk and not in it is not loaded, and tools/revqa.py says so."""
    man = json.loads(MANIFEST.read_text(encoding="utf-8"))
    out = []
    for topic in man["topics"]:
        for f in topic["files"]:
            out.append((topic["topic"], BANK / f))
    return out


def load_bank(topics=None):
    """Every question, with `topic` and `file` filled in from where it lives."""
    out = []
    for topic, path in bank_files():
        if topics and topic not in topics:
            continue
        doc = json.loads(path.read_text(encoding="utf-8"))
        for q in doc["questions"]:
            q["topic"] = topic
            q["subtopic"] = q.get("subtopic") or doc.get("subtopic")
            q["file"] = str(path.relative_to(BANK))
            out.append(q)
    return out


def resolve(q, stations):
    """Fill in what is derived rather than authored: the lesson the station
    belongs to, and the words the learner is shown when told to revisit it.
    Returns a list of problems, which is empty when the mapping is sound."""
    bad = []
    sid = q.get("revisit")
    if not sid:
        return ["%s: no revisit station" % q["id"]]
    for lid, L in stations["lessons"].items():
        for st in L["stations"]:
            if st["id"] == sid:
                q["revisitLessonId"] = lid
                q["revisitStationId"] = sid
                # A lesson's last station is numbered "final" rather than
                # counted, and is already called Final challenge, so neither
                # "station final" nor "the final challenge: Final challenge" is
                # what it should say.
                q["revisitLabel"] = ("%s Lesson %s — %s, %s" % (
                    L["unit"], L["lesson"], L["title"], st["name"])
                    if st["n"] == "final" else
                    "%s Lesson %s — %s, station %s: %s" % (
                        L["unit"], L["lesson"], L["title"], st["n"], st["name"]))
                q["revisitScene"] = st["sceneIndex"]
                q["revisitK"] = st["k"]
                if L["unit"] != q["topic"]:
                    bad.append("%s: tagged %s but station %s is in unit %s"
                               % (q["id"], q["topic"], sid, L["unit"]))
                if st["k"] is None:
                    bad.append("%s: station %s is not openable in an experience"
                               % (q["id"], sid))
                return bad
    return ["%s: revisit station %s is not in the course" % (q["id"], sid)]
