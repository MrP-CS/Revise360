"""1.5 Systems software: the revision bank.

Five lessons, and a topic that is mostly definitions until it is suddenly not:
the questions that cost marks are the ones asking why an operating system does
something, not what it is called.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written, sub, mp)

TOPIC = "1.5"

BANK = [

    # ============================================================ ss-l01
    sub("What the operating system does", "ss-l01-s2", ["ss-l01-o1"], [
        multi("Which of these are jobs done by an operating system? Tick all that apply.",
              ["Managing memory and the processor",
               "Managing files and folders",
               "Managing peripherals and their drivers",
               "Managing user accounts",
               "Providing a user interface",
               "Compressing a photograph",
               "Writing the programs the user runs"],
              ["Managing memory and the processor", "Managing files and folders",
               "Managing peripherals and their drivers", "Managing user accounts",
               "Providing a user interface"],
              fb="Five management jobs plus the interface. Compressing a file is a utility, "
                 "and the operating system does not write anybody's programs.",
              diff="retrieve"),
        short("State what is meant by systems software.",
              [mp("software that runs and manages the computer itself, rather than doing a "
                  "job for the user",
                  ["manage|manages|managing|run|runs|running|control|controls|operate"],
                  ["computer|system|hardware|machine|resources"],
                  exemplar="Software that runs and manages the computer itself.")],
              example="Software that runs and manages the computer itself, such as the "
                      "operating system and utilities, rather than application software that "
                      "does a job for the user.",
              paraphrase="Programs that control and look after the machine rather than "
                         "carrying out a task for the person using it.",
              fb="Managing the computer. Naming examples without saying what they do is "
                 "half an answer.", cw="state"),
    ]),

    sub("User interfaces", "ss-l01-s3", ["ss-l01-o2"], [
        match("Match each kind of user interface to a situation it suits.",
              [["Graphical user interface", "A pupil using a laptop to write an essay"],
               ["Command line interface", "A technician writing a script to set up fifty "
                                          "machines at once"],
               ["Menu driven interface", "A cash machine with a few fixed choices"],
               ["Voice interface", "A driver who needs their hands on the wheel"]],
              fb="Each interface suits a different balance of ease and control.",
              diff="understand", exam=True),
        written("Explain why a technician might prefer a command line interface to a "
                "graphical one.", 2,
                [mp("commands can be combined into a script and run automatically",
                    ["script|scripts|batch|automate|automatic|automatically|combined|"
                     "repeat|repeatedly|many machines|all at once"],
                    exemplar="Commands can be written into a script and run automatically."),
                 mp("so a long or repeated job is done far faster than clicking through it",
                    ["faster|quicker|less time|saves time|far more|more efficient|"
                     "without clicking|no clicking|one go"],
                    developed=True,
                    exemplar="This means a repeated job is done far faster than clicking "
                             "through a graphical interface.")],
                example="A command line lets commands be written into a script and run "
                        "automatically, so a job that has to be repeated across fifty "
                        "machines is done in one go rather than by clicking through the same "
                        "windows fifty times.",
                paraphrase="Typed commands can be saved into a script and executed without "
                           "supervision, which means a repetitive task finishes far more "
                           "quickly than working through menus would allow.",
                fb="Scripting, then what scripting saves.",
                diff="apply", exam=True),
        written("Explain one disadvantage of a command line interface for an ordinary user.",
                2,
                [mp("the user has to know the commands",
                    ["know|knows|remember|learn|memoris|memoriz|exact|precise",
                     "command|commands|syntax|instruction"],
                    exemplar="The user has to know the exact commands."),
                 mp("so it is harder to learn and a mistyped command may do something "
                    "unintended",
                    ["harder|difficult|steep|not easy|intimidating|confusing"],
                    ["mistype|mistyped|typo|wrong command|mistake|error|delete|damage"],
                    developed=True,
                    exemplar="This makes it much harder to learn than clicking on an icon.")],
                example="A command line gives no clues: the user has to know the exact "
                        "command and type it correctly, so it is much harder to learn than "
                        "pointing at an icon, and one mistyped command can do real damage.",
                paraphrase="Nothing on the screen tells you what is available, so you must "
                           "already know the commands and type them exactly, which makes it "
                           "far harder to pick up than clicking on pictures.",
                fb="What the user must know, and what follows from not knowing it.",
                diff="understand"),
    ]),

    # ============================================================ ss-l02
    sub("Multitasking and memory management", "ss-l02-s1",
        ["ss-l02-o1", "ss-l02-o2"], [
        short("State what is meant by multitasking.",
              [mp("the operating system appears to run several programs at the same time",
                  ["several|more than one|multiple|many|two or more",
                   "program|programs|task|tasks|application|applications"],
                  exemplar="Running several programs at what appears to be the same time.")],
              example="The operating system running several programs at what appears to the "
                      "user to be the same time, by switching between them very quickly.",
              paraphrase="Several applications appearing to run together, because the system "
                         "swaps between them rapidly.",
              fb="More than one program at once. On a single core it only appears "
                 "simultaneous, which is worth saying.", cw="state"),
        written("Explain how an operating system makes several programs appear to run at the "
                "same time on a single-core processor.", 3,
                [mp("only one program can actually use the processor at any instant",
                    ["one|only one|a single|at a time|at once",
                     "processor|cpu|core"],
                    exemplar="Only one program can use the processor at any one moment."),
                 mp("so the operating system gives each program a short turn in rotation",
                    ["turn|turns|slice|slot|share|shares|swap|swaps|switch|switches|"
                     "rotation|round|allocate|allocates"],
                    exemplar="The operating system gives each program a short turn in "
                             "rotation."),
                 mp("and the switching is so fast that the user does not notice",
                    ["so fast|very fast|quickly|rapid|milliseconds|does not notice|"
                     "cannot tell|appears|seems|looks like"],
                    developed=True,
                    exemplar="The switching is so fast that it appears simultaneous to the "
                             "user.")],
                example="A single core can only execute one program's instructions at any "
                        "instant, so the operating system gives each program a very short "
                        "slice of processor time in turn and then switches to the next one. "
                        "The switching happens thousands of times a second, so to the user "
                        "everything appears to be running at once.",
                paraphrase="Because the processor can only handle one program at a time, the "
                           "system allocates each a brief slot before moving to the next, and "
                           "it does this so rapidly that the user cannot tell they are taking "
                           "turns.",
                fb="Three ideas: one at a time, turns, and why it looks simultaneous.",
                diff="apply", exam=True),
        short("State one thing the operating system does when it manages memory.",
              [mp("it decides where each program's data goes and stops programs overwriting "
                  "each other",
                  ["allocat|assign|decides where|gives each|space|room|location|address"],
                  ["separate|own|cannot|overwrit|interfere|stop|protect|"
                   "not overwrite"],
                  exemplar="It allocates each program its own space in memory.")],
              example="It allocates each program its own area of memory and stops one "
                      "program from overwriting another's data.",
              paraphrase="It assigns space to each program and keeps them from interfering "
                         "with one another.",
              fb="Allocating, and keeping programs apart. Either half earns the mark.",
              cw="state"),
    ]),

    sub("Device drivers", "ss-l02-s4", ["ss-l02-o3"], [
        short("State what a device driver does.",
              [mp("it lets the operating system communicate with a particular piece of "
                  "hardware",
                  ["operating system|os|computer|software",
                   "communicat|talk|control|work with|use|understand|send|instruct"],
                  ["hardware|device|peripheral|printer|mouse|keyboard|card"],
                  exemplar="It lets the operating system communicate with a piece of "
                           "hardware.")],
              example="It translates between the operating system and a particular piece of "
                      "hardware, so the operating system can use the device without knowing "
                      "how it works inside.",
              paraphrase="It allows the system software to control a specific device.",
              fb="Between the operating system and the device. A driver is a translator, not "
                 "a program the user runs.", cw="state"),
        mcq("A user plugs in a new printer and it does not work until software is installed. "
            "What has been installed?",
            "A device driver", ["A utility", "An operating system update", "Firmware"],
            fb="Every model of hardware needs its own driver, which is why a new device "
               "often needs one installed.",
            diff="apply"),
    ]),

    # ============================================================ ss-l03
    sub("User accounts and file management", "ss-l03-s1", ["ss-l03-o1"], [
        written("Explain why an operating system gives each user their own account.", 2,
                [mp("each user has their own files and settings",
                    ["own files|own documents|own settings|own desktop|separate files|"
                     "their files|personal"],
                    exemplar="Each user has their own files and settings."),
                 mp("and the system can control what each one is allowed to do",
                    ["permission|permissions|access|allowed|rights|control|restrict|"
                     "cannot see|cannot change|privilege"],
                    exemplar="The system can also control what each one is allowed to do.")],
                example="Each user gets their own files, settings and desktop, which stay "
                        "private from the others, and the operating system can control what "
                        "each account is allowed to see and change.",
                paraphrase="Everyone has their own documents and preferences kept apart from "
                           "other people's, and the system decides what each person has "
                           "permission to do.",
                fb="Separation and permissions — both halves.",
                diff="understand"),
        multi("Which of these are jobs an operating system does when it manages files? Tick "
              "all that apply.",
              ["Keeping track of where each file is stored",
               "Letting the user rename, move and delete files",
               "Controlling which users can open which files",
               "Deciding what a file's contents mean",
               "Choosing which program the user should write next"],
              ["Keeping track of where each file is stored",
               "Letting the user rename, move and delete files",
               "Controlling which users can open which files"],
              fb="The operating system looks after where files are and who may touch them. "
                 "What is inside them is the application's business.",
              diff="understand"),
    ]),

    # ============================================================ ss-l04
    sub("Utility software", "ss-l04-s1", ["ss-l04-o1"], [
        match("Match each utility to what it does.",
              [["Encryption software", "Scrambles files so they cannot be read without the "
                                       "key"],
               ["Defragmentation software", "Moves the parts of files together so they are "
                                            "read faster"],
               ["Compression software", "Makes files smaller so they take less space to "
                                        "store or send"],
               ["Backup software", "Keeps a second copy of files in case the first is lost"]],
              fb="Four utilities, four different jobs. None of them is part of the operating "
                 "system's own management work.",
              diff="retrieve"),
        written("Explain why defragmenting a magnetic hard disk makes it faster to read "
                "files, but does nothing for a solid state drive.", 3,
                [mp("on a hard disk a fragmented file is spread across the platters",
                    ["fragment|fragmented|scattered|spread|split|pieces|parts|"
                     "different places|separate places"],
                    exemplar="On a hard disk the parts of a file end up scattered across the "
                             "platters."),
                 mp("so the read/write head has to move further and the read takes longer",
                    ["head|arm|moves|movement|travel|further|back and forth|"
                     "physically|mechanical"],
                    developed=True,
                    exemplar="The read/write head has to move further, so reading the file "
                             "takes longer."),
                 mp("a solid state drive has no moving parts, so where the data sits makes "
                    "no difference",
                    ["no moving parts|nothing moves|no head|no platter|solid state"],
                    exemplar="An SSD has no moving parts, so it makes no difference where "
                             "the data is.")],
                example="On a magnetic hard disk the parts of a file become scattered across "
                        "the platters, so the read/write head has to move between them and "
                        "reading the file takes longer. Putting the parts back together means "
                        "less head movement. A solid state drive has no moving parts at all, "
                        "so every location takes the same time to reach and defragmenting it "
                        "achieves nothing — while wearing the drive out slightly.",
                paraphrase="A file on a magnetic drive gets split across the disc, and "
                           "because the arm must travel between the pieces, reading it is "
                           "slower; gathering them together reduces that movement. On a "
                           "solid state drive nothing moves, so the position of the data is "
                           "irrelevant.",
                fb="Three ideas, and the third is the one that shows you understand why the "
                   "first two matter.",
                hint="What physically has to happen on a hard disk that does not happen on "
                     "an SSD?",
                diff="stretch", exam=True),
    ]),
]
