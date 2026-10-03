"""2.5 Programming languages and IDEs: the revision bank.

Five lessons, and a topic where almost every mark is a comparison: high level
against low level, compiler against interpreter, one IDE facility against
another. The questions are weighted towards written answers because the marks in
this topic are earned by saying why one thing suits a situation better than the
other, and a learner who can only name the four IDE facilities has half of it.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written,
                    extended, codeout, sub, mp)

TOPIC = "2.5"

BANK = [

    # ============================================================ pl-l01
    sub("High-level and low-level languages", "pl-l01-s1",
        ["pl-l01-o1", "pl-l01-o2"], [
        match("Match each description to the kind of language it describes.",
              [["High-level language",
                "Written in words and symbols close to English"],
               ["Low-level language",
                "Written in instructions tied to one kind of processor"],
               ["Assembly language",
                "Uses short mnemonics such as LDA and ADD, one per machine instruction"],
               ["Machine code",
                "The binary instructions the processor actually executes"]],
              fb="Assembly language and machine code are both low level. Assembly is the "
                 "readable form of the same instructions.",
              diff="retrieve"),
        short("State one advantage of writing a program in a high-level language rather "
              "than in machine code.",
              [mp("it is far quicker to write, read and correct because it is closer to "
                  "English",
                  ["quicker|faster|less time|easier|simpler|readable|read|understand|"
                   "correct|debug|fewer lines|shorter"],
                  exemplar="It is much easier and quicker to write, read and correct.")],
              example="It is much easier and quicker to write, because the instructions are "
                      "close to English rather than to the processor's own instruction set.",
              paraphrase="Writing it takes less time and the result is simpler to read, since "
                         "the code resembles ordinary language.",
              fb="Easier for a person. Any answer about the programmer's time or "
                 "understanding earns it.", cw="state"),
        written("Explain why a program written in a high-level language has to be translated "
                "before the processor can run it.", 2,
                [mp("the processor can only execute machine code",
                    ["machine code|binary|machine instruction|its own instruction|"
                     "zeros and ones|0s and 1s",
                     "processor|cpu|computer|hardware|chip"],
                    exemplar="The processor can only execute machine code."),
                 mp("so the high-level source has to be turned into it by a translator",
                    ["translat|compil|interpret|convert|turned into|changed into|"
                     "assembl"],
                    developed=True,
                    exemplar="So a translator has to convert the source code into machine "
                             "code first.")],
                example="A processor can only execute the binary machine code instructions it "
                        "was built to recognise. A high-level language is nothing like those "
                        "instructions, so a translator has to convert the source code into "
                        "machine code before anything can run.",
                paraphrase="Hardware understands only its own binary instruction set, which "
                           "means the source has to be converted into that form by a "
                           "translator first.",
                fb="What the processor can run, and what therefore has to happen to the "
                   "source.",
                diff="understand", exam=True),
        mcq("Which of these is a low-level language?",
            "Assembly language", ["Python", "Java", "C#"],
            fb="Assembly language maps one instruction to one machine instruction. The other "
               "three are all high level.",
            diff="retrieve"),
    ]),

    sub("Machine code and portability", "pl-l01-s5", ["pl-l01-o1", "pl-l01-o3"], [
        written("A program is written in machine code for one model of processor. Explain why "
                "it will not run on a computer with a different kind of processor.", 2,
                [mp("machine code instructions are specific to one instruction set",
                    ["specific|particular|only one|tied to|designed for|written for|"
                     "depends on|unique to",
                     "processor|cpu|instruction set|architecture|chip|hardware"],
                    exemplar="Machine code is written for one particular processor's "
                             "instruction set."),
                 mp("so a different processor does not recognise the same instructions",
                    ["different|another|other",
                     "does not recognis|not recognis|does not understand|"
                     "not understand|cannot read|different instruction|"
                     "no meaning|not the same"],
                    developed=True,
                    exemplar="So another processor cannot recognise those instructions, "
                             "because its own instruction set is different.")],
                example="Machine code is written for one particular processor's instruction "
                        "set, and the binary patterns mean what that processor was built to "
                        "take them to mean. A different kind of processor has a different "
                        "instruction set, so the same patterns mean nothing to it and the "
                        "program will not run.",
                paraphrase="The binary instructions only make sense to the chip they were "
                           "written for, because another design of chip uses a different set "
                           "of instructions altogether.",
                fb="Tied to one processor, and what that means for a different one.",
                hint="What does a particular binary pattern mean, and to whom?",
                diff="apply", exam=True),
        tf("A program written in Python can usually be run on computers with different kinds "
           "of processor without being rewritten.", True,
           fb="High-level source is portable: a translator for each machine does the work of "
              "producing instructions that machine understands."),
    ]),

    # ============================================================ pl-l02
    sub("Choosing a language level", "pl-l02-s4", ["pl-l02-o1", "pl-l02-o2"], [
        sort("Sort each statement by whether it describes a high-level or a low-level "
             "language.",
             ["High level", "Low level"],
             [["One line often stands for many machine instructions", "High level"],
              ["The programmer controls exactly which registers are used", "Low level"],
              ["The same source can be translated for different processors", "High level"],
              ["The programmer has to manage memory addresses themselves", "Low level"],
              ["Programs are quicker to write and easier to maintain", "High level"],
              ["Instructions correspond one-to-one with machine instructions", "Low level"]],
             fb="Control and detail on one side, speed of development and portability on the "
                "other. That trade is the whole topic.",
             diff="understand", exam=True),
        written("A team is writing the software that controls a washing machine's motor "
                "directly. Explain why they might choose a low-level language.", 2,
                [mp("a low-level language gives direct control of the hardware",
                    ["direct|directly|precise|exact|full|complete|fine",
                     "control|access|manage|hardware|register|registers|memory|port|"
                     "component"],
                    exemplar="A low-level language gives direct control of the hardware."),
                 mp("and uses less memory or runs faster, which matters on a small embedded "
                    "device",
                    ["less memory|little memory|small memory|smaller|efficient|faster|"
                     "quick|compact|speed|limited|cheap|cheaper|hardly any"],
                    developed=True,
                    exemplar="It also uses less memory and runs faster, which matters because "
                             "an embedded device has very little of either.")],
                example="A low-level language lets them control the hardware directly, setting "
                        "individual registers and memory locations rather than hoping a "
                        "high-level library does the right thing. The code is also smaller and "
                        "faster, which matters because the controller inside a washing machine "
                        "has very little memory and has to respond to the motor immediately.",
                paraphrase="It allows them to address the components precisely, and because "
                           "the resulting program is compact and quick it suits a controller "
                           "with hardly any memory.",
                fb="Control, then why control and efficiency matter on this particular device.",
                diff="apply", exam=True),
        written("Explain one reason a business writing a large accounts system would choose a "
                "high-level language instead.", 2,
                [mp("a large program is written and maintained far more quickly in a "
                    "high-level language",
                    ["quicker|faster|less time|saves time|save time|development time|"
                     "time to write|sooner|easier|simpler",
                     "write|written|writing|develop|maintain|change|read|team|"
                     "programmer|programmers"],
                    exemplar="A large program is much quicker to write and maintain in a "
                             "high-level language."),
                 mp("so the development cost is lower",
                    ["cost|cheaper|money|budget|save money|spend less|less to develop|"
                     "within budget"],
                    developed=True,
                    exemplar="This means it costs the business less to develop.")],
                example="An accounts system is large and will be changed for years, and "
                        "high-level code is far quicker to write and far easier to read. That "
                        "keeps the development cost down and means other programmers can "
                        "safely pick the system up later, which would be painful in assembly "
                        "language.",
                paraphrase="Because the program is big and long-lived, writing it in a "
                           "high-level language saves a great deal of development time, which "
                           "reduces cost and lets other members of the team work on it.",
                fb="Development time, and what saving it buys the business.",
                diff="apply"),
    ]),

    # ============================================================ pl-l03
    sub("Compilers and interpreters", "pl-l03-s2", ["pl-l03-o1", "pl-l03-o2"], [
        match("Match each statement to the translator it describes.",
              [["Compiler", "Translates the whole program once, before it is run"],
               ["Interpreter", "Translates and runs the program one line at a time"],
               ["Compiler", "Produces a file that can be run without the translator present"],
               ["Interpreter", "Stops at the first line containing an error and reports it"]],
              fb="A compiler produces something you can hand over. An interpreter has to be "
                 "there every time the program runs.",
              diff="understand", exam=True),
        short("State what a translator does.",
              [mp("it converts source code into machine code the processor can run",
                  ["convert|translat|change|turn|produce|compil|interpret",
                   "machine code|binary|object code|executable|machine instruction|"
                   "code the computer can run|code the processor can run"],
                  exemplar="It converts source code into machine code the processor can "
                           "run.")],
              example="It converts the source code a programmer wrote into the machine code "
                      "the processor can execute.",
              paraphrase="It turns program source into the binary instructions the hardware "
                         "is able to run.",
              fb="From source to machine code. Naming compilers and interpreters without "
                 "saying what they do is not the answer to this question.",
              cw="state"),
        written("Explain one advantage of using an interpreter while a program is being "
                "written.", 2,
                [mp("the program can be run straight away without waiting for the whole "
                    "thing to be translated",
                    ["straight away|immediately|at once|without waiting|no wait|instantly|"
                     "quickly|run it now|partly written|unfinished|incomplete|"
                     "line at a time|one line"],
                    exemplar="The program can be run straight away, without waiting for the "
                             "whole thing to be translated."),
                 mp("so errors are found and corrected one at a time as the code is written",
                    ["error|errors|mistake|mistakes|bug|bugs|fault|"
                     "where it went wrong|the line number|reports"],
                    developed=True,
                    exemplar="This means each error is reported as it is reached, so it can "
                             "be corrected at once.")],
                example="An interpreter translates and runs one line at a time, so a part-"
                        "written program can be tried immediately rather than waiting for a "
                        "full compilation. It stops at the first line with an error and says "
                        "where, so the programmer fixes one fault at a time instead of reading "
                        "a long list at the end.",
                paraphrase="Because it works through the code line by line, an unfinished "
                           "program can be tested right away, and it halts at each mistake so "
                           "that faults are dealt with one by one.",
                fb="Running it at once, and what that does for finding mistakes.",
                diff="understand", exam=True),
        written("Explain one advantage of using a compiler to produce the finished version of "
                "a program.", 2,
                [mp("the compiled program runs faster because it is already machine code",
                    ["faster|quicker|speed|more efficient|better performance|"
                     "already translated|no translation while|not translated again"],
                    exemplar="The compiled program runs faster because it is already in "
                             "machine code."),
                 mp("and it can be given to someone else without the source code or the "
                    "translator",
                    ["without|no need for|does not need|hidden|protect|cannot see|"
                     "distribut|share|sell|give|given|send|sent|hand|handed|"
                     "standalone|on its own",
                     "source code|translator|compiler|interpreter|user|users|customer|"
                     "someone else|somebody else|other people|their computer|"
                     "another computer"],
                    exemplar="It can also be handed to a user without the source code or the "
                             "translator.")],
                example="A compiled program is already machine code, so it runs faster than "
                        "the same program being translated line by line every time. It is also "
                        "a file in its own right, so it can be distributed to users who have "
                        "neither the source code nor a translator installed.",
                paraphrase="Since the translation has already happened, execution is quicker, "
                           "and the resulting file can be handed out on its own without "
                           "revealing the source or requiring a translator.",
                fb="Speed, and what you can hand over. Either pair of ideas earns both "
                   "marks.",
                diff="understand", exam=True),
        mcq("A programmer runs a program and it works correctly until the twentieth line, "
            "where it stops with an error message. Which translator is most likely in use?",
            "An interpreter",
            ["A compiler", "An assembler", "A linker"],
            fb="A compiler would have refused to produce a program at all. Running correctly "
               "up to the faulty line is what an interpreter does.",
            diff="apply", exam=True),
        written("Explain why a compiler reports errors differently from an interpreter.", 3,
                [mp("a compiler checks the whole program before producing anything",
                    ["whole|all of it|all of the code|all the code|entire program|"
                     "entire thing|complete|"
                     "everything|every line|all at once|in one go",
                     "check|checks|translat|read|reads|look|looks|examin|scan|"
                     "goes through|been through|before it runs|before running|"
                     "before it produces|first"],
                    exemplar="A compiler checks the whole program before it produces "
                             "anything."),
                 mp("so it reports a list of every error it found together",
                    ["list|all the errors|every error|together|report|reports|at the end|"
                     "summary"],
                    exemplar="It then reports all the errors it found together."),
                 mp("an interpreter stops at the first error because it has only reached "
                    "that line",
                    ["stops|halts|first error|first mistake|one at a time|as it reaches|"
                     "only got as far|line by line|one line"],
                    developed=True,
                    exemplar="An interpreter stops at the first error, because that is as far "
                             "as it has got.")],
                example="A compiler translates the whole program before producing anything, "
                        "so it can check every line and then report a list of all the errors "
                        "it found. An interpreter translates and runs one line at a time, so "
                        "it stops as soon as it reaches a line it cannot translate and reports "
                        "that one error, because it has not looked at the rest of the program "
                        "yet.",
                paraphrase="One examines all of the code first and so can list every fault at "
                           "once, whereas the other works through the lines in turn and halts "
                           "at the first problem, since it has not yet seen what follows.",
                fb="Three ideas: checking everything, listing them, and why the other can "
                   "only report one.",
                hint="How much of the program has each translator looked at when it reports?",
                diff="stretch", exam=True),
    ]),

    sub("Choosing a translator", "pl-l03-s6", ["pl-l03-o3"], [
        written("A teacher wants pupils to try short Python programs in lesson and see the "
                "result immediately. Explain why an interpreter suits this better than a "
                "compiler.", 2,
                [mp("an interpreter runs the code as soon as it is typed, with no separate "
                    "compilation step",
                    ["straight away|immediately|at once|no wait|without waiting|"
                     "as soon as|instantly|no compil|no separate step|line at a time"],
                    exemplar="An interpreter runs the code as soon as it is typed, with no "
                             "separate compiling step."),
                 mp("so pupils see the result and any error message within a lesson",
                    ["see|sees|shows|result|output|error message|feedback|"
                     "try again|change it|quick|lesson"],
                    developed=True,
                    exemplar="This means pupils see the result, or the error, and can change "
                             "the code and try again.")],
                example="An interpreter runs each line as it is typed, so there is no compile "
                        "step to wait through: a pupil presses run and sees the output or the "
                        "error message at once, changes a line and tries again. In a "
                        "fifty-minute lesson that matters more than the small speed advantage "
                        "a compiled program would have.",
                paraphrase="Because it executes the code immediately rather than building a "
                           "separate file first, learners get the output or the error straight "
                           "away and can keep adjusting their program.",
                fb="No compile step, and what the pupils get because of it.",
                diff="apply", exam=True),
        mcq("A company is selling a game to the public and does not want customers to see or "
            "change the source code. Which translator should it use for the version it "
            "sells?",
            "A compiler", ["An interpreter", "An assembler", "A text editor"],
            fb="A compiled file is machine code. An interpreted program has to be shipped as "
               "source, which anyone can read.",
            diff="apply", exam=True),
    ]),

    # ============================================================ pl-l04
    sub("The facilities of an IDE", "pl-l04-s1", ["pl-l04-o1", "pl-l04-o2"], [
        multi("Which of these are facilities an integrated development environment provides? "
              "Tick all that apply.",
              ["An editor for writing source code",
               "A translator so the program can be run",
               "Error diagnostics such as messages and breakpoints",
               "A run-time environment for running the program without leaving the IDE",
               "A faster processor",
               "A guarantee that the program contains no logic errors"],
              ["An editor for writing source code",
               "A translator so the program can be run",
               "Error diagnostics such as messages and breakpoints",
               "A run-time environment for running the program without leaving the IDE"],
              fb="Four facilities: editor, translator, diagnostics and run-time environment. "
                 "No IDE can promise your logic is right.",
              diff="retrieve", exam=True),
        match("Match each IDE facility to what it does for the programmer.",
              [["Editor", "Provides line numbers, indentation and colour-coded keywords "
                          "while code is typed"],
               ["Error diagnostics", "Reports the line where a fault was found and lets the "
                                     "program be paused to inspect variables"],
               ["Run-time environment", "Runs the program and shows its output inside the "
                                        "same window"],
               ["Translator", "Converts the source code so that it can be executed"]],
              fb="Each facility removes a different separate tool the programmer would "
                 "otherwise need.",
              diff="understand"),
        short("State one way the editor in an IDE helps a programmer write correct code.",
              [mp("it shows the structure of the code as it is typed, for example by "
                  "colouring keywords or indenting automatically",
                  ["colour|highlight|keyword|indent|line number|autocomplete|"
                   "auto complete|bracket|matching|suggests|prompt|formatting|"
                   "shows the structure"],
                  exemplar="It colours keywords and indents the code automatically, so "
                           "mistakes show up as they are typed.")],
              example="It colour-codes keywords, numbers the lines and indents blocks "
                      "automatically, so a missing bracket or a misspelled keyword is "
                      "visible while the code is being written.",
              paraphrase="Features such as highlighted keywords, automatic indentation and "
                         "line numbering make an error obvious as soon as it is typed.",
              fb="Anything the editor itself does to make the code's structure visible.",
              cw="state"),
        written("Explain how a breakpoint helps a programmer find a logic error.", 2,
                [mp("it pauses the program at a chosen line",
                    ["pause|pauses|paused|stop|stops|halt|halts|freeze|break|"
                     "chosen line|particular line|a chosen point"],
                    exemplar="It pauses the program at a line the programmer chooses."),
                 mp("so the values held in the variables at that point can be inspected",
                    ["see|sees|shows|shown|inspect|watch|examine|check|look|view|read|"
                     "compare",
                     "variable|variables|value|values|contents|data|what is stored|"
                     "what it holds"],
                    developed=True,
                    exemplar="This lets the programmer see what the variables hold at that "
                             "point and compare it with what they expected.")],
                example="A breakpoint pauses execution at a line the programmer chooses, so "
                        "the program stops part-way instead of running to the end. The "
                        "programmer can then inspect the values in the variables at that exact "
                        "point and compare them with what they expected, which is how a logic "
                        "error is tracked down to a particular line.",
                paraphrase="It halts the program at a selected point so that the contents of "
                           "the variables can be examined and checked against what they ought "
                           "to be.",
                fb="Pausing, and what pausing lets you look at.",
                diff="understand", exam=True),
        mcq("A program runs without crashing but prints the wrong average. Which IDE facility "
            "is most useful here?",
            "Error diagnostics such as breakpoints and variable watches",
            ["The editor's keyword colouring",
             "The run-time environment's output window",
             "The translator's compilation speed"],
            fb="The program runs, so this is a logic error. Watching the variables change is "
               "what finds it.",
            diff="apply", exam=True),
    ]),

    sub("Diagnostics and the run-time environment", "pl-l04-s4",
        ["pl-l04-o2", "pl-l04-o3"], [
        written("Explain why an IDE's error message gives a line number as well as a "
                "description of the fault.", 2,
                [mp("the line number says where to look in the source code",
                    ["where|the line number|locate|find|position|place|point to|"
                     "straight to|jump to"],
                    exemplar="The line number tells the programmer where in the source code to "
                             "look."),
                 mp("so a long program does not have to be read through to find the fault",
                    ["long|large|hundreds|thousands|whole program|every line|"
                     "search|read through|time|quicker|faster|without reading"],
                    developed=True,
                    exemplar="This means a long program does not have to be read through from "
                             "the start to find it.")],
                example="The description says what is wrong and the line number says where, so "
                        "the programmer can go straight to the fault. Without the line number, "
                        "finding a missing colon in a program of several hundred lines would "
                        "mean reading all of them.",
                paraphrase="Knowing the position as well as the nature of the problem means "
                           "that the programmer can go directly to it instead of searching "
                           "through the whole listing.",
                fb="Where, and why where saves time.",
                diff="understand"),
        tf("An IDE's error diagnostics will find every logic error in a program.", False,
           fb="Diagnostics find errors the translator or the run-time can detect. A program "
              "that runs perfectly and produces the wrong answer looks fine to them.",
           exam=True),
        codeout("A pupil runs this in an IDE. What does it print?",
                "total = 0\n"
                "for n in range(1, 5):\n"
                "    total = total + n\n"
                "print(total)",
                "10",
                fb="range(1, 5) gives 1, 2, 3 and 4, which add to 10. The IDE's run-time "
                   "environment shows this in its own output window.",
                hint="Which values does range(1, 5) actually produce?",
                diff="apply"),
    ]),

    # ============================================================ pl-l05
    sub("Putting the topic together", "pl-l05-s6", ["pl-l05-o1", "pl-l05-o3"], [
        order("Put these stages in the order they happen when a compiled program is written "
              "and then used by a customer.",
              ["The programmer writes the source code in an editor",
               "The compiler translates the whole program and reports any errors",
               "The compiler produces an executable file",
               "The executable file is sent to the customer",
               "The customer runs the executable without a translator installed"],
              fb="Translation happens once, before distribution. That is exactly why the "
                 "customer needs no translator.",
              diff="understand"),
        extended("A charity needs a program that will run on several makes of computer, be "
                 "changed by volunteers over many years, and be given out as a file people "
                 "can simply run. Discuss what language level and what translator you would "
                 "recommend, and why.", 6,
                 [mp("a high-level language, because the source can be translated for "
                     "different machines",
                     ["high level|high-level|python|java|c#|c sharp|visual basic",
                      "different|several|various|any machine|portab|more than one"],
                     exemplar="A high-level language, because the same source can be "
                              "translated for each different make of computer."),
                  mp("and because volunteers can read and change high-level code",
                     ["volunteer|others|other people|read|readable|understand|maintain|"
                      "change|years|easier"],
                     exemplar="Volunteers can also read and change high-level code, which "
                              "matters over many years."),
                  mp("a compiler, because the charity wants to hand out a file people can run",
                     ["compil", "file|executable|hand out|give out|distribut|send|"
                      "run it|without a translator|on its own"],
                     exemplar="A compiler, because the charity wants to give out a file "
                              "people can simply run."),
                  mp("the compiled program also runs faster than an interpreted one",
                     ["faster|quicker|speed|efficient|performance"],
                     exemplar="A compiled program also runs faster than the same program "
                              "being interpreted."),
                  mp("but it has to be compiled separately for each kind of machine",
                     ["each|every|separate|again|recompil|once per|one for",
                      "machine|computer|platform|system|processor|make"],
                     exemplar="The drawback is that it has to be compiled separately for each "
                              "kind of machine."),
                  mp("and an interpreter would have suited the volunteers' own testing",
                     ["interpret", "test|testing|writing it|develop|try|"
                      "straight away|immediately|as they work"],
                     exemplar="An interpreter would still be useful to the volunteers while "
                              "they are writing and testing changes.")],
                 example="I would recommend a high-level language such as Python or Java. The "
                         "same source code can be translated for each make of computer, so the "
                         "charity does not need a separate program for every machine, and "
                         "high-level code is readable enough that volunteers arriving years "
                         "later can understand and change it — which would be close to "
                         "impossible in assembly language.\n\n"
                         "For the version handed out I would use a compiler. Compiling "
                         "produces an executable file that people can simply run, with no "
                         "source code and no translator needed on their computer, and it runs "
                         "faster than the same program being translated line by line. The "
                         "drawback is that the program has to be compiled separately for each "
                         "kind of machine the charity supports, and anyone wanting to change "
                         "it needs the source and a compiler.\n\n"
                         "While the volunteers are actually writing the code, an interpreter is "
                         "the better tool: they can run a half-finished change immediately and "
                         "see the first error rather than waiting for a full compilation. So "
                         "the honest answer is both — interpreted while developing, compiled "
                         "for release.",
                 fb="Six ideas are available and a good answer reaches a recommendation rather "
                    "than listing features. Mark yourself on whether you said why each choice "
                    "suits THIS charity.",
                 hint="Three requirements are given: several makes of computer, years of "
                      "volunteers, and a file people can run. Take each in turn."),
    ]),

    sub("Recalling the whole topic", "pl-l05-s1", ["pl-l05-o1"], [
        sort("Sort each statement by whether it describes a compiler or an interpreter.",
             ["Compiler", "Interpreter"],
             [["Translates the program once before it runs", "Compiler"],
              ["Translates each line again every time it is reached", "Interpreter"],
              ["Produces an executable file", "Compiler"],
              ["Must be installed on any computer that runs the program", "Interpreter"],
              ["Reports all the errors it found together", "Compiler"],
              ["Stops at the first error it reaches", "Interpreter"]],
             fb="Once versus every time. Every other difference follows from that one.",
             diff="understand", exam=True),
        mcq("Which of these is NOT one of the four facilities of an IDE?",
            "A guarantee that the program meets the user's requirements",
            ["An editor", "A translator", "A run-time environment"],
            fb="Whether the program does what was asked is settled by testing against the "
               "requirements, not by the IDE.",
            diff="retrieve"),
        short("State what is meant by source code.",
              [mp("the program as the programmer wrote it, before translation",
                  ["written|wrote|writes|typed|types|programmer|human|original",
                   "before|not yet|untranslat|high level|readable|text|language"],
                  exemplar="The program as the programmer wrote it, before it is "
                           "translated.")],
              example="The program in the language the programmer wrote it in, before a "
                      "translator has converted it into machine code.",
              paraphrase="The original human-readable version of a program, as typed by the "
                         "programmer and not yet converted.",
              fb="What the programmer typed. Machine code is the output of translation, not "
                 "the source.",
              cw="state"),
    ]),
]
