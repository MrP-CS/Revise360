"""The three teacher documents for each unit, and the course-wide Big Picture.

  Unit_Pedagogy.pdf        why this unit is taught in this order, what is hard
                           about it, where support fades and what evidence to look
                           for - written from the unit's own lessons
  Unit_Big_Picture.pdf     where the unit sits, what it covers, and a coverage
                           matrix built from the same records the lesson plans use
  Unit_Delivery_Guide.pdf  how to run it: sequence, timings, preparation, and
                           every lesson plan in teaching order
  GCSE_Course_Big_Picture.pdf  all twelve units across the specification

Everything is derived from build/records/ and build/coverage.json, so a claim in a
unit guide and the same claim in a lesson plan come from one place. Specification
references come from tools/specref.py, which keeps what was checked separate from
what was not.

    R360_PLEX=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \\
      python3 tools/mkunitdocs.py           # every unit, and the course map
      python3 tools/mkunitdocs.py 1.1       # one unit
"""
import os
import sys
import json
import glob
import collections

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from paths import SITE_S                                       # noqa: E402
import pdfkit as K                                             # noqa: E402
import specref as S                                            # noqa: E402
import mkplans as P                                            # noqa: E402

ROOT = SITE_S.rstrip("/")
RECS = os.path.join(ROOT, "build", "records")
OUT = os.path.join(ROOT, "build", "unitdocs")
E = K.E

EXTRA = """
table.keyval th{width:28%%;text-transform:none;letter-spacing:0;font-size:8.8pt;
  color:%(slate)s;border-bottom:.6pt solid %(border)s;padding:4pt 6pt 4pt 0}
.gapnote{background:#FEF3F2;border-left:2.4pt solid #E2574C;padding:5pt 8pt;
  margin:0 0 7pt;font-size:8.6pt;color:#7A271A}
.toc{columns:2;column-gap:16pt;font-size:9pt}
.toc a{text-decoration:none}
.full{color:#15803D;font-weight:600}
.part{color:#8a6200;font-weight:600}
.none{color:#B42318;font-weight:600}
td.small,th.small{font-size:8pt}
""" % dict(slate=K.SLATE, border=K.BORDER)


def load():
    recs = [json.load(open(p, encoding="utf-8"))
            for p in sorted(glob.glob(os.path.join(RECS, "*.json")))]
    recs.sort(key=lambda r: (r["unit"], r["lesson"] or 0))
    cov = {m["lesson"]: m for m in json.load(
        open(os.path.join(ROOT, "build", "coverage.json"), encoding="utf-8"))["lessons"]}
    units = collections.OrderedDict()
    for r in recs:
        units.setdefault(r["unit"], []).append(r)
    return units, cov


def unit_title(uid, recs):
    return S.title_of(uid) or recs[0]["unit_title"]


def spec_block(uid):
    """What is known about where this unit sits, and how it is known."""
    if uid == "PY":
        return ('<div class="band grey"><p><b>No specification reference.</b> %s</p>'
                "</div>" % E(S.PY_NOTE))
    c = S.CHECKED
    comp_code = S.component_of(uid)
    comp = next(x for x in c["components"] if x["code"] == comp_code)
    rows = [
        ("Qualification", "%s, specification code %s, %s"
         % (E(c["qualification"]), E(c["code"]), E(c["first_taught"]))),
        ("Component", "Component %s: %s &mdash; %d marks, %s"
         % (E(comp["code"]), E(comp["name"]), comp["marks"], E(comp["duration"]))),
        ("What OCR says the component covers", E(comp["overview"])),
        ("This unit", "topic %s %s" % (E(uid), E(S.title_of(uid)))),
        ("Checked", "%s, at <a href=\"%s\">%s</a>"
         % (E(c["checked_on"]), E(c["source"]), E(c["source"]))),
    ]
    return ("<table class=\"keyval\"><tbody>%s</tbody></table>"
            '<div class="band amber"><p><b>How far this has been checked.</b> %s</p>'
            "</div>"
            % ("".join("<tr><th>%s</th><td>%s</td></tr>" % (a, b) for a, b in rows),
               E(S.UNCHECKED_NOTE)))


# ------------------------------------------------------------------ pedagogy
def pedagogy(uid, recs, cov):
    title = unit_title(uid, recs)
    teaching = [r for r in recs if r["kind"] == "experience"]
    tests = [r for r in recs if r["kind"] == "worksheet"]
    bonus = [r for r in recs if r["kind"] == "challenge"]
    acts = sum(r["totals"]["activities"] for r in recs)
    guided = sum(r["totals"]["guided"] for r in recs)
    indep = sum(r["totals"]["independent"] for r in recs)
    chall = sum(r["totals"]["challenge"] for r in recs)
    vocab = []
    for r in recs:
        for v in r["vocabulary"]:
            if v not in vocab:
                vocab.append(v)

    body = [K.cover("%s %s" % (uid, title) if uid != "PY" else title,
                    "Why this unit is taught the way it is",
                    "Unit pedagogy", "Teacher guide\nUnit %s\nrevise360.co.uk" % uid)]

    body.append("<h2>What this unit teaches, and where it ends</h2>")
    body.append("<p>%d lesson%s: %d with an online experience, %d paper "
                "assessment%s and %d bonus challenge%s. %d activities in all, worth "
                "%d marks.</p>"
                % (len(recs), "" if len(recs) == 1 else "s", len(teaching), len(tests),
                   "" if len(tests) == 1 else "s", len(bonus),
                   "" if len(bonus) == 1 else "s", acts,
                   sum(r["totals"]["marks"] for r in recs)))
    body.append("<p>By the end of it a pupil should be able to:</p><ul>%s</ul>"
                % "".join("<li>%s <span class=\"tag grey\">%s</span></li>"
                          % (E(o["text"]), E(r["id"]))
                          for r in recs for o in r["outcomes"]))
    if recs[0]["prerequisites"]["lessons"]:
        body.append("<p>The unit assumes nothing from outside itself beyond what the "
                    "earlier units teach.</p>")

    body.append("<h2>Why the lessons are in this order</h2>")
    body.append("<p>Each lesson's starter retrieves the one before it, so the order "
                "is the retrieval schedule as much as the teaching one. The chain for "
                "this unit:</p><table><thead><tr><th>Lesson</th><th>Teaches</th>"
                "<th>Retrieves</th></tr></thead><tbody>")
    for i, r in enumerate(recs):
        first = r["outcomes"][0]["text"] if r["outcomes"] else (
            "assesses the whole unit" if r["kind"] == "worksheet" else "stretches what is taught")
        prev = recs[i - 1]["title"] if i else "nothing before it in this unit"
        body.append("<tr><td><b>%s</b> %s</td><td>%s</td><td>%s</td></tr>"
                    % (E(r["lesson"]), E(r["title"]), E(first), E(prev)))
    body.append("</tbody></table>")
    if tests:
        body.append("<p>The %s in this unit %s placed where it is so that the "
                    "reflection sheet still has lessons left to send a pupil back "
                    "to.</p>" % ("assessments" if len(tests) > 1 else "assessment",
                                 "are" if len(tests) > 1 else "is"))

    body.append("<h2>What pupils find hard here</h2>")
    mis = []
    for r in recs:
        for st in r["stations"]:
            for m in st["misconceptions"]:
                if m.get("says") and m["from"] == "wall panel":
                    mis.append((r["id"], r["title"], m["says"]))
    if mis:
        body.append("<p>These are the misconceptions the unit's own teaching names "
                    "and works against. They are not a general list: each one is "
                    "written on a wall of the experience it belongs to.</p><ul>")
        for lid, lt, m in mis[:18]:
            body.append("<li>%s <span class=\"tag grey\">%s</span></li>" % (E(m), E(lid)))
        body.append("</ul>")
    elif all(st["explains"] is None for r in recs for st in r["stations"]):
        body.append('<div class="band grey"><p>This unit\'s wall panels are painted '
                    'into the 360 images and are not held as text, so a "common '
                    'mistake" line written on a wall cannot be gathered here. Open '
                    'each experience, or read the lesson plans, which carry the '
                    'station names and the distractors of every question.</p></div>')
    else:
        body.append('<div class="band grey"><p>None of this unit\'s walls names a '
                    'common mistake in so many words. The misconceptions it works '
                    'against are in the wrong options of its questions instead: every '
                    'one of those is a plausible wrong idea rather than filler, and '
                    'the lesson plans list them question by question.</p></div>')
    worst = [m for m in cov.values() if m["lesson"] in {r["id"] for r in recs}]
    hinges = sum(len(st["checks"]) for r in recs for st in r["stations"])
    body.append("<p>Every multiple-choice and Predict activity in the unit &mdash; %d "
                "of them &mdash; offers wrong answers that are the misconception, not "
                "filler. The split across those options at the hinge question is the "
                "cheapest diagnostic in the lesson.</p>" % hinges)

    # Only a unit that carries worked examples is told it carries worked examples.
    examples = sum(1 for r in recs for st in r["stations"] for a in st["activities"]
                   if a.get("worked_example"))
    model_says = (
        "The worked example on the early activities of each station - %d of them in "
        "this unit. Each uses different data from the task on purpose, so copying it "
        "does not finish the task." % examples if examples else
        "There is no worked example on screen in this unit: its activities are "
        "questions to answer rather than techniques to copy. The modelling is yours, "
        "from the slides, before anyone starts - and it is the part to protect when "
        "the lesson runs short.")
    body.append("<h2>Where the explaining, modelling and practising happen</h2>")
    body.append("<table><thead><tr><th>Phase</th><th>Where it is</th></tr></thead>"
                "<tbody>"
                "<tr><td><b>Retrieve</b></td><td>The starter on the worksheet, before "
                "any device is opened. It is answered on paper and corrected before "
                "the lesson moves on.</td></tr>"
                "<tr><td><b>Explain</b></td><td>The slides and the station walls carry "
                "the same explanation, so a teacher can teach from the front and a "
                "pupil can re-read it in the room.</td></tr>"
                "<tr><td><b>Model</b></td><td>%s</td></tr>"
                "<tr><td><b>Practise</b></td><td>%d guided activities, then %d "
                "independent ones.</td></tr>"
                "<tr><td><b>Check</b></td><td>The badge questions mark as the pupil "
                "goes; the hinge question is for the class at once.</td></tr>"
                "<tr><td><b>Apply</b></td><td>%d challenge activities, and the exam "
                "practice on the worksheet.</td></tr>"
                "<tr><td><b>Review</b></td><td>The exit question and the confidence "
                "columns. The confidence columns supplement the evidence; they do not "
                "stand in for it.</td></tr>"
                "</tbody></table>" % (model_says, guided, indep, chall))
    if not indep and not chall:
        body.append('<div class="band amber"><p><b>An honest note about this unit.</b> '
                    'Every one of its %d activities is guided: a pupil chooses between '
                    'options and never produces anything of their own on screen. The '
                    'independent work in this unit is on paper - the key facts, the '
                    'station challenges and the exam practice - so plan for it, and do '
                    'not read a full online score as evidence that a pupil can do it '
                    'unaided.</p></div>' % acts)

    body.append("<h2>How the website, the slides and the worksheet divide the work</h2>")
    body.append("<p>They are not three copies of the same thing.</p><ul>"
                "<li><b>The slides</b> are for the front of the room: the explanation "
                "and the model, before anyone is working alone.</li>"
                "<li><b>The experience</b> is where a pupil reads, decides and is "
                "marked. It gives the immediate feedback a teacher cannot give thirty "
                "pupils at once.</li>"
                "<li><b>The worksheet</b> is the record and the writing. The key fact "
                "in their own words, the station challenge, the exam practice. It is "
                "also what survives when the devices do not.</li></ul>"
                "<p>The rule that holds them together is <b>write first, then answer "
                "at the badge</b>. A pupil who taps first has turned the lesson into a "
                "quiz game, and the worksheet is how you can see at a glance who "
                "did.</p>")

    body.append("<h2>Why a 360&deg; room, and what it should produce</h2>")
    body.append("<p>The room is not there to be impressive. It is there because this "
                "unit's content is a set of related parts that a pupil has to hold "
                "together, and putting one part on each wall makes the set visible and "
                "navigable: a pupil can turn back to station 2 while answering station "
                "4. The evidence it should produce is on paper &mdash; %d key facts "
                "and %d station challenges in a pupil's own words &mdash; and in the "
                "score screen, which shows which station a pupil lost marks on rather "
                "than one number.</p>"
                % (sum(1 for r in recs for st in r["stations"] if st.get("key_fact_prompt")),
                   sum(1 for r in recs for st in r["stations"] if st.get("challenge"))))
    body.append('<p class="shows">No claim is made here that immersion improves '
                "learning on its own. What the format does is make the structure of a "
                "topic physical and keep a pupil's attention on one part at a time; "
                "the teaching is in the explanation, the example and the practice, as "
                "it would be anywhere else.</p>")

    body.append("<h2>Support, and how it is taken away</h2>")
    body.append("<ul>"
                "<li>The worked example is on the early activities of a station and "
                "not on the late ones. That fade is deliberate.</li>"
                "<li>The hint is a ladder asked for one rung at a time, and the top of "
                "it is still the technique on different data, never the answer.</li>"
                "<li>Read aloud is on every task.</li>"
                "<li>Prescribed values are boxed and in a monospace face as well as "
                "coloured, so they survive a black-and-white printout and a "
                "high-contrast mode.</li>"
                "<li><b>Lower literacy and EAL:</b> pre-teach the vocabulary (%s). "
                "Accept the key fact spoken before it is written, and in two or three "
                "words.</li>"
                "<li><b>SEND:</b> pace is not fixed. Progress saves after every answer "
                "and reopens at the earliest unfinished question, so a pupil may "
                "finish a station next lesson without losing anything.</li>"
                "<li>A headset is never required.</li></ul>"
                % (", ".join(E(v) for v in vocab[:12]) or "none is listed for this unit"))

    body.append("<h2>Checking, and what to do with what you find</h2>")
    body.append("<p>Three checks, in this order: the starter (did last lesson stick), "
                "the hinge question (is the class ready for independent work), the "
                "exit question (did this lesson stick). The first two change what you "
                "do in the lesson; the third changes what you start the next one "
                "with.</p>"
                "<p>When a hinge question splits the class, go back to the station it "
                "sits on and work its example again, aloud, before anyone goes on. "
                "When a test comes back, the reflection sheet names the topics to "
                "revisit and review mode on those lessons reopens exactly the "
                "questions a pupil got wrong.</p>")

    if uid == "PY":
        body.append("<h2>The Python sequence, and why the order is compulsory</h2>")
        body.append("<p>Every station releases the same way:</p>"
                    "<p><b>Learn</b> &rarr; <b>See</b> &rarr; <b>Predict</b> &rarr; "
                    "<b>Change</b> &rarr; <b>Complete</b> &rarr; <b>Build</b> &rarr; "
                    "<b>Apply</b>.</p>"
                    "<ul>"
                    "<li><b>Learn and See:</b> a sentence and a worked example, then a "
                    "program to run. Nothing is marked.</li>"
                    "<li><b>Predict:</b> say what it will display before running it. "
                    "This is where a misreading surfaces cheaply.</li>"
                    "<li><b>Change:</b> one thing to alter in a working program.</li>"
                    "<li><b>Complete:</b> a program with a gap in it.</li>"
                    "<li><b>Fix:</b> a program with a real error and a real "
                    "traceback.</li>"
                    "<li><b>Build:</b> from nothing, with the brief and the hint "
                    "ladder.</li>"
                    "<li><b>Apply:</b> the Challenge, the hardest task on the "
                    "station.</li></ul>"
                    "<p>A pupil works through them in order and completes every one, "
                    "because each teaches what the next needs: a pupil who skips "
                    "Predict arrives at Build without having found out that they read "
                    "the program wrongly. When they are stuck they get the hint "
                    "ladder, and then they ask you. They do not skip the question, and "
                    "there is no teacher bypass.</p>"
                    "<p>What this costs is time, and it is the right thing to spend it "
                    "on. What it buys is that a pupil who reaches lesson 13 has "
                    "written every program between here and there.</p>")
        body.append("<h2>Where this sits against the specification</h2>")
        body.append("<p>%s</p>" % E(S.PY_NOTE))
        body.append("<ul>%s</ul>" % "".join(
            "<li><b>%s %s</b> &mdash; %s</li>" % (E(t), E(S.title_of(t)), E(v))
            for t, v in S.PY_SUPPORTS.items()))
        body.append("<p><b>Beyond the specification, and named as such:</b></p><ul>%s</ul>"
                    % "".join("<li>%s</li>" % E(x) for x in S.PY_ENRICHMENT))

    body.append("<h2>Where the approach comes from</h2>")
    body.append("<p>The shape of a lesson here &mdash; retrieve, explain, model, "
                "practise with support that fades, check, apply, review &mdash; is "
                "ordinary evidence-informed practice rather than anything this product "
                "invented. Useful starting points, none of them about Revise 360:</p>"
                "<ul>"
                "<li>Rosenshine, <i>Principles of Instruction</i> (American Educator, "
                "2012) &mdash; the daily review, small steps, worked examples and "
                "checking for understanding that this structure follows.</li>"
                "<li>Sweller, van Merri&euml;nboer and Paas on cognitive load and the "
                "worked-example effect &mdash; why the example comes before the "
                "independent task and why the support is withdrawn gradually.</li>"
                "<li>Dunlosky et al., <i>Improving Students' Learning With Effective "
                "Learning Techniques</i> (2013) &mdash; the evidence for retrieval "
                "practice and spacing, which the starters and the review mode "
                "use.</li>"
                "<li>Wiliam, <i>Embedded Formative Assessment</i> &mdash; hinge "
                "questions and what to do with the answers.</li>"
                "</ul>")
    body.append('<div class="band amber"><p><b>What is not claimed.</b> Nothing above '
                "is evidence that Revise 360 improves outcomes. No trial of this "
                "product has been run, and immersion is not claimed to improve "
                "learning by itself. The citations are for the teaching structure; "
                "whether these resources work in your classroom is a question your "
                "own assessment answers.</p></div>")
    body.append(K.FOOT)
    return K.richify(K.page("Unit pedagogy %s" % uid, "".join(body), 1,
                            EXTRA + K.token_css()))


# --------------------------------------------------------------- big picture
def coverage_rows(uid, recs, cov):
    """Each outcome in the unit, and how far it is covered, from the records."""
    rows = []
    for r in recs:
        m = cov.get(r["id"], {})
        for o in m.get("outcomes", []):
            taught = bool(o["taught_at"])
            practised = bool(o["practised_by"])
            assessed = bool(o["assessed_by"])
            if taught and practised and assessed:
                level, word = "full", "Full"
            elif taught or practised or assessed:
                level, word = "part", "Partial"
            else:
                level, word = "none", "Not covered"
            rows.append(dict(lesson=r["id"], lesson_title=r["title"], outcome=o["outcome"],
                             text=o["text"], taught=taught, practised=practised,
                             assessed=assessed, level=level, word=word,
                             kind=o.get("kind", "subject"), gaps=o["gaps"],
                             where_assessed=o["assessed_by"]))
    return rows


def big_picture(uid, recs, cov, units):
    title = unit_title(uid, recs)
    rows = coverage_rows(uid, recs, cov)
    order = list(units)
    at = order.index(uid)
    body = [K.cover("%s %s" % (uid, title) if uid != "PY" else title,
                    "Where this unit sits, what it covers, and how far",
                    "Unit big picture", "Teacher guide\nUnit %s\nrevise360.co.uk" % uid)]

    body.append("<h2>Where this unit sits</h2>")
    body.append(spec_block(uid))
    before = order[:at]
    after = order[at + 1:]
    body.append("<p><b>Before it:</b> %s</p><p><b>After it:</b> %s</p>"
                % (", ".join("%s %s" % (E(u), E(S.title_of(u) or units[u][0]["unit_title"]))
                              for u in before)
                   or "nothing &mdash; this is the first unit of the course",
                   ", ".join("%s %s" % (E(u), E(S.title_of(u) or units[u][0]["unit_title"]))
                             for u in after)
                   or "nothing &mdash; this is the last unit of the course"))

    body.append("<h2>The lesson sequence and the questions it answers</h2>")
    body.append("<table><thead><tr><th>#</th><th>Lesson</th><th>The big question</th>"
                "<th>Activities</th><th>Marks</th></tr></thead><tbody>")
    for r in recs:
        body.append("<tr><td class=\"num\">%s</td><td><b>%s</b><br>"
                    "<span class=\"tag grey\">%s</span></td><td>%s</td>"
                    "<td class=\"num\">%d</td><td class=\"num\">%d</td></tr>"
                    % (E(r["lesson"]), E(r["title"]), E(r["id"]),
                       E(r.get("key_question") or
                         ("assesses the whole unit" if r["kind"] == "worksheet"
                          else "stretch work, no new content")),
                       r["totals"]["activities"], r["totals"]["marks"]))
    body.append("</tbody></table>")

    vocab = []
    for r in recs:
        for v in r["vocabulary"]:
            if v not in vocab:
                vocab.append(v)
    body.append("<h2>Prior knowledge, vocabulary and skills</h2>")
    body.append("<p><b>Assumed before the unit:</b> %s</p>"
                % ("nothing beyond the earlier units of this course"
                   if at == 0 else
                   "the outcomes of " + ", ".join("%s" % E(u) for u in before)))
    body.append("<p><b>Vocabulary introduced:</b> %s</p>"
                % (", ".join("<b>%s</b>" % E(v) for v in vocab)
                   or "none is recorded for this unit"))
    skills = sorted({a["kind"] for r in recs for st in r["stations"] for a in st["activities"]})
    body.append("<p><b>What a pupil does, not only reads:</b> %s</p>"
                % (", ".join(E(k) for k in skills) or "nothing on screen"))

    body.append("<h2>Coverage matrix</h2>")
    body.append("<p>Every outcome this unit states, and whether it is taught, "
                "practised and assessed <b>within this unit</b>. Full means all "
                "three; partial means some; not covered means none of the three could "
                "be traced.</p>")
    body.append('<div class="band amber"><p><b>How this was worked out.</b> The trace '
                "is derived by matching the content words of an outcome against the "
                "station text, the activities and the exam questions of the unit, not "
                "authored by hand. The words each match was made on are in "
                "<code>build/coverage.json</code>. It shows where to look; it does not "
                "certify that the alignment is right, and a full row has not been "
                "checked by a person either.</p></div>")
    body.append("<table class=\"flow\"><thead><tr><th>Outcome</th><th>Lesson</th>"
                "<th class=\"small\">Taught</th><th class=\"small\">Practised</th>"
                "<th class=\"small\">Assessed</th><th>Coverage</th></tr></thead><tbody>")
    for row in rows:
        tick = lambda b: "yes" if b else "&mdash;"
        body.append("<tr><td>%s<br><span class=\"tag grey\">%s</span></td>"
                    "<td>%s</td><td class=\"small\">%s</td><td class=\"small\">%s</td>"
                    "<td class=\"small\">%s</td>"
                    "<td class=\"%s\">%s</td></tr>"
                    % (E(row["text"]), E(row["outcome"]), E(row["lesson"]),
                       tick(row["taught"]), tick(row["practised"]), tick(row["assessed"]),
                       row["level"], E(row["word"])))
    body.append("</tbody></table>")

    full = sum(1 for r in rows if r["level"] == "full")
    part = sum(1 for r in rows if r["level"] == "part")
    none = sum(1 for r in rows if r["level"] == "none")
    body.append("<p><span class=\"full\">%d full</span> &middot; "
                "<span class=\"part\">%d partial</span> &middot; "
                "<span class=\"none\">%d not covered</span>, of %d outcomes.</p>"
                % (full, part, none, len(rows)))

    body.append("<h2>Gaps, assumptions and overlap</h2>")
    gaps = [r for r in rows if r["gaps"]]
    if gaps:
        body.append("<ul>")
        for r in gaps:
            body.append("<li><b>%s</b> %s &mdash; %s</li>"
                        % (E(r["outcome"]), E(r["text"]), E("; ".join(r["gaps"]))))
        body.append("</ul>")
    else:
        body.append("<p>None found by the trace.</p>")
    orphans = [x for r in recs for x in cov.get(r["id"], {}).get(
        "assessed_but_not_an_outcome", [])]
    if orphans:
        body.append("<h3>Assessed, but matching no outcome this unit states</h3>"
                    "<p>Each of these is a real exam question on a worksheet in this "
                    "unit. Either the outcome it tests is worded differently, or it is "
                    "genuinely assessing something the unit does not claim to "
                    "teach.</p><ul>%s</ul>"
                    % "".join("<li><code>%s</code> %s</li>"
                              % (E(x["id"]), E(x.get("asks") or "")) for x in orphans[:14]))
    pix = [r["id"] for r in recs if r["stations"]
           and all(s["explains"] is None for s in r["stations"])]
    if pix:
        body.append("<h3>What could not be traced</h3><p>The wall text of %s is painted "
                    "into the 360 image and held nowhere as text, so an outcome in "
                    "%s lesson can only be traced through its activities and its exam "
                    "questions. Read the rows above for %s with that in mind.</p>"
                    % (", ".join("<code>%s</code>" % E(x) for x in pix),
                       "those lessons" if len(pix) > 1 else "that lesson",
                       "them" if len(pix) > 1 else "it"))
    body.append(K.FOOT)
    return K.richify(K.page("Big picture %s" % uid, "".join(body), 1,
                            EXTRA + K.token_css()))


# ------------------------------------------------------------ delivery guide
def delivery(uid, recs, cov):
    title = unit_title(uid, recs)
    body = [K.cover("%s %s" % (uid, title) if uid != "PY" else title,
                    "How to run this unit, lesson by lesson",
                    "Unit delivery guide",
                    "Teacher guide\nUnit %s\nrevise360.co.uk" % uid)]

    body.append("<h2>Contents</h2><div class=\"toc\"><p>"
                "<a href=\"#start\">Start here</a><br>"
                "<a href=\"#prep\">Preparation and what you need</a><br>"
                "<a href=\"#together\">Using the three resources together</a><br>"
                "<a href=\"#evidence\">Evidence, checking and common difficulties</a><br>"
                "<a href=\"#plans\">The lesson plans, in teaching order</a><br>"
                "<a href=\"#answers\">Teacher answers</a></p></div>")

    hours = 0
    for r in recs:
        hours += 3 if r["totals"]["activities"] >= 30 else 1
    body.append("<h2 id=\"start\">Start here</h2>")
    body.append("<p>%d lessons. A realistic estimate is <b>%d teaching hours</b>: "
                "most lessons are one hour, and a lesson with thirty or more "
                "activities takes two or three. The estimate counts transitions and "
                "assumes you teach from the front for the first fifteen minutes of "
                "each lesson.</p>" % (len(recs), hours))
    body.append("<p>Teach them in the order below. The order is the retrieval "
                "schedule as well as the teaching one: each starter asks about the "
                "lesson before it.</p>")
    body.append("<table><thead><tr><th>#</th><th>Lesson</th><th>Hours</th>"
                "<th>Plan</th></tr></thead><tbody>")
    for r in recs:
        h = 3 if r["totals"]["activities"] >= 30 else 1
        body.append("<tr><td class=\"num\">%s</td><td><b>%s</b> "
                    "<span class=\"tag grey\">%s</span></td><td class=\"num\">%d</td>"
                    "<td><code>Lesson_Plans/%s.pdf</code></td></tr>"
                    % (E(r["lesson"]), E(r["title"]), E(r["id"]), h,
                       E(P.plan_file(r["id"]))))
    body.append("</tbody></table>")

    body.append("<h2 id=\"prep\">Preparation and what you need</h2>")
    body.append("""<ol>
<li><b>Class logins, before the first lesson.</b> On the teacher dashboard
  (<code>teacher.html</code>), open <b>Class logins</b>, enter the class and the
  usernames one per line, and print the login cards. A pupil cannot sign in without
  one.</li>
<li><b>Devices.</b> A laptop, a tablet or a phone will do. A headset is optional
  everywhere. The browser needs to be current; the experiences use WebGL.</li>
<li><b>Print the worksheets</b> for each lesson. They are in this pack as .docx to
  edit and .pdf to print.</li>
<li><b>Open each experience once yourself</b> on the teaching machine, so the images
  are cached before thirty pupils ask for them at the same moment.</li>
</ol>""")
    body.append('<div class="band amber"><p><b>Where progress is kept.</b> In this '
                "build <code>APP_CONFIG.backendUrl</code> is empty, so logins, login "
                "cards and progress are stored on the device a pupil used, not on a "
                "server. The teacher dashboard says so itself. Keep a class on the "
                "same devices within a unit, and treat the paper worksheet as the "
                "record that travels with the pupil.</p></div>")
    body.append("<p>Pupils sign in at <code>topics.html</code> with the username and "
                "PIN on their card, choose the topic and then the lesson.</p>")

    body.append("<h2 id=\"together\">Using the three resources together</h2>")
    body.append("<p><b>Slides</b> for the front of the room; <b>the experience</b> for "
                "reading, deciding and being marked; <b>the worksheet</b> for writing "
                "and for the record. The rule that holds them together is write "
                "first, then answer at the badge.</p>"
                "<p>Do not teach the station walls and then send pupils to read the "
                "same walls. Teach the first two or three from the slides and let them "
                "read the rest; the walls are there so a pupil can re-read what you "
                "said, not so you can say it twice.</p>")

    body.append("<h2 id=\"evidence\">Evidence, checking and common difficulties</h2>")
    body.append("<p>Collect three things from every lesson: the starter (written), "
                "the key facts and station challenges on the worksheet (written), and "
                "the score screen breakdown (copied onto the worksheet by the pupil as "
                "soon as it appears). The score screen shows the marks per station, "
                "which is what tells you where to reteach; a single total does "
                "not.</p>")
    body.append("<p>The teacher dashboard shows progress by pupil and the class's "
                "weakest stations, averaged on first attempts. Use the weakest-station "
                "list to choose what to reteach rather than asking who found it "
                "hard.</p>")
    # The same note against every lesson of a unit is a fact about the unit, so it
    # is said once with the lessons named, not repeated five times.
    hard = collections.OrderedDict()
    for r in recs:
        for sh in cov.get(r["id"], {}).get("shape", []):
            hard.setdefault(sh, []).append(r["id"])
    if hard:
        body.append("<h3>Things to plan around in this unit</h3><ul>")
        for sh, who in hard.items():
            body.append("<li>%s &mdash; %s</li>"
                        % (E(sh), "every lesson" if len(who) == len(recs)
                           else ", ".join("<code>%s</code>" % E(x) for x in who)))
        body.append("</ul>")

    body.append("<h2 id=\"plans\">The lesson plans, in teaching order</h2>")
    body.append("<p>Each lesson has its own plan as a separate PDF in "
                "<code>Lesson_Plans/</code> of this pack, so you can print the one you "
                "are teaching. What follows is the summary of each; the plan carries "
                "the timings, the hinge question, the station-by-station delivery and "
                "the adaptations.</p>")
    for r in recs:
        t = r["totals"]
        body.append("<h3>%s. %s <span class=\"tag grey\">%s</span></h3>"
                    % (E(r["lesson"]), E(r["title"]), E(r["id"])))
        body.append("<p>%s</p>" % E(r.get("key_question") or r.get("description") or ""))
        body.append("<table><tbody>"
                    "<tr><th>Outcomes</th><td>%s</td></tr>"
                    "<tr><th>Stations and activities</th><td>%d stations, %d activities, "
                    "%d marks (%d guided, %d independent, %d challenge)</td></tr>"
                    "<tr><th>Resources</th><td>%s</td></tr>"
                    "<tr><th>Plan</th><td><code>Lesson_Plans/%s.pdf</code></td></tr>"
                    "</tbody></table>"
                    % ("; ".join(E(o["text"]) for o in r["outcomes"])
                       or E(r.get("outcomes_note") or "none stated"),
                       t["stations"], t["activities"], t["marks"], t["guided"],
                       t["independent"], t["challenge"],
                       ", ".join(E(os.path.basename(str(r["references"].get(k) or "").split("?")[0]))
                                 for k in ("deck", "worksheet") if r["references"].get(k))
                       or "none recorded",
                       E(P.plan_file(r["id"]))))

    body.append("<h2 id=\"answers\">Teacher answers</h2>")
    body.append("<p>Model answers and marking guidance are not in this guide and not "
                "on the lesson plans. A plan is printed and left on a desk; an answer "
                "sheet is not. Where verified answers exist for this unit they are in "
                "the <code>Teacher_Answers/</code> folder of this pack. Where they do "
                "not, the pack says so rather than shipping an empty file.</p>")
    body.append("<p>For the programming lessons there is no single model answer to "
                "print: a program is marked by running it against its test cases, and "
                "many different correct programs pass. The tests themselves are the "
                "marking guidance, and they are in the teacher answers.</p>")
    body.append(K.FOOT)
    return K.richify(K.page("Delivery guide %s" % uid, "".join(body), 1,
                            EXTRA + K.token_css()))


# -------------------------------------------------------- course big picture
def course_picture(units, cov):
    spec_units = [u for u in units if S.component_of(u)]
    other = [u for u in units if not S.component_of(u)]
    body = [K.cover("The whole course",
                    "%d units across OCR GCSE Computer Science (9-1) J277%s"
                    % (len(spec_units),
                       ", and the Python pathway beyond it" if other else ""),
                    "Course big picture", "Teacher guide\nAll units\nrevise360.co.uk")]
    c = S.CHECKED
    body.append("<h2>The qualification</h2>")
    body.append("<table class=\"keyval\"><tbody>%s</tbody></table>"
                % "".join("<tr><th>%s</th><td>%s</td></tr>" % (a, b) for a, b in [
                    ("Qualification", "%s, specification code %s, %s"
                     % (E(c["qualification"]), E(c["code"]), E(c["first_taught"]))),
                    ("Component 01", "%s &mdash; %d marks, %s"
                     % (E(c["components"][0]["name"]), c["components"][0]["marks"],
                        E(c["components"][0]["duration"]))),
                    ("Component 02", "%s &mdash; %d marks, %s"
                     % (E(c["components"][1]["name"]), c["components"][1]["marks"],
                        E(c["components"][1]["duration"]))),
                    ("Checked", "%s, at <a href=\"%s\">%s</a>"
                     % (E(c["checked_on"]), E(c["source"]), E(c["source"]))),
                ]))
    body.append('<div class="band amber"><p><b>How far this has been checked.</b> %s'
                "</p></div>" % E(S.UNCHECKED_NOTE))

    body.append("<h2>The %d units</h2>" % len(units))
    body.append("<table class=\"flow\"><thead><tr><th>Topic</th><th>Unit</th>"
                "<th>Paper</th><th>Lessons</th><th>Activities</th><th>Marks</th>"
                "<th>Outcomes</th><th>Coverage</th></tr></thead><tbody>")
    totals = collections.Counter()
    for uid, recs in units.items():
        rows = coverage_rows(uid, recs, cov)
        full = sum(1 for r in rows if r["level"] == "full")
        part = sum(1 for r in rows if r["level"] == "part")
        none = sum(1 for r in rows if r["level"] == "none")
        totals.update(dict(lessons=len(recs),
                           activities=sum(r["totals"]["activities"] for r in recs),
                           marks=sum(r["totals"]["marks"] for r in recs),
                           outcomes=len(rows), full=full, part=part, none=none))
        comp = S.component_of(uid)
        body.append("<tr><td class=\"num\">%s</td><td><b>%s</b></td><td>%s</td>"
                    "<td class=\"num\">%d</td><td class=\"num\">%d</td>"
                    "<td class=\"num\">%d</td><td class=\"num\">%d</td>"
                    "<td class=\"small\"><span class=\"full\">%d</span> / "
                    "<span class=\"part\">%d</span> / <span class=\"none\">%d</span></td>"
                    "</tr>"
                    % (E(uid), E(unit_title(uid, recs)),
                       ("Component " + comp) if comp else "beyond J277",
                       len(recs), sum(r["totals"]["activities"] for r in recs),
                       sum(r["totals"]["marks"] for r in recs), len(rows),
                       full, part, none))
    body.append("</tbody></table>")
    body.append("<p>%d lessons, %d activities, %d marks and %d stated outcomes in all. "
                "Coverage reads <span class=\"full\">full</span> / "
                "<span class=\"part\">partial</span> / "
                "<span class=\"none\">not covered</span>, and means taught, practised "
                "and assessed <b>within that unit</b>: %d / %d / %d.</p>"
                % (totals["lessons"], totals["activities"], totals["marks"],
                   totals["outcomes"], totals["full"], totals["part"], totals["none"]))

    body.append("<h2>Which units sit in which paper</h2>")
    for code, name in (("01", c["components"][0]["name"]), ("02", c["components"][1]["name"])):
        mine = [u for u in units if S.component_of(u) == code]
        body.append("<h3>Component %s: %s</h3><p>%s</p>"
                    % (E(code), E(name),
                       ", ".join("<b>%s</b> %s" % (E(u), E(S.title_of(u))) for u in mine)))
    body.append("<h3>Beyond the specification</h3><p>%s</p>" % E(S.PY_NOTE))

    body.append("<h2>What is not covered here</h2>")
    missing = [u for u in S.TOPICS if u not in units]
    if missing:
        body.append("<p>These topics of the specification have no unit in this course "
                    "yet: %s.</p>"
                    % ", ".join("<b>%s</b> %s" % (E(u), E(S.title_of(u))) for u in missing))
    else:
        body.append("<p>Every topic this course names has a unit. That is a statement "
                    "about this course's own topic list, not a claim that the "
                    "specification contains no other requirement: the specification "
                    "document was not available to check against when this was "
                    "built.</p>")
    body.append('<div class="band amber"><p><b>Coverage is not attainment.</b> A full '
                "row says the course teaches, practises and assesses an outcome "
                "somewhere. It says nothing about whether a particular pupil has "
                "learnt it. Only your own assessment does that.</p></div>")
    body.append(K.FOOT)
    return K.richify(K.page("Course big picture", "".join(body), 1,
                            EXTRA + K.token_css()))


def main(argv):
    only = [a for a in argv if not a.startswith("--")]
    units, cov = load()
    jobs = []
    for uid, recs in units.items():
        if only and uid not in only:
            continue
        slug = uid.replace(".", "_")
        jobs.append(("%s_Unit_Pedagogy" % slug, pedagogy(uid, recs, cov)))
        jobs.append(("%s_Unit_Big_Picture" % slug, big_picture(uid, recs, cov, units)))
        jobs.append(("%s_Unit_Delivery_Guide" % slug, delivery(uid, recs, cov)))
    if not only:
        jobs.append(("GCSE_Course_Big_Picture", course_picture(units, cov)))
    made = K.render_many(jobs, "_unitdocs", OUT)
    print("%d document(s) in build/unitdocs" % len(made))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
