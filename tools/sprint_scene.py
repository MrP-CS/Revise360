import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
from kit import *
import json, shutil
def front():
    im, d = base_wall()
    d.text((S//2, 250), "2.4 Boolean logic  |  Bonus challenge", font=font(44, True), fill=YELLOW, anchor="mm")
    d.text((S//2, 350), "Logic sprint", font=font(110, True), fill=WHITE, anchor="mm")
    d.text((S//2, 450), "How many circuits can you crack in two minutes?", font=font(42), fill=SOFT, anchor="mm")
    d.rounded_rectangle((260, 520, S-260, 1080), 40, fill=PANEL, outline=YELLOW, width=6)
    y = para(d, (320, 570), "Build circuits and write expressions against the clock. The faster you answer, the bigger your bonus, and every answer in a row multiplies your points.", font(44), S-640)
    bullets(d, (340, y + 30), ["Correct answer: 100 points", "Speed bonus: up to 60 points", "Streak: up to ×3", "Wrong answer: streak resets"], font(42), S-680, YELLOW)
    d.text((S//2, 1200), "Tap the star below to start. Play as often as you like to beat your best!", font=font(40, True), fill=WHITE, anchor="mm")
    return im
def wall(exprs, title, col):
    def f():
        im, d = base_wall()
        d.text((S//2, 250), title, font=font(64, True), fill=col, anchor="mm")
        for i, (e, out) in enumerate(exprs):
            x0 = 120 + (i % 2) * 930; y0 = 380 + (i // 2) * 700
            d.rounded_rectangle((x0, y0, x0 + 880, y0 + 620), 30, fill=PANEL, outline=col, width=5)
            d.text((x0 + 440, y0 + 60), f"{out} = {e}", font=font(38, True), fill=WHITE, anchor="mm")
            draw_expr(d, e, x0 + 30, y0 + 110, x0 + 850, y0 + 590, out)
        return im
    return f
def floor():
    im = Image.new("RGB", (S, S), (34, 40, 50)); d = ImageDraw.Draw(im)
    for x in range(0, S, 256): d.line((x, 0, x, S), fill=(46, 54, 66), width=5)
    d.ellipse((424, 424, S-424, S-424), fill=(22, 32, 52), outline=YELLOW, width=12)
    d.text((S//2, S//2 + 260), "START", font=font(90, True), fill=YELLOW, anchor="mm")
    return im
faces = dict(front=front, right=wall([("A AND B", "Q"), ("A OR B", "Q"), ("NOT A", "Q"), ("NOT (A AND B)", "Q")], "Warm up: the three gates", COL[1]),
             back=wall([("(A OR B) AND C", "Q"), ("NOT A OR B", "Q"), ("(A AND B) OR C", "X"), ("A AND NOT B", "Q")], "Level 2: two gates", COL[3]),
             left=wall([("NOT (A OR B) AND C", "Q"), ("(A OR B) AND NOT C", "X"), ("NOT A AND (B OR C)", "Q"), ("(A AND B) OR NOT C", "Q")], "Level 3: three inputs", COL[5]),
             up=ceiling_plain, down=floor)
base = "BL_Sprint_360"; site = SITE_S
render(faces, OUT_S + f"{base}.jpg", OUT_S + f"prev_{base}")
shutil.copy(OUT_S + f"{base}.jpg", site + f"experiences/img/{base}.jpg")
render_hi({k: np.asarray(f(), dtype=np.float32) for k, f in faces.items()}, site + f"experiences/img/{base}_hi.jpg")
exp = dict(id="bl-sprint", lesson=5, title="Logic sprint", scenes=[dict(id="main", title="Logic sprint", img=f"img/{base}.jpg", imgHi=f"img/{base}_hi.jpg",
  stations=[dict(label="★", name="Logic sprint", col="#ffd046", face="down", x=1024, y=1024, tasks=[dict(t="sprint", duration=120)])],
  info=[dict(id="f1", face="front", x=1880, y=300, title="Practice makes fast", text="Engineers who design chips recognise common gate patterns instantly. The more sprints you do, the faster you'll spot them too."),
        dict(id="f2", face="right", x=1024, y=330, title="Tip: work backwards", text="To write an expression, start at the output gate and work back towards the inputs. Each gate that feeds another becomes a pair of brackets."),
        dict(id="f3", face="back", x=1024, y=330, title="Tip: brackets first", text="To build a circuit, find the part in brackets first. That's the gate nearest the inputs."),
        dict(id="f4", face="left", x=1024, y=330, title="Streaks", text="Your multiplier goes up by 0.5 for each correct answer in a row, up to ×3. Skipping or a wrong answer resets it, so accuracy matters as much as speed.")])])
json.dump(exp, open(site + "experiences/bl-sprint.json", "w"), indent=1, ensure_ascii=False)
print("ok")
