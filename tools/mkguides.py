"""The two guides a pupil can print: how the course works, and the syntax.

Both are built from the course itself rather than written beside it, so neither
can quietly stop being true:

  the lessons and their stations   specspy.py and tools/codebank/
  how many activities, of which kind   tools/codebank/
  what the error messages say      js/pyide.js
  every command the course teaches  js/pyref.js
  the names of the activity kinds   js/player.js, which is checked against the
                                    table here rather than copied from it

    python3 mkguides.py            # writes both PDFs into build/ and the site

Typeface: IBM Plex, as BRAND.md says, fetched at build time rather than kept in
the repository - the PDFs embed what they use, so the site needs no font files.

    cd <scratch> && npm pack @ibm/plex-sans @ibm/plex-mono && tar xzf ...

Point R360_PLEX at a folder holding IBMPlexSans-Regular.woff2,
IBMPlexSans-SemiBold.woff2, IBMPlexSans-Bold.woff2 and
IBMPlexMono-Regular.woff2. Without it the guides build in the system sans, which
is fine for a draft and wrong for a printed handout.
"""
import os
import sys
import re
import json
import html
import glob
import shutil
import subprocess
import collections

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BANK = os.path.join(HERE, "codebank")
PLEX = os.environ.get("R360_PLEX", "")

INK, CANVAS, COBALT, TEAL, AMBER, SLATE, BORDER = (
    "#101828", "#ffffff", "#2D63FF", "#08A6A6", "#F4B942", "#667085", "#D9DEE7")

E = lambda s: html.escape(str(s))


# ------------------------------------------------------------------ the course

def lessons():
    """Every lesson, with its stations and what is on them."""
    import specspy
    out = []
    for n in range(1, 14):
        L = getattr(specspy, "L%d" % n)
        bank = json.load(open(os.path.join(BANK, L["id"] + ".json"), encoding="utf-8"))
        kinds = collections.Counter(q.get("kind") or "build" for q in bank["questions"])
        out.append(dict(n=n, id=L["id"], title=L["title"], description=L["description"],
                        keywords=L.get("keywords") or [],
                        stations=bank["stations"], count=len(bank["questions"]),
                        kinds=kinds,
                        optional=sum(1 for q in bank["questions"] if q.get("opt"))))
    return out


def syntax_groups():
    """js/pyref.js, loaded the way the page loads it."""
    js = ("global.window = {};require(%s);"
          "process.stdout.write(JSON.stringify(window.R360Ref.upTo(13)));"
          % json.dumps(os.path.join(ROOT, "js", "pyref.js")))
    out = subprocess.run(["node", "-e", js], capture_output=True, text=True)
    if out.returncode:
        sys.exit("could not load js/pyref.js:\n" + out.stderr)
    return json.loads(out.stdout)


def error_help():
    """The friendly error messages, straight out of js/pyide.js.

    The guide prints what the screen prints. Reading them on paper before the
    first one appears is most of the reason a pupil does not panic at it.
    """
    src = open(os.path.join(ROOT, "js", "pyide.js"), encoding="utf-8").read()
    block = re.search(r"const HINTS = \[(.*?)\n  \];", src, re.S)
    if not block:
        sys.exit("could not find the error table in js/pyide.js")
    rows = []
    for m in re.finditer(r"\[/\^(\w+)[^/]*/,\s*\"(.*?)\",\s*\n\s*\[(.*?)\]\]", block.group(1), re.S):
        name, means, checks = m.group(1), m.group(2), m.group(3)
        items = [c.strip().strip('"') for c in re.findall(r'"((?:[^"\\]|\\.)*)"', checks)]
        rows.append(dict(name=name, means=means.replace("$1", "that name"),
                         checks=[c.replace("$1", "that name") for c in items]))
    if len(rows) < 6:
        sys.exit("only found %d error messages in js/pyide.js" % len(rows))
    return rows


# The seven labels a pupil sees on an activity. player.js is the thing that puts
# them on the screen, so the labels here are checked against it: a guide that
# names a stage the course stopped using is worse than no guide.
KINDS = [
    ("Try it", "Run a program that already works and watch what it does.",
     "Nothing is marked. Pressing Run finishes it."),
    ("Predict", "Read a program and say what it will display, before running it.",
     "Choose one of three answers. You are then shown what Python really does."),
    ("Change it", "A working program, with one thing to alter.",
     "Check my answer runs your program against the tests."),
    ("Complete it", "Part of a program is missing. Fill in the gap.",
     "Check my answer runs your program against the tests."),
    ("Fix it", "A broken program. Find the mistake and put it right.",
     "Check my answer runs your program against the tests."),
    ("Build it", "Write the program yourself.",
     "Check my answer runs your program against the tests."),
    ("Challenge", "The hardest activity on a station, at the end of it.",
     "Check my answer runs your program against the tests. It is not optional."),
]


def check_kinds():
    src = open(os.path.join(ROOT, "js", "player.js"), encoding="utf-8").read()
    on_screen = set(re.findall(r'label: "([^"]+)"', src))
    on_screen.add("Challenge")                       # stageOf() for an optional one
    mine = {k[0] for k in KINDS}
    if mine != on_screen:
        sys.exit("the guide names %s and the course shows %s"
                 % (sorted(mine - on_screen) or "nothing extra",
                    sorted(on_screen - mine) or "nothing extra"))


# ------------------------------------------------------------------ the page

def face(name, file, weight):
    path = os.path.join(PLEX, file)
    if not PLEX or not os.path.isfile(path):
        return ""
    return ("@font-face{font-family:'%s';font-style:normal;font-weight:%d;"
            "src:url('fonts/%s') format('woff2')}" % (name, weight, file))


FONTS = [("Plex Sans", "IBMPlexSans-Regular.woff2", 400),
         ("Plex Sans", "IBMPlexSans-SemiBold.woff2", 600),
         ("Plex Sans", "IBMPlexSans-Bold.woff2", 700),
         ("Plex Mono", "IBMPlexMono-Regular.woff2", 400),
         ("Plex Mono", "IBMPlexMono-SemiBold.woff2", 600)]


def css(cols):
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
.num{font-family:'Plex Mono',monospace;color:%(cobalt)s;font-weight:600}
pre.code{background:#F4F6FB;border:.6pt solid %(border)s;border-radius:3pt;
  padding:5pt 7pt;margin:3pt 0;font-size:8.4pt;line-height:1.4;white-space:pre-wrap}
.shows{font-size:8pt;color:%(slate)s;margin:0}
.shows b{font-family:'Plex Mono',monospace;color:%(ink)s;font-weight:600}
.cols{column-count:%(cols)d;column-gap:14pt}
.entry{break-inside:avoid;margin:0 0 7pt;padding-left:7pt;border-left:1.6pt solid %(border)s}
.entry code.sig{display:block;font-size:9pt;font-weight:600;color:%(ink)s;margin:0 0 1.5pt}
.entry p{margin:0 0 2.5pt;font-size:8.6pt;color:%(slate)s;line-height:1.35}
.group{break-inside:auto;margin:0 0 3pt}
.group h3{margin:0 0 4pt;font-size:9.4pt;color:%(ink)s;break-after:avoid}
.group h3 em{font-style:normal;font-weight:400;color:%(slate)s;font-size:8pt}
.foot{margin-top:10pt;padding-top:5pt;border-top:.6pt solid %(border)s;
  font-size:7.4pt;color:%(slate)s}
@page{size:A4;margin:14mm 13mm 13mm}
.pagebreak{break-before:page}
""" % dict(faces="".join(face(*f) for f in FONTS), ink=INK, canvas=CANVAS, cobalt=COBALT,
           teal=TEAL, amber=AMBER, slate=SLATE, border=BORDER, cols=cols)


def page(title, cols, body):
    return ("<!doctype html><html lang=\"en-GB\"><head><meta charset=\"utf-8\">"
            "<title>%s</title><style>%s</style></head><body>%s</body></html>"
            % (E(title), css(cols), body))


def cover(title, lede, sub):
    return ("<div class=\"cover\"><div><p class=\"eyebrow\">%s</p><h1>%s</h1></div>"
            "<div class=\"who\"><div class=\"wordmark\">Revise<span>360</span></div>"
            "Python course<br>revise360.co.uk</div></div>"
            "<p class=\"lede\">%s</p>" % (E(sub), E(title), E(lede)))


FOOT = ("<p class=\"foot\">Revise 360 &mdash; a product of Revise 360 Ltd, created by Olly "
        "Pettitt. An independent resource: not written, endorsed or approved by OCR or any "
        "exam board. Classroom use and personal study only.</p>")


# ------------------------------------------------------- the diagram of the screen

SCREEN = """
<style>
.screen{border:1.2pt solid %(ink)s;border-radius:4pt;overflow:hidden;margin:0 0 7pt;
  font-size:8pt;break-inside:avoid}
.screen .bar{background:%(ink)s;color:#fff;padding:3.5pt 7pt;font-weight:600;font-size:8.6pt}
.screen .halves{display:flex;gap:0}
.screen .halves>div{padding:6pt 7pt}
.screen .lhs{flex:0 0 52%%;border-right:.6pt solid %(border)s}
.screen .rhs{flex:1}
.screen .blk{border:.6pt solid %(border)s;border-radius:3pt;padding:4pt 6pt;margin:0 0 4pt;
  background:#F7F9FD}
.screen .blk.ed{background:#F1F3F8;min-height:34pt;font-family:'Plex Mono',monospace;color:%(slate)s}
.screen .blk.out{background:#F1F3F8;min-height:24pt;font-family:'Plex Mono',monospace;color:%(slate)s}
.screen .lbl{font-size:6.8pt;letter-spacing:.09em;text-transform:uppercase;color:%(cobalt)s;
  font-weight:600;margin:0 0 2pt}
.screen .btns{display:flex;gap:4pt;justify-content:flex-end;margin-top:3pt}
.screen .b{border:.8pt solid %(ink)s;border-radius:8pt;padding:1.5pt 6pt;font-weight:600;font-size:7.6pt}
.screen .b.fill{background:%(amber)s}
.screen .b.ghost{border-color:%(border)s;color:%(slate)s}
.key{font-family:'Plex Mono',monospace;background:%(cobalt)s;color:#fff;border-radius:50%%;
  display:inline-block;width:11pt;height:11pt;line-height:11pt;text-align:center;
  font-size:7pt;font-weight:600;margin-right:3pt}
.keylist{list-style:none;padding:0;margin:0;column-count:2;column-gap:14pt;font-size:8.6pt}
.keylist li{margin:0 0 3pt;break-inside:avoid}
</style>
<div class="screen">
  <div class="bar">1&nbsp; Printing output</div>
  <div class="halves">
    <div class="lhs">
      <p class="lbl"><span class="key">1</span>Build it &middot; Activity 5 of 10</p>
      <div class="blk"><p class="lbl"><span class="key">2</span>Your task</p>
        1. Display the message Hello world.<br>&bull; Nothing is typed in by the user.</div>
      <div class="blk"><p class="lbl"><span class="key">3</span>Learn</p>
        The quotation marks say where your text starts and stops.</div>
    </div>
    <div class="rhs">
      <div class="blk ed"><span class="key">4</span>print("Hello world")</div>
      <div class="btns" style="justify-content:flex-start">
        <span class="b fill"><span class="key">5</span>&#9654; Run</span>
        <span class="b ghost">Syntax reminder</span></div>
      <div class="blk" style="margin-top:4pt"><p class="lbl"><span class="key">6</span>One run of your program</p>
        You type: nothing &nbsp;&middot;&nbsp; It displays: Hello world</div>
      <div class="blk out"><p class="lbl"><span class="key">7</span>Program output</p>Hello world</div>
      <div class="btns"><span class="b ghost"><span class="key">8</span>Hint</span>
        <span class="b fill"><span class="key">9</span>Check my answer</span></div>
    </div>
  </div>
</div>
<ul class="keylist">
  <li><span class="key">1</span><b>What kind of activity this is</b>, and where you are in the station.</li>
  <li><span class="key">2</span><b>Your task</b>, one numbered step at a time. Read every step before you start.</li>
  <li><span class="key">3</span><b>Learn</b> &mdash; a worked example on different values, showing the shape of what you need.</li>
  <li><span class="key">4</span><b>The editor</b>, where you write your program. Tab indents; Escape leaves the editor.</li>
  <li><span class="key">5</span><b>Run</b> does what your instructions say. It never marks anything.</li>
  <li><span class="key">6</span><b>One run of your program</b> &mdash; what gets typed in, and what must come out.</li>
  <li><span class="key">7</span><b>Program output</b> &mdash; everything your program displayed, and any error.</li>
  <li><span class="key">8</span><b>Hint</b> gives you one step at a time. None of them is the answer.</li>
  <li><span class="key">9</span><b>Check my answer</b> marks your program. You may check as often as you like.</li>
</ul>
""" % dict(ink=INK, border=BORDER, cobalt=COBALT, slate=SLATE, amber=AMBER)


# ------------------------------------------------------------- the course guide

GLOSSARY = [
    ("Program", "A list of instructions a computer follows, in order, from the top."),
    ("Statement", "One instruction. Usually one line."),
    ("Output", "Anything your program displays on the screen."),
    ("Input", "Anything the person using the program types in."),
    ("Variable", "A name your program remembers a value under."),
    ("Value", "The thing a variable is holding at the moment."),
    ("String", "Text. It goes inside quotation marks."),
    ("Integer", "A whole number, with no decimal point."),
    ("Float", "A number with a decimal point in it."),
    ("Boolean", "A value that is either True or False."),
    ("Casting", "Changing a value from one type into another, with int(), float() or str()."),
    ("Concatenation", "Joining two strings end to end with +."),
    ("Condition", "A question with a True or False answer, like score > 10."),
    ("Selection", "Choosing what happens next, using if, elif and else."),
    ("Iteration", "Repeating. A for loop repeats a set number of times; a while loop repeats while a condition is true."),
    ("Accumulator", "A variable that keeps a running total."),
    ("List", "A set of values kept under one name, numbered from 0."),
    ("Index", "The position of one item. The first is 0."),
    ("Subprogram", "A named piece of program you can use again. A function hands a value back; a procedure does not."),
    ("Parameter", "A value handed to a subprogram when it is called."),
    ("Validation", "Checking that what was typed in is sensible before using it."),
    ("Syntax error", "Python could not read the line at all."),
    ("Logic error", "The program runs, but does the wrong thing."),
]


def course_guide(ls, errs):
    kinds = "".join(
        "<tr><td style=\"white-space:nowrap\"><span class=\"tag\">%s</span></td><td>%s</td><td>%s</td></tr>"
        % (E(a), E(b), E(c)) for a, b, c in KINDS)
    lessons_rows = "".join(
        "<tr><td class=\"num\">%02d</td><td><b>%s</b><br><span style=\"color:%s\">%s</span></td>"
        "<td style=\"white-space:nowrap\">%d</td></tr>"
        % (L["n"], E(L["title"]), SLATE, " · ".join(E(x) for x in L["stations"]),
           L["count"]) for L in ls)
    err_rows = "".join(
        "<tr><td><code>%s</code></td><td>%s<ul style=\"margin:2pt 0 0\">%s</ul></td></tr>"
        % (E(e["name"]), E(e["means"]), "".join("<li>%s</li>" % E(c) for c in e["checks"]))
        for e in errs)
    total = sum(L["count"] for L in ls)
    opt = sum(L["optional"] for L in ls)
    kc = collections.Counter()
    for L in ls:
        kc.update(L["kinds"])

    body = cover(
        "How the Python course works",
        "Thirteen lessons of Python, written and run in your browser. Everything you need to "
        "know before you open lesson 1 is on these pages. Keep it beside you.",
        "Revise 360 · student guide")

    body += """
<section><h2>Before you start</h2>
<p><b>Python is a language for writing instructions.</b> A computer follows them one line at a
time, from the top. A set of instructions is a <b>program</b>, and everything in this course is
you writing, reading or fixing one.</p>
<p>You do not install anything. Python runs inside the browser, so what you write runs on the
page in front of you and nobody else can see it.</p>
<div class="band"><p><b>You cannot break anything.</b> If your program goes wrong, the worst that
happens is a message in red. If it never stops, the page stops it for you after a few seconds.
Nothing you type can damage the computer, the website or your work.</p></div>
</section>

<section><h2>The screen, part by part</h2>%s</section>
""" % SCREEN

    body += """
<section class="pagebreak"><h2>Run and Check are not the same button</h2>
<table><tr>
<td style="width:50%%;border:0;padding-right:10pt"><h3 style="margin-top:0">&#9654; Run</h3>
<p>Does exactly what your instructions say and shows the result under <b>Program output</b>.
It never marks anything and never tells you that you are wrong.</p>
<p>Press it as often as you like. Trying something out is how programming is done.</p></td>
<td style="width:50%%;border:0"><h3 style="margin-top:0">Check my answer</h3>
<p>Runs your program against the tests for that activity and marks it. You will see which tests
passed, what was expected, and what your program displayed instead.</p>
<p>You may check as many times as you like. <b>Your best mark is the one that is kept</b>, so a
program you get working on the fourth try scores the same as one that works first time.</p></td>
</tr></table>
</section>

<section><h2>The seven kinds of activity</h2>
<p>A technique is never taught all at once. You run it, read it, change it, complete it, fix it,
and only then write it from nothing. The label at the top left of every activity tells you which
of those you are doing.</p>
<table><tr><th>Shown as</th><th>What you do</th><th>How it is finished</th></tr>%s</table>
<p style="font-size:8.6pt;color:%s">Across the whole course there are %d activities: %d to run,
%d to predict, %d to change, %d to complete, %d to fix and %d to write, of which %d are the
challenge at the end of a station. You complete all of them, in order.</p>
</section>
""" % (kinds, SLATE, total, kc["try"], kc["predict"], kc["change"], kc["complete"],
       kc["debug"], kc["build"], opt)

    body += """
<section><h2>Getting unstuck</h2>
<h3>The Hint button</h3>
<p>A hint is a ladder, not an answer. Press it once for the first step, and again for the next
when you need it. Most activities have three or four steps:</p>
<ol>
<li><b>Think</b> &mdash; a sentence naming the idea you need.</li>
<li><b>The Python you need</b> &mdash; the shape of it, with this activity's own values left out.</li>
<li><b>How it starts</b> &mdash; the first line or two.</li>
<li><b>Watch the technique</b> &mdash; a short animation of how it works, on different values.</li>
</ol>
<p>None of the steps is the answer to the activity, so there is nothing to be gained by skipping
to the last one. Your program stays exactly where you left it while the hint is open.</p>
<h3>The Syntax reminder button</h3>
<p>Every command the course has taught you so far, with what it does and an example. It does not
mention the activity you are on. Look things up in it as often as you like &mdash; nobody
remembers whether the brackets go on <code>print</code> or <code>input</code> at first, and
there is no advantage in guessing. The same list is printed in the <b>Python syntax guide</b>
beside this one.</p>
</section>

<section class="pagebreak"><h2>When something goes wrong</h2>
<p><b>Errors are normal.</b> Every programmer sees them all day. An error is not you failing; it
is Python telling you it could not follow an instruction, and which one.</p>
<p>An error message comes in three parts. Read them in this order:</p>
<ol>
<li><b>Python's own words</b>, such as <code>NameError: name 'score' is not defined</code>.
Learning to read these is part of learning to program.</li>
<li><b>What this probably means</b> &mdash; in plain English. <i>Probably</i>, because the message
names what went wrong, not always why.</li>
<li><b>Check these things</b> &mdash; a short list of what to look at first.</li>
</ol>
<p>These are the ones you will meet most:</p>
<table><tr><th style="width:26%%">Python says</th><th>What it usually means, and what to check</th></tr>%s</table>
<div class="band amber"><p><b>If your program never stops</b>, you have written a loop with no way
out. It is the commonest mistake in the course and everybody makes it. The page stops the program
for you; go back to the loop and find the line that was meant to change the value it is testing.</p></div>
</section>
""" % err_rows

    body += """
<section><h2>Working in order, and getting help</h2>
<div class="band"><p><b>You do every question, in order.</b> The next one opens when this one is
finished, and there is no way to skip past it. That is on purpose: each activity teaches the thing
the next one needs, so going round it would only make the next one harder.</p></div>
<ul>
<li><b>Finished means right.</b> A program is finished when every test passes; a Predict when you
choose the right answer; a Try it when it runs. Part of the way there is recorded, but it does not
open the next question.</li>
<li><b>Try as many times as you like.</b> Your best attempt is the mark that is kept, so getting it
working on the fourth try scores the same as first time.</li>
<li><b>Asking for help costs you nothing.</b> It takes no marks off and it is not a last resort.</li>
<li><b>Hints do not finish a question for you</b>, and neither does running out of attempts.
Only doing the work does.</li>
<li>Your work saves after every answer. You can stop, log out and come back to the same question.</li>
<li><b>Review mode</b> lets you look back over anything you have already finished.</li>
</ul>
<h3>When you are stuck</h3>
<p>Press <b>I need help</b>. It is there from the first attempt, on every question. It will offer
you a hint, take you back to the worked example, or tell you to ask your teacher.</p>
<div class="band amber"><p>Not sure what to do next? That is OK. You can use a hint or ask your
teacher for help. Show them this question and your code. Complete this question before moving on.</p></div>
<p>Your teacher cannot see your screen from their desk, so put your hand up or message them the way
your school normally does. If you think the question itself is wrong, tell them &mdash; reporting a
fault does not finish the question, and it should not.</p>
</section>

<section><h2>How to work through an activity</h2>
<ol>
<li>Read <b>every</b> numbered step, and the bullets under them, before you type anything.</li>
<li>Look at <b>One run of your program</b>. It tells you exactly what gets typed in and exactly
what must come out. Most wrong answers are right programs that display the wrong thing.</li>
<li>Read the <b>Learn</b> example. It shows the shape on different values, never the answer.</li>
<li>Write a little, then press <b>Run</b>. Do not write the whole thing and hope.</li>
<li>Press <b>Check my answer</b>. If a test fails, read what it expected and what yours displayed.
The difference is the bug.</li>
<li>Change <b>one thing</b>, then check again.</li>
</ol>
<div class="band teal"><p><b>On paper first.</b> For anything longer than three lines, write down
what goes in, what has to be worked out, and what comes out, before you touch the keyboard. Your
worksheet has space for exactly that.</p></div>
</section>
"""

    body += """
<section class="flow"><h2>The thirteen lessons</h2>
<table><tr><th style="width:5%%">#</th><th>Lesson and its six stations</th><th>Activities</th></tr>%s</table>
<p style="font-size:8.6pt;color:%s">This course sits beyond the OCR J277 specification. It teaches
the same programming techniques the specification lists, as code you write and run.</p>
</section>

<section><h2>Words this course uses</h2>
<table>%s</table>
</section>
%s
""" % (lessons_rows, SLATE,
       "".join("<tr><td style=\"width:24%%;white-space:nowrap\"><b>%s</b></td><td>%s</td></tr>"
               % (E(w), E(d)) for w, d in GLOSSARY),
       FOOT)
    return page("Revise 360 - Python course guide", 1, body)


# ------------------------------------------------------------- the syntax guide

def syntax_guide(groups):
    def entry(it):
        eg = it.get("eg")
        eg = eg if isinstance(eg, list) else ([eg] if eg else [])
        out = it.get("egOut")
        out = out if isinstance(out, list) else ([out] if out else [])
        return ("<div class=\"entry\"><code class=\"sig\">%s</code><p>%s</p>%s%s</div>"
                % (E(it["syntax"]), E(it["what"]),
                   "<pre class=\"code\">%s</pre>" % E("\n".join(eg)) if eg else "",
                   "<p class=\"shows\">shows <b>%s</b></p>" % E(" / ".join(out)) if out else ""))

    blocks = "".join(
        "<div class=\"group\"><h3>%s <em>&mdash; lesson %d</em></h3>%s</div>"
        % (E(g["name"]), g["lesson"], "".join(entry(it) for it in g["items"]))
        for g in groups)
    n = sum(len(g["items"]) for g in groups)

    body = cover(
        "Python syntax guide",
        "Every command this course teaches, with what it does and an example you can try. "
        "Nothing here is the answer to an activity; it is what to look up while you work one out.",
        "Revise 360 · student reference")
    body += ("<div class=\"band\"><p>The groups are in the order the course teaches them, and each "
             "one says which lesson it belongs to. The same list is on screen behind the "
             "<b>Syntax reminder</b> button, which only ever shows you as far as the lesson you "
             "are on. %d entries in all.</p></div>" % n)
    body += "<div class=\"cols\">%s</div>%s" % (blocks, FOOT)
    return page("Revise 360 - Python syntax guide", 2, body)


# ------------------------------------------------------------------ rendering

def render(name, markup):
    """One HTML file to one PDF, through the browser that already renders the site."""
    from playwright.sync_api import sync_playwright
    work = os.path.join(OUT_S, "_guides")
    os.makedirs(os.path.join(work, "fonts"), exist_ok=True)
    if PLEX:
        for _, f, _w in FONTS:
            src = os.path.join(PLEX, f)
            if os.path.isfile(src):
                shutil.copy(src, os.path.join(work, "fonts", f))
    src = os.path.join(work, name + ".html")
    with open(src, "w", encoding="utf-8") as fh:
        fh.write(markup)
    out = os.path.join(OUT_S, name + ".pdf")
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--no-sandbox"])
        pg = b.new_page()
        pg.goto("file://" + src)
        pg.wait_for_timeout(600)
        pg.pdf(path=out, format="A4", print_background=True,
               display_header_footer=True, header_template="<div></div>",
               footer_template=(
                   "<div style=\"width:100%;font:8px 'Helvetica',sans-serif;color:#667085;"
                   "padding:0 13mm;display:flex;justify-content:space-between\">"
                   "<span class=\"title\"></span>"
                   "<span>Page <span class=\"pageNumber\"></span> of <span class=\"totalPages\"></span></span>"
                   "</div>"),
               margin={"top": "14mm", "bottom": "14mm", "left": "13mm", "right": "13mm"})
        b.close()
    return out


def main():
    check_kinds()
    ls = lessons()
    errs = error_help()
    groups = syntax_groups()
    if not PLEX:
        print("note: R360_PLEX is not set, so these build in the system sans. See the docstring.")
    made = []
    made.append(render("Revise360_Python_Course_Guide", course_guide(ls, errs)))
    made.append(render("Revise360_Python_Syntax_Guide", syntax_guide(groups)))
    dest = os.path.join(SITE_S, "guides")
    os.makedirs(dest, exist_ok=True)
    for f in made:
        shutil.copy(f, os.path.join(dest, os.path.basename(f)))
        print("ok %s  (%.0f KB)" % (f, os.path.getsize(f) / 1024))
    print("copied into %s" % dest)
    return 0


if __name__ == "__main__":
    sys.exit(main())
