import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
from lib360 import *
# ---------- illustrations ----------
def ill_switch(d, x0, y0, x1, y1, col):
    cy = (y0+y1)//2
    d.rounded_rectangle((x0+20, cy-80, x1-20, cy+80), 14, fill=(40, 46, 58), outline=(120,130,150), width=4)
    ports = 12; pw = (x1-x0-200)/ports
    for r in range(2):
        for i in range(ports):
            px = x0+100+i*pw; py = cy-55+r*62
            d.rectangle((px, py, px+pw-14, py+46), fill=(10,12,16), outline=(90,96,110), width=2)
            d.rectangle((px+6, py-10, px+18, py-3), fill=(80,255,120) if (i+r)%3 else (255,180,0))
    # cables going up
    for i in (1, 3, 4, 7, 9, 10):
        px = x0+100+i*pw + pw/2 - 7
        d.line((px, cy-60, px, y0), fill=(170,110,235), width=10)
    d.text((x0+40, cy+95), "24-port network switch", font=font(30), fill=SOFT)

def ill_utp(d, x0, y0, x1, y1, col):
    cy = (y0+y1)//2 - 20
    d.rounded_rectangle((x0+20, cy-35, x0+420, cy+35), 30, fill=(150, 95, 215))
    # RJ45 plug
    d.rectangle((x0+420, cy-50, x0+560, cy+50), fill=(215, 225, 235), outline=(140,150,160), width=3)
    for i in range(8): d.rectangle((x0+470+i*10, cy-40, x0+476+i*10, cy-5), fill=(210,170,60))
    # cut-away twisted pairs
    pairs = [((255,140,0),(255,230,200)), ((40,170,80),(210,245,210)),
             ((40,110,230),(210,225,250)), ((140,90,50),(235,215,195))]
    for k, (a, b) in enumerate(pairs):
        by = y0 + 30 + k*75
        xs = np.linspace(x0+600, x1-20, 120)
        pa = [(x, by+ 18*math.sin((x-x0)/22)) for x in xs]
        pb = [(x, by+ 18*math.sin((x-x0)/22 + math.pi)) for x in xs]
        d.line(pa, fill=a, width=12); d.line(pb, fill=b, width=12)
    d.line((x0+560, cy, x0+600, y0+60), fill=SOFT, width=3)
    d.text((x1-20, y1-45), "4 twisted pairs inside", font=font(30), fill=SOFT, anchor="ra")
    d.text((x0+40, cy+70), "RJ45 connector", font=font(30), fill=SOFT)

def ill_router(d, x0, y0, x1, y1, col):
    cx = (x0+x1)//2; cy = (y0+y1)//2 + 30
    d.rounded_rectangle((cx-260, cy-70, cx+260, cy+90), 24, fill=(50,56,70), outline=(130,140,160), width=4)
    for dx in (-200, 200):
        d.line((cx+dx, cy-70, cx+dx*1.15, cy-230), fill=(90,96,110), width=16)
    for i in range(4): d.ellipse((cx-180+i*50, cy-10, cx-156+i*50, cy+14), fill=(80,255,120))
    d.rectangle((cx+80, cy-20, cx+200, cy+40), fill=(10,12,16), outline=col, width=4)
    d.text((cx+140, cy+68), "WAN", font=font(26, True), fill=col, anchor="mm")
    d.text((x0+20, y1-40), "LAN side", font=font(30), fill=SOFT)
    d.text((x1-20, y1-40), "to the internet", font=font(30), fill=SOFT, anchor="ra")

def ill_fibre(d, x0, y0, x1, y1, col):
    cy = (y0+y1)//2
    d.rounded_rectangle((x0+20, cy-70, x1-20, cy+70), 70, fill=(255,150,40))
    d.rounded_rectangle((x0+50, cy-40, x1-50, cy+40), 40, fill=(40,40,55))
    d.rounded_rectangle((x0+70, cy-14, x1-70, cy+14), 14, fill=(150,220,255))
    for i in range(9):
        px = x0 + 110 + i*((x1-x0-240)/8)
        d.ellipse((px-22, cy-22, px+22, cy+22), fill=WHITE if i % 3 != 1 else (150,220,255))
    d.text(((x0+x1)//2, cy+110), "Glass core carrying pulses of light", font=font(30), fill=SOFT, anchor="ma")

def ill_nic(d, x0, y0, x1, y1, col):
    top = y0 + 40
    d.rectangle((x0+60, top, x1-160, top+230), fill=(30,110,70), outline=(20,70,45), width=4)
    for i in range(6): d.rectangle((x0+120+i*70, top+40, x0+170+i*70, top+90), fill=(20,20,24))
    d.rectangle((x0+300, top+120, x0+470, top+200), fill=(20,20,24))
    for i in range(22): d.rectangle((x0+120+i*24, top+230, x0+136+i*24, top+280), fill=(220,180,60))
    d.rectangle((x1-160, top-20, x1-120, top+300), fill=(180,186,196))
    d.rectangle((x1-150, top+40, x1-100, top+120), fill=(10,12,16), outline=col, width=4)
    d.text((x0+60, top+320), "Slots into the motherboard", font=font(30), fill=SOFT)
    d.text((x1-60, top+320), "Ethernet port", font=font(30), fill=SOFT, anchor="ra")

# ---------- walls ----------
def front():
    im, d = base_wall()
    d.text((S//2, 300), "Mission: wire up the school", font=font(96, True), fill=WHITE, anchor="mm")
    d.text((S//2, 400), "OCR J277 1.3  |  Lesson 4: hardware used to connect a LAN",
           font=font(40), fill=SOFT, anchor="mm")
    d.rounded_rectangle((260, 480, S-260, 1080), 40, fill=PANEL, outline=YELLOW, width=6)
    y = para(d, (320, 530), "You are standing in the school server room. Six pieces of network "
             "hardware are hidden around you, and one of them is above your head.",
             font(44), S-640)
    y = para(d, (320, y+30), "At each numbered station, record on your worksheet:", font(44, True), S-640, fill=YELLOW)
    bullets(d, (340, y+20), ["what the hardware is called",
                             "what job it does in the network",
                             "your answer to its challenge question"], font(42), S-680, YELLOW)
    # direction hints
    hints = [("Turn right", "Stations 1 and 2", COL[1]), ("Turn around", "Stations 3 and 4", COL[3]),
             ("Look up", "Station 5", COL[5]), ("Turn left", "Station 6", COL[6]),
             ("Look down", "The network map", YELLOW)]
    bw = 290; gap = 25; x = (S - (5*bw + 4*gap))//2
    for t, s, c in hints:
        d.rounded_rectangle((x, 1150, x+bw, 1380), 26, fill=(14,22,40), outline=c, width=5)
        d.text((x+bw//2, 1230), t, font=font(42, True), fill=c, anchor="mm")
        d.text((x+bw//2, 1305), s, font=font(32), fill=WHITE, anchor="mm")
        x += bw + gap
    d.text((S//2, 1500), "Finished? Look down and try the final challenge on the floor map.",
           font=font(38), fill=SOFT, anchor="mm")
    logo_plaque(im, S//2, 1720, 190)
    # server racks either side
    for rx in (40, S-220):
        d.rectangle((rx, 480, rx+180, 1850), fill=(30,34,44), outline=(80,88,104), width=4)
        for k in range(22):
            yy = 510 + k*60
            d.rectangle((rx+15, yy, rx+165, yy+44), fill=(44,50,62))
            d.ellipse((rx+130, yy+14, rx+146, yy+30), fill=(80,255,120) if k % 4 else (64,196,255))
    return im

def right():
    im, d = base_wall()
    station(d, 100, 1, "Switch", [
        "Connects devices together on a LAN.",
        "Receives data and forwards it only to the device it is meant for, using MAC addresses.",
        "Has many ports: one for each wired device."],
        "The switch in a computer room breaks. What happens to the PCs plugged into it, and why?",
        ill_switch)
    station(d, 1068, 2, "UTP cable", [
        "Copper wires twisted in pairs. The twist reduces interference.",
        "Cat5e and Cat6 are common types. Cheap, flexible and easy to fit with an RJ45 plug.",
        "Each cable run works up to about 100 m."],
        "Why wouldn't you use UTP cable to link two buildings that are 2 km apart?",
        ill_utp)
    return im

def back():
    im, d = base_wall()
    station(d, 100, 3, "Router", [
        "Connects different networks together, such as the school LAN and the internet.",
        "Sends packets towards their destination using IP addresses.",
        "Sits at the edge of the LAN."],
        "The router fails but the switches still work. Can students print to the class printer? Can they load a website? Explain.",
        ill_router)
    station(d, 1068, 4, "Fibre optic cable", [
        "Sends data as pulses of light through thin strands of glass.",
        "Very high bandwidth over long distances (many kilometres).",
        "Not affected by electrical interference, but costs more and is harder to install."],
        "Give two reasons why the undersea cables that carry the internet are fibre optic.",
        ill_fibre)
    return im

def left():
    im, d = base_wall()
    station(d, 100, 6, "Network interface card (NIC)", [
        "Hardware that lets a device connect to a network.",
        "Can be wired (Ethernet port) or wireless (built-in antenna).",
        "Every NIC has a unique MAC address, set when it is made."],
        "A desktop PC has a wired NIC but no wireless NIC. How must it connect to the school network?",
        ill_nic)
    # did you know panel
    x0, x1 = 1068, 1948
    d.rounded_rectangle((x0, 330, x1, 1200), 36, fill=PANEL, outline=YELLOW, width=6)
    d.text((x0+50, 380), "Did you know?", font=font(56, True), fill=YELLOW)
    y = para(d, (x0+50, 480), "A MAC address is written as six pairs of hexadecimal digits, like this:",
             font(38), x1-x0-100)
    d.rounded_rectangle((x0+50, y+20, x1-50, y+140), 20, fill=(10,16,30))
    d.text(((x0+x1)//2, y+80), "00-15-E9-2B-99-3C", font=ImageFont.truetype(F+"DejaVuSansMono-Bold.ttf", 62),
           fill=COL[6], anchor="mm")
    para(d, (x0+50, y+180), "Switches use MAC addresses to send data to the right device. "
         "You will meet them again in Lesson 11: IP and MAC addressing.", font(38), x1-x0-100)
    # desk with PC
    d.rectangle((x0+60, 1450, x1-60, 1490), fill=(90,70,50))
    d.rectangle((x0+120, 1490, x0+150, 1850), fill=(70,55,40)); d.rectangle((x1-150, 1490, x1-120, 1850), fill=(70,55,40))
    d.rounded_rectangle((x0+200, 1180+60, x0+560, 1420), 12, fill=(20,24,32), outline=(90,96,110), width=6)
    d.rectangle((x0+360, 1420, x0+400, 1450), fill=(90,96,110))
    d.rectangle((x1-360, 1250, x1-200, 1450), fill=(40,44,54), outline=(110,116,130), width=4)
    d.rectangle((x1-300, 1400, x1-260, 1425), fill=(10,12,16), outline=COL[6], width=3)
    d.line((x1-280, 1425, x1-280, 1850), fill=(170,110,235), width=10)
    return im

def ceiling():
    im = Image.new("RGB", (S, S), (26, 36, 56)); d = ImageDraw.Draw(im)
    for x in range(0, S, 256): d.line((x, 0, x, S), fill=(38, 50, 74), width=6)
    for y in range(0, S, 256): d.line((0, y, S, y), fill=(38, 50, 74), width=6)
    cx, cy = S//2, S//2
    for r, a in ((820, 60), (620, 90), (420, 130)):
        d.ellipse((cx-r, cy-r, cx+r, cy+r), outline=(80, 220, 150), width=10)
    d.ellipse((cx-170, cy-170, cx+170, cy+170), fill=(235, 238, 242), outline=(170,176,186), width=8)
    d.ellipse((cx-40, cy-40, cx+40, cy+40), fill=(80,220,150))
    # card (top of texture = towards back wall; readable when facing front and looking up)
    x0, x1, y0 = 224, 1824, 1110
    d.rounded_rectangle((x0, y0, x1, 1990), 36, fill=PANEL, outline=COL[5], width=6)
    d.rounded_rectangle((x0, y0, x1, y0+120), 36, fill=COL[5]); d.rectangle((x0, y0+80, x1, y0+120), fill=COL[5])
    d.ellipse((x0+30, y0+14, x0+122, y0+106), fill=WHITE)
    d.text((x0+76, y0+60), "5", font=font(60, True), fill=COL[5], anchor="mm")
    d.text((x0+150, y0+60), "Wireless access point (WAP)", font=font(54, True), fill=(15,22,38), anchor="lm")
    y = bullets(d, (x0+45, y0+160), ["Lets wireless devices join the wired network.",
                "Sends and receives data using radio waves. The rings show its range.",
                "Connected to a switch by a cable."], font(44), x1-x0-90, COL[5])
    challenge(d, x0+35, y+10, x1-35, "Why does a large school need lots of WAPs rather than one powerful one?", COL[5])
    d.line((cx, cy-170, cx, 90), fill=(170,110,235), width=12)
    d.text((cx+20, 150), "UTP cable to switch", font=font(34), fill=SOFT)
    return im

def floor():
    im = Image.new("RGB", (S, S), (34, 40, 50)); d = ImageDraw.Draw(im)
    for x in range(0, S, 256): d.line((x, 0, x, S), fill=(46, 54, 66), width=5)
    for y in range(0, S, 256): d.line((0, y, S, y), fill=(46, 54, 66), width=5)
    # map board: top of texture = towards front wall
    d.rounded_rectangle((160, 160, S-160, S-160), 40, fill=(20, 32, 54), outline=YELLOW, width=6)
    d.text((S//2, 240), "Network map: how it all connects", font=font(60, True), fill=WHITE, anchor="mm")
    def node(x, y, label, c, n=None, w=300):
        d.rounded_rectangle((x-w//2, y-60, x+w//2, y+60), 24, fill=PANEL, outline=c, width=6)
        d.text((x, y), label, font=font(40, True), fill=WHITE, anchor="mm")
        if n: 
            d.ellipse((x-w//2-30, y-90, x-w//2+30, y-30), fill=c)
            d.text((x-w//2, y-60), str(n), font=font(36, True), fill=(15,22,38), anchor="mm")
    P = {"net": (S//2, 420), "router": (S//2, 720), "switch": (S//2, 1010),
         "pc1": (480, 1320), "pc2": (S//2, 1320), "wap": (1570, 1320),
         "lap": (1420, 1620), "phone": (1760, 1620)}
    d.line((*P["net"], *P["router"]), fill=COL[4], width=18)
    d.line((*P["router"], *P["switch"]), fill=COL[2], width=14)
    for k in ("pc1", "pc2", "wap"): d.line((*P["switch"], *P[k]), fill=COL[2], width=14)
    for k in ("lap", "phone"):
        (ax, ay), (bx, by) = P["wap"], P[k]
        for t in np.linspace(0.25, 0.75, 4):
            px, py = ax+(bx-ax)*t, ay+(by-ay)*t
            d.arc((px-30, py-30, px+30, py+30), 200, 340, fill=COL[5], width=6)
    d.ellipse((P["net"][0]-230, 320, P["net"][0]+230, 520), fill=(60,80,120), outline=WHITE, width=5)
    d.text(P["net"], "The internet", font=font(44, True), fill=WHITE, anchor="mm")
    node(*P["router"], "Router", COL[3], 3)
    node(*P["switch"], "Switch", COL[1], 1)
    node(*P["pc1"], "Desktop PC", COL[6], 6, 320)
    node(*P["pc2"], "Printer", COL[6], None, 320)
    node(*P["wap"], "WAP", COL[5], 5)
    node(*P["lap"], "Laptop", COL[6], None, 250)
    node(*P["phone"], "Phone", COL[6], None, 250)
    d.text((1140, 560), "Fibre optic (4)", font=font(34), fill=COL[4])
    d.text((1140, 860), "UTP cable (2)", font=font(34), fill=COL[2])
    d.text((1240, 1520), "Wi-Fi", font=font(34), fill=COL[5])
    d.rounded_rectangle((230, 1440, 1230, 1830), 24, fill=(14,22,40), outline=YELLOW, width=5)
    d.text((265, 1465), "Final challenge", font=font(46, True), fill=YELLOW)
    para(d, (265, 1535), "A student on the laptop opens a website. List, in order, every device "
         "and connection the request passes through to reach the internet.", font(40), 930)
    d.text((S//2, S-200), "You are standing here, in the server room", font=font(30), fill=SOFT, anchor="mm")
    return im


render(dict(front=front, right=right, back=back, left=left, up=ceiling, down=floor),
       OUT_S + "L4_LAN_Hardware_ServerRoom_360.jpg", os.path.join(os.path.dirname(os.path.abspath(__file__)), "l4"))
print("ok")
