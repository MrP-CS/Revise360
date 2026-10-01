import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
from kit import *
import json, shutil
def front():
    im, d = base_wall()
    d.text((S//2, 250), "1.2 Memory and storage  |  Bonus challenge", font=font(44, True), fill=YELLOW, anchor="mm")
    d.text((S//2, 350), "Binary blitz", font=font(110, True), fill=WHITE, anchor="mm")
    d.text((S//2, 450), "How many conversions can you get right in two minutes?", font=font(42), fill=SOFT, anchor="mm")
    d.rounded_rectangle((260, 520, S-260, 1080), 40, fill=PANEL, outline=YELLOW, width=6)
    y = para(d, (320, 570), "Denary, binary and hexadecimal, against the clock. The questions get harder as you go: two-way binary first, then hexadecimal as well.", font(44), S-640)
    bullets(d, (340, y + 30), ["Correct answer: 100 points", "Speed bonus: up to 60 points", "Streak multiplier: up to ×3", "A wrong answer resets your streak"], font(42), S-680, YELLOW)
    d.text((S//2, 1210), "Tap the star on the floor to start. Play as often as you like to beat your best!", font=font(40, True), fill=WHITE, anchor="mm")
    return im
def places_wall():
    im, d = base_wall()
    d.text((S//2, 250), "Place values", font=font(64, True), fill=COL[1], anchor="mm")
    vals = [128, 64, 32, 16, 8, 4, 2, 1]
    for i, v in enumerate(vals):
        x0 = 120 + i * 230
        d.rounded_rectangle((x0, 420, x0 + 200, 700), 20, fill=PANEL, outline=COL[1], width=5)
        d.text((x0 + 100, 560), str(v), font=font(64, True), fill=WHITE, anchor="mm")
    d.text((S//2, 800), "Add the place values above every 1 to get the denary number", font=font(40), fill=SOFT, anchor="mm")
    rows = [("10011100", "128 + 16 + 8 + 4 = 156"), ("11010110", "128 + 64 + 16 + 4 + 2 = 214"), ("01100000", "64 + 32 = 96")]
    for i, (b, w) in enumerate(rows):
        y = 950 + i * 160
        d.text((420, y), b, font=font(52, True), fill=YELLOW, anchor="lm")
        d.text((1000, y), w, font=font(40), fill=WHITE, anchor="lm")
    return im
def hex_wall():
    im, d = base_wall()
    d.text((S//2, 250), "Hexadecimal", font=font(64, True), fill=COL[3], anchor="mm")
    for i in range(16):
        x0 = 120 + (i % 8) * 230; y0 = 420 + (i // 8) * 320
        d.rounded_rectangle((x0, y0, x0 + 200, y0 + 260), 20, fill=PANEL, outline=COL[1 + i % 6], width=5)
        d.text((x0 + 100, y0 + 70), "0123456789ABCDEF"[i], font=font(70, True), fill=WHITE, anchor="mm")
        d.text((x0 + 100, y0 + 150), str(i), font=font(40, True), fill=YELLOW, anchor="mm")
        d.text((x0 + 100, y0 + 210), format(i, "04b"), font=font(34), fill=SOFT, anchor="mm")
    d.text((S//2, 1120), "One hex digit is exactly four bits: split the byte into two nibbles", font=font(40), fill=SOFT, anchor="mm")
    return im
def tips_wall():
    im, d = base_wall()
    d.text((S//2, 250), "Speed tips", font=font(64, True), fill=COL[5], anchor="mm")
    tips = ["Denary to binary: start at 128 and work down. Does it fit? Write 1 and subtract it.",
            "Binary to denary: add the place values above every 1. Check your total looks sensible.",
            "Denary to hex: divide by 16. The whole number is the first digit, the remainder is the second.",
            "Binary to hex: split into two nibbles of four bits, then convert each one.",
            "Speed comes from knowing 128, 64, 32, 16, 8, 4, 2, 1 without thinking."]
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
base = "MS_BinaryBlitz_360"; site = SITE_S
render(faces, OUT_S + f"{base}.jpg", OUT_S + f"prev_{base}")
shutil.copy(OUT_S + f"{base}.jpg", site + f"experiences/img/{base}.jpg")
render_hi({k: np.asarray(f(), dtype=np.float32) for k, f in faces.items()}, site + f"experiences/img/{base}_hi.jpg")
exp = dict(id="ms-blitz", lesson=18, title="Binary blitz", scenes=[dict(id="main", title="Binary blitz", img=f"img/{base}.jpg", imgHi=f"img/{base}_hi.jpg",
  stations=[dict(label="★", name="Binary blitz", col="#ffd046", face="down", x=1024, y=1024, tasks=[dict(t="blitz", duration=120)])],
  info=[dict(id="f1", face="right", x=1024, y=330, title="Learn the eight", text="Knowing 128, 64, 32, 16, 8, 4, 2 and 1 by heart is most of the work. Say them out loud until they're automatic."),
        dict(id="f2", face="back", x=1024, y=330, title="Nibbles", text="Because one hex digit is exactly four bits, binary to hex never needs any arithmetic: just split into nibbles and look each one up."),
        dict(id="f3", face="left", x=1024, y=330, title="Check your answer", text="After converting to binary, add the place values back up. If you don't get the original number, you've slipped somewhere."),
        dict(id="f4", face="front", x=1880, y=300, title="Why bother?", text="Conversion questions appear in nearly every exam paper, and they're marks you can guarantee with practice.")])])
json.dump(exp, open(site + "experiences/ms-blitz.json", "w"), indent=1, ensure_ascii=False)
print("ok")
