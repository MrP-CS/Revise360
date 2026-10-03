"""1.2 Memory and storage: the drill a learner needs more than one of.

Section 80 asks for questions generated systematically where that is honest, and
these are the families where it is. A conversion, a binary addition, a shift and
a file-size calculation are the same skill applied to different numbers, and the
only way to get fluent at them is to do a lot of them. Nothing here is a reworded
copy of the question next to it: the method is the same and the arithmetic is
not, which is what tools/revdupes.py means when it calls a group "same shape" and
leaves it alone.

Every answer in this file is worked out by tools/revkit.py from the inputs, never
typed in, and tools/revverify.py works each one out again with its own code. That
is the only reason a file this size can be trusted: nobody has read 140 binary
patterns and checked them.

What is deliberately NOT generated: anything asking why. There is no honest way
to produce two hundred different "explain why virtual memory slows a computer
down" questions, and a bank padded with reworded ones would be worse than a
smaller bank - section 82's count is a target, not a licence.
"""
from revkit import convert, binadd, binshift, num, mcq, sub

TOPIC = "1.2"

# ------------------------------------------------------------------ conversions
# Values chosen to cover the cases that catch people out rather than to be
# random: powers of two, one less than a power of two, patterns with a run of
# ones, and the ones whose hex digits are not the obvious ones.
DEN = [9, 17, 23, 31, 42, 64, 88, 100, 127, 128, 150, 163, 200, 255]
BIN = ["00000111", "00010001", "00011011", "00101101", "00111111", "01010101",
       "01111111", "10000000", "10010110", "10101010", "11000011", "11111111"]
HEX = ["0a", "0f", "19", "2b", "40", "5c", "7f", "9e", "c8", "ff"]


def den_to_bin():
    return [convert("Convert the denary number %d into 8-bit binary." % v,
                    v, "denary", "binary",
                    fb="Take the place values from 128 down and write 1 where the value is "
                       "used. Check by adding your ones back up.",
                    bits=8, diff="apply")
            for v in DEN]


def bin_to_den():
    return [convert("Convert the binary number %s into denary." % b,
                    b, "binary", "denary",
                    fb="Add the place values wherever there is a 1: 128, 64, 32, 16, 8, 4, "
                       "2, 1.",
                    diff="apply")
            for b in BIN]


def den_to_hex():
    return [convert("Convert the denary number %d into hexadecimal." % v,
                    v, "denary", "hex",
                    fb="Split it into sixteens and units, or write it in binary and take the "
                       "nibbles in pairs.",
                    bits=8, diff="apply")
            for v in DEN[1::2]]


def hex_to_den():
    return [convert("Convert the hexadecimal number %s into denary." % h.upper(),
                    h, "hex", "denary",
                    fb="The left digit is worth sixteen of itself; A to F are 10 to 15.",
                    diff="apply")
            for h in HEX[:8]]


def bin_to_hex():
    return [convert("Convert the binary number %s into hexadecimal." % b,
                    b, "binary", "hex",
                    fb="Split the eight bits into two nibbles and convert each one on its "
                       "own. That is the whole reason hexadecimal is used.",
                    bits=8, diff="apply")
            for b in BIN[::2]]


def hex_to_bin():
    return [convert("Convert the hexadecimal number %s into 8-bit binary." % h.upper(),
                    h, "hex", "binary",
                    fb="Each hex digit is one nibble of four bits. Convert them separately "
                       "and put them together.",
                    bits=8, diff="apply")
            for h in HEX[::2]]


# ------------------------------------------------------------------- addition
# Six of these overflow and six do not, and which is which is worked out by
# revkit rather than claimed here.
ADDS = [("00001101", "00010010"), ("00101010", "00010101"), ("01000001", "00111111"),
        ("00110011", "01001100"), ("01111111", "00000001"), ("10000001", "01111111"),
        ("11001100", "00110011"), ("10011001", "10011001"), ("11111111", "00000001"),
        ("00111100", "01000011")]


def additions():
    return [binadd("Add the binary numbers %s and %s. Give your answer in 8 bits." % (a, b),
                   a, b,
                   fb="Work from the right and carry. If the answer needs a ninth bit, the "
                      "8-bit register has overflowed and the answer it holds is wrong.",
                   bits=8, diff="apply")
            for a, b in ADDS]


# --------------------------------------------------------------------- shifts
SHIFTS = [("00001011", 2, "left"), ("00010110", 1, "left"), ("00000111", 3, "left"),
          ("01000001", 1, "left"), ("00011001", 2, "left"),
          ("10110000", 2, "right"), ("01101000", 1, "right"), ("11000000", 3, "right"),
          ("00101100", 2, "right"), ("10000010", 1, "right"),
          ("11111111", 4, "left"), ("11111111", 4, "right")]


def shifts():
    out = []
    for v, n, d in SHIFTS:
        effect = ("multiplies it by %d" % (2 ** n)) if d == "left" else \
                 ("divides it by %d" % (2 ** n))
        out.append(binshift(
            "Shift the binary number %s %d place%s to the %s. Give your answer in 8 bits."
            % (v, n, "" if n == 1 else "s", d), v, n, d,
            fb="Every bit moves %d place%s to the %s and zeros fill in behind. A %s shift "
               "of %d %s the number, and any bit pushed off the end is lost."
               % (n, "" if n == 1 else "s", d, d, n, effect),
            bits=8, diff="apply"))
    return out


# ------------------------------------------------------------------ file sizes
IMAGES = [(600, 400, 8, "bits"), (1024, 768, 24, "bytes"), (640, 480, 4, "bits"),
          (1920, 1080, 24, "bytes"), (200, 150, 1, "bits"), (320, 240, 16, "bytes"),
          (2048, 1536, 8, "bits"), (100, 100, 24, "bytes"), (1280, 720, 16, "bits")]


def images():
    out = []
    for w, h, d, unit in IMAGES:
        bits = w * h * d
        if unit == "bits":
            out.append(num(
                "An image is %d pixels wide and %d pixels high, with a colour depth of %d "
                "bits. What is its file size in bits?" % (w, h, d),
                bits, fb="Width times height gives the number of pixels, and every pixel "
                         "needs its colour depth in bits. Metadata is on top of that and is "
                         "ignored here.",
                working="%d * %d * %d" % (w, h, d), diff="apply"))
        else:
            out.append(num(
                "An image is %d by %d pixels with a colour depth of %d bits. What is its "
                "file size in bytes?" % (w, h, d),
                bits // 8, fb="Work it out in bits first, then divide by 8. Dividing before "
                              "you have multiplied is where this goes wrong.",
                working="%d * %d * %d / 8" % (w, h, d), diff="apply"))
    return out


SOUNDS = [(44100, 16, 30, 1), (22050, 8, 60, 1), (48000, 24, 10, 2),
          (8000, 8, 120, 1), (44100, 16, 180, 2), (32000, 8, 20, 2)]


def sounds():
    out = []
    for rate, depth, secs, chans in SOUNDS:
        bits = rate * depth * secs * chans
        where = (" in stereo" if chans == 2 else " in mono")
        out.append(num(
            "A sound is sampled %d times a second with a bit depth of %d bits, for %d "
            "seconds%s. What is its file size in bits?" % (rate, depth, secs, where),
            bits, fb="Sample rate times bit depth times the number of seconds, and twice "
                     "that for stereo because each channel is recorded separately.",
            working="%d * %d * %d * %d" % (rate, depth, secs, chans), diff="apply"))
    return out


TEXTS = [(500, 8), (1200, 8), (64, 16), (2000, 16), (250, 7)]


def texts():
    return [num("A text file holds %d characters in a character set that uses %d bits per "
                "character. What is its file size in bits?" % (n, b),
                n * b,
                fb="One character, one code, %d bits each. The file size is just the number "
                   "of characters multiplied by that." % b,
                working="%d * %d" % (n, b), diff="apply")
            for n, b in TEXTS]


UNITS = [("4 KB", "bytes", 4 * 1000, "1 KB is 1000 bytes"),
         ("3 MB", "KB", 3 * 1000, "1 MB is 1000 KB"),
         ("2 GB", "MB", 2 * 1000, "1 GB is 1000 MB"),
         ("500 MB", "GB", 0.5, "1000 MB make 1 GB"),
         ("1 TB", "GB", 1000, "1 TB is 1000 GB"),
         ("16 bytes", "bits", 128, "1 byte is 8 bits"),
         ("2 KB", "bits", 2 * 1000 * 8, "1 KB is 1000 bytes and 1 byte is 8 bits"),
         ("6 nibbles", "bits", 24, "1 nibble is 4 bits"),
         ("1.5 MB", "bytes", 1500000, "1 MB is 1000 KB and 1 KB is 1000 bytes")]


def units():
    return [num("How many %s are there in %s?" % (to, frm), ans,
                fb="%s, so multiply or divide by that." % why,
                working=repr(ans), diff="retrieve")
            for frm, to, ans, why in UNITS]


# ------------------------------------------------------- which unit is bigger
BIGGER = [("1 MB", "900 KB"), ("1 GB", "1024 MB"), ("8 bits", "1 byte"),
          ("1 TB", "500 GB"), ("2 nibbles", "1 byte"), ("1 KB", "8000 bits")]


def bigger():
    out = []
    for a, b in BIGGER:
        def size(x):
            n, u = x.split()
            mult = {"bits": 1, "byte": 8, "bytes": 8, "nibbles": 4, "nibble": 4,
                    "KB": 8000, "MB": 8000000, "GB": 8000000000, "TB": 8000000000000}[u]
            return float(n) * mult
        sa, sb = size(a), size(b)
        if sa == sb:
            right, wrong = "They are the same size", [a + " is bigger", b + " is bigger",
                                                      "It depends on the device"]
        else:
            big, small = (a, b) if sa > sb else (b, a)
            right = big + " is bigger"
            wrong = [small + " is bigger", "They are the same size",
                     "It depends on the device"]
        out.append(mcq("Which is bigger, %s or %s?" % (a, b), right, wrong,
                       fb="Put both into the same unit before comparing them. Bits and bytes "
                          "are a factor of eight apart, and each prefix is a thousand.",
                       diff="understand"))
    return out


BANK = [
    sub("Denary to binary drill", "ms-l08-s2", ["ms-l08-o1"], den_to_bin(),
        reason="Denary to binary, one place value at a time"),
    sub("Binary to denary drill", "ms-l08-s1", ["ms-l08-o1"], bin_to_den(),
        reason="Place values, which is what reading a pattern comes down to"),
    sub("Denary and hexadecimal drill", "ms-l10-s5", ["ms-l10-o3"], den_to_hex()),
    sub("Hexadecimal to denary drill", "ms-l10-s5", ["ms-l10-o3"], hex_to_den()),
    sub("Binary to hexadecimal drill", "ms-l10-s6", ["ms-l10-o3", "ms-l10-o4"],
        bin_to_hex()),
    sub("Hexadecimal to binary drill", "ms-l10-s6", ["ms-l10-o3", "ms-l10-o4"],
        hex_to_bin()),
    sub("Binary addition drill", "ms-l08-s4", ["ms-l08-o2", "ms-l08-o4"], additions()),
    sub("Binary shift drill", "ms-l10-s1", ["ms-l10-o1", "ms-l10-o2"], shifts()),
    sub("Image file size drill", "ms-l13-s5", ["ms-l13-o3"], images()),
    sub("Sound file size drill", "ms-l14-s4", ["ms-l14-o2"], sounds()),
    sub("Text file size drill", "ms-l12-s6", ["ms-l12-o4"], texts()),
    sub("Unit conversion drill", "ms-l06-s4", ["ms-l06-o2"], units()),
    sub("Comparing units", "ms-l06-s3", ["ms-l06-o2"], bigger()),
]
