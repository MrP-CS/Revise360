"""1.5 Systems software: the rest of it.

tools/revbank/t15.py covers the ideas. This covers the ground - access levels,
file extensions, each utility on its own, plug and play, virtual memory as the
operating system's job rather than as a storage question - because fourteen
questions is not a topic a Year 11 can revise from, however good they are.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written, sub, mp)

TOPIC = "1.5"

BANK = [

    # ============================================================ ss-l01
    sub("Systems software and application software", "ss-l01-s1", ["ss-l01-o1"], [
        sort("Sort each program by whether it is systems software or application "
             "software.",
             ["Systems software", "Application software"],
             [["The operating system", "Systems software"],
              ["A device driver", "Systems software"],
              ["Defragmentation software", "Systems software"],
              ["A word processor", "Application software"],
              ["A web browser", "Application software"],
              ["A photo editor", "Application software"]],
             fb="Systems software looks after the computer. Application software does a job "
                "for the person using it.",
             diff="understand"),
        mcq("Which of these could a computer not start up without?",
            "The operating system",
            ["A word processor", "Compression software", "A web browser"],
            fb="Everything else runs on top of the operating system, which is why it is "
               "loaded first.",
            diff="retrieve"),
    ]),

    sub("Graphical user interfaces", "ss-l01-s3", ["ss-l01-o2"], [
        multi("Which of these are features of a graphical user interface? Tick all that "
              "apply.",
              ["Windows that can be moved and resized",
               "Icons that stand for programs and files",
               "Menus the user can read rather than remember",
               "A pointer controlled by a mouse or a finger",
               "Commands typed exactly from memory",
               "A list of numbered choices and nothing else"],
              ["Windows that can be moved and resized",
               "Icons that stand for programs and files",
               "Menus the user can read rather than remember",
               "A pointer controlled by a mouse or a finger"],
              fb="Windows, icons, menus and a pointer. Typed commands belong to a command "
                 "line, and a numbered list to a menu driven interface.",
              diff="retrieve"),
        written("Explain why a graphical user interface needs more memory and processing "
                "power than a command line interface.", 2,
                [mp("the graphics themselves have to be drawn and kept in memory",
                    ["graphic|image|images|icon|icons|window|windows|picture|pixel|"
                     "draw|drawn|drawing|render",
                     "memory|ram|store|stored|held|processing|processor|cpu|power|work"],
                    exemplar="The windows, icons and pointer all have to be drawn and held "
                             "in memory."),
                 mp("so there is far more for the computer to keep track of than lines of "
                    "text",
                    ["more|far more|extra|additional|heavier|demanding",
                     "text|typed|words|characters|command line|letters|simple"],
                    developed=True,
                    exemplar="This means there is far more to keep track of than the lines of "
                             "text a command line needs.")],
                example="A graphical interface has to draw windows, icons and a moving "
                        "pointer, and keep all of it in memory so it can be redrawn whenever "
                        "anything moves. A command line only has to hold and display lines of "
                        "text, so there is far more for the computer to keep track of.",
                paraphrase="Because the pictures, windows and pointer must all be produced and "
                           "stored, the machine has much more to handle than it would for "
                           "plain typed text.",
                fb="What has to be drawn and stored, and how that compares with text.",
                diff="understand"),
    ]),

    sub("Menu driven and voice interfaces", "ss-l01-s5", ["ss-l01-o2"], [
        mcq("A cash machine offers five choices on screen and nothing else. What kind of "
            "interface is this?",
            "A menu driven interface",
            ["A graphical user interface", "A command line interface",
             "A voice interface"],
            fb="A fixed set of choices and no free movement is what makes it menu driven. It "
               "also means the user cannot reach anything they should not.",
            diff="apply"),
        written("Explain one advantage of a menu driven interface for a machine used by the "
                "public.", 2,
                [mp("the user can only choose from the options offered",
                    ["only|just|limited|fixed|restricted|cannot|no other|set of|"
                     "nothing else",
                     "option|options|choice|choices|menu|button|buttons"],
                    exemplar="The user can only choose from the options on the menu."),
                 mp("so nothing has to be learned and nothing can be broken",
                    ["no training|without training|without being taught|"
                     "nothing to learn|no need to know|easy|simple|anyone|anybody|"
                     "cannot break|cannot damage|cannot reach|cannot wander|"
                     "cannot get into|safe|secure|mistake"],
                    developed=True,
                    exemplar="This means anybody can use it without training, and they cannot "
                             "reach anything they should not.")],
                example="A menu driven interface offers a fixed set of choices and nothing "
                        "else, so a member of the public can use it without being taught "
                        "anything, and cannot wander into settings or files that are none of "
                        "their business.",
                paraphrase="Since only the listed options are available, no training is "
                           "required and the user has no way of reaching parts of the system "
                           "they should not touch.",
                fb="Limited choices, and the two things that limit buys you.",
                diff="apply"),
        tf("A voice interface is a good choice for a user whose hands are busy.", True,
           fb="That is the situation it is for: driving, cooking, or working with tools."),
    ]),

    # ============================================================ ss-l02
    sub("Sharing the processor", "ss-l02-s2", ["ss-l02-o1"], [
        order("Put these steps in the order the operating system carries them out when it "
              "switches between two programs.",
              ["The first program's turn runs out",
               "The operating system saves where that program had got to",
               "The operating system loads where the second program had got to",
               "The second program runs for its turn",
               "The operating system saves the second program's position in its turn"],
              fb="Saving where a program had got to is the whole trick: without it the "
                 "program could not carry on from the same place.",
              diff="understand"),
        mcq("A computer with one processor core appears to run six programs at once. What is "
            "actually happening?",
            "The processor is switching between them very quickly",
            ["All six are running in the same instant",
             "Five of them are paused until the first finishes",
             "The programs are sharing one set of instructions"],
            fb="One core, one instruction at a time. The speed of the switching is what makes "
               "it look simultaneous.",
            diff="apply"),
    ]),

    sub("Virtual memory", "ss-l02-s4", ["ss-l02-o2"], [
        short("State what virtual memory is.",
              [mp("space on secondary storage used as if it were RAM when RAM is full",
                  ["hard disk|disk|drive|secondary storage|ssd|storage",
                   "as if it were ram|as though it were ram|as though it is ram|"
                   "like ram|instead of ram|extra ram|pretend|acts as ram|used as ram|"
                   "ram is full|ram runs out|stand in for ram|stands in for ram|"
                   "stand in for main memory|stands in for main memory"],
                  exemplar="Space on the hard disk used as though it were RAM when RAM is "
                           "full.")],
              example="An area of secondary storage that the operating system uses as though "
                      "it were RAM, when the programs running need more memory than the RAM "
                      "can hold.",
              paraphrase="Part of the hard drive set aside to stand in for main memory once "
                         "that memory is full.",
              fb="Disk standing in for RAM. Saying it is more RAM is not quite the answer.",
              cw="state"),
        written("Explain why a computer using virtual memory heavily feels slow.", 2,
                [mp("secondary storage is far slower to read and write than RAM",
                    ["slower|slow|not as fast|less quick|longer|thousands of times|"
                     "takes more time",
                     "disk|drive|secondary storage|hard disk|ssd|storage"],
                    exemplar="Secondary storage is far slower to read and write than RAM."),
                 mp("and the operating system keeps moving pages between the two",
                    ["swap|swaps|swapping|move|moves|moving|transfer|back and forth|"
                     "repeatedly|constantly|again and again",
                     "disk|drive|storage|ram|memory|data|page|pages|between the two"],
                    developed=True,
                    exemplar="This means the operating system spends its time moving data back "
                             "and forth instead of running programs.")],
                example="Reading and writing secondary storage takes thousands of times longer "
                        "than reading RAM, and when memory is short the operating system is "
                        "constantly moving data out to the disk and back again. The processor "
                        "ends up waiting for the disk rather than running the programs.",
                paraphrase="Because the drive is so much slower than main memory, and data has "
                           "to be shifted between the two over and over, the machine spends "
                           "its time transferring rather than computing.",
                fb="Slower storage, and the constant moving. Both halves.",
                diff="understand", exam=True),
    ]),

    sub("Updates and plug and play", "ss-l02-s6", ["ss-l02-o3"], [
        mcq("A user plugs in a USB memory stick and it works immediately with no software to "
            "install. What makes this possible?",
            "The operating system already has a driver for that kind of device",
            ["The memory stick contains its own operating system",
             "The memory stick does not need a driver",
             "The user must have installed one earlier that day"],
            fb="Common kinds of device have drivers built into the operating system, which is "
               "what plug and play means.",
            diff="apply"),
        written("Explain why an operating system needs updating.", 2,
                [mp("newly found security weaknesses have to be closed",
                    ["security|vulnerab|weakness|hole|exploit|attack|attacker|malware|"
                     "virus|patch|safe",
                     "update|updates|updated|patch|patched|close|closes|closed|"
                     "fix|fixes|fixed|found|discovered|released|since|protect"],
                    exemplar="Updates close security weaknesses that have been found since it "
                             "was released."),
                 mp("and new hardware and software need support that did not exist before",
                    ["new hardware|new device|new devices|new software|driver|drivers|"
                     "compatib|support|work with|bug|bugs|fault|faults|improve"],
                    exemplar="They also add support for new hardware and fix faults that have "
                             "been found.")],
                example="Weaknesses are found in any operating system after it is released, and "
                        "an update closes them before an attacker can use them. Updates also "
                        "add support for hardware and software that did not exist when the "
                        "system shipped, and fix faults that have come to light.",
                paraphrase="Flaws that attackers could exploit are patched, and support is "
                           "added for devices and programs that were not around when the "
                           "system was written.",
                fb="Security, and keeping up with new things. Either pair earns both marks.",
                diff="understand"),
    ]),

    # ============================================================ ss-l03
    sub("Access levels", "ss-l03-s2", ["ss-l03-o1"], [
        match("Match each account to the access it should be given on a school network.",
              [["A Year 11 pupil", "Read and write their own files, read shared resources"],
               ["A teacher", "Read and write their class's work and enter marks"],
               ["A network technician", "Install software and change settings on any machine"],
               ["A visitor", "Reach the internet and nothing else"]],
              fb="Each account gets what the job needs and no more. That principle is what "
                 "limits the damage when an account is misused.",
              diff="apply", exam=True),
        written("Explain why a school does not give every pupil the same access rights as a "
                "technician.", 2,
                [mp("a technician's account can change settings and install software",
                    ["install|change settings|change anything|alter|delete|admin|"
                     "administrator|full access|everything|any machine|system files|"
                     "system itself"],
                    exemplar="A technician's account can install software."),
                 mp("so if a pupil's account were misused or stolen the damage would be far "
                    "worse",
                    ["damage|harm|break|broken|mistake|error|fault|accident|misuse|"
                     "stolen|hacked|compromised|virus|malware|worse|whole network|"
                     "entire network|everyone|everybody"],
                    developed=True,
                    exemplar="This means a misused pupil account could damage the whole "
                             "network rather than just their own files.")],
                example="A technician's account can install software and change system "
                        "settings on any machine. If every pupil had that, one careless "
                        "mistake or one stolen password could break machines for everybody "
                        "rather than affecting only that pupil's own files.",
                paraphrase="Because such an account can alter the system itself, giving it to "
                           "everyone would mean a single error or compromised login could "
                           "affect the entire network.",
                fb="What the extra rights allow, and what goes wrong when they are misused.",
                diff="apply", exam=True),
    ]),

    sub("File extensions and what the OS does with files", "ss-l03-s6",
        ["ss-l03-o2"], [
        mcq("What does a file's extension tell the operating system?",
            "Which program should be used to open it",
            ["How large the file is",
             "Where on the disk the file is stored",
             "Who is allowed to open it"],
            fb="The extension is how the operating system knows which program a file belongs "
               "to. Size, location and permissions are all recorded separately.",
            diff="retrieve"),
        multi("Which of these does an operating system do when it manages files? Tick all "
              "that apply.",
              ["Records where on the disk each file is stored",
               "Keeps a folder structure so files can be organised",
               "Records which account owns each file",
               "Opens a file in the right program when it is double-clicked",
               "Decides whether the contents of a file are correct",
               "Writes the contents of the file for the user"],
              ["Records where on the disk each file is stored",
               "Keeps a folder structure so files can be organised",
               "Records which account owns each file",
               "Opens a file in the right program when it is double-clicked"],
              fb="Where it is, who owns it, how it is organised and what opens it. What is "
                 "inside it is the application's business.",
              diff="understand"),
    ]),

    # ============================================================ ss-l04
    sub("Encryption as a utility", "ss-l04-s2", ["ss-l04-o1"], [
        written("Explain why encrypting a laptop's hard disk protects the data on it if the "
                "laptop is stolen.", 2,
                [mp("the data is scrambled so it cannot be read without the key",
                    ["scramble|unreadable|cannot be read|not be read|meaningless|"
                     "cipher|ciphertext|jumbled|nonsense",
                     "key|password|passphrase|decrypt|without the key|without a key|"
                     "without the password|need the key|needs the key"],
                    exemplar="The data is scrambled and cannot be read without the key."),
                 mp("so a thief who takes the disk out still gets nothing useful",
                    ["thief|thieves|stolen|steal|takes the disk|takes the drive|"
                     "another computer|different computer|another machine|"
                     "nothing useful|no use|still cannot|still unreadable"],
                    developed=True,
                    exemplar="This means a thief can take the disk out and put it in another "
                             "computer and still get nothing.")],
                example="Encryption scrambles the contents of the disk so that they are "
                        "meaningless without the key. A thief can take the drive out and plug "
                        "it into their own machine, and it will still be unreadable, because "
                        "the login password is not what is protecting it — the encryption is.",
                paraphrase="The contents are turned into something unreadable unless the "
                           "correct key is supplied, so even moving the drive to another "
                           "machine gives the thief nothing.",
                fb="Unreadable without the key, and why moving the disk does not help.",
                diff="apply", exam=True),
        tf("Encrypting a file stops it from being deleted.", False,
           fb="Encryption protects what is inside a file, not whether it exists. Deleting an "
              "encrypted file is just as easy.",
           exam=True),
    ]),

    sub("Compression as a utility", "ss-l04-s4", ["ss-l04-o3"], [
        mcq("Why might a user compress a folder before emailing it?",
            "To make it small enough to send and quicker to upload",
            ["To stop the recipient from opening it",
             "To make the files inside open faster",
             "To check the files for errors"],
            fb="Compression reduces size, which is about sending and storing. It does nothing "
               "for how fast a file opens afterwards.",
            diff="apply"),
        short("State one disadvantage of compressing a file.",
              [mp("it has to be decompressed before it can be used, which takes time and "
                  "processing",
                  ["decompress|uncompress|unzip|extract|expand|open|restore|"
                   "before it can be used|before you can use|back to normal",
                   "time|slower|wait|processing|work|effort|cpu|extra step"],
                  exemplar="It has to be decompressed before it can be used, which takes "
                           "time.")],
              example="The file has to be decompressed before it can be used, which takes time "
                      "and processing — and with lossy compression some of the original data "
                      "is gone for good.",
              paraphrase="Extra time and processing are needed to expand it again before it "
                         "can be opened.",
              fb="The cost of getting it back. Losing quality is the other acceptable answer, "
                 "but only for lossy compression.",
              cw="state"),
    ]),

    sub("Backup as a utility", "ss-l04-s5", ["ss-l04-o1"], [
        match("Match each kind of backup to what it copies.",
              [["Full backup", "Every file, every time"],
               ["Incremental backup", "Only the files that have changed since the last "
                                      "backup"],
               ["Automatic backup", "Whatever is due, at a time nobody has to remember"]],
              fb="A full backup is slow to make and quick to restore. An incremental one is "
                 "the other way round.",
              diff="understand"),
        written("Explain one reason a school keeps a backup copy of its data somewhere other "
                "than the school building.", 2,
                [mp("a fire, flood or theft could destroy everything in one place",
                    ["fire|flood|theft|stolen|burgl|disaster|destroy|damage|"
                     "building|site|same place|same room"],
                    exemplar="A fire or flood would destroy both the data and a backup kept "
                             "in the same building."),
                 mp("so a copy somewhere else is the only one certain to survive",
                    ["elsewhere|another site|off site|offsite|cloud|different place|"
                     "another building|survive|still have|restore|recover"],
                    developed=True,
                    exemplar="This means a copy somewhere else is the only one that would "
                             "survive.")],
                example="A fire, a flood or a burglary would take the servers and any backup "
                        "sitting beside them in the same cupboard. A copy held off site, or in "
                        "the cloud, is the only one certain to survive, which is the whole "
                        "point of keeping it somewhere else.",
                paraphrase="Since a single disaster at one location would destroy both the "
                           "original and a copy stored next to it, only a copy held elsewhere "
                           "is guaranteed to remain.",
                fb="What could destroy both copies, and why distance fixes it.",
                diff="apply", exam=True),
    ]),
]
