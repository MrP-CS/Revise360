# Builds the teacher answer sheet spec for a lesson, from the same dict the worksheet uses.
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
import json, re, subprocess, itertools
from buildws import wsfile

LABEL = {"1.1": "OCR J277 1.1 Systems architecture", "1.2": "OCR J277 1.2 Memory and storage",
         "1.3": "OCR J277 1.3 Computer networks", "1.4": "OCR J277 1.4 Network security",
         "2.3": "OCR J277 2.3 Producing robust programs", "2.4": "OCR J277 2.4 Boolean logic", "1.5": "OCR J277 1.5 Systems software", "1.6": "OCR J277 1.6 Ethical, legal, cultural and environmental impacts", "2.1": "OCR J277 2.1 Algorithms"}

def bits(n, b=8): return format(n, "0%db" % b)

def answer_of(t):
    """The correct answer to one interactive task, written for a teacher."""
    k = t["t"]
    if k == "memory":
        ram = t["ram"]; left = ram; inram = []; disk = []
        for p in t["programs"]:
            (inram if p["size"] <= left else disk).append(p["name"])
            if p["size"] <= left: left -= p["size"]
        return f"RAM ({ram} blocks): " + ", ".join(inram) + (". Virtual memory: " + ", ".join(disk) if disk else ". Nothing needs virtual memory")
    if k == "permissions":
        return "; ".join(f["name"] + ": " + ", ".join(f"{g} = {['None','Read','Read/write'][f['want'][g]]}" for g in t["groups"]) for f in t["files"])
    if k == "impact":
        lv = t.get("levels") or ["No real effect", "Benefits", "Loses out"]
        g0 = t["groups"][0]
        return "; ".join(f"{s2['name']}: {lv[s2['want'][g0]]}" for s2 in t["stakeholders"])
    if k == "defrag":
        return "Every file gathered into one continuous run, with all the free space together at the end"
    if k == "trace":
        out = []
        for r, row in enumerate(t["answer"]):
            cells = [f"{t['columns'][c]}={v}" for c, v in enumerate(row) if t["rows"][r][c] == ""]
            if cells: out.append("row " + str(r + 1) + ": " + ", ".join(str(x) for x in cells))
        return "; ".join(out)
    if k == "bugline":
        return f"Line {t['line']}, a {t['kind'].lower()} error. Fix: {t.get('fix', 'see the code')}"
    if k == "searchstep":
        lst = t["list"]; tgt = t["target"]
        seq = []
        if t.get("mode") == "linear":
            for i, v in enumerate(lst):
                seq.append(v)
                if v == tgt: break
        else:
            lo, hi = 0, len(lst) - 1
            while lo <= hi:
                mid = (lo + hi) // 2; seq.append(lst[mid])
                if lst[mid] == tgt: break
                if lst[mid] < tgt: lo = mid + 1
                else: hi = mid - 1
        return "Checks, in order: " + ", ".join(str(v) for v in seq) + f" ({len(seq)} check" + ("" if len(seq) == 1 else "s") + ")"
    if k == "sortstep":
        a2 = list(t["list"])
        if t.get("mode") == "insertion": a2.sort()
        else:
            for i in range(len(a2) - 1):
                if a2[i] > a2[i + 1]: a2[i], a2[i + 1] = a2[i + 1], a2[i]
        return ("After one pass: " if t.get("mode") != "insertion" else "Sorted: ") + ", ".join(str(v) for v in a2)
    if k == "mcq": return t["a"][0]
    if k == "multi": return "; ".join(t["correct"])
    if k == "sort": return "; ".join(f"{i[0]} = {i[1]}" for i in t["items"])
    if k == "match": return "; ".join(f"{a} → {b}" for a, b in t["pairs"])
    if k == "order": return " → ".join(t["steps"])
    if k == "convert":
        src = {"denary": str(t["value"]), "binary": bits(t["value"]), "hex": "%02X" % t["value"]}[t["from"]]
        out = {"denary": str(t["value"]), "binary": bits(t["value"]), "hex": "%02X" % t["value"]}[t["to"]]
        return f"{src} ({t['from']}) = {out} ({t['to']})"
    if k == "addshift":
        if t.get("mode") == "add":
            s = t["a"] + t["b"]
            return (f"{bits(t['a'])} + {bits(t['b'])} = {bits(s & 255)} ({t['a']} + {t['b']} = {s})"
                    + (", and the answer needs a 9th bit, so an overflow error occurs" if s > 255 else ", with no overflow"))
        v, pl, d = t["value"], t.get("places", 1), t.get("dir", "left")
        r = (v << pl) & 255 if d == "left" else v >> pl
        return f"{bits(v)} shifted {pl} place(s) {d} = {bits(r)} ({v} {'×' if d == 'left' else '÷'} {2**pl} = {r})"
    if k == "table":
        import sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        vs = t.get("inputs") or sorted(set(c for c in re.sub("AND|OR|NOT", "", t["expr"]) if c.isalpha()))
        return f"Truth table for {t.get('out','Q')} = {t['expr']} over {len(vs)} inputs ({2**len(vs)} rows); output is 1 wherever the expression is true"
    if k == "circuit": return f"Any circuit equivalent to {t['expr']} (the site accepts any layout that gives the same truth table)"
    if k == "expr": return f"{t.get('out','Q')} = {t['expr']} (or any equivalent expression)"
    if k == "pixels": return f"The {t['w']} × {t['h']} image shown, at {t['depth']}-bit colour depth ({t['w']*t['h']*t['depth']} bits raw)"
    if k == "sound": return f"One sample per column at the level nearest the wave ({t['samples']} × {t['depth']} = {t['samples']*t['depth']} bits)"
    if k in ("sprint", "defence", "blitz"): return "Scored by the game; no fixed answer"
    return "See the experience"

def make(L, out_dir=OUT_S):
    ws = L["ws"]
    S = dict(topicLabel=LABEL[L["topic"]], lesson=L["lesson"], title=ws["title"], expName=L["title"],
             footer=f"{L['topic']} Lesson {L['lesson']}: {ws['title']}",
             out=out_dir + wsfile(L).replace("_Worksheet.docx", "_ANSWERS.docx"))
    S["starter"] = ws.get("starter")
    if S["starter"]:
        S["starterAnswer"] = ["Accept any sensible attempt: this is a hook, not an assessment.",
                              "Look for the vocabulary from the lesson objectives appearing in students' own words.",
                              "Students who are stuck should still write something: the experience will correct it."]
        S["starterNote"] = "Take two or three answers, then leave it open. Come back to it in the plenary, when they can answer it properly."
    st_out = []
    for st in L["stations"]:
        qs = [dict(q=t.get("q", ""), a=answer_of(t)) for t in st["tasks"]]
        st_out.append(dict(name=st["name"], facts=st["bullets"], challenge=st.get("challenge"),
                           challengeAnswer=["Model answer: " + st["bullets"][0]] + (["Also credit: " + st["bullets"][1]] if len(st["bullets"]) > 1 else []),
                           questions=qs, note=st.get("teacherNote")))
    S["stations"] = st_out
    fin = L.get("final")
    if fin:
        S["final"] = dict(name=fin["name"], questions=[dict(q=t.get("q", ""), a=answer_of(t)) for t in fin["tasks"]],
                          note="Students should have predicted these on the worksheet before tapping the star. Mark the prediction, not just the final answer.")
    # exam mark scheme: indicative points drawn from the lesson's own teaching points
    pool = [b for st in L["stations"] for b in st["bullets"]]
    exam = []
    for q, marks, _lines in ws.get("exam", []):
        words = set(w.lower().strip(".,?()") for w in q.split() if len(w) > 4)
        scored = sorted(pool, key=lambda b: -len(words & set(w.lower().strip(".,?()") for w in b.split())))
        pts = [b for b in scored if len(words & set(w.lower().strip(".,?()") for w in b.split()))][:max(2, min(marks + 1, 5))]
        if not pts: pts = scored[:3]
        exam.append(dict(q=q, marks=marks, points=pts + ["Accept any other correct point relevant to the question."],
                         note="One mark per point, to a maximum of %d." % marks if marks > 1 else "One mark for a correct answer."))
    S["exam"] = exam
    S["common"] = ws.get("common") or [
        "Naming a term without saying what it does: most questions need the term and its purpose.",
        "Answering 'it's faster' or 'it's better' with no reason: link it to the characteristic the question is about.",
        "Repeating the question in the answer and stopping there."]
    S["scoreGuide"] = True
    spec = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wsspecs") + "/ans_%s_%s.json" % (L["topic"].replace(".", ""), L["lesson"])
    json.dump(S, open(spec, "w"))
    r = subprocess.run(["node", os.path.join(os.path.dirname(os.path.abspath(__file__)), "ansgen.js"), spec], capture_output=True, text=True, cwd=os.path.dirname(os.path.abspath(__file__)))
    print(r.stdout.strip() or r.stderr.strip()[:400])
    return S["out"].split("/")[-1]
