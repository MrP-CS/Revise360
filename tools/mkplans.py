"""A Revise 360 lesson plan for every published lesson, from the lesson records.

One PDF per lesson, built from build/records/, so a plan's station names, activity
instructions, worked examples, misconceptions, worksheet questions and slide
references are the ones in the released files and cannot drift from them.

The frame is the same for every plan, because a teacher picking up an unfamiliar
unit should not have to learn a new layout each lesson. Everything inside it is
the lesson's own: its outcomes, its stations, its examples, its distractors, its
exam questions. Where a lesson does not hold something the frame asks for, the
plan says so in place rather than filling the space with a sentence that would be
true of any lesson - a generic paragraph under a real heading is worse than a
blank, because a teacher cannot tell it is empty.

    R360_PLEX=... PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \\
      python3 tools/mkplans.py                 # all of them
      python3 tools/mkplans.py pr-l01 sa-l01   # just these
      python3 tools/mkplans.py --check         # build nothing, report the gaps
"""
import os
import re
import sys
import json
import glob
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from paths import SITE_S                                       # noqa: E402
import pdfkit as K                                             # noqa: E402

ROOT = SITE_S.rstrip("/")
RECS = os.path.join(ROOT, "build", "records")
OUT = os.path.join(ROOT, "build", "lessonplans")
SITE_PLANS = os.path.join(ROOT, "lessonplans")
SITE_URL = "https://revise360.co.uk/"

E = K.E

UNIT_SPEC = {
    "1.1": "OCR J277 1.1 Systems architecture",
    "1.2": "OCR J277 1.2 Memory and storage",
    "1.3": "OCR J277 1.3 Computer networks, connections and protocols",
    "1.4": "OCR J277 1.4 Network security",
    "1.5": "OCR J277 1.5 Systems software",
    "1.6": "OCR J277 1.6 Ethical, legal, cultural and environmental impacts",
    "2.1": "OCR J277 2.1 Algorithms",
    "2.2": "OCR J277 2.2 Programming fundamentals",
    "2.3": "OCR J277 2.3 Producing robust programs",
    "2.4": "OCR J277 2.4 Boolean logic",
    "2.5": "OCR J277 2.5 Programming languages and IDEs",
    "PY": "Beyond OCR J277: a Python pathway supporting 2.1, 2.2 and 2.3",
}
PAPER = {"1": "Paper 1, Computer systems", "2": "Paper 2, Computational thinking, "
                                                "algorithms and programming"}


# A brief line that states something about the finished work rather than about
# how the window behaves.
CRITERION = re.compile(
    r"^(?:Display|Show|Print|Write|Keep|Store|Use|Do not|Don\u2019t|The program|Your "
    r"program|One line|Two lines|Three lines|Four lines|Exactly|Each line|Every line|"
    r"The output|The list|The file|The user types|A total|Round|Count|Ask|Start|"
    r"Replace|Change only|Nothing is typed|Both|All of|The word|The number)", re.I)


def plan_file(lid):
    return lid.upper().replace("-", "_") + "_LessonPlan"


def missing(what):
    """A space the lesson does not fill, said plainly rather than papered over."""
    return ('<p class="gapnote">Not in the lesson record: %s. Add it to the lesson '
            'source and rebuild this plan rather than writing it on the printout.</p>'
            % E(what))


# --------------------------------------------------------------- the timings
def timings(rec):
    """A 60-minute lesson whose parts add up, shaped by what the lesson holds.

    The default is the house 60-minute lesson. The online block is the one that
    moves: a lesson with six stations and 56 activities needs more of the hour
    than one with twelve multiple-choice questions, and a test lesson is not this
    shape at all. Transitions are counted, not assumed away.
    """
    t = rec["totals"]
    if rec["kind"] == "worksheet":          # a test and its reflection
        return [("0-5", "Settle and set up", "Hand out the paper. Remind the class "
                 "that this is from memory and in silence."),
                ("5-45", "The test", "Silent, timed. Collect every paper."),
                ("45-55", "Mark or self-mark", "Against the answer sheet, if you are "
                 "marking in the lesson; otherwise collect and mark after."),
                ("55-60", "Set the reflection", "Issue the reflection worksheet and "
                 "explain that it is completed once the test is returned.")]
    if rec["kind"] == "challenge":
        return [("0-5", "Set the challenge", "Say what finishing it looks like."),
                ("5-50", "The challenge", "Pupils work on it; you circulate."),
                ("50-60", "Share and review", "Two or three pupils show what they did "
                 "and what they changed on the way.")]
    big = t["activities"] >= 30             # a coding lesson, or a long one
    if big:
        return [("0-5", "Retrieve", "Starter on the board or the worksheet, from the "
                 "last lesson and this lesson's prerequisites."),
                ("5-8", "Review the starter", "Take answers; correct the one most got "
                 "wrong before moving on."),
                ("8-16", "Explain and model", "The new idea, then the worked example, "
                 "typed live rather than shown finished."),
                ("16-19", "Set up and settle", "Sign-in, launch, and what to record on "
                 "paper before anyone types."),
                ("19-48", "Online: work the stations in order", "Pupils work; you "
                 "circulate and read the editor over shoulders."),
                ("48-53", "Check understanding", "The hinge question, hands down, "
                 "then the reteach if the class splits."),
                ("53-58", "Apply or extend", "The challenge activity, or the exam "
                 "practice on the worksheet."),
                ("58-60", "Exit and set up the next lesson", "The exit question and "
                 "what to finish before next time.")]
    return [("0-5", "Retrieve", "Starter on the board or the worksheet, from the last "
             "lesson and this lesson's prerequisites."),
            ("5-8", "Review the starter", "Take answers; correct the one most got wrong."),
            ("8-18", "Explain and model", "The new idea in two or three steps, with the "
             "example worked in front of the class."),
            ("18-21", "Set up and settle", "Sign-in, launch, and what to write before "
             "anyone taps an answer."),
            ("21-43", "Online: work the stations in order", "Pupils read each wall, "
             "write the key fact and the challenge, then answer at the badge."),
            ("43-48", "Check understanding", "The hinge question, hands down."),
            ("48-56", "Apply", "Exam practice on the worksheet, in silence."),
            ("56-60", "Exit and set up the next lesson", "The exit question and the "
             "retrieval link to next lesson.")]


def adds_up(rows):
    """Do the timings run 0 to 60 with no gap and no overlap?"""
    at = 0
    for span, _, _ in rows:
        a, b = (int(x) for x in span.split("-"))
        if a != at or b <= a:
            return False
        at = b
    return at == 60


# ------------------------------------------------------------------- sections
def head(rec, nxt):
    spec = UNIT_SPEC.get(rec["unit"], rec["unit"])
    paper = PAPER.get(str(rec["unit"])[0], "")
    link = SITE_URL + (rec["references"].get("online") or "")
    rows = [
        ("Unit", "%s%s" % (spec, " &mdash; " + paper if paper else "")),
        ("Lesson", "%s (lesson %s of the unit)" % (E(rec["title"]), rec["lesson"])),
        ("Lesson ID", "<code>%s</code>" % E(rec["id"])),
        ("Experience ID", "<code>%s</code>" % E(rec["id"]) if rec["kind"] == "experience"
         else "none &mdash; this lesson is on paper"),
        ("Plan ID", "<code>%s</code>" % E(rec["plan_id"])),
        ("Content version", "<code>%s</code>" % E(rec["version"])),
        ("Website", '<a href="%s">%s</a>' % (E(link), E(link))
         if rec["references"].get("online")
         else "no online route &mdash; this lesson is on paper"),
    ]
    return ("<table class=\"keyval\"><tbody>%s</tbody></table>"
            % "".join("<tr><th>%s</th><td>%s</td></tr>" % (k, v) for k, v in rows))


def outcomes_section(rec):
    out = ["<h2>Big question, outcomes and success criteria</h2>"]
    if rec.get("key_question"):
        out.append('<div class="band"><p><b>Big question</b> &mdash; %s</p></div>'
                   % E(rec["key_question"]))
    elif rec.get("outcomes_note"):
        out.append('<div class="band grey"><p>%s</p></div>' % E(rec["outcomes_note"]))
    else:
        out.append(missing("a key question for this lesson"))

    pre = rec["prerequisites"]
    if pre.get("immediately_before"):
        out.append("<h3>Prerequisites</h3><p>The lesson before this one is "
                   "<code>%s</code>. Pupils should already have finished it%s</p>"
                   % (E(pre["immediately_before"]),
                      ", and everything earlier in the unit: this lesson assesses "
                      "all of it." if rec["kind"] == "worksheet"
                      else ": the starter below retrieves from it."))
        if len(pre["lessons"]) > 1:
            out.append("<p>Earlier in the unit: %s.</p>"
                       % ", ".join("<code>%s</code>" % E(x) for x in pre["lessons"][:-1]))
    else:
        out.append("<h3>Prerequisites</h3><p>None within this unit: it is the first "
                   "lesson. Treat the starter as a baseline check rather than "
                   "retrieval of something you have taught.</p>")

    if rec["outcomes"]:
        out.append("<h3>Assessable outcomes</h3><ol>")
        for o in rec["outcomes"]:
            out.append("<li><b>%s</b> &mdash; %s</li>" % (E(o["id"]), E(o["text"])))
        out.append("</ol>")
    elif rec.get("outcomes_note"):
        out.append("<h3>Assessable outcomes</h3><p>%s</p>" % E(rec["outcomes_note"]))
    else:
        out.append("<h3>Assessable outcomes</h3>" + missing("learning outcomes"))

    # A success criterion says what the finished work must do. Several brief lines
    # are about the window instead - "Nothing is marked on this one", "Read every
    # line before you choose" - and listing those as criteria tells a pupil nothing
    # about whether they have met the outcome.
    crit, seen = [], set()
    for s in rec["stations"]:
        for a in s["activities"]:
            if a["role"] == "guided":
                continue
            for b in a.get("brief") or []:
                if not CRITERION.match(b) or b in seen:
                    continue
                seen.add(b)
                crit.append((a["id"], b))
    if crit:
        out.append("<h3>Success criteria the pupil can check against</h3>"
                   "<p>Taken from the briefs the independent activities themselves "
                   "show, so these are the words the pupil sees. Their work has met "
                   "the outcome when it does these things.</p><ul>")
        for aid, c in crit[:8]:
            out.append("<li>%s <span class=\"tag grey\">%s</span></li>" % (E(c), E(aid)))
        out.append("</ul>")
    return "".join(out)


def prep_section(rec):
    r = rec["references"]
    out = ["<h2>Vocabulary, resources and preparation</h2>"]
    if rec["vocabulary"]:
        out.append("<p><b>Key vocabulary</b> &mdash; %s</p>"
                   % ", ".join("<b>%s</b>" % E(v) for v in rec["vocabulary"]))
    elif rec["kind"] != "experience":
        out.append("<p>No new vocabulary: this lesson introduces nothing new. The "
                   "vocabulary it draws on is listed on the earlier lessons' plans and "
                   "in the unit Big Picture.</p>")
    else:
        out.append(missing("key vocabulary"))
    rows = []
    for label, key in (("Slides", "deck"), ("Worksheet", "worksheet"),
                       ("Online experience", "online"), ("Code bank", "code_bank")):
        if r.get(key):
            # the deck and worksheet paths carry a cache-busting ?v=, which is not
            # part of the file name; the online route's ?id= is its identity
            val = str(r[key]) if key == "online" else str(r[key]).split("?")[0]
            rows.append((label, "<code>%s</code>" % E(val)))
    out.append("<h3>Resources</h3><table><tbody>%s</tbody></table>"
               % "".join("<tr><th>%s</th><td>%s</td></tr>" % (a, b) for a, b in rows))
    if rec["kind"] != "experience":
        out.append("""<h3>Before the lesson</h3>
<ol>
<li>Print the paper, one per pupil, and the reflection sheet to hand out afterwards.</li>
<li>Have the answer sheet to hand. It is teacher-only and is in the unit teacher guide
  pack, not in this plan.</li>
<li>Decide whether you are marking in the lesson or collecting the papers in.</li>
</ol>
<p>Nothing online is needed. Pupils do not sign in for this lesson, and there is no
experience to launch.</p>""")
        return "".join(out)
    out.append(("""<h3>Before the lesson</h3>
<ol>
<li>Sign in on the <b>teacher dashboard</b> (<code>teacher.html</code>) and open
  <b>Class logins</b>. Enter the class or group and the usernames, one per line, then
  print the login cards. A pupil cannot sign in without one, so do this before the
  lesson rather than in it.</li>
<li>Print the worksheet, one per pupil.</li>
<li>Open the slides and the experience once yourself, on the machine you will be
  teaching from, so the %s already cached.</li>
<li>Check headsets or devices are charged and on the school network.</li>
</ol>
<h3>How pupils get in</h3>
<ol>
<li>Go to <code>topics.html</code> on revise360.co.uk.</li>
<li>Sign in with the <b>username and PIN from the login card</b>. The class is
  already set against the card.</li>
<li>Choose the topic, then this lesson's card.</li>
</ol>""") % ("Python runtime and the 360 image are"
             if rec["unit"] == "PY" else "360 image is"))
    out.append('<div class="band amber"><p><b>Worth knowing before you promise '
               'anything.</b> In this build <code>APP_CONFIG.backendUrl</code> is '
               'empty, so logins, login cards and progress are stored on the device '
               'the pupil used. The teacher dashboard says so too. A pupil who moves '
               'to a different machine starts again, so keep a class on the same '
               'devices within a unit, and treat the paper worksheet as the record '
               'that travels.</p></div>')
    return "".join(out)


def sequence_section(rec):
    rows = timings(rec)
    out = ["<h2>Teaching sequence</h2>"]
    if not adds_up(rows):
        out.append('<div class="band amber"><p>The timings below do not add to 60 '
                   'minutes. This is a fault in the generator, not advice.</p></div>')
    out.append("<p>Sixty minutes including transitions. %s</p>"
               % ("The test itself is fixed; if your lesson is shorter, mark it "
                  "afterwards rather than cutting the test."
                  if rec["kind"] == "worksheet"
                  else "The online block is the one to move if your lesson is "
                       "shorter: see the adaptation at the end."))
    out.append("<table class=\"flow\"><thead><tr><th>Min</th><th>Phase</th>"
               "<th>Teacher</th><th>Pupils</th><th>Evidence to check</th>"
               "</tr></thead><tbody>")
    ev = evidence(rec)
    for i, (span, phase, teacher) in enumerate(rows):
        out.append("<tr><td class=\"num\">%s</td><td><b>%s</b></td><td>%s</td>"
                   "<td>%s</td><td>%s</td></tr>"
                   % (E(span), E(phase), E(teacher), E(ev[i][0]), E(ev[i][1])))
    out.append("</tbody></table>")
    return "".join(out)


def evidence(rec):
    """What pupils do and what the teacher looks at, phase by phase.

    Written against this lesson's real parts: its starter, its station count, its
    worksheet sections and its own exam questions.
    """
    n = rec["totals"]["stations"]
    first = rec["stations"][0]["name"] if rec["stations"] else "the first station"
    ws = os.path.basename(str(rec["references"].get("worksheet") or "")).split("?")[0]
    ex = rec["assessment"]
    letters = "abcdefghijklmnop"
    # Where the worksheet actually puts them. The later sheets head this "Exam
    # practice" and the earlier ones "Exit questions"; the record knows which,
    # because it read it off the sheet.
    if ex:
        where = (ex[0].get("appears_in") or ["the worksheet"])[0]
        heading = where.split(" a)")[0]
        exref = ("%s a) to %s)" % (heading, letters[min(len(ex), len(letters)) - 1])
                 if len(ex) > 1 else "%s a)" % heading)
    else:
        exref = "no exam practice on this worksheet"
    if rec["kind"] == "worksheet":
        return [("Put bags away and take out a pen.", "Everyone has a paper and nothing else."),
                ("Answer from memory.", "Silence, and every paper collected."),
                ("Mark against the answer sheet.", "A mark per question, not just a total."),
                ("Write their weakest topic on the reflection sheet.",
                 "The reflection sheet names a topic, not a feeling.")]
    if rec["kind"] == "challenge":
        return [("Listen, then start.", "Everyone knows what finished looks like."),
                ("Work on the challenge.", "Something on screen or on paper by halfway."),
                ("Two or three explain what they changed.", "A decision described, not just a result.")]
    big = rec["totals"]["activities"] >= 30
    if big:
        return [("Answer the starter on the worksheet.", "The starter box on %s is filled in." % (ws or "the worksheet")),
                ("Correct their own starter.", "A correction written, not just a tick."),
                ("Watch the example being built, and say what each line does.",
                 "They can name the line that does the job, not just copy it."),
                ("Sign in, open the lesson, read the task before typing.",
                 "Everyone is at station 1 activity 1, not typing yet."),
                ("Work the stations in order, running and checking as they go.",
                 "The station badges fill in; the editor shows their own program, not the starter."),
                ("Answer the hinge question, hands down.", "The split across the options, before any reteach."),
                ("The Challenge activity, or the exam practice.", exref),
                ("Write the exit answer.", "One sentence that answers the big question.")]
    return [("Answer the starter on the worksheet.", "The starter box on %s is filled in." % (ws or "the worksheet")),
            ("Correct their own starter.", "A correction written, not just a tick."),
            ("Listen and answer questions about the example.", "They can say why, not only what."),
            ("Sign in, open the lesson, find %s." % first, "Everyone is in and on station 1."),
            ("Read each wall, write the key fact and the challenge, then answer at the badge.",
             "The worksheet has writing on it for each of the %d stations before the badge is tapped." % n),
            ("Answer the hinge question, hands down.", "The split across the options."),
            ("Exam practice, in silence.", exref),
            ("Write the exit answer.", "One sentence that answers the big question.")]


def explain_section(rec):
    out = ["<h2>The explanation and the worked example</h2>"]
    if not rec["stations"]:
        out.append('<div class="band grey"><p>This lesson teaches nothing new and has '
                   'no walls to read: it is %s. The explanations it rests on are in '
                   'the plans for the lessons before it.</p></div>'
                   % ("the unit test and its reflection sheet"
                      if rec["kind"] == "worksheet" else "a bonus challenge"))
        return "".join(out)
    taught = [s for s in rec["stations"] if s.get("explains")]
    if taught:
        out.append("<p>This is what the walls of the experience say, station by "
                   "station. Teach the first two or three from the front before "
                   "anyone puts a headset on; the rest the pupils read for "
                   "themselves.</p>")
        for s in taught:
            out.append("<h3>%s. %s</h3><ul>%s</ul>"
                       % (E(s["n"]), E(s["name"]),
                          "".join("<li>%s</li>" % E(b) for b in s["explains"])))
            if s.get("challenge"):
                out.append('<p class="shows"><b>Challenge on this wall:</b> %s</p>'
                           % E(s["challenge"]))
    else:
        out.append('<div class="band grey"><p>The wall panels of this experience are '
                   'painted into its 360 image and are not held as text, so this plan '
                   'cannot quote them. Open the experience yourself before teaching '
                   'it: the station names are below, and the slides carry the same '
                   'teaching.</p><p>%s</p></div>'
                   % ", ".join("<b>%s.</b> %s" % (E(s["n"]), E(s["name"]))
                               for s in rec["stations"]))
    eg = next((a["worked_example"] for s in rec["stations"] for a in s["activities"]
               if a.get("worked_example")), None)
    if eg:
        out.append("<h3>The example to model</h3><p>%s</p>" % E(eg.get("says") or ""))
        if eg.get("code"):
            out.append("<pre class=\"code\">%s</pre>" % E("\n".join(eg["code"])))
        if eg.get("shows"):
            out.append('<p class="shows">It displays <b>%s</b></p>'
                       % E(" / ".join(eg["shows"])))
        out.append("<p><b>Decisions to model out loud, not just the finished answer:</b> "
                   "say why you chose that name, why that line comes before the next "
                   "one, and what you would try first if it did not work. The example "
                   "deliberately uses different data from the task, so a pupil cannot "
                   "copy it and be finished.</p>")
    return "".join(out)


def check_section(rec):
    out = ["<h2>Retrieval and the check for understanding</h2>"]
    if rec["kind"] == "worksheet":
        out.append('<div class="band grey"><p>This lesson is the unit test and its '
                   'reflection sheet. It has no starter and no hinge question by '
                   'design: the whole hour is the check. The retrieval it rests on is '
                   'everything taught in the unit, and the reflection sheet is where a '
                   'pupil records which topics to go back to.</p></div>')
        if rec["assessment"]:
            out.append("<h3>What the test covers</h3><ol>%s</ol>"
                       % "".join("<li>%s</li>" % E(x["asks"]) for x in rec["assessment"]))
        out.append("<p>Mark against the unit answer sheet, which is teacher-only and "
                   "not printed here. Give a mark per question rather than a total: the "
                   "reflection sheet needs the breakdown to be worth filling in.</p>")
        return "".join(out)
    if rec["kind"] == "challenge":
        out.append('<div class="band grey"><p>This is a bonus challenge, not a taught '
                   'lesson. It has no starter, no new vocabulary and no hinge question '
                   'because it teaches nothing new: it stretches what the unit has '
                   'already taught, and it is optional. Use it with a class that has '
                   'finished, or as something to come back to.</p></div>')
        return "".join(out)
    if rec.get("retrieve"):
        # Where a pupil writes it. A starter authored after the worksheet was
        # printed is not on the sheet, and saying "or the worksheet" would send
        # a teacher looking for a box that is not there.
        if rec["retrieve"].get("lines"):
            where = "Answer space: %s lines on the worksheet." % rec["retrieve"]["lines"]
        elif "starter" in (rec.get("authored_from_alignment") or []):
            where = ("On the board. This starter is not printed on the pupils' worksheet: "
                     "this lesson's sheet predates the current build and carries none.")
        else:
            where = "On the board or the worksheet."
        out.append('<div class="band teal"><p><b>Starter</b> &mdash; %s</p>'
                   '<p class="shows">%s</p></div>'
                   % (E(rec["retrieve"]["prompt"]), E(where)))
        out.append("<p>The answer is in the teacher answers for this unit, not on "
                   "this plan: a plan left on a desk should not give it away.</p>")
    else:
        out.append(missing("a starter to retrieve prior knowledge"))

    # The hinge is chosen in record.py, not here, so this plan and the lesson's
    # PowerPoint always stop on the same question.
    c = rec.get("hinge")
    if c:
        out.append("<h3>Hinge question</h3><p>Use this one, hands down, before anyone "
                   "moves on to independent work. It is a real activity from the "
                   "experience (<code>%s</code>), so the wording a pupil sees matches "
                   "the wording you say.</p>" % E(c["id"]))
        # A select-all has several right answers, and printing only the first of
        # them under "Correct:" is how this plan used to contradict its own
        # teaching response.
        answer = (", ".join(c["right"]) if isinstance(c["right"], list)
                  else c["right"])
        # A Predict question asks what a program displays, and this printed the
        # sentence without the program, which is not a question anybody can
        # answer off a plan.
        listing = ("<pre class=\"code\">%s</pre>" % E("\n".join(c["code"]))) if c.get("code") else ""
        out.append('<div class="band"><p><b>%s</b></p>%s<p><b>Correct:</b> %s</p></div>'
                   % (E(c["asks"]), listing, E(answer)))
        if c.get("only_multi"):
            out.append('<p class="shows">This lesson has no single-answer question to '
                       'stop on, so this one asks for several. A show of hands works '
                       'less well: ask for each option in turn and count separately.</p>')
        if c.get("distractors"):
            # The wrong options, and nothing invented about each. A sentence per
            # option would be the same sentence four times over, which tells a
            # teacher less than the options do.
            out.append("<h4>What a pupil might choose instead</h4><ul>%s</ul>"
                       % "".join("<li>%s</li>" % E(d) for d in c["distractors"]))
            out.append("<p>Count the hands on each. If more than a few of the class "
                       "are on one wrong option, that option is the misconception to "
                       "teach against before anyone goes on: go back to the station "
                       "this question sits on and work through its example again, "
                       "aloud, before the independent work.</p>")
        if c.get("response"):
            out.append("<p><b>The course's own response to a wrong answer here:</b> "
                       "%s</p>" % E(c["response"]))
        if c.get("gap"):
            out.append('<p class="shows"><b>One response, not four.</b> %s, so decide '
                       'your own reteach for each option before the lesson - the list '
                       'above is the start of it.</p>' % E(c["gap"]))
    else:
        out.append("<h3>Hinge question</h3>" + missing("a multiple-choice or predict "
                                                      "activity to use as a hinge"))

    mis = [m for s in rec["stations"] for m in s["misconceptions"] if m.get("says")]
    if mis:
        out.append("<h3>Misconceptions this lesson addresses</h3><ul>")
        for m in mis[:8]:
            out.append("<li>%s <span class=\"tag grey\">%s</span></li>"
                       % (E(m["says"]), E(m["from"])))
        out.append("</ul>")
    return "".join(out)


def practice_section(rec):
    t = rec["totals"]
    out = ["<h2>Guided to independent practice</h2>"]
    if not t["activities"]:
        out.append('<div class="band grey"><p>There is no guided practice in this '
                   'lesson, by design: %s</p></div>'
                   % ("every question is answered independently, from memory and in "
                      "silence. The guided and independent practice it assesses "
                      "happened in the lessons before it."
                      if rec["kind"] == "worksheet"
                      else "it is a challenge, and the point of it is that the pupil "
                           "works it out."))
        out.append("""<h3>Accessibility</h3>
<ul>
<li>Read the paper aloud for any pupil whose access arrangements allow it.</li>
<li>Extra time applies here as it would in any assessment.</li>
<li>A pupil who cannot write at length may answer the shorter questions first; the
  marks are per question, so nothing is lost by the order.</li>
</ul>""")
        return "".join(out)
    # Three kinds of activity, by what the pupil has to supply. A teacher
    # planning the lesson needs to know which, because a full score on twelve
    # multiple-choice questions and a full score on three worked calculations
    # are not the same evidence.
    rows = [("Recognise", t.get("recognise", t["guided"]),
             "The answer is on the screen and the pupil picks it: multiple "
             "choice, choosing several, matching a pair."),
            ("Construct", t.get("construct", 0),
             "Nothing is offered. The pupil classifies, orders, fills in a "
             "table or works a number out, and types or places the answer."),
            ("Produce", t.get("produce", 0),
             "The pupil writes it from the brief and nothing else."),
            ("Challenge", t["challenge"],
             "The hardest activity on each station. It is not optional and it "
             "is not extra: it is the last step of the station.")]
    out.append("<table><thead><tr><th>Stage</th><th>Activities</th><th>What it is</th>"
               "</tr></thead><tbody>"
               + "".join('<tr><td>%s</td><td class="num">%d</td><td>%s</td></tr>'
                         % (name, n, why) for name, n, why in rows if n)
               + "</tbody></table>")
    if not t["independent"]:
        out.append('<div class="band amber"><p>Every activity in this lesson is '
                   'recognition: a pupil chooses between options and never produces '
                   'anything of their own. Plan the independent work yourself - the '
                   'exam practice on the worksheet is the obvious place - and do not '
                   'read a full score here as evidence that a pupil can do it '
                   'unaided.</p></div>')
    out.append("""<h3>Scaffolds already in the product, and how they fade</h3>
<ul>
<li><b>Hint</b> is a ladder, not a door: the first rung names the idea, the next shows
  the shape of the code, the next how it starts, the last animates the technique on
  different data. A pupil asks for each rung. None of them is the answer.</li>
<li><b>Run</b> is free and unmarked; <b>Check my answer</b> marks. A pupil may run as
  often as they like, which is what makes trial and error safe.</li>
<li><b>I need help</b> says to ask you, and says plainly that the question still has to
  be completed. It does not notify anyone and it does not unlock anything.</li>
<li>The worked example appears on every early activity and on none of the late ones.
  That fade is deliberate; it is not a missing example.</li>
</ul>
<h3>Accessibility</h3>
<ul>
<li><b>Read aloud</b> on every task window reads the task and its brief, with the
  prescribed values read as values rather than as punctuation.</li>
<li>Text is 16px or larger throughout, and a question window scrolls rather than
  shrinking its type.</li>
<li>Prescribed data is boxed and in a monospace face as well as coloured, so it still
  reads as code in black and white, in a high-contrast mode, and to a pupil who does
  not separate green from amber.</li>
<li><b>Lower literacy and EAL:</b> pre-teach the vocabulary above; let the pupil say
  the key fact before writing it; accept the key fact in two or three words.</li>
<li><b>SEND:</b> the sequence is compulsory but the pace is not. A pupil may finish a
  station next lesson; the progress saves after every answer and reopens at their
  earliest unfinished question.</li>
<li>A headset is never required. Every experience works on a laptop or a tablet with
  a mouse or a finger.</li>
</ul>""")
    return "".join(out)


def online_section(rec):
    out = ["<h2>Delivering the online experience</h2>"]
    if rec["kind"] != "experience":
        out.append('<div class="band grey"><p>This lesson has no online experience: it '
                   'is %s. Everything it needs is on paper.</p></div>'
                   % ("a test and its reflection sheet" if rec["kind"] == "worksheet"
                      else "a bonus challenge"))
        return "".join(out)
    out.append("""<h3>Before anyone enters</h3>
<ul>
<li>Worksheet out, pen in hand. The rule is write first, then answer at the badge:
  the first answer is the one that counts.</li>
<li>Say where the stations are. They are numbered around the room: 1 and 2 to the
  right, 3 and 4 behind, 5 and 6 to the left, and the final challenge on the floor.</li>
<li>Say that a badge marked <b>Not yet</b> is not a fault. It opens when the station
  they are on is finished.</li>
</ul>""")
    out.append("<h3>The stations, and what to record at each</h3><table><thead><tr>"
               "<th>#</th><th>Station</th><th>Activities</th><th>Record on paper</th>"
               "</tr></thead><tbody>")
    for s in rec["stations"]:
        rec_note = s.get("key_fact_prompt") or s.get("challenge") or \
            "the answer to the station's challenge"
        out.append("<tr><td class=\"num\">%s</td><td><b>%s</b></td><td class=\"num\">%d</td>"
                   "<td>%s</td></tr>"
                   % (E(s["n"]), E(s["name"]), len(s["activities"]), E(rec_note)))
    out.append("</tbody></table>")
    out.append("<h3>Where to pause</h3><p>Stop the class after station %s and take "
               "answers to its challenge out loud. That is the point where a pupil who "
               "has misread the technique can still be put right cheaply.</p>"
               % (rec["stations"][1]["n"] if len(rec["stations"]) > 1 else "1"))
    out.append("<h3>Afterwards</h3><p>Headsets off and down. Ask three pupils for the "
               "key fact from a station of your choosing, in their own words and not "
               "read off the sheet. Then the exit question.</p>")
    if rec["unit"] == "PY":
        out.append("""<div class="band amber"><p><b>Python: the order is not
negotiable.</b> Each activity teaches what the next one needs, so a pupil works
through them in order and completes every one. A shorter lesson, homework or a slow
worker does not authorise skipping: the pupil stops where they are and resumes at
their earliest unfinished question next time, because progress saves after every
answer.</p><p>A paper activity, a help request or a tick on this plan does not mark
an online question complete, and there is no teacher bypass. If a pupil is stuck
after the hint, that is the moment to teach them, not to move them on.</p></div>""")
    return "".join(out)


def assess_section(rec):
    out = ["<h2>Assessment, evidence and unfinished work</h2>"]
    if rec["kind"] == "worksheet":
        out.append("<p>This lesson <b>is</b> the assessment. Every question is marked "
                   "against the unit answer sheet, which is teacher-only and in the "
                   "unit teacher guide pack, not on this plan.</p>")
    if rec["assessment"]:
        out.append("<table><thead><tr><th>ID</th><th>Question</th><th>Marks</th>"
                   "<th>Where</th></tr></thead><tbody>")
        for x in rec["assessment"]:
            out.append("<tr><td><code>%s</code></td><td>%s</td><td class=\"num\">%s</td>"
                       "<td>%s</td></tr>"
                       % (E(x["id"]), E(x["asks"]), x["marks"] if x["marks"] else "&ndash;",
                          E("; ".join(x["appears_in"]))))
        out.append("</tbody></table>")
    elif rec["kind"] == "challenge":
        out.append("<p>Nothing on this lesson is marked. It is a challenge: the "
                   "evidence is what the pupil produced and what they can say about "
                   "the decisions they made.</p>")
    else:
        out.append(missing("exam practice for this lesson"))
    out.append("<h3>Expected answers</h3><p>Model answers and marking guidance are "
               "teacher-only and are not printed on this plan. They are in the unit's "
               "teacher guide pack, and the per-activity marking for this lesson is in "
               "<code>answers/records/%s.json</code>, which is not published with the "
               "website.</p>" % E(rec["id"]))
    bank = rec["references"].get("code_bank")
    if bank:
        out.append("<p>Every programming activity in this lesson is marked by running "
                   "the pupil's program against its test cases, so the mark is the "
                   "program's behaviour and not its appearance. The model solutions "
                   "are in <code>answers/codebank/%s.json</code>.</p>" % E(rec["id"]))
    out.append("<h3>Common errors</h3>")
    mis = [m for s in rec["stations"] for m in s["misconceptions"]]
    wrongs = [m for m in mis if m.get("wrong_answers_offered")]
    if wrongs:
        out.append("<p>The wrong options the activities offer are the errors this "
                   "lesson expects. The commonest to watch for:</p><ul>")
        for m in wrongs[:5]:
            out.append("<li><b>%s</b> &mdash; %s</li>"
                       % (E((m["on"] or "")[:70]),
                          E("; ".join(str(x) for x in m["wrong_answers_offered"][:2]))))
        out.append("</ul>")
    else:
        out.append("<p>None are recorded for this lesson beyond the misconceptions "
                   "listed above.</p>")
    if rec["kind"] == "worksheet":
        out.append("<h3>An unfinished paper</h3><p>Mark what is there and record the "
                   "questions left blank as blank, not as wrong: a pupil who ran out "
                   "of time and a pupil who could not answer need different "
                   "responses, and the reflection sheet cannot tell them apart if the "
                   "marking does not.</p>")
    else:
        out.append("<h3>Unfinished work</h3><p>Record where each pupil stopped, not a "
                   "tick. They resume at their earliest unfinished question, and a "
                   "station left half-done is the thing to open next lesson. Do not "
                   "mark the lesson complete for a pupil who did not finish it: the "
                   "score screen already shows what was and was not done, and that is "
                   "the honest record.</p>")
    return "".join(out)


def exit_section(rec, nxt):
    out = ["<h2>Exit, next lesson and homework</h2>"]
    conf = rec.get("review", {}).get("confidence") or []
    if conf:
        out.append("<h3>Exit check</h3><p>One of these, written, not a show of hands:"
                   "</p><ul>%s</ul>"
                   % "".join("<li>%s</li>" % E(c) for c in conf))
        out.append("<p>The confidence columns on the worksheet are a supplement to "
                   "this, not a substitute: a pupil who rates themselves confident and "
                   "cannot answer the exit question has told you nothing.</p>")
    elif rec["kind"] == "worksheet":
        out.append("<h3>Exit check</h3><p>The test is the check. The reflection sheet "
                   "is the follow-up: a pupil writes their mark for each question, "
                   "colours the red/amber/green column and names what they will do "
                   "about each topic they lost marks on.</p>")
    elif rec["kind"] == "challenge":
        out.append("<h3>Exit check</h3><p>Ask the pupil to say what they changed and "
                   "why. A challenge is evidenced by the decision, not the result.</p>")
    else:
        out.append("<h3>Exit check</h3>" + missing("a confidence or exit checklist"))
    if nxt:
        out.append("<h3>Retrieval link to next lesson</h3><p>Next is <code>%s</code>, "
                   "%s. Use this lesson's big question as next lesson's starter, so "
                   "the first thing they do is retrieve it.</p>"
                   % (E(nxt["id"]), E(nxt["title"])))
    else:
        out.append("<h3>Retrieval link to next lesson</h3><p>This is the last lesson "
                   "of the unit. The next retrieval of it is the unit test.</p>")
    if rec["kind"] == "worksheet":
        out.append("<h3>After this lesson</h3><p>Return the marked papers and complete "
                   "the reflection sheet with the class. Set the two or three "
                   "experiences a pupil's weakest topics point to: the reflection "
                   "sheet names them, and review mode on those lessons reopens the "
                   "questions they got wrong.</p>")
    elif rec["kind"] == "challenge":
        out.append("<h3>After this lesson</h3><p>Nothing is set from a challenge. It "
                   "is optional, and a pupil who did not reach it has not fallen "
                   "behind.</p>")
    else:
        out.append("<h3>Homework</h3><p>Finish any station left open, on the website, "
                   "from the question they stopped at. If the class has no devices at "
                   "home, set the exam practice on the worksheet instead and mark it "
                   "next lesson.</p>")
    return "".join(out)


def adapt_section(rec):
    rows = timings(rec)
    out = ["<h2>Shorter lessons, longer lessons and no internet</h2>"]
    if rec["kind"] == "worksheet":
        out.append("<h3>A shorter lesson</h3><p>Do not cut the test. Run it to its "
                   "full length and mark it afterwards; set the reflection sheet for "
                   "the start of the next lesson.</p>"
                   "<h3>If the internet or the devices are unavailable</h3><p>It makes "
                   "no difference to this lesson. Everything it needs is on paper.</p>"
                   "<p>The reflection sheet points pupils back at the experiences for "
                   "the topics they lost marks on; set those when the devices are "
                   "back.</p>")
        return "".join(out)
    if rec["kind"] == "challenge":
        out.append("<h3>A shorter lesson</h3><p>This is optional work. Use it when "
                   "there is time, and stop when the lesson stops; nothing is lost by "
                   "leaving it unfinished.</p>"
                   "<h3>If the internet or the devices are unavailable</h3><p>Set the "
                   "challenge on paper from the slides, or leave it for another "
                   "lesson. There is no offline version of the experience and this "
                   "plan does not contain one.</p>")
        return "".join(out)
    if rec["totals"]["activities"] >= 30:
        out.append("<h3>If this lesson takes more than an hour</h3><p>It will. There "
                   "are %d activities across %d stations, and a beginner does not "
                   "finish %d of them in twenty-nine minutes. Plan it as two or three "
                   "sessions of an hour: stations 1 and 2 in the first, 3 and 4 in the "
                   "second, 5, 6 and the final challenge in the third. Each session "
                   "keeps the same starter-explain-model opening; the online block "
                   "resumes where the class got to. Honest total: two to three "
                   "hours.</p>"
                   % (rec["totals"]["activities"], rec["totals"]["stations"],
                      rec["totals"]["activities"]))
    out.append("<h3>A 40 to 45 minute lesson</h3><p>Keep the starter, the explanation "
               "and the model at full length: cutting those is what makes the online "
               "work fail. Take the time out of the online block and the apply phase. "
               "Pupils stop where they are; their progress saves after every answer "
               "and reopens at their earliest unfinished question, so the next lesson "
               "starts there.</p>")
    if rec["unit"] == "PY":
        out.append('<div class="band amber"><p>A shorter lesson still does not '
                   'authorise skipping a question. The save-and-resume point is '
                   'wherever the pupil got to; there is no way to mark a question '
                   'complete without completing it, and no teacher bypass.</p></div>')
    out.append("<h3>If the internet or the devices are unavailable</h3>"
               "<p>Teach from the slides and the worksheet. The slides carry the same "
               "teaching as the station walls, and the worksheet carries the key "
               "facts, the challenges and the exam practice. Set the online stations "
               "when the devices are back.</p>"
               "<p>There is no offline version of the experience, and this plan does "
               "not contain one. Do not hand out a printed walkthrough of the stations "
               "as a substitute: the experiences are used on the website.</p>")
    return "".join(out)


# ------------------------------------------------------------------- the plan
EXTRA = """
table.keyval{margin:0 0 9pt}
table.keyval th{width:30%%;text-transform:none;letter-spacing:0;font-size:8.8pt;
  color:%(slate)s;border-bottom:.6pt solid %(border)s;padding:4pt 6pt 4pt 0}
.gapnote{background:#FEF3F2;border-left:2.4pt solid #E2574C;padding:5pt 8pt;
  margin:0 0 7pt;font-size:8.6pt;color:#7A271A}
h2{break-before:auto}
.sect{break-inside:auto}
""" % dict(slate=K.SLATE, border=K.BORDER)


def build(rec, nxt):
    body = [
        K.cover("%s" % rec["title"],
                "Revise 360 lesson plan — 60 minutes",
                "%s · lesson %s" % (UNIT_SPEC.get(rec["unit"], rec["unit"]),
                                         rec["lesson"]),
                "Lesson plan\nTeacher copy\nrevise360.co.uk"),
        head(rec, nxt),
        '<div class="sect">' + outcomes_section(rec) + "</div>",
        '<div class="sect">' + prep_section(rec) + "</div>",
        '<div class="sect">' + sequence_section(rec) + "</div>",
        '<div class="sect">' + explain_section(rec) + "</div>",
        '<div class="sect">' + check_section(rec) + "</div>",
        '<div class="sect">' + practice_section(rec) + "</div>",
        '<div class="sect">' + online_section(rec) + "</div>",
        '<div class="sect">' + assess_section(rec) + "</div>",
        '<div class="sect">' + exit_section(rec, nxt) + "</div>",
        '<div class="sect">' + adapt_section(rec) + "</div>",
        K.FOOT,
    ]
    markup = K.page("Revise 360 lesson plan — %s %s" % (rec["id"], rec["title"]),
                    "".join(body), 1, EXTRA + K.token_css())
    # Prescribed data is shown the way it is shown everywhere else: through the
    # one lexer, in the editor's own token kinds, in the ink tuned for paper.
    return K.richify(markup)


def main(argv):
    check = "--check" in argv
    only = [a for a in argv if not a.startswith("--")]
    paths = sorted(glob.glob(os.path.join(RECS, "*.json")))
    if not paths:
        sys.exit("no records in build/records - run tools/record.py first")
    recs = [json.load(open(p, encoding="utf-8")) for p in paths]
    recs.sort(key=lambda r: (r["unit"], r["lesson"] or 0))
    nxt_of = {}
    for i, r in enumerate(recs):
        following = recs[i + 1] if i + 1 < len(recs) and recs[i + 1]["unit"] == r["unit"] else None
        nxt_of[r["id"]] = following

    if only:
        recs = [r for r in recs if r["id"] in only]
    jobs, gaps = [], []
    for r in recs:
        markup = build(r, nxt_of.get(r["id"]))
        n = markup.count('class="gapnote"')
        if n:
            gaps.append((r["id"], n))
        if not adds_up(timings(r)):
            sys.exit("%s: the timings do not add to 60 minutes" % r["id"])
        jobs.append((plan_file(r["id"]), markup))

    print("%d plan(s)" % len(jobs))
    if gaps:
        print("%d plan(s) say something is missing from the lesson record:" % len(gaps))
        for lid, n in gaps[:25]:
            print("   %-14s %d gap(s)" % (lid, n))
        if len(gaps) > 25:
            print("   ... and %d more" % (len(gaps) - 25))
    if check:
        return 0
    made = K.render_many(jobs, "_plans", OUT)
    os.makedirs(SITE_PLANS, exist_ok=True)
    for f in made:
        shutil.copy(f, os.path.join(SITE_PLANS, os.path.basename(f)))
    # A run for one lesson must not throw away the index for the other 114. The
    # entries for the lessons just built are merged into whatever is already
    # there, and tools/tests/smokeplans.py fails if the result and the folder
    # disagree.
    idx_path = os.path.join(SITE_PLANS, "index.json")
    plans = {}
    if os.path.exists(idx_path):
        try:
            plans = json.load(open(idx_path, encoding="utf-8")).get("plans", {})
        except Exception:
            plans = {}
    plans.update({r["id"]: {"plan_id": r["plan_id"],
                            "file": "lessonplans/%s.pdf" % plan_file(r["id"]),
                            "version": r["version"],
                            "unit": r["unit"], "lesson": r["lesson"],
                            "title": r["title"], "kind": r["kind"]}
                  for r in recs})
    json.dump({"note": "the experience or lesson ID for every lesson plan PDF",
               "plans": dict(sorted(plans.items()))},
              open(idx_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("wrote %d PDF(s) to lessonplans/ with index.json" % len(made))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
