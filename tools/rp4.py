import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
from lib23 import *

def bug(d, cx, cy, s=1.0, c=(90, 200, 120)):
    d.ellipse((cx-45*s, cy-60*s, cx+45*s, cy+60*s), fill=c)
    d.ellipse((cx-30*s, cy-95*s, cx+30*s, cy-45*s), fill=(40, 60, 50))
    for k in (-1, 1):
        for j in range(3):
            y = cy - 25*s + j*30*s
            d.line((cx + k*40*s, y, cx + k*85*s, y - 15*s + j*12*s), fill=(40, 60, 50), width=int(8*s))
        d.line((cx + k*12*s, cy-90*s, cx + k*35*s, cy-125*s), fill=(40, 60, 50), width=int(6*s))
    d.line((cx, cy-45*s, cx, cy+60*s), fill=(40, 60, 50), width=int(5*s))

def ill_why(d, x0, y0, x1, y1, col):
    cx, cy = x0+200, (y0+y1)//2 + 20
    bug(d, cx, cy, 1.1)
    d.ellipse((cx-150, cy-170, cx+90, cy+70), outline=(220, 224, 232), width=14)
    d.line((cx+70, cy+50, cx+150, cy+130), fill=(220, 224, 232), width=22)
    items = ["Find and fix bugs", "Meets requirements", "Can't crash or be misused", "No security weak spots"]
    for i, t in enumerate(items):
        y = y0 + 40 + i*80
        d.rounded_rectangle((x0+400, y, x1, y+60), 12, fill=(20, 28, 44), outline=col, width=3)
        d.text((x0+420, y+30), f"{i+1}. {t}", font=font(22, True), fill=WHITE, anchor="lm")

def arrow_arc(d, cx, cy, r, a0, a1, c):
    d.arc((cx-r, cy-r, cx+r, cy+r), a0, a1, fill=c, width=14)
    a = math.radians(a1); hx, hy = cx + r*math.cos(a), cy + r*math.sin(a)
    t = a + math.pi/2
    d.polygon([(hx + 26*math.cos(t), hy + 26*math.sin(t)), (hx + 22*math.cos(a), hy + 22*math.sin(a)), (hx - 22*math.cos(a), hy - 22*math.sin(a))], fill=c)

def ill_iter(d, x0, y0, x1, y1, col):
    cx, cy, r = (x0+x1)//2, (y0+y1)//2 + 10, 140
    for a0, c in ((-80, COL[1]), (40, COL[4]), (160, COL[5])): arrow_arc(d, cx, cy, r, a0, a0 + 95, c)
    for lab, a in (("Write", -90), ("Test", 30), ("Fix", 150)):
        x, y = cx + (r+80)*math.cos(math.radians(a)), cy + (r+60)*math.sin(math.radians(a))
        d.text((x, y), lab, font=font(34, True), fill=WHITE, anchor="mm")
    d.text((cx, cy), "repeat for\neach module", font=font(26, True), fill=SOFT, anchor="mm", align="center")

def ill_final(d, x0, y0, x1, y1, col):
    items = ["All modules work together", "Meets every requirement", "Tested with a test plan", "Ready to release"]
    for i, t in enumerate(items):
        y = y0 + 30 + i*85
        d.rounded_rectangle((x0+30, y, x0+90, y+60), 10, fill=(20, 40, 34), outline=GREEN, width=4)
        d.line([(x0+42, y+32), (x0+56, y+46), (x0+80, y+16)], fill=GREEN, width=8)
        d.text((x0+115, y+30), t, font=font(30, True), fill=WHITE, anchor="lm")
    d.polygon([(x1-110, y0+60), (x1-60, y0+160), (x1-160, y0+160)], fill=(235, 238, 242))
    d.rectangle((x1-140, y0+160, x1-80, y0+280), fill=(235, 238, 242))
    d.polygon([(x1-140, y0+230), (x1-175, y0+300), (x1-140, y0+280)], fill=RED); d.polygon([(x1-80, y0+230), (x1-45, y0+300), (x1-80, y0+280)], fill=RED)
    d.polygon([(x1-130, y0+285), (x1-110, y0+350), (x1-90, y0+285)], fill=YELLOW)

def squiggle(d, x0, x1, y):
    pts = [(x, y + 5*math.sin((x-x0)/5)) for x in range(int(x0), int(x1), 3)]
    d.line(pts, fill=RED, width=4)

def ill_syntax(d, x0, y0, x1, y1, col):
    f = ImageFont.truetype(MONO, 30)
    code_box(d, x0, y0+10, x1, y0+200, ['prnt("Hello world")', 'while n >= 1', 'name = input("Name?)'], 30)
    squiggle(d, x0+16, x0+16+d.textlength("prnt", font=f), y0+60)
    squiggle(d, x0+16+d.textlength("while n >= ", font=f), x0+16+d.textlength("while n >= 1 ", font=f), y0+104)
    squiggle(d, x0+16+d.textlength('name = input(', font=f), x0+16+d.textlength('name = input("Name?)', font=f), y0+148)
    d.rounded_rectangle((x0, y0+230, x1, y1-20), 12, fill=(40, 16, 22), outline=RED, width=4)
    d.text((x0+20, y0+250), "SyntaxError: invalid syntax", font=ImageFont.truetype(MONO, 26), fill=(255, 160, 160))
    d.text((x0+20, y0+295), "The program won't run at all", font=font(26, True), fill=WHITE)

def ill_logic(d, x0, y0, x1, y1, col):
    code_box(d, x0, y0, x1, y0+205, ['if score >= pass_mark then', '    print("Fail")', 'else', '    print("Pass")', 'endif'], 24, marks={0: (60, 50, 20)})
    d.rounded_rectangle((x0, y0+220, x1, y0+350), 12, fill=(10, 14, 24), outline=YELLOW, width=4)
    d.text((x0+20, y0+238), "> score 80, pass 40 -> Fail", font=ImageFont.truetype(MONO, 26), fill=C_TXT)
    d.text((x0+20, y0+290), "It runs, but the answer is wrong", font=font(26, True), fill=YELLOW)

FACT = ["def total_cost(items):", "    total = 0", "    while items >= 1:", "        total = total + total", "", "    return total", "",
        "while True:", '    items = input("How many items? ")', '    prnt("Cost: ", total_cost(items))']

def ill_detective(d, x0, y0, x1, y1, col):
    code_box(d, x0-25, y0-10, x1+25, y1+10, FACT, 24, numbers=True)
    bug(d, x1-40, y0+60, .35, (255, 120, 90))

def front():
    im, d = base_wall()
    briefing23(im, d, 4, "Bug hunt lab",
        "Every program has bugs until it's tested. In the lab you'll find out why and when programs are tested, "
        "and learn to tell a syntax error from a logic error.",
        [("Turn right", "Stations 1 and 2", COL[1]), ("Turn around", "Stations 3 and 4", COL[3]),
         ("Turn left", "Stations 5 and 6", COL[5]), ("Look down", "Final challenge", YELLOW)])
    for x in (320, S-320): bug(d, x, 1620, .9, (80, 200, 130) if x < S//2 else (255, 150, 90))
    return im

def right():
    im, d = base_wall()
    station2(d, 100, 1, "Why test a program?", [
        "To find and fix errors before users do.",
        "To check it does everything it is meant to (meets the requirements).",
        "To check it can't be misused, crashed or exploited."],
        "Give four reasons why a program should be tested before it is released.", ill_why, ill_h=360)
    station2(d, 1068, 2, "Iterative testing", [
        "Testing done while the program is being developed.",
        "Each module or section is tested as it is written, then fixed and tested again.",
        "Checks that new code hasn't broken code that already worked."],
        "Suggest three things you would test iteratively while writing the date validation program.", ill_iter, ill_h=360)
    return im

def back():
    im, d = base_wall()
    station2(d, 100, 3, "Final (terminal) testing", [
        "Testing done at the end, when the program is complete, before release.",
        "Checks that all the parts work together and the program meets every requirement."],
        "Suggest three things you would test in final testing of a game before it goes on sale.", ill_final, ill_h=370)
    station2(d, 1068, 4, "Syntax errors", [
        "An error that breaks the rules (grammar) of the programming language.",
        "The translator can't understand the code, so the program won't run.",
        "Examples: misspelt keywords, missing brackets, colons or quotes."],
        "Find the three syntax errors in the code above and say how to fix each one.", ill_syntax, ill_h=360)
    return im

def left():
    im, d = base_wall()
    station2(d, 100, 5, "Logic errors", [
        "The program runs, but doesn't do what the programmer intended.",
        "The translator can't spot them, because the code follows the language's rules.",
        "Found by testing and checking the output."],
        "Explain the logic error in the code above and how to fix it.", ill_logic, ill_h=360)
    station2(d, 1068, 6, "Error detective", [
        "This program should add up the cost of a number of items at £3 each.",
        "It contains both syntax and logic errors."],
        "Find every error. For each one, state whether it is a syntax or logic error.", ill_detective, ill_h=380)
    return im

def floor():
    def extra(im, d):
        code_box(d, 380, 790, S//2 - 20, 1500, ['valid = True', 'while not valid:', '    valid = True', '    prnt("1. Take register")',
                 '    choice = input(Enter choice:)', '    if not choice in [1,2,3]:', '        valid = False'], 27, title="Register program: the bug list", numbers=True)
        d.rounded_rectangle((S//2 + 20, 790, S-380, 1500), 16, fill=(10, 14, 24), outline=RED, width=4)
        f = ImageFont.truetype(MONO, 27)
        for i, (t, c) in enumerate((("Test log", SOFT), ("> run register.py", C_TXT), ("SyntaxError", (255, 160, 160)), ("...fixed...", SOFT),
                                    ("> run register.py", C_TXT), ("(nothing happens)", YELLOW), ("...fixed...", SOFT), ("> choice: 2", C_TXT),
                                    ("Enter choice: ...", YELLOW), ("(loops forever)", YELLOW))):
            d.text((S//2 + 50, 820 + i*62), t, font=f if i else font(28, True), fill=c)
    return floor_final("Final challenge: syntax or logic?",
        "Eight bugs have been reported from the register program and the other lab programs. Tap the star and sort each one into syntax error or logic error.", extra)

if __name__ == "__main__":
    render(dict(front=front, right=right, back=back, left=left, up=ceiling_plain, down=floor),
           OUT_S + "RP_L4_BugHuntLab_360.jpg", os.path.join(os.path.dirname(os.path.abspath(__file__)), "rp4"))
    print("ok")
