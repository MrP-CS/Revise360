"""2.1 Algorithms: the revision bank.

The topic that is examined by making learners DO something rather than recall
it, so most of this is tracing, counting comparisons and reading pseudocode.
Every trace table here is checked against its own program by tools/revverify.py,
which runs the code with a line tracer: a table that drifts from the code beside
it is a question nobody can answer.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written, extended,
                    num, step, codeout, trace, sub, mp)

TOPIC = "2.1"

BANK = [

    # ============================================================ al-l01
    sub("Abstraction", "al-l01-s2", ["al-l01-o1", "al-l01-o3"], [
        short("State what is meant by abstraction.",
              [mp("removing unnecessary detail to leave only what matters",
                  ["remove|removing|ignore|ignoring|leave out|leaving out|hide|hiding|"
                   "strip|get rid of|take away|filter out",
                   "detail|details|information|features|parts|anything|aspects|workings"],
                  exemplar="Removing unnecessary detail from a problem.")],
              example="Removing the details that do not matter, so that only the important "
                      "features of the problem are left.",
              paraphrase="Stripping out information that is not relevant and keeping only "
                         "what is needed.",
              fb="Removing detail. Saying only 'making something simpler' does not say how.",
              cw="state"),
        mcq("A London Underground map shows the order of the stations but not the real "
            "distances between them. Which idea does this illustrate?",
            "Abstraction", ["Decomposition", "Iteration", "Validation"],
            fb="The real distances are detail a traveller does not need, so they are left "
               "out.",
            diff="understand"),
        written("A programmer is writing a game where a car drives round a track. Explain "
                "how abstraction helps them.", 2,
                [mp("they leave out detail the game does not need",
                    ["leave out|ignore|ignoring|remove|not include|do not need|does not need|unnecessary|"
                     "irrelevant|not model|does not model|not affect"],
                    exemplar="They leave out detail the game does not need, such as how the "
                             "engine works internally."),
                 mp("so the program is simpler, quicker to write and faster to run",
                    ["simpler|easier|quicker|faster|less code|less work|less to program|smaller|"
                     "less memory|less processing"],
                    developed=True,
                    exemplar="This means the program is simpler and quicker to write.")],
                example="They only model the things that affect the game, such as speed and "
                        "steering, and leave out detail like how the engine works or what the "
                        "paint is made of, which makes the program much simpler to write and "
                        "faster to run.",
                paraphrase="They ignore anything that does not affect play, such as the "
                           "internal workings of the engine, so there is far less to "
                           "program and the game runs more quickly.",
                fb="What is left out, then what leaving it out buys.",
                diff="apply", exam=True),
    ]),

    sub("Decomposition", "al-l02-s1", ["al-l02-o1", "al-l02-o2"], [
        short("State what is meant by decomposition.",
              [mp("breaking a problem down into smaller problems",
                  ["break|breaking|split|splitting|divide|dividing|separate",
                   "smaller|sub|parts|pieces|chunks|steps|tasks|problems"],
                  exemplar="Breaking a problem down into smaller problems.")],
              example="Breaking a large problem down into smaller sub-problems that are "
                      "easier to solve.",
              paraphrase="Splitting a big problem into smaller parts.",
              fb="Break it into smaller pieces. Abstraction removes detail; decomposition "
                 "divides the work.", cw="state"),
        multi("Which of these are advantages of decomposing a programming problem? Tick all "
              "that apply.",
              ["Each part is easier to understand and to solve",
               "Different programmers can work on different parts at the same time",
               "A part can be tested on its own",
               "The finished program will always run faster",
               "Less code has to be written in total"],
              ["Each part is easier to understand and to solve",
               "Different programmers can work on different parts at the same time",
               "A part can be tested on its own"],
              fb="Decomposition makes a problem manageable. It does not make the program "
                 "faster or shorter.",
              diff="understand"),
        written("Explain why decomposition makes a large program easier to test.", 2,
                [mp("each part can be tested separately",
                    ["each part|each piece|every piece|every part|each section|each module|individually|"
                     "separately|independently|in isolation|on its own|one at a time|each sub"],
                    exemplar="Each part can be tested separately."),
                 mp("so a fault can be traced to the part it is in, rather than searched "
                    "for in the whole program",
                    ["find|found|locate|trace|traced|narrow|narrowed|identify|know where|know the part|pinpoint|pinned down|pin down|isolate"],
                    developed=True,
                    exemplar="So when a fault appears you know the part it is in.")],
                example="Each sub-problem is solved by its own section of code, which can be "
                        "tested on its own, so when something goes wrong the fault can be "
                        "traced to one small part instead of being hunted for across the "
                        "whole program.",
                paraphrase="Since every piece can be checked independently, a bug can be "
                           "pinned down to a single section rather than searched for "
                           "throughout the entire program.",
                fb="Tested separately, therefore faults are findable.",
                diff="apply", exam=True),
    ]),

    # ============================================================ al-l03
    sub("Inputs, processes and outputs", "al-l03-s3", ["al-l03-o2"], [
        match("A program works out a pupil's average mark from three test scores and "
              "prints a grade. Match each item to what it is.",
              [["The three test scores typed in", "Input"],
               ["Adding the scores and dividing by three", "Process"],
               ["The grade shown on screen", "Output"]],
              fb="Input comes in, process happens in the middle, output goes out.",
              diff="understand"),
        short("State what is meant by an algorithm.",
              [mp("a set of steps, in order, that solves a problem",
                  ["step|steps|instruction|instructions|rules|sequence|procedure",
                   "solve|solves|problem|task|produce|achieve|complete|carry out|order"],
                  exemplar="A set of steps, in order, that solves a problem.")],
              example="A sequence of steps that solves a problem or completes a task.",
              paraphrase="An ordered list of instructions for carrying out a task.",
              fb="Steps AND a purpose. A list of instructions that does nothing in "
                 "particular is not an algorithm.", cw="state"),
    ]),

    # ============================================================ al-l04
    sub("Flowchart symbols", "al-l04-s1", ["al-l04-o1", "al-l04-o2"], [
        match("Match each flowchart symbol to what it is used for.",
              [["Oval", "The start or the end of the algorithm"],
               ["Parallelogram", "Input or output"],
               ["Rectangle", "A process, such as a calculation"],
               ["Diamond", "A decision, with two routes out"],
               ["Arrow", "The order the steps are carried out in"]],
              fb="The diamond is the one with two ways out, which is what makes it a "
                 "decision.",
              diff="retrieve"),
        mcq("A flowchart has an arrow going back from a decision to an earlier step. What "
            "does this show?",
            "A loop", ["A subroutine call", "An input", "A syntax error"],
            fb="An arrow going backwards is iteration: the steps between will run again.",
            diff="understand"),
    ]),

    # ============================================================ al-l05
    sub("Pseudocode", "al-l05-s1", ["al-l05-o1", "al-l05-o2"], [
        written("Explain one advantage of writing an algorithm in pseudocode rather than in "
                "a programming language.", 2,
                [mp("pseudocode does not have to follow the rules of any one language",
                    ["no syntax|not syntax|any language|no particular language|not tied to|not specific to|"
                     "not a real language|no rules|without worrying about|independent of|"
                     "no specific language|language independent|one language"],
                    exemplar="Pseudocode does not have to follow the syntax rules of any "
                             "particular language."),
                 mp("so the programmer can concentrate on the logic, and anyone can read it",
                    ["logic|steps|idea|design|how it works|what it does"],
                    ["anyone|any programmer|easier to read|understood by|read by"],
                    developed=True,
                    exemplar="This means the programmer can concentrate on the logic rather "
                             "than on the syntax.")],
                example="Pseudocode does not have to obey the syntax rules of any particular "
                        "language, so the programmer can concentrate on getting the logic "
                        "right, and a programmer who uses a different language can still "
                        "read it.",
                paraphrase="Because it is not tied to one language's rules, the person "
                           "writing it can think about the steps rather than the punctuation, "
                           "and someone working in another language can follow it.",
                fb="No syntax to obey, therefore attention on the logic.",
                diff="understand", exam=True),
        codeout("What does this OCR reference language program output?",
                "total = 0\n"
                "for i in range(1, 5):\n"
                "    total = total + i\n"
                "print(total)",
                "10",
                fb="1 + 2 + 3 + 4 = 10. The loop stops before 5, which is the trap.",
                hint="Which values does the loop actually take?",
                misc="Expecting 15 means counting 5 as well. range(1, 5) stops at 4.",
                diff="apply"),
    ]),

    # ============================================================ al-l06
    sub("Linear search", "al-l06-s1", ["al-l06-o1", "al-l06-o2"], [
        order("Put the steps of a linear search in order.",
              ["Start at the first item in the list",
               "Compare the item with the one being searched for",
               "If it does not match, move to the next item",
               "Stop when it is found or the end of the list is reached"],
              fb="Start, compare, move on, stop. There is nothing cleverer to it, which is "
                 "both its weakness and its strength.",
              diff="understand"),
        num("A linear search looks for the value 19 in the list "
            "[4, 8, 11, 15, 19, 23, 42]. How many comparisons does it make?", 5,
            working="5", unit="comparisons",
            fb="It checks 4, 8, 11, 15 and then 19: five comparisons.",
            diff="apply"),
        num("In the worst case, how many comparisons does a linear search of a list of 40 "
            "items make?", 40, working="40", unit="comparisons",
            fb="The worst case is the item being last, or not there at all, so every item "
               "is checked.",
            diff="understand"),
        written("Give one advantage of a linear search over a binary search.", 2,
                [mp("the list does not have to be in order",
                    ["does not have to be sorted|does not need to be sorted|does not require|"
                     "not have to be in order|need not be sorted|not need sorting|unsorted|"
                     "in any order|no need to sort|without sorting|not sorted|no sorting"],
                    exemplar="The list does not have to be in order."),
                 mp("so it can be used on data that cannot be sorted or is not worth "
                    "sorting",
                    ["cannot be sorted|not worth sorting|no need to sort|save|saves|"
                     "sorting takes|any list|unsorted data|straight away|immediately|rather than sorting|before sorting|without sorting first"],
                    developed=True,
                    exemplar="So it can be used straight away on an unsorted list, without "
                             "the cost of sorting it first.")],
                example="A linear search works on a list in any order, while a binary search "
                        "needs a sorted one, so a linear search can be used straight away "
                        "without paying the cost of sorting the list first.",
                paraphrase="It does not require the data to be sorted, which means it can be "
                           "run immediately on an unordered list rather than sorting it "
                           "beforehand.",
                fb="No ordering needed, and then why that is worth something.",
                cw="give", diff="apply", exam=True),
    ]),

    # ============================================================ al-l07
    sub("Binary search", "al-l07-s1", ["al-l07-o1", "al-l07-o2", "al-l07-o3"], [
        short("State the one condition a list must meet for a binary search to work.",
              [mp("the list must be in order",
                  ["sorted|in order|ordered|ascending|descending|arranged"],
                  reject=[["wrong order|not in order|unsorted"]],
                  exemplar="The list must be sorted into order.")],
              example="The list must be sorted into order.",
              paraphrase="It has to be in order first.",
              fb="Sorted. Everything else about binary search follows from this.",
              cw="state"),
        order("Put the steps of a binary search in order.",
              ["Find the middle item of the list",
               "Compare it with the item being searched for",
               "Discard the half that cannot contain the item",
               "Repeat on the half that remains"],
              fb="Middle, compare, discard half, repeat. Each step halves what is left.",
              diff="understand"),
        num("A binary search is used on a sorted list of 8 items. In the worst case, how "
            "many comparisons are needed?", 3, working="3", unit="comparisons",
            fb="8 halves to 4, then 2, then 1: three comparisons.",
            hint="How many times can you halve 8 before one item is left?",
            diff="apply"),
        num("A binary search is used on a sorted list of 1,000 items. Roughly how many "
            "comparisons are needed in the worst case?", 10, working="10",
            unit="comparisons", tolerance=0,
            fb="Each comparison halves the list: 1000, 500, 250, 125, 63, 32, 16, 8, 4, 2, "
               "1. Ten comparisons. A linear search would need up to a thousand.",
            hint="Keep halving 1,000 and count how many times you can do it.",
            diff="stretch", exam=True),
        written("Explain why a binary search is much faster than a linear search on a large "
                "sorted list.", 3,
                [mp("a binary search discards half the remaining list at every step",
                    ["half|halve|halves|halving|50%"],
                    exemplar="Each comparison discards half of what is left."),
                 mp("a linear search checks one item at a time",
                    ["one at a time|one by one|each item|every item|each one|"
                     "item by item|one item|single item|a single"],
                    exemplar="A linear search checks one item at a time."),
                 mp("so the number of comparisons grows far more slowly as the list grows",
                    ["fewer comparisons|far fewer|many fewer|grows slowly|grows enormously|gap grows|far more slowly|"
                     "much more slowly|does not grow|much less|10|ten|hardly increases"],
                    developed=True,
                    exemplar="So as the list gets bigger the binary search needs far fewer "
                             "comparisons.")],
                example="A binary search throws away half of what remains at every "
                        "comparison, while a linear search can only eliminate one item at a "
                        "time. That means doubling the size of the list adds one comparison "
                        "to a binary search and doubles the work for a linear search, so the "
                        "gap grows enormously on a large list.",
                paraphrase="Every check in a binary search eliminates half the remaining "
                           "data, whereas a linear search removes a single item, which means "
                           "the number of comparisons rises far more slowly as the list "
                           "grows.",
                fb="Three ideas: what binary does, what linear does, and what that means as "
                   "the list grows.",
                diff="apply", exam=True),
    ]),

    # ============================================================ al-l08
    sub("Bubble sort", "al-l08-s2", ["al-l08-o1", "al-l08-o2"], [
        mcq("The list [5, 3, 8, 1] is sorted with a bubble sort. What is the list after the "
            "first complete pass?",
            "3, 5, 1, 8", ["3, 1, 5, 8", "1, 3, 5, 8", "5, 3, 1, 8"],
            fb="Compare 5 and 3 and swap; 5 and 8, no swap; 8 and 1 and swap. The largest "
               "value has bubbled to the end.",
            hint="Compare each adjacent pair in turn, left to right, swapping when they are "
                 "the wrong way round.",
            diff="apply", exam=True),
        num("How many comparisons are made in the first pass of a bubble sort on a list of "
            "6 items?", 5, working="6 - 1", unit="comparisons",
            fb="Each pass compares every adjacent pair, so a list of 6 gives 5 pairs.",
            diff="apply"),
        written("Explain why a bubble sort is slow on a large list.", 2,
                [mp("it compares every adjacent pair on every pass",
                    ["every pair|each pair|adjacent|neighbouring|next to each other|all the pairs|every item|"
                     "compares every"],
                    exemplar="It compares every adjacent pair on every pass."),
                 mp("and many passes are needed, so the number of comparisons grows very "
                    "quickly as the list grows",
                    ["many passes|lots of passes|many sweeps|lot of sweeps|lots of sweeps|several sweeps|"
                     "repeat|repeated|again and again|several passes|number of comparisons|grows"],
                    developed=True,
                    exemplar="Many passes are needed, so the number of comparisons grows "
                             "very quickly as the list gets longer.")],
                example="A bubble sort compares every adjacent pair on every pass, and it "
                        "needs many passes before the list is sorted, so the total number of "
                        "comparisons grows very quickly as the list gets longer.",
                paraphrase="Each sweep checks all the neighbouring pairs, and a lot of sweeps "
                           "are required, which means the work rises sharply with the size "
                           "of the list.",
                fb="Every pair, every pass, many passes.",
                diff="apply", exam=True),
        short("Give one advantage of a bubble sort.",
              [mp("it is simple to understand and to program",
                  ["simple|easy|straightforward|easiest|simplest",
                   "understand|program|write|code|implement|explain"],
                  ["little memory|less memory|no extra memory|in place"],
                  exemplar="It is simple to understand and to program.")],
              example="It is very simple to understand and to write.",
              paraphrase="It is the easiest of the sorts to code.",
              fb="Simplicity, or the small amount of memory it uses. Not speed.",
              cw="give"),
    ]),

    sub("Comparing the sorts", "al-l09-s5", ["al-l09-o3"], [
        sort("Sort each statement by the algorithm it describes best.",
             ["Bubble sort", "Merge sort", "Insertion sort"],
             [["Simplest to write, and slowest on a large list", "Bubble sort"],
              ["Splits the list in half repeatedly, then merges the pieces back", "Merge sort"],
              ["Fastest of the three on a large list", "Merge sort"],
              ["Builds a sorted section at the start of the list, one item at a time",
               "Insertion sort"],
              ["Needs extra memory to hold the sub-lists", "Merge sort"],
              ["Efficient on a list that is already nearly sorted", "Insertion sort"]],
             fb="Merge sort buys its speed with memory. Insertion sort is the one that "
                "rewards a list that is nearly in order already.",
             diff="apply"),
        order("Put the stages of a merge sort in order.",
              ["Split the list in half, repeatedly, until every list has one item",
               "Compare the first items of two lists",
               "Merge the two lists into one sorted list",
               "Repeat the merging until one sorted list remains"],
              fb="Split all the way down first, then merge all the way back up.",
              diff="understand"),
        written("Explain why a merge sort needs more memory than a bubble sort.", 2,
                [mp("a merge sort creates new sub-lists as it splits and merges",
                    ["new list|new lists|sub list|sublist|sublists|copies|extra lists|smaller lists|"
                     "separate lists|another list|temporary|merged results"],
                    exemplar="A merge sort creates new sub-lists as it splits the list up."),
                 mp("while a bubble sort swaps items inside the original list",
                    ["same list|original list|in place|within the list|inside the list|"
                     "no extra memory|no extra space|list it was given"],
                    exemplar="A bubble sort just swaps items inside the original list.")],
                example="A merge sort splits the list into sub-lists and then builds new "
                        "merged lists, all of which have to be held in memory, whereas a "
                        "bubble sort only ever swaps items around inside the original list.",
                paraphrase="The merge method has to store the smaller lists it creates and "
                           "the merged results, while the bubble method rearranges items "
                           "within the list it was given.",
                fb="New lists against swapping in place.",
                diff="stretch", exam=True),
    ]),

    # ============================================================ al-l10
    sub("Syntax and logic errors", "al-l10-s3", ["al-l10-o1", "al-l10-o2", "al-l10-o3"], [
        sort("Sort each mistake by the kind of error it is.",
             ["Syntax error", "Logic error"],
             [["A missing closing bracket", "Syntax error"],
              ["print spelled as prnt", "Syntax error"],
              ["A missing colon at the end of an if line", "Syntax error"],
              ["Using + where − was meant", "Logic error"],
              ["A loop that runs one time too many", "Logic error"],
              ["Dividing by the wrong variable", "Logic error"]],
             fb="A syntax error stops the program running at all. A logic error lets it run "
                "and gives the wrong answer.",
             diff="understand"),
        written("Explain the difference between a syntax error and a logic error.", 3,
                [mp("a syntax error breaks the rules of the language",
                    ["syntax", "rule|rules|grammar|spelling|punctuation|structure"],
                    exemplar="A syntax error breaks the rules of the language."),
                 mp("so the program will not run at all",
                    ["will not run|cannot run|does not run|refuses to run|"
                     "stops|fails to run|crash|will not compile|error message"],
                    exemplar="This means the program will not run at all."),
                 mp("a logic error lets the program run but produces the wrong result",
                    ["logic", "run|runs"],
                    ["wrong|incorrect|unexpected|not what|different"],
                    exemplar="A logic error lets the program run but gives the wrong "
                             "result.")],
                example="A syntax error breaks the rules of the language, such as a missing "
                        "bracket, so the program will not run at all. A logic error does not "
                        "break any rule, so the program runs perfectly happily, but the "
                        "instructions do not do what the programmer intended and the output "
                        "is wrong.",
                paraphrase="A syntax error is a breach of the language's grammar and stops "
                           "the code executing. A logic error obeys the grammar, so the "
                           "code runs, but it gives an answer that is not the one wanted.",
                fb="Three ideas: what a syntax error is, what it does, and what a logic error "
                   "does instead.",
                cw="compare", diff="apply", exam=True),
        codeout("This program is meant to print the average of the three numbers. What does "
                "it actually print?",
                "a = 4\n"
                "b = 6\n"
                "c = 8\n"
                "print(a + b + c / 3)",
                "12.666666666666666",
                also=["12.67", "12.666666666666668", "12.666666666666666"],
                fb="Division happens before addition, so only c is divided by 3: "
                   "4 + 6 + 2.666... The brackets are missing. This is a logic error, not a "
                   "syntax error — the program runs quite happily.",
                hint="Which operation does Python do first?",
                misc="Expecting 6 assumes the brackets are there.",
                diff="stretch", exam=True),
    ]),

    # ============================================================ al-l11
    sub("Trace tables", "al-l11-s2", ["al-l11-o1", "al-l11-o3"], [
        short("State what a trace table is used for.",
              [mp("to record the value of each variable as a program runs, so a fault can "
                  "be found",
                  ["value|values|contents",
                   "variable|variables"],
                  ["step through|line by line|each step|as it runs|track|follow"],
                  exemplar="To record the value of each variable as the program runs.")],
              example="To record the value of every variable at each step of a program, so "
                      "that a fault can be found by seeing where a value first goes wrong.",
              paraphrase="It tracks what each variable holds line by line while the program "
                         "executes.",
              fb="Variable values, step by step. The point of it is finding where a value "
                 "first becomes wrong.", cw="state"),
        trace("Complete the trace table for this program, which adds up the numbers 1 to 3.",
              "count = 0\n"
              "total = 0\n"
              "while count < 3:\n"
              "    count = count + 1\n"
              "    total = total + count\n"
              "print(total)",
              ["count", "total"],
              [["0", "0"], ["1", ""], ["2", ""], ["3", ""]],
              [["0", "0"], ["1", "1"], ["2", "3"], ["3", "6"]],
              fb="The total is a running sum: 1, then 1 + 2 = 3, then 3 + 3 = 6.",
              hint="Fill in one row for each time round the loop, after both lines inside "
                   "it have run.",
              diff="apply", exam=True),
        trace("Complete the trace table for this program, which counts how many times 20 "
              "can be halved.",
              "n = 20\n"
              "steps = 0\n"
              "while n > 1:\n"
              "    n = n // 2\n"
              "    steps = steps + 1\n"
              "print(steps)",
              ["n", "steps"],
              [["20", "0"], ["", "1"], ["", "2"], ["", ""], ["", ""]],
              [["20", "0"], ["10", "1"], ["5", "2"], ["2", "3"], ["1", "4"]],
              fb="Integer division halves and rounds down: 20, 10, 5, 2, 1. Four steps — "
                 "which is how a binary search behaves on twenty items.",
              hint="// throws away the remainder, so 5 // 2 is 2, not 2.5.",
              diff="stretch", exam=True),
        codeout("What does this program print when it is run on the list shown?",
                "nums = [3, 7, 2, 9]\n"
                "big = nums[0]\n"
                "for n in nums:\n"
                "    if n > big:\n"
                "        big = n\n"
                "print(big)",
                "9",
                fb="The variable big holds the largest value found so far, and ends at 9.",
                diff="apply"),
        codeout("What does this program print for the word shown?",
                "word = 'computer'\n"
                "out = ''\n"
                "for i in range(len(word) - 1, -1, -1):\n"
                "    out = out + word[i]\n"
                "print(out)",
                "retupmoc",
                fb="The loop runs backwards through the string, building it up in reverse.",
                hint="Which index does the loop start at, and which way does it go?",
                diff="stretch"),
    ]),
]
