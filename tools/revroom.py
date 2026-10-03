"""The Revision 360 room: the one 360 scene the revision mode is answered inside.

Section 2 says this must not be an ordinary flat quiz page - the learner enters a
Revise 360 environment and the questions arrive through the normal task
interface. So the room is built the way every other scene in the course is built,
with tools/lib360, and it has no stations: questions come from the bank, not from
the walls.

What the walls carry is the furniture a revision room should have, and nothing a
question could be answered from. Command words, what each mark is worth, the
eleven topics, and what Improve my answer does. A learner who looks up from a
question they are stuck on finds the difference between DESCRIBE and EXPLAIN on
the wall beside them, which is the sort of thing that belongs on a wall and not in
a help panel nobody opens.

  python3 tools/revroom.py          # build the artwork into build/
  python3 tools/revroom.py --json   # only the scene JSON, no render (fast)

A render takes a couple of minutes and rewrites a three-megabyte photograph, so
it is not part of the ordinary bank build: nothing about the questions is painted
into it, which is exactly why it never needs rebuilding when they change.
"""
import json
import sys

from lib360 import (S, BG, PANEL, LINE, WHITE, SOFT, YELLOW, COL, font, para, wrap,
                    bullets, base_wall, render, render_hi)
from paths import SITE_S, OUT_S
import numpy as np

BASE = "RV_Revision360_360"
ID = "revision-room"

COMMANDS = [
    ("STATE / GIVE / NAME", "One short fact. No explanation wanted, and none earns a mark."),
    ("IDENTIFY", "Pick out the right thing from what you have been given."),
    ("DESCRIBE", "Say what happens, in order, with enough detail to picture it."),
    ("EXPLAIN", "Say why, or how. An explanation needs a because, a so or a therefore."),
    ("COMPARE", "Both sides of each point. One side on its own is half an answer."),
    ("JUSTIFY", "Give the reason your choice is the right one, not just what it is."),
    ("CALCULATE", "Show the working. The method can earn a mark even if the answer slips."),
    ("DISCUSS / EVALUATE", "More than one view, then a judgement of your own, with a reason."),
]

MARKS = [
    ("1 mark", "One valid fact, identification or result."),
    ("2 marks", "Two points, or a method and a result."),
    ("3 marks", "A developed explanation, a trace, or a calculation in steps."),
    ("4 marks", "A developed comparison or application: several linked points."),
    ("6 marks", "An extended response. More than one view, and a conclusion."),
]

TOPICS = [
    ("1.1", "Systems architecture"), ("1.2", "Memory and storage"),
    ("1.3", "Computer networks"), ("1.4", "Network security"),
    ("1.5", "Systems software"), ("1.6", "Ethical, legal and environmental"),
    ("2.1", "Algorithms"), ("2.2", "Programming fundamentals"),
    ("2.3", "Producing robust programs"), ("2.4", "Boolean logic"),
    ("2.5", "Programming languages and IDEs"),
]


def plate(d, box, title, col, rows, title_size=50, label_w=430, body=36):
    """A titled panel of label-and-text rows. Used for all three wall panels, so
    they look like one room rather than three.

    The panel is drawn to fit its rows: a fixed height left a third of each one
    empty, and an empty third of a wall reads as something missing rather than
    as space."""
    x0, y0, x1, _ = box
    from PIL import Image, ImageDraw
    scratch = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    y = y0 + 140
    for label, text in rows:
        end = para(scratch, (x0 + 34 + label_w, y - 2), text, font(body), x1 - x0 - 68 - label_w)
        y = max(y + 46, end) + 16
    y1 = y + 34
    box = (x0, y0, x1, y1)
    d.rounded_rectangle(box, 34, fill=PANEL, outline=col, width=6)
    d.rounded_rectangle((x0, y0, x1, y0 + 104), 34, fill=col)
    d.rectangle((x0, y0 + 70, x1, y0 + 104), fill=col)
    d.text((x0 + 34, y0 + 52), title, font=font(title_size, True), fill=(15, 22, 38), anchor="lm")
    y = y0 + 140
    fl, fb = font(34, True), font(body)
    for i, (label, text) in enumerate(rows):
        d.text((x0 + 34, y), label, font=fl, fill=COL[(i % 6) + 1])
        end = para(d, (x0 + 34 + label_w, y - 2), text, fb, x1 - x0 - 68 - label_w)
        y = max(y + 46, end) + 16
    return y1


def front():
    im, d = base_wall()
    d.text((S // 2, 230), "REVISE 360", font=font(40, True), fill=YELLOW, anchor="mm")
    d.text((S // 2, 330), "REVISION 360", font=font(104, True), fill=WHITE, anchor="mm")
    d.text((S // 2, 424), "GCSE Computer Science · OCR J277 · revise as long as you like",
           font=font(36), fill=SOFT, anchor="mm")
    d.rounded_rectangle((250, 500, S - 250, 1180), 36, fill=PANEL, outline=YELLOW, width=6)
    y = para(d, (310, 552),
             "Choose your topics, and answer one question at a time. Every question shows "
             "what it is worth. You are marked in marks out of marks available, the way an "
             "exam marks you - not in questions right.", font(42), S - 620)
    y = para(d, (310, y + 26), "This room answers four questions:", font(42, True),
             S - 620, fill=YELLOW)
    bullets(d, (330, y + 16),
            ["What do I know?", "Where am I losing marks?",
             "What should I revise next?", "Can I improve my answer?"],
            font(40), S - 660, YELLOW)
    d.text((S // 2, 1255), "Turn right for command words  ·  turn around for marks  "
                           "·  turn left for the topics",
           font=font(34, True), fill=SOFT, anchor="mm")
    d.text((S // 2, 1320), "Look down to see what Improve my answer does",
           font=font(34, True), fill=SOFT, anchor="mm")
    # The one thing this room does not do.
    d.rounded_rectangle((420, 1400, S - 420, 1560), 24, fill=(20, 30, 50), outline=LINE, width=4)
    para(d, (460, 1430),
         "Revise 360 does not give you a predicted grade. A question stream you choose the "
         "topics for is not an exam paper, and a percentage from it is not a grade.",
         font(32), S - 960, fill=SOFT)
    return im


def right():
    im, d = base_wall()
    d.text((S // 2, 215), "COMMAND WORDS", font=font(72, True), fill=WHITE, anchor="mm")
    d.text((S // 2, 285), "what the question is actually asking you to do",
           font=font(34), fill=SOFT, anchor="mm")
    plate(d, (120, 340, S - 120, 1820), "Read the command word first", COL[1], COMMANDS,
          label_w=470, body=34)
    return im


def back():
    im, d = base_wall()
    d.text((S // 2, 215), "HOW THE MARKS WORK", font=font(72, True), fill=WHITE, anchor="mm")
    d.text((S // 2, 285), "every question tells you what it is worth before you answer it",
           font=font(34), fill=SOFT, anchor="mm")
    top = plate(d, (120, 340, S - 120, 0), "What a mark value expects", COL[5], MARKS,
                label_w=250, body=36) + 60

    # Measured first, drawn second, so the panel sits behind its own words.
    def body(dd, y0):
        y = para(dd, (154, y0 + 132),
                 "42 / 56 is not the same as 24 questions out of 30. A three-mark "
                 "explanation you half-answered and a one-mark fact you missed are "
                 "different events, and only marks tell them apart.", font(36), S - 308)
        return bullets(dd, (174, y + 18),
                       ["Your first attempt at a question is never overwritten.",
                        "What you revise next is worked out from first attempts only.",
                        "Marks you recover by improving an answer are counted separately."],
                       font(34), S - 348, YELLOW)
    from PIL import Image, ImageDraw
    bottom = body(ImageDraw.Draw(Image.new("RGB", (10, 10))), top)
    d.rounded_rectangle((120, top, S - 120, bottom + 30), 34, fill=PANEL, outline=YELLOW, width=6)
    d.text((154, top + 62), "Marks achieved out of marks available",
           font=font(46, True), fill=YELLOW)
    body(d, top)
    return im


def left():
    im, d = base_wall()
    d.text((S // 2, 215), "THE ELEVEN TOPICS", font=font(72, True), fill=WHITE, anchor="mm")
    d.text((S // 2, 285), "choose any combination, and change it whenever you like",
           font=font(34), fill=SOFT, anchor="mm")
    for col, (title, items, c) in enumerate([
            ("PAPER 1", TOPICS[:6], COL[1]), ("PAPER 2", TOPICS[6:], COL[2])]):
        x0 = 110 + col * (S // 2 - 60)
        x1 = x0 + S // 2 - 170
        rows = 490 + len(items) * 82 + 24
        d.rounded_rectangle((x0, 340, x1, rows), 34, fill=PANEL, outline=c, width=6)
        d.rounded_rectangle((x0, 340, x1, 444), 34, fill=c)
        d.rectangle((x0, 410, x1, 444), fill=c)
        d.text(((x0 + x1) / 2, 392), title, font=font(52, True), fill=(15, 22, 38), anchor="mm")
        y = 490
        for code, name in items:
            d.text((x0 + 34, y), code, font=font(44, True), fill=c)
            end = para(d, (x0 + 150, y + 2), name, font(40), x1 - x0 - 200)
            y = max(y + 58, end) + 24
    d.text((S // 2, 1180), "Computer Science is examined on two papers. Every topic here is on one of them.",
           font=font(34), fill=SOFT, anchor="mm")
    d.text((S // 2, 1240), "At least one topic has to be chosen; everything else is up to you.",
           font=font(34), fill=SOFT, anchor="mm")
    return im


def down():
    im = Image_new()
    d = ImageDrawDraw(im)
    d.rounded_rectangle((300, 260, S - 300, 1180), 40, fill=PANEL, outline=YELLOW, width=7)
    d.text((S // 2, 350), "IMPROVE MY ANSWER", font=font(78, True), fill=YELLOW, anchor="mm")
    y = para(d, (360, 440),
             "When a written answer falls short, you are shown which mark points you earned "
             "and which you missed - not the answer. You can then write it again.",
             font(42), S - 720)
    bullets(d, (380, y + 24),
            ["Your first attempt is kept exactly as it was.",
             "The improved attempt is recorded beside it.",
             "The difference is counted as marks recovered."],
            font(40), S - 760, YELLOW)
    d.text((S // 2, 1300), "ASSESS → FEEDBACK → IMPROVE → LEARN",
           font=font(56, True), fill=SOFT, anchor="mm")
    return im


def up():
    im = Image_new(BG)
    d = ImageDrawDraw(im)
    for r in range(3, 11):
        d.ellipse((S / 2 - r * 92, S / 2 - r * 92, S / 2 + r * 92, S / 2 + r * 92),
                  outline=(26, 40, 66), width=3)
    d.text((S // 2, S // 2), "REVISION 360", font=font(64, True), fill=(40, 58, 92), anchor="mm")
    return im


def Image_new(bg=(14, 24, 42)):
    from PIL import Image
    return Image.new("RGB", (S, S), bg)


def ImageDrawDraw(im):
    from PIL import ImageDraw
    return ImageDraw.Draw(im)


def scene():
    """The scene JSON. No stations and no info markers: the walls are reference,
    and the questions come from the bank."""
    return {
        "id": ID,
        "lesson": "Revision 360",
        "title": "Revision 360",
        "revision": True,
        "scenes": [{
            "id": "main", "title": "Revision 360",
            "img": "img/%s.jpg" % BASE, "imgHi": "img/%s_hi.jpg" % BASE,
            "stations": [], "info": [], "models": [], "diagrams": []
        }]
    }


def main():
    faces = dict(front=front, right=right, back=back, left=left, up=up, down=down)
    out = SITE_S + "experiences/%s.json" % ID
    json.dump(scene(), open(out, "w"), indent=1, ensure_ascii=False)
    print("wrote experiences/%s.json" % ID)
    if "--json" in sys.argv:
        print("(no render; drop --json to build the artwork)")
        return 0
    render(faces, OUT_S + BASE + ".jpg", OUT_S + "prev_" + BASE)
    import shutil
    shutil.copy(OUT_S + BASE + ".jpg", SITE_S + "experiences/img/%s.jpg" % BASE)
    cache = {k: np.asarray(f(), dtype=np.float32) for k, f in faces.items()}
    render_hi(cache, SITE_S + "experiences/img/%s_hi.jpg" % BASE)
    print("wrote experiences/img/%s.jpg and the headset copy" % BASE)
    return 0


if __name__ == "__main__":
    sys.exit(main())
