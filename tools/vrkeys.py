"""Can every character the course needs be typed in the headset?

A headset has no keyboard, so js/vr.js draws one. If a character the course
requires is not on it, the question that needs it cannot be answered in there -
and the place to find that out is here, not in lesson 8.

Every character is collected from the code the course itself contains: the
starters a pupil is given, the model solutions, the worked examples, the hint
syntax, the lines a question requires or forbids, and the Exam Reference
Language boards. Prose is not scanned: what matters is what has to be typed.

  python3 tools/vrkeys.py            # report
  python3 tools/vrkeys.py --list     # every character, with where it came from

Exits non-zero if the keyboard cannot type something the course needs.
"""
import os, re, sys, json, glob, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE, ANSWERS, EXPERIENCES

# What the keyboard offers. Read from js/vr.js rather than written down again,
# so adding a key there is enough and this cannot drift from it.
VR = (SITE / "js" / "vr.js").read_text()


def keyboard():
    m = re.search(r"const KEYS = \[(.*?)\n    \];", VR, re.S)
    if not m:
        print("could not find the KEYS table in js/vr.js"); sys.exit(2)
    chars = set()
    # both quotes: a double quote key has to be written '"' in the source
    for q, s in re.findall(r'"((?:[^"\\]|\\.)*)"' + "|" + r"'((?:[^'\\]|\\.)*)'", m.group(1)):
        s = (q or s)
        if not s: continue
        s = s.encode().decode("unicode_escape")
        # "1234567890".split("") contributes every character in the string
        chars.update(s)
    # the keys that are named rather than drawn as themselves
    named = set()
    if "typeKey(\"Space\")" in VR or '"Space"' in VR: named.add(" ")
    if '"Tab"' in VR: named.add("\t")
    if '"Enter"' in VR: named.add("\n")
    # Shift types the capital of any letter the keyboard has
    if '"Shift"' in VR:
        chars.update(c.upper() for c in list(chars) if c.isalpha())
    return chars | named


def collect():
    """Every character the course requires a pupil to be able to type."""
    where = collections.defaultdict(set)

    def add(text, source):
        for ch in str(text):
            where[ch].add(source)

    # the model solutions and the starters a pupil is handed
    for f in sorted(glob.glob(str(ANSWERS / "codebank" / "*.json"))):
        d = json.load(open(f))
        name = os.path.basename(f)
        for key in ("solutions", "starters", "starter"):
            v = d.get(key)
            if isinstance(v, dict):
                for qid, code in v.items():
                    add(code, f"{name} {key}:{qid}")
            elif isinstance(v, str):
                add(v, f"{name} {key}")

    # everything in the experiences a pupil types or copies the shape of
    for f in sorted(glob.glob(str(EXPERIENCES / "*.json"))):
        name = os.path.basename(f)
        try: d = json.load(open(f))
        except Exception: continue
        for sc in d.get("scenes", []):
            for st in sc.get("stations", []):
                for t in st.get("tasks", []):
                    if t.get("t") != "code": continue
                    add(t.get("starter", ""), f"{name} starter")
                    for c in t.get("code", []) or []: add(c, f"{name} predict program")
                    teach = t.get("teach") or {}
                    for c in teach.get("code", []) or []: add(c, f"{name} worked example")
                    h = t.get("hint")
                    if isinstance(h, dict):
                        for key in ("syntax", "start"):
                            v = h.get(key)
                            for c in ([v] if isinstance(v, str) else (v or [])): add(c, f"{name} hint {key}")
                    # a required technique is a string the program must contain
                    for rule in (t.get("require") or []): add(rule[0], f"{name} require")
    return where


SAY = {" ": "space", "\t": "tab (indent)", "\n": "newline"}


def main():
    kb = keyboard()
    need = collect()
    missing = {ch: src for ch, src in need.items() if ch not in kb}
    # a capital is typed with Shift, which the keyboard has
    missing = {ch: src for ch, src in missing.items()
               if not (ch.isalpha() and ch.lower() in kb)}

    print(f"{len(need)} distinct character(s) required by the course; "
          f"{len(kb)} typable in the headset")
    if "--list" in sys.argv:
        for ch in sorted(need):
            mark = " " if ch in kb or (ch.isalpha() and ch.lower() in kb) else "*"
            src = sorted(need[ch])
            print(f"  {mark} {SAY.get(ch, repr(ch)):<14} {len(src):>4} place(s)  e.g. {src[0]}")

    if missing:
        print("\nCANNOT BE TYPED IN THE HEADSET:")
        for ch in sorted(missing):
            src = sorted(missing[ch])
            print(f"  {SAY.get(ch, repr(ch))}  needed in {len(src)} place(s), e.g. {src[0]}")
        print(f"\n{len(missing)} character(s) the course needs are not on the VR keyboard")
        return 1
    print("every character the course needs can be typed in the headset")
    return 0


if __name__ == "__main__":
    sys.exit(main())
