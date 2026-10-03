"""The two download packs for each unit, built from an explicit allowlist.

A teacher downloads a unit in one action and gets exactly two things:

  <unit>_Teaching_Resources.zip   the lesson PowerPoints and the matching student
                                  worksheets, as .docx to edit and .pdf to print,
                                  in numbered lesson folders. Nothing else.
  <unit>_Teacher_Guide.zip        the unit pedagogy, big picture and delivery
                                  guide, every lesson plan as its own PDF, and the
                                  teacher answers where verified ones exist.

The rule that matters more than either is that the 360 experiences are never in a
pack. Not the scene JSON, not the equirectangular images, not the player, not an
exported copy of the website. A teacher downloads documents; the experiences are
used on revise360.co.uk. So a file reaches a pack only by matching a rule in
ALLOW, and tools/tests/smokepacks.py re-opens every pack and fails on anything
outside it.

    R360_PLEX=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \\
      python3 tools/mkpacks.py            # every unit
      python3 tools/mkpacks.py 1.1        # one unit
      python3 tools/mkpacks.py --no-pdf   # skip the slow worksheet PDF conversion
"""
import os
import re
import sys
import json
import glob
import time
import shutil
import zipfile
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from paths import SITE_S                                       # noqa: E402
import mkplans as P                                            # noqa: E402

ROOT = SITE_S.rstrip("/")
RECS = os.path.join(ROOT, "build", "records")
DOCS = os.path.join(ROOT, "build", "unitdocs")
WSPDF = os.path.join(ROOT, "build", "wspdf")
OUT = os.path.join(ROOT, "build", "packs")
SITE_PACKS = os.path.join(ROOT, "packs")

# What a pack may contain, by the name it is stored under. Anything that does not
# match one of these is a bug, not a judgement call.
ALLOW = [
    re.compile(r"^Lesson_\d+_[\w.-]+/[\w.-]+\.pptx$"),
    re.compile(r"^Lesson_\d+_[\w.-]+/[\w.-]+\.docx$"),
    re.compile(r"^Lesson_\d+_[\w.-]+/[\w.-]+\.pdf$"),
    re.compile(r"^README\.txt$"),
    re.compile(r"^[\w.]+_Unit_(Pedagogy|Big_Picture|Delivery_Guide)\.pdf$"),
    re.compile(r"^GCSE_Course_Big_Picture\.pdf$"),
    re.compile(r"^Lesson_Plans/[\w.-]+_LessonPlan\.pdf$"),
    re.compile(r"^Teacher_Answers/[\w.-]+\.(pdf|docx|json|txt)$"),
]

# What must never be in one, whatever else is true. Checked by name and by what
# the bytes look like, because a renamed .jpg is still a scene image.
FORBIDDEN_EXT = {".json", ".js", ".html", ".htm", ".jpg", ".jpeg", ".png", ".webp",
                 ".mp4", ".webm", ".glb", ".gltf", ".wasm", ".css", ".py", ".zip"}
FORBIDDEN_EXT_SOFT = {".json"}      # MANIFEST.json is the one allowed exception


def stamp(paths):
    """One timestamp for a pack, from the newest file that went into it.

    A pack has to be deterministic: built twice from the same files it must come
    out byte for byte the same, or every rebuild writes another 57 MB into the
    repository's history for content that did not change. So nothing in a pack is
    dated "today" - the date is the newest source file's, and every entry inside
    the zip is written with that same timestamp rather than its own.
    """
    newest = max((os.path.getmtime(p) for p in paths if os.path.exists(p)),
                 default=time.time())
    return time.localtime(newest)


def put(z, src, name, when):
    """One file into a zip, at a fixed timestamp and compression."""
    info = zipfile.ZipInfo(name, date_time=when[:6])
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o644 << 16
    with open(src, "rb") as fh:
        z.writestr(info, fh.read())


def text(z, name, body, when):
    info = zipfile.ZipInfo(name, date_time=when[:6])
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o644 << 16
    z.writestr(info, body)


def safe(name):
    return re.sub(r"[^A-Za-z0-9]+", "", name) or "Lesson"


def worksheet_pdf(docx, quiet=False):
    """A print-ready PDF beside the editable worksheet.

    LibreOffice, headless, once per file and only when the PDF is missing or
    older than the .docx: converting 110 worksheets takes minutes and they do not
    change between most builds.
    """
    os.makedirs(WSPDF, exist_ok=True)
    out = os.path.join(WSPDF, os.path.basename(docx)[:-5] + ".pdf")
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(docx):
        return out
    r = subprocess.run(["libreoffice", "--headless", "--convert-to", "pdf",
                        "--outdir", WSPDF, docx], capture_output=True, text=True,
                       timeout=300)
    if not os.path.exists(out):
        if not quiet:
            print("   could not convert %s: %s"
                  % (os.path.basename(docx), (r.stderr or r.stdout)[-160:]))
        return None
    return out


README_A = """Revise 360 - %(unit)s %(title)s
Unit teaching resources

WHAT IS IN HERE
  One folder per lesson, numbered in teaching order. Each holds:
    the lesson PowerPoint (.pptx, editable)
    the student worksheet (.docx to edit, .pdf to print)

  %(lessons)d lessons. Built %(when)s.
%(nothing)s

WHAT IS NOT IN HERE
  The 360-degree experiences. They are not downloadable, and this is not an
  offline version of Revise 360. PowerPoints, worksheets and teacher guides are
  downloadable; the interactive 360-degree experiences are accessed on the
  Revise 360 website.

  Teacher guides, lesson plans and answers are in the companion download,
  %(guide)s.

USING THEM
  The slides are for the front of the room, the worksheet is for writing and for
  the record, and the experience on the website is where a pupil is marked. The
  rule that holds them together is: write first, then answer at the badge.

Revise 360 - a product of Revise 360 Ltd, created by Olly Pettitt.
An independent resource: not written, endorsed or approved by OCR or any exam
board. Classroom use and personal study only.
"""

README_B = """Revise 360 - %(unit)s %(title)s
Unit teacher guide

WHAT IS IN HERE
  %(ped)s        why this unit is taught in this order, what is hard
                 about it, and where support fades
  %(big)s        where the unit sits, what it covers and how far
  %(del)s        how to run it, with every lesson summarised
  GCSE_Course_Big_Picture.pdf   all the units across the specification
  Lesson_Plans/  a plan for every lesson in the unit, one PDF each
  Teacher_Answers/  marking guidance, where verified answers exist

  %(lessons)d lesson plans. Built %(when)s.

WHAT IS NOT IN HERE
  The 360-degree experiences. They are not downloadable, and this is not an
  offline version of Revise 360. PowerPoints, worksheets and teacher guides are
  downloadable; the interactive 360-degree experiences are accessed on the
  Revise 360 website.

  The slides and worksheets are in the companion download, %(res)s.

A NOTE ON ANSWERS
  Model answers are not printed on the lesson plans. A plan is printed and left
  on a desk; an answer sheet is not.
%(answers)s
Revise 360 - a product of Revise 360 Ltd, created by Olly Pettitt.
An independent resource: not written, endorsed or approved by OCR or any exam
board. Classroom use and personal study only.
"""


def teacher_answers(uid, recs):
    """Verified teacher answers for this unit, if any exist in answers/.

    Only files that are really there. A pack never carries an empty placeholder
    to make a folder look complete: if there is nothing, the README says so.
    """
    out = []
    for r in recs:
        p = os.path.join(ROOT, "answers", "codebank", r["id"] + ".json")
        if os.path.exists(p):
            out.append((p, "Teacher_Answers/%s_model_solutions.json" % r["id"]))
    for name in ("Assessment_-_Answers.pdf", "Key_Terminology_-_Answers.pdf"):
        p = os.path.join(ROOT, "answers", name)
        if os.path.exists(p):
            out.append((p, "Teacher_Answers/" + name))
    return out


def build(uid, recs, no_pdf=False):
    slug = uid.replace(".", "_")
    title = recs[0]["unit_title"]
    when = None          # set once the sources are known
    res_name = "%s_Teaching_Resources.zip" % slug
    gui_name = "%s_Teacher_Guide.zip" % slug
    os.makedirs(OUT, exist_ok=True)

    # ---- A: the teaching resources
    items, notes = [], []
    for r in recs:
        folder = "Lesson_%02d_%s" % (r["lesson"] or 0, safe(r["title"]))
        for key in ("deck", "worksheet"):
            rel = (r["references"].get(key) or "").split("?")[0]
            if not rel:
                notes.append("%s has no %s" % (r["id"], key))
                continue
            src = os.path.join(ROOT, rel)
            if not os.path.exists(src):
                notes.append("%s: %s is missing from the site" % (r["id"], rel))
                continue
            items.append((src, "%s/%s" % (folder, os.path.basename(src))))
            if key == "worksheet" and not no_pdf:
                pdf = worksheet_pdf(src)
                if pdf:
                    items.append((pdf, "%s/%s" % (folder, os.path.basename(pdf))))
                else:
                    notes.append("%s: the worksheet would not convert to PDF" % r["id"])
    manifest = {
        "unit": uid, "title": title,
        "lessons": [{"id": r["id"], "lesson": r["lesson"], "title": r["title"],
                     "version": r["version"]} for r in recs],
        "contains": "lesson PowerPoints and student worksheets only",
        "excludes": "the 360-degree experiences, which are used on the website",
        "notes": notes,
    }
    items.sort(key=lambda x: x[1])
    at = stamp([src for src, _ in items])
    when = time.strftime("%d %B %Y", at)
    res_path = os.path.join(OUT, res_name)
    with zipfile.ZipFile(res_path, "w", zipfile.ZIP_DEFLATED) as z:
        for src, name in items:
            put(z, src, name, at)
        none_of = [r["id"] for r in recs
                   if not (r["references"].get("deck") or r["references"].get("worksheet"))]
        text(z, "README.txt", README_A % dict(
            unit=uid, title=title, when=when, lessons=len(recs), guide=gui_name,
            nothing=("\n  %s %s no folder here: %s a bonus challenge done on the\n"
                     "  website, with no slides or worksheet of its own. Its lesson plan is\n"
                     "  in the companion teacher guide.\n"
                     % (", ".join(none_of), "have" if len(none_of) > 1 else "has",
                        "they are" if len(none_of) > 1 else "it is")) if none_of else ""), at)


    # ---- B: the teacher guide
    gitems = []
    for kind in ("Unit_Pedagogy", "Unit_Big_Picture", "Unit_Delivery_Guide"):
        p = os.path.join(DOCS, "%s_%s.pdf" % (slug, kind))
        if os.path.exists(p):
            gitems.append((p, os.path.basename(p)))
        else:
            notes.append("%s is missing" % os.path.basename(p))
    course = os.path.join(DOCS, "GCSE_Course_Big_Picture.pdf")
    if os.path.exists(course):
        gitems.append((course, "GCSE_Course_Big_Picture.pdf"))
    for r in recs:
        p = os.path.join(ROOT, "lessonplans", P.plan_file(r["id"]) + ".pdf")
        if os.path.exists(p):
            gitems.append((p, "Lesson_Plans/" + os.path.basename(p)))
        else:
            notes.append("%s has no lesson plan" % r["id"])
    answers = teacher_answers(uid, recs)
    gitems += answers
    ans_note = ("  Verified answers for this unit are in Teacher_Answers/.\n"
                if answers else
                "  There are no verified teacher answers for this unit yet, so this\n"
                "  pack has no Teacher_Answers folder rather than an empty one.\n")
    gitems.sort(key=lambda x: x[1])
    gat = stamp([src for src, _ in gitems])
    gwhen = time.strftime("%d %B %Y", gat)
    gui_path = os.path.join(OUT, gui_name)
    with zipfile.ZipFile(gui_path, "w", zipfile.ZIP_DEFLATED) as z:
        for src, name in gitems:
            put(z, src, name, gat)
        text(z, "README.txt", README_B % dict(
            unit=uid, title=title, when=gwhen, lessons=len(recs), res=res_name,
            ped="%s_Unit_Pedagogy.pdf" % slug, big="%s_Unit_Big_Picture.pdf" % slug,
            **{"del": "%s_Unit_Delivery_Guide.pdf" % slug}, answers=ans_note), gat)

    # The manifests sit BESIDE the zips, not inside them: the teaching pack is
    # PowerPoints and worksheets and nothing else, and a build manifest in it is
    # metadata a teacher did not ask for.
    for path, extra in ((res_path, dict(contains="lesson PowerPoints and student "
                                                 "worksheets only")),
                        (gui_path, dict(contains="teacher guidance, lesson plans "
                                                 "and answers"))):
        side = path[:-4] + "_MANIFEST.json"
        with zipfile.ZipFile(path) as z:
            files = sorted(i.filename for i in z.infolist() if not i.filename.endswith("/"))
        json.dump(dict(manifest, notes=notes, files=files,
                       built=time.strftime("%Y-%m-%d", at if path is res_path else gat),
                       bytes=os.path.getsize(path), **extra),
                  open(side, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return res_path, gui_path, notes


def main(argv):
    no_pdf = "--no-pdf" in argv
    only = [a for a in argv if not a.startswith("--")]
    recs = [json.load(open(p, encoding="utf-8"))
            for p in sorted(glob.glob(os.path.join(RECS, "*.json")))]
    recs.sort(key=lambda r: (r["unit"], r["lesson"] or 0))
    units = {}
    for r in recs:
        units.setdefault(r["unit"], []).append(r)

    os.makedirs(SITE_PACKS, exist_ok=True)
    index, all_notes = {}, []
    for uid, rs in units.items():
        if only and uid not in only:
            continue
        a, b, notes = build(uid, rs, no_pdf)
        for f in (a, b):
            shutil.copy(f, os.path.join(SITE_PACKS, os.path.basename(f)))
            side = f[:-4] + "_MANIFEST.json"
            if os.path.exists(side):
                shutil.copy(side, os.path.join(SITE_PACKS, os.path.basename(side)))
        index[uid] = {
            "unit": uid, "title": rs[0]["unit_title"], "lessons": len(rs),
            "built": time.strftime("%Y-%m-%d",
                                   stamp([os.path.join(OUT, os.path.basename(a))])),
            "resources": {"file": "packs/" + os.path.basename(a),
                          "bytes": os.path.getsize(a),
                          "formats": ["pptx", "docx", "pdf"]},
            "guide": {"file": "packs/" + os.path.basename(b),
                      "bytes": os.path.getsize(b),
                      "formats": ["pdf"]},
            "notes": notes,
        }
        all_notes += [(uid, n) for n in notes]
        print("%-4s %-52s %6.1f MB + %5.1f MB"
              % (uid, rs[0]["unit_title"][:52],
                 os.path.getsize(a) / 1e6, os.path.getsize(b) / 1e6))

    idx_path = os.path.join(SITE_PACKS, "index.json")
    old = {}
    if os.path.exists(idx_path):
        try:
            old = json.load(open(idx_path, encoding="utf-8")).get("units", {})
        except Exception:
            old = {}
    old.update(index)
    json.dump({"note": "what each unit's two downloads contain, and how big they are",
               "says": "PowerPoints, worksheets and teacher guides are downloadable. "
                       "Interactive 360-degree experiences are accessed on the "
                       "Revise360 website.",
               "units": dict(sorted(old.items()))},
              open(idx_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    if all_notes:
        print()
        print("%d thing(s) a pack could not include:" % len(all_notes))
        for uid, n in all_notes[:20]:
            print("   %-4s %s" % (uid, n))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
