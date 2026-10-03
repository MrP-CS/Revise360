"""2.2 Programming fundamentals: the revision bank.

This topic is examined by making learners read code and say what it does, so
most of this is code output and tracing, with written questions only where the
specification really asks for an explanation - what casting is for, why a local
variable is preferred to a global one, why a file has to be closed.

The programs are all run by tools/revverify.py, so the stated output is what
Python actually prints, not what the author believed it would.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written,
                    num, codeout, trace, sub, mp)

TOPIC = "2.2"

BANK = [

    # ============================================================ pf-l01
    sub("Variables and constants", "pf-l01-s1", ["pf-l01-o1"], [
        short("State the difference between a variable and a constant.",
              [mp("a variable's value can change while the program runs; a constant's "
                  "cannot",
                  ["variable", "change|changes|changed|vary|varies|altered|different"],
                  ["constant", "cannot change|does not change|stays|same|fixed|"
                   "never changes|unchanged"],
                  exemplar="A variable's value can change while the program runs; a "
                           "constant's cannot.")],
              example="A variable can hold a different value at different points while the "
                      "program runs, whereas a constant keeps the same value throughout.",
              paraphrase="The value held in a variable may be altered as the program "
                         "executes, while a constant stays fixed.",
              fb="Both halves. Saying only 'a constant never changes' leaves out what a "
                 "variable does.", cw="state"),
        mcq("Why would a programmer use a constant for the rate of VAT rather than typing "
            "the number in several places?",
            "If the rate changes, only one line has to be edited",
            ["Constants are processed faster than numbers",
             "A constant uses less memory than a number",
             "Numbers cannot be used in calculations directly"],
            fb="One place to change, and no risk of missing one of them.",
            diff="understand"),
        match("Match each programming construct to what it does to the order a program "
              "runs in.",
              [["Sequence", "Each line is carried out one after the other"],
               ["Selection", "A choice is made, and only one route is taken"],
               ["Iteration", "A block of code is repeated"]],
              fb="Sequence, selection, iteration — every program is built from these "
                 "three.",
              diff="retrieve"),
    ]),

    # ============================================================ pf-l02
    sub("Data types", "pf-l02-s1", ["pf-l02-o1"], [
        match("Match each value to its data type.",
              [["17", "Integer"], ["3.5", "Real"], ["True", "Boolean"],
               ["'k'", "Character"], ["'Revise 360'", "String"]],
              fb="A character is one symbol; a string is any number of them, including one.",
              diff="retrieve"),
        mcq("Which data type should be used for a variable holding the number of pupils in "
            "a class?",
            "Integer", ["Real", "String", "Boolean"],
            fb="A whole number that will be counted and compared. Storing it as a string "
               "would stop it being used in arithmetic."),
        written("Explain why a program has to cast the result of an input before using it in "
                "a calculation.", 2,
                [mp("input is received as a string",
                    ["input|entered|typed|read",
                     "string|text|characters|str"],
                    exemplar="Whatever is typed in is received as a string."),
                 mp("so it has to be converted to a number before arithmetic will work",
                    ["integer|int|real|float|number|numeric"],
                    ["convert|converted|cast|change|changed|turn|turned"],
                    exemplar="It has to be converted to an integer before it can be used in "
                             "a calculation.")],
                example="Anything typed in arrives as a string, even when it looks like a "
                        "number, so it has to be cast to an integer or a real before it can "
                        "be used in arithmetic — otherwise adding two inputs would join "
                        "them end to end instead of adding them.",
                paraphrase="Keyboard input always comes back as text, which means it must be "
                           "converted into a numeric type before any sum will work on it.",
                fb="What input gives you, and what it has to become.",
                diff="understand", exam=True),
        codeout("What does this program print, and why is it not 9?",
                "a = '4'\n"
                "b = '5'\n"
                "print(a + b)",
                "45",
                fb="Both values are strings, so + joins them rather than adding them. This "
                   "is exactly what casting is for.",
                misc="Expecting 9 assumes they are numbers. The quotation marks say "
                     "otherwise.",
                diff="apply", exam=True),
    ]),

    sub("Arithmetic operators", "pf-l02-s4", ["pf-l02-o3"], [
        match("Match each operator to what it gives.",
              [["7 / 2", "3.5"], ["7 // 2", "3"], ["7 % 2", "1"], ["7 ** 2", "49"]],
              fb="// is whole-number division and % is the remainder. ** is to the power of.",
              diff="understand"),
        num("What is the result of 17 MOD 5?", 2, working="17 % 5",
            fb="17 ÷ 5 is 3 remainder 2, and MOD gives the remainder."),
        num("What is the result of 17 DIV 5?", 3, working="17 // 5",
            fb="DIV gives the whole number of times 5 goes into 17, throwing the remainder "
               "away."),
        codeout("What does this program print when 23 items are packed into boxes of six?",
                "total = 23\n"
                "boxes = total // 6\n"
                "left = total % 6\n"
                "print(boxes, left)",
                "3 5",
                fb="23 ÷ 6 is 3 remainder 5, so three full boxes with five left over. "
                   "This pair of operators is how a program packs things into boxes.",
                diff="apply"),
        mcq("A program must work out how many full minutes are in 200 seconds. Which "
            "expression gives the answer?",
            "200 DIV 60", ["200 MOD 60", "200 / 60", "60 DIV 200"],
            fb="DIV gives whole minutes; MOD would give the seconds left over.",
            diff="apply"),
    ]),

    sub("Comparison and Boolean operators", "pf-l02-s5", ["pf-l02-o3"], [
        mcq("Which comparison operator means 'is not equal to'?",
            "!=", ["==", "=", ">="],
            fb="A single = assigns a value; == compares; != compares for difference."),
        codeout("What does this program print for a 15-year-old member?",
                "age = 15\n"
                "member = True\n"
                "if age >= 16 or member:\n"
                "    print('Allowed')\n"
                "else:\n"
                "    print('Refused')",
                "Allowed",
                fb="The age test fails but member is True, and or needs only one side to be "
                   "true.",
                diff="apply"),
        codeout("What does this program print for a score of 48?",
                "score = 48\n"
                "if score > 70:\n"
                "    print('Distinction')\n"
                "elif score > 50:\n"
                "    print('Merit')\n"
                "elif score > 40:\n"
                "    print('Pass')\n"
                "else:\n"
                "    print('Fail')",
                "Pass",
                fb="The first two tests fail and the third succeeds. Once a branch is taken, "
                   "the rest are skipped.",
                diff="apply"),
        written("Explain why using = instead of == inside an if statement is a mistake.", 2,
                [mp("a single = assigns a value rather than comparing two",
                    ["assign|assigns|assignment|assigning|sets|puts|stores",
                     "value|variable|equals|it"],
                    exemplar="A single = assigns a value rather than comparing two."),
                 mp("so the condition does not test what the programmer intended",
                    ["compare|comparison|compares|comparing|not test|does not test|not what|not comparing"],
                    developed=True,
                    exemplar="So the condition does not test what was intended.")],
                example="A single = assigns a value to a variable, while == compares two "
                        "values, so an if statement written with a single = is not testing "
                        "anything — in many languages it would also overwrite the "
                        "variable being tested.",
                paraphrase="One equals sign stores a value in a variable instead of "
                           "comparing, which means the condition is not actually checking "
                           "what the programmer wanted it to check.",
                fb="Assignment against comparison, and then the consequence.",
                diff="understand"),
    ]),

    sub("String manipulation", "pf-l02-s6", ["pf-l02-o3"], [
        codeout("What does this program print for the word Revise?",
                "name = 'Revise'\n"
                "print(len(name))",
                "6",
                fb="len counts the characters: R, e, v, i, s, e."),
        codeout("What does this slice of the word computer print?",
                "word = 'computer'\n"
                "print(word[0:4])",
                "comp",
                fb="A slice runs from the first index up to but not including the second, so "
                   "0 to 3.",
                misc="Expecting 'compu' counts index 4 as well. The end of a slice is not "
                     "included.",
                diff="apply"),
        codeout("What does this program print after lowering the case and joining a number?",
                "s = 'GCSE'\n"
                "print(s.lower() + str(9))",
                "gcse9",
                fb="lower() makes it lower case and str() turns the number into text so it "
                   "can be joined.",
                diff="apply"),
        num("A string holds 'Revise 360'. What does len() return for it?", 10,
            working="10",
            fb="Ten characters, because the space counts.",
            misc="Forgetting the space gives 9.",
            diff="understand"),
    ]),

    # ============================================================ pf-l03
    sub("File handling", "pf-l03-s4", ["pf-l03-o1", "pf-l03-o2", "pf-l03-o3"], [
        written("Explain the difference between opening a file to write and opening it to "
                "append.", 2,
                [mp("writing replaces what was already in the file",
                    ["write|writing|w mode|writes"],
                    ["replace|replaces|overwrite|overwrites|deletes|erases|clears|"
                     "starts again|empty|wipes|lost"],
                    exemplar="Opening a file to write replaces whatever was in it."),
                 mp("appending adds to the end, keeping what was there",
                    ["append|appending|a mode"],
                    ["end|adds|added|keeps|kept|existing|without deleting|on to"],
                    exemplar="Appending adds to the end and keeps what was already there.")],
                example="Opening a file for writing clears it, so whatever was in it is lost "
                        "and the new data starts from an empty file. Opening it to append "
                        "keeps the existing contents and adds the new data to the end.",
                paraphrase="Write mode wipes the file and starts fresh, whereas append mode "
                           "preserves what is already stored and tacks the new data on at "
                           "the end.",
                fb="Both halves. The mark is lost most often by saying what append does "
                   "without saying what write does to the old contents.",
                diff="understand", exam=True),
        short("Give one reason a program should close a file when it has finished with it.",
              [mp("the data is written out properly and the file is freed for others",
                  ["saved|written|stored|flushed|not lost|properly|complete|corrupt"],
                  ["free|freed|release|released|available|another program|other programs|"
                   "locked|unlock"],
                  exemplar="So that everything is written out properly and nothing is lost.")],
              example="So that everything the program wrote is actually saved to the file "
                      "rather than left unwritten, and so that other programs can use it.",
              paraphrase="To make sure the data really is stored and to let anything else "
                         "open the file.",
              fb="Either reason earns the mark. Both are about what happens to the file "
                 "after the program stops needing it.", cw="give"),
        order("Put the steps of reading a file in a program into order.",
              ["Open the file in read mode",
               "Read a line from the file",
               "Process the line that was read",
               "Close the file"],
              fb="Open, read, use, close. The close is the step most often forgotten.",
              diff="retrieve"),
    ]),

    # ============================================================ pf-l04
    sub("Records and SQL", "pf-l04-s3", ["pf-l04-o1", "pf-l04-o2", "pf-l04-o3"], [
        match("Match each SQL keyword to what it does.",
              [["SELECT", "Chooses which fields to show"],
               ["FROM", "Says which table to look in"],
               ["WHERE", "Says which records to include"],
               ["LIKE", "Matches part of a value using a wildcard"]],
              fb="SELECT picks columns, WHERE picks rows.",
              diff="retrieve"),
        mcq("Which query returns the name and form of every pupil in year 11?",
            "SELECT Name, Form FROM Pupils WHERE Year = 11",
            ["SELECT Pupils FROM Name, Form WHERE Year = 11",
             "SELECT Name, Form WHERE Pupils FROM Year = 11",
             "SELECT * FROM Pupils"],
            fb="Fields after SELECT, table after FROM, condition after WHERE. The last "
               "option returns everything about everybody.",
            diff="apply", exam=True),
        short("State what is meant by a field in a database table.",
              [mp("one item of data held about each record, shown as a column",
                  ["column|category|attribute|item of data|piece of data|one piece|"
                   "type of data|heading"],
                  exemplar="One item of data held about each record, such as surname.")],
              example="A single item of data held about every record, such as the surname "
                      "field — a column in the table.",
              paraphrase="One column of the table: a single piece of information stored for "
                         "each record.",
              fb="A field is a column; a record is a row.", cw="state"),
        mcq("A table of books has a Title field. Which query finds every book whose title "
            "starts with 'The'?",
            "SELECT * FROM Books WHERE Title LIKE 'The%'",
            ["SELECT * FROM Books WHERE Title = 'The'",
             "SELECT * FROM Books WHERE Title LIKE '%The'",
             "SELECT Title FROM Books WHERE 'The'"],
            fb="The wildcard goes where the unknown part is, so 'The%' means 'starts with "
               "The'.",
            diff="apply", exam=True),
    ]),

    # ============================================================ pf-l05
    sub("Arrays", "pf-l05-s1", ["pf-l05-o1", "pf-l05-o2"], [
        codeout("What does this program print for index 2 of the array?",
                "scores = [12, 7, 19, 4]\n"
                "print(scores[2])",
                "19",
                fb="Arrays are indexed from 0, so index 2 is the third item.",
                misc="Expecting 7 counts from 1 instead of 0.",
                diff="apply"),
        num("An array is declared to hold 10 items. What is the index of the last one?", 9,
            working="10 - 1",
            fb="Indexing starts at 0, so ten items run from 0 to 9.",
            diff="understand"),
        codeout("What does this program print from the two-dimensional array?",
                "grid = [[1, 2, 3], [4, 5, 6]]\n"
                "print(grid[1][2])",
                "6",
                fb="The first index chooses the row and the second chooses the position in "
                   "it: row 1 is [4, 5, 6], and position 2 of that is 6.",
                hint="Which index chooses the row, and which chooses the position in it?",
                diff="stretch", exam=True),
        codeout("What does this program print when it totals the array?",
                "nums = [5, 10, 15, 20]\n"
                "total = 0\n"
                "for n in nums:\n"
                "    total = total + n\n"
                "print(total)",
                "50",
                fb="The loop visits each item and adds it to the running total.",
                diff="apply"),
        trace("Complete the trace table for this program, which counts how many marks are "
              "above 50.",
              "marks = [34, 71, 50, 88]\n"
              "count = 0\n"
              "for m in marks:\n"
              "    if m > 50:\n"
              "        count = count + 1\n"
              "print(count)",
              ["m", "count"],
              [["34", "0"], ["71", ""], ["50", ""], ["88", ""]],
              [["34", "0"], ["71", "1"], ["50", "1"], ["88", "2"]],
              fb="50 is not above 50, so the count does not change on that row. That "
                 "boundary is where most marks are lost.",
              hint="Read the condition carefully: is 50 greater than 50?",
              diff="apply", exam=True),
    ]),

    sub("Procedures and functions", "pf-l05-s4", ["pf-l05-o3"], [
        mcq("What is the difference between a procedure and a function?",
            "A function returns a value to the code that called it; a procedure does not",
            ["A procedure can take parameters and a function cannot",
             "A function can only be called once in a program",
             "A procedure is written outside the main program and a function inside it"],
            fb="Returning a value is the whole difference. Both can take parameters."),
        written("Explain one advantage of using sub-programs in a large program.", 2,
                [mp("the same code can be called from several places instead of being "
                    "repeated",
                    ["reuse|reused|called|call|calls|invoked|several places|wherever|"
                     "more than once|written once|without writing it again|"
                     "rather than repeating"],
                    exemplar="The same code can be called from several places instead of "
                             "being written out again."),
                 mp("so the program is shorter and a change only has to be made in one "
                    "place",
                    ["shorter|smaller|less code|less of it|one place|in one place|single place|single spot|"
                     "one spot|only once|easier to change|easier to maintain|easier to read|one copy"],
                    developed=True,
                    exemplar="This makes the program shorter, and a change only has to be "
                             "made once.")],
                example="A sub-program can be called from several places rather than having "
                        "the same lines written out again and again, which makes the program "
                        "shorter and means a change only has to be made in one place.",
                paraphrase="Code written once can be invoked wherever it is needed, so there "
                           "is less of it overall and any correction is made in a single "
                           "spot.",
                fb="Called rather than repeated, and then what that saves.",
                diff="understand", exam=True),
        codeout("What does this program print when both calls to the function are added?",
                "def double(n):\n"
                "    return n * 2\n"
                "\n"
                "print(double(7) + double(3))",
                "20",
                fb="14 + 6. A function returns a value, so it can be used inside a larger "
                   "expression.",
                diff="apply"),
        written("Explain why a local variable is usually preferred to a global one.", 2,
                [mp("a local variable exists only inside its own sub-program",
                    ["local|confined|scope", "only|just|inside|within|its own|that subprogram|"
                     "that function|that procedure|that routine|where it was"],
                    exemplar="A local variable exists only inside its own sub-program."),
                 mp("so it cannot be changed by accident somewhere else in the program",
                    ["accident|accidentally|by mistake|unexpectedly|elsewhere|"
                     "another part|somewhere else|other code|clash|conflict|"
                     "overwritten|interfere"],
                    developed=True,
                    exemplar="So no other part of the program can change it by accident.")],
                example="A local variable only exists inside the sub-program that declared "
                        "it, so no other part of the program can read or change it by "
                        "accident, which makes faults far easier to track down.",
                paraphrase="Since it is confined to the routine that created it, nothing "
                           "elsewhere can alter it unexpectedly, which keeps bugs contained.",
                fb="Scope, and then why limited scope is a good thing.",
                diff="apply", exam=True),
    ]),

    # ============================================================ pf-l06
    sub("Random numbers", "pf-l06-s2", ["pf-l06-o1", "pf-l06-o2", "pf-l06-o3"], [
        mcq("Which expression gives a random whole number between 1 and 6 inclusive?",
            "random.randint(1, 6)",
            ["random.randint(0, 6)", "random.randint(1, 7)", "random.random(1, 6)"],
            fb="randint includes both ends, so 1 to 6 is exactly a dice roll.",
            diff="apply"),
        short("State what is meant by a pseudo-random number.",
              [mp("it is produced by an algorithm, so it is not truly random",
                  ["algorithm|formula|calculation|seed|set of rules"],
                  ["not truly|not really|appears|seems|looks|predictable|"
                   "not genuinely|only appears"],
                  exemplar="It is produced by an algorithm, so it only appears random.")],
              example="A number produced by an algorithm that appears random but is not "
                      "truly random, because the same starting value would produce the same "
                      "sequence again.",
              paraphrase="It comes out of a formula rather than from chance, so it merely "
                         "looks random.",
              fb="Produced by a calculation, therefore only apparently random.",
              cw="state"),
        written("Explain why a program that shuffles a deck of cards for a gambling site "
                "should not use an ordinary pseudo-random number generator.", 2,
                [mp("the sequence is produced by an algorithm and can be predicted",
                    ["predict|predicted|predictable|work out|worked out|guess|"
                     "same sequence|repeat|repeated|calculate"],
                    exemplar="The sequence comes from an algorithm and can be predicted."),
                 mp("so someone who worked it out could cheat",
                    ["cheat|cheating|advantage|unfair|exploit|win|dishonest|"
                     "know the cards|take advantage"],
                    developed=True,
                    exemplar="So someone who worked it out could cheat.")],
                example="A pseudo-random sequence comes out of an algorithm, so anyone who "
                        "learned the starting value could work out which cards were coming "
                        "next, and could use that to cheat.",
                paraphrase="Because the numbers are generated by a formula they can be "
                           "predicted, which would let a player who had deduced it gain an "
                           "unfair advantage.",
                fb="Predictable, and then what being predictable makes possible here.",
                diff="stretch", exam=True),
    ]),
]
