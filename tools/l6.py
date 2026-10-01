import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
from l1 import *

PURP = (170, 110, 235); WANG = (80, 220, 150)

def briefing6(im, d, part, title, intro, hints):
    d.text((S//2, 250), f"Lesson 6: part {part} of 2", font=font(44, True), fill=YELLOW, anchor="mm")
    d.text((S//2, 345), title, font=font(92, True), fill=WHITE, anchor="mm")
    d.text((S//2, 440), "OCR J277 1.3  |  Lesson 6: star and mesh network topologies", font=font(40), fill=SOFT, anchor="mm")
    d.rounded_rectangle((260, 510, S-260, 1060), 40, fill=PANEL, outline=YELLOW, width=6)
    y = para(d, (320, 560), intro, font(44), S-640)
    y = para(d, (320, y+30), "At each numbered station, record on your worksheet:", font(44, True), S-640, fill=YELLOW)
    bullets(d, (340, y+20), ["the key facts in your own words",
                             "your answer to the challenge question"], font(42), S-680, YELLOW)
    hint_row(d, 1130, hints)
    logo_plaque(im, S//2, 1640, 190)

def dev(d, x, y, label, col=(110,116,130), w=190, fnt=30, dead=False):
    oc = RED if dead else col
    d.rounded_rectangle((x-w//2, y-38, x+w//2, y+38), 14, fill=(40,20,26) if dead else (20,28,44), outline=oc, width=5)
    d.text((x, y), label, font=font(fnt, True), fill=(200,120,120) if dead else WHITE, anchor="mm")

def sw(d, x, y, label="Switch", w=200, dead=False):
    d.rounded_rectangle((x-w//2, y-40, x+w//2, y+40), 12, fill=(60,24,30) if dead else (40,46,58), outline=RED if dead else COL[1], width=6)
    d.text((x, y), label, font=font(32, True), fill=WHITE, anchor="mm")

def star(d, cx, cy, rad, n, labels=None, cut=None, dead_sw=False, w=170, hx=1.25, sww=180):
    pts = []
    for k in range(n):
        a = -math.pi/2 + k*2*math.pi/n
        pts.append((cx + rad*math.cos(a)*hx, cy + rad*math.sin(a)))
    for k, (x, y) in enumerate(pts):
        c = RED if (dead_sw or cut == k) else PURP
        d.line((cx, cy, x, y), fill=c, width=9)
        if cut == k:
            mx, my = (cx+x)/2, (cy+y)/2; cross(d, mx, my, 26)
    for k, (x, y) in enumerate(pts):
        dev(d, x, y, labels[k] if labels else "PC", w=w, fnt=26, dead=dead_sw or cut == k)
    sw(d, cx, cy, dead=dead_sw, w=sww)
    if dead_sw: cross(d, cx, cy-70, 34)

def ill_star(d, x0, y0, x1, y1, col):
    star(d, (x0+x1)//2, (y0+y1)//2, 150, 6, w=120, hx=2.3, sww=160)

def ill_star_cut(d, x0, y0, x1, y1, col):
    star(d, (x0+x1)//2, (y0+y1)//2, 150, 6, cut=1, w=120, hx=2.3, sww=160)

def ill_star_dead(d, x0, y0, x1, y1, col):
    star(d, (x0+x1)//2, (y0+y1)//2, 150, 6, dead_sw=True, w=120, hx=2.3, sww=160)

def ill_two(d, x0, y0, x1, y1, col):
    ax, bx, yy = x0+230, x1-230, (y0+y1)//2+30
    d.line((ax, yy, bx, yy), fill=YELLOW, width=12)
    d.text(((ax+bx)//2, yy+45), "Link cable", font=font(28, True), fill=YELLOW, anchor="mm")
    for cx, lab in ((ax, "Switch A"), (bx, "Switch B")):
        for k, (dx, dy) in enumerate(((-150, -140), (0, -160), (150, -140), (0, 150))):
            if cx == ax and dx > 100: continue
            if cx == bx and dx < -100: continue
            d.line((cx, yy, cx+dx, yy+dy), fill=PURP, width=8)
            d.rounded_rectangle((cx+dx-50, yy+dy-28, cx+dx+50, yy+dy+28), 10, fill=(20,28,44), outline=(110,116,130), width=4)
        sw(d, cx, yy, lab, w=190)

# ---- the break-it diagram (shared with the web page) ----
BREAK = dict(A=(560, 1000), B=(1490, 1000),
             devs=[("Reception", 300, 700, "A"), ("Sales 1", 300, 1300, "A"), ("Sales 2", 700, 1360, "A"),
                   ("Accounts", 1750, 700, "B"), ("Conference", 1750, 1300, "B"), ("File server", 1350, 1360, "B")])

def break_diagram(d, ox=0, oy=0):
    A, B = BREAK["A"], BREAK["B"]
    d.line((A[0]+ox, A[1]+oy, B[0]+ox, B[1]+oy), fill=YELLOW, width=12)
    d.text(((A[0]+B[0])//2+ox, A[1]+oy-45), "Link cable", font=font(32, True), fill=YELLOW, anchor="mm")
    for name, x, y, s in BREAK["devs"]:
        c = BREAK[s]
        d.line((c[0]+ox, c[1]+oy, x+ox, y+oy), fill=PURP, width=9)
    for name, x, y, s in BREAK["devs"]:
        dev(d, x+ox, y+oy, name, w=250, fnt=32, col=COL[4] if name == "File server" else (110,116,130))
    sw(d, A[0]+ox, A[1]+oy, "Switch A", w=230); sw(d, B[0]+ox, B[1]+oy, "Switch B", w=230)

# ================= SCENE 1: star =================
def st_front():
    im, d = base_wall()
    briefing6(im, d, 1, "Star networks",
        "You're in an office wired as a star network. Explore how it works, then break it: "
        "the wall to your left shows what happens when things fail.",
        [("Turn right", "Stations 1 and 2", COL[1]), ("Turn around", "Stations 3 and 4", COL[3]),
         ("Turn left", "Station 5: break it", COL[6]), ("Look down", "The office plan", YELLOW)])
    return im

def st_right():
    im, d = base_wall()
    station2(d, 100, 1, "Star topology", [
        "Every device connects to a central switch with its own cable.",
        "All data travels through the switch, which sends it on to the device it is meant for."],
        "Why is it called a star network? Sketch one with five computers on your worksheet.", ill_star)
    station2(d, 1068, 2, "Advantages of star", [
        "If one cable fails, only that device is affected.",
        "Easy to add a new device: just plug in one more cable.",
        "Fast and reliable: the switch only sends data where it needs to go."],
        "One cable in a star network is cut. Which devices lose their connection?", ill_star_cut)
    return im

def st_back():
    im, d = base_wall()
    station2(d, 100, 3, "Disadvantages of star", [
        "If the central switch fails, every device loses its connection. It is a single point of failure.",
        "Every device needs its own cable back to the switch, so it uses a lot of cable, which costs money."],
        "What is the biggest weakness of a star network? Explain why.", ill_star_dead)
    station2(d, 1068, 4, "Joining star networks", [
        "Bigger networks join several stars together by linking their switches with a cable.",
        "Devices on different switches communicate over this link."],
        "The link cable between two switches is cut. Who can still talk to whom?", ill_two)
    return im

def st_left():
    im, d = base_wall()
    d.rounded_rectangle((120, 330, S-120, 1720), 40, fill=PANEL, outline=COL[6], width=6)
    d.rounded_rectangle((120, 330, S-120, 460), 40, fill=COL[6]); d.rectangle((120, 420, S-120, 460), fill=COL[6])
    d.ellipse((150, 348, 244, 442), fill=WHITE)
    d.text((197, 395), "5", font=font(60, True), fill=COL[6], anchor="mm")
    d.text((280, 395), "Break it!", font=font(58, True), fill=(15,22,38), anchor="lm")
    d.text((S//2, 530), "This is the office network. Tap the badge to find out what happens when parts of it fail.",
           font=font(38), fill=WHITE, anchor="mm")
    break_diagram(d, 0, 30)
    d.text((S//2, 1560), "Use the diagram to predict before you answer.", font=font(38), fill=SOFT, anchor="mm")
    return im

def st_floor():
    im = Image.new("RGB", (S, S), (34, 40, 50)); d = ImageDraw.Draw(im)
    for x in range(0, S, 256): d.line((x, 0, x, S), fill=(46, 54, 66), width=5)
    d.rounded_rectangle((160, 160, S-160, S-160), 30, fill=(22, 32, 52), outline=YELLOW, width=6)
    d.text((S//2, 240), "Office floor plan: wired as two stars", font=font(56, True), fill=WHITE, anchor="mm")
    rooms = [("Reception", 220, 320, 800, 760), ("Sales", 820, 320, 1320, 760), ("Accounts", 1340, 320, 1830, 760),
             ("Conference room", 1340, 780, 1830, 1260), ("Server room", 220, 780, 800, 1260)]
    for n, a, b, c, e in rooms:
        d.rectangle((a, b, c, e), outline=(90,104,128), width=6)
        d.text((a+24, b+20), n, font=font(36, True), fill=SOFT)
    SA, SB = (1070, 1010), (1260, 1010)
    desks = [((500, 560), SA), ((1000, 560), SA), ((1170, 640), SA), ((1580, 560), SB), ((1580, 1060), SB), ((500, 1060), SB)]
    for (x, y), s in desks:
        d.line((x, y, *s), fill=PURP, width=10)
    for (x, y), s in desks:
        d.rounded_rectangle((x-60, y-40, x+60, y+40), 10, fill=(20,24,32), outline=(110,116,130), width=5)
    d.line((*SA, *SB), fill=YELLOW, width=12)
    sw(d, SA[0], SA[1], "A", w=110); sw(d, SB[0], SB[1], "B", w=110)
    d.rounded_rectangle((260, 1330, S-260, 1700), 24, fill=(14,22,40), outline=YELLOW, width=5)
    para(d, (300, 1360), "Each purple line is a UTP cable to a switch. The yellow line links the two switches. "
         "Trace a file from a computer in Sales to the server: which switches does it pass through?", font(40), S-600)
    return im

# ================= SCENE 2: mesh =================
def mesh_nodes(cx, cy, r, n):
    return [(cx + r*1.2*math.cos(-math.pi/2 + k*2*math.pi/n), cy + r*math.sin(-math.pi/2 + k*2*math.pi/n)) for k in range(n)]

def ill_full(d, x0, y0, x1, y1, col):
    P = mesh_nodes((x0+x1)//2, (y0+y1)//2+10, 160, 5)
    for i in range(5):
        for j in range(i+1, 5): d.line((*P[i], *P[j]), fill=PURP, width=7)
    for x, y in P: dev(d, x, y, "PC", w=110, fnt=28)

def ill_reroute(d, x0, y0, x1, y1, col):
    P = mesh_nodes((x0+x1)//2, (y0+y1)//2+10, 160, 5)
    for i in range(5):
        for j in range(i+1, 5):
            c = RED if (i, j) == (0, 2) else PURP
            d.line((*P[i], *P[j]), fill=c, width=7)
    mx, my = (P[0][0]+P[2][0])/2, (P[0][1]+P[2][1])/2; cross(d, mx, my, 24)
    d.line((*P[0], *P[1]), fill=GREEN, width=14); d.line((*P[1], *P[2]), fill=GREEN, width=14)
    for x, y in P: dev(d, x, y, "PC", w=110, fnt=28)
    d.text((x1-10, y1-20), "Rerouted", font=font(30, True), fill=GREEN, anchor="rm")

def router(d, x, y, r=46):
    d.ellipse((x-r, y-r, x+r, y+r), fill=(40,46,58), outline=COL[3], width=6)
    d.text((x, y), "R", font=font(34, True), fill=WHITE, anchor="mm")

def ill_partial(d, x0, y0, x1, y1, col):
    R = [(x0+140, y0+80), (x0+420, y0+50), (x1-150, y0+100), (x0+260, y1-150), (x1-330, y1-120)]
    for i, j in [(0,1),(1,2),(0,3),(1,3),(1,4),(2,4),(3,4)]: d.line((*R[i], *R[j]), fill=WANG, width=9)
    for (x, y), (dx, dy) in zip(R, [(-80, 90), (0, -1), (90, 60), (-100, 60), (100, 60)]):
        if dy == -1: continue
        d.line((x, y, x+dx, y+dy), fill=PURP, width=7)
        d.rounded_rectangle((x+dx-40, y+dy-26, x+dx+40, y+dy+26), 8, fill=(20,24,32), outline=(110,116,130), width=4)
    for x, y in R: router(d, x, y)
    d.text((x1-10, y1+8), "Green: WAN links   Purple: LAN links", font=font(26, True), fill=SOFT, anchor="rm")

def ill_wmesh(d, x0, y0, x1, y1, col):
    ov = Image.new("RGBA", (x1-x0, y1-y0), (0,0,0,0)); od = ImageDraw.Draw(ov)
    P = [(190, 190), (400, 150), (610, 210)]
    for x, y in P: od.ellipse((x-140, y-120, x+140, y+120), fill=(80, 220, 150, 60), outline=(80,220,150,255), width=4)
    d._image.paste(ov, (x0, y0), ov)
    for i in range(2): d.line((x0+P[i][0], y0+P[i][1], x0+P[i+1][0], y0+P[i+1][1]), fill=YELLOW, width=5)
    for x, y in P:
        d.ellipse((x0+x-30, y0+y-30, x0+x+30, y0+y+30), fill=(235,238,242), outline=GREEN, width=6)
    d.line((x0+P[0][0], y0+P[0][1]+30, x0+P[0][0], y1-20), fill=PURP, width=8)
    d.text((x0+P[0][0]+14, y1-40), "Only one WAP is cabled", font=font(26), fill=SOFT)

def me_front():
    im, d = base_wall()
    briefing6(im, d, 2, "Mesh networks",
        "In a mesh, devices connect to many other devices, so data has more than one route. "
        "Find out how full mesh, partial mesh and wireless mesh networks compare with a star.",
        [("Turn right", "Stations 1 and 2", COL[1]), ("Turn around", "Stations 3 and 4", COL[3]),
         ("Turn left", "Station 5: star vs mesh", COL[6]), ("Look down", "Wireless mesh plan", YELLOW)])
    return im

def me_right():
    im, d = base_wall()
    station2(d, 100, 1, "Full mesh", [
        "Every device is connected directly to every other device.",
        "Data can travel along many different routes to reach its destination."],
        "Count the cables in the picture. How many would you need to connect four devices in a full mesh?", ill_full)
    station2(d, 1068, 2, "Mesh: pros and cons", [
        "No single point of failure: if a link fails, data is rerouted along another path.",
        "Can handle lots of traffic, because data is spread across many routes.",
        "Needs a lot of cable and is difficult to set up, so it is expensive."],
        "Why would a bank's data centre choose a mesh rather than a star?", ill_reroute)
    return im

def me_back():
    im, d = base_wall()
    station2(d, 100, 3, "Partial mesh: the internet", [
        "In a partial mesh, devices connect to several others, but not to all of them.",
        "The internet is a partial mesh: routers link to a few other routers, so there is always another route."],
        "Why isn't the internet a full mesh?", ill_partial)
    station2(d, 1068, 4, "Wireless mesh", [
        "Wireless access points connect to each other by Wi-Fi. Each one must be in range of at least one other.",
        "Only one WAP needs a cable. Coverage is easy to extend, but data slows down as it hops between WAPs."],
        "Why might a wireless mesh be a good choice for a large house or an old building?", ill_wmesh)
    return im

def me_left():
    im, d = base_wall()
    d.rounded_rectangle((120, 330, S-120, 1720), 40, fill=PANEL, outline=COL[6], width=6)
    d.rounded_rectangle((120, 330, S-120, 460), 40, fill=COL[6]); d.rectangle((120, 420, S-120, 460), fill=COL[6])
    d.ellipse((150, 348, 244, 442), fill=WHITE)
    d.text((197, 395), "5", font=font(60, True), fill=COL[6], anchor="mm")
    d.text((280, 395), "Star vs mesh", font=font(58, True), fill=(15,22,38), anchor="lm")
    d.text((S//2, 530), "Compare the two. Then tap the badge to sort statements into star or mesh.",
           font=font(38), fill=WHITE, anchor="mm")
    star(d, 560, 1010, 250, 6, w=140)
    d.text((560, 1440), "Star", font=font(56, True), fill=COL[1], anchor="mm")
    P = mesh_nodes(1490, 1010, 290, 6)
    for i in range(6):
        for j in range(i+1, 6): d.line((*P[i], *P[j]), fill=PURP, width=7)
    for x, y in P: dev(d, x, y, "PC", w=130, fnt=28)
    d.text((1490, 1440), "Full mesh", font=font(56, True), fill=COL[3], anchor="mm")
    d.text((S//2, 1570), "Same six computers. Which uses more cable? What happens if one part fails?", font=font(38), fill=SOFT, anchor="mm")
    return im

def me_floor():
    im = Image.new("RGB", (S, S), (34, 40, 50)); d = ImageDraw.Draw(im)
    for x in range(0, S, 256): d.line((x, 0, x, S), fill=(46, 54, 66), width=5)
    d.rounded_rectangle((160, 160, S-160, S-160), 30, fill=(22, 32, 52), outline=YELLOW, width=6)
    d.text((S//2, 240), "Wireless mesh: covering the whole office", font=font(56, True), fill=WHITE, anchor="mm")
    ov = Image.new("RGBA", (S, S), (0,0,0,0)); od = ImageDraw.Draw(ov)
    W_ = [(480, 560), (960, 520), (1440, 580), (700, 1000), (1260, 1020)]
    for x, y in W_: od.ellipse((x-300, y-260, x+300, y+260), fill=(80,220,150,45), outline=(80,220,150,200), width=5)
    im.paste(ov, (0, 0), ov); d = ImageDraw.Draw(im)
    d.rectangle((260, 340, S-260, 1240), outline=(120,130,150), width=8)
    for a, b in [(0,1),(1,2),(0,3),(3,4),(1,4),(2,4)]: d.line((*W_[a], *W_[b]), fill=YELLOW, width=6)
    for x, y in W_:
        d.ellipse((x-40, y-40, x+40, y+40), fill=(235,238,242), outline=GREEN, width=8)
    d.line((480, 600, 480, 1240), fill=PURP, width=10)
    d.text((500, 1200), "Cable to router", font=font(32), fill=SOFT)
    d.rounded_rectangle((260, 1330, S-260, 1700), 24, fill=(14,22,40), outline=YELLOW, width=5)
    para(d, (300, 1360), "Each green circle is the range of one wireless access point. Yellow lines are wireless links "
         "between WAPs. Could you remove one WAP and still connect every part of the office?", font(40), S-600)
    return im

if __name__ == "__main__":
    out = OUT_S
    render(dict(front=st_front, right=st_right, back=st_back, left=st_left, up=ceiling_plain, down=st_floor),
           out + "L6_Part1_Star_360.jpg", os.path.join(os.path.dirname(os.path.abspath(__file__)), "l6s1"))
    render(dict(front=me_front, right=me_right, back=me_back, left=me_left, up=ceiling_plain, down=me_floor),
           out + "L6_Part2_Mesh_360.jpg", os.path.join(os.path.dirname(os.path.abspath(__file__)), "l6s2"))
    print("ok")
