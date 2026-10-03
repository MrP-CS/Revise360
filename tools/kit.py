"""Lesson kit: builds a 360 scene (normal + VR) and its quiz JSON from one spec."""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
from lib23 import *
import json

STATION_WALLS = [("right", 100), ("right", 1068), ("back", 100), ("back", 1068), ("left", 100), ("left", 1068)]
HEX = {1: "#40c4ff", 2: "#aa6eeb", 3: "#ff785a", 4: "#ffa028", 5: "#50dc96", 6: "#f05aaa"}
TONE = {"g": GREEN, "r": RED, "y": YELLOW, "b": COL[1], "p": COL[2], "o": COL[4], "k": COL[6], "n": (110, 116, 130)}

# ---------------------------------------------------------------- icons
def icon(d, kind, cx, cy, s=1.0):
    s = float(s)
    if kind == "pc": monitor(d, cx - 80*s, cy - 70*s, 160*s)
    elif kind == "laptop":
        d.rounded_rectangle((cx-80*s, cy-60*s, cx+80*s, cy+30*s), 8, fill=(20,24,32), outline=(110,116,130), width=5)
        d.polygon([(cx-105*s, cy+30*s), (cx+105*s, cy+30*s), (cx+90*s, cy+50*s), (cx-90*s, cy+50*s)], fill=(110,116,130))
    elif kind == "phone":
        d.rounded_rectangle((cx-38*s, cy-70*s, cx+38*s, cy+70*s), 12, fill=(20,24,32), outline=(150,156,170), width=5)
        d.ellipse((cx-6*s, cy+50*s, cx+6*s, cy+62*s), fill=(150,156,170))
    elif kind == "server": server(d, cx-65*s, cy-115*s)
    elif kind == "router": router(d, cx, cy, int(55*s))
    elif kind == "switch": sw(d, cx, cy, "Switch", w=int(200*s))
    elif kind == "printer": printer(d, cx-100*s, cy-80*s, int(200*s))
    elif kind == "wap":
        d.ellipse((cx-60*s, cy-60*s, cx+60*s, cy+60*s), fill=(235,238,242), outline=GREEN, width=6); d.ellipse((cx-14*s, cy-14*s, cx+14*s, cy+14*s), fill=GREEN)
    elif kind == "cloud":
        for (dx, dy, r) in ((-60, 10, 50), (0, -20, 65), (60, 10, 50), (0, 25, 50)):
            d.ellipse((cx+(dx-r)*s, cy+(dy-r)*s, cx+(dx+r)*s, cy+(dy+r)*s), fill=(220, 230, 245))
    elif kind == "headphones":
        d.arc((cx-60*s, cy-70*s, cx+60*s, cy+50*s), 180, 360, fill=(200,206,214), width=int(12*s))
        for k in (-1, 1): d.rounded_rectangle((cx+k*60*s-18*s, cy-10*s, cx+k*60*s+18*s, cy+50*s), 10, fill=COL[2])
    elif kind == "lock":
        d.arc((cx-40*s, cy-90*s, cx+40*s, cy-10*s), 180, 360, fill=(200,206,214), width=int(14*s))
        d.rounded_rectangle((cx-60*s, cy-40*s, cx+60*s, cy+60*s), 12, fill=YELLOW)
        d.ellipse((cx-12*s, cy-5*s, cx+12*s, cy+19*s), fill=(40,40,40))
    elif kind == "key":
        d.ellipse((cx-70*s, cy-30*s, cx-10*s, cy+30*s), outline=YELLOW, width=int(14*s))
        d.line((cx-10*s, cy, cx+80*s, cy), fill=YELLOW, width=int(14*s))
        for x in (50, 70): d.line((cx+x*s, cy, cx+x*s, cy+25*s), fill=YELLOW, width=int(10*s))
    elif kind == "bug": 
        from rp4 import bug; bug(d, cx, cy, .8*s)
    elif kind == "user": person(d, cx, cy, COL[1])
    elif kind == "robot":
        d.rounded_rectangle((cx-55*s, cy-55*s, cx+55*s, cy+45*s), 16, fill=(160,170,190))
        for k in (-1, 1): d.ellipse((cx+k*25*s-12*s, cy-25*s, cx+k*25*s+12*s, cy-1*s), fill=RED)
        d.line((cx, cy-55*s, cx, cy-85*s), fill=(160,170,190), width=6); d.ellipse((cx-10*s, cy-100*s, cx+10*s, cy-80*s), fill=RED)
    elif kind == "form":
        d.rounded_rectangle((cx-110*s, cy-110*s, cx+110*s, cy+110*s), 14, fill=(235,238,242))
        for i in range(3): d.rounded_rectangle((cx-90*s, cy-80*s+i*55*s, cx+90*s, cy-45*s+i*55*s), 6, fill=(255,255,255), outline=(170,176,186), width=3)
        d.rounded_rectangle((cx-60*s, cy+75*s, cx+60*s, cy+100*s), 10, fill=COL[1])
    elif kind == "disk":
        d.rounded_rectangle((cx-80*s, cy-60*s, cx+80*s, cy+60*s), 14, fill=(60,66,80), outline=(130,140,160), width=4)
        d.ellipse((cx-45*s, cy-45*s, cx+45*s, cy+45*s), fill=(150,160,176))
    elif kind == "cpu":
        d.rounded_rectangle((cx-80*s, cy-80*s, cx+80*s, cy+80*s), 10, fill=(47,122,74))
        d.rounded_rectangle((cx-50*s, cy-50*s, cx+50*s, cy+50*s), 8, fill=(200,204,212))
        for k in range(8):
            for side in (-1, 1):
                d.rectangle((cx-70*s+k*19*s, cy+side*88*s-4*s, cx-64*s+k*19*s, cy+side*88*s+4*s), fill=(212,175,55))
                d.rectangle((cx+side*88*s-4*s, cy-70*s+k*19*s, cx+side*88*s+4*s, cy-64*s+k*19*s), fill=(212,175,55))
        d.text((cx, cy), "CPU", font=font(int(34*s), True), fill=(40,44,54), anchor="mm")
    elif kind == "ram":
        d.rectangle((cx-110*s, cy-35*s, cx+110*s, cy+35*s), fill=(45,107,138))
        for k in range(6): d.rectangle((cx-100*s+k*35*s, cy-25*s, cx-75*s+k*35*s, cy+15*s), fill=(32,35,42))
        d.rectangle((cx-110*s, cy+35*s, cx+110*s, cy+45*s), fill=(212,175,55))
    elif kind == "washer":
        d.rounded_rectangle((cx-80*s, cy-95*s, cx+80*s, cy+95*s), 12, fill=(232,236,242))
        d.rectangle((cx-80*s, cy-95*s, cx+80*s, cy-60*s), fill=(200,206,214)); d.ellipse((cx+40*s, cy-88*s, cx+60*s, cy-68*s), fill=COL[1])
        d.ellipse((cx-55*s, cy-40*s, cx+55*s, cy+70*s), fill=(64,70,82)); d.ellipse((cx-40*s, cy-25*s, cx+40*s, cy+55*s), fill=(140,180,220))
    elif kind == "fan":
        d.ellipse((cx-80*s, cy-80*s, cx+80*s, cy+80*s), fill=(48,54,64), outline=(150,156,170), width=5)
        for k in range(6):
            a = k*math.pi/3; d.pieslice((cx-70*s, cy-70*s, cx+70*s, cy+70*s), math.degrees(a), math.degrees(a)+35, fill=(150,160,176))
        d.ellipse((cx-18*s, cy-18*s, cx+18*s, cy+18*s), fill=(90,96,110))
    elif kind == "burger":
        d.pieslice((cx-100*s, cy-90*s, cx+100*s, cy+10*s), 180, 360, fill=(220,160,70))
        for i, c in enumerate(((90,170,70), (240,200,60), (120,60,40), (220,160,70))):
            y = cy - 40*s + i*26*s; d.rounded_rectangle((cx-100*s, y, cx+100*s, y+22*s), 10, fill=c)


# ---------------------------------------------------------------- logic gate drawing (for 2.4)
import re as _re
def _ltok(src):
    return [t.upper() for t in _re.findall(r"AND|OR|NOT|\(|\)|[A-Za-z]", src)]
def lparse(src):
    toks = _ltok(src); p = [0]
    def peek(): return toks[p[0]] if p[0] < len(toks) else None
    def expr():
        n = term()
        while peek() == "OR": p[0] += 1; n = ("OR", n, term())
        return n
    def term():
        n = fac()
        while peek() == "AND": p[0] += 1; n = ("AND", n, fac())
        return n
    def fac():
        t = peek(); p[0] += 1
        if t == "NOT": return ("NOT", fac())
        if t == "(": n = expr(); p[0] += 1; return n
        return t
    return expr()
def gate_shape(d, kind, x, y, w, h, col=WHITE, lw=5, fill=(28, 44, 74)):
    if kind == "AND":
        d.rectangle((x, y, x + w*.5, y + h), fill=fill); d.pieslice((x + w*.5 - h/2, y, x + w*.5 + h/2, y + h), 270, 90, fill=fill)
        d.line((x, y, x + w*.5, y), fill=col, width=lw); d.line((x, y + h, x + w*.5, y + h), fill=col, width=lw); d.line((x, y, x, y + h), fill=col, width=lw)
        d.arc((x + w*.5 - h/2, y, x + w*.5 + h/2, y + h), 270, 90, fill=col, width=lw)
    elif kind == "OR":
        def qb(p0, p1, p2, n=24): return [((1-t)**2*p0[0] + 2*(1-t)*t*p1[0] + t*t*p2[0], (1-t)**2*p0[1] + 2*(1-t)*t*p1[1] + t*t*p2[1]) for t in [i/n for i in range(n+1)]]
        top = qb((x, y), (x + w*.6, y), (x + w, y + h/2)); bot = qb((x + w, y + h/2), (x + w*.6, y + h), (x, y + h)); back = qb((x, y + h), (x + w*.28, y + h/2), (x, y))
        d.polygon(top + bot + back, fill=fill); d.line(top + bot + back, fill=col, width=lw, joint="curve")
    else:
        d.polygon([(x, y), (x + w*.8, y + h/2), (x, y + h)], fill=fill, outline=col); d.line([(x, y), (x + w*.8, y + h/2), (x, y + h), (x, y)], fill=col, width=lw)
        r = h * .12; d.ellipse((x + w*.8, y + h/2 - r, x + w*.8 + 2*r, y + h/2 + r), fill=fill, outline=col, width=lw)
def draw_expr(d, src, x0, y0, x1, y1, out="Q", col=WHITE):
    node = lparse(src)
    def depth(n): return 0 if isinstance(n, str) else 1 + max(depth(n[1]), depth(n[2]) if len(n) > 2 else 0)
    leaves = []
    def cnt(n):
        if isinstance(n, str): leaves.append(n)
        else: cnt(n[1]); (cnt(n[2]) if len(n) > 2 else None)
    cnt(node); D = depth(node)
    W, H = x1 - x0, y1 - y0; gw = min(150, W / (D + 1.6) * .75); gh = gw * .62
    colW = (W - 120) / max(1, D + .6); rowH = min(gh * 1.5, H / max(1, len(leaves)))
    top = y0 + (H - rowH * len(leaves)) / 2 + rowH / 2; k = [0]; pos = {}
    fs = int(max(22, min(44, rowH * .5)))
    def place(n, dd):
        if isinstance(n, str):
            yy = top + rowH * k[0]; k[0] += 1; return ("v", x0 + 30, yy)
        a = place(n[1], dd + 1); b = place(n[2], dd + 1) if len(n) > 2 else None
        gx = x0 + 80 + (D - dd - 1) * colW + (colW - gw) * .5; gy = a[2] if b is None else (a[2] + b[2]) / 2
        ins = [(gx, gy)] if b is None else [(gx + 6, gy - gh*.26), (gx + 6, gy + gh*.26)]
        for src_, (tx, ty) in zip([a, b] if b else [a], ins):
            sx = src_[1] + (fs*.6 if src_[0] == "v" else 0); sy = src_[2]; mx = (sx + tx) / 2
            d.line([(sx, sy), (mx, sy), (mx, ty), (tx, ty)], fill=col, width=4)
            if src_[0] == "v": d.text((src_[1], sy), src_[3] if len(src_) > 3 else "", font=font(fs, True), fill=col, anchor="mm")
        gate_shape(d, n[0], gx, gy - gh/2, gw, gh, col)
        ox = gx + (gw*.8 + gh*.24 if n[0] == "NOT" else gw)
        return ("g", ox, gy)
    def place_named(n, dd):
        if isinstance(n, str):
            yy = top + rowH * k[0]; k[0] += 1; return ("v", x0 + 30, yy, n)
        a = place_named(n[1], dd + 1); b = place_named(n[2], dd + 1) if len(n) > 2 else None
        gx = x0 + 80 + (D - dd - 1) * colW + (colW - gw) * .5; gy = a[2] if b is None else (a[2] + b[2]) / 2
        inx = gx + (gw*.12 if n[0] == "OR" else 0)
        ins = [(gx, gy)] if b is None else [(inx, gy - gh*.26), (inx, gy + gh*.26)]
        for src_, (tx, ty) in zip([a, b] if b else [a], ins):
            sx = src_[1] + (fs*.55 if src_[0] == "v" else 0); sy = src_[2]; mx = (sx + tx) / 2
            d.line([(sx, sy), (mx, sy), (mx, ty), (tx, ty)], fill=col, width=4)
            if src_[0] == "v": d.text((src_[1], sy), src_[3], font=font(fs, True), fill=col, anchor="mm")
        gate_shape(d, n[0], gx, gy - gh/2, gw, gh, col)
        return ("g", gx + (gw*.8 + gh*.24 if n[0] == "NOT" else gw*.5 + gh/2 if n[0] == "AND" else gw), gy)
    o = place_named(node, 0)
    d.line((o[1], o[2], o[1] + 40, o[2]), fill=col, width=4); d.text((o[1] + 50, o[2]), out, font=font(fs, True), fill=col, anchor="lm")

# ---------------------------------------------------------------- illustration types
def _wrap(d, t, f, w): return [l for l in wrap(d, t, f, w) if l] or [t]

def ill(d, spec, x0, y0, x1, y1, col):
    kind, a = spec[0], spec[1:]
    if kind == "code":
        lines = a[0]; size = a[1] if len(a) > 1 else 24; marks = a[2] if len(a) > 2 else None
        code_box(d, x0-10, y0, x1+10, y1, lines, size, marks={k: (60, 50, 20) for k in (marks or [])}, numbers=True)
    elif kind == "tiles":
        items = a[0]; cols = a[1] if len(a) > 1 else 2
        rows = (len(items) + cols - 1) // cols; gap = 14
        w = (x1 - x0 - gap*(cols-1)) / cols; h = min(150, (y1 - y0 - gap*(rows-1)) / rows)
        for i, it in enumerate(items):
            text, tone = (it if isinstance(it, (list, tuple)) else (it, "n"))
            c = TONE.get(tone, col); r, q = divmod(i, cols)
            bx, by = x0 + q*(w+gap), y0 + r*(h+gap)
            d.rounded_rectangle((bx, by, bx+w, by+h), 14, fill=(20, 28, 44), outline=c, width=5)
            # Shrink until the label fits the tile in BOTH directions. The height
            # and line-count tests alone are not enough: a single long word such
            # as "Defragmentation" cannot be wrapped, so it silently ran past the
            # edge of its tile and collided with its neighbour.
            fs = int(min(40, max(22, h * 0.3))); f = font(fs, True)
            lines = _wrap(d, text, f, w - 30)
            def _over(lines, f):
                return (len(lines) > 2
                        or len(lines) * f.size * 1.15 > h - 10
                        or max(d.textlength(ln, font=f) for ln in lines) > w - 24)
            while _over(lines, f) and fs > 13:
                fs -= 1; f = font(fs, True); lines = _wrap(d, text, f, w - 30)
            for j, ln in enumerate(lines):
                d.text((bx + w/2, by + h/2 + (j - (len(lines)-1)/2) * f.size * 1.15), ln, font=f, fill=WHITE, anchor="mm")
    elif kind == "compare":
        lt, ll, rt, rl = a[:4]; lc = TONE.get(a[4], GREEN) if len(a) > 4 else GREEN; rc = TONE.get(a[5], RED) if len(a) > 5 else RED
        w = (x1 - x0 - 20) / 2; big = (y1 - y0) > 450; fs = 40 if big else 26; ts = 52 if big else 30
        for bx, t, items, c in ((x0, lt, ll, lc), (x0 + w + 20, rt, rl, rc)):
            d.rounded_rectangle((bx, y0, bx+w, y1), 14, fill=(20, 28, 44), outline=c, width=5)
            d.text((bx + w/2, y0 + ts), t, font=font(ts, True), fill=c, anchor="mm")
            y = y0 + ts * 2 + 10
            for it in items:
                d.ellipse((bx + 24, y + fs*0.35, bx + 24 + fs*0.4, y + fs*0.75), fill=c)
                for ln in _wrap(d, it, font(fs), w - 90):
                    d.text((bx + 24 + fs*0.8, y), ln, font=font(fs), fill=WHITE); y += fs * 1.25
                y += fs * 0.4
    elif kind == "flow":
        steps = a[0]; n = len(steps); per = n if n <= 4 else (n + 1) // 2
        rows = (n + per - 1) // per; gap = 40; w = (x1 - x0 - gap*(per-1)) / per; h = min(200, (y1 - y0 - 30*(rows-1)) / rows)
        for i, t in enumerate(steps):
            r, q = divmod(i, per); bx = x0 + q*(w+gap); by = y0 + r*(h+30) + (y1 - y0 - rows*h - (rows-1)*30) / 2
            d.rounded_rectangle((bx, by, bx+w, by+h), 14, fill=(20, 28, 44), outline=col, width=5)
            fs = 30 if w > 250 else 26; f = font(fs, True); lines = _wrap(d, t, f, w - 24)
            while (len(lines) > 4 or len(lines) * fs * 1.2 > h - 10) and fs > 16: fs -= 2; f = font(fs, True); lines = _wrap(d, t, f, w - 20)
            for j, ln in enumerate(lines): d.text((bx + w/2, by + h/2 + (j - (len(lines)-1)/2) * f.size*1.2), ln, font=f, fill=WHITE, anchor="mm")
            if q < per - 1 and i < n - 1:
                ax = bx + w + 6; ay = by + h/2
                d.line((ax, ay, ax + gap - 14, ay), fill=YELLOW, width=6); d.polygon([(ax+gap-8, ay), (ax+gap-22, ay-10), (ax+gap-22, ay+10)], fill=YELLOW)
    elif kind == "table":
        head, rows = a[0], a[1]; n = len(head); w = (x1 - x0) / n; h = min(60, (y1 - y0) / (len(rows) + 1))
        # A cell's text has to fit its column. The old rule dropped one size and
        # gave up, so a long value ran out past the table's edge; headings were
        # never measured at all.
        def _fit(t, bold, start=24, floor=14):
            f = font(start, bold)
            while d.textlength(t, font=f) > w - 20 and f.size > floor:
                f = font(f.size - 1, bold)
            return f
        for i, t in enumerate(head):
            d.rectangle((x0 + i*w, y0, x0 + (i+1)*w - 4, y0 + h - 4), fill=(36, 54, 88))
            d.text((x0 + i*w + w/2, y0 + h/2), t, font=_fit(t, True), fill=YELLOW, anchor="mm")
        for r, row in enumerate(rows):
            for i, t in enumerate(row):
                d.rectangle((x0 + i*w, y0 + (r+1)*h, x0 + (i+1)*w - 4, y0 + (r+2)*h - 4), fill=(20, 28, 44))
                d.text((x0 + i*w + w/2, y0 + (r+1)*h + h/2), t, font=_fit(t, False), fill=WHITE, anchor="mm")
    elif kind == "big":
        txt, sub = a[0], (a[1] if len(a) > 1 else "")
        f = ImageFont.truetype(MONOB, 56)
        while d.textlength(txt, font=f) > x1 - x0 - 40 and f.size > 20: f = ImageFont.truetype(MONOB, f.size - 4)
        d.rounded_rectangle((x0, y0 + 40, x1, y0 + 200), 18, fill=(10, 14, 24), outline=col, width=5)
        d.text(((x0+x1)/2, y0 + 120), txt, font=f, fill=col, anchor="mm")
        if sub: para(d, (x0 + 10, y0 + 230), sub, font(28), x1 - x0 - 20, fill=SOFT)
    elif kind == "pair":
        li, ri, ll, rl, top, bottom = a
        icon(d, li, x0 + 130, (y0+y1)/2 - 20, 1.1); icon(d, ri, x1 - 130, (y0+y1)/2 - 20, 1.1)
        d.text((x0 + 130, y1 - 30), ll, font=font(26, True), fill=SOFT, anchor="mm"); d.text((x1 - 130, y1 - 30), rl, font=font(26, True), fill=SOFT, anchor="mm")
        ym = (y0+y1)/2 - 20
        for yy, t, c, dirn in ((ym - 40, top, YELLOW, 1), (ym + 40, bottom, GREEN, -1)):
            if not t: continue
            xa, xb = (x0 + 250, x1 - 250) if dirn == 1 else (x1 - 250, x0 + 250)
            d.line((xa, yy, xb, yy), fill=c, width=6)
            d.polygon([(xb, yy), (xb - 18*dirn, yy - 11), (xb - 18*dirn, yy + 11)], fill=c)
            d.text(((x0+x1)/2, yy - 26), t, font=font(22, True), fill=c, anchor="mm")
    elif kind == "icons":
        items = a[0]; n = len(items); w = (x1 - x0) / n
        for i, (k, lab) in enumerate(items):
            cx = x0 + w*i + w/2; sc = min(1.0, w/260) if (y1 - y0) < 450 else min(2.2, w/230, (y1-y0)/260); icon(d, k, cx, (y0+y1)/2 - 25*sc, sc)
            d.text((cx, y1 - 25), lab, font=font(24 if (y1-y0) < 450 else 40, True), fill=SOFT, anchor="mm")
    elif kind == "stack":
        layers = a[0]; n = len(layers); h = (y1 - y0 - 10*(n-1)) / n
        scratch = ImageDraw.Draw(Image.new("RGB", (10, 10)))
        for i, (name, sub, tone) in enumerate(layers):
            c = TONE.get(tone, col); by = y0 + i*(h+10)
            lx, rx = x0 + 40 + i*14, x1 - 30 - i*14
            # The label is left-anchored and its description right-anchored, so shrink
            # them until they fit side by side with a readable gap between.
            ns, ss, GAP = 30, 24, 26
            while ns > 17:
                nw = scratch.textlength(name, font=font(ns, True))
                sw = scratch.textlength(sub, font=font(ss))
                if nw + sw + GAP <= rx - lx: break
                if ss > ns * 0.66: ss -= 1
                else: ns -= 1; ss -= 1
            d.rounded_rectangle((x0 + i*14, by, x1 - i*14, by + h), 14, fill=(20, 28, 44), outline=c, width=5)
            d.text((lx, by + h/2), name, font=font(ns, True), fill=c, anchor="lm")
            d.text((rx, by + h/2), sub, font=font(ss), fill=WHITE, anchor="rm")
    elif kind == "clientserver":
        server(d, x0 + 60, y0 + 70)
        for k in range(3):
            cy = y0 + 50 + k*110
            d.line((x0 + 190, y0 + 180, x0 + 330, cy + 35), fill=SOFT, width=5)
            icon(d, "pc", x0 + 400, cy + 40, .6)
        d.text((x0 + 240, y1 - 10), "Client-server", font=font(26, True), fill=SOFT, anchor="mm")
        P = [(x1 - 250, y0 + 70), (x1 - 60, y0 + 70), (x1 - 250, y0 + 260), (x1 - 60, y0 + 260)]
        for i in range(4):
            for j in range(i+1, 4): d.line((*P[i], *P[j]), fill=PURP, width=5)
        for x, y in P: icon(d, "laptop", x, y, .5)
        d.text((x1 - 155, y1 - 10), "Peer-to-peer", font=font(26, True), fill=SOFT, anchor="mm")
    elif kind == "diagram":
        draw_expr(d, a[0], x0, y0, x1, y1, a[1] if len(a) > 1 else "Q")
    elif kind == "gate":
        g, sym = a[0], a[1]; gw = min(260, (x1 - x0) * .45); gh = gw * .62; gx = x0 + 60; gy = (y0 + y1) / 2 - gh / 2
        n_in = 1 if g == "NOT" else 2
        for i in range(n_in):
            yy = gy + gh / 2 if n_in == 1 else gy + gh * (.26 + .48 * i); d.line((gx - 50, yy, gx + (gw*.12 if g == "OR" else 6), yy), fill=WHITE, width=5)
            d.text((gx - 60, yy), "AB"[i], font=font(36, True), fill=WHITE, anchor="rm")
        gate_shape(d, g, gx, gy, gw, gh)
        ox = gx + (gw*.8 + gh*.24 if g == "NOT" else gw*.5 + gh/2 if g == "AND" else gw); d.line((ox, gy + gh/2, ox + 50, gy + gh/2), fill=WHITE, width=5)
        d.text((ox + 60, gy + gh/2), "Q", font=font(36, True), fill=WHITE, anchor="lm")
        d.text((x1 - 60, (y0+y1)/2), sym, font=font(90, True), fill=YELLOW, anchor="mm")
    elif kind == "worldmap": world_map(d, x0 + 10, y0 + 20, x1 - 10, y1 - 20)
    elif kind == "dns": ill_dns(d, x0, y0, x1, y1, col)
    elif kind == "caesar":
        shift = a[0] if a else 13
        cw = (x1 - x0) / 13; f = ImageFont.truetype(MONOB, int(min(60, cw * 0.5))); bh = min(120, (y1 - y0 - 80) / 4.6)
        for row in range(2):
            for i in range(13):
                ch = chr(65 + i + row*13); en = chr(65 + (i + row*13 + shift) % 26)
                bx = x0 + i*cw; by = y0 + 20 + row*(bh*2 + 40)
                d.rectangle((bx+2, by, bx+cw-2, by+bh), fill=(20, 28, 44)); d.text((bx+cw/2, by+bh/2), ch, font=f, fill=WHITE, anchor="mm")
                d.rectangle((bx+2, by+bh+8, bx+cw-2, by+2*bh+8), fill=(40, 30, 60)); d.text((bx+cw/2, by+1.5*bh+8), en, font=f, fill=YELLOW, anchor="mm")
        d.text(((x0+x1)/2, y1 - 20), f"Shift of {shift}: top letter becomes the letter below", font=font(24 if (y1-y0) < 450 else 38, True), fill=SOFT, anchor="mm")

# ---------------------------------------------------------------- auto-fitting station card
def station_fit(d, x0, n, title, bullets_list, chal, ill_spec, col, w=880, top=330):
    x1 = x0 + w
    scratch = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    for fs, ill_h in ((43, 360), (40, 340), (38, 320), (36, 300), (34, 280), (32, 260)):
        y = bullets(scratch, (x0+45, top + 200 + ill_h), bullets_list, font(fs), w-90, col)
        end = challenge(scratch, x0+35, y+25, x1-35, chal, col) if chal else y
        if end <= 1775: break
    card(d, (x0, top, x1, 1800), n, title, col)
    ill(d, ill_spec, x0 + 40, top + 170, x1 - 40, top + 170 + ill_h, col)
    y = bullets(d, (x0+45, top + 200 + ill_h), bullets_list, font(fs), w-90, col)
    if chal: challenge(d, x0+35, y+25, x1-35, chal, col)

# ---------------------------------------------------------------- walls
def build_faces(L):
    def front():
        im, d = base_wall()
        d.text((S//2, 250), L["kicker"], font=font(44, True), fill=YELLOW, anchor="mm")
        d.text((S//2, 345), L["scene_title"], font=font(92, True), fill=WHITE, anchor="mm")
        d.text((S//2, 440), L["subtitle"], font=font(38), fill=SOFT, anchor="mm")
        d.rounded_rectangle((260, 510, S-260, 1060), 40, fill=PANEL, outline=YELLOW, width=6)
        y = para(d, (320, 560), L["intro"], font(44), S-640)
        y = para(d, (320, y+30), "At each numbered station, record on your worksheet:", font(44, True), S-640, fill=YELLOW)
        bullets(d, (340, y+20), ["the key facts in your own words", "your answer to the challenge question"], font(42), S-680, YELLOW)
        hint_row(d, 1130, [("Turn right", "Stations 1 and 2", COL[1]), ("Turn around", "Stations 3 and 4", COL[3]),
                           ("Turn left", "Stations 5 and 6", COL[5]), ("Look down", "Final challenge", YELLOW)])
        words = L.get("keywords", [])
        if words:
            d.text((S//2, 1450), "Key words", font=font(36, True), fill=SOFT, anchor="mm")
            f = font(34, True); ws = [d.textlength(w_, font=f) + 60 for w_ in words]
            rows, cur, wsum = [], [], 0
            for w_, ww in zip(words, ws):
                if wsum + ww > S - 400 and cur: rows.append(cur); cur, wsum = [], 0
                cur.append((w_, ww)); wsum += ww + 20
            rows.append(cur)
            for r, row in enumerate(rows):
                tot = sum(ww for _, ww in row) + 20*(len(row)-1); x = (S - tot) / 2; y = 1510 + r*90
                for i, (w_, ww) in enumerate(row):
                    c = COL[(i + r) % 6 + 1]
                    d.rounded_rectangle((x, y, x+ww, y+70), 35, fill=(20, 28, 44), outline=c, width=4)
                    d.text((x + ww/2, y + 35), w_, font=f, fill=c, anchor="mm"); x += ww + 20
        return im
    def wall(face):
        def f():
            im, d = base_wall()
            for k, (fc, x0) in enumerate(STATION_WALLS):
                if fc != face: continue
                st = L["stations"][k]
                station_fit(d, x0, k + 1, st["name"], st["bullets"], st.get("challenge"), st["ill"], COL[k + 1])
            return im
        return f
    def floor():
        fin = L["final"]
        def extra(im, d):
            if fin.get("ill"):
                ill(d, fin["ill"], 380, 790, S-380, 1500, YELLOW)
        return floor_final(fin["floor_title"], fin["intro"], extra)
    return dict(front=front, right=wall("right"), back=wall("back"), left=wall("left"), up=ceiling_plain, down=floor)

# ---------------------------------------------------------------- export
# Interactive markers sit in a fixed place relative to the panel they belong to:
# the info icon centred above it, the 3D model button at its top right corner, and
# the station badge centred below it. The two upper rows share a y, which is clear
# of panel text on every wall, so nothing ever needs nudging.
#
#   [2D]       (i)        [3D]    <- DIAG_Y / INFO_Y / MODEL_Y
#     +-------------------------+
#     |        the panel        |
#     +-------------------------+
#              (1)              <- STATION_Y
PANEL_CENTRE = [540, 1508]          # the two panel centres on a station wall
MODEL_INSET = 790                   # from the panel's left edge: 90px in from its right
DIAG_INSET = 90                     # and the 2D diagram button the same in from its left
INFO_Y, STATION_Y = 240, 1840
MODEL_Y = DIAG_Y = INFO_Y
INFO_POS = [(fc, PANEL_CENTRE[k % 2]) for k, (fc, _) in enumerate(STATION_WALLS)]
MODEL_POS = [(fc, x0 + MODEL_INSET) for fc, x0 in STATION_WALLS]
DIAG_POS = [(fc, x0 + DIAG_INSET) for fc, x0 in STATION_WALLS]
def export(L, site=SITE_S, images=True):
    """Build one lesson: the 360 artwork and the scene JSON beside it.

    `images=False` writes only the JSON. Station names, wall bullets and the
    challenge are painted into the artwork, so changing one of those needs a
    render; adding or changing an ACTIVITY does not, because activities are
    runtime JSON. A render takes about two minutes a lesson and rewrites a
    three-megabyte photograph, so a pass that only touches activities should
    not do one - it would churn the repository for an identical picture.
    """
    import os
    base = L["img"]
    if images:
        faces = build_faces(L)
        render(faces, OUT_S + f"{base}.jpg", OUT_S + f"prev_{base}")
        import shutil; shutil.copy(OUT_S + f"{base}.jpg", site + f"experiences/img/{base}.jpg")
        fcache = {k: np.asarray(f(), dtype=np.float32) for k, f in faces.items()}
        render_hi(fcache, site + f"experiences/img/{base}_hi.jpg")
    stations = []
    for k, st in enumerate(L["stations"]):
        fc, x0 = STATION_WALLS[k]
        stations.append(dict(label=str(k+1), name=st["name"], col=HEX[k+1], face=fc, x=x0 + 440, y=STATION_Y, tasks=st["tasks"]))
    fin = L["final"]
    stations.append(dict(label="★", name=fin["name"], col="#ffd046", face="down", x=1024, y=745, tasks=fin["tasks"]))
    models = []
    for i, md in enumerate(L.get("models", [])):
        where, kind, title, text = md
        # An int is the station the model belongs to; the button then sits at that
        # panel's top right, the same place in every experience.
        if isinstance(where, int): fc, x = MODEL_POS[where]; y = MODEL_Y
        else: fc, x, y = where
        models.append(dict(id=f"m{i+1}", face=fc, x=x, y=y, model=kind, title=title, text=text))
    diagrams = []
    for i, dg in enumerate(L.get("diagrams", [])):
        where, kind, title, text = dg
        if isinstance(where, int): fc, x = DIAG_POS[where]; y = DIAG_Y
        else: fc, x, y = where
        diagrams.append(dict(id=f"d{i+1}", face=fc, x=x, y=y, diagram=kind, title=title, text=text))
    info = []
    for i, it in enumerate(L["info"]):
        where = it[0]
        if isinstance(where, int): fc, x = INFO_POS[where]; y = INFO_Y
        else: fc, x, y = where
        info.append(dict(id=f"f{i+1}", face=fc, x=x, y=y, title=it[1], text=it[2]))
    exp = dict(id=L["id"], lesson=L["lesson"], title=L["title"], scenes=[dict(id="main", title=L["title"], img=f"img/{base}.jpg", imgHi=f"img/{base}_hi.jpg", stations=stations, info=info, models=models, diagrams=diagrams)])
    json.dump(exp, open(site + f"experiences/{L['id']}.json", "w"), indent=1, ensure_ascii=False)
    total = sum(task_marks(t) for s in stations for t in s["tasks"])
    return total


ONE_MARK = ("mcq", "multi", "circuit", "expr", "convert", "addshift", "pixels", "sound",
            "memory", "permissions", "defrag", "impact", "searchstep", "sortstep")
# A game station is played, not marked, so it carries no marks towards the total.
# "arena" was missing here while js/store.js had it, so this rule and the one the
# site uses disagreed about one task type until tools/tests/smokemarks.py said so.
NO_MARK = ("sprint", "defence", "blitz", "lawgame", "arena")


def calc(q, columns, rows, answer, fb="", title=None, given=None):
    """A working-out table: the pupil fills every blank cell from the keypad.

    The same interaction as a trace table and a different job. A capacity
    lesson can ask "what is the size of a 1,000 x 800 image at 8 bits?" and get
    a number back, step by step, instead of four options to choose between -
    which is the difference between a pupil who can calculate and one who can
    eliminate. One mark per blank cell, so the working is what is marked.

      calc("Work out the size of the image, one step at a time.",
           ["bits", "bytes", "kB"], [["", "", ""]], [["6400000", "800000", "800"]],
           given=["width = 1000", "height = 800", "colour depth = 8"])
    """
    t = dict(t="calc", q=q, columns=columns, rows=rows, answer=answer, fb=fb)
    if title: t["title"] = title
    if given: t["code"] = given
    return t


def task_marks(t):
    """What one activity is worth. The same rule as Store.marks in js/store.js.

    It was a closure inside export(), which meant anything else that needed a mark
    total - a lesson record, a teacher's pack, a coverage claim - had to write the
    rule out again and could disagree with the site about what a lesson is worth.
    tools/tests/smokemarks.py checks this against the JavaScript copy.
    """
    if t["t"] in ONE_MARK: return 1
    if t["t"] == "bugline": return 2
    # A code question is marked by running it: the award is the share of its
    # tests passed, out of the mark total the question carries. store.js uses
    # the same default for one written without a total.
    if t["t"] == "code": return t.get("marks", 3)
    if t["t"] in ("trace", "calc"): return sum(1 for row in t["rows"] for v in row if v == "")
    if t["t"] == "table": return 1 << (len(t["inputs"]) if t.get("inputs") else len(set(c for c in _re.sub("AND|OR|NOT", "", t["expr"]) if c.isalpha())))
    if t["t"] in NO_MARK: return 0
    return len(t.get("items") or t.get("pairs") or t.get("steps"))

def mcq(q, r, w, fb): return dict(t="mcq", q=q, a=[r] + w, fb=fb)
def multi(q, opts, correct, fb): return dict(t="multi", q=q, opts=opts, correct=correct, fb=fb)
def sort(q, cats, items, fb): return dict(t="sort", q=q, cats=cats, items=items, fb=fb)
def match(q, pairs, fb): return dict(t="match", q=q, pairs=pairs, fb=fb)
def order(q, steps, fb): return dict(t="order", q=q, steps=steps, fb=fb)
