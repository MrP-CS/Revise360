"""1.1 Systems architecture: the revision bank.

New questions, not the ones the lessons already ask. Each subtopic points at the
station in the course that teaches it, so a lost mark can send a learner
straight back to Fetch-execute factory station 2 rather than to the whole unit.

Written in Python; tools/mkrevision.py builds revision/1.1/*.json from it.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written, extended,
                    num, step, codeout, trace, sub, mp)

TOPIC = "1.1"

# Patterns used more than once. A group written here once cannot drift between
# the questions that share it.
FASTER = "fast|quick|speed|rapid|more instruction|more cycle|sooner"
SLOWER = "slow|slower|less quick|takes longer|delay|lag"
# Two claims that are denials. The negation goes inside the pattern, so the
# matching one earns the mark and the opposite statement does not - see the note
# above inClause in js/revmark.js.
NOT_WAITING = ("not wait|not have to wait|no waiting|without waiting|not left waiting|"
               "not kept waiting|not delayed|not held up|avoids waiting|less waiting|"
               "not idle|no delay")
NOT_TOGETHER = ("not at the same time|cannot be fetched at the same time|"
                "cannot be read at the same time|not be fetched at the same time|"
                "cannot both|can not both|not simultaneous|not together|not at once|"
                "cannot be done at the same time|cannot happen at the same time")

BANK = [

    # ============================================================ sa-l01
    sub("Purpose of the CPU", "sa-l01-s1", ["sa-l01-o1"], [
        mcq("Which of these best describes what the CPU does?",
            "It processes the data and instructions that make up a program",
            ["It stores files so they are still there after a restart",
             "It converts analogue signals into digital ones",
             "It supplies electricity to the other components"],
            fb="The CPU processes data and instructions. Storing files that survive a "
               "restart is secondary storage, not the CPU."),
        mcq("A CPU repeats the same three-stage cycle over and over. What is it called?",
            "The fetch–decode–execute cycle",
            ["The input–process–output cycle",
             "The read–write–erase cycle",
             "The compile–link–run cycle"],
            fb="Fetch, decode, execute. Input–process–output describes a whole "
               "system; this is what happens inside the processor."),
        tf("The CPU can only work on data that is in main memory, not data still on "
           "secondary storage.", True,
           fb="True. Anything the CPU needs has to be loaded into RAM first, which is why "
              "a program has to load before it runs."),
        short("State what the letters CPU stand for.",
              [mp("central processing unit", ["central", "processing|processor", "unit"],
                  exemplar="Central processing unit.")],
              example="Central processing unit.",
              paraphrase="It stands for central processing unit.",
              fb="Central processing unit. Writing 'computer processing unit' is a common "
                 "slip and does not earn the mark.",
              cw="state"),
        written("Explain why a computer with no CPU could not run a program, even if it had "
                "plenty of RAM and storage.", 2,
                [mp("the CPU is what carries out, or processes, the instructions",
                    ["cpu|processor", "carry out|carries out|execute|process|run|perform"],
                    exemplar="The CPU is the part that carries out the instructions."),
                 mp("so instructions would only be stored, never acted on",
                    ["store|stored|held|sit|sitting|kept|remain",
                     "never|nothing|not run|not execute|not carried out|no one|not processed|would not"],
                    ["memory|ram|storage", "cannot|can not|nothing happens|no processing|not processed"],
                    developed=True,
                    exemplar="The instructions would just be stored in RAM, so nothing "
                             "would ever happen to them.")],
                example="The CPU is the component that fetches and carries out each "
                        "instruction, so without one the instructions would simply sit in "
                        "RAM and never be executed.",
                paraphrase="Only the processor actually performs instructions, which means "
                           "they would stay in memory and nothing would ever happen.",
                fb="RAM and storage hold instructions; only the CPU acts on them.",
                hint="What does RAM do with an instruction, and what has to happen next?",
                misc="Learners often say RAM 'runs' the program. RAM holds it; the CPU runs it.",
                diff="understand"),
    ]),

    sub("Stage 1: fetch", "sa-l01-s2", ["sa-l01-o3"], [
        mcq("Which register holds the address of the next instruction to be fetched?",
            "The program counter (PC)",
            ["The accumulator (ACC)", "The memory data register (MDR)",
             "The memory address register (MAR)"],
            fb="The program counter holds the address of the next instruction. The MAR "
               "holds the address currently being used for a fetch or a write."),
        order("Put the fetch stage into the right order.",
              ["The program counter supplies the address of the next instruction",
               "That address is copied into the memory address register",
               "The instruction at that address is copied from RAM into the memory data register",
               "The program counter is incremented"],
              fb="The program counter is incremented during the fetch, so it is already "
                 "pointing at the next instruction before this one has been executed.",
              diff="apply"),
        short("State what happens to the program counter during each fetch.",
              [mp("it is incremented, so it points at the next instruction",
                  ["increment|increase|goes up|add one|adds 1|plus one|moves on|next instruction"],
                  exemplar="It is incremented by one.")],
              example="It is incremented, so it holds the address of the next instruction.",
              paraphrase="Its value goes up by one so it points at the following instruction.",
              fb="Incremented. A common wrong answer is that it is reset, which would make "
                 "the CPU run the same instruction forever."),
        written("Describe the role of the MAR and the MDR during the fetch stage.", 2,
                [mp("the MAR holds the address being fetched from",
                    ["mar|memory address register", "address"],
                    exemplar="The MAR holds the address of the instruction to be fetched."),
                 mp("the MDR holds the instruction that comes back",
                    ["mdr|memory data register", "instruction|data|contents|value"],
                    exemplar="The MDR holds the instruction fetched from memory.")],
                example="The MAR holds the address of the instruction to be fetched, and the "
                        "instruction that comes back from RAM is placed in the MDR.",
                paraphrase="The memory address register stores which address to read, and the "
                           "memory data register stores the instruction that arrives.",
                fb="One register carries the address out, the other carries the instruction back.",
                cw="describe", diff="understand"),
    ]),

    sub("Stage 2: decode", "sa-l01-s3", ["sa-l01-o3", "sa-l01-o4"], [
        mcq("Which part of the CPU decodes an instruction?",
            "The control unit", ["The arithmetic logic unit", "The accumulator",
                                 "The cache"],
            fb="The control unit decodes the instruction and sends the signals that make the "
               "rest of the CPU do what it says."),
        short("State what the CPU works out during the decode stage.",
              [mp("what the instruction means, and so what has to be done",
                  ["instruction|it", "mean|means|meaning|requires|needs|says|is asking"],
                  ["work out|works out|determine|identify|interpret|understand|"
                   "decode|decodes|figure out"],
                  exemplar="What the instruction means and what needs to be done.")],
              example="It works out what the instruction means and what needs to be done next.",
              paraphrase="The processor interprets the instruction to determine what action "
                         "it requires.",
              fb="Decode is where the instruction is interpreted, before anything is done "
                 "about it."),
        tf("Decoding an instruction means translating it from a high-level language into "
           "machine code.", False,
           fb="False, and this is a common confusion. Translating a high-level language is "
              "what a compiler or interpreter does, before the program runs. Decoding "
              "happens inside the CPU, on an instruction that is already machine code.",
           misc="Decode is confused with translation. By the time the CPU sees it, the "
                "instruction is already machine code."),
    ]),

    sub("Stage 3: execute", "sa-l01-s4", ["sa-l01-o3"], [
        mcq("During the execute stage of an instruction that adds two numbers, which "
            "component does the addition?",
            "The arithmetic logic unit (ALU)",
            ["The control unit (CU)", "The program counter (PC)",
             "The memory address register (MAR)"],
            fb="The ALU performs calculations and logical comparisons. The control unit "
               "tells it to, but does not do the arithmetic itself."),
        multi("Which of these could happen during the execute stage? Tick all that apply.",
              ["Data is fetched from memory to be used in a calculation",
               "The result of a calculation is written back to RAM",
               "The CPU jumps to a different instruction",
               "The program is translated into machine code",
               "The instruction is copied into the MDR"],
              ["Data is fetched from memory to be used in a calculation",
               "The result of a calculation is written back to RAM",
               "The CPU jumps to a different instruction"],
              fb="Execute does whatever the instruction says, which may include a "
                 "calculation, a write back to memory, or a jump. Copying the instruction "
                 "into the MDR happened back in the fetch stage.",
              diff="apply"),
        short("Name the register that holds the result of a calculation.",
              [mp("the accumulator", ["accumulator|acc"],
                  exemplar="The accumulator.")],
              example="The accumulator (ACC).",
              paraphrase="The ACC.",
              fb="The accumulator. It is where the ALU puts its result before anything else "
                 "happens to it.",
              cw="name"),
    ]),

    sub("The registers", "sa-l01-s5", ["sa-l01-o2"], [
        match("Match each register to what it holds.",
              [["Program counter", "The address of the next instruction"],
               ["Memory address register", "The address being read from or written to"],
               ["Memory data register", "The data or instruction just fetched"],
               ["Accumulator", "The result of the last calculation"]],
              fb="The PC looks ahead to the next instruction; the MAR holds the address in "
                 "use right now.",
              diff="understand"),
        mcq("Why are registers made part of the CPU rather than part of RAM?",
            "So the CPU can read and write them extremely quickly",
            ["So their contents survive when the power is switched off",
             "So several programs can share them at once",
             "So they can hold much more data than RAM"],
            fb="Registers are tiny and extremely fast because they are inside the CPU. They "
               "hold only a few values, and they are volatile.",
            diff="understand"),
        tf("A register holds more data than cache.", False,
           fb="False. The order of size is registers, then cache, then RAM, then secondary "
              "storage — and the order of speed is exactly the other way round."),
        written("Explain why a CPU needs registers at all, when it already has access to RAM.",
                2,
                [mp("registers are much faster to access than RAM",
                    ["register|they|them", FASTER],
                    exemplar="Registers are far faster to access than RAM."),
                 mp("so the CPU is not left waiting during every cycle",
                    [NOT_WAITING],
                    developed=True,
                    exemplar="This means the CPU does not have to wait for RAM during every "
                             "cycle, so the cycle completes sooner.")],
                example="Registers are inside the CPU, so reading and writing them is far "
                        "faster than going out to RAM, which means the processor is not left "
                        "waiting during every cycle.",
                paraphrase="Registers sit inside the processor so they can be read much more "
                           "quickly than RAM, which means the CPU is not kept waiting "
                           "on each cycle.",
                fb="Speed is the whole point, and the mark for explaining it comes from "
                   "linking the speed to what the CPU would otherwise be doing: waiting.",
                hint="Compare the time to reach a register with the time to reach RAM, then "
                     "say what the CPU would be doing in the meantime.",
                diff="apply"),
    ]),

    sub("Other CPU components", "sa-l01-s6", ["sa-l01-o4"], [
        match("Match each CPU component to its job.",
              [["Arithmetic logic unit", "Carries out calculations and comparisons"],
               ["Control unit", "Decodes instructions and sends control signals"],
               ["Cache", "Holds frequently used data close to the CPU"]],
              fb="The CU directs; the ALU calculates; the cache keeps what is used often "
                 "within easy reach.",
              diff="retrieve"),
        mcq("A CPU keeps needing the same small table of values. Which component makes that "
            "faster?",
            "Cache", ["The accumulator", "Virtual memory", "The program counter"],
            fb="Cache holds frequently used data and instructions, so the CPU does not have "
               "to fetch them from RAM each time.",
            diff="apply"),
        short("State one thing the arithmetic logic unit does, other than arithmetic.",
              [mp("logical comparisons or decisions",
                  ["logic|logical|compare|comparison|comparing|decision|boolean"],
                  exemplar="It makes logical comparisons.")],
              example="It carries out logical comparisons, such as deciding whether one "
                      "value is greater than another.",
              paraphrase="It performs logic operations and comparisons.",
              fb="The L in ALU is for logic: comparisons and Boolean operations as well as "
                 "sums.",
              cw="state"),
    ]),

    sub("The cycle, end to end", "sa-l01-s7", ["sa-l01-o1", "sa-l01-o3"], [
        order("A CPU is about to run one instruction. Put the whole fetch–decode–"
              "execute cycle in order.",
              ["The address in the program counter is copied to the MAR",
               "The instruction is copied from RAM into the MDR",
               "The program counter is incremented",
               "The control unit decodes the instruction",
               "The instruction is carried out"],
              fb="The increment happens during the fetch, not at the end: the CPU is already "
                 "pointing at the next instruction while it decodes this one.",
              diff="apply", exam=True),
        written("A computer is running a program. Describe what happens during one complete "
                "fetch–decode–execute cycle.", 3,
                [mp("fetch: the instruction is brought from memory into the CPU",
                    ["fetch|fetched|brought|copied|retrieved|collected",
                     "instruction", "memory|ram"],
                    exemplar="The instruction is fetched from RAM into the CPU."),
                 mp("decode: the control unit works out what the instruction means",
                    ["decode|decoded|interpret|work out|works out|understood|understand"],
                    exemplar="The control unit decodes it to work out what it means."),
                 mp("execute: the instruction is carried out, for example by the ALU",
                    ["execute|executed|carried out|carries out|performed|acted on|done"],
                    exemplar="The instruction is then executed.")],
                example="The address in the program counter is used to fetch the next "
                        "instruction from RAM into the CPU. The control unit then decodes it "
                        "to work out what it means. Finally the instruction is executed, for "
                        "example by the ALU performing a calculation.",
                paraphrase="First the processor collects the next instruction from memory, "
                           "then the control unit interprets it, and then it is carried out.",
                fb="Three marks, one for each stage, and each needs to say what actually "
                   "happens rather than just naming the stage.",
                cw="describe", diff="apply", exam=True),
        extended("A manufacturer is designing a processor for a laptop. Discuss what the "
                 "fetch–decode–execute cycle tells the designers about where to "
                 "spend their effort to make the laptop feel faster.", 6,
                 [mp("explains the cycle repeats continuously, so any saving is repeated "
                     "billions of times a second", ["cycle"]),
                  mp("identifies fetching from RAM as the slow step in the cycle", ["ram"]),
                  mp("argues for a larger or faster cache, reducing trips to RAM", ["cache"]),
                  mp("argues for a higher clock speed, and recognises the heat cost",
                     ["clock|heat"]),
                  mp("argues for more cores, and recognises software must use them",
                     ["core"]),
                  mp("reaches a judgement about which change helps this use most, and why",
                     ["because|so|therefore|overall|conclusion"])],
                 example="The cycle runs billions of times a second, so anything that "
                         "shortens one cycle is multiplied enormously. The slowest part of "
                         "the cycle is reaching out to RAM, so a larger cache helps most of "
                         "all: more of what is needed is already inside the CPU and the "
                         "fetch stage finishes sooner. Raising the clock speed shortens every "
                         "cycle directly, but a laptop has limited cooling and more heat "
                         "means the processor may have to slow itself down, so there is a "
                         "limit to what that can achieve. Adding cores lets several cycles "
                         "run at once, which helps when a user has many applications open, "
                         "but a single-threaded program gains nothing from it. For a laptop "
                         "used for ordinary work, I would spend the effort on cache and "
                         "cores rather than clock speed, because cooling is the constraint "
                         "that cannot be designed away.",
                 fb="A six-mark discussion is marked by you, against the points above. Look "
                    "for whether you reached a judgement and gave a reason for it — "
                    "that is what separates a discussion from a list.",
                 bands=["CONTENT", "APPLICATION", "DEVELOPMENT", "BALANCE", "CONCLUSION"]),
    ]),

    # ============================================================ sa-l02
    sub("Von Neumann architecture", "sa-l02-s1", ["sa-l02-o1"], [
        mcq("Which idea is von Neumann architecture built on?",
            "Instructions and data are held together in the same main memory",
            ["Instructions are held in the CPU and data in memory",
             "Each program gets its own separate processor",
             "Data is held on secondary storage while a program runs"],
            fb="The stored-program concept: one memory holding both the instructions and "
               "the data they work on."),
        short("Give one reason the stored-program concept made computers much more useful.",
              [mp("the same machine can run a different program by loading different "
                  "instructions",
                  ["different|another|new|any|many|several",
                   "program|software|job|task|instruction"],
                  ["reprogram|re-program|general purpose|general-purpose"],
                  exemplar="A different program can be loaded, so the same computer can do "
                           "a different job.")],
              example="Loading a different set of instructions makes the same computer do a "
                      "different job, instead of being rebuilt for each task.",
              paraphrase="You can run new software on the same hardware rather than "
                         "rewiring it.",
              fb="Before stored programs, changing the task meant changing the machine.",
              cw="give", diff="understand"),
    ]),

    sub("The stored-program concept", "sa-l02-s2", ["sa-l02-o1", "sa-l02-o2"], [
        tf("In a von Neumann computer, instructions and data travel to the CPU along the "
           "same bus.", True,
           fb="True, and it is the architecture's main weakness: an instruction and the data "
              "it needs cannot be fetched at the same time."),
        written("Explain one disadvantage of storing instructions and data in the same memory, "
                "reached by the same bus.", 2,
                [mp("only one of them can be fetched at a time",
                    ["one at a time|one by one|take turns|queue|share the bus|one after"],
                    [NOT_TOGETHER],
                    exemplar="An instruction and its data cannot be fetched at the same time."),
                 mp("so the CPU may be left waiting, which slows the computer down",
                    ["wait|waiting|delay|bottleneck|held up|idle", SLOWER],
                    [SLOWER, "cpu|computer|processor|program|it"],
                    developed=True,
                    exemplar="This means the CPU has to wait, so the program runs more "
                             "slowly.")],
                example="Because both share one bus, an instruction and the data it needs "
                        "cannot be fetched at the same time, so the CPU has to wait and the "
                        "program runs more slowly.",
                paraphrase="They have to take turns on the single bus, which leaves the "
                           "processor idle and makes things slower.",
                fb="This is the von Neumann bottleneck. The second mark is for the "
                   "consequence, not for naming it.",
                hint="If two things need the same single road, what happens to the second?",
                diff="apply", exam=True),
    ]),

    sub("Program counter and accumulator", "sa-l02-s3", ["sa-l02-o2"], [
        mcq("A program has just executed the instruction at address 42, and the next "
            "instruction is at 43. What does the program counter hold now?",
            "43", ["42", "The instruction itself", "The result of the instruction"],
            fb="The PC holds an address, not an instruction, and it was incremented during "
               "the fetch, so it already holds 43.",
            diff="apply"),
        short("State what the accumulator holds.",
              [mp("the result of a calculation carried out by the ALU",
                  ["result|answer|total|output|outcome|worked out|works out|calculated|"
                   "computed"],
                  exemplar="The result of a calculation.")],
              example="The result of the most recent calculation done by the ALU.",
              paraphrase="Whatever the ALU just worked out.",
              fb="Results, not addresses. Addresses live in the PC and the MAR.",
              cw="state"),
    ]),

    sub("MAR and MDR", "sa-l02-s4", ["sa-l02-o2"], [
        mcq("The CPU is about to write a value to address 100 in RAM. Which register holds "
            "the number 100?",
            "The memory address register",
            ["The memory data register", "The accumulator", "The program counter"],
            fb="The MAR holds the address, whether the CPU is reading or writing. The MDR "
               "holds the value itself.",
            diff="apply"),
        multi("Which statements about the MAR and MDR are true? Tick all that apply.",
              ["The MAR holds an address", "The MDR holds data or an instruction",
               "They are both inside the CPU",
               "The MDR holds the address of the next instruction",
               "The MAR holds the result of a calculation"],
              ["The MAR holds an address", "The MDR holds data or an instruction",
               "They are both inside the CPU"],
              fb="Address in the MAR, contents in the MDR, both of them registers inside the "
                 "CPU. The address of the next instruction is the program counter's job.",
              diff="understand"),
    ]),

    sub("Other architectures", "sa-l02-s5", ["sa-l02-o1"], [
        mcq("How does Harvard architecture differ from von Neumann architecture?",
            "It keeps instructions and data in separate memories with separate buses",
            ["It has no registers inside the CPU",
             "It stores programs on secondary storage rather than in memory",
             "It can only run one program at a time"],
            fb="Separate memories and separate buses, which is why an instruction and data "
               "can be fetched at the same time."),
        written("A company is designing the controller for a washing machine and is choosing "
                "between von Neumann and Harvard architecture. Explain one reason Harvard "
                "architecture might be chosen.", 2,
                [mp("instructions and data are in separate memories with separate buses",
                    ["separate|two|different|own", "memor|bus"],
                    exemplar="Harvard architecture has separate memories and buses for "
                             "instructions and data."),
                 mp("so both can be fetched at the same time, which suits a device that must "
                    "respond predictably",
                    ["same time|simultaneous|at once|together|in parallel|both"],
                    developed=True,
                    exemplar="This means an instruction and its data can be fetched at the "
                             "same time, so the controller responds faster.")],
                example="Harvard architecture uses separate memories and buses for "
                        "instructions and data, so an instruction and the data it needs can "
                        "be fetched at the same time, which makes the controller respond "
                        "more quickly and more predictably.",
                paraphrase="Because the program and the data are in different memories with "
                           "their own buses, both can be read simultaneously, giving faster "
                           "and more predictable response.",
                fb="Separate buses, therefore simultaneous fetches. The second mark needs "
                   "the 'therefore'.",
                diff="apply", exam=True),
    ]),

    sub("Name that part", "sa-l02-s7", ["sa-l02-o2"], [
        sort("Sort each item into where it belongs.",
             ["Inside the CPU", "Outside the CPU"],
             [["Accumulator", "Inside the CPU"],
              ["Control unit", "Inside the CPU"],
              ["Arithmetic logic unit", "Inside the CPU"],
              ["Program counter", "Inside the CPU"],
              ["RAM", "Outside the CPU"],
              ["Solid state drive", "Outside the CPU"]],
             fb="Everything with 'register' or 'unit' in its name here is inside the "
                "processor. RAM and the drive are not.",
             diff="retrieve"),
        mcq("Which list puts these in order from fastest to slowest to access?",
            "Register, cache, RAM, solid state drive",
            ["Cache, register, RAM, solid state drive",
             "RAM, register, cache, solid state drive",
             "Register, RAM, cache, solid state drive"],
            fb="Speed runs the opposite way to size: the smallest store is the fastest.",
            diff="understand", exam=True),
    ]),

    # ============================================================ sa-l03
    sub("Clock speed", "sa-l03-s1", ["sa-l03-o1", "sa-l03-o2"], [
        mcq("What does the clock speed of a CPU measure?",
            "How many fetch–decode–execute cycles it carries out each second",
            ["How many cores it has",
             "How much data its cache can hold",
             "How many programs it can run at once"],
            fb="Cycles per second, measured in hertz."),
        num("A CPU has a clock speed of 3.2 GHz. How many cycles does it carry out each "
            "second? Give your answer in cycles.",
            3200000000, working="3.2 * 1000000000", unit="cycles",
            fb="1 GHz is a billion cycles a second, so 3.2 GHz is 3,200,000,000.",
            hint="How many cycles per second is one gigahertz?",
            diff="apply"),
        num("A CPU completes 2,400,000,000 cycles each second. State its clock speed in GHz.",
            2.4, working="2400000000 / 1000000000", unit="GHz",
            fb="Divide by a billion: 2.4 GHz.",
            diff="apply"),
        written("Explain why a 4.0 GHz processor will usually run a single program faster "
                "than a 2.0 GHz processor of the same design.", 2,
                [mp("a higher clock speed means more cycles each second",
                    ["more|higher|greater|twice|double", "cycle"],
                    exemplar="4.0 GHz carries out twice as many cycles per second."),
                 mp("so more instructions are fetched, decoded and executed in the same time",
                    ["more|greater|twice|double", "instruction"],
                    developed=True,
                    exemplar="This means more instructions are executed each second, so the "
                             "program finishes sooner.")],
                example="A clock speed of 4.0 GHz means twice as many fetch–decode–"
                        "execute cycles every second, so twice as many instructions are "
                        "carried out in the same time and the program finishes sooner.",
                paraphrase="The faster clock gives more cycles per second, which means more "
                           "instructions are processed in a given time.",
                fb="Cycles, then instructions. Saying only 'it is faster' restates the "
                   "question.",
                misc="'Faster clock speed means faster computer' earns nothing on its own; "
                     "the mark is for the mechanism.",
                diff="apply", exam=True),
    ]),

    sub("Overclocking and heat", "sa-l03-s2", ["sa-l03-o1", "sa-l03-o2"], [
        mcq("What does overclocking a CPU mean?",
            "Running it at a higher clock speed than the manufacturer intended",
            ["Adding extra cores to it", "Increasing the size of its cache",
             "Letting it run several programs at once"],
            fb="A higher clock speed than it was designed for — which is why cooling "
               "becomes the problem."),
        written("A gamer overclocks their CPU. Explain one risk they are taking.", 2,
                [mp("the CPU produces more heat",
                    ["more heat|hotter|heats up|extra heat|higher temperature|"
                     "temperature rises|more thermal|gets hot|overheat"],
                    exemplar="The processor produces more heat."),
                 mp("which can make the computer unstable or damage the CPU unless cooling "
                    "is improved",
                    ["unstable|crash|damage|destroy|burn|fail|failure|break|shorten|overheat|"
                     "throttle|slow itself"],
                    developed=True,
                    exemplar="Without better cooling it overheats, so the computer becomes "
                             "unstable or the CPU is damaged.")],
                example="Running the CPU faster than it was designed for makes it produce "
                        "more heat, so unless the cooling is improved the computer can become "
                        "unstable or the processor can be damaged.",
                paraphrase="It gets hotter, and without better cooling that can cause "
                           "crashes or permanent damage.",
                fb="Heat, then what the heat does. One without the other is one mark.",
                diff="apply", exam=True),
        tf("Overclocking always makes a computer faster, with no other effect.", False,
           fb="False. More heat is produced, and a processor that gets too hot may slow "
              "itself down or become unstable — so it can end up slower."),
    ]),

    sub("Cache size", "sa-l03-s3", ["sa-l03-o1"], [
        mcq("Why does a larger cache usually improve performance?",
            "More frequently used data and instructions are held close to the CPU, so fewer "
            "slow fetches from RAM are needed",
            ["It increases the number of cycles the CPU completes each second",
             "It lets the CPU run more programs at the same time",
             "It keeps data safe when the power is switched off"],
            fb="A bigger cache means more hits and fewer trips out to RAM.",
            diff="understand"),
        order("Put these stores in order, smallest first.",
              ["Cache", "RAM", "Solid state drive"],
              fb="Cache is measured in megabytes, RAM in gigabytes, a drive in hundreds of "
                 "gigabytes or terabytes.",
              diff="retrieve"),
        match("Match each cache level to its description.",
              [["L1", "Smallest and fastest, closest to the core"],
               ["L2", "Larger than L1 and a little slower"],
               ["L3", "Largest and slowest of the three, often shared between cores"]],
              fb="Each level up is bigger and slower than the one before it.",
              diff="understand"),
        written("Explain why making a cache larger does not keep improving performance for "
                "ever.", 2,
                [mp("most of what the CPU needs is already in a cache of a reasonable size",
                    ["already|most|already there|diminishing|little|less benefit|rarely|"
                     "enough|hit rate|already held|already stored"],
                    exemplar="Once the cache is big enough, almost everything the CPU needs "
                             "is already in it."),
                 mp("and a larger cache is more expensive and takes longer to search",
                    ["cost more|costs more|more expensive|expensive|costly|dearer"],
                    ["search|searching|look|looking|find|slower to access|takes longer"],
                    developed=True,
                    exemplar="A larger cache also costs more and takes longer to search.")],
                example="Once the cache is large enough to hold what the CPU keeps reusing, "
                        "making it bigger adds little, because almost every request is "
                        "already a hit; and a larger cache costs more and takes longer to "
                        "search, so there is a point where it stops being worth it.",
                paraphrase="Beyond a certain size nearly everything needed is already "
                           "cached, so there is little gain, and bigger caches are dearer "
                           "and slower to look through.",
                fb="Diminishing returns, plus a cost. Either cost — money or search "
                   "time — earns the second mark.",
                diff="stretch", exam=True),
    ]),

    sub("Number of cores", "sa-l03-s4", ["sa-l03-o1"], [
        mcq("What is a core?",
            "A processing unit that can fetch, decode and execute instructions on its own",
            ["A block of cache shared between processors",
             "A register that holds the next instruction",
             "A bus that carries data between the CPU and RAM"],
            fb="Each core is a processor in its own right, with its own cycle."),
        num("A quad-core CPU runs at 2.5 GHz. In theory, how many cycles are carried out "
            "across all its cores each second?",
            10000000000, working="2.5 * 1000000000 * 4", unit="cycles",
            fb="2.5 billion cycles a core, four cores: 10,000,000,000. In practice the cores "
               "are rarely all busy.",
            diff="apply"),
        written("A program takes 20 seconds on a single-core CPU. Explain why moving it to a "
                "quad-core CPU of the same clock speed may not reduce the time to 5 seconds.",
                3,
                [mp("the program has to be written to split its work between cores",
                    ["written|designed|coded|written for|supports|multi-thread|"
                     "multithread|threaded|in parallel|use more than one core|"
                     "use all the cores|use several cores|split its work"],
                    exemplar="The program has to be written to use more than one core."),
                 mp("some tasks cannot be split because one step depends on the result of "
                    "the previous one",
                    ["cannot be split|cannot split|can not be split|not be split|"
                     "not split|cannot be divided|not be divided|cannot be shared|"
                     "not be shared|impossible to split|hard to split|difficult to split|"
                     "cannot be done in parallel"],
                    ["depend|depends|sequential|in order|one after|result of|needs the"],
                    reject=[["can be split|can be divided|can be shared|"
                             "can be done in parallel|easy to split"]],
                    exemplar="Some tasks cannot be divided, because each step needs the "
                             "result of the one before."),
                 mp("so the extra cores may sit idle and the time saved is less than "
                    "expected",
                    ["idle|unused|do nothing|does nothing|doing nothing|not used|wasted|"
                     "no benefit|little benefit|less than|not four times"],
                    developed=True,
                    exemplar="So the extra cores sit idle and the saving is smaller than "
                             "four times.")],
                example="A single program only uses more than one core if it has been written "
                        "to split its work up. Some work cannot be split at all, because each "
                        "step needs the result of the step before it. So three of the four "
                        "cores may sit idle and the program takes far longer than 5 seconds.",
                paraphrase="Unless the software is designed for multiple cores it will only "
                           "use one, and parts of a task that must happen in sequence cannot "
                           "be shared out, so the other cores do nothing and the speed-up is "
                           "much smaller.",
                fb="Three separate ideas: the software, the task, the consequence.",
                hint="Think about who decides whether a second core is used, and about a "
                     "calculation whose next step needs the last answer.",
                diff="stretch", exam=True),
    ]),

    sub("Reading a specification", "sa-l03-s5", ["sa-l03-o1"], [
        written("A laptop is advertised as having a 'single core 2.5 GHz processor'. Describe "
                "what each part of that description means.", 2,
                [mp("single core: it has one processing unit",
                    ["one|single|1", "core|processing unit|processor"],
                    exemplar="Single core means it has one processing unit."),
                 mp("2.5 GHz: it carries out 2.5 billion cycles each second",
                    ["2.5 billion|2500000000|2,500,000,000|billion", "cycle|second"],
                    ["cycle", "second"],
                    exemplar="2.5 GHz means 2.5 billion cycles per second.")],
                example="Single core means the processor has one processing unit, and 2.5 GHz "
                        "means it carries out 2.5 billion fetch–decode–execute "
                        "cycles every second.",
                paraphrase="There is just one processing unit, and it completes two and a "
                           "half billion cycles a second.",
                fb="One mark for each half of the description, and each needs what it means "
                   "rather than what it says.",
                cw="describe", diff="understand", exam=True),
        mcq("Two laptops have the same clock speed and cache. One is dual-core and one is "
            "octa-core. Which will handle many applications open at once better?",
            "The octa-core laptop, because more cores can execute instructions at the same time",
            ["The dual-core laptop, because fewer cores means less heat",
             "They will be identical, because the clock speed is the same",
             "The dual-core laptop, because each core gets more cache"],
            fb="Many separate applications is exactly the case extra cores help with, because "
               "each can run on a different core.",
            diff="apply"),
    ]),

    sub("Units of speed", "sa-l03-s6", ["sa-l03-o2"], [
        match("Match each unit to the number of cycles per second it means.",
              [["1 kHz", "1 thousand"], ["1 MHz", "1 million"], ["1 GHz", "1 billion"]],
              fb="Kilo, mega, giga — the same steps of a thousand used for file sizes.",
              diff="retrieve"),
        num("A very old computer runs at 500 MHz. How many cycles is that each second?",
            500000000, working="500 * 1000000", unit="cycles",
            fb="1 MHz is a million cycles, so 500 MHz is 500,000,000.",
            diff="apply"),
        num("How many times faster is a 3 GHz CPU than a 600 MHz CPU, assuming the same "
            "design? Give your answer as a number.",
            5, working="3000 / 600", unit="times",
            fb="3 GHz is 3,000 MHz, and 3,000 ÷ 600 = 5.",
            hint="Put both speeds into the same unit first.",
            diff="apply", exam=True),
    ]),

    sub("Fastest to slowest", "sa-l03-s7", ["sa-l03-o1"], [
        order("Put these four processors in order, fastest first, assuming the same design "
              "and a program that uses every core.",
              ["Quad core, 3.0 GHz", "Dual core, 3.0 GHz", "Quad core, 1.2 GHz",
               "Single core, 1.2 GHz"],
              fb="Cores multiply the cycles available; clock speed sets how many each core "
                 "gets. Four cores at 1.2 GHz beat two at 3.0 GHz only when every core is "
                 "used, which the question says.",
              diff="stretch", exam=True),
    ]),

    # ============================================================ sa-l04
    sub("What is an embedded system?", "sa-l04-s1", ["sa-l04-o1", "sa-l04-o2"], [
        mcq("Which of these best defines an embedded system?",
            "A computer built into a larger device to carry out a dedicated function",
            ["A computer that can run any program the user installs",
             "A computer with no processor of its own",
             "A computer that is connected to the internet at all times"],
            fb="Built in, and dedicated to one job. That is what separates it from a "
               "general-purpose computer."),
        short("State what is meant by a dedicated function.",
              [mp("it does one job, or a small fixed set of jobs",
                  ["one|single|specific|particular|fixed|set|same|only"],
                  exemplar="It does one specific job.")],
              example="It carries out one particular job, rather than any program the user "
                      "chooses.",
              paraphrase="It only performs a single specific task.",
              fb="One job. A washing machine controller will never be asked to edit a "
                 "photograph.",
              cw="state"),
        multi("Which of these contain an embedded system? Tick all that apply.",
              ["A microwave oven", "A set of traffic lights", "A fitness tracker",
               "A desktop PC running Windows", "A paper notebook"],
              ["A microwave oven", "A set of traffic lights", "A fitness tracker"],
              fb="A desktop PC is general purpose: it runs whatever you install. A notebook "
                 "has no computer in it at all.",
              diff="understand"),
    ]),

    sub("Characteristics of embedded systems", "sa-l04-s2", ["sa-l04-o1"], [
        multi("Which are typical characteristics of an embedded system? Tick all that apply.",
              ["It runs one dedicated program", "It usually uses little power",
               "It is often cheap to mass produce", "It is designed to be very reliable",
               "It lets the user install new applications",
               "It always has a large colour screen"],
              ["It runs one dedicated program", "It usually uses little power",
               "It is often cheap to mass produce", "It is designed to be very reliable"],
              fb="Dedicated, low power, cheap, reliable. Installing applications is what a "
                 "general-purpose computer is for.",
              diff="understand"),
        written("Explain why an embedded system is usually designed to be very reliable.", 2,
                [mp("it is built into a device and often cannot easily be repaired or "
                    "restarted by the user",
                    ["cannot be repaired|cannot repair|cannot easily repair|cannot be fixed|"
                     "cannot fix|cannot restart|cannot be restarted|cannot be replaced|"
                     "cannot be accessed|cannot access|cannot reach|cannot be serviced|"
                     "not easy to repair|hard to repair|difficult to repair|"
                     "not be repaired|not be replaced|no way to repair"],
                    exemplar="It is built into the device, so the user cannot easily repair "
                             "or restart it."),
                 mp("and a failure may be dangerous or stop the whole device working",
                    ["danger|dangerous|unsafe|harm|injury|accident|safety"],
                    ["whole device|entire device|whole product|whole machine|whole thing|"
                     "useless|unusable|stop working|stops working|would fail|"
                     "no longer works|breaks down"],
                    developed=True,
                    exemplar="If it failed, the whole device would stop working, and in "
                             "something like a car's brakes that could be dangerous.")],
                example="An embedded system is built into the device, so a user cannot easily "
                        "repair or restart it, and if it failed the whole device would stop "
                        "working — which in something safety-critical such as anti-lock "
                        "brakes could be dangerous.",
                paraphrase="Because it is inside the product the owner cannot fix it, so a "
                           "fault would make the whole thing unusable or even unsafe.",
                fb="Two different reasons are acceptable; the second mark is for a "
                   "consequence rather than a restatement.",
                diff="apply", exam=True),
    ]),

    sub("Embedded systems everywhere", "sa-l04-s3", ["sa-l04-o2"], [
        sort("Sort each device by whether its computer is embedded or general purpose.",
             ["Embedded", "General purpose"],
             [["Smart thermostat", "Embedded"], ["Cash machine", "Embedded"],
              ["Anti-lock braking system", "Embedded"], ["Smartwatch", "Embedded"],
              ["Laptop", "General purpose"], ["Tablet", "General purpose"]],
             fb="A smartwatch is a borderline case worth thinking about: it runs apps, but "
                "it is built into one device for a fixed set of jobs, so it is normally "
                "treated as embedded.",
             diff="understand"),
        short("Give one example of an embedded system found in a car.",
              [mp("a named car system, such as engine management, anti-lock brakes or "
                  "automatic lights",
                  ["engine management|engine|brake|abs|anti-lock|antilock|light|parking|"
                   "airbag|cruise control|satnav|sat nav|climate|dashboard|reversing"],
                  exemplar="The anti-lock braking system.")],
              example="The anti-lock braking system.",
              paraphrase="Engine management.",
              fb="Any dedicated system built into the car. 'The radio' is accepted only if "
                 "you say it is built in and does one job.",
              cw="give"),
    ]),

    sub("Input, process, output", "sa-l04-s4", ["sa-l04-o3"], [
        match("A washing machine is an embedded system. Match each part to its role.",
              [["Water temperature sensor", "Input"],
               ["Microcontroller running the program", "Process"],
               ["Drum motor", "Output"]],
              fb="Sensors in, decisions in the middle, motors and lights out.",
              diff="understand"),
        written("A smart thermostat keeps a room at 20°C. Describe how it uses input, "
                "process and output to do this.", 3,
                [mp("input: a temperature sensor measures the room",
                    ["sensor|thermometer|thermistor|measure|reads|detects", "temperature|room"],
                    exemplar="A temperature sensor measures how warm the room is."),
                 mp("process: the system compares the reading with the target temperature",
                    ["compare|compares|checks|works out|decides|if|less than|below|against"],
                    exemplar="It compares that reading with the target of 20 degrees."),
                 mp("output: it switches the heating on or off",
                    ["switch|turns|sends|activates|starts|stops|opens|on|off",
                     "heat|heating|boiler|radiator|valve"],
                    exemplar="It switches the heating on if the room is too cold.")],
                example="A temperature sensor measures the room, which is the input. The "
                        "microcontroller compares that reading with the target of 20°C, "
                        "which is the process. If the room is colder it switches the heating "
                        "on, which is the output.",
                paraphrase="It reads the room temperature with a sensor, decides whether that "
                           "is below the set value, and turns the boiler on or off "
                           "accordingly.",
                fb="One mark each, and each needs the actual thing — 'input' on its own "
                   "is not a sensor.",
                cw="describe", diff="apply", exam=True),
        mcq("In a set of traffic lights, which of these is the output?",
            "The coloured lamps that change",
            ["The pressure sensor in the road", "The timer inside the controller",
             "The program stored in the controller"],
            fb="Lamps change state, so they are the output. The sensor is an input and the "
               "timer and the program are part of the processing.",
            diff="apply"),
    ]),

    sub("Programming embedded systems", "sa-l04-s5", ["sa-l04-o1"], [
        mcq("The program inside an embedded system, stored permanently in the device, is "
            "usually called:",
            "firmware", ["an operating system", "a utility", "a device driver"],
            fb="Firmware. Some of it can be updated, which is what a smart TV software "
               "update is doing."),
        written("Embedded systems are often programmed in a low-level language such as C "
                "rather than in Python. Explain one reason why.", 2,
                [mp("a low-level language runs faster or uses less memory",
                    [FASTER + "|less memory|smaller|efficient|efficiency|less space|less "
                     "power|close to the hardware|fewer instructions"],
                    exemplar="C runs faster and uses less memory."),
                 mp("which matters because an embedded system has limited resources or must "
                    "respond in real time",
                    ["limited|little|small|low|few|only|constrained|cheap",
                     "memory|power|processor|resource|hardware|space|ram"],
                    ["real time|real-time|immediately|quickly enough|straight away|"
                     "respond in time|deadline"],
                    developed=True,
                    exemplar="This matters because the device has very little memory and has "
                             "to respond in real time.")],
                example="C compiles to code that runs faster and needs less memory, which "
                        "matters because an embedded system has very limited memory and "
                        "processing power and often has to respond in real time.",
                paraphrase="Low-level code is more efficient, which matters because these "
                           "devices have hardly any memory or processing power and must "
                           "react immediately.",
                fb="Efficiency, then why efficiency matters here. The second mark is the one "
                   "about this kind of device.",
                diff="stretch", exam=True),
    ]),

    sub("Embedded or general purpose?", "sa-l04-s6", ["sa-l04-o1"], [
        written("Compare an embedded system with a general-purpose computer.", 4,
                [mp("an embedded system has a dedicated function; a general-purpose computer "
                    "runs many different programs",
                    ["dedicated|one|single|specific|fixed",
                     "many|any|different|various|several|lots|whatever|anything|"
                     "all sorts|a range|multiple"],
                    exemplar="An embedded system does one dedicated job, while a "
                             "general-purpose computer can run many different programs."),
                 mp("an embedded system is built into a larger device; a general-purpose "
                    "computer is a device in its own right",
                    ["built in|built into|inside|part of|within|integrated"],
                    exemplar="An embedded system is built into a larger device."),
                 mp("an embedded system usually has limited memory, power and processing; a "
                    "general-purpose computer has far more",
                    ["limited|less|little|small|low|fewer|minimal",
                     "memory|power|processing|resource|storage|ram"],
                    exemplar="An embedded system has much less memory and processing power."),
                 mp("so an embedded system is cheaper and more reliable, but cannot be "
                    "repurposed",
                    ["cheap|cheaper|low cost|less expensive|reliable|reliability|efficient|"
                     "less power"],
                    developed=True,
                    exemplar="This means an embedded system is cheaper and more reliable, but "
                             "it cannot be given a different job.")],
                example="An embedded system carries out one dedicated function and is built "
                        "into a larger device, while a general-purpose computer is a device in "
                        "its own right that can run any program installed on it. The embedded "
                        "system has far less memory and processing power. That makes it "
                        "cheaper and more reliable, but it cannot be repurposed, whereas a "
                        "laptop can be given an entirely new job just by installing software.",
                paraphrase="One is dedicated to a single task and built inside another "
                           "product; the other is a standalone machine that runs whatever "
                           "software you install. The dedicated one has much smaller "
                           "resources, which makes it cheap and dependable but impossible to "
                           "reuse for something else.",
                fb="A comparison needs both sides of each point. Four separate differences, "
                   "with the last one drawing a consequence.",
                cw="compare", diff="stretch", exam=True),
        mcq("A smart TV runs apps the owner can install, but it is built into one device for "
            "watching television. Why is it a difficult case to classify?",
            "It has a dedicated purpose like an embedded system, but can run new programs "
            "like a general-purpose computer",
            ["It has no processor, so neither definition applies",
             "It is only an embedded system while it is connected to the internet",
             "It cannot be classified until its firmware is updated"],
            fb="Some modern devices genuinely sit between the two definitions, and an exam "
               "answer should say which features point each way.",
            diff="stretch"),
    ]),

    sub("Spot the embedded system", "sa-l04-s7", ["sa-l04-o2"], [
        sort("A school is listing the computers in one classroom. Sort each one.",
             ["Embedded", "General purpose"],
             [["The interactive whiteboard's own controller", "Embedded"],
              ["The digital clock on the wall", "Embedded"],
              ["The air conditioning unit's controller", "Embedded"],
              ["A pupil's laptop", "General purpose"],
              ["The teacher's desktop PC", "General purpose"]],
             fb="If the device does one job and you cannot install anything on it, it is "
                "embedded.",
             diff="apply"),
        codeout("An embedded controller runs this program on a loop. The water temperature "
                "sensor reads 38. What does the controller print?",
                "temperature = 38\n"
                "target = 40\n"
                "if temperature < target:\n"
                "    print('HEATER ON')\n"
                "else:\n"
                "    print('HEATER OFF')",
                "HEATER ON",
                fb="38 is less than 40, so the condition is true and the heater is switched "
                   "on. This is input, process, output in three lines.",
                diff="apply"),
    ]),
]
