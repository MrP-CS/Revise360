from l7 import *

MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
MONOB = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
KW = {"def", "while", "for", "if", "else", "elif", "return", "in", "not", "then", "endif", "and", "or", "True", "False", "import"}
C_KW, C_STR, C_COM, C_NUM, C_TXT = (200, 140, 255), (130, 220, 130), (130, 145, 170), (255, 190, 110), (230, 236, 245)

def code_line(d, x, y, text, f):
    """Very small syntax highlighter for display code."""
    if text.strip().startswith("#"):
        d.text((x, y), text, font=f, fill=C_COM); return
    import re
    for tok in re.findall(r'"[^"]*"?|\w+|\s+|.', text):
        if tok.startswith('"'): c = C_STR
        elif tok in KW: c = C_KW
        elif tok.isdigit(): c = C_NUM
        else: c = C_TXT
        d.text((x, y), tok, font=f, fill=c); x += d.textlength(tok, font=f)

def code_box(d, x0, y0, x1, y1, lines, size=26, marks=None, numbers=False, title=None, border=LINE):
    """marks: {line_index: colour} draws a highlight bar behind that line."""
    d.rounded_rectangle((x0, y0, x1, y1), 14, fill=(10, 14, 24), outline=border, width=4)
    f = ImageFont.truetype(MONO, size); lh = int(size * 1.45)
    y = y0 + 14
    if title:
        d.text((x0 + 16, y), title, font=font(22, True), fill=SOFT); y += 34
    gutter = int(d.textlength("00 ", font=f)) if numbers else 0
    for i, ln in enumerate(lines):
        if marks and i in marks:
            d.rounded_rectangle((x0 + 6, y - 3, x1 - 6, y + lh - 5), 6, fill=marks[i])
        if numbers: d.text((x0 + 14, y), f"{i+1:>2}", font=f, fill=(90, 104, 128))
        code_line(d, x0 + 16 + gutter, y, ln, f)
        y += lh
    return y

def briefing23(im, d, lesson, title, intro, hints, bullets_list=None):
    d.text((S//2, 250), f"2.3 Producing robust programs  |  Lesson {lesson}", font=font(44, True), fill=YELLOW, anchor="mm")
    d.text((S//2, 345), title, font=font(92, True), fill=WHITE, anchor="mm")
    d.text((S//2, 440), "OCR J277 Paper 2  |  Computational thinking, algorithms and programming", font=font(38), fill=SOFT, anchor="mm")
    d.rounded_rectangle((260, 510, S-260, 1060), 40, fill=PANEL, outline=YELLOW, width=6)
    y = para(d, (320, 560), intro, font(44), S-640)
    y = para(d, (320, y+30), "At each numbered station, record on your worksheet:", font(44, True), S-640, fill=YELLOW)
    bullets(d, (340, y+20), bullets_list or ["the key facts in your own words", "your answer to the challenge question"], font(42), S-680, YELLOW)
    hint_row(d, 1130, hints)

def person(d, x, y, c):
    d.ellipse((x-30, y-80, x+30, y-20), fill=c)
    d.rounded_rectangle((x-50, y-12, x+50, y+70), 30, fill=c)

def floor_final(title, intro, draw_extra):
    im = Image.new("RGB", (S, S), (34, 40, 50)); d = ImageDraw.Draw(im)
    for x in range(0, S, 256): d.line((x, 0, x, S), fill=(46, 54, 66), width=5)
    d.rounded_rectangle((160, 160, S-160, S-160), 30, fill=(22, 32, 52), outline=YELLOW, width=6)
    d.text((S//2, 250), title, font=font(54, True), fill=WHITE, anchor="mm")
    d.rounded_rectangle((330, 330, S-330, 700), 24, fill=(14, 22, 40), outline=YELLOW, width=5)
    para(d, (380, 370), intro, font(42), S-760)
    draw_extra(im, d)
    return im
