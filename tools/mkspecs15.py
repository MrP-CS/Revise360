"""Regenerate specs15.py from what topic 1.5 left behind.

specs15.py was lost with the machine it was written on, so topic 1.5 could not
be re-rendered the way every other topic can. Everything needed to rebuild it
still exists in three places:

  experiences/ss-l0N.json   station names, every task, info markers, 3D models
  worksheets/SS_*.docx      objectives, starter, key terms, exam, confidence
  the rendered scenes       the wall bullets and the illustrations

The first two are mechanical and read here. The last is not: those were
transcribed by reading the panels, and live in walls15.py beside this file.
Running this writes specs15.py; the check is that re-rendering from it
reproduces the committed scenes.

  python3 mkspecs15.py > specs15.py
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE
import json, re
from reconstruct import doc_lines, between, find_ws
from walls15 import BULLETS, ILL, INTRO, KEYWORDS, DESCRIPTION, FINAL_INTRO
from reconstruct import reconstruct

LESSONS = ["ss-l01", "ss-l02", "ss-l03", "ss-l04"]
K15 = "1.5 Systems software"
SUB15 = "OCR J277 Paper 1  |  Computer systems"

def py(v, indent=0):
    """Readable Python literal, so the generated file can be edited by hand."""
    pad = " " * indent
    if isinstance(v, str):
        return repr(v)
    if isinstance(v, (int, float, bool)) or v is None:
        return repr(v)
    if isinstance(v, (list, tuple)):
        open_, close = ("[", "]") if isinstance(v, list) else ("(", ")")
        inner = ", ".join(py(x) for x in v)
        if len(inner) + indent < 110 and "\n" not in inner:
            return f"{open_}{inner}{close}"
        parts = ",\n".join(pad + "  " + py(x, indent + 2) for x in v)
        return f"{open_}\n{parts}]" if isinstance(v, list) else f"{open_}\n{parts})"
    if isinstance(v, dict):
        # dict(k=v) only works when every key is a bare identifier; task data has
        # keys like "Network manager", so those have to use brace form.
        if all(isinstance(k, str) and k.isidentifier() for k in v):
            inner = ", ".join(f"{k}={py(x)}" for k, x in v.items())
            if len(inner) + indent < 110:
                return f"dict({inner})"
            parts = ",\n".join(pad + "     " + f"{k}={py(x, indent + 5)}" for k, x in v.items())
            return f"dict(\n{parts})"
        inner = ", ".join(f"{py(k)}: {py(x)}" for k, x in v.items())
        if len(inner) + indent < 110:
            return "{" + inner + "}"
        parts = ",\n".join(pad + "  " + f"{py(k)}: {py(x, indent + 2)}" for k, x in v.items())
        return "{\n" + parts + "}"
    raise TypeError(type(v))

def task_src(t, indent):
    """Tasks come straight out of the experience, so the spec and the thing the
    pupil answers cannot disagree. The helper forms are used where they fit."""
    k = t["t"]
    if k == "mcq":
        return f"mcq({py(t['q'])}, {py(t['a'][0])}, {py(list(t['a'][1:]))}, {py(t.get('fb',''))})"
    if k == "multi":
        return f"multi({py(t['q'])}, {py(t['opts'])}, {py(t['correct'])}, {py(t.get('fb',''))})"
    if k == "sort":
        return f"sort({py(t['q'])}, {py(t['cats'])}, {py(t['items'])}, {py(t.get('fb',''))})"
    if k == "match":
        return f"match({py(t['q'])}, {py(t['pairs'])}, {py(t.get('fb',''))})"
    if k == "order":
        return f"order({py(t['q'])}, {py(t['steps'])}, {py(t.get('fb',''))})"
    return py(t, indent)          # memory, permissions, defrag: kept as literals

def ws_for(eid):
    path, e = find_ws(eid)
    lines = doc_lines(path)
    objectives = [o for o in between(lines, r"By the end of the lesson I will",
                                     [r"^Starter", r"Key terminology"]) if not o.startswith("\t")]
    sb = between(lines, r"^Starter: before you put the headset on", [r"Key terminology", r"^The stations"])
    keyterms = [l for l in between(lines, r"^Key terminology", [r"^The stations"])
                if not re.fullmatch(r"[0-9.\s]*", l)]
    kq = between(lines, r"^Key question", [r"^Exam practice", r"How confident"])
    exam = []
    for ln in between(lines, r"^Exam practice", [r"How confident am I"]):
        m = re.match(r"^[a-z]\)\s*(.+?)\s*\[(\d+)\]\s*$", ln)
        if m: exam.append((m.group(1).strip(), int(m.group(2)), int(m.group(2))))
    conf = [l for l in between(lines, r"^How confident am I", [r"^Revisit", r"^Revise 360"])
            if l.lower() not in ("objective", "not yet", "getting there", "confident")]
    title = lines[1] if len(lines) > 1 else e["title"]
    starter_lines = 2
    for i, l in enumerate(lines):
        if l.startswith("Starter: before you put the headset on"):
            nums = [x for x in lines[i:i+14] if re.fullmatch(r"\d+\.", x.strip())]
            if nums: starter_lines = len(nums)
    d = dict(title=title, objectives=objectives)
    if sb: d["starter"] = sb[0]
    d["starter_lines"] = starter_lines
    d["keyterms"] = keyterms
    if kq: d["keyq"] = kq[0]
    d["exam"] = exam
    d["confidence"] = conf
    return d, e

OUT = []
w = OUT.append
w('"""Topic 1.5 Systems software.')
w("")
w("Reconstructed by mkspecs15.py after the original spec was lost: the tasks,")
w("info markers and models come from the built experiences, the worksheet fields")
w("from the worksheets, and the wall bullets and illustrations were read off the")
w("rendered scenes. Re-rendering from this file reproduces the committed scenes.")
w('"""')
w("from kit import mcq, multi, sort, match, order")
w("")
w(f'K15 = "{K15}"')
w(f'SUB15 = "{SUB15}"')
w("")
w('def memory(q, **kw): return dict(t="memory", q=q, **kw)')
w('def permissions(q, **kw): return dict(t="permissions", q=q, **kw)')
w('def defrag(q, **kw): return dict(t="defrag", q=q, **kw)')
w("")

for n, eid in enumerate(LESSONS, 1):
    ws, e = ws_for(eid)
    sc = e["scenes"][0]
    stations = sc["stations"]
    core = [s for s in stations if not s["name"].lower().startswith("final challenge")]
    fin = next(s for s in stations if s["name"].lower().startswith("final challenge"))
    rec = reconstruct(eid)
    FACTS = {s['name']: s['fact'] for s in rec['stations']}
    CHAL  = {s['name']: s['challenge'] for s in rec['stations']}
    # Topic 1.5 was rendered before the _360 suffix became the convention, so
    # the names are normalised here rather than carried forward.
    base = re.sub(r"(_360)?\.jpg$", "", sc["img"].split("/")[-1]) + "_360"

    w(f'# ---------------------------------------------------------------- lesson {n}')
    w(f'L{n} = dict(id="{eid}", topic="1.5", lesson={n}, title={py(e["title"])}, img={py(base)},')
    w(f'  description={py(DESCRIPTION[eid])},')
    w(f'  kicker=f"{{K15}}  |  Lesson {n}", scene_title={py(e["title"])}, subtitle=SUB15,')
    w(f'  intro={py(INTRO[eid])},')
    w(f'  keywords={py(KEYWORDS[eid])},')
    w('  stations=[')
    for s in core:
        nm = s["name"]
        w(f'   dict(name={py(nm)}, bullets={py(BULLETS[eid][nm], 8)},')
        w(f'        challenge={py(CHAL[nm])}, ill={py(ILL[eid][nm], 8)}, fact={py(FACTS[nm])},')
        w('        tasks=[' + (",\n               ".join(task_src(t, 15) for t in s["tasks"])) + ']),')
    w('  ],')
    w(f'  final=dict(name={py(fin["name"])}, floor_title={py(fin["name"])},')
    w(f'             intro={py(FINAL_INTRO[eid])},')
    w(f'             ill={py(ILL[eid].get("__final__"), 13)},')
    w('             tasks=[' + (",\n                    ".join(task_src(t, 20) for t in fin["tasks"])) + ']),')
    w('  info=[')
    for i, inf in enumerate(sc.get("info", [])):
        w(f'   ({i}, {py(inf["title"])}, {py(inf["text"])}),')
    w('  ],')
    if sc.get("models"):
        w('  models=[')
        for m in sc["models"]:
            w(f'   (("{m["face"]}", {m["x"]}, {m["y"]}), {py(m["model"])}, {py(m["title"])}, {py(m["text"])}),')
        w('  ],')
    w(f'  ws=dict(')
    for k, v in ws.items():
        w(f'    {k}={py(v, 6)},')
    w('  ))')
    w("")

print("\n".join(OUT))
