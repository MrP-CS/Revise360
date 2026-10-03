"""1.2 Memory and storage: the revision bank.

The widest topic in the course and the one with the arithmetic in it, so this is
where most of the calculation, conversion and shift questions live. Every one of
those has its answer computed from its own inputs by tools/revkit.py and worked
out again, independently, by tools/revverify.py: nobody types a binary pattern
into this file by hand.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written, extended,
                    num, step, convert, binadd, binshift, codeout, sub, mp)

TOPIC = "1.2"

VOLATILE = ("volatile|lose|lost|loses|disappear|erased|wiped|cleared|not kept|"
            "not stored|emptied|gone|empties|empty")
NOT_NV = [["nonvolatile"]]        # saying the opposite costs the mark
NOT_V = [["volatile"]]
POWER = "power|switched off|turned off|electricity|shut down|no power|off"
NOT_VOLATILE = ("non-volatile|nonvolatile|not volatile|keeps|keep|retains|retain|"
                "stays|remains|still there|permanent|permanently|kept")

BANK = [

    # ============================================================ ms-l01 Memory bay
    sub("Why primary storage?", "ms-l01-s1", ["ms-l01-o1"], [
        mcq("Why does a computer need primary storage?",
            "The CPU can only work on data and instructions that are in main memory",
            ["Primary storage keeps files safe when the power is off",
             "Primary storage is cheaper per gigabyte than secondary storage",
             "Primary storage holds the operating system permanently"],
            fb="The CPU reaches main memory directly. Anything on a drive has to be "
               "loaded into it first."),
        short("State what is meant by primary storage.",
              [mp("memory the CPU can access directly",
                  ["cpu|processor", "direct|directly|straight|immediately"],
                  ["main memory|ram|rom|accessed by the cpu"],
                  exemplar="Memory the CPU can access directly.")],
              example="Memory that the CPU can access directly, such as RAM and ROM.",
              paraphrase="The memory the processor reads from straight away.",
              fb="Directly accessible by the CPU is the definition; RAM and ROM are the "
                 "examples.", cw="state"),
        tf("A hard disk is an example of primary storage.", False,
           fb="False. A hard disk is secondary storage. Primary storage is RAM and ROM."),
    ]),

    sub("RAM", "ms-l01-s2", ["ms-l01-o2", "ms-l01-o3"], [
        mcq("Which statement about RAM is true?",
            "It is volatile, so its contents are lost when the power is switched off",
            ["It is non-volatile, so its contents survive a restart",
             "It can only be read from, never written to",
             "It holds the instructions that start the computer up"],
            fb="RAM is volatile and is read from and written to constantly. The start-up "
               "instructions are in ROM."),
        short("State what RAM stands for.",
              [mp("random access memory", ["random access memory|random access"],
                  exemplar="Random access memory.")],
              example="Random access memory.",
              paraphrase="It stands for random access memory.",
              fb="Random access memory. 'Read-and-write memory' describes it but is not "
                 "what the letters stand for.", cw="state"),
        written("Explain what is meant by saying that RAM is volatile.", 2,
                [mp("its contents are lost when the power is removed",
                    [VOLATILE, POWER], reject=[["ram|memory|it", "nonvolatile"]],
                    exemplar="Everything in RAM is lost when the power is switched off."),
                 mp("so anything that must be kept has to be saved to secondary storage",
                    ["save|saved|store|stored|written|copied|kept",
                     "secondary storage|hard disk|drive|ssd|disk"],
                    exemplar="So anything that has to be kept must be saved to secondary "
                             "storage.")],
                example="RAM is volatile, which means everything in it is lost as soon as "
                        "the power is switched off, so anything that needs to be kept has "
                        "to be saved to secondary storage first.",
                paraphrase="Its contents disappear when the computer is turned off, so work "
                           "has to be written to a drive if you want it afterwards.",
                fb="Volatile means lost without power. The second mark is for what follows "
                   "from it.", diff="understand"),
    ]),

    sub("ROM", "ms-l01-s3", ["ms-l01-o2", "ms-l01-o3"], [
        mcq("What is held in ROM?",
            "The instructions the computer needs to start up",
            ["The programs the user is running now",
             "The user's documents and photographs",
             "Data that has been swapped out of RAM"],
            fb="ROM holds the boot program, which runs before anything can be loaded from a "
               "drive."),
        short("Give one reason the start-up instructions are kept in ROM rather than RAM.",
              [mp("ROM is non-volatile, so they are still there when the power comes on",
                  [NOT_VOLATILE], reject=[["rom|it", "volatile"]],
                  exemplar="ROM is non-volatile, so the instructions are still there when "
                           "the computer is switched on.")],
              example="ROM is non-volatile, so the instructions are still there when the "
                      "power comes back on. RAM would be empty.",
              paraphrase="ROM keeps its contents without power, and RAM does not.",
              fb="If the boot instructions were in RAM there would be nothing to run when "
                 "the computer was switched on.", cw="give", diff="understand"),
        tf("ROM is normally much smaller than RAM.", True,
           fb="True. ROM only has to hold the start-up instructions, so it is measured in "
              "megabytes while RAM is measured in gigabytes."),
    ]),

    sub("RAM compared with ROM", "ms-l01-s4", ["ms-l01-o2"], [
        sort("Sort each statement by whether it describes RAM or ROM.",
             ["RAM", "ROM"],
             [["Volatile", "RAM"], ["Non-volatile", "ROM"],
              ["Holds the programs currently in use", "RAM"],
              ["Holds the start-up instructions", "ROM"],
              ["Written to constantly while the computer runs", "RAM"],
              ["Usually only a few megabytes", "ROM"]],
             fb="Volatile and busy is RAM; non-volatile and small is ROM.",
             diff="understand"),
        written("Compare RAM and ROM.", 4,
                [mp("RAM is volatile; ROM is non-volatile",
                    ["ram", VOLATILE], ["rom", NOT_VOLATILE],
                    reject=[["ram", "nonvolatile"], ["rom", "volatile"]],
                    exemplar="RAM is volatile and ROM is non-volatile."),
                 mp("RAM holds what is in use now; ROM holds the start-up instructions",
                    ["ram", "currently|in use|running|open|being used|loaded"],
                    ["rom", "start|boot|bios|startup|startup instructions"],
                    exemplar="RAM holds the programs in use while ROM holds the start-up "
                             "instructions."),
                 mp("RAM is read from and written to; ROM is normally only read",
                    ["written to|read/write|readwrite|can be changed|"
                     "can be overwritten|writable|both read"],
                    ["read only|only read|cannot be written|not written|cannot be changed"],
                    exemplar="RAM can be written to, while ROM is normally only read."),
                 mp("RAM is much larger than ROM",
                    ["larger|bigger|more|gigabyte|gb"],
                    exemplar="RAM is much larger than ROM.")],
                example="RAM is volatile while ROM is non-volatile, so RAM empties when the "
                        "power goes and ROM does not. RAM holds the programs and data in use "
                        "at the moment, while ROM holds the instructions that start the "
                        "computer. RAM is written to constantly, while ROM is normally only "
                        "read. RAM is also far larger, measured in gigabytes against a few "
                        "megabytes of ROM.",
                paraphrase="RAM empties when the power goes and ROM does not. RAM stores "
                           "whatever software is running and is changed all the time, "
                           "while ROM stores the boot instructions and is only read. "
                           "There is also far more RAM than ROM.",
                fb="A comparison needs both sides of each point. Four differences, each "
                   "naming what RAM does and what ROM does.",
                cw="compare", diff="apply", exam=True),
    ]),

    sub("The boot sequence", "ms-l01-s5", ["ms-l01-o3"], [
        order("Put the steps of starting a computer in order.",
              ["The computer is switched on",
               "The instructions in ROM run",
               "The operating system is loaded from secondary storage into RAM",
               "The user's programs can be loaded into RAM"],
              fb="ROM first, because it is the only memory with anything in it when the "
                 "power comes on.",
              diff="apply", exam=True),
        written("Explain why the operating system has to be copied into RAM when a computer "
                "starts.", 2,
                [mp("the CPU can only work on data and instructions that are in RAM",
                    ["cpu|processor", "only|has to|must|can only|needs"],
                    ["ram|main memory", "direct|directly|access"],
                    exemplar="The CPU can only work on instructions that are in RAM."),
                 mp("and the operating system is stored on secondary storage, which the CPU "
                    "cannot run from",
                    ["hard disk|drive|ssd|secondary storage|disk"],
                    developed=True,
                    exemplar="It is kept on the hard disk, so it has to be copied across "
                             "before it can run.")],
                example="The CPU can only execute instructions that are in RAM, and the "
                        "operating system is stored on secondary storage, so it has to be "
                        "copied into RAM before any of it can run.",
                paraphrase="The processor only runs what is in main memory, which means the "
                           "operating system has to be loaded there from the drive first.",
                fb="The CPU's reach is the reason. The drive is where the operating system "
                   "lives the rest of the time.",
                diff="apply"),
    ]),

    sub("More RAM, faster computer?", "ms-l01-s6", ["ms-l01-o1"], [
        mcq("A computer with 4 GB of RAM is slow when several large programs are open. Why "
            "would adding more RAM help?",
            "More programs can be held in RAM at once, so less has to be swapped to "
            "secondary storage",
            ["The CPU will complete more cycles each second",
             "The hard disk will spin faster",
             "The operating system will need fewer instructions"],
            fb="More RAM does not make the CPU faster. It reduces how often the computer "
               "has to use the much slower drive.",
            diff="apply"),
        written("A computer already has far more RAM than it ever uses. Explain why adding "
                "more would make almost no difference.", 2,
                [mp("everything that is needed already fits in RAM",
                    ["already|enough|fits|never full|not full|spare|unused|plenty|nothing is being|room to spare"],
                    exemplar="Everything that is needed already fits in RAM."),
                 mp("so nothing is being swapped out, and there is nothing for the extra "
                    "RAM to prevent",
                    ["virtual memory|swapped out|swap space|swapping|paging|secondary storage|pushed out|trips to the disk|slow trips"],
                    developed=True,
                    exemplar="So virtual memory is never being used, and the extra RAM has "
                             "nothing to prevent.")],
                example="If everything the computer needs already fits in RAM, it is never "
                        "having to swap anything out to virtual memory, so extra RAM has "
                        "nothing to prevent and the computer is no faster.",
                paraphrase="Because nothing is being pushed out to the disk in the first "
                           "place, more memory has no slow trips to save and makes no "
                           "difference.",
                fb="More of something you are not short of changes nothing. The mark is for "
                   "saying what the extra RAM would have been preventing.",
                diff="stretch", exam=True),
    ]),

    # ============================================================ ms-l02 Swap space
    sub("When RAM runs out", "ms-l02-s1", ["ms-l02-o1"], [
        mcq("What happens when RAM becomes full and another program is opened?",
            "Data that is not in use is moved out to secondary storage to make room",
            ["The computer switches itself off to protect the data",
             "The CPU reduces its clock speed until space is free",
             "The oldest file on the hard disk is deleted"],
            fb="Something is moved out rather than lost. The space it moves to is virtual "
               "memory."),
        short("State what is meant by virtual memory.",
              [mp("secondary storage used as if it were extra RAM",
                  ["secondary storage|hard disk|hard drive|ssd|disk|drive",
                   "as if|like|extra ram|more ram|pretend|instead of ram|acts as|"
                   "additional memory|extra memory|more memory|used as memory"],
                  exemplar="Part of secondary storage used as if it were extra RAM.")],
              example="A part of secondary storage that is used as if it were extra RAM.",
              paraphrase="Space on the drive that the computer treats as additional memory.",
              fb="It is storage behaving as memory, not a separate kind of chip.",
              cw="state"),
    ]),

    sub("Why virtual memory is slow", "ms-l02-s4", ["ms-l02-o2"], [
        written("Explain why a computer that is using virtual memory heavily feels slow.", 3,
                [mp("data has to be moved between RAM and secondary storage",
                    ["move|moved|moving|swap|swapped|transfer|copied|written|shuffling|shuffled|pushed|sent|shunted",
                     "ram|memory", "disk|drive|storage|ssd|hdd"],
                    exemplar="Data is moved between RAM and secondary storage."),
                 mp("secondary storage is much slower to access than RAM",
                    ["slow|slower|takes longer|less quick|not as fast"],
                    exemplar="Secondary storage is much slower to read than RAM."),
                 mp("so the CPU waits for data and the programs run more slowly",
                    ["wait|waiting|idle|delay|held up|pause|stall"],
                    ["program|computer|it|system", "slow|slower|lag|freeze|grind"],
                    developed=True,
                    exemplar="This means the CPU is left waiting, so the program runs more "
                             "slowly.")],
                example="When RAM is full, data is constantly moved between RAM and "
                        "secondary storage. Secondary storage is far slower to read and "
                        "write than RAM, so the CPU spends time waiting for data to arrive "
                        "and the programs run noticeably more slowly.",
                paraphrase="The computer keeps shuffling data out to the drive and back, and "
                           "because the drive is much slower than memory the processor is "
                           "held up and everything drags.",
                fb="Three ideas: the moving, the speed difference, and what that does to the "
                   "program. The third needs to be joined to the second.",
                hint="What is being moved, how fast is the place it moves to, and what is "
                     "the CPU doing meanwhile?",
                diff="apply", exam=True),
        mcq("Which of these would reduce how much a computer relies on virtual memory?",
            "Installing more RAM",
            ["Installing a larger hard disk",
             "Increasing the CPU clock speed",
             "Defragmenting the hard disk"],
            fb="Virtual memory is used because RAM ran out, so more RAM is what stops it. A "
               "bigger disk just gives more room for the swapping to happen in.",
            diff="apply"),
    ]),

    sub("Avoiding virtual memory", "ms-l02-s5", ["ms-l02-o1", "ms-l02-o2"], [
        multi("Which of these would help a computer avoid using virtual memory? "
              "Tick all that apply.",
              ["Closing programs that are not being used",
               "Installing more RAM",
               "Choosing programs that need less memory",
               "Buying a faster CPU",
               "Using a larger monitor"],
              ["Closing programs that are not being used", "Installing more RAM",
               "Choosing programs that need less memory"],
              fb="Anything that keeps what is needed inside RAM. A faster CPU does not "
                 "change how much memory a program asks for.",
              diff="apply"),
        short("State one sign that a computer is relying on virtual memory.",
              [mp("it becomes noticeably slower, and the drive is busy",
                  ["slow|slower|lag|freeze|grind|unresponsive|stutter|delay"],
                  ["drive|disk|hard disk|ssd", "busy|light|noise|spinning|active"],
                  exemplar="It becomes much slower to respond.")],
              example="Everything becomes much slower, and the drive is busy even though "
                      "nothing is being saved.",
              paraphrase="The machine starts dragging and the disk light stays on.",
              fb="Slowness is the symptom everybody notices; the busy drive is the one that "
                 "says why.", cw="state"),
    ]),

    # ============================================================ ms-l03 Storage warehouse
    sub("Why secondary storage?", "ms-l03-s1", ["ms-l03-o1"], [
        written("Explain why a computer needs secondary storage as well as RAM.", 2,
                [mp("RAM is volatile, so its contents are lost when the power goes",
                    ["ram|memory|main memory", VOLATILE],
                    reject=[["ram|memory|main memory", "nonvolatile"]],
                    exemplar="RAM is volatile, so everything in it is lost when the power "
                             "goes off."),
                 mp("secondary storage is non-volatile, so files are still there next time",
                    [NOT_VOLATILE],
                    reject=[["secondary storage|hard disk|drive|ssd|disk", "volatile"]],
                    exemplar="Secondary storage is non-volatile, so files are still there "
                             "next time.")],
                example="RAM is volatile, so anything in it disappears when the computer is "
                        "switched off. Secondary storage is non-volatile, so files are still "
                        "there the next time the computer is used.",
                paraphrase="Memory empties when the power goes, while a drive keeps what is "
                           "on it, so work survives being switched off.",
                fb="One mark for what RAM cannot do, one for what secondary storage can.",
                diff="understand"),
        mcq("Which is the best description of secondary storage?",
            "Non-volatile storage used to keep programs and data when the computer is off",
            ["Memory the CPU reads from directly during the cycle",
             "A small amount of very fast memory inside the CPU",
             "Space used only when RAM becomes full"],
            fb="Virtual memory is one use of secondary storage, not what it is."),
    ]),

    sub("Types of storage", "ms-l03-s2", ["ms-l03-o2", "ms-l03-o3"], [
        match("Match each storage type to how it stores data.",
              [["Magnetic", "Magnetised patterns on spinning platters"],
               ["Optical", "Pits and lands burnt into a disc, read by a laser"],
               ["Solid state", "Charge held in flash memory cells, with no moving parts"]],
              fb="Spin, laser, no moving parts — the three mechanisms.",
              diff="retrieve"),
        mcq("Which part of a hard disk drive moves across the platters to read and write "
            "data?",
            "The read/write head", ["The spindle", "The laser", "The controller"],
            fb="The spindle spins the platters; the head moves across them. A laser belongs "
               "to optical storage."),
        short("Name one moving part found in a magnetic hard disk drive.",
              [mp("a named moving part: the platter, the spindle or the read/write head",
                  ["platter|spindle|read write head|read/write head|head|arm|actuator|disc|disk"],
                  exemplar="The read/write head.")],
              example="The read/write head.",
              paraphrase="The spinning platters.",
              fb="Platters, spindle, arm or head. This is the reason an HDD is more easily "
                 "damaged by being dropped.", cw="name"),
        tf("Solid state storage has no moving parts.", True,
           fb="True, and it is the reason an SSD is more durable, quieter and faster to "
              "access than a hard disk."),
    ]),

    sub("Choosing a storage type", "ms-l03-s6", ["ms-l03-o2"], [
        written("A school is buying laptops for pupils to carry between lessons. Explain why "
                "solid state storage is a better choice than a magnetic hard disk.", 3,
                [mp("SSDs have no moving parts",
                    ["no moving parts|without moving parts|nothing moves|solid state|"
                     "no platters|no spinning|nothing inside to break|nothing to break|nothing moving"],
                    exemplar="An SSD has no moving parts."),
                 mp("so they are far more resistant to being knocked or dropped",
                    ["durable|robust|resist|survive|withstand|less likely to break|"
                     "less easily damaged|less likely to be damaged|harder to damage|shock|nothing inside to break|nothing to break"],
                    developed=True,
                    exemplar="This means it is much less likely to be damaged if a laptop "
                             "is dropped."),
                 mp("and they are faster to access and use less power, which helps battery "
                    "life",
                    ["fast|faster|quick|quicker"],
                    ["less power|lower power|battery|power consumption"],
                    exemplar="They are also faster and use less power.")],
                example="An SSD has no moving parts, so it is far less likely to be damaged "
                        "when a laptop is carried around and dropped. It is also faster to "
                        "read and uses less power, which makes the laptop quicker to start "
                        "and the battery last longer.",
                paraphrase="There is nothing inside to break if it gets knocked, which "
                           "matters for something carried about; on top of that it reads "
                           "more quickly and draws less power.",
                fb="Durability is the point of the scenario. The other two marks are the "
                   "ordinary advantages.",
                hint="What is different about the inside of an SSD, and why does that matter "
                     "for something carried in a bag?",
                diff="apply", exam=True),
        mcq("A company needs to archive 200 TB of records cheaply, and will rarely read "
            "them. Which storage is most suitable?",
            "Magnetic tape or magnetic hard disks",
            ["Solid state drives", "Optical discs", "Cloud storage on a phone"],
            fb="Magnetic storage is by far the cheapest per terabyte, and slow access does "
               "not matter for an archive.",
            diff="apply", exam=True),
    ]),

    # ============================================================ ms-l04 Top Trumps
    sub("Characteristics of storage devices", "ms-l04-s1", ["ms-l04-o1"], [
        multi("Which of these are characteristics used to compare storage devices? "
              "Tick all that apply.",
              ["Capacity", "Speed", "Portability", "Durability", "Reliability", "Cost",
               "Clock speed", "Colour depth"],
              ["Capacity", "Speed", "Portability", "Durability", "Reliability", "Cost"],
              fb="Six characteristics. Clock speed belongs to a processor and colour depth "
                 "to an image.",
              diff="retrieve"),
        short("State what is meant by the capacity of a storage device.",
              [mp("how much data it can hold",
                  ["how much|amount|quantity|size", "data|storage|information|hold|store"],
                  exemplar="How much data it can hold.")],
              example="How much data the device can hold, usually measured in gigabytes or "
                      "terabytes.",
              paraphrase="The amount of data it is able to store.",
              fb="Capacity is quantity. Speed is how quickly that data can be reached.",
              cw="state"),
        match("Match each characteristic to what it means.",
              [["Durability", "How well it survives being knocked or dropped"],
               ["Portability", "How easily it can be carried about"],
               ["Reliability", "How likely it is to keep working over a long time"]],
              fb="Durability is about shocks, reliability is about time, portability is "
                 "about size and weight.",
              diff="understand"),
    ]),

    sub("Comparing the three types", "ms-l04-s5", ["ms-l04-o2"], [
        sort("Sort each statement by which storage type it describes best.",
             ["Magnetic", "Optical", "Solid state"],
             [["Cheapest per gigabyte for very large capacities", "Magnetic"],
              ["Fastest access, and silent", "Solid state"],
              ["Cheap to produce in huge numbers for distributing films", "Optical"],
              ["Most easily scratched", "Optical"],
              ["Most easily damaged by being dropped while running", "Magnetic"],
              ["Lowest power consumption", "Solid state"]],
             fb="Magnetic for capacity and cost, solid state for speed and durability, "
                "optical for cheap distribution.",
             diff="apply"),
        written("A photographer needs to carry 2 TB of photographs between studios every day. "
                "Justify a suitable storage device.", 3,
                [mp("names a portable drive of sufficient capacity",
                    ["portable|external|usb|carry|carried",
                     "ssd|solid state|hard disk|hdd|drive"],
                    exemplar="A portable external SSD."),
                 mp("explains that it has the capacity needed",
                    ["2 tb|2tb|two terabyte|enough capacity|enough space|large enough|big enough|holds 2"],
                    exemplar="It has enough capacity to hold 2 TB."),
                 mp("justifies the choice against the daily carrying",
                    ["no moving parts|nothing moving|nothing moves|nothing inside to break",
                     "durable|robust|survive|withstand|cope with|stand up to|"
                     "less likely to be damaged|will not break"],
                    developed=True,
                    exemplar="An SSD has no moving parts, so it survives being carried "
                             "about every day.")],
                example="A portable external SSD. It can be bought with well over 2 TB of "
                        "capacity, and because it has no moving parts it will survive being "
                        "carried between studios every day far better than a portable hard "
                        "disk would.",
                paraphrase="I would choose an external solid state drive: they come in sizes "
                           "above two terabytes, and because nothing moves inside one "
                           "it will cope with being transported daily.",
                fb="A justification names the device, checks it meets the requirement, and "
                   "says why it beats the alternative.",
                cw="justify", diff="stretch", exam=True),
    ]),

    # ============================================================ ms-l06 Units lab
    sub("Why binary?", "ms-l06-s1", ["ms-l06-o3"], [
        written("Explain why computers represent all data in binary.", 2,
                [mp("the components in a computer have two states, such as on and off",
                    ["two|2|only|either", "state|values|options|positions|levels"],
                    ["on and off|on or off|high and low|current|voltage|switch"],
                    exemplar="The circuits inside a computer can only be on or off."),
                 mp("so a 1 and a 0 can represent those two states directly",
                    ["1|one", "0|zero"],
                    developed=True,
                    exemplar="So a 1 can mean on and a 0 can mean off.")],
                example="The circuits inside a computer can only be in one of two states, on "
                        "or off, so a 1 and a 0 map straight onto those two states and "
                        "everything has to be built out of them.",
                paraphrase="Hardware only has two conditions, current flowing or not, which "
                           "means a one and a zero represent them exactly.",
                fb="Two states in the hardware, two digits in the number system.",
                diff="understand"),
        mcq("How many different values can be represented by one bit?",
            "2", ["1", "8", "256"],
            fb="One bit is one binary digit: 0 or 1."),
    ]),

    sub("Bits, nibbles and bytes", "ms-l06-s2", ["ms-l06-o1"], [
        match("Match each unit to how many bits it contains.",
              [["Bit", "1 bit"], ["Nibble", "4 bits"], ["Byte", "8 bits"]],
              fb="A nibble is half a byte, which is where its name comes from.",
              diff="retrieve"),
        num("How many bits are there in 3 bytes?", 24, working="3 * 8", unit="bits",
            fb="8 bits in a byte, so 3 × 8 = 24."),
        num("A file is 2 KB. How many bytes is that?", 2000, working="2 * 1000",
            unit="bytes",
            fb="This course uses 1 kB = 1,000 bytes, which is the convention OCR uses.",
            hint="How many bytes does this course take a kilobyte to be?"),
        mcq("How many values can be represented by one nibble?",
            "16", ["4", "8", "256"],
            fb="4 bits, so 2⁴ = 16 different patterns.",
            diff="understand"),
    ]),

    sub("Converting between units", "ms-l06-s4", ["ms-l06-o2"], [
        num("A memory card holds 64 GB. How many megabytes is that?", 64000,
            working="64 * 1000", unit="MB",
            fb="One gigabyte is 1,000 megabytes, so 64 GB = 64,000 MB."),
        num("A video is 4.5 GB. How many kilobytes is that?", 4500000,
            working="4.5 * 1000 * 1000", unit="kB",
            fb="GB to MB to kB is two steps of a thousand: 4.5 × 1,000 × 1,000.",
            hint="Go one unit at a time rather than trying to do it in one jump.",
            diff="apply"),
        num("A hard disk holds 3 TB. How many gigabytes is that?", 3000,
            working="3 * 1000", unit="GB",
            fb="A terabyte is 1,000 gigabytes."),
        order("Put these units in order, smallest first.",
              ["Nibble", "Byte", "Kilobyte", "Megabyte", "Gigabyte", "Terabyte"],
              fb="A nibble is four bits, a byte is eight, and from there it is steps of a "
                 "thousand all the way up.",
              diff="retrieve"),
        mcq("Which unit comes immediately after a terabyte?",
            "Petabyte", ["Gigabyte", "Exabyte", "Megabyte"],
            fb="Kilo, mega, giga, tera, peta — each a thousand times the one before."),
        num("A school has 1,500 photographs, each 4 MB. How many gigabytes of storage are "
            "needed?", 6, working="1500 * 4 / 1000", unit="GB",
            method=[step("works out the total in megabytes (6,000 MB)", 6000)],
            marks=2,
            fb="1,500 × 4 = 6,000 MB, and 6,000 ÷ 1,000 = 6 GB. The method mark is "
               "for reaching 6,000 MB even if the last step goes wrong.",
            diff="apply", exam=True),
    ]),

    # ============================================================ ms-l07 Capacity calculator
    sub("Image file size", "ms-l07-s2", ["ms-l07-o2"], [
        num("An image is 800 pixels wide and 600 pixels high, with a colour depth of 8 bits. "
            "Calculate its file size in bits.", 3840000,
            working="800 * 600 * 8", unit="bits",
            fb="File size = width × height × colour depth = 800 × 600 × 8.",
            hint="Work out how many pixels there are first, then how many bits each one needs."),
        num("An image is 1,000 × 500 pixels with a colour depth of 24 bits. Calculate "
            "its file size in megabytes.", 1.5,
            working="1000 * 500 * 24 / 8 / 1000 / 1000", unit="MB", marks=3,
            method=[step("works out the size in bits (12,000,000)", 12000000),
                    step("converts to bytes by dividing by 8 (1,500,000)", 1500000)],
            fb="1,000 × 500 × 24 = 12,000,000 bits; ÷ 8 = 1,500,000 bytes; "
               "÷ 1,000 twice = 1.5 MB. Each step earns its own mark.",
            hint="Bits first, then bytes, then up through the units.",
            diff="apply", exam=True),
        written("Explain what happens to the file size of an image when its colour depth is "
                "doubled from 8 bits to 16 bits.", 2,
                [mp("the file size doubles",
                    ["double|doubles|twice|two times|x2|2 times"],
                    exemplar="The file size doubles."),
                 mp("because every pixel now needs twice as many bits",
                    ["every pixel|each pixel|per pixel|every point|each point|each one|every one"],
                    developed=True,
                    exemplar="This is because each pixel now needs twice as many bits.")],
                example="The file size doubles, because the number of pixels has not changed "
                        "but each one now needs sixteen bits instead of eight.",
                paraphrase="It becomes twice as big, since every single pixel is stored in "
                           "twice as much space as before.",
                fb="The size, then the reason. The reason is that colour depth is per pixel.",
                diff="understand"),
    ]),

    sub("Sound file size", "ms-l07-s3", ["ms-l07-o2"], [
        num("A sound file is recorded at a sample rate of 44,100 Hz, with a bit depth of 16 "
            "bits, for 30 seconds. Calculate its file size in bits.", 21168000,
            working="44100 * 16 * 30", unit="bits",
            fb="File size = sample rate × bit depth × duration.",
            hint="How many samples a second, how many bits a sample, and for how long?"),
        num("A 10-second recording is sampled 8,000 times a second with a bit depth of 8. "
            "Calculate its file size in kilobytes.", 80,
            working="8000 * 8 * 10 / 8 / 1000", unit="kB", marks=3,
            method=[step("works out the size in bits (640,000)", 640000),
                    step("converts to bytes by dividing by 8 (80,000)", 80000)],
            fb="8,000 × 8 × 10 = 640,000 bits; ÷ 8 = 80,000 bytes; "
               "÷ 1,000 = 80 kB.",
            diff="apply", exam=True),
    ]),

    sub("Text file size", "ms-l07-s4", ["ms-l07-o2"], [
        num("A plain text file contains 2,400 characters, each stored in 8 bits. Calculate "
            "its file size in bytes.", 2400, working="2400 * 8 / 8", unit="bytes",
            fb="Each character is one byte, so 2,400 characters is 2,400 bytes.",
            hint="How many bits is each character, and how many bytes is that?"),
        written("A pupil says a Word document with 2,400 characters in it will be exactly "
                "2,400 bytes. Explain why it will actually be larger.", 2,
                [mp("the file also stores formatting and other information about the document",
                    ["formatting|font|style|bold|layout|colour|metadata|extra|other "
                     "information|header"],
                    exemplar="The file also stores formatting information such as fonts and "
                             "styles."),
                 mp("so the file is larger than the characters alone",
                    ["larger|bigger|more|extra|adds"],
                    developed=True,
                    exemplar="This means the file is bigger than the characters on their own.")],
                example="A Word document stores more than the characters: it also stores "
                        "formatting such as fonts, sizes and colours, along with other "
                        "metadata, so the file is bigger than the text alone.",
                paraphrase="There is extra information in it besides the letters — how "
                           "they are styled and laid out — which makes it larger.",
                fb="The calculation is for the characters. A real document file has more in "
                   "it than that.",
                diff="stretch", exam=True),
    ]),

    # ============================================================ ms-l08 Binary workshop
    sub("Place values", "ms-l08-s1", ["ms-l08-o1"], [
        mcq("Which list gives the place values of an 8-bit binary number, from the most "
            "significant bit to the least?",
            "128, 64, 32, 16, 8, 4, 2, 1",
            ["1, 2, 4, 8, 16, 32, 64, 128",
             "256, 128, 64, 32, 16, 8, 4, 2",
             "128, 64, 32, 16, 8, 4, 2, 0"],
            fb="Each place is worth twice the one to its right, and the rightmost is 1.",
            diff="retrieve"),
        num("What is the largest value that can be stored in 8 bits?", 255,
            working="128 + 64 + 32 + 16 + 8 + 4 + 2 + 1",
            fb="Every bit set to 1: 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255.",
            diff="understand"),
        short("State what is meant by the most significant bit.",
              [mp("the bit with the largest place value, on the left",
                  ["largest|biggest|highest|greatest|most|128", "value|place|worth|column"],
                  ["left|leftmost|left hand|far left|start"],
                  exemplar="The bit on the left, with the largest place value.")],
              example="The leftmost bit, which has the largest place value — 128 in an "
                      "8-bit number.",
              paraphrase="The one on the far left, worth the most.",
              fb="Most significant means worth the most, which is the one furthest left.",
              cw="state"),
    ]),

    sub("Denary and binary", "ms-l08-s2", ["ms-l08-o1"], [
        convert("Convert the denary number 37 to 8-bit binary.", 37, "denary", "binary",
                fb="32 + 4 + 1 = 37, so 00100101.",
                hint="Start at 128 and work down, taking each place value if it fits."),
        convert("Convert the denary number 214 to 8-bit binary.", 214, "denary", "binary",
                fb="128 + 64 + 16 + 4 + 2 = 214, so 11010110."),
        convert("Convert the denary number 9 to 8-bit binary.", 9, "denary", "binary",
                fb="8 + 1 = 9, so 00001001. Remember to pad to eight bits.",
                diff="retrieve"),
        convert("Convert the binary number 01101100 to denary.", "01101100", "binary",
                "denary", fb="64 + 32 + 8 + 4 = 108."),
        convert("Convert the binary number 10011011 to denary.", "10011011", "binary",
                "denary", fb="128 + 16 + 8 + 2 + 1 = 155."),
        convert("Convert the binary number 11111111 to denary.", "11111111", "binary",
                "denary",
                fb="255. This is the largest value eight bits can hold, which is why 8-bit "
                   "numbers run from 0 to 255.",
                diff="understand"),
    ]),

    sub("Binary addition", "ms-l08-s4", ["ms-l08-o2"], [
        binadd("Add these two 8-bit binary numbers: 00101101 + 01011011.",
               "00101101", "01011011",
               fb="45 + 91 = 136, which is 10001000.",
               hint="Work from the right. 1 + 1 is 0 carry 1, and 1 + 1 + 1 is 1 carry 1."),
        binadd("Add these two 8-bit binary numbers: 00110011 + 00001111.",
               "00110011", "00001111",
               fb="51 + 15 = 66, which is 01000010."),
        binadd("Add these two 8-bit binary numbers: 01111111 + 00000001.",
               "01111111", "00000001",
               fb="127 + 1 = 128, which is 10000000. Every bit carried into the next column.",
               diff="understand"),
        tf("When adding binary, 1 + 1 gives 0 with a 1 carried to the next column.", True,
           fb="True. It is the same idea as carrying in denary, but it happens at 2 rather "
              "than at 10."),
    ]),

    sub("Overflow", "ms-l08-s5", ["ms-l08-o4"], [
        written("Explain what an overflow error is.", 2,
                [mp("the result of a calculation needs more bits than are available",
                    ["more bits|too many bits|more than|too big|too large|exceeds|"
                     "does not fit|will not fit|9 bits|nine bits"],
                    exemplar="The answer needs more bits than the computer has set aside."),
                 mp("so the extra bit is lost and the stored answer is wrong",
                    ["lost|dropped|discarded|cut off|removed|thrown away"],
                    ["wrong|incorrect|inaccurate|not the right answer|error"],
                    exemplar="The extra bit is lost, so the stored answer is wrong.")],
                example="An overflow happens when the result of a calculation needs more bits "
                        "than are available — for example a ninth bit in an 8-bit system. "
                        "The extra bit cannot be stored, so it is lost and the answer the "
                        "computer keeps is wrong.",
                paraphrase="It occurs when an answer is too big for the number of bits "
                           "allowed, and because the top bit has nowhere to go the result "
                           "that gets stored is incorrect.",
                fb="Too big for the space, then what that costs.",
                diff="understand", exam=True),
        binadd("Add these two 8-bit binary numbers: 11101101 + 01011011. Give the 8 bits "
               "that would be stored.",
               "11101101", "01011011",
               fb="237 + 91 = 328, which needs nine bits. Only the lower eight are stored, "
                  "giving 01001000 — 72, not 328. That is an overflow error.",
               diff="stretch", exam=True),
        mcq("An 8-bit system adds 10110101 and 11001100. What happens?",
            "An overflow error: the answer needs nine bits",
            ["The answer is stored correctly as an 8-bit number",
             "The computer automatically switches to 16 bits",
             "The two numbers are swapped and added again"],
            fb="181 + 204 = 385, which will not fit in eight bits.",
            diff="apply"),
    ]),

    # ============================================================ ms-l10 Shift and hex
    sub("Binary shifts", "ms-l10-s1", ["ms-l10-o1", "ms-l10-o2"], [
        binshift("Perform a left shift of 2 places on the 8-bit number 00010110.",
                 "00010110", 2, "left",
                 fb="22 becomes 88: every bit moves two places left and zeros fill in from "
                    "the right.",
                 hint="Shifting left multiplies. By how much, for each place?"),
        binshift("Perform a right shift of 3 places on the 8-bit number 11000000.",
                 "11000000", 3, "right",
                 fb="192 becomes 24: every bit moves three places right."),
        written("Explain what a left shift of 1 place does to the value of a binary number.",
                2,
                [mp("it doubles the value, or multiplies it by two",
                    ["double|doubles|multiplied by 2|multiply by 2|multiplied by two|multiply by two|times 2|x 2|twice"],
                    exemplar="It doubles the value."),
                 mp("because every bit moves into a place worth twice as much",
                    ["place value|column|worth|place", "twice|double|2"],
                    developed=True,
                    exemplar="This is because every bit moves into a column worth twice as "
                             "much.")],
                example="A left shift of one place doubles the value, because every bit moves "
                        "into a place value worth twice as much as the one it was in.",
                paraphrase="The number is multiplied by two, since each digit ends up in a "
                           "column of double the worth.",
                fb="The effect, and why the effect is what it is.",
                diff="understand", exam=True),
        mcq("A right shift of 2 places is performed on the binary number 00001001 (9). What "
            "is lost?",
            "The two least significant bits, so the answer is rounded down to 2",
            ["Nothing; the answer is exactly 2.25",
             "The two most significant bits, so the answer is far too small",
             "Nothing; a right shift never loses anything"],
            fb="9 ÷ 4 is 2.25, but the bits that fall off the right-hand end are gone. "
               "The stored answer is 2.",
            diff="stretch", exam=True),
    ]),

    sub("Hexadecimal", "ms-l10-s4", ["ms-l10-o3"], [
        written("Explain why hexadecimal is often used to write down binary values.", 2,
                [mp("it is much shorter than the equivalent binary",
                    ["short|shorter|fewer digits|fewer characters|compact|concise|two digits|2 digits|quarter of the space|less space|takes up less"],
                    exemplar="A hex value is much shorter than the same value in binary."),
                 mp("so it is easier for people to read and less error-prone to copy",
                    ["easier|simpler|clearer|less likely|fewer mistakes|fewer errors|"
                     "remember|read|mistake"],
                    developed=True,
                    exemplar="This makes it easier to read and less likely to be copied "
                             "wrongly.")],
                example="Two hexadecimal digits say the same thing as eight binary digits, so "
                        "it is far shorter, which makes it easier for a person to read and "
                        "less likely that a digit is miscopied.",
                paraphrase="It takes up a quarter of the space binary does, which means "
                           "people can read it and copy it without losing their place.",
                fb="Shorter, therefore easier for a human. It is no easier for the computer, "
                   "which works in binary either way.",
                diff="understand", exam=True),
        convert("Convert the denary number 202 to hexadecimal.", 202, "denary", "hex",
                fb="202 ÷ 16 = 12 remainder 10, so CA.",
                hint="How many sixteens, and what is left over?"),
        convert("Convert the denary number 47 to hexadecimal.", 47, "denary", "hex",
                fb="47 ÷ 16 = 2 remainder 15, so 2F."),
        convert("Convert the hexadecimal value 3E to denary.", "3e", "hex", "denary",
                fb="(3 × 16) + 14 = 62."),
        convert("Convert the hexadecimal value FF to denary.", "ff", "hex", "denary",
                fb="(15 × 16) + 15 = 255, the largest value two hex digits can hold."),
        convert("Convert the binary number 10110111 to hexadecimal.", "10110111", "binary",
                "hex",
                fb="Split into nibbles: 1011 = B and 0111 = 7, so B7.",
                hint="Four bits at a time, from the right.",
                diff="apply"),
        convert("Convert the hexadecimal value 6D to 8-bit binary.", "6d", "hex", "binary",
                fb="6 = 0110 and D = 1101, so 01101101.",
                diff="apply"),
    ]),

    # ============================================================ ms-l12 Character foundry
    sub("Character sets", "ms-l12-s2", ["ms-l12-o2", "ms-l12-o4"], [
        short("State what is meant by a character set.",
              [mp("the set of characters a computer can use, each with its own binary code",
                  ["character|letter|symbol", "code|number|value|binary|represent"],
                  exemplar="The characters a computer can represent, each with its own "
                           "binary code.")],
              example="The collection of characters a computer can use, with a unique binary "
                      "code for each one.",
              paraphrase="A list of every symbol the machine knows, each given its own "
                         "number in binary.",
              fb="A set of characters AND the codes for them. Either half on its own is not "
                 "the definition.", cw="state"),
        mcq("ASCII uses 7 bits for each character. How many different characters can it "
            "represent?",
            "128", ["7", "64", "256"],
            fb="2⁷ = 128. Extended ASCII adds an eighth bit and gets 256.",
            diff="understand"),
        written("Explain why Unicode was developed when ASCII already existed.", 2,
                [mp("ASCII does not have enough codes for the characters of every language",
                    ["not enough|too few|only 128|only 256|limited|cannot represent|"
                     "ran out|no room"],
                    exemplar="ASCII does not have enough codes for every language's "
                             "characters."),
                 mp("Unicode uses more bits, so it can represent far more characters",
                    ["more bits|16 bits|32 bits|more codes|more characters|far more|"
                     "thousands|millions"],
                    exemplar="Unicode uses more bits per character, so it can represent far "
                             "more of them.")],
                example="ASCII has only 128 codes, which is nowhere near enough for the "
                        "characters used by every language in the world. Unicode uses more "
                        "bits for each character, so it can represent many thousands of them, "
                        "including emoji.",
                paraphrase="There were far too few codes in ASCII for all the world's "
                           "alphabets, so a system with more bits per symbol was needed.",
                fb="Not enough codes, then what Unicode does about it.",
                diff="understand", exam=True),
        mcq("In ASCII, the code for 'A' is 65. What is the code for 'C'?",
            "67", ["66", "68", "97"],
            fb="The letters run in order, so C is two after A. 97 is lower-case 'a'.",
            diff="apply"),
        num("A plain text file uses 8 bits per character and contains 500 characters. "
            "Calculate its size in bytes.", 500, working="500 * 8 / 8", unit="bytes",
            fb="8 bits is one byte, so 500 characters is 500 bytes."),
    ]),

    # ============================================================ ms-l13 Pixel studio
    sub("Pixels and colour depth", "ms-l13-s2", ["ms-l13-o1", "ms-l13-o3"], [
        short("State what is meant by colour depth.",
              [mp("the number of bits used to store each pixel",
                  ["bits|binary digits", "pixel|each pixel|per pixel|point"],
                  exemplar="The number of bits used for each pixel.")],
              example="The number of bits used to store the colour of each pixel.",
              paraphrase="How many bits each individual pixel is given.",
              fb="Per pixel is the part that matters; it is what separates colour depth from "
                 "resolution.", cw="state"),
        mcq("An image has a colour depth of 4 bits. How many different colours can each "
            "pixel be?",
            "16", ["4", "8", "256"],
            fb="2⁴ = 16.", diff="understand"),
        written("Explain the difference between the resolution and the colour depth of an "
                "image.", 2,
                [mp("resolution is the number of pixels in the image",
                    ["resolution", "number of pixels|how many pixels|pixels|width|height|"
                     "dimensions"],
                    exemplar="Resolution is the number of pixels in the image."),
                 mp("colour depth is the number of bits used for each pixel",
                    ["colour depth|color depth|depth", "bits|binary digits"],
                    exemplar="Colour depth is the number of bits used for each pixel.")],
                example="Resolution is how many pixels the image is made of, usually given "
                        "as a width and a height. Colour depth is how many bits are used to "
                        "store each one of those pixels.",
                paraphrase="Resolution is the count of pixels in the picture, while colour "
                           "depth is how many bits each pixel takes up.",
                fb="Both halves. One is a count of pixels, the other is bits per pixel.",
                diff="understand"),
        short("State what is meant by metadata in an image file.",
              [mp("data about the image itself, rather than the pixels",
                  ["about the image|about the file|data about|information about|"
                   "describes the|extra information|not the pixels"],
                  ["resolution|colour depth|size|date|camera|dimensions|format"],
                  exemplar="Data about the image, such as its resolution and the date it "
                           "was taken.")],
              example="Data stored about the image rather than in it, such as its resolution, "
                      "colour depth, the date it was taken and the camera used.",
              paraphrase="Information describing the file itself — its dimensions, when "
                         "it was made, what took it.",
              fb="Metadata is the data about the data. Without the resolution in it, nothing "
                 "would know what shape the pixels go in.",
              cw="state"),
    ]),

    sub("Image file size and quality", "ms-l13-s6", ["ms-l13-o3"], [
        num("An image is 640 × 480 pixels with a colour depth of 1 bit. Calculate its "
            "file size in bytes.", 38400, working="640 * 480 * 1 / 8", unit="bytes",
            marks=2, method=[step("works out the size in bits (307,200)", 307200)],
            fb="640 × 480 × 1 = 307,200 bits; ÷ 8 = 38,400 bytes."),
        written("A photograph is saved at a lower resolution to make the file smaller. "
                "Explain the effect this has on the image.", 2,
                [mp("there are fewer pixels in the image",
                    ["fewer pixels|less pixels|fewer points|smaller number of pixels|"
                     "lower resolution|reduced resolution"],
                    exemplar="There are fewer pixels in the image."),
                 mp("so less detail is stored and the image looks blurred or blocky",
                    ["detail|sharp|sharpness|quality|clear"],
                    ["blur|blurred|blurry|blocky|pixelated|grainy|rough|worse"],
                    developed=True,
                    exemplar="This means less detail is kept, so the image looks blocky.")],
                example="Lowering the resolution means there are fewer pixels, so less detail "
                        "is recorded and the picture looks blurred or blocky when it is "
                        "enlarged.",
                paraphrase="The picture is made of fewer points, which means finer detail is "
                           "thrown away and it appears pixelated.",
                fb="Fewer pixels, therefore less detail. The second mark is the consequence.",
                diff="apply", exam=True),
    ]),

    # ============================================================ ms-l14 Sound studio
    sub("Sampling", "ms-l14-s1", ["ms-l14-o1"], [
        short("State what is meant by the sample rate of a sound recording.",
              [mp("how many samples are taken each second",
                  ["samples|measurements|readings|snapshots|measured|measures|measuring",
                   "second|per second|each second|hertz|hz"],
                  exemplar="The number of samples taken each second.")],
              example="The number of samples taken each second, measured in hertz.",
              paraphrase="How many times a second the sound is measured.",
              fb="Per second is the part that makes it a rate.", cw="state"),
        order("Put the steps of recording a digital sound in order.",
              ["A microphone picks up the analogue sound wave",
               "The wave is measured at regular intervals",
               "Each measurement is stored as a binary number",
               "The stored numbers can be played back as sound"],
              fb="Measure, then store. Sampling is measuring the wave at intervals.",
              diff="understand"),
        written("Explain the effect of increasing the sample rate of a recording.", 3,
                [mp("more samples are taken each second",
                    ["more samples|more measurements|more readings|increases|higher rate|measured more|more often|more frequently|measures more"],
                    exemplar="More samples are taken each second."),
                 mp("so the digital recording is a closer match to the original wave",
                    ["closer|more accurate|better match|more faithful|truer|nearer|"
                     "better quality|more detail"],
                    developed=True,
                    exemplar="This means the recording follows the original wave more "
                             "closely, so the quality is better."),
                 mp("but the file size increases",
                    ["file size|size of the file|bigger|larger|more storage|more space"],
                    exemplar="The file size also increases.")],
                example="Increasing the sample rate means the wave is measured more often "
                        "each second, so the stored version follows the original more closely "
                        "and sounds better. The cost is that more samples have to be stored, "
                        "so the file is bigger.",
                paraphrase="The sound is measured more frequently, which makes the digital "
                           "copy a nearer match to the real wave and improves quality, "
                           "although it takes more space.",
                fb="Three things: more samples, better quality, bigger file. The quality mark "
                   "needs to be joined to the sampling.",
                diff="apply", exam=True),
        num("A recording is sampled at 22,050 Hz with a bit depth of 16 for 4 minutes. "
            "Calculate the file size in bytes.", 10584000,
            working="22050 * 16 * 240 / 8", unit="bytes", marks=3,
            method=[step("converts 4 minutes to 240 seconds", 240),
                    step("works out the size in bits (84,672,000)", 84672000)],
            fb="4 minutes is 240 seconds. 22,050 × 16 × 240 = 84,672,000 bits, "
               "and ÷ 8 = 10,584,000 bytes.",
            hint="The duration has to be in seconds before anything else.",
            diff="stretch", exam=True),
    ]),

    # ============================================================ ms-l15 Compression
    sub("Why compress?", "ms-l15-s1", ["ms-l15-o1"], [
        multi("Which of these are reasons for compressing a file? Tick all that apply.",
              ["It takes up less storage space",
               "It can be sent over a network more quickly",
               "It uses less bandwidth",
               "It makes the file open faster in every program",
               "It improves the quality of the data"],
              ["It takes up less storage space", "It can be sent over a network more quickly",
               "It uses less bandwidth"],
              fb="Smaller means less space and less time to send. Compression never improves "
                 "quality — lossy compression reduces it.",
              diff="understand"),
        short("State one reason a website would compress its images.",
              [mp("pages load faster, or less bandwidth is used",
                  ["load faster|loads faster|loading faster|load more quickly|downloads faster|quicker to load|opens faster|faster to download|pages load"],
                  ["bandwidth|less data|data to send|less to send|smaller|less to transfer"],
                  exemplar="The pages load faster for visitors.")],
              example="The pages load more quickly, because there is less data to send.",
              paraphrase="Visitors get the site faster since less data has to travel.",
              fb="Speed or bandwidth. Both are the same underlying reason: there is less to "
                 "send.", cw="give"),
    ]),

    sub("Lossy and lossless", "ms-l15-s4", ["ms-l15-o2", "ms-l15-o3"], [
        sort("Sort each statement by the kind of compression it describes.",
             ["Lossy", "Lossless"],
             [["Some data is permanently removed", "Lossy"],
              ["The original file can be rebuilt exactly", "Lossless"],
              ["Used for MP3 and JPEG", "Lossy"],
              ["Used for ZIP and PNG", "Lossless"],
              ["Usually gives the smaller file", "Lossy"],
              ["The only safe choice for a program file", "Lossless"]],
             fb="Lossy throws data away and cannot get it back; lossless rearranges it and "
                "can.",
             diff="understand"),
        written("Explain why a text document must be compressed losslessly rather than "
                "lossily.", 2,
                [mp("lossy compression permanently removes some of the data",
                    ["remove|removed|removes|lost|loses|deleted|discarded|thrown away|"
                     "permanently"],
                    exemplar="Lossy compression permanently removes some of the data."),
                 mp("and every character of a document matters, so the meaning would change",
                    ["every character|every letter|every word|each character|"
                     "meaning|unreadable|nonsense|change the meaning|changed|corrupt|not make sense|would not read"],
                    developed=True,
                    exemplar="Every character matters, so removing any of them would change "
                             "what the document says.")],
                example="Lossy compression works by permanently throwing away data that will "
                        "not be noticed. In a document every character matters, so losing any "
                        "of them would change what it says, which means only lossless "
                        "compression can be used.",
                paraphrase="Because the lossy method deletes information for good, and in "
                           "text every single letter counts, taking some out would alter the "
                           "meaning.",
                fb="What lossy does, then why that is unacceptable here.",
                diff="apply", exam=True),
        mcq("A photograph is compressed as a JPEG at a high compression setting. What has "
            "happened to the original pixel data?",
            "Some of it has been permanently discarded and cannot be recovered",
            ["It has been rearranged and can be restored exactly",
             "It has been moved into the file's metadata",
             "It has been converted to hexadecimal to save space"],
            fb="JPEG is lossy. Saving it again at full quality will not bring the detail "
               "back.",
            diff="apply"),
        extended("A film studio is deciding how to distribute a new film: as a very large "
                 "lossless file, or as a smaller lossy file. Discuss the considerations "
                 "involved and recommend one.", 6,
                 [mp("explains what lossy compression does to the film"),
                  mp("explains what lossless compression keeps, and what it costs in size"),
                  mp("considers download time and bandwidth for the viewer"),
                  mp("considers storage and distribution cost for the studio"),
                  mp("considers what most viewers would actually notice on their screens"),
                  mp("reaches a recommendation and gives a reason for it")],
                 example="A lossy version permanently removes detail the eye is least likely "
                         "to notice, which makes the file far smaller. A lossless version "
                         "keeps every pixel exactly, which matters to anyone watching on a "
                         "large, high-quality screen, but the file may be several times "
                         "bigger. For the viewer, the lossy file downloads far faster and "
                         "uses much less of a monthly data allowance, and on a phone or an "
                         "ordinary television the difference in quality is hard to see. For "
                         "the studio, the lossy file is cheaper to store and cheaper to serve "
                         "to millions of people. I would recommend offering the lossy version "
                         "as the standard download, with the lossless version available to "
                         "those who want it, because that gets the film to most people "
                         "quickly without taking the choice away from viewers who would "
                         "notice the difference.",
                 fb="A six-mark discussion is marked by you against the points above. The "
                    "mark that separates a good answer from a list is the last one: a "
                    "recommendation with a reason attached to it.",
                 bands=["CONTENT", "APPLICATION", "DEVELOPMENT", "BALANCE", "CONCLUSION"]),
    ]),

    sub("Run-length encoding", "ms-l15-s5", ["ms-l15-o2"], [
        mcq("Run-length encoding replaces AAAABBBCCCCCCC with 4A3B7C. What kind of "
            "compression is this?",
            "Lossless, because the original can be rebuilt exactly",
            ["Lossy, because some letters have been removed",
             "Lossy, because the file is smaller",
             "Neither; it is encryption rather than compression"],
            fb="Nothing has been lost: 4A3B7C expands back to exactly what it came from.",
            diff="understand"),
        written("Explain why run-length encoding would make the file BIGGER for the string "
                "ABCDEFG.", 2,
                [mp("there are no runs of repeated characters",
                    ["no runs|no repeat|no repeats|not repeated|all different|nothing repeats|nothing is repeated|"
                     "every character is different|none repeat|no repetition|none of the letters appear twice"],
                    exemplar="There are no runs of repeated characters."),
                 mp("so a count has to be stored for every single character",
                    ["count|number|1|one", "every|each|all"],
                    developed=True,
                    exemplar="So a count of 1 has to be stored in front of every character.")],
                example="Run-length encoding only saves space where characters repeat. In "
                        "ABCDEFG nothing repeats, so the encoding has to store a count of 1 "
                        "in front of every single character, which makes it twice as long.",
                paraphrase="Since none of the letters appear twice in a row, the method ends "
                           "up adding a 1 before each one and the result is longer than the "
                           "original.",
                fb="No runs, so nothing to shorten — and the counts are pure overhead.",
                diff="stretch", exam=True),
    ]),
]
