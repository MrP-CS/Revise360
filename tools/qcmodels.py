"""Check every 3D model for parts a pupil can click but cannot see.

Each model part is labelled and selectable, so if it is buried inside an opaque
case, hidden behind another part, or has no size, the pupil clicks a button and
nothing happens. That is invisible to code review and easy to miss by eye: the
RAM module shipped with its chips mounted as though the board were lying flat,
and the switch had a "Switching chip" part sealed inside an opaque case.

This renders each model from five angles, hides one part at a time and diffs
against the baseline. A part that changes no pixels from any angle is a part
nobody can see.

  python3 qcmodels.py
"""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE, TOOLS
import threading, http.server, functools, time, pathlib, shutil, subprocess

INVISIBLE, FAINT = 60, 350

def three_js():
    """The page asks the CDN for Three.js; serve the local copy instead, so this
    runs offline and tests exactly the version the site pins."""
    for p in ("node_modules/three/build/three.min.js",
              os.path.expanduser("~/node_modules/three/build/three.min.js"),
              os.environ.get("R360_THREE", "")):
        if p and os.path.exists(p):
            return pathlib.Path(p).read_bytes()
    raise SystemExit("three.min.js not found; set R360_THREE or npm install three")

def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise SystemExit("playwright is needed for this check: pip install playwright")
    body = three_js()

    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(
        ("127.0.0.1", 8781), functools.partial(Q, directory=str(SITE)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()

    exe = "/opt/pw-browsers/chromium"
    with sync_playwright() as pw:
        b = pw.chromium.launch(**({"executable_path": exe} if os.path.exists(exe) else {}),
                               args=["--no-proxy-server", "--use-gl=swiftshader"])
        pg = b.new_page(viewport={"width": 520, "height": 440})
        pg.route("**cdnjs**", lambda r: r.fulfill(
            status=200, content_type="application/javascript", body=body))
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto("http://127.0.0.1:8781/tools/qcmodels.html", wait_until="load", timeout=90000)
        time.sleep(1.5)
        res = pg.evaluate("window.QC()")
        b.close()
    srv.shutdown()

    mis = []
    for kind, v in res.items():
        seen = set()
        for m in v.get("misoriented", []):
            key = (kind, m["name"], tuple(m["size"]))
            if key in seen: continue
            seen.add(key)
            mis.append((kind, m["name"], m["thin"], m["boardThin"], m["buried"], m["size"]))
    mis.sort(key=lambda r: -r[4])
    if mis:
        print("components buried in the board they sit on (thin axis disagrees):")
        for kind, name, thin, bt, bur, size in mis:
            print(f"  {kind:14} {name[:32]:34} {bur:>3}% buried   thin {thin}, board thin {bt}   {size}")
        print()

    cols = []
    for kind, v in res.items():
        for c in v.get("collisions", []):
            cols.append((kind, c["a"], c["b"], c["overlap"]))
    cols.sort(key=lambda r: -r[3])
    if cols:
        print("parts passing through each other:")
        for kind, a, bb, ov in cols:
            print(f"  {kind:14} {a[:26]:28} through {bb[:26]:28} {ov:>3}%")
        print()

    stretched = []
    for kind, v in res.items():
        seen2 = set()
        for l in v.get("stretched", []):
            key = (kind, l["name"], l["face"], l.get("why"))
            if key in seen2: continue
            seen2.add(key)
            stretched.append((kind, l["name"], l["face"], l["stretch"], l.get("why", "stretched")))
    stretched.sort(key=lambda r: -abs(r[3] - 1))
    if stretched:
        print("label problems:")
        for kind, name, face, st, why in stretched:
            detail = f"stretched x{st}" if why == "stretched" else f"{why} ({int(st*100)}% of the broad face)"
            print(f"  {kind:14} {name[:30]:32} face {face}  {detail}")
        print()

    flagged = []
    for kind, v in res.items():
        if v["coverage"] < 2000:
            flagged.append((kind, "(whole model)", v["coverage"], "RENDERS NOTHING"))
        for p in v["parts"]:
            if p["pixels"] < INVISIBLE:
                flagged.append((kind, p["name"], p["pixels"], "INVISIBLE"))
            elif p["pixels"] < FAINT:
                flagged.append((kind, p["name"], p["pixels"], "barely visible"))
    for kind, name, px, why in flagged:
        print(f"  {kind:14} {name[:36]:38} {px:>7}px  {why}")
    parts = sum(len(v["parts"]) for v in res.values())
    print(f"\n{len(res)} models, {parts} parts checked; {len(flagged)} flagged")
    if errs:
        print("page errors:", errs)
    print(f"{len(mis)} misoriented, {len(stretched)} label problem(s), {len(cols)} collision(s)")
    return 1 if mis or stretched or cols or [f for f in flagged if f[3] != "barely visible"] or errs else 0

if __name__ == "__main__":
    sys.exit(main())
