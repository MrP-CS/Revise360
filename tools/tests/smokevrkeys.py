"""Can every Python question still be typed, now the keyboard only shows some keys?

The adaptive keyboard is a scaffold, and a scaffold that removes a key somebody
needs is not a scaffold, it is a question nobody can answer. This goes through
every Python activity in the course and checks that everything the question
itself contains - its starter, the program it shows, its worked example, its
hint, the lines it requires, the values it prescribes, the output it demands,
and the solution the course stores - can be typed from the keys that question
puts on the keyboard.

It does not open a browser. The keys a question offers are `vrKeys`, written by
tools/vrsymbols.py, and the keyboard draws exactly those plus the letters, the
digits when the question wants them and the editing keys; js/vr.js is read here
to confirm that is still what it does, so this cannot pass while the renderer
quietly ignores the metadata.

What it cannot promise: a question is marked by running it, so a pupil may
answer in a way nobody wrote down, using a character no source here contains.
That is what `More symbols` on the keyboard is for, and this checks that it is
still there.

  python3 tools/tests/smokevrkeys.py
  python3 tools/tests/smokevrkeys.py --list    # every question and its keys
"""
import os, re, sys, collections
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from paths import SITE
import vrsymbols

VR = (SITE / "js" / "vr.js").read_text(encoding="utf-8")


def renderer_contract():
    """What js/vr.js actually draws, read rather than assumed."""
    out = {}
    out["reads_metadata"] = bool(re.search(r"v\.task\.vrKeys", VR))
    out["filters"] = bool(re.search(r"SYMBOLS\.filter\(\s*ch\s*=>\s*want\.has\(ch\)", VR))
    out["letters_always"] = bool(re.search(r"LETTERS\.map\(row\)", VR))
    # By the id of the control, not by its wording: the phrase "More symbols"
    # appears in a comment above it, so matching the text passed with the button
    # itself deleted.
    out["escape_hatch"] = bool(re.search(r'id:\s*"kmore"', VR)) and "More symbols" in VR
    out["reflows"] = bool(re.search(r"symRows\.push", VR))
    out["physical_unfiltered"] = bool(re.search(r"kk\.length === 1", VR))
    m = re.search(r"const SYMBOLS = \[(.*?)\];", VR, re.S)
    syms = set()
    if m:
        for a, b in re.findall(r'"((?:[^"\\]|\\.)*)"' + "|" + r"'((?:[^'\\]|\\.)*)'", m.group(1)):
            t = (a or b)
            if t:
                syms.add(t.encode().decode("unicode_escape"))
    out["symbols"] = syms
    return out


def main():
    con = renderer_contract()
    bad = 0

    def ok(cond, said):
        nonlocal bad
        print(("  ok  " if cond else "  FAIL ") + said)
        if not cond: bad += 1

    ok(con["reads_metadata"], "the keyboard reads each question's own key list")
    ok(con["filters"], "and draws only those symbols")
    ok(con["letters_always"], "the letters are always there")
    ok(con["reflows"], "the symbol row is reflowed, not padded with dead keys")
    ok(con["escape_hatch"], "there is a way to reach the rest of the symbols")
    ok(con["physical_unfiltered"],
       "a paired keyboard types any character, whatever the VR keyboard shows")
    ok(len(con["symbols"]) > 20,
       f"the full symbol set is still in one place ({len(con['symbols'])} keys)")

    # ---- every question's own material must be typable from its own keys
    letters = set("abcdefghijklmnopqrstuvwxyz")
    digits = set("0123456789")
    short, missing, n = [], [], 0
    sizes = collections.Counter()
    by_lesson = collections.defaultdict(list)
    for f, d, lid, k, i, t, sol in vrsymbols.code_tasks():
        n += 1
        offered = set(t.get("vrKeys") or [])
        if not t.get("vrKeys"):
            short.append(f"{lid} s{k + 1} a{i + 1}")
            continue
        sizes[len(offered - digits)] += 1
        by_lesson[lid].append(len(offered - digits))
        need = set()
        for source, s in vrsymbols.task_sources(t, sol):
            for ch in str(s):
                if ch.isspace() or ch.lower() in letters:
                    continue          # letters and Shift are always there
                need.add(ch)
        gone = sorted(need - offered)
        if gone:
            missing.append((lid, k + 1, i + 1, gone))
        if "--list" in sys.argv:
            print("  %-8s s%d a%d  %s" % (lid, k + 1, i + 1, " ".join(sorted(offered))))

    ok(not short,
       f"every Python question carries its key list ({len(short)} without one"
       + (": " + ", ".join(short[:4]) if short else "") + ")")
    ok(not missing,
       f"every character a question contains can be typed from its own keys "
       f"({len(missing)} question(s) short)")
    for lid, k, i, gone in missing[:8]:
        print(f"      {lid} station {k} activity {i} needs {gone}")

    full = len(con["symbols"])
    med = sorted(x for s, c in sizes.items() for x in [s] * c)
    med = med[len(med) // 2] if med else 0
    print()
    print(f"{n} Python questions. The symbol row holds {med} keys for the middle one, "
          f"out of {full}.")
    print("how it grows through the Python course, which is where the fade lives:")
    for lid in sorted(by_lesson):
        if not lid.startswith("pr-"): continue
        v = sorted(by_lesson[lid])
        print(f"  {lid}  median {v[len(v) // 2]:>2}   from {min(v)} to {max(v)}")
    print()
    print("every question can be typed from the keys it shows" if not bad
          else f"{bad} problem(s)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
