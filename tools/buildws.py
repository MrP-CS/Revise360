import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
import json, subprocess, sys, importlib
from kit import export
import re as _re, itertools as _it
def _vars(t): return t["inputs"] if t.get("inputs") else sorted(set(c for c in _re.sub("AND|OR|NOT", "", t["expr"]) if c.isalpha()))
# What an activity is worth: the one rule, from kit.py, which tools/tests/
# smokemarks.py checks against Store.marks in js/store.js. There were three
# copies of this table - here, in kit.py and in store.js - and they had already
# drifted: "arena" was worth nothing in the browser and crashed in the build.
from kit import task_marks as marks


def code_blocks(tasks):
    """The paper side of a station whose work is done at a keyboard.

    Printing ruled space for every program on the station is the obvious thing
    to do and the wrong one: the pupil writes those in the editor, where they
    run and are marked, and it put a programming worksheet at fourteen pages
    against six for every other topic. What paper is good for is the part the
    editor cannot do - deciding what the program has to do before typing it,
    and keeping a record of what was finished.

    So each code station prints as a checklist of its tasks with their marks,
    and one planning block for the task the pupil found hardest. Exam-style
    writing space is at the end of the sheet, where it already was.

    No model solution is on this path: solutions are not in the bank at all,
    they live in answers/, and nothing here reads them.
    """
    # The stage column is what makes this sheet usable in a lesson. A teacher
    # setting work can say "the core today, challenges if you get there", and a
    # pupil can see at a glance that an activity is one to run rather than one
    # to write. The words match the ones on the screen exactly.
    stage = {"try": "Run it", "predict": "Predict", "change": "Change it",
             "complete": "Complete it", "debug": "Fix it", "build": "Write it"}
    rows = [[t["q"], "Challenge (optional)" if t.get("opt") else stage.get(t.get("kind"), "Write it"),
             str(marks(t)), ""] for t in tasks]
    return [dict(kind="table", title="Tick each one off as you finish it in the editor",
                 head=["Activity", "What to do", "Marks", "Done"], rows=rows),
            dict(kind="lines", n=3,
                 title="Plan the one you found hardest: what is typed in, what happens to it, what is displayed.")]
def logic_blocks(tasks):
    out = []
    code = [t for t in tasks if t["t"] == "code"]
    if code:
        # A station of code tasks prints as one block, not one per task
        out += code_blocks(code)
        tasks = [t for t in tasks if t["t"] != "code"]
    for t in tasks:
        if t["t"] in ("mcq", "multi"): out.append(dict(kind="lines", title=t["q"], n=2)); continue
        if t["t"] == "memory":
            out.append(dict(kind="lines", title=f"{t['q']} List what went into RAM and what went to virtual memory, and say why:", n=3)); continue
        if t["t"] == "permissions":
            out.append(dict(kind="table", title="Access levels: write None, Read or Read/write in each box",
                            head=["File"] + t["groups"], rows=[[f["name"]] + [""] * len(t["groups"]) for f in t["files"]])); continue
        if t["t"] == "impact":
            out.append(dict(kind="table", title="For each stakeholder, say how the change affects them and why",
                            head=["Stakeholder", "Effect", "Why"], rows=[[s2["name"], "", ""] for s2 in t["stakeholders"]])); continue
        if t["t"] == "defrag":
            out.append(dict(kind="lines", title="Explain what defragmentation does to the blocks on a disk, and why it makes files open faster:", n=3)); continue
        if t["t"] == "trace":
            out.append(dict(kind="table", title=t["q"], head=t["columns"],
                            rows=[[v if v else "" for v in row] for row in t["rows"]])); continue
        if t["t"] == "bugline":
            out.append(dict(kind="code", title=t["q"], lines=[f"{i+1:>2}  {ln}" for i, ln in enumerate(t["code"])]))
            out.append(dict(kind="lines", title="Line number, kind of error (syntax or logic), and how you would fix it:", n=3)); continue
        if t["t"] == "searchstep":
            out.append(dict(kind="lines", title=f"{t['q']} List the items checked, in order, and how many checks it took:", n=3)); continue
        if t["t"] == "sortstep":
            out.append(dict(kind="lines", title=f"{t['q']} Write the list after each swap:", n=4)); continue
        if t["t"] == "convert":
            src = {"denary": str(t["value"]), "binary": format(t["value"], "08b"), "hex": "%02X" % t["value"]}[t["from"]]
            out.append(dict(kind="lines", title=f"Convert {src} from {t['from']} into {t['to']}:", n=1))
        elif t["t"] == "addshift":
            if t.get("mode") == "add": out.append(dict(kind="lines", title=f"Add {format(t['a'], '08b')} and {format(t['b'], '08b')}. State whether an overflow occurs:", n=2))
            else: out.append(dict(kind="lines", title=f"Shift {format(t['value'], '08b')} {t.get('places',1)} place(s) {t.get('dir','left')}, and give the denary result:", n=2))
        elif t["t"] == "pixels": out.append(dict(kind="lines", title=f"Sketch the {t['w']} × {t['h']} image, then calculate its file size ({t['w']} × {t['h']} × {t['depth']} bits):", n=3))
        elif t["t"] == "sound": out.append(dict(kind="lines", title=f"Sketch the sampled wave, then calculate the file size ({t['samples']} samples × {t['depth']} bits):", n=3))
        elif t["t"] == "circuit": out.append(dict(kind="draw", title="Draw the logic diagram for " + t["expr"]))
        elif t["t"] == "expr": out.append(dict(kind="lines", title="Write the expression for the diagram: Q = ...", n=2))
        elif t["t"] == "table":
            vs = _vars(t); head = vs + [c[0] for c in t.get("cols", [])] + [t.get("out", "Q")]
            rows = [[str(b) for b in bits] + [""] * (len(head) - len(vs)) for bits in _it.product([0, 1], repeat=len(vs))]
            out.append(dict(kind="table", title="Truth table for " + t.get("out", "Q") + " = " + t["expr"], head=head, rows=rows))
    return out
def wsfile(L):
    return L["img"].replace("_360", "") + "_Worksheet.docx"
def make(L):
    W = L["ws"]; topic = L["topic"]
    label = {"1.1": "OCR J277 1.1 Systems architecture", "1.3": "OCR J277 1.3 Computer networks", "1.4": "OCR J277 1.4 Network security", "2.3": "OCR J277 2.3 Producing robust programs", "1.2": "OCR J277 1.2 Memory and storage", "2.4": "OCR J277 2.4 Boolean logic", "1.5": "OCR J277 1.5 Systems software", "1.6": "OCR J277 1.6 Ethical, legal, cultural and environmental impacts", "2.1": "OCR J277 2.1 Algorithms", "2.2": "OCR J277 2.2 Programming fundamentals", "PY": "Python course  |  Beyond OCR J277"}[topic]
    fin = L["final"]; task = fin["tasks"][0]
    if task["t"] == "code":
        rows = []; right = ""; instr = "plan your program on paper first."
    elif task["t"] in ("memory", "permissions", "defrag", "impact", "trace", "bugline", "searchstep", "sortstep"):
        rows = []; right = ""; instr = "plan your answer here first."
    elif task["t"] in ("mcq", "multi"):
        rows = []; right = ""; instr = "note your answers below."
    elif task["t"] in ("circuit", "expr", "table", "convert", "addshift", "pixels", "sound"):
        rows = []; right = ""; instr = "work these out on paper first."
    elif task["t"] == "sort":
        rows = [it[0] for it in task["items"]]; right = " / ".join(task["cats"]); instr = "write your answer for each one."
    elif task["t"] == "match":
        rows = [p[0] for p in task["pairs"]]; right = "Matches with..."; instr = "write what each one matches with."
    else:
        rows = task["steps"][::-1]; right = "Position (1, 2, 3...)"; instr = "number the steps in the right order."
    total = sum(marks(t) for s in L["stations"] for t in s["tasks"]) + sum(marks(t) for t in fin["tasks"])
    # A lesson whose work is done at a keyboard is used differently, and the
    # sheet says so instead of "your first answer is the one that counts".
    is_code = any(t.get("t") == "code" for s2 in L["stations"] for t in s2["tasks"])
    S = dict(topicLabel=label, lesson=L["lesson"], title=W["title"], sub=f"Worksheet for the 360° experience: {L['title']}", expName=L["title"],
             objectives=W["objectives"], starter=W.get("starter"), starterLines=W.get("starter_lines", 2), keyterms=W.get("keyterms", []),
             stations=[dict(name=s["name"], fact=s.get("fact"), challenge=s.get("challenge"), logic=logic_blocks(s["tasks"])) for s in L["stations"]],
             final=dict(title=fin["name"], instr=instr, left="Item", right=right, rows=rows, logic=logic_blocks(fin["tasks"])), total=total, revision=bool(L.get("revision")),
             results=[[s["name"], sum(marks(t) for t in s["tasks"])] for s in L["stations"]] + [[fin["name"], sum(marks(t) for t in fin["tasks"])]],
             code=is_code, extra=W.get("extra"), checklist=W.get("checklist"), keyq=W.get("keyq"), exam=W.get("exam", []), rag=W.get("rag"), confidence=W["confidence"],
             footer=f"{topic} Lesson {L['lesson']}: {W['title']}", out=OUT_S + f"{wsfile(L)}")
    path = f"wsspecs/{L['id']}.json"; json.dump(S, open(path, "w"), ensure_ascii=False)
    r = subprocess.run(["node", "wsgen.js", path], capture_output=True, text=True); print(r.stdout.strip() or r.stderr[-500:])
    return wsfile(L)
if __name__ == "__main__":
    for mod, names in (("specs13", ["L3", "L5", "L9", "L10", "L11", "L12", "L13", "L14"]), ("specs23", ["L1", "L2", "L5", "L6"]),
                       ("specspy", ["L%d" % n for n in range(1, 14)]),
                       ("specs22", ["L%d" % n for n in range(1, 8)])):
        m = importlib.import_module(mod)
        for n in names: make(getattr(m, n))
    # assessment reflections
    refl = [dict(topicLabel="OCR J277 1.3 Computer networks", lesson=8, title="Assessment 1 reflection", sub="Use after your 1.3 Test (lessons 1 to 7) has been marked",
                 rows=[["1", "Types of network: LAN, WAN, standalone", "-"], ["2", "Factors affecting network performance", "-"], ["3", "Client-server and peer-to-peer", "-"],
                       ["4", "Hardware used to connect a LAN", "-"], ["5", "The internet, DNS, hosting and the cloud", "-"], ["6", "Star and mesh topologies", "-"]],
                 total="__", revisit="Types of network: zoom out (L1), Network control room (L2), Network showdown (L3), Mission: wire up the school (L4), Inside the internet (L5), Star and mesh networks (L6), Revision HQ (L7).",
                 footer="1.3 Lesson 8: Assessment 1 reflection", out=OUT_S + "L8_Assessment1_Reflection_Worksheet.docx", kind="reflection"),
            dict(topicLabel="OCR J277 2.3 Producing robust programs", lesson=7, title="End-of-topic test reflection", sub="Use after your 2.3 test has been marked",
                 rows=[["1", "Ways to make code easier to maintain", 3], ["2", "Iterative testing", 3], ["3", "Stating a logic error", 1], ["4", "Syntax errors", 2],
                       ["5", "Input validation", 1], ["6", "Locating and explaining an error", 2], ["7", "Suitable test data", 6], ["8", "Length checks", 2]],
                 total=20, revisit="Security desk (L1), Cyber defence HQ (L2), Code clinic (L3), Bug hunt lab (L4), Test lab (L5), Revision HQ 2.3 (L6).",
                 footer="2.3 Lesson 7: Test reflection", out=OUT_S + "RP_L7_Test_Reflection_Worksheet.docx", kind="reflection"),
            dict(topicLabel="OCR J277 2.2 Programming fundamentals", lesson=8, title="End-of-topic test reflection", sub="Use after your 2.2 test has been marked",
                 rows=[["1", "Variables, constants, input, output and assignment", "-"], ["2", "Sequence, selection and iteration", "-"],
                       ["3", "Data types, casting and the operators", "-"], ["4", "String manipulation", "-"], ["5", "File handling: open, read, write, close", "-"],
                       ["6", "Records and SQL", "-"], ["7", "Arrays, one- and two-dimensional", "-"], ["8", "Procedures, functions, parameters and scope", "-"],
                       ["9", "Random number generation", "-"]],
                 total="__", revisit="Variable store (L1), Type foundry (L2), Filing room (L3), Record vault (L4), Array yard (L5), Chance machine (L6), Revision HQ 2.2 (L7). For the techniques as code you write and run, work through the Python course.",
                 footer="2.2 Lesson 8: Test reflection", out=OUT_S + "PF_L08_EndOfTopicTest_Reflection_Worksheet.docx", kind="reflection")]
    for i, S in enumerate(refl):
        path = f"wsspecs/refl{i}.json"; json.dump(S, open(path, "w"), ensure_ascii=False)
        r = subprocess.run(["node", "wsgen.js", path], capture_output=True, text=True); print(r.stdout.strip() or r.stderr[-500:])
