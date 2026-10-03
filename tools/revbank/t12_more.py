"""1.2 Memory and storage: the ground the other two files left.

tools/revcoverage.py reported one teaching lesson in the whole course that no
question pointed at - ms-l05, choosing a storage device for a situation - and a
handful of outcomes nothing asked about: what data capacity means, most and least
significant bit, and text being binary like everything else. These are those
questions. The file exists because the coverage tool found the hole, which is the
only reason to trust a coverage tool.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written, sub, mp)

TOPIC = "1.2"

BANK = [

    # ============================================================ ms-l05
    sub("Choosing storage for a situation", "ms-l05-s1",
        ["ms-l05-o1", "ms-l05-o2"], [
        match("Match each situation to the storage that suits it best.",
              [["A film sold in a shop for people to take home",
                "Optical, because the discs are cheap to produce in huge numbers"],
               ["Work carried between school and home in a pocket",
                "Solid state, because it is small, light and has no moving parts"],
               ["Years of backups kept in a cupboard at low cost per gigabyte",
                "Magnetic, because it is the cheapest way to hold a great deal"],
               ["The drive a laptop boots and runs from",
                "Solid state, because it is fast and survives being carried about"]],
              fb="Match the characteristic to what the situation actually needs. Capacity, "
                 "cost, portability and durability pull in different directions.",
              diff="apply", exam=True),
        mcq("A company needs 40 TB of storage for a server in a machine room, at the lowest "
            "possible cost. Which should it choose?",
            "Magnetic hard disks",
            ["Solid state drives", "Optical discs", "USB memory sticks"],
            fb="Nothing is being carried anywhere, so portability and shock resistance do not "
               "matter. Cost per gigabyte is what is left, and magnetic wins it.",
            diff="apply", exam=True),
        written("A school is choosing storage for the laptops pupils carry between lessons. "
                "Explain why solid state storage suits this better than magnetic.", 2,
                [mp("solid state has no moving parts, so being knocked about does not damage "
                    "it",
                    ["no moving parts|nothing moves|no head|no platter|no disc|solid state",
                     "knock|dropped|drop|bump|damage|break|broken|durable|robust|"
                     "survive|carried|moved"],
                    exemplar="Solid state storage has no moving parts, so being knocked about "
                             "does not damage it."),
                 mp("and it is lighter, smaller and uses less power than a magnetic drive",
                    ["light|lighter|weigh|weighs|small|smaller|thinner|less power|"
                     "battery|portable|quieter|less heat|less electricity"],
                    exemplar="It is also lighter and uses less power, which matters on a "
                             "laptop.")],
                example="A laptop carried between lessons gets knocked, and a magnetic drive "
                        "has a head floating over a spinning platter that a knock can wreck. "
                        "Solid state storage has no moving parts at all, so it survives the "
                        "handling, and it is lighter and kinder to the battery as well.",
                paraphrase="Because nothing inside it moves, the drive is not harmed by the "
                           "bumps a carried machine takes, and it also weighs less and draws "
                           "less power.",
                fb="No moving parts, and one other advantage. Speed is a fair second mark too.",
                diff="apply", exam=True),
        tf("Solid state storage is always the right choice because it is the fastest.", False,
           fb="It is the most expensive per gigabyte. For 40 TB of backups in a cupboard, "
              "speed is not what matters.",
           exam=True),
    ]),

    # ============================================================ ms-l07
    sub("What data capacity means", "ms-l07-s1", ["ms-l07-o1"], [
        short("State what is meant by the data capacity of a storage device.",
              [mp("how much data it can hold",
                  ["how much|amount|quantity|how many",
                   "hold|holds|store|stored|storage|fit|contain|keep"],
                  exemplar="How much data the device can hold.")],
              example="The amount of data the device can hold, measured in bytes and their "
                      "multiples — kilobytes, megabytes, gigabytes and terabytes.",
              paraphrase="The quantity of data that will fit on it.",
              fb="How much it holds. Speed and cost are different characteristics.",
              cw="state"),
        written("Explain why a 64 GB memory stick does not hold 64 GB of a user's files.", 2,
                [mp("some of the space is taken by the file system the device needs",
                    ["file system|filesystem|formatting|format|formatted|index|"
                     "directory|overhead|system files|structure"],
                    exemplar="Some of the capacity is taken by the file system the device needs "
                             "to track where files are."),
                 mp("and the manufacturer counts a gigabyte as 1,000 million bytes rather than "
                    "1,073,741,824",
                    ["1000|1024|thousand|manufacturer|counts|different|way of counting|"
                     "powers of two|binary|decimal|advertised"],
                    exemplar="Manufacturers also count a gigabyte as 1,000 million bytes, "
                             "while the computer counts it in powers of two.")],
                example="Part of the space holds the file system — the index of where every "
                        "file is — which the device cannot work without. And the manufacturer "
                        "counts a gigabyte as 1,000 million bytes while the operating system "
                        "counts 1,073,741,824, so the figure on the box is larger than the "
                        "figure on screen before a single file is copied.",
                paraphrase="Room is needed for the structure that records where files are, and "
                           "the maker's gigabyte is a round thousand million bytes rather than "
                           "the power of two the computer uses.",
                fb="Either reason earns a mark; both earn two.",
                diff="stretch"),
    ]),

    # ============================================================ ms-l08
    sub("Most and least significant bit", "ms-l08-s3", ["ms-l08-o3"], [
        mcq("In the binary number 10010110, which bit is the most significant?",
            "The leftmost 1, worth 128",
            ["The rightmost 0, worth 1", "The leftmost 0, worth 64",
             "The 1 in the middle, worth 16"],
            fb="Most significant means worth the most. In an 8-bit number that is the left-hand "
               "end, worth 128.",
            diff="retrieve"),
        mcq("What is the least significant bit of 11001101?",
            "1", ["0", "128", "There is not one"],
            fb="The least significant bit is the right-hand one, worth 1. Here it is a 1.",
            diff="retrieve"),
        written("Explain why changing the most significant bit of an 8-bit number changes it by "
                "far more than changing the least significant bit.", 2,
                [mp("the most significant bit is worth 128 and the least significant 1",
                    ["128|1|place value|place values|worth|value|weight"],
                    exemplar="The most significant bit is worth 128 and the least significant "
                             "bit is worth 1."),
                 mp("so each place to the left is worth twice the one to its right",
                    ["double|doubles|twice|times two|doubling|power|powers of two|"
                     "each place|every place"],
                    developed=True,
                    exemplar="This is because each place to the left is worth twice the one to "
                             "its right.")],
                example="Each place in a binary number is worth twice the place to its right, "
                        "so an 8-bit number runs 128, 64, 32, 16, 8, 4, 2, 1. Flipping the "
                        "left-hand bit changes the value by 128; flipping the right-hand one "
                        "changes it by 1.",
                paraphrase="Every column is double the one beside it, so the leftmost position "
                           "carries 128 while the rightmost carries only 1.",
                fb="The two place values, and the doubling that produces them.",
                diff="understand"),
    ]),

    # ============================================================ ms-l12
    sub("Text as numbers", "ms-l12-s1", ["ms-l12-o1"], [
        mcq("How does a computer store the letter K?",
            "As a binary number given to it by a character set",
            ["As a tiny picture of the letter",
             "As the shape of the letter in the font",
             "As the word 'K' in the operating system"],
            fb="Every character has a number, and the number is stored in binary like "
               "everything else. The font decides how it is drawn, not how it is stored.",
            diff="understand"),
        written("Explain why two computers need to use the same character set to exchange text "
                "correctly.", 2,
                [mp("a character set decides which number stands for which character",
                    ["number|code|value|binary",
                     "character|characters|letter|letters|symbol|symbols"],
                    exemplar="A character set decides which number stands for which "
                             "character."),
                 mp("so with different sets the same number would be shown as a different "
                    "character",
                    ["different|another|wrong|not the same",
                     "shown|displayed|appear|appears|read|interpret|interpreted|"
                     "character|letter|symbol|gibberish|nonsense"],
                    developed=True,
                    exemplar="So the same number would be shown as a different character on the "
                             "other computer.")],
                example="A character set is an agreement about which number means which "
                        "character. If the sending computer uses one agreement and the "
                        "receiving one uses another, the same binary number is read as a "
                        "different character, and the text arrives as nonsense.",
                paraphrase="The set is what links each code to a particular symbol, so if the "
                           "two machines use different ones the identical number is displayed "
                           "as the wrong character.",
                fb="What a character set decides, and what goes wrong when the two disagree.",
                diff="understand", exam=True),
    ]),
]
