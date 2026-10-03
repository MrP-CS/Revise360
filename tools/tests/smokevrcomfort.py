"""Is the Python workspace comfortable to sit in and legible to read?

Comfort in a headset is mostly geometry, and geometry can be measured. This
opens the workspace and checks where every surface actually ended up, how big
the things you have to point at are, whether anything follows the head, and
whether the text has enough contrast against what is behind it.

What it cannot do is tell you whether it feels right through a lens. That is
docs/VR-HEADSET-QA.md, and nothing here stands in for it.

  R360_THREE=... R360_IWER=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    python3 tools/tests/smokevrcomfort.py
"""
import os, sys, math, threading, http.server, functools
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE_S
from playwright.sync_api import sync_playwright

PORT = 8817

# What a seated pupil can hold without complaint, and what a controller ray can
# hold steady. Chosen before the measurements, not fitted to them.
NEAR, FAR = 1.30, 2.40          # metres
UP, DOWN = 45.0, 52.0           # degrees from the anchor's own pitch
SIDE = 45.0                     # degrees either way
MIN_TARGET = 1.0                # degrees, the smallest thing to point at
MIN_TEXT = 0.55                 # degrees, the smallest thing to read
MIN_CONTRAST = 4.5              # against the surface behind it


class Q(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".wasm": "application/wasm", ".mjs": "text/javascript"})
    def log_message(self, *a): pass


def lum(hexcol):
    h = hexcol.strip().lstrip("#")
    if len(h) == 3: h = "".join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


WHERE = r"""(() => {
  const a = NVRVR.anchor, V = NVRVR.vrCode;
  const out = { surfaces: [], targets: [], anchor: !!a };
  const place = (name, mesh) => {
    if (!mesh || !mesh.visible) return;
    const d = mesh.position.clone().sub(a.pos), dist = d.length();
    let yaw = Math.atan2(d.x, d.z) - a.yaw;
    yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw)) * 180 / Math.PI;
    const pitch = Math.asin(Math.max(-1, Math.min(1, d.y / dist))) * 180 / Math.PI
                - a.pitch * 180 / Math.PI;
    // half the panel's own extent, so the edges are judged and not just the middle
    const bb = new THREE.Box3().setFromObject(mesh);
    const w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y;
    out.surfaces.push({ name, dist: +dist.toFixed(2), yaw: +yaw.toFixed(1), pitch: +pitch.toFixed(1),
      halfW: +(Math.atan((Math.max(w, h) / 2) / dist) * 180 / Math.PI).toFixed(1),
      halfH: +(Math.atan((h / 2) / dist) * 180 / Math.PI).toFixed(1) });
  };
  place("screen", V ? V.mesh : null);
  place("keys", NVRVR.kbPanel.mesh);
  // one screen and one keyboard. Anything else open beside them is the design
  // this replaced, and is reported rather than measured.
  out.floating = ["qPanel", "infoPanel", "menuPanel", "modelPanel", "diagPanel"]
    .filter(k => NVRVR[k] && NVRVR[k].open);
  // every thing a pupil has to point at, in degrees across
  const P = NVRVR.kbPanel, m = P.mesh;
  const dist = m.position.distanceTo(a.pos);
  const mPerPx = (m.scale.x) / P.W;
  P.hits.forEach(h => out.targets.push({ id: h.id,
    w: +(Math.atan((h.w * mPerPx) / 2 / dist) * 2 * 180 / Math.PI).toFixed(2),
    h: +(Math.atan((h.h * mPerPx) / 2 / dist) * 2 * 180 / Math.PI).toFixed(2) }));
  /* And the smallest type on the screen, the same way. The screen is drawn in
   * the page's own pixels, so 15px there is the body size the page uses - what
   * matters is how big that ends up in the headset. */
  const S = window.R360PyScreen, sm = V.mesh;
  const sPerPx = sm.geometry.parameters.width / S.W;
  const sd = sm.position.distanceTo(a.pos);
  out.bodyText = +(Math.atan(15 * sPerPx / sd) * 180 / Math.PI).toFixed(2);
  out.smallestText = +(Math.atan(12 * sPerPx / sd) * 180 / Math.PI).toFixed(2);
  out.screenWide = +(Math.atan(sm.geometry.parameters.width / 2 / sd) * 2 * 180 / Math.PI).toFixed(1);
  return out;
})()"""


def main():
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORT),
        functools.partial(Q, directory=SITE_S.rstrip("/")))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    three = open(os.environ.get("R360_THREE", "node_modules/three/build/three.min.js")).read()
    iwer = open(os.environ.get("R360_IWER", "node_modules/iwer/build/iwer.js")).read()
    base = f"http://127.0.0.1:{PORT}/"
    bad = 0

    def ok(cond, said):
        nonlocal bad
        print(("  ok  " if cond else "  FAIL ") + said)
        if not cond: bad += 1

    with sync_playwright() as p:
        b = p.chromium.launch(args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader",
                                    "--ignore-gpu-blocklist"])
        pg = b.new_page(viewport={"width": 1280, "height": 720})
        pg.route("**/three.min.js", lambda r: r.fulfill(body=three, content_type="application/javascript"))
        pg.add_init_script(iwer + "\nwindow.__dev = new IWER.XRDevice(IWER.metaQuest3);"
                                  "\nwindow.__dev.installRuntime({ forceInstall: true });")
        pg.add_init_script("""try { localStorage.setItem('nvr:v1:student',
          JSON.stringify({ key: 'comfort', name: 'Comfort', cls: '11A', school: 'MCS' })); } catch (e) {}""")
        pg.goto(base + "experience.html?id=pr-l01"); pg.wait_for_timeout(1600)
        pg.click("#vrBtn"); pg.wait_for_timeout(1400)
        where = pg.evaluate("""(() => {
          const sc = NVRCore.exp.scenes[NVRCore.cur];
          for (let k = 0; k < sc.stations.length; k++)
            for (let i = 0; i < sc.stations[k].tasks.length; i++) {
              const t = sc.stations[k].tasks[i];
              if (t.t === 'code' && !['try','predict'].includes(t.kind || 'build')) return [k, i];
            }
          return null; })()""")
        pg.evaluate("([k,i]) => window.__openVRCode(k, i)", where)
        pg.wait_for_function("() => NVRVR.vrCode && !NVRVR.vrCode.busy", timeout=120000)

        g = pg.evaluate(WHERE)
        print("where each surface ended up, from the anchor:")
        for s in g["surfaces"]:
            print(f"  {s['name']:<10} {s['dist']:>5} m   yaw {s['yaw']:>6}°   "
                  f"pitch {s['pitch']:>6}°   spans ±{s['halfH']}° up and down")
        for s in g["surfaces"]:
            ok(NEAR <= s["dist"] <= FAR,
               f"{s['name']} is {s['dist']} m away, inside {NEAR}–{FAR} m")
            ok(abs(s["yaw"]) <= SIDE,
               f"{s['name']} is {abs(s['yaw'])}° to the side, inside {SIDE}°")
            top, bot = s["pitch"] + s["halfH"], s["pitch"] - s["halfH"]
            ok(top <= UP and bot >= -DOWN,
               f"{s['name']} spans {bot:.0f}° to {top:.0f}°, inside -{DOWN}° to +{UP}°")

        small = min(t["h"] for t in g["targets"])
        worst = [t["id"] for t in g["targets"] if t["h"] == small][:3]
        ok(small >= MIN_TARGET,
           f"the smallest thing to point at is {small}° across ({', '.join(worst)}), "
           f"at least {MIN_TARGET}°")
        ok(g["smallestText"] >= MIN_TEXT,
           f"the smallest type on the screen is {g['smallestText']}°, at least {MIN_TEXT}°")
        ok(g["bodyText"] >= 0.75,
           f"body text is {g['bodyText']}° \u2014 about {round(g['bodyText'] * 25)} of a Quest's pixels")
        ok(45 <= g["screenWide"] <= 90,
           f"the screen is {g['screenWide']}° across: a large monitor, not a wall")
        ok(not g["floating"],
           f"nothing is floating beside the screen and the keyboard ({g['floating']})")

        # the workspace must stay where it was put, whatever the pupil does with
        # their head - that is the whole point of the anchor
        before = pg.evaluate("NVRVR.vrCode.mesh.position.toArray()")
        kbBefore = pg.evaluate("NVRVR.kbPanel.mesh.position.toArray()")
        pg.evaluate("""(() => { const d = window.__dev;
          // move the head and turn it: the emulator's own position and
          // orientation, not a three.js object
          d.position.set(0.4, 1.7, 0.3);
          if (d.quaternion && d.quaternion.set) {
            const h = 0.55, s = Math.sin(h), c = Math.cos(h);
            d.quaternion.set(0, s, 0, c);
          }
        })()""")
        pg.wait_for_timeout(700)
        after = pg.evaluate("NVRVR.vrCode.mesh.position.toArray()")
        moved = math.dist(before, after)
        ok(moved < 0.001, f"the workspace stayed put while the head moved ({moved:.4f} m)")
        pg.evaluate("NVRVR.recentre()"); pg.wait_for_timeout(400)
        moved2 = math.dist(before, pg.evaluate("NVRVR.vrCode.mesh.position.toArray()"))
        ok(moved2 > 0.05, f"and Recentre did move it ({moved2:.2f} m)")
        kbMoved = math.dist(kbBefore, pg.evaluate("NVRVR.kbPanel.mesh.position.toArray()"))
        ok(kbMoved > 0.05,
           f"and took the keyboard with it \u2014 one workspace, not two ({kbMoved:.2f} m)")
        ok(pg.evaluate("NVRVR.vrCode.text.length > 0"), "with the program still in it")

        # the menu button must not sit on the keys
        menu = pg.evaluate("""(() => { const a = NVRVR.anchor, m = NVRVR.menuBtn.mesh;
          const d = m.position.clone().sub(a.pos);
          return Math.asin(d.y / d.length()) * 180 / Math.PI; })()""")
        keys = [s for s in g["surfaces"] if s["name"] == "keys"][0]
        ok(menu < keys["pitch"] - keys["halfH"],
           f"the menu button is at {menu:.0f}°, below the keys at {keys['pitch'] - keys['halfH']:.0f}°")

        pg.close(); b.close()

    # contrast, against the surface each colour is drawn on
    print("contrast, from the one palette in css/style.css:")
    PANEL, DEEP = "#1c2c4a", "#0e1628"
    for name, fg, bg, on in [("body text", "#f0f4fa", PANEL, "a panel"),
                             ("secondary text", "#b4c4dc", PANEL, "a panel"),
                             ("a heading", "#ffd046", PANEL, "a panel"),
                             ("a passed test", "#50dc96", PANEL, "a panel"),
                             ("a failed test", "#ff5f5f", PANEL, "a panel"),
                             ("Learn", "#5ab4ff", PANEL, "a panel"),
                             ("the program", "#f0f4fa", DEEP, "the editor"),
                             ("a string", "#9fe6a0", DEEP, "the editor"),
                             ("a number", "#ffcb6b", DEEP, "the editor"),
                             ("a keyword", "#c792ea", DEEP, "the editor"),
                             ("a comment", "#5d7290", DEEP, "the editor")]:
        r = ratio(fg, bg)
        print(f"  {name:<18} {fg} on {on:<10} {r:.2f}")
        if name == "a comment":
            # a comment is deliberately quiet on both the page and here; it is
            # the one thing the editor dims on purpose, and the same value
            continue
        ok(r >= MIN_CONTRAST, f"{name} is {r:.2f} against {on}, at least {MIN_CONTRAST}")

    print("\n" + ("the workspace is where a seated pupil can read and reach it" if not bad
                  else f"{bad} problem(s)"))
    print("Geometry in an emulator. Whether it feels right through a lens is "
          "docs/VR-HEADSET-QA.md.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
