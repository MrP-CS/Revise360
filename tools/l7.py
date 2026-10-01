import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
from l6 import *

def ill_types(d, x0, y0, x1, y1, col):
    cx = x0 + 110; cy = (y0+y1)//2
    monitor(d, cx-80, cy-80, 160)
    d.text((cx, cy+110), "Standalone", font=font(28, True), fill=SOFT, anchor="mm")
    mini_lan(d, x0+250, y0+60, "LAN")
    d.ellipse((x1-260, y0+50, x1-20, y0+250), outline=(255,160,40), width=8)
    for a in range(0, 360, 60):
        r = math.radians(a); px, py = x1-140+100*math.cos(r), y0+150+80*math.sin(r)
        d.ellipse((px-14, py-14, px+14, py+14), fill=WHITE)
    d.text((x1-140, y0+300), "WAN", font=font(30, True), fill=(255,160,40), anchor="mm")

def ill_perf(d, x0, y0, x1, y1, col):
    cx, cy = (x0+x1)//2, y1-60
    d.arc((cx-240, cy-240, cx+240, cy+240), 180, 360, fill=(60,70,90), width=40)
    d.arc((cx-240, cy-240, cx+240, cy+240), 180, 250, fill=GREEN, width=40)
    d.arc((cx-240, cy-240, cx+240, cy+240), 250, 310, fill=YELLOW, width=40)
    d.arc((cx-240, cy-240, cx+240, cy+240), 310, 360, fill=RED, width=40)
    a = math.radians(225); d.line((cx, cy, cx+200*math.cos(a), cy+200*math.sin(a)), fill=WHITE, width=12)
    d.ellipse((cx-22, cy-22, cx+22, cy+22), fill=WHITE)
    d.text((cx, cy+10), "Network speed", font=font(28, True), fill=SOFT, anchor="mt")

def ill_csp2p(d, x0, y0, x1, y1, col):
    sx = x0+90; server(d, sx, y0+70)
    for k in range(3):
        cy = y0+60+k*110
        d.line((sx+130, y0+180, x0+310, cy+35), fill=SOFT, width=5)
        d.rounded_rectangle((x0+310, cy, x0+400, cy+70), 10, fill=(20,24,32), outline=(110,116,130), width=4)
    d.text((x0+230, y1-10), "Client-server", font=font(28, True), fill=SOFT, anchor="mm")
    P = [(x1-260, y0+70), (x1-60, y0+70), (x1-260, y0+270), (x1-60, y0+270)]
    for i in range(4):
        for j in range(i+1, 4): d.line((*P[i], *P[j]), fill=PURP, width=5)
    for x, y in P: d.rounded_rectangle((x-45, y-35, x+45, y+35), 10, fill=(20,24,32), outline=PURP, width=4)
    d.text((x1-160, y1-10), "Peer-to-peer", font=font(28, True), fill=SOFT, anchor="mm")

def ill_hw(d, x0, y0, x1, y1, col):
    sw(d, x0+170, y0+110, "Switch", w=220); router(d, x1-160, y0+110, 60)
    d.text((x1-160, y0+200), "Router", font=font(30, True), fill=WHITE, anchor="mm")
    d.line((x0+280, y0+110, x1-220, y0+110), fill=PURP, width=10)
    d.ellipse((x0+140, y0+230, x0+220, y0+310), fill=(235,238,242), outline=GREEN, width=6)
    d.text((x0+180, y0+345), "WAP", font=font(28, True), fill=SOFT, anchor="mm")
    d.rectangle((x0+300, y0+250, x0+460, y0+310), fill=(30,110,70))
    d.text((x0+380, y0+345), "NIC", font=font(28, True), fill=SOFT, anchor="mm")
    d.line((x0+520, y0+280, x1-40, y0+280), fill=(255,160,40), width=14)
    d.text(((x0+520+x1-40)//2, y0+345), "Fibre", font=font(28, True), fill=SOFT, anchor="mm")

def ill_dns(d, x0, y0, x1, y1, col):
    d.rounded_rectangle((x0+20, y0+80, x0+120, y0+260), 18, fill=(20,24,32), outline=(110,116,130), width=5)
    d.text((x0+70, y0+290), "Browser", font=font(28, True), fill=SOFT, anchor="mm")
    for k in range(3):
        server(d, x0+300+k*40, y0+40+k*30)
    d.text((x0+400, y0+330), "DNS servers", font=font(28, True), fill=SOFT, anchor="mm")
    d.rectangle((x1-150, y0+60, x1-20, y0+280), fill=(30,34,44), outline=COL[4], width=5)
    d.text((x1-85, y0+170), "WEB", font=font(30, True), fill=COL[4], anchor="mm")
    d.text((x1-85, y0+310), "Web server", font=font(28, True), fill=SOFT, anchor="mm")
    d.line((x0+130, y0+140, x0+290, y0+140), fill=YELLOW, width=6)
    d.line((x0+130, y0+220, x1-160, y0+220), fill=GREEN, width=6)

def ill_topo(d, x0, y0, x1, y1, col):
    star(d, x0+175, (y0+y1)//2, 120, 5, w=86, hx=1.3, sww=116)
    P = mesh_nodes(x1-165, (y0+y1)//2, 120, 5)
    for i in range(5):
        for j in range(i+1, 5): d.line((*P[i], *P[j]), fill=PURP, width=5)
    for x, y in P: dev(d, x, y, "PC", w=90, fnt=24)

def front():
    im, d = base_wall()
    d.text((S//2, 250), "Lesson 7: catch-up and revision", font=font(44, True), fill=YELLOW, anchor="mm")
    d.text((S//2, 345), "Revision HQ", font=font(96, True), fill=WHITE, anchor="mm")
    d.text((S//2, 440), "OCR J277 1.3  |  Get ready for your mid-topic test on lessons 1 to 6", font=font(40), fill=SOFT, anchor="mm")
    d.rounded_rectangle((260, 510, S-260, 1060), 40, fill=PANEL, outline=YELLOW, width=6)
    y = para(d, (320, 560), "Each numbered station sums up one lesson. Read it, answer its quiz, and your "
             "score screen will show which lessons are secure and which you need to revise.", font(44), S-640)
    y = para(d, (320, y+30), "At each station, record on your worksheet:", font(44, True), S-640, fill=YELLOW)
    bullets(d, (340, y+20), ["three key facts in your own words",
                             "your answer to the challenge question"], font(42), S-680, YELLOW)
    hint_row(d, 1130, [("Turn right", "Lessons 1 and 2", COL[1]), ("Turn around", "Lessons 3 and 4", COL[3]),
                       ("Turn left", "Lessons 5 and 6", COL[5]), ("Look down", "Final challenge", YELLOW)])
    logo_plaque(im, S//2, 1640, 190)
    return im

def right():
    im, d = base_wall()
    station2(d, 100, 1, "Types of network", [
        "Standalone: not connected to any other computer.",
        "LAN: small area, one site, hardware owned by the organisation.",
        "WAN: large area, joins LANs, links rented from telecoms companies. The internet is the biggest WAN."],
        "What are the characteristics of LANs and WANs?", ill_types)
    station2(d, 1068, 2, "Network performance", [
        "Bandwidth: how much data can be sent per second.",
        "More users share the same bandwidth, so each gets less.",
        "Transmission media: fibre beats copper; wired is usually faster than wireless.",
        "Errors and interference mean data has to be sent again."],
        "More CCTV cameras will record to the file server. What should the network manager consider?", ill_perf, ill_h=330)
    return im

def back():
    im, d = base_wall()
    station2(d, 100, 3, "Client-server and P2P", [
        "Client-server: a server provides files, logins and backups; clients request them.",
        "Peer-to-peer: every computer is an equal peer and shares directly with the others.",
        "Client-server is easier to manage and back up, but costs more and has a single point of failure."],
        "Is torrenting client-server or peer-to-peer? Explain.", ill_csp2p, ill_h=340)
    station2(d, 1068, 4, "LAN hardware", [
        "Switch: connects devices in a LAN using MAC addresses.",
        "Router: connects networks together using IP addresses.",
        "WAP for wireless devices, NIC in every device, UTP copper up to 100 m, fibre for long distances."],
        "What is the difference between a switch and a router?", ill_hw, ill_h=360)
    return im

def left():
    im, d = base_wall()
    station2(d, 100, 5, "The internet", [
        "The internet is a worldwide collection of connected networks: a WAN.",
        "DNS is made up of many domain name servers that turn domain names into IP addresses.",
        "Hosting: websites are stored on web servers. The cloud: storage and software on remote servers."],
        "What is the advantage of working in the cloud?", ill_dns, ill_h=340)
    station2(d, 1068, 6, "Star and mesh", [
        "Star: every device connects to a central switch. If the switch fails, everything fails.",
        "Mesh: devices link to many others, so data is rerouted if a link fails, but it needs lots of cable.",
        "The internet is a partial mesh."],
        "Why is a mesh network more reliable than a star network?", ill_topo, ill_h=330)
    return im

def floor():
    im = Image.new("RGB", (S, S), (34, 40, 50)); d = ImageDraw.Draw(im)
    for x in range(0, S, 256): d.line((x, 0, x, S), fill=(46, 54, 66), width=5)
    d.rounded_rectangle((160, 160, S-160, S-160), 30, fill=(22, 32, 52), outline=YELLOW, width=6)
    d.text((S//2, 250), "Final challenge: how does a browser find a website?", font=font(52, True), fill=WHITE, anchor="mm")
    d.rounded_rectangle((330, 330, S-330, 700), 24, fill=(14,22,40), outline=YELLOW, width=5)
    para(d, (380, 370), "Someone types www.google.com into a browser. Tap the star badge and put the five "
         "steps in order, from typing the address to seeing the page.", font(42), S-760)
    # icons, deliberately unnumbered
    bx, dy = 470, 1050
    d.rounded_rectangle((bx-90, dy-150, bx+90, dy+150), 22, fill=(20,24,32), outline=(110,116,130), width=6)
    d.text((bx, dy+200), "Browser", font=font(40, True), fill=SOFT, anchor="mm")
    for k in range(3): server(d, 880+k*60, 880+k*45)
    d.text((1010, dy+200), "DNS servers", font=font(40, True), fill=SOFT, anchor="mm")
    d.rectangle((1480, 880, 1660, 1200), fill=(30,34,44), outline=COL[4], width=6)
    d.text((1570, 1040), "WEB", font=font(44, True), fill=COL[4], anchor="mm")
    d.text((1570, dy+200), "Web server", font=font(40, True), fill=SOFT, anchor="mm")
    for (a, b) in (((570, 960), (860, 960)), ((860, 1120), (570, 1120)), ((570, 1040), (1470, 1040))):
        d.line((*a, *b), fill=YELLOW, width=8)
    return im

if __name__ == "__main__":
    render(dict(front=front, right=right, back=back, left=left, up=ceiling_plain, down=floor),
           OUT_S + "L7_RevisionHQ_360.jpg", os.path.join(os.path.dirname(os.path.abspath(__file__)), "l7"))
    print("ok")
