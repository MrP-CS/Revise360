"""Rebuild a deck spec for a lesson whose specs module was lost.

1.5 (all four lessons) and 2.3 lessons 3 and 4 have no specs module: 1.5's was
lost with the machine it sat on, and 2.3 L3/L4 were drawn by the bespoke rp3.py
and rp4.py, which hold no lesson data. Their content survives in three places,
and this pulls from all three:

  the worksheet .docx   objectives, starter, key terms, the fact stems, each
                        station's challenge, the key question, exam practice and
                        the confidence checklist
  the experience .json  station names, and the info marker titles and text
  the rendered image    the wall-panel bullets, which exist nowhere else

The first two are mechanical and done here. The bullets are not: they have to be
read off the scene, so this leaves them empty and prints what is missing.
Pair it with facefaces.py, which extracts the readable wall panels.

  python3 reconstruct.py rp-l03 rp-l04 > /tmp/draft.json
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE
import json, re, zipfile, html, glob

TOPIC_OF = {"ns": "1.4", "ss": "1.5", "rp": "2.3", "bl": "2.4", "al": "2.1",
            "sa": "1.1", "ms": "1.2", "nw": "1.3", "el": "1.6", "pl": "2.5"}
LABEL = {"1.1": "OCR J277 1.1 Systems architecture", "1.2": "OCR J277 1.2 Memory and storage",
         "1.3": "OCR J277 1.3 Computer networks", "1.4": "OCR J277 1.4 Network security",
         "1.5": "OCR J277 1.5 Systems software",
         "1.6": "OCR J277 1.6 Ethical, legal, cultural and environmental impacts",
         "2.1": "OCR J277 2.1 Algorithms", "2.3": "OCR J277 2.3 Producing robust programs",
         "2.4": "OCR J277 2.4 Boolean logic", "2.5": "OCR J277 2.5 Programming languages and IDEs"}
PAPER = {"1": "OCR J277 Paper 1  |  Computer systems",
         "2": "OCR J277 Paper 2  |  Computational thinking, algorithms and programming"}
SUBTITLE = {"1.4": "OCR J277 Paper 1  |  Computer systems",
            "1.5": "OCR J277 Paper 1  |  Computer systems",
            "2.3": "OCR J277 Paper 2  |  Computational thinking, algorithms and programming",
            "2.4": "OCR J277 Paper 2  |  Computational thinking, algorithms and programming"}

def doc_lines(path):
    """Worksheet text with paragraph and cell boundaries preserved."""
    x = zipfile.ZipFile(path).read("word/document.xml").decode("utf8")
    x = x.replace("</w:tc>", "\t").replace("</w:p>", "\n")
    x = html.unescape(re.sub(r"<[^>]+>", "", x))
    return [ln.strip() for ln in x.split("\n")]

def between(lines, start_pat, stop_pats):
    """The non-empty lines after the line matching start_pat, up to any stop."""
    out, on = [], False
    for ln in lines:
        if not on:
            if re.search(start_pat, ln, re.I): on = True
            continue
        if any(re.search(p, ln, re.I) for p in stop_pats): break
        s = ln.strip().strip("\t").strip()
        if s: out.append(s)
    return out

def find_ws(eid):
    e = json.load(open(SITE / "experiences" / f"{eid}.json"))
    # Most scenes are <PREFIX>_Lnn_Name_360.jpg; topic 1.5's are missing the
    # _360 suffix, so strip it only if it is there.
    base = e["scenes"][0]["img"].split("/")[-1]
    base = re.sub(r"(_360)?\.jpg$", "", base)
    hits = glob.glob(str(SITE / "worksheets" / f"{base}_Worksheet.docx"))
    return (hits[0] if hits else None), e

def reconstruct(eid):
    wspath, e = find_ws(eid)
    if not wspath:
        raise SystemExit(f"{eid}: no worksheet found, nothing to reconstruct from")
    lines = doc_lines(wspath)
    sc = e["scenes"][0]
    pre = eid.split("-")[0]
    topic = TOPIC_OF[pre]
    stations = [s for s in sc["stations"]]
    core = [s for s in stations if not s["name"].lower().startswith("final challenge")]
    fin = next((s for s in stations if s["name"].lower().startswith("final challenge")), None)

    # --- the worksheet header: line 0 is "<label>  |  Lesson n", line 1 the ws title
    ws_title = lines[1] if len(lines) > 1 else e["title"]

    objectives = between(lines, r"By the end of the lesson I will", [r"^Starter", r"Key terminology"])
    objectives = [o for o in objectives if o and not o.startswith("\t")]

    starter_block = between(lines, r"^Starter: before you put the headset on",
                            [r"Key terminology", r"^The stations"])
    starter = starter_block[0] if starter_block else None

    keyterms = []
    for ln in between(lines, r"^Key terminology", [r"^The stations", r"^" + re.escape(e["title"])]):
        if re.fullmatch(r"[0-9.\s]*", ln): continue
        keyterms.append(ln)

    keyq_block = between(lines, r"^Key question", [r"^Exam practice", r"How confident"])
    keyq = keyq_block[0] if keyq_block else None

    # exam practice: "a)  <question>  [n]"
    exam = []
    for ln in between(lines, r"^Exam practice", [r"How confident am I"]):
        m = re.match(r"^[a-z]\)\s*(.+?)\s*\[(\d+)\]\s*$", ln)
        if m: exam.append(dict(q=m.group(1).strip(), marks=int(m.group(2))))

    confidence = []
    for ln in between(lines, r"^How confident am I", [r"^Revisit", r"^Revise 360"]):
        if ln.lower() in ("objective", "not yet", "getting there", "confident"): continue
        confidence.append(ln)

    # challenges and fact stems, read per station out of that station's block
    challenges, facts = {}, {}
    for i, s in enumerate(core):
        nxt = core[i+1]["name"] if i+1 < len(core) else "Final challenge"
        blk = between(lines, rf"^{re.escape(str(i+1))}\s+{re.escape(s['name'])}",
                      [rf"^{re.escape(str(i+2))}\s+{re.escape(nxt)}", r"^★"])
        for ln in blk:
            if ln.startswith("Key fact in your own words:"):
                facts[s["name"]] = ln.split(":", 1)[1].strip()
            elif ln.startswith("Challenge:"):
                challenges[s["name"]] = ln.split(":", 1)[1].strip()

    # The final challenge's prompt is the question the player is actually asked,
    # which is in the experience, not the worksheet. The worksheet's "Before you
    # tap the star..." line is the written instruction and makes a good fallback;
    # everything after it is table rows, which must not be mistaken for prose.
    fin_intro = ""
    if fin and fin.get("tasks"):
        fin_intro = fin["tasks"][0].get("q", "") or ""
    if not fin_intro:
        fin_block = between(lines, r"^★", [r"^Your score"])
        fin_intro = next((l for l in fin_block if l.startswith("Before you tap")), "")

    d = {}
    d["id"] = eid
    d["lesson"] = e["lesson"]
    d["title"] = e["title"]
    d["topic"] = topic
    d["kicker"] = f"{LABEL[topic].replace('OCR J277 ', '')}  |  Lesson {e['lesson']}"
    d["subtitle"] = SUBTITLE.get(topic, PAPER[topic[0]])
    d["intro"] = ""                      # written by hand: it is the hook, not data
    # Not every worksheet has a key terminology box (2.3 L4 has none), so fall
    # back to the station names, which are the lesson's subject headings anyway.
    d["keywords"] = (keyterms or [s["name"] for s in core])[:5]
    d["objectives"] = objectives
    if starter: d["starter"] = starter
    if keyq: d["keyq"] = keyq
    d["keyterms"] = keyterms
    d["stations"] = [dict(name=s["name"], bullets=[],
                          challenge=challenges.get(s["name"], ""),
                          fact=facts.get(s["name"], "")) for s in core]
    d["final"] = dict(name=fin["name"] if fin else "Final challenge", intro=fin_intro or "")
    d["info"] = [dict(title=i.get("title", ""), text=i.get("text", "")) for i in sc.get("info", [])]
    d["exam"] = exam
    d["confidence"] = confidence
    d["wsfile"] = os.path.basename(wspath)
    return d

if __name__ == "__main__":
    ids = [a for a in sys.argv[1:] if not a.startswith("-")]
    out = [reconstruct(i) for i in ids]
    for d in out:
        miss = [f"station {i+1} '{s['name']}'" for i, s in enumerate(d["stations"]) if not s["bullets"]]
        gaps = [k for k in ("intro",) if not d[k]]
        print(f"# {d['id']} L{d['lesson']} {d['title']}: "
              f"{len(d['objectives'])} objectives, {len(d['stations'])} stations, "
              f"{len(d['exam'])} exam, {len(d['confidence'])} confidence, "
              f"{len(d['info'])} info", file=sys.stderr)
        if gaps: print(f"#   still to write: {', '.join(gaps)}", file=sys.stderr)
        print(f"#   bullets needed for: {len(miss)} stations", file=sys.stderr)
    print(json.dumps(out, indent=1, ensure_ascii=False))
