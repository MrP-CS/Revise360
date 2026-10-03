"""The A4 page every Revise 360 PDF is built on: fonts, stylesheet, renderer.

tools/mkguides.py had all of this inside it. Then the lesson plans needed the same
page, and the unit guides after that, and a copy each would have given three
documents that drift apart in type size, colour and margin until they stop looking
like one set of resources. So it lives here and they import it.

  face / FONTS   the IBM Plex faces, embedded when R360_PLEX points at them
  css(cols)      the stylesheet: A4, print colours, the house type scale
  page(...)      a whole HTML document
  cover(...)     the masthead block
  FOOT           the legal line that goes at the foot of every document
  render(...)    one HTML document to one PDF, through the same browser that
                 renders the site, with a page number in the footer

Set R360_PLEX to a folder holding the five .woff2 files named in FONTS. Without it
the documents still build, in the system sans, and render() says so.
"""
import os
import html
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PLEX = os.environ.get("R360_PLEX", "")

INK, CANVAS, COBALT, TEAL, AMBER, SLATE, BORDER = (
    "#101828", "#ffffff", "#2D63FF", "#08A6A6", "#F4B942", "#667085", "#D9DEE7")

E = lambda s: html.escape(str(s))


def token_css():
    """The Python token colours, from css/pytok.css, for a printed page.

    The file carries a screen set on :root and a paper set inside @media print.
    A PDF is paper, so the paper set is lifted onto :root here - the same seven
    colours the editor and the worksheets use, and no second table anywhere.
    """
    css = open(os.path.join(ROOT, "css", "pytok.css"), encoding="utf-8").read()
    body = css.split("@media print", 1)[1] if "@media print" in css else ""
    import re as _re
    vals = dict(_re.findall(r"--tok-(\w+)\s*:\s*([^;]+);", body))
    rules = "".join("code.pytok .%s{color:%s}" % (k, v.strip()) for k, v in vals.items())
    return (":root{%s}" % "".join("--tok-%s:%s;" % (k, v.strip()) for k, v in vals.items())
            + "code.pytok{font-family:'Plex Mono',\"DejaVu Sans Mono\",monospace;"
              "font-size:.94em;padding:0 2.5pt;border:.6pt solid #A1A1AA;border-radius:2pt;"
              "background:#F4F4F5;white-space:pre-wrap}" + rules)


def rich_many(texts):
    """Marked-up sentences to HTML, through js/pytok.js - the one lexer.

    One node process for the whole document set. Anything with no marked data
    comes back escaped and unchanged, so every call site can use it.
    """
    import json
    import subprocess
    texts = [("" if t is None else str(t)) for t in texts]
    if not texts:
        return []
    r = subprocess.run(["node", os.path.join(ROOT, "js", "pytok.js"), "--rich"],
                       input=json.dumps(texts), capture_output=True, text=True)
    if r.returncode != 0 or not r.stdout.strip():
        raise RuntimeError("js/pytok.js --rich failed: " + (r.stderr or "")[-400:])
    return json.loads(r.stdout)

FONTS = [("Plex Sans", "IBMPlexSans-Regular.woff2", 400),
         ("Plex Sans", "IBMPlexSans-SemiBold.woff2", 600),
         ("Plex Sans", "IBMPlexSans-Bold.woff2", 700),
         ("Plex Mono", "IBMPlexMono-Regular.woff2", 400),
         ("Plex Mono", "IBMPlexMono-SemiBold.woff2", 600)]


def face(name, file, weight):
    path = os.path.join(PLEX, file)
    if not PLEX or not os.path.isfile(path):
        return ""
    return ("@font-face{font-family:'%s';font-style:normal;font-weight:%d;"
            "src:url('fonts/%s') format('woff2')}" % (name, weight, file))


def css(cols=1, extra=""):
    return """
%(faces)s
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:'Plex Sans',"Carlito","DejaVu Sans",system-ui,sans-serif;
  font-size:9.6pt;line-height:1.45;color:%(ink)s;background:%(canvas)s}
code,pre,.mono{font-family:'Plex Mono',"DejaVu Sans Mono",monospace}
h1,h2,h3,h4{margin:0;font-weight:700;line-height:1.2}
h1{font-size:25pt;letter-spacing:-.01em}
h2{font-size:13pt;margin:0 0 6pt;padding-bottom:3pt;border-bottom:1.6pt solid %(cobalt)s}
h3{font-size:10.4pt;margin:9pt 0 3pt}
h4{font-size:9.4pt;margin:6pt 0 2pt;color:%(slate)s}
p{margin:0 0 5pt}
ul,ol{margin:0 0 6pt;padding-left:14pt}
li{margin:0 0 2.5pt}
a{color:%(cobalt)s}
.eyebrow{font-family:'Plex Mono',monospace;font-size:7.2pt;letter-spacing:.14em;
  text-transform:uppercase;color:%(cobalt)s;margin:0 0 4pt}
.lede{font-size:11pt;color:%(slate)s;line-height:1.4}
.cover{border-bottom:2.4pt solid %(ink)s;padding-bottom:9pt;margin-bottom:11pt;
  display:flex;justify-content:space-between;align-items:flex-end;gap:16pt}
.cover .who{font-size:8pt;color:%(slate)s;text-align:right;white-space:nowrap}
.wordmark{font-weight:700;font-size:12pt;letter-spacing:-.01em}
.wordmark span{color:%(cobalt)s}
section{break-inside:avoid}
.band{background:#F4F6FB;border-left:2.4pt solid %(cobalt)s;padding:7pt 9pt;margin:0 0 8pt}
.band.amber{border-left-color:%(amber)s;background:#FEF8EC}
.band.teal{border-left-color:%(teal)s;background:#EEF8F8}
.band.grey{border-left-color:%(border)s;background:#F7F8FA}
.band p:last-child{margin-bottom:0}
table{width:100%%;border-collapse:collapse;margin:0 0 8pt;font-size:8.8pt}
th{text-align:left;font-size:7.4pt;letter-spacing:.09em;text-transform:uppercase;
  color:%(slate)s;border-bottom:1.2pt solid %(ink)s;padding:0 6pt 3pt 0;font-weight:600}
td{border-bottom:.6pt solid %(border)s;padding:4pt 6pt 4pt 0;vertical-align:top}
tr{break-inside:avoid}
.flow{break-inside:auto}
.tag{display:inline-block;font-family:'Plex Mono',monospace;font-size:7.6pt;font-weight:600;
  border:1pt solid %(cobalt)s;color:%(cobalt)s;border-radius:9pt;padding:.5pt 5pt;white-space:nowrap}
.tag.grey{border-color:%(border)s;color:%(slate)s}
.tag.amber{border-color:%(amber)s;color:#8a6200}
.num{font-family:'Plex Mono',monospace;color:%(cobalt)s;font-weight:600}
pre.code{background:#F4F6FB;border:.6pt solid %(border)s;border-radius:3pt;
  padding:5pt 7pt;margin:3pt 0;font-size:8.4pt;line-height:1.4;white-space:pre-wrap}
.shows{font-size:8pt;color:%(slate)s;margin:0}
.shows b{font-family:'Plex Mono',monospace;color:%(ink)s;font-weight:600}
.cols{column-count:%(cols)d;column-gap:14pt}
.foot{margin-top:10pt;padding-top:5pt;border-top:.6pt solid %(border)s;
  font-size:7.4pt;color:%(slate)s}
@page{size:A4;margin:14mm 13mm 13mm}
.pagebreak{break-before:page}
%(extra)s
""" % dict(faces="".join(face(*f) for f in FONTS), ink=INK, canvas=CANVAS, cobalt=COBALT,
           teal=TEAL, amber=AMBER, slate=SLATE, border=BORDER, cols=cols, extra=extra)


def page(title, body, cols=1, extra=""):
    return ("<!doctype html><html lang=\"en-GB\"><head><meta charset=\"utf-8\">"
            "<title>%s</title><style>%s</style></head><body>%s</body></html>"
            % (E(title), css(cols, extra), body))


def cover(title, lede, eyebrow, who="revise360.co.uk"):
    return ("<div class=\"cover\"><div><p class=\"eyebrow\">%s</p><h1>%s</h1></div>"
            "<div class=\"who\"><div class=\"wordmark\">Revise<span>360</span></div>"
            "%s</div></div>%s"
            % (E(eyebrow), E(title), who.replace("\n", "<br>"),
               "<p class=\"lede\">%s</p>" % E(lede) if lede else ""))


FOOT = ("<p class=\"foot\">Revise 360 &mdash; a product of Revise 360 Ltd, created by Olly "
        "Pettitt. An independent resource: not written, endorsed or approved by OCR or any "
        "exam board. Classroom use and personal study only.</p>")


def richify(markup):
    """Turn every marked span in a finished document into coloured inline code.

    The documents are built with ordinary escaping, so an authored `25` arrives
    here as a literal backtick pair around escaped text. This is the one place
    that unpicks them, and it does it in a single pass over the whole document so
    no builder has to remember to call the lexer at every site.

    A backtick inside a <pre> block is left alone: that is program text already.
    """
    import re as _re
    blocks = []

    def park(m):
        blocks.append(m.group(0))
        return "\x00PRE%d\x00" % (len(blocks) - 1)

    safe = _re.sub(r"<pre\b.*?</pre>", park, markup, flags=_re.S)
    spans = _re.findall(r"`([^`\n]*)`", safe)
    if spans:
        done = rich_many(["`" + html.unescape(x) + "`" for x in spans])
        it = iter(done)
        safe = _re.sub(r"`[^`\n]*`", lambda m: next(it), safe)
    return _re.sub(r"\x00PRE(\d+)\x00", lambda m: blocks[int(m.group(1))], safe)


def work_dir(name="_pdf"):
    """A folder the browser can read, with the fonts beside the HTML."""
    out = os.path.join(ROOT, "build", name)
    os.makedirs(os.path.join(out, "fonts"), exist_ok=True)
    if PLEX:
        for _, f, _w in FONTS:
            src = os.path.join(PLEX, f)
            if os.path.isfile(src):
                shutil.copy(src, os.path.join(out, "fonts", f))
    return out


FOOTER = ("<div style=\"width:100%;font:8px 'Helvetica',sans-serif;color:#667085;"
          "padding:0 13mm;display:flex;justify-content:space-between\">"
          "<span class=\"title\"></span>"
          "<span>Page <span class=\"pageNumber\"></span> of "
          "<span class=\"totalPages\"></span></span></div>")


def render_many(jobs, folder="_pdf", out_dir=None):
    """Several documents to several PDFs, in one browser.

    One browser for the lot: starting one per document turned 115 lesson plans
    into several minutes of launching Chromium. `jobs` is (name, markup) pairs.
    Returns the paths written, in order.
    """
    from playwright.sync_api import sync_playwright
    work = work_dir(folder)
    out_dir = out_dir or os.path.join(ROOT, "build", folder.lstrip("_"))
    os.makedirs(out_dir, exist_ok=True)
    made = []
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--no-sandbox"])
        pg = b.new_page()
        for name, markup in jobs:
            src = os.path.join(work, name + ".html")
            with open(src, "w", encoding="utf-8") as fh:
                fh.write(markup)
            out = os.path.join(out_dir, name + ".pdf")
            pg.goto("file://" + src)
            pg.wait_for_timeout(120)
            pg.pdf(path=out, format="A4", print_background=True,
                   display_header_footer=True, header_template="<div></div>",
                   footer_template=FOOTER,
                   margin={"top": "14mm", "bottom": "14mm", "left": "13mm", "right": "13mm"})
            made.append(out)
        b.close()
    return made


def render(name, markup, folder="_pdf", out_dir=None):
    return render_many([(name, markup)], folder, out_dir)[0]
