import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
from lib23 import *

def ill_naming(d, x0, y0, x1, y1, col):
    w = (x1 - x0 - 30) // 2
    code_box(d, x0, y0+20, x0+w, y0+250, ["x = 0", "f = []", "t1 = x + y"], 30, title="Hard to read", border=RED)
    code_box(d, x1-w, y0+20, x1, y0+250, ["totalScore = 0", "factors = []", "total = a + b"], 30, title="Easy to read", border=GREEN)
    cross(d, x0 + w - 40, y0 + 300, 22)
    d.line([(x1-70, y0+300), (x1-52, y0+320), (x1-20, y0+280)], fill=GREEN, width=10)

def ill_comments(d, x0, y0, x1, y1, col):
    code_box(d, x0, y0+10, x1, y1-10, ["# Returns a list of all the", "# factors of a number", "def factors_of(number):", "    factors = []", "    # Count down from number to 1", "    for countdown in range(number,0,-1):"], 26)

def ill_indent(d, x0, y0, x1, y1, col):
    w = (x1 - x0 - 30) // 2
    code_box(d, x0, y0+20, x0+w, y1-20, ["while n >= 1:", "num = num * n", "n = n - 1", "return num"], 24, title="No indentation", border=RED)
    code_box(d, x1-w, y0+20, x1, y1-20, ["while n >= 1:", "    num = num * n", "    n = n - 1", "return num"], 24, title="Indented", border=GREEN)

def ill_subs(d, x0, y0, x1, y1, col):
    d.rounded_rectangle((x0+10, y0+30, x0+330, y1-30), 16, fill=(10,14,24), outline=LINE, width=4)
    d.text((x0+30, y0+45), "Main program", font=font(26, True), fill=SOFT)
    f = ImageFont.truetype(MONO, 22)
    for i, t in enumerate(["factors_of(input1)", "factors_of(input2)", "gcf_of(f1, f2)"]):
        d.text((x0+30, y0+100 + i*70), t, font=f, fill=C_TXT)
    for i, (t, yy) in enumerate((("def factors_of(number)", y0+40), ("def gcf_of(f1, f2)", y0+210))):
        d.rounded_rectangle((x1-380, yy, x1-10, yy+120), 16, fill=(20,40,34), outline=GREEN, width=4)
        d.text((x1-360, yy+20), t, font=f, fill=C_TXT)
        d.text((x1-360, yy+60), "written once, used many times", font=font(20), fill=SOFT)
    for yy, ty in ((y0+110, y0+100), (y0+180, y0+100), (y0+250, y0+270)):
        d.line((x0+300, yy, x1-380, ty), fill=YELLOW, width=5)

def ill_team(d, x0, y0, x1, y1, col):
    cx, cy = (x0+x1)//2, (y0+y1)//2
    d.rectangle((cx-70, cy-100, cx+70, cy+80), fill=(235,238,242))
    for i in range(6): d.line((cx-50, cy-70+i*25, cx+50 - (i%2)*30, cy-70+i*25), fill=(120,130,150), width=6)
    cols = [COL[1], COL[2], COL[3], COL[4]]
    for i, (dx, c) in enumerate(zip((-330, -200, 200, 330), cols)):
        person(d, cx + dx, cy + 40, c)
    d.text((cx, y1-10), "Many programmers, many years", font=font(26, True), fill=SOFT, anchor="mm")

USERNAME = ['house = input("House letter (A-D): ")',
            'form = input("Form group number: ")',
            'year = input("Year group (7-11): ")',
            'seat = input("Seat number (1-30): ")',
            'code = house + form + year + seat',
            'print("Your locker code is: " + code)']

def ill_refine(d, x0, y0, x1, y1, col):
    code_box(d, x0-25, y0-5, x1+25, y1+15, USERNAME, 22, marks={0: (60, 50, 20), 1: (60, 50, 20), 2: (60, 50, 20), 3: (60, 50, 20)}, numbers=True)

def front():
    im, d = base_wall()
    briefing23(im, d, 3, "Code clinic",
        "Programmers spend far more time reading code than writing it. In this clinic you'll learn how to write code "
        "other people can understand, and how to make an algorithm more robust.",
        [("Turn right", "Stations 1 and 2", COL[1]), ("Turn around", "Stations 3 and 4", COL[3]),
         ("Turn left", "Stations 5 and 6", COL[5]), ("Look down", "Final challenge", YELLOW)])
    code_box(d, 60, 1420, 560, 1800, ["# Code clinic", "def diagnose(code):", "    if readable:", "        return \"healthy\"", "    return \"needs work\""], 24)
    code_box(d, S-560, 1420, S-60, 1800, ["# Refine it", "while not valid:", "    age = input()", "    valid = check(age)"], 24)
    return im

def right():
    im, d = base_wall()
    station2(d, 100, 1, "Naming conventions", [
        "Use descriptive names that say what data a variable holds, like totalScore rather than x.",
        "Stick to one style throughout, such as camelCase or snake_case."],
        "Why is f1 a poor name for a list of factors? Suggest a better one.", ill_naming, ill_h=360)
    station2(d, 1068, 2, "Commenting", [
        "Comments explain what a section of code does and why.",
        "The translator ignores them, so they don't change how the program runs.",
        "They help other programmers, and you in six months' time."],
        "Write a comment for a sub-program that checks whether a password is at least 8 characters long.", ill_comments, ill_h=340)
    return im

def back():
    im, d = base_wall()
    station2(d, 100, 3, "Indentation and white space", [
        "Indentation shows which lines belong inside a loop, selection statement or sub-program.",
        "Blank lines and spaces separate sections, so code is quicker to scan."],
        "Look at the two loops. Which lines are inside the loop? How can you tell?", ill_indent, ill_h=350)
    station2(d, 1068, 4, "Sub-programs", [
        "Procedures and functions split a program into named, reusable parts.",
        "Each part can be written, tested and fixed on its own.",
        "Code is reused by calling it, instead of being copied."],
        "A program repeats the same 10 lines in five places, and a bug is found. How would a sub-program help?", ill_subs, ill_h=360)
    return im

def left():
    im, d = base_wall()
    station2(d, 100, 5, "Why maintainability matters", [
        "Maintainability means techniques that make code easier to debug, update and maintain.",
        "Large projects have many programmers working on the same code, often for years.",
        "Code that is hard to read takes longer, and costs more, to fix."],
        "Why is readable code more important in a large project than in a program you write on your own?", ill_team, ill_h=330)
    station2(d, 1068, 6, "Refining an algorithm", [
        "This program builds a locker code but accepts anything the user types.",
        "Refining it means adding validation so it only accepts sensible input.",
        "The highlighted lines are where checks are needed."],
        "Suggest a validation check for each highlighted line.", ill_refine, ill_h=300)
    return im

BAD = ["def p(a,b,c):", "t=0", "for i in range(len(a)):", "t=t+a[i]*b", "if t>c:", "t=t-c", "x=t*0.2", "y=t-x",
       "print(y)", "return y", "p([3,4,5],2,9)"]

def floor():
    def extra(im, d):
        code_box(d, 520, 780, S-520, 1560, BAD, 32, title="Exhibit A: the worst code in the clinic", border=RED, numbers=True)
    return floor_final("Final challenge: good practice or bad?",
        "Exhibit A works, but nobody can tell what it does. Tap the star and sort each habit into good practice or bad practice.", extra)

if __name__ == "__main__":
    render(dict(front=front, right=right, back=back, left=left, up=ceiling_plain, down=floor),
           OUT_S + "RP_L3_CodeClinic_360.jpg", os.path.join(os.path.dirname(os.path.abspath(__file__)), "rp3"))
    print("ok")
