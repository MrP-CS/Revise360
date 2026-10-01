import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
from kit import *
import json, shutil
def front():
    im, d = base_wall()
    d.text((S//2, 250), "1.4 Network security  |  Bonus challenge", font=font(44, True), fill=YELLOW, anchor="mm")
    d.text((S//2, 350), "Cyber defence", font=font(110, True), fill=WHITE, anchor="mm")
    d.text((S//2, 450), "You run the network. Spend the budget. Survive the attacks.", font=font(42), fill=SOFT, anchor="mm")
    d.rounded_rectangle((260, 520, S-260, 1090), 40, fill=PANEL, outline=YELLOW, width=6)
    y = para(d, (320, 570), "Every round you get a budget and a shop of protections. You can't afford everything, so decide what matters most. Then a threat arrives.", font(44), S-640)
    bullets(d, (340, y + 30), ["Name the form of attack: 100 points", "Predict whether you're protected: 100 points",
                               "Actually blocked: 150 bonus points", "An attack that gets through costs a life", "Three lives, then the network shuts down"], font(40), S-680, YELLOW)
    d.text((S//2, 1220), "Tap the star on the floor to take charge.", font=font(40, True), fill=WHITE, anchor="mm")
    return im
def shop_wall():
    im, d = base_wall()
    d.text((S//2, 250), "The shop", font=font(64, True), fill=COL[1], anchor="mm")
    items = [("Anti-malware", "£2,000", "Blocks malicious software"), ("Firewall", "£1,500", "Filters incoming traffic"),
             ("Staff training", "£1,500", "People spot the scams"), ("Off-site backups", "£1,000", "Restore, don't pay"),
             ("Password policy", "£500", "Long passwords, lockouts"), ("Two-factor", "£1,500", "Stolen password isn't enough"),
             ("Encryption", "£2,000", "Intercepted data is useless"), ("Secure coding", "£2,000", "Stops SQL injection"),
             ("Penetration testing", "£2,500", "Find the holes first"), ("Traffic filtering", "£2,500", "Absorbs DDoS floods"),
             ("Physical security", "£1,500", "Locks, keycards, CCTV"), ("Access levels", "£1,000", "Limits the damage")]
    for i, (n, c, note) in enumerate(items):
        x0 = 90 + (i % 3) * 640; y0 = 380 + (i // 3) * 370
        d.rounded_rectangle((x0, y0, x0 + 580, y0 + 300), 24, fill=PANEL, outline=COL[1 + i % 6], width=5)
        d.text((x0 + 30, y0 + 40), n, font=font(40, True), fill=WHITE)
        d.text((x0 + 30, y0 + 110), c, font=font(48, True), fill=YELLOW)
        para(d, (x0 + 30, y0 + 185), note, font(30), 520, fill=SOFT)
    return im
def threats_wall():
    im, d = base_wall()
    d.text((S//2, 250), "Know your enemy", font=font(64, True), fill=COL[3], anchor="mm")
    rows = [("Malware", "Anti-malware, updates, backups"), ("Phishing", "Training, two-factor"), ("Social engineering", "Training, physical security"),
            ("Brute force", "Password policy, two-factor"), ("Denial of service", "Traffic filtering, firewall"),
            ("Data interception", "Encryption, physical security"), ("SQL injection", "Secure coding, pen testing")]
    d.rounded_rectangle((140, 380, S-140, 1560), 30, fill=PANEL, outline=COL[3], width=5)
    d.text((280, 450), "Threat", font=font(40, True), fill=YELLOW); d.text((1100, 450), "What stops it", font=font(40, True), fill=YELLOW)
    for i, (a, b) in enumerate(rows):
        y = 540 + i * 140
        d.text((280, y), a, font=font(38, True), fill=WHITE); d.text((1100, y), b, font=font(34), fill=SOFT)
        d.line((200, y + 60, S - 200, y + 60), fill=LINE, width=3)
    return im
def tips_wall():
    im, d = base_wall()
    d.text((S//2, 250), "Tactics", font=font(64, True), fill=COL[5], anchor="mm")
    tips = ["Cheap defences stop a lot: backups, training and a password policy cost little and cover the most common attacks.",
            "Layer up: if one protection fails, another may still catch the attack.",
            "Read the scenario carefully. The words 'flood', 'encrypted', 'pretending to be' and 'text box' are big clues.",
            "Be honest in your prediction: you score for predicting a hit correctly, even when it hurts.",
            "You earn more budget each round, so a weak start can still be rescued."]
    for i, t in enumerate(tips):
        y0 = 380 + i * 250
        d.rounded_rectangle((160, y0, S-160, y0 + 200), 24, fill=PANEL, outline=COL[1 + i % 6], width=5)
        para(d, (200, y0 + 50), t, font(38), S - 440)
    return im
def floor():
    im = Image.new("RGB", (S, S), (34, 40, 50)); d = ImageDraw.Draw(im)
    for x in range(0, S, 256): d.line((x, 0, x, S), fill=(46, 54, 66), width=5)
    d.ellipse((424, 424, S-424, S-424), fill=(22, 32, 52), outline=YELLOW, width=12)
    d.text((S//2, S//2 + 260), "TAKE CHARGE", font=font(80, True), fill=YELLOW, anchor="mm")
    return im
faces = dict(front=front, right=shop_wall, back=threats_wall, left=tips_wall, up=ceiling_plain, down=floor)
base = "NS_CyberDefence_360"; site = SITE_S
render(faces, OUT_S + f"{base}.jpg", OUT_S + f"prev_{base}")
shutil.copy(OUT_S + f"{base}.jpg", site + f"experiences/img/{base}.jpg")
render_hi({k: np.asarray(f(), dtype=np.float32) for k, f in faces.items()}, site + f"experiences/img/{base}_hi.jpg")
exp = dict(id="ns-defence", lesson=12, title="Cyber defence", scenes=[dict(id="main", title="Cyber defence", img=f"img/{base}.jpg", imgHi=f"img/{base}_hi.jpg",
  stations=[dict(label="★", name="Cyber defence", col="#ffd046", face="down", x=1024, y=1024, tasks=[dict(t="defence")])],
  info=[dict(id="f1", face="right", x=1024, y=330, title="Security on a budget", text="Real security teams face exactly this problem: a fixed budget and more risks than money. They rank risks by how likely they are and how much damage they'd do."),
        dict(id="f2", face="back", x=1024, y=330, title="No silver bullet", text="No single product stops every attack. Sellers who claim otherwise are worth being suspicious of."),
        dict(id="f3", face="left", x=1024, y=330, title="Cheapest wins", text="Surveys of real incidents keep finding the same thing: updates, backups, training and multi-factor authentication prevent most attacks, and all are cheap."),
        dict(id="f4", face="front", x=1880, y=300, title="Tabletop exercises", text="Companies rehearse attacks in 'tabletop exercises', talking through what they'd do. This game is a small version of one.")])])
json.dump(exp, open(site + "experiences/ns-defence.json", "w"), indent=1, ensure_ascii=False)
print("ok")
