import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
import math, numpy as np
from PIL import Image, ImageDraw, ImageFont

S = 2048
F = "/usr/share/fonts/truetype/dejavu/"
def font(sz, bold=False, cond=False):
    name = "DejaVuSans" + ("Condensed" if cond else "") + ("-Bold" if bold else "") + ".ttf"
    return ImageFont.truetype(F + name, sz)

BG = (18, 30, 52); PANEL = (28, 44, 74); LINE = (60, 90, 135)
WHITE = (240, 244, 250); SOFT = (180, 196, 220); YELLOW = (255, 208, 70)
COL = {1: (64, 196, 255), 2: (170, 110, 235), 3: (255, 120, 90),
       4: (255, 160, 40), 5: (80, 220, 150), 6: (240, 90, 170)}

def wrap(d, text, f, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= width: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return lines

def para(d, xy, text, f, width, fill=WHITE, gap=1.3):
    x, y = xy
    for ln in wrap(d, text, f, width):
        d.text((x, y), ln, font=f, fill=fill); y += int(f.size * gap)
    return y

def bullets(d, xy, items, f, width, col):
    x, y = xy
    for it in items:
        d.ellipse((x, y + f.size*0.35, x + f.size*0.45, y + f.size*0.8), fill=col)
        y = para(d, (x + f.size*0.9, y), it, f, width - f.size*0.9) + int(f.size*0.4)
    return y

def base_wall():
    im = Image.new("RGB", (S, S), BG); d = ImageDraw.Draw(im)
    for x in range(0, S, 128): d.line((x, 0, x, S), fill=(24, 38, 64), width=2)
    for y in range(0, S, 128): d.line((0, y, S, y), fill=(24, 38, 64), width=2)
    d.rectangle((0, 0, S, 90), fill=(12, 20, 36))            # ceiling trim
    d.rectangle((0, S-150, S, S), fill=(12, 20, 36))         # skirting
    d.rectangle((0, S-150, S, S-140), fill=LINE)
    # cable tray along top
    d.rectangle((0, 110, S, 150), fill=(40, 52, 70)); d.line((0, 130, S, 130), fill=(170,110,235), width=6)
    return im, d

def card(d, box, n, title, col):
    x0, y0, x1, y1 = box
    d.rounded_rectangle(box, 36, fill=PANEL, outline=col, width=6)
    d.rounded_rectangle((x0, y0, x1, y0+130), 36, fill=col)
    d.rectangle((x0, y0+90, x1, y0+130), fill=col)
    d.ellipse((x0+30, y0+18, x0+124, y0+112), fill=WHITE)
    fn = font(62, True); t = str(n)
    d.text((x0+77, y0+65), t, font=fn, fill=col, anchor="mm")
    sz = 58
    while d.textlength(title, font=font(sz, True)) > (x1-x0-190): sz -= 2
    d.text((x0+150, y0+65), title, font=font(sz, True), fill=(15, 22, 38), anchor="lm")

def challenge(d, x0, y, x1, text, col):
    f = font(42)
    lines = wrap(d, text, f, x1 - x0 - 60)
    h = 100 + len(lines) * int(42*1.3)
    d.rounded_rectangle((x0, y, x1, y+h), 22, fill=(14, 22, 40), outline=YELLOW, width=5)
    d.text((x0+30, y+20), "Challenge", font=font(42, True), fill=YELLOW)
    para(d, (x0+30, y+78), text, f, x1-x0-60)
    return y + h

def station(d, x0, n, title, what, chal, draw_fn, top=330, w=880):
    col = COL[n]; x1 = x0 + w
    card(d, (x0, top, x1, 1800), n, title, col)
    draw_fn(d, x0 + 40, top + 170, x1 - 40, top + 560, col)
    y = bullets(d, (x0+45, top+590), what, font(43), w-90, col)
    challenge(d, x0+35, y+25, x1-35, chal, col)

def sample(tex, u, v):
    u = np.clip(u*(S-1), 0, S-1); v = np.clip(v*(S-1), 0, S-1)
    u0 = np.floor(u).astype(int); v0 = np.floor(v).astype(int)
    u1 = np.minimum(u0+1, S-1); v1 = np.minimum(v0+1, S-1)
    fu = (u-u0)[:, None]; fv = (v-v0)[:, None]
    return (tex[v0,u0]*(1-fu)*(1-fv) + tex[v0,u1]*fu*(1-fv) + tex[v1,u0]*(1-fu)*fv + tex[v1,u1]*fu*fv)


def logo_plaque(im, cx, cy, h, pad=36):
    """No-op. Scenes carried a school logo plaque early on; they no longer do.

    The calls are left in the scene scripts so the layouts below them keep their
    original coordinates. To bring a logo back, point R360_LOGO at an image file
    and delete the early return. The logo itself is not in this repository.
    """
    return
    logo = Image.open(os.environ["R360_LOGO"]).convert("RGBA")
    d = ImageDraw.Draw(im)
    lw = int(logo.width * h / logo.height)
    d.rounded_rectangle((cx-lw//2-pad, cy-h//2-pad, cx+lw//2+pad, cy+h//2+pad), 30, fill=(255,255,255))
    lg = logo.resize((lw, h), Image.LANCZOS)
    im.paste(lg, (cx-lw//2, cy-h//2), lg)

def render(facefns, path, preview_prefix=None):
    faces = {k: np.asarray(f(), dtype=np.float32) for k, f in facefns.items()}
    W, H = 6144, 3072
    lon = (np.arange(W) + 0.5) / W * 2*np.pi - np.pi
    lat = np.pi/2 - (np.arange(H) + 0.5) / H * np.pi
    LON, LAT = np.meshgrid(lon, lat)
    x = np.cos(LAT)*np.sin(LON); y = np.sin(LAT); z = np.cos(LAT)*np.cos(LON)
    ax, ay, az = np.abs(x), np.abs(y), np.abs(z)
    out = np.zeros((H, W, 3), np.float32)
    masks = {
     "front": (az >= ax) & (az >= ay) & (z > 0), "back": (az >= ax) & (az >= ay) & (z <= 0),
     "right": (ax > az) & (ax >= ay) & (x > 0), "left": (ax > az) & (ax >= ay) & (x <= 0),
     "up": (ay > ax) & (ay > az) & (y > 0), "down": (ay > ax) & (ay > az) & (y <= 0)}
    for k, m in masks.items():
        X, Y, Z = x[m], y[m], z[m]
        if k == "front": px, py = X/Z, Y/Z;  u, v = (px+1)/2, (1-py)/2
        if k == "back":  px, py = X/-Z, Y/-Z; u, v = (1-px)/2, (1-py)/2
        if k == "right": pz, py = Z/X, Y/X;  u, v = (1-pz)/2, (1-py)/2
        if k == "left":  pz, py = Z/-X, Y/-X; u, v = (1+pz)/2, (1-py)/2
        if k == "up":    px, pz = X/Y, Z/Y;  u, v = (px+1)/2, (pz+1)/2
        if k == "down":  px, pz = X/-Y, Z/-Y; u, v = (px+1)/2, (1-pz)/2
        out[m] = sample(faces[k], u, v)
    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).resize((4096, 2048), Image.LANCZOS)
    img.save(path, quality=92)
    if preview_prefix:
        ims = [Image.fromarray(faces[k].astype(np.uint8)).resize((768,768)) for k in ["left","front","right","back","up","down"]]
        c = Image.new("RGB", (768*3, 768*2))
        for i, t in enumerate(ims): c.paste(t, ((i%3)*768, (i//3)*768))
        c.save(preview_prefix + "_faces.jpg")

import os as _os
def render_hi(faces, path, W=8192, H=4096, chunk=256):
    """Direct 8192x4096 render for VR headsets, in row chunks to save memory."""
    out = np.zeros((H, W, 3), np.uint8)
    lon = (np.arange(W) + 0.5) / W * 2*np.pi - np.pi
    for r0 in range(0, H, chunk):
        lat = np.pi/2 - (np.arange(r0, min(H, r0+chunk)) + 0.5) / H * np.pi
        LON, LAT = np.meshgrid(lon, lat)
        x = np.cos(LAT)*np.sin(LON); y = np.sin(LAT); z = np.cos(LAT)*np.cos(LON)
        ax, ay, az = np.abs(x), np.abs(y), np.abs(z)
        blk = np.zeros(LON.shape + (3,), np.float32)
        masks = {
         "front": (az >= ax) & (az >= ay) & (z > 0), "back": (az >= ax) & (az >= ay) & (z <= 0),
         "right": (ax > az) & (ax >= ay) & (x > 0), "left": (ax > az) & (ax >= ay) & (x <= 0),
         "up": (ay > ax) & (ay > az) & (y > 0), "down": (ay > ax) & (ay > az) & (y <= 0)}
        for k, m in masks.items():
            if not m.any(): continue
            X, Y, Z = x[m], y[m], z[m]
            if k == "front": px, py = X/Z, Y/Z;  u, v = (px+1)/2, (1-py)/2
            if k == "back":  px, py = X/-Z, Y/-Z; u, v = (1-px)/2, (1-py)/2
            if k == "right": pz, py = Z/X, Y/X;  u, v = (1-pz)/2, (1-py)/2
            if k == "left":  pz, py = Z/-X, Y/-X; u, v = (1+pz)/2, (1-py)/2
            if k == "up":    px, pz = X/Y, Z/Y;  u, v = (px+1)/2, (pz+1)/2
            if k == "down":  px, pz = X/-Y, Z/-Y; u, v = (px+1)/2, (1-pz)/2
            blk[m] = sample(faces[k], u, v)
        out[r0:r0+LON.shape[0]] = np.clip(blk, 0, 255).astype(np.uint8)
    Image.fromarray(out).save(path, quality=88)

_render_orig = render
def render(facefns, path, preview_prefix=None):
    if _os.environ.get("HI_ONLY"):
        faces = {k: np.asarray(f(), dtype=np.float32) for k, f in facefns.items()}
        hp = SITE_S + "experiences/img/" + _os.path.basename(path).replace(".jpg", "_hi.jpg")
        render_hi(faces, hp); print("hi:", hp); return
    return _render_orig(facefns, path, preview_prefix)
