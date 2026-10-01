import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
from lib360 import *
import json

GREEN = (80, 220, 150); RED = (255, 95, 95)

def station2(d, x0, n, title, what, chal, draw_fn, col=None, ill_h=390, w=880, top=330):
    col = col or COL[n]; x1 = x0 + w
    card(d, (x0, top, x1, 1800), n, title, col)
    draw_fn(d, x0 + 40, top + 170, x1 - 40, top + 170 + ill_h, col)
    y = bullets(d, (x0+45, top + 200 + ill_h), what, font(43), w-90, col)
    challenge(d, x0+35, y+25, x1-35, chal, col)

def briefing(im, d, part, title, intro, hints):
    d.text((S//2, 250), f"Zoom out: part {part} of 3", font=font(44, True), fill=YELLOW, anchor="mm")
    d.text((S//2, 345), title, font=font(92, True), fill=WHITE, anchor="mm")
    d.text((S//2, 440), "OCR J277 1.3  |  Lesson 1: types of network", font=font(40), fill=SOFT, anchor="mm")
    d.rounded_rectangle((260, 510, S-260, 1060), 40, fill=PANEL, outline=YELLOW, width=6)
    y = para(d, (320, 560), intro, font(44), S-640)
    y = para(d, (320, y+30), "At each numbered station, record on your worksheet:", font(44, True), S-640, fill=YELLOW)
    bullets(d, (340, y+20), ["the key facts in your own words",
                             "your answer to the challenge question"], font(42), S-680, YELLOW)
    hint_row(d, 1130, hints)
    logo_plaque(im, S//2, 1640, 190)

def hint_row(d, y0, hints):
    bw = 330 if len(hints) <= 4 else 290; gap = 30; x = (S - (len(hints)*bw + (len(hints)-1)*gap))//2
    for t, s, c in hints:
        d.rounded_rectangle((x, y0, x+bw, y0+230), 26, fill=(14,22,40), outline=c, width=5)
        d.text((x+bw//2, y0+80), t, font=font(42, True), fill=c, anchor="mm")
        for i, ln in enumerate(wrap(d, s, font(32), bw-30)):
            d.text((x+bw//2, y0+150+i*40), ln, font=font(32), fill=WHITE, anchor="mm")
        x += bw + gap

def zoom_floor(level, note):
    im = Image.new("RGB", (S, S), (34, 40, 50)); d = ImageDraw.Draw(im)
    for x in range(0, S, 256): d.line((x, 0, x, S), fill=(46, 54, 66), width=5)
    for y in range(0, S, 256): d.line((0, y, S, y), fill=(46, 54, 66), width=5)
    cx, cy = S//2, S//2
    rings = [(260, "1  One computer: standalone"), (560, "2  One site: LAN"), (860, "3  The whole world: WAN")]
    for i, (r, lab) in reversed(list(enumerate(rings))):
        on = (i + 1 == level); done = (i + 1 < level)
        c = YELLOW if on else (GREEN if done else (90, 104, 128))
        d.ellipse((cx-r, cy-r, cx+r, cy+r), fill=(40, 56, 88) if on else (28, 36, 52), outline=c, width=14 if on else 6)
        f = font(48 if on else 40, True)
        tw = d.textlength(lab, font=f)
        d.rounded_rectangle((cx-tw/2-30, cy-r-50, cx+tw/2+30, cy-r+50), 24, fill=(20, 28, 44), outline=c, width=5)
        d.text((cx, cy-r), lab, font=f, fill=c, anchor="mm")
    d.ellipse((cx-40, cy-40, cx+40, cy+40), fill=YELLOW)
    d.text((cx, cy+90), "You are here", font=font(40, True), fill=YELLOW, anchor="mm")
    lines = wrap(d, note, font(40), 820)
    d.rounded_rectangle((cx-460, cy+300, cx+460, cy+300+60+len(lines)*52), 24, fill=(20,28,44), outline=YELLOW, width=4)
    for i, ln in enumerate(lines):
        d.text((cx, cy+356+i*52), ln, font=font(40), fill=WHITE, anchor="mm")
    return im

# ---------------- illustrations ----------------
def monitor(d, x, y, w=260, col=(20,24,32)):
    h = int(w*0.62)
    d.rounded_rectangle((x, y, x+w, y+h), 12, fill=col, outline=(110,116,130), width=6)
    d.rectangle((x+w//2-18, y+h, x+w//2+18, y+h+30), fill=(110,116,130))
    d.rectangle((x+w//2-70, y+h+30, x+w//2+70, y+h+44), fill=(110,116,130))
    return y+h+44

def tower(d, x, y, h=220):
    d.rectangle((x, y, x+100, y+h), fill=(40,44,54), outline=(110,116,130), width=4)
    d.ellipse((x+38, y+30, x+62, y+54), fill=(80,255,120))

def cross(d, x, y, r=40, c=RED):
    d.line((x-r, y-r, x+r, y+r), fill=c, width=14); d.line((x-r, y+r, x+r, y-r), fill=c, width=14)

def ill_alone(d, x0, y0, x1, y1, col):
    monitor(d, x0+120, y0+40); tower(d, x0+430, y0+60)
    d.line((x0+480, y0+280, x0+640, y0+280), fill=(150,95,215), width=10)
    cross(d, x0+700, y0+280)
    d.text((x0+700, y0+340), "No network", font=font(32, True), fill=RED, anchor="mm")

def usb(d, x, y):
    d.rounded_rectangle((x, y, x+130, y+60), 10, fill=(64,196,255))
    d.rectangle((x+130, y+12, x+180, y+48), fill=(200,206,214))

def ill_usb(d, x0, y0, x1, y1, col):
    monitor(d, x0+20, y0+60, 220); monitor(d, x1-240, y0+60, 220)
    usb(d, (x0+x1)//2-90, y0+110)
    for i in range(6):
        xx = x0+260+i*60
        d.line((xx, y0+260, xx+30, y0+260), fill=YELLOW, width=8)
    d.polygon([(x1-270, y0+245), (x1-270, y0+275), (x1-250, y0+260)], fill=YELLOW)
    d.text(((x0+x1)//2, y0+330), "Copy, carry, copy again", font=font(32), fill=SOFT, anchor="mm")

def printer(d, x, y, w=240):
    d.rectangle((x+30, y, x+w-30, y+50), fill=(235,238,242))
    d.rounded_rectangle((x, y+50, x+w, y+170), 16, fill=(70,76,90), outline=(130,140,160), width=4)
    d.rectangle((x+40, y+140, x+w-40, y+200), fill=(245,245,245))
    d.ellipse((x+w-50, y+75, x+w-30, y+95), fill=(80,255,120))

def ill_printer(d, x0, y0, x1, y1, col):
    monitor(d, x0+40, y0+60, 240); printer(d, x1-300, y0+90)
    d.line((x0+280, y0+230, x1-300, y0+230), fill=(200,206,214), width=8)
    d.text(((x0+x1)//2, y0+200), "USB cable", font=font(30), fill=SOFT, anchor="mm")
    d.text(((x0+x1)//2, y0+330), "One printer for one computer", font=font(32), fill=SOFT, anchor="mm")

def ill_backup(d, x0, y0, x1, y1, col):
    cx = (x0+x1)//2
    d.rounded_rectangle((cx-200, y0+60, cx+200, y0+300), 20, fill=(60,66,80), outline=(130,140,160), width=5)
    d.ellipse((cx-90, y0+100, cx+90, y0+280), fill=(150,160,176), outline=(90,96,110), width=6)
    d.ellipse((cx-18, y0+172, cx+18, y0+208), fill=(60,66,80))
    d.polygon([(cx+170, y0+20), (cx+250, y0+160), (cx+90, y0+160)], fill=YELLOW)
    d.text((cx+170, y0+110), "!", font=font(80, True), fill=(20,22,30), anchor="mm")
    d.text((cx, y0+340), "One hard drive, no copy", font=font(32), fill=SOFT, anchor="mm")

def switch_box(d, x, y, w=300):
    d.rounded_rectangle((x, y, x+w, y+60), 10, fill=(40,46,58), outline=(120,130,150), width=4)
    n = max(3, (w-30)//34)
    for i in range(n): d.rectangle((x+20+i*34, y+18, x+44+i*34, y+42), fill=(10,12,16))

def server(d, x, y):
    d.rectangle((x, y, x+130, y+230), fill=(30,34,44), outline=(110,116,130), width=4)
    for k in range(5):
        d.rectangle((x+12, y+15+k*42, x+118, y+45+k*42), fill=(44,50,62))
        d.ellipse((x+95, y+24+k*42, x+107, y+36+k*42), fill=(80,255,120))

def ill_lan(d, x0, y0, x1, y1, col):
    d.rounded_rectangle((x0, y0, x1, y1-10), 30, outline=YELLOW, width=4)
    d.text((x0+30, y0+15), "One site", font=font(30, True), fill=YELLOW)
    sx = (x0+x1)//2-180; sy = y0+250
    switch_box(d, sx, sy, 300)
    for i in range(3):
        mx = x0+70+i*210
        monitor(d, mx, y0+70, 130)
        d.line((mx+65, y0+195, sx+40+i*90, sy), fill=(150,95,215), width=8)
    server(d, x1-150, y0+100); d.line((sx+300, sy+30, x1-150, y0+280), fill=(150,95,215), width=8)
    d.text((x1-85, y0+345), "Server", font=font(26), fill=SOFT, anchor="mm")

def folder(d, x, y, c=YELLOW):
    d.rectangle((x, y, x+50, y+14), fill=c); d.rounded_rectangle((x, y+10, x+100, y+80), 8, fill=c)

def ill_share(d, x0, y0, x1, y1, col):
    server(d, x0+60, y0+80)
    folder(d, x0+230, y0+60); folder(d, x0+230, y0+170, (64,196,255)); folder(d, x0+230, y0+280, GREEN)
    for i in range(3):
        mx = x1-230; my = y0+20+i*120
        d.line((x0+340, y0+100+i*110, mx, my+45), fill=SOFT, width=5)
        d.rounded_rectangle((mx, my, mx+200, my+95), 10, fill=(20,24,32), outline=(110,116,130), width=5)

def ill_tick(d, x0, y0, x1, y1, col):
    cx = (x0+x1)//2; cy = (y0+y1)//2
    d.ellipse((cx-110, cy-110, cx+110, cy+110), fill=(24,60,50), outline=GREEN, width=10)
    d.line([(cx-55, cy), (cx-15, cy+45), (cx+60, cy-50)], fill=GREEN, width=22, joint="curve")

def ill_virus(d, x0, y0, x1, y1, col):
    cx = (x0+x1)//2; cy = (y0+y1)//2
    for k in range(12):
        a = k*math.pi/6
        d.line((cx+80*math.cos(a), cy+80*math.sin(a), cx+130*math.cos(a), cy+130*math.sin(a)), fill=RED, width=12)
        d.ellipse((cx+130*math.cos(a)-16, cy+130*math.sin(a)-16, cx+130*math.cos(a)+16, cy+130*math.sin(a)+16), fill=RED)
    d.ellipse((cx-90, cy-90, cx+90, cy+90), fill=(90,30,40), outline=RED, width=10)
    for (dx, dy) in ((-30,-20), (25,10), (-5,40)): d.ellipse((cx+dx-14, cy+dy-14, cx+dx+14, cy+dy+14), fill=RED)

def mini_lan(d, x, y, label):
    d.rounded_rectangle((x, y, x+260, y+200), 24, outline=YELLOW, width=4)
    for i in range(3): d.rounded_rectangle((x+20+i*80, y+40, x+80+i*80, y+85), 6, fill=(20,24,32), outline=(110,116,130), width=3)
    switch_box(d, x+50, y+110, 160)
    d.text((x+130, y+230), label, font=font(30, True), fill=YELLOW, anchor="mm")

def ill_wan(d, x0, y0, x1, y1, col):
    mini_lan(d, x0+10, y0+30, "LAN in town A"); mini_lan(d, x1-270, y0+30, "LAN in town B")
    pts = [(x0+270, y0+160)] + [(x0+270 + t*(x1-x0-540), y0+160 - 110*math.sin(t*math.pi)) for t in np.linspace(0, 1, 40)] + [(x1-270, y0+160)]
    d.line(pts, fill=(255,160,40), width=12)
    d.text(((x0+x1)//2, y0+20), "WAN link", font=font(32, True), fill=(255,160,40), anchor="mm")

def ill_sea(d, x0, y0, x1, y1, col):
    for k in range(4):
        pts = [(x, y0+120+k*55 + 14*math.sin((x-x0)/40 + k)) for x in range(x0, x1, 8)]
        d.line(pts, fill=(64,140,220), width=8)
    d.rectangle((x0, y1-60, x1, y1-20), fill=(90,80,60))
    d.line((x0+20, y1-70, x1-20, y1-70), fill=(255,160,40), width=14)
    d.text(((x0+x1)//2, y1-110), "Undersea fibre optic cable", font=font(30, True), fill=(255,160,40), anchor="mm")
    # satellite dish
    d.pieslice((x1-200, y0-10, x1-60, y0+130), 200, 20, fill=(200,206,214))
    d.line((x1-130, y0+60, x1-130, y0+110), fill=(200,206,214), width=10)
    d.text((x1-130, y0+130), "Satellite", font=font(28), fill=SOFT, anchor="mt")

# ---------------- generic walls ----------------
def ceiling_plain():
    im = Image.new("RGB", (S, S), (26, 36, 56)); d = ImageDraw.Draw(im)
    for x in range(0, S, 256): d.line((x, 0, x, S), fill=(38, 50, 74), width=6)
    for y in range(0, S, 256): d.line((0, y, S, y), fill=(38, 50, 74), width=6)
    for (x, y) in ((512, 512), (1536, 512), (512, 1536), (1536, 1536)):
        d.rounded_rectangle((x-200, y-60, x+200, y+60), 12, fill=(235, 240, 250))
    return im

# ================= SCENE 1: standalone =================
def s1_front():
    im, d = base_wall()
    briefing(im, d, 1, "One computer on its own",
        "Lesson 1 zooms out: from one computer on its own, to a whole school, to the whole world. "
        "This is a bedroom with one standalone computer. Find out what life is like without a network.",
        [("Turn right", "Stations 1 and 2", COL[1]), ("Turn around", "Stations 3 and 4", COL[3]),
         ("Turn left", "Predict", COL[6]), ("Look down", "Your journey", YELLOW)])
    return im

def s1_right():
    im, d = base_wall()
    station2(d, 100, 1, "Standalone computer", [
        "A computer that is not connected to any other computer or network.",
        "Its files, software and hardware can only be used on that one machine."],
        "Name one device in your home that is standalone and one that is on a network.", ill_alone)
    station2(d, 1068, 2, "Sharing a file", [
        "Without a network, files must be copied onto removable media, such as a USB stick.",
        "The stick is then carried to the other computer and copied again."],
        "You and a friend both edit the same essay by passing a USB stick back and forth. What could go wrong?", ill_usb)
    return im

def s1_back():
    im, d = base_wall()
    station2(d, 100, 3, "Printing", [
        "Each standalone computer needs its own printer, plugged in directly.",
        "A room of 30 standalone computers could need 30 printers."],
        "Why would this be a problem for a school's budget?", ill_printer)
    station2(d, 1068, 4, "Updates and backups", [
        "Software must be installed and updated on every computer separately.",
        "Each computer has to be backed up on its own, which is easy to forget."],
        "This computer's hard drive fails tonight and it has never been backed up. What is lost?", ill_backup)
    return im

def s1_left():
    im, d = base_wall()
    x0, x1 = 300, S-300
    d.rounded_rectangle((x0, 330, x1, 1500), 40, fill=PANEL, outline=COL[6], width=6)
    d.text((S//2, 430), "Predict", font=font(72, True), fill=COL[6], anchor="mm")
    para(d, (x0+60, 510), "Every problem in this room can be solved by connecting computers together. "
         "Before you zoom out, predict how a network would help with each one.", font(44), x1-x0-120)
    rows = [("Sharing files", COL[2]), ("Printing", COL[3]), ("Installing updates", COL[4]), ("Backing up", COL[5])]
    y = 720
    for t, c in rows:
        d.rounded_rectangle((x0+60, y, x0+560, y+150), 20, fill=(14,22,40), outline=c, width=5)
        d.text((x0+310, y+75), t, font=font(44, True), fill=c, anchor="mm")
        d.text((x0+620, y+75), "With a network...", font=font(42), fill=SOFT, anchor="lm")
        d.line((x0+1000, y+110, x1-60, y+110), fill=(90,104,128), width=4)
        y += 180
    d.text((S//2, 1600), "Check your predictions in part 2.", font=font(40), fill=SOFT, anchor="mm")
    return im

# ================= SCENE 2: LAN =================
def s2_front():
    im, d = base_wall()
    briefing(im, d, 2, "One site: the school LAN",
        "You have zoomed out to a school computer room. Every computer here is connected to the "
        "same network. Were your predictions right?",
        [("Turn right", "Stations 1 and 2", COL[1]), ("Turn around", "Stations 3 and 4", GREEN),
         ("Turn left", "The LAN map", COL[6]), ("Look down", "Your journey", YELLOW)])
    return im

def s2_right():
    im, d = base_wall()
    station2(d, 100, 1, "Local area network (LAN)", [
        "Covers a small geographical area, such as one building or one school site.",
        "The organisation owns and manages all of the hardware.",
        "Devices connect with cables or Wi-Fi."],
        "Is the Wi-Fi network in your home a LAN? Use the definition to explain.", ill_lan)
    station2(d, 1068, 2, "Sharing resources", [
        "Files saved on a file server can be opened from any computer.",
        "One printer can be shared by a whole room.",
        "You can log on at any computer and see your own files."],
        "Name three things in your school that are shared over the LAN.", ill_share)
    return im

def s2_back():
    im, d = base_wall()
    station2(d, 100, 3, "Advantages of networks", [
        "Share files and hardware, such as printers.",
        "Install software and updates on every computer from one place.",
        "Back up everyone's data centrally.",
        "Communicate using email and messaging."],
        "Which advantage do you think saves the school the most money? Justify your choice.",
        ill_tick, col=GREEN, ill_h=280)
    station2(d, 1068, 4, "Disadvantages of networks", [
        "Viruses and malware can spread from one computer to many.",
        "Servers, switches and cabling are expensive.",
        "A network manager is needed to run it.",
        "If the file server fails, nobody can reach their files."],
        "How could a school reduce the risk of a virus spreading across its network?",
        ill_virus, col=RED, ill_h=280)
    return im

def s2_left():
    im, d = base_wall()
    x0, x1 = 160, S-160
    d.rounded_rectangle((x0, 330, x1, 1560), 40, fill=PANEL, outline=COL[6], width=6)
    d.text((S//2, 420), "The LAN in this room", font=font(64, True), fill=COL[6], anchor="mm")
    sx = S//2-200; sy = 900
    switch_box(d, sx, sy, 400)
    d.text((S//2, sy+100), "Switch", font=font(36, True), fill=WHITE, anchor="mm")
    for i in range(6):
        mx = x0+90+i*290
        monitor(d, mx, 540, 200)
        d.line((mx+100, 710, sx+30+i*66, sy), fill=(150,95,215), width=8)
    server(d, x0+140, 1080); d.text((x0+205, 1340), "File server", font=font(34, True), fill=WHITE, anchor="mm")
    d.line((x0+270, 1150, sx, sy+30), fill=(150,95,215), width=8)
    printer(d, x1-420, 1110); d.text((x1-300, 1340), "Shared printer", font=font(34, True), fill=WHITE, anchor="mm")
    d.line((x1-300, 1110, sx+400, sy+30), fill=(150,95,215), width=8)
    d.text((S//2, 1470), "Worksheet task: sketch this LAN using the icons and cable types shown here.",
           font=font(40), fill=YELLOW, anchor="mm")
    return im

def s2_ceiling():
    im = ceiling_plain(); d = ImageDraw.Draw(im); cx = cy = S//2
    for r in (520, 360): d.ellipse((cx-r, cy-r, cx+r, cy+r), outline=GREEN, width=8)
    d.ellipse((cx-140, cy-140, cx+140, cy+140), fill=(235,238,242), outline=(170,176,186), width=8)
    d.ellipse((cx-34, cy-34, cx+34, cy+34), fill=GREEN)
    return im

# ================= SCENE 3: WAN =================
_LAND_CACHE = None
def _land():
    """Coastline outlines, loaded on first use and only by this one scene."""
    global _LAND_CACHE
    if _LAND_CACHE is None:
        try:
            _LAND_CACHE = json.load(open(str(LAND)))
        except FileNotFoundError:
            raise SystemExit(
                f"{LAND} is missing. It is needed only for the 1.3 world map scene:\n"
                "drop land.geojson beside tools/paths.py, or point R360_LAND at a copy.")
    return _LAND_CACHE
CITIES = {"London": (51.5, -0.1), "New York": (40.7, -74), "Los Angeles": (34, -118),
          "São Paulo": (-23.5, -46.6), "Cape Town": (-33.9, 18.4), "Mumbai": (19, 72.8),
          "Singapore": (1.3, 103.8), "Tokyo": (35.7, 139.7), "Sydney": (-33.9, 151.2)}
LINKS = [("London", "New York"), ("New York", "Los Angeles"), ("London", "Mumbai"),
         ("Mumbai", "Singapore"), ("Singapore", "Tokyo"), ("Singapore", "Sydney"), ("London", "Cape Town"),
         ("New York", "São Paulo"), ("São Paulo", "Cape Town")]

def world_map(d, x0, y0, x1, y1):
    la0, la1 = 75, -58
    def P(lat, lon): return (x0 + (lon+180)/360*(x1-x0), y0 + (la0-lat)/(la0-la1)*(y1-y0))
    d.rounded_rectangle((x0-20, y0-20, x1+20, y1+20), 30, fill=(14, 30, 56), outline=LINE, width=5)
    for lon in range(-150, 180, 30): d.line((*P(la0, lon), *P(la1, lon)), fill=(24, 44, 76), width=2)
    for lat in (60, 30, 0, -30): d.line((*P(lat, -180), *P(lat, 180)), fill=(24, 44, 76), width=2)
    for f in _land()["features"]:
        for ring in [f["geometry"]["coordinates"][0]]:
            pts = [P(max(min(la, la0), la1), lo) for lo, la in ring]
            if len(pts) > 2: d.polygon(pts, fill=(52, 84, 120))
    for a, b in LINKS:
        pa, pb = P(*CITIES[a]), P(*CITIES[b])
        mx, my = (pa[0]+pb[0])/2, (pa[1]+pb[1])/2 - abs(pa[0]-pb[0])*0.18
        pts = [((1-t)**2*pa[0] + 2*(1-t)*t*mx + t*t*pb[0], (1-t)**2*pa[1] + 2*(1-t)*t*my + t*t*pb[1]) for t in np.linspace(0, 1, 50)]
        d.line(pts, fill=(255, 160, 40), width=6)
    for n, (la, lo) in CITIES.items():
        x, y = P(la, lo)
        d.ellipse((x-14, y-14, x+14, y+14), fill=WHITE, outline=(255,160,40), width=5)
        d.text((x, y+22), n, font=font(28, True), fill=WHITE, anchor="mt")

def s3_front():
    im, d = base_wall()
    d.text((S//2, 230), "Zoom out: part 3 of 3", font=font(44, True), fill=YELLOW, anchor="mm")
    d.text((S//2, 325), "The whole world: WANs", font=font(92, True), fill=WHITE, anchor="mm")
    d.text((S//2, 420), "Each dot is a city full of LANs. The orange links join them into a wide area network.",
           font=font(40), fill=SOFT, anchor="mm")
    world_map(d, 200, 520, S-200, 1330)
    hint_row(d, 1400, [("Turn right", "Stations 1 and 2", COL[1]), ("Turn around", "LAN vs WAN", COL[3]),
                       ("Turn left", "Exit question", COL[6]), ("Look up", "Satellite", COL[5])])
    logo_plaque(im, S//2, 1790, 130, pad=26)
    return im

def s3_right():
    im, d = base_wall()
    station2(d, 100, 1, "Wide area network (WAN)", [
        "Covers a large geographical area: across towns, countries or the whole world.",
        "Connects LANs together.",
        "The internet is the biggest WAN."],
        "A school trust links the LANs of its schools in different towns. Is that a LAN or a WAN? Why?", ill_wan)
    station2(d, 1068, 2, "Who owns the connections?", [
        "WAN links are usually owned by telecoms companies. Organisations rent (lease) them.",
        "Links include fibre optic cables (some under the sea), phone lines and satellites."],
        "Why doesn't a school lay its own cable to another school 30 miles away?", ill_sea)
    return im

def s3_back():
    im, d = base_wall()
    x0, x1 = 100, S-100
    d.rounded_rectangle((x0, 330, x1, 1800), 40, fill=PANEL, outline=COL[3], width=6)
    d.text((S//2, 420), "3  LAN vs WAN", font=font(66, True), fill=COL[3], anchor="mm")
    rows = [("", "LAN", "WAN"),
            ("Area covered", "Small: one building or site", "Large: towns, countries, worldwide"),
            ("Who owns the hardware?", "The organisation itself", "Mostly telecoms companies; rented"),
            ("Typical connections", "UTP cable and Wi-Fi", "Fibre optic, phone lines, satellite"),
            ("Example", "Your school network", "The internet")]
    cw = [560, 590, 598]; y = 510
    for r, row in enumerate(rows):
        h = 110 if r == 0 else 150; x = x0 + 40
        for c, cell in enumerate(row):
            fill = (14,22,40) if r else PANEL
            if r and c == 0: fill = (36, 54, 88)
            d.rectangle((x, y, x+cw[c]-10, y+h-10), fill=fill)
            col = WHITE if c == 0 else (COL[1] if c == 1 else (255,160,40))
            f = font(46, True) if r == 0 or c == 0 else font(40)
            ln = wrap(d, cell, f, cw[c]-60)
            for i, t in enumerate(ln):
                d.text((x+30, y+(h-10)/2 - (len(ln)-1)*25 + i*50), t, font=f, fill=col, anchor="lm")
            x += cw[c]
        y += h
    challenge(d, x0+40, y+30, x1-40,
              "Worksheet task: write three bullet points to describe a LAN, then three contrasting bullet points to describe a WAN.", COL[3])
    return im

def s3_left():
    im, d = base_wall()
    x0, x1 = 300, S-300
    d.rounded_rectangle((x0, 330, x1, 1560), 40, fill=PANEL, outline=COL[6], width=6)
    d.text((S//2, 430), "Exit question", font=font(72, True), fill=COL[6], anchor="mm")
    y = 560
    for q in ["What is meant by a standalone computer?",
              "Name one advantage of a network.",
              "Name one disadvantage of a network.",
              "Give two differences between a LAN and a WAN."]:
        n = len(wrap(d, q, font(46, True), x1-x0-220))
        h = 100 + n*60
        d.rounded_rectangle((x0+60, y, x1-60, y+h), 24, fill=(14,22,40), outline=YELLOW, width=4)
        para(d, (x0+110, y+45), q, font(46, True), x1-x0-220)
        y += h + 36
    d.text((S//2, 1650), "Take the headset off and answer on your worksheet.", font=font(40), fill=SOFT, anchor="mm")
    return im

def s3_ceiling():
    im = Image.new("RGB", (S, S), (8, 12, 26)); d = ImageDraw.Draw(im)
    rng = np.random.default_rng(3)
    for _ in range(500):
        x, y = rng.integers(0, S, 2); r = rng.integers(1, 5)
        d.ellipse((x-r, y-r, x+r, y+r), fill=(200, 210, 235))
    cx, cy = S//2, S//2 - 150
    d.rectangle((cx-90, cy-60, cx+90, cy+60), fill=(210, 180, 90))
    for sgn in (-1, 1):
        x0 = cx + sgn*110
        d.rectangle((min(x0, x0+sgn*420), cy-50, max(x0, x0+sgn*420), cy+50), fill=(40, 70, 150), outline=(140,160,210), width=4)
        for k in range(1, 6): d.line((x0+sgn*k*70, cy-50, x0+sgn*k*70, cy+50), fill=(140,160,210), width=3)
    d.pieslice((cx-70, cy+40, cx+70, cy+180), 0, 180, fill=(220,224,232))
    for r in (260, 340, 420): d.arc((cx-r, cy+60-r, cx+r, cy+60+r), 60, 120, fill=COL[5], width=8)
    x0, x1 = 324, 1724
    d.rounded_rectangle((x0, 1340, x1, 1600), 30, fill=PANEL, outline=COL[5], width=6)
    para(d, (x0+50, 1380), "Satellites carry WAN traffic to places that cables can't easily reach, "
         "such as ships at sea and remote villages.", font(44), x1-x0-100)
    return im

if __name__ == "__main__":
    out = OUT_S
    render(dict(front=s1_front, right=s1_right, back=s1_back, left=s1_left, up=ceiling_plain,
                down=lambda: zoom_floor(1, "Next: zoom out to a school, where computers are connected.")),
           out + "L1_Part1_Standalone_360.jpg", os.path.join(os.path.dirname(os.path.abspath(__file__)), "l1s1"))
    render(dict(front=s2_front, right=s2_right, back=s2_back, left=s2_left, up=s2_ceiling,
                down=lambda: zoom_floor(2, "Next: zoom out to the whole world.")),
           out + "L1_Part2_LAN_360.jpg", os.path.join(os.path.dirname(os.path.abspath(__file__)), "l1s2"))
    render(dict(front=s3_front, right=s3_right, back=s3_back, left=s3_left, up=s3_ceiling,
                down=lambda: zoom_floor(3, "Journey complete: standalone, LAN, WAN.")),
           out + "L1_Part3_WAN_360.jpg", os.path.join(os.path.dirname(os.path.abspath(__file__)), "l1s3"))
    print("ok")
