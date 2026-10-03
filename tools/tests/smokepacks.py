"""Does a unit download contain what it says, and nothing it must not?

The rule the packs exist under is that the 360-degree experiences are never
downloadable. A pack is a zip file built by a script, which is exactly the kind of
thing that quietly acquires an extra file, so every pack is re-opened here and
every entry in it is checked - by its name, by its extension and by its first
bytes, because a scene image renamed .docx is still a scene image.

It also checks the other half of the promise: that the teaching pack really holds
every lesson's slides and worksheet, that the guide pack really holds a plan for
every lesson, and that the manifest agrees with the course inventory.

    python3 tools/tests/smokepacks.py
"""
import os
import re
import sys
import json
import glob
import io
import hashlib
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from paths import SITE_S                                       # noqa: E402
import mkpacks as M                                            # noqa: E402
import mkplans as P                                            # noqa: E402

ROOT = SITE_S.rstrip("/")
PACKS = os.path.join(ROOT, "packs")

# The first bytes of the things that must never be in a pack. A pack holds Office
# documents and PDFs; an image, a video, a 3D model or a page is a mistake.
MAGIC = [
    (b"\xff\xd8\xff", "a JPEG"),
    (b"\x89PNG\r\n\x1a\n", "a PNG"),
    (b"RIFF", "a RIFF container (WebP or WAV)"),
    (b"glTF", "a glTF 3D model"),
    (b"\x00\x61\x73\x6d", "a WebAssembly module"),
    (b"<!doctype html", "an HTML page"),
    (b"<!DOCTYPE html", "an HTML page"),
    (b"<html", "an HTML page"),
]
OFFICE = (b"PK\x03\x04",)
PDF = (b"%PDF",)


def media_of(blob):
    """Every embedded image in an Office package, as (name, bytes).

    A .pptx and a .docx are both zip files with the pictures in them, so a scene
    panorama can travel inside a slide deck without ever appearing as a file in
    the pack. Checking the names in the outer zip would not see it.
    """
    out = []
    try:
        with zipfile.ZipFile(io.BytesIO(blob)) as z:
            for n in z.namelist():
                if "/media/" in n or "/embeddings/" in n:
                    out.append((n, z.read(n)))
    except Exception:
        pass
    return out


def size_of(blob):
    """An image's pixel size, from its header. No image library needed."""
    if blob[:8] == b"\x89PNG\r\n\x1a\n" and blob[12:16] == b"IHDR":
        return (int.from_bytes(blob[16:20], "big"), int.from_bytes(blob[20:24], "big"))
    if blob[:2] == b"\xff\xd8":
        i = 2
        while i < len(blob) - 9:
            if blob[i] != 0xFF:
                i += 1
                continue
            m = blob[i + 1]
            if m in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB):
                return (int.from_bytes(blob[i + 7:i + 9], "big"),
                        int.from_bytes(blob[i + 5:i + 7], "big"))
            if m in (0xD8, 0xD9) or 0xD0 <= m <= 0xD7:
                i += 2
                continue
            i += 2 + int.from_bytes(blob[i + 2:i + 4], "big")
    return None


def looks_like(blob):
    for sig, what in MAGIC:
        if blob[:len(sig)].lower() == sig.lower():
            return what
    return None


def main():
    bad = []

    def ok(cond, msg):
        print(("  ok  " if cond else " FAIL ") + msg)
        if not cond:
            bad.append(msg)

    idx_path = os.path.join(PACKS, "index.json")
    ok(os.path.exists(idx_path), "there is a pack index")
    if not os.path.exists(idx_path):
        return 1
    idx = json.load(open(idx_path, encoding="utf-8"))
    ok("Interactive 360-degree experiences are accessed on the Revise360 website"
       in idx.get("says", ""), "the index carries the plain message about what is "
                               "downloadable")
    units = idx["units"]

    inv = json.load(open(os.path.join(ROOT, "build", "inventory.json"), encoding="utf-8"))
    by_unit = {u["id"]: [l["id"] for l in u["lessons"]] for u in inv["units"]}
    ok(set(units) == set(by_unit), "every unit in the course has a pack (%s)"
       % (sorted(set(by_unit) - set(units))[:4] or "all %d" % len(by_unit)))

    zips = sorted(glob.glob(os.path.join(PACKS, "*.zip")))
    ok(len(zips) == 2 * len(units), "two packs per unit (%d zips, %d units)"
       % (len(zips), len(units)))

    strays, wrong_bytes, too_big = [], [], []
    for z in zips:
        name = os.path.basename(z)
        with zipfile.ZipFile(z) as zf:
            for info in zf.infolist():
                n = info.filename
                if n.endswith("/"):
                    continue
                if not any(r.match(n) for r in M.ALLOW):
                    strays.append((name, n))
                    continue
                blob = zf.read(n)[:16]
                what = looks_like(blob)
                if what and not n.endswith((".txt", ".json")):
                    wrong_bytes.append((name, n, what))
                if n.endswith((".pptx", ".docx")) and not blob.startswith(OFFICE):
                    wrong_bytes.append((name, n, "not an Office document"))
                if n.endswith(".pdf") and not blob.startswith(PDF):
                    wrong_bytes.append((name, n, "not a PDF"))
        if os.path.getsize(z) > 200e6:
            too_big.append(name)

    ok(not strays, "no pack holds a file outside the allowlist (%s)"
       % (strays[:3] or "none of the %d checked" % len(zips)))
    ok(not wrong_bytes, "nothing in a pack is pretending to be another kind of file (%s)"
       % (wrong_bytes[:2] or "none"))
    ok(not too_big, "no pack is unreasonably large (%s)" % (too_big or "none"))

    # Inside the Office documents. A deck may carry a flattened, limited
    # field-of-view preview of a room, which is allowed and useful. What is not
    # allowed is the panorama itself - a 2:1 equirectangular image - or any file
    # that is byte-for-byte one of the site's scene images, however it is named.
    scene = {}
    for p in glob.glob(os.path.join(ROOT, "experiences", "img", "*")):
        if os.path.isfile(p):
            scene[hashlib.sha256(open(p, "rb").read()).hexdigest()] = os.path.basename(p)
    panoramas, copies, previews = [], [], 0
    for z in zips:
        with zipfile.ZipFile(z) as zf:
            for n in zf.namelist():
                if not n.endswith((".pptx", ".docx")):
                    continue
                for inner, blob in media_of(zf.read(n)):
                    h = hashlib.sha256(blob).hexdigest()
                    if h in scene:
                        copies.append((os.path.basename(z), n, inner, scene[h]))
                    wh = size_of(blob)
                    if wh and wh[0] >= 1024 and 1.9 <= wh[0] / max(wh[1], 1) <= 2.1:
                        panoramas.append((os.path.basename(z), n, inner, wh))
                    if wh and wh[0] * wh[1] > 700000:
                        previews += 1
    ok(not copies, "no slide or worksheet embeds a file from the site's scene images "
       "(%s)" % (copies[:2] or "none of %d checked" % len(scene)))
    ok(not panoramas, "no slide or worksheet embeds a 2:1 panorama (%s)"
       % (panoramas[:2] or "none"))
    print("  --  %d large embedded preview image(s) across the packs; a flattened, "
          "limited view of a room is allowed" % previews)

    # Path escapes and symlinks: a zip entry may name its way out of the folder it
    # is extracted into, or be a link to somewhere else entirely.
    escapes = []
    for z in zips:
        with zipfile.ZipFile(z) as zf:
            for info in zf.infolist():
                n = info.filename
                if n.startswith("/") or ".." in n.split("/") or "\\" in n:
                    escapes.append((os.path.basename(z), n))
                if (info.external_attr >> 16) & 0o170000 == 0o120000:
                    escapes.append((os.path.basename(z), n + " (a symlink)"))
    ok(not escapes, "no pack entry escapes its folder or is a symlink (%s)"
       % (escapes[:3] or "none"))

    # Nothing in a pack may carry a credential or a raw storage link.
    secrets = []
    for z in zips:
        with zipfile.ZipFile(z) as zf:
            for n in zf.namelist():
                if n.endswith((".txt", ".json")):
                    t = zf.read(n).decode("utf-8", "replace")
                    for probe in ("teacherKey", "nvr-tk", "Authorization",
                                  "s3.amazonaws", "blob.core.windows", "?token=",
                                  "AKIA", "Bearer "):
                        if probe in t:
                            secrets.append((os.path.basename(z), n, probe))
    ok(not secrets, "no pack carries a credential or a raw storage link (%s)"
       % (secrets[:2] or "none"))

    # the experiences, by every name they go under
    leaked = []
    for z in zips:
        with zipfile.ZipFile(z) as zf:
            for n in zf.namelist():
                low = n.lower()
                if ("experiences/" in low or low.endswith("_360.jpg")
                        or low.endswith("_hi.jpg") or "/img/" in low
                        or low.endswith((".js", ".html", ".wasm", ".glb"))):
                    leaked.append((os.path.basename(z), n))
    ok(not leaked, "no pack carries any part of a 360 experience (%s)"
       % (leaked[:3] or "none"))

    # what each pack must hold
    for uid, meta in sorted(units.items()):
        lessons = by_unit.get(uid, [])
        res = os.path.join(ROOT, meta["resources"]["file"])
        gui = os.path.join(ROOT, meta["guide"]["file"])
        if not (os.path.exists(res) and os.path.exists(gui)):
            ok(False, "%s: a pack the index names is missing" % uid)
            continue
        with zipfile.ZipFile(res) as zf:
            names = zf.namelist()
            folders = {n.split("/")[0] for n in names if "/" in n}
            kinds = {os.path.splitext(n)[1] for n in names if "/" in n}
            readme = " ".join(zf.read("README.txt").decode("utf-8").split())
        # The build manifest sits beside the zip, not in it.
        man_path = res[:-4] + "_MANIFEST.json"
        ok(os.path.exists(man_path), "%s has a manifest beside it" % uid)
        ok("MANIFEST.json" not in names,
           "%s teaching pack keeps the build manifest out of the zip" % uid)
        manifest = json.load(open(man_path, encoding="utf-8")) if os.path.exists(man_path) else {}
        ok(kinds <= {".pptx", ".docx", ".pdf"},
           "%s teaching pack holds only slides and worksheets (%s)" % (uid, sorted(kinds)))
        # Every worksheet must be there twice: a .docx to edit and a .pdf to print.
        # A --no-pdf build satisfies "only these kinds" while shipping no printable
        # worksheet at all, which is the failure this catches.
        docx = {n[:-5] for n in names if n.endswith(".docx")}
        pdfs = {n[:-4] for n in names if n.endswith(".pdf")}
        ok(docx <= pdfs, "%s teaching pack has a print-ready PDF beside every "
           "worksheet (%s)" % (uid, sorted(docx - pdfs)[:2] or "all %d" % len(docx)))
        # A lesson with neither a deck nor a worksheet has nothing to download:
        # the bonus challenges are website-only. The manifest records which, and
        # that is what this checks against, not a bare count.
        nothing = {n.split()[0] for n in manifest.get("notes", [])
                   if "has no worksheet" in n}
        want = [l for l in lessons if l not in nothing]
        ok(len(folders) == len(want),
           "%s teaching pack has a folder for every lesson that has a resource "
           "(%d of %d, %d website-only)" % (uid, len(folders), len(want), len(nothing)))
        ok("interactive 360-degree experiences are accessed on the Revise 360 "
           "website" in readme,
           "%s teaching pack says where the experiences are used" % uid)
        ok("this is not an offline version of Revise 360" in readme,
           "%s teaching pack does not call itself an offline version" % uid)

        with zipfile.ZipFile(gui) as zf:
            names = zf.namelist()
            plans = {n for n in names if n.startswith("Lesson_Plans/")}
        want = {"Lesson_Plans/%s.pdf" % P.plan_file(l) for l in lessons}
        ok(plans == want, "%s guide pack has a plan for every lesson (%d of %d)"
           % (uid, len(plans), len(lessons)))
        for doc in ("Unit_Pedagogy", "Unit_Big_Picture", "Unit_Delivery_Guide"):
            f = "%s_%s.pdf" % (uid.replace(".", "_"), doc)
            ok(f in names, "%s guide pack holds %s" % (uid, f))
        ok("GCSE_Course_Big_Picture.pdf" in names,
           "%s guide pack holds the course big picture" % uid)

    # A pack built twice from the same files must be the same file. Without that,
    # every rebuild writes another 57 MB of identical content into the repository's
    # history, and a teacher cannot tell a changed pack from a rebuilt one.
    import subprocess as _sp
    import tempfile
    import hashlib as _h
    sample = sorted(units)[0]
    before = {os.path.basename(z): _h.sha256(open(z, "rb").read()).hexdigest()
              for z in zips if os.path.basename(z).startswith(sample.replace(".", "_"))}
    r = _sp.run([sys.executable, os.path.join(os.path.dirname(HERE), "mkpacks.py"), sample],
                capture_output=True, text=True)
    after = {n: _h.sha256(open(os.path.join(PACKS, n), "rb").read()).hexdigest()
             for n in before}
    ok(r.returncode == 0 and before == after,
       "a pack rebuilt from the same files is the same file (%s)"
       % (sample if before == after else "rebuilding %s changed it" % sample))

    print()
    print("every pack holds what it says and nothing else" if not bad
          else "%d problem(s)" % len(bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
