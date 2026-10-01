import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
import json, base64, re
SITE = SITE_S
def b64(path, mime): return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()
def build(eid, out, wsname):
    exp = json.load(open(SITE + f"experiences/{eid}.json"))
    reg = json.load(open(SITE + "experiences/registry.json"))
    entry = dict(next(e for e in reg["experiences"] if e["id"] == eid)); entry.pop("topic", None)
    for sc in exp["scenes"]:
        sc["img"] = b64(SITE + "experiences/" + sc["img"], "image/jpeg")
        if sc.get("imgHi"): sc["imgHi"] = b64(SITE + "experiences/" + sc["imgHi"], "image/jpeg")
        for st in sc["stations"]:
            for t in st["tasks"]:
                if t.get("img"): t["img"] = b64(SITE + "experiences/" + t["img"], "image/png")
    if entry.get("worksheet"):
        entry["worksheet"] = b64(SITE + entry["worksheet"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    css = open(SITE + "css/style.css").read()
    js = {n: open(SITE + f"js/{n}.js").read() for n in ("config", "store", "player", "vr")}
    data = {"exp": exp, "registry": {"experiences": [dict(entry, id=eid)]}, "topics": {"siteTitle": "Revise 360", "groups": []}}
    shim = """
// Standalone version: serve the lesson data from inside this file instead of the website
window.__R360 = %s;
(function(){
  if (!new URLSearchParams(location.search).get("id")) { try { history.replaceState(null, "", location.pathname + "?id=%s" + location.hash); } catch (e) {} }
  const D = window.__R360, real = window.fetch.bind(window);
  const reply = o => Promise.resolve(new Response(JSON.stringify(o), { headers: { "Content-Type": "application/json" } }));
  window.fetch = (url, opts) => {
    const u = String(url);
    if (u.includes("experiences/registry.json")) return reply(D.registry);
    if (u.includes("experiences/topics.json")) return reply(D.topics);
    if (/experiences\\/[^/]+\\.json/.test(u)) return reply(D.exp);
    return real(url, opts);
  };
  // Links back to the website's home page just close the panel here
  document.addEventListener("click", e => { const a = e.target.closest("a"); if (a && /^index\\.html/.test(a.getAttribute("href") || "")) { e.preventDefault(); window.NVRCore && NVRCore.closeUI(); } }, true);
  document.addEventListener("nvr-ready", () => { const w = document.getElementById("wsBtn"); if (w) w.setAttribute("download", "%s"); });
})();
""" % (json.dumps(data), eid, wsname)
    signin = """
(function(){
  // No sign-in in the standalone file: progress is simply kept in this browser
  if (!Store.student()) { try { localStorage.setItem("nvr:v1:student", JSON.stringify({ key: "standalone", name: "Your progress", cls: "saved on this device" })); } catch (e) {} }
  const run = id => { const s = document.createElement("script"); s.textContent = document.getElementById(id).textContent; document.body.appendChild(s); };
  run("playerSrc"); run("vrSrc");
})();
"""
    html = open(SITE + "experience.html").read()
    html = html.replace('<link rel="stylesheet" href="css/style.css">', "<style>\n" + css + "\n#homeBtn{display:none}\n</style>")
    html = html.replace("<title>Experience</title>", f"<title>{exp['title']} | Revise 360</title>")
    scripts = ('<script src="js/config.js"></script>\n<script src="js/store.js"></script>\n<script src="js/player.js"></script>\n<script src="js/vr.js"></script>')
    assert scripts in html
    new = ("<script>\n" + js["config"] + "\n</script>\n<script>\n" + js["store"] + "\n</script>\n<script>\n" + shim + "\n</script>\n"
           + '<script type="text/plain" id="playerSrc">\n' + js["player"].replace("</script", "<\\/script") + "\n</script>\n"
           + '<script type="text/plain" id="vrSrc">\n' + js["vr"].replace("</script", "<\\/script") + "\n</script>\n"
           + "<script>\n" + signin + "\n</script>")
    html = html.replace(scripts, new)
    open(out, "w").write(html)
    print(out, round(len(html) / 1e6, 1), "MB")
build("rp-lesson3", OUT_S + "Revise360_2.3_Lesson3_CodeClinic.html", "RP_Lesson3_Maintainability_Worksheet.docx")
build("rp-lesson4", OUT_S + "Revise360_2.3_Lesson4_BugHuntLab.html", "RP_Lesson4_Testing_Worksheet.docx")
