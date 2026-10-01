import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
from l7 import *

def car(d, x, y, c):
    d.rounded_rectangle((x, y, x+54, y+22), 7, fill=c)

def ill_lanes(d, x0, y0, x1, y1, col):
    cols = [(255,120,90), (64,196,255), (255,208,70), (80,220,150), (240,90,170)]
    for (top, n, label) in ((y0+10, 2, "Low bandwidth"), (y0+140, 6, "High bandwidth")):
        h = n * 26
        d.rectangle((x0+10, top, x1-10, top+h), fill=(52,58,72))
        for k in range(1, n): d.line((x0+10, top+k*26, x1-10, top+k*26), fill=(200,200,200), width=2)
        rng = np.random.default_rng(n)
        for k in range(n):
            for j in range(3 if n == 2 else 5):
                x = x0+40 + j*140 + int(rng.integers(0, 60))
                car(d, x, top+2+k*26, cols[(k+j) % 5])
        d.text((x1-14, top+h+4), label, font=font(26, True), fill=SOFT, anchor="ra")

def ill_users(d, x0, y0, x1, y1, col):
    for (cy, n, label) in ((y0+90, 3, "3 users: big share each"), (y0+270, 12, "12 users: small share each")):
        router(d, x0+60, cy, 40)
        w = 30 if n == 3 else 7
        for k in range(n):
            ty = cy - 70 + k * (140 / max(1, n-1))
            d.line((x0+100, cy, x1-80, ty), fill=GREEN, width=w // 2 + 3 if n == 3 else 4)
            d.rounded_rectangle((x1-80, ty-10, x1-40, ty+10), 4, fill=(20,24,32), outline=(110,116,130), width=3)
        d.text((x0+120, cy+60 if n == 3 else cy+82), label, font=font(24, True), fill=SOFT)

def ill_media(d, x0, y0, x1, y1, col):
    rows = [("Fibre optic", (255,160,40), 20, "Fastest, longest distance"), ("UTP copper", PURP, 14, "Fast, up to 100 m"), ("Wi-Fi", GREEN, 0, "Slowest, weakened by walls")]
    for k, (name, c, w, note) in enumerate(rows):
        y = y0+50 + k*120
        d.text((x0+10, y-30), name, font=font(28, True), fill=WHITE)
        if w: d.line((x0+10, y+14, x1-10, y+14), fill=c, width=w)
        else:
            for i in range(6):
                cx = x0+60 + i*110; r = 30
                d.arc((cx-r, y-10, cx+r, y+40), 300, 60, fill=c if i < 3 else (90, 120, 100), width=6)
            d.rectangle((x0+360, y-20, x0+380, y+46), fill=(120,110,100))
        d.text((x1-10, y+44), note, font=font(24), fill=SOFT, anchor="ra")

def packet(d, x, y, c, bad=False):
    d.rounded_rectangle((x, y, x+90, y+60), 10, fill=(40,20,26) if bad else (20,28,44), outline=RED if bad else c, width=5)
    if bad: cross(d, x+45, y+30, 18)

def ill_errors(d, x0, y0, x1, y1, col):
    y = y0+90
    for k in range(5): packet(d, x0+20 + k*150, y, COL[4], bad=(k == 2))
    d.text((x0+20, y-50), "Packets on their way", font=font(26, True), fill=SOFT)
    for i in range(8):
        xx = x0+320 + i*14; d.line((xx, y+80, xx+8, y+100), fill=YELLOW, width=5)
    d.text((x0+420, y+100), "Interference", font=font(26, True), fill=YELLOW)
    packet(d, x1-120, y+170, GREEN)
    d.line((x0+365, y+160, x1-130, y+200), fill=GREEN, width=6)
    d.polygon([(x1-130, y+200), (x1-160, y+180), (x1-155, y+215)], fill=GREEN)
    d.text((x0+20, y+180), "Damaged packet", font=font(26, True), fill=RED)
    d.text((x0+20, y+215), "is sent again", font=font(26, True), fill=GREEN)

def ill_latency(d, x0, y0, x1, y1, col):
    cx, cy = x0+170, (y0+y1)//2
    d.ellipse((cx-120, cy-120, cx+120, cy+120), fill=(20,28,44), outline=COL[5], width=10)
    d.rectangle((cx-18, cy-150, cx+18, cy-120), fill=COL[5])
    for k in range(12):
        a = k*math.pi/6; d.line((cx+95*math.cos(a), cy+95*math.sin(a), cx+108*math.cos(a), cy+108*math.sin(a)), fill=SOFT, width=4)
    d.line((cx, cy, cx+60, cy-55), fill=YELLOW, width=8)
    d.text((x1-170, cy-60), "Sent...", font=font(34, True), fill=WHITE, anchor="mm")
    d.text((x1-170, cy), "wait...", font=font(34, True), fill=SOFT, anchor="mm")
    d.text((x1-170, cy+60), "received!", font=font(34, True), fill=GREEN, anchor="mm")
    d.text((x1-170, cy+120), "measured in ms", font=font(26), fill=SOFT, anchor="mm")

def camera(d, x, y):
    d.rounded_rectangle((x, y, x+110, y+54), 12, fill=(220,224,232))
    d.ellipse((x+80, y+10, x+114, y+44), fill=(40,44,54), outline=(120,130,150), width=4)
    d.line((x+20, y, x+10, y-30), fill=(160,166,178), width=8)

def ill_cctv(d, x0, y0, x1, y1, col):
    server(d, x1-150, y0+80)
    d.text((x1-85, y0+345), "File server", font=font(26, True), fill=SOFT, anchor="mm")
    for k in range(4):
        y = y0+50 + k*80; camera(d, x0+30, y)
        for i in range(5):
            xx = x0+170 + i*70
            d.rectangle((xx, y+18 + (i%2)*4, xx+40, y+38 + (i%2)*4), fill=RED if k == 3 else COL[6])
        d.line((x0+150, y+27, x1-160, y0+200), fill=(120,70,110), width=3)
    d.text((x0+30, y1-10), "New camera?", font=font(26, True), fill=RED)

def front():
    im, d = base_wall()
    d.text((S//2, 250), "Lesson 2: network performance", font=font(44, True), fill=YELLOW, anchor="mm")
    d.text((S//2, 345), "Network control room", font=font(92, True), fill=WHITE, anchor="mm")
    d.text((S//2, 440), "OCR J277 1.3  |  Factors that affect the performance of networks", font=font(40), fill=SOFT, anchor="mm")
    d.rounded_rectangle((260, 510, S-260, 1060), 40, fill=PANEL, outline=YELLOW, width=6)
    y = para(d, (320, 560), "You are the school's network manager, and students say the network is slow. "
             "Five things affect how well a network performs. Find each one, then solve the CCTV case.", font(44), S-640)
    y = para(d, (320, y+30), "At each numbered station, record on your worksheet:", font(44, True), S-640, fill=YELLOW)
    bullets(d, (340, y+20), ["how that factor affects network speed",
                             "your answer to the challenge question"], font(42), S-680, YELLOW)
    hint_row(d, 1130, [("Turn right", "Stations 1 and 2", COL[1]), ("Turn around", "Stations 3 and 4", COL[3]),
                       ("Turn left", "Station 5 and the CCTV case", COL[5]), ("Look down", "Final challenge", YELLOW)])
    # status screens
    for x0 in (60, S-280):
        d.rounded_rectangle((x0, 1440, x0+220, 1800), 14, fill=(10,16,30), outline=LINE, width=4)
        pts = [(x0+20 + i*18, 1700 - 90*abs(math.sin(i*0.9 + x0))) for i in range(11)]
        d.line(pts, fill=GREEN, width=5)
        d.text((x0+110, 1480), "Traffic", font=font(26, True), fill=SOFT, anchor="mm")
    return im

def right():
    im, d = base_wall()
    station2(d, 100, 1, "Bandwidth", [
        "The maximum amount of data that can be sent in a given time.",
        "Measured in bits per second, such as megabits per second (Mbps).",
        "More bandwidth means more data at once, like more lanes on a motorway."],
        "Why does streaming a 4K film need more bandwidth than streaming music?", ill_lanes, ill_h=360)
    station2(d, 1068, 2, "Number of users", [
        "Every device on a network shares the bandwidth available.",
        "The more people using the network at the same time, the less bandwidth each one gets, so everything slows down."],
        "Why is the school network slowest at the start of a lesson, when everyone logs on?", ill_users, ill_h=360)
    return im

def back():
    im, d = base_wall()
    station2(d, 100, 3, "Transmission media", [
        "Wired connections are usually faster and more reliable than wireless.",
        "Fibre optic has more bandwidth than copper UTP and works over longer distances.",
        "Wi-Fi signals weaken with distance and through walls."],
        "A games console keeps lagging on Wi-Fi. What would you suggest, and why?", ill_media, ill_h=380)
    station2(d, 1068, 4, "Error rate", [
        "Data can be damaged or lost on the way, often because of interference or a weak signal.",
        "Damaged packets have to be sent again, which uses up bandwidth and slows the network."],
        "Why might Wi-Fi be slower near a microwave oven, or in a block of flats with lots of other Wi-Fi networks?", ill_errors, ill_h=370)
    return im

def left():
    im, d = base_wall()
    station2(d, 100, 5, "Latency", [
        "The delay between data being sent and it arriving, measured in milliseconds (ms).",
        "Long distances, busy networks and passing through lots of devices all add delay.",
        "Low latency matters most for online games and video calls."],
        "Why does a video call to Australia have more delay than one to a friend in the same town?", ill_latency, ill_h=340)
    station2(d, 1068, 6, "Case study: CCTV", [
        "The school's CCTV cameras record video to the file server all day and night.",
        "The head teacher wants more cameras around the outside of the building.",
        "Think about: bandwidth, the number of devices, and how cameras outside will connect."],
        "What should the network manager consider before adding the cameras?", ill_cctv, ill_h=360)
    return im

def floor():
    im = Image.new("RGB", (S, S), (34, 40, 50)); d = ImageDraw.Draw(im)
    for x in range(0, S, 256): d.line((x, 0, x, S), fill=(46, 54, 66), width=5)
    d.rounded_rectangle((160, 160, S-160, S-160), 30, fill=(22, 32, 52), outline=YELLOW, width=6)
    d.text((S//2, 250), "Final challenge: diagnose the network", font=font(56, True), fill=WHITE, anchor="mm")
    d.rounded_rectangle((330, 330, S-330, 700), 24, fill=(14,22,40), outline=YELLOW, width=5)
    para(d, (380, 370), "Five problems have been reported to the help desk. Tap the star badge and match "
         "each problem to the factor that is causing it.", font(42), S-760)
    # network monitor
    d.rounded_rectangle((330, 800, S-330, 1500), 24, fill=(10,16,30), outline=LINE, width=5)
    d.text((370, 830), "Network monitor: traffic today", font=font(36, True), fill=SOFT)
    for k in range(5): d.line((370, 950 + k*110, S-370, 950 + k*110), fill=(30,40,60), width=3)
    xs = np.linspace(380, S-380, 60)
    rng = np.random.default_rng(7)
    ys = [1440 - (120 + 330*math.exp(-((i-22)/5)**2) + 260*math.exp(-((i-44)/4)**2) + rng.integers(0, 60)) for i in range(60)]
    d.line(list(zip(xs, ys)), fill=GREEN, width=7)
    for lab, i in (("Lesson starts", 22), ("Lunch", 44)):
        d.text((xs[i], ys[i]-40), lab, font=font(30, True), fill=YELLOW, anchor="mm")
    return im

if __name__ == "__main__":
    render(dict(front=front, right=right, back=back, left=left, up=ceiling_plain, down=floor),
           OUT_S + "L2_NetworkPerformance_360.jpg", os.path.join(os.path.dirname(os.path.abspath(__file__)), "l2"))
    print("ok")
