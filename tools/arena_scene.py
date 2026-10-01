import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
from kit import *
import json, shutil
def front():
    im, d = base_wall()
    d.text((S//2, 250), "2.1 Algorithms  |  Bonus challenge", font=font(44, True), fill=YELLOW, anchor="mm")
    d.text((S//2, 350), "Algorithm arena", font=font(110, True), fill=WHITE, anchor="mm")
    d.text((S//2, 450), "How many algorithm challenges can you finish in two minutes?", font=font(42), fill=SOFT, anchor="mm")
    d.rounded_rectangle((260, 520, S-260, 1080), 40, fill=PANEL, outline=YELLOW, width=6)
    y = para(d, (320, 570), "Searches to run, sorts to complete and bugs to find, against the clock. The challenges get harder as you go.", font(44), S-640)
    bullets(d, (340, y + 30), ["Correct answer: 100 points", "Speed bonus: up to 60 points", "Streak multiplier: up to ×3", "A wrong answer resets your streak"], font(42), S-680, YELLOW)
    d.text((S//2, 1210), "Tap the star on the floor to start. Play as often as you like to beat your best!", font=font(40, True), fill=WHITE, anchor="mm")
    return im
def places_wall():
    im, d = base_wall()
    d.text((S//2, 250), "Searching", font=font(64, True), fill=COL[1], anchor="mm")
    cards = [("Linear search", "Check every item in turn from the left. Any order. Stops when it matches.", COL[1]),
             ("Binary search", "Check the middle. Throw away the half it cannot be in. Repeat. Sorted lists only.", COL[3])]
    for i, (name, blurb, col) in enumerate(cards):
        y0 = 430 + i * 300
        d.rounded_rectangle((180, y0, S - 180, y0 + 230), 26, fill=PANEL, outline=col, width=6)
        d.text((230, y0 + 70), name, font=font(58, True), fill=col, anchor="lm")
        d.text((230, y0 + 155), blurb, font=font(38), fill=SOFT, anchor="lm")
    d.text((S//2, 1120), "The arena tells you which search to run. Tap the item it checks next.",
           font=font(40), fill=WHITE, anchor="mm")
    return im
def hex_wall():
    im, d = base_wall()
    d.text((S//2, 250), "Sorting", font=font(64, True), fill=COL[3], anchor="mm")
    cards = [("Bubble sort", "Compare each neighbouring pair from the left. Swap if they are the wrong way round.", COL[1]),
             ("Insertion sort", "Take each item and move it left until it sits in the right place.", COL[2]),
             ("Find the error", "Does it run? No, syntax error. Yes but wrong, logic error.", COL[5])]
    for i, (name, blurb, col) in enumerate(cards):
        y0 = 400 + i * 250
        d.rounded_rectangle((180, y0, S - 180, y0 + 190), 26, fill=PANEL, outline=col, width=6)
        d.text((230, y0 + 60), name, font=font(56, True), fill=col, anchor="lm")
        d.text((230, y0 + 135), blurb, font=font(37), fill=SOFT, anchor="lm")
    return im
def tips_wall():
    im, d = base_wall()
    d.text((S//2, 250), "Speed tips", font=font(64, True), fill=COL[5], anchor="mm")
    tips = ["Linear search: start at the left and check every item in turn.",
            "Binary search: always start in the middle of what is left.",
            "Bubble sort: one pass only, comparing neighbours from the left.",
            "Insertion sort: build the sorted section from the left, one item at a time.",
            "Errors: if it would not run, it is a syntax error; if it runs but is wrong, it is logic."]
    for i, t in enumerate(tips):
        y0 = 380 + i * 250
        d.rounded_rectangle((160, y0, S-160, y0 + 200), 24, fill=PANEL, outline=COL[1 + i % 6], width=5)
        para(d, (200, y0 + 50), t, font(38), S - 440)
    return im
def floor():
    im = Image.new("RGB", (S, S), (34, 40, 50)); d = ImageDraw.Draw(im)
    for x in range(0, S, 256): d.line((x, 0, x, S), fill=(46, 54, 66), width=5)
    d.ellipse((424, 424, S-424, S-424), fill=(22, 32, 52), outline=YELLOW, width=12)
    d.text((S//2, S//2 + 260), "START", font=font(90, True), fill=YELLOW, anchor="mm")
    return im
faces = dict(front=front, right=places_wall, back=hex_wall, left=tips_wall, up=ceiling_plain, down=floor)
base = "AL_Bonus_AlgorithmArena_360"; site = SITE_S
render(faces, OUT_S + f"{base}.jpg", OUT_S + f"prev_{base}")
shutil.copy(OUT_S + f"{base}.jpg", site + f"experiences/img/{base}.jpg")
render_hi({k: np.asarray(f(), dtype=np.float32) for k, f in faces.items()}, site + f"experiences/img/{base}_hi.jpg")
exp = dict(id="al-bonus", lesson=12, title="Algorithm arena", scenes=[dict(id="main", title="Algorithm arena", img=f"img/{base}.jpg", imgHi=f"img/{base}_hi.jpg",
  stations=[dict(label="★", name="Algorithm arena", col="#ffd046", face="down", x=1024, y=1024, tasks=[dict(t="arena", duration=120)])],
  info=[dict(id="f1", face="right", x=1024, y=330, title="Learn the eight", text="Knowing 128, 64, 32, 16, 8, 4, 2 and 1 by heart is most of the work. Say them out loud until they're automatic."),
        dict(id="f2", face="back", x=1024, y=330, title="Nibbles", text="Because one hex digit is exactly four bits, binary to hex never needs any arithmetic: just split into nibbles and look each one up."),
        dict(id="f3", face="left", x=1024, y=330, title="Check your answer", text="After converting to binary, add the place values back up. If you don't get the original number, you've slipped somewhere."),
        dict(id="f4", face="front", x=1880, y=300, title="Why bother?", text="Conversion questions appear in nearly every exam paper, and they're marks you can guarantee with practice.")])])
json.dump(exp, open(site + "experiences/al-bonus.json", "w"), indent=1, ensure_ascii=False)
print("ok")
