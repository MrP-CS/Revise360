"""2.3 Producing robust programs: the revision bank.

Six lessons about writing programs that survive being used by people, so the
questions here are mostly about choosing the right check for a situation and
saying what each one actually stops.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written,
                    codeout, sub, mp)

TOPIC = "2.3"

BANK = [

    # ============================================================ rp-l01
    sub("Validation", "rp-l01-s2", ["rp-l01-o2", "rp-l01-o3"], [
        match("Match each validation check to what it tests.",
              [["Type check", "That the data is of the right data type"],
               ["Range check", "That a number is between two limits"],
               ["Presence check", "That something has been entered at all"],
               ["Length check", "That the data has the right number of characters"],
               ["Format check", "That the data follows a pattern, such as a postcode"]],
              fb="Each check stops a different kind of bad input. Naming the wrong one in an "
                 "exam earns nothing however well it is explained.",
              diff="retrieve", exam=True),
        mcq("A program asks for a pupil's age in years. Which check makes sure 250 is "
            "rejected?",
            "A range check", ["A presence check", "A type check", "A format check"],
            fb="250 is a whole number, so a type check passes it. Only a range check knows "
               "it is impossible.",
            diff="apply"),
        mcq("A program asks for an email address. Which check makes sure it contains an @ "
            "and a full stop in the right places?",
            "A format check", ["A length check", "A range check", "A presence check"],
            fb="A format check tests the pattern the data has to follow.",
            diff="apply"),
        short("State what is meant by validation.",
              [mp("checking that data entered is sensible or reasonable before it is "
                  "accepted",
                  ["check|checks|checking|test|tests|testing|make sure|makes sure",
                   "sensible|reasonable|allowable|acceptable|valid|within|correct type|"
                   "right format|meets the rules|right kind|possible"],
                  exemplar="Checking that data entered is sensible before it is accepted.")],
              example="Checking that the data entered is sensible and allowable before the "
                      "program accepts it.",
              paraphrase="Testing input against rules to make sure it is reasonable before "
                         "it is used.",
              fb="Sensible, not correct: validation cannot tell whether an age of 15 is the "
                 "learner's real age.",
              misc="Validation does not check that data is TRUE, only that it is possible.",
              cw="state"),
        written("Explain why validation cannot guarantee that the data a user enters is "
                "correct.", 2,
                [mp("validation only checks that the data is possible or sensible",
                    ["sensible|possible|reasonable|allowable|valid|within range|"
                     "right type|right format|meets the rule"],
                    exemplar="Validation only checks that the data is possible."),
                 mp("a user can still enter something possible but untrue",
                    ["still|could|can|might", "wrong|untrue|not true|false|lie|lies|lying|"
                     "incorrect|not correct|not accurate|not their|not the real|made up|"
                     "different|dishonest"],
                    developed=True,
                    exemplar="So a user can still type a date of birth that is possible but "
                             "not theirs.")],
                example="Validation only tests whether the data is possible: that it is a "
                        "number, that it is in range, that it has the right shape. So a user "
                        "can type a date of birth that passes every one of those checks and "
                        "is still not their date of birth.",
                paraphrase="The checks only establish that an entry is plausible, so somebody "
                           "can supply something perfectly allowable that simply is not true.",
                fb="Possible is not the same as true. That distinction is the whole answer.",
                diff="apply", exam=True),
    ]),

    sub("Defensive design", "rp-l02-s1", ["rp-l02-o1", "rp-l02-o2"], [
        short("State what is meant by defensive design.",
              [mp("writing a program so that it copes with being used wrongly",
                  ["anticipat|expect|expects|plan|planning|prepare|designed|written|"
                   "think about|consider|cope|copes|handle|handles|guard|guards",
                   "misuse|used wrongly|mistake|mistakes|wrong input|bad input|error|errors|"
                   "unexpected|crash|crashing|incorrect input|invalid"],
                  exemplar="Writing a program so that it anticipates being used wrongly.")],
              example="Writing a program so that it anticipates the mistakes and misuse it "
                      "will meet, and copes with them rather than crashing.",
              paraphrase="Designing code that expects users to do unexpected things and "
                         "handles it.",
              fb="Anticipating misuse. A program that only works when everything goes right "
                 "has not been designed defensively.", cw="state"),
        multi("Which of these are part of designing a program defensively? Tick all that "
              "apply.",
              ["Validating every input before using it",
               "Checking that a file exists before opening it",
               "Giving a helpful message when something goes wrong",
               "Requiring users to authenticate before reaching private data",
               "Writing the program in as few lines as possible",
               "Making the program run as fast as possible"],
              ["Validating every input before using it",
               "Checking that a file exists before opening it",
               "Giving a helpful message when something goes wrong",
               "Requiring users to authenticate before reaching private data"],
              fb="Speed and brevity are not defences. A short fast program that crashes on "
                 "bad input is not robust.",
              diff="understand"),
        written("Explain why a program should check that a file exists before trying to open "
                "it.", 2,
                [mp("opening a file that is not there causes an error",
                    ["error|crash|crashes|exception|fail|fails|stop|stops|"
                     "cannot open|will not open"],
                    exemplar="Trying to open a file that is not there causes an error."),
                 mp("so the program can give a sensible message instead of stopping",
                    ["message|tell|tells|warn|warns|inform|prompt|ask|"
                     "carry on|continue|keep going|handle|recover"],
                    developed=True,
                    exemplar="Checking first means that the program can tell the user "
                             "instead of crashing.")],
                example="If the file is missing, trying to open it raises an error and the "
                        "program stops. Checking first lets it tell the user that the file "
                        "could not be found and carry on, which is far better than crashing "
                        "in front of them.",
                paraphrase="Attempting to open a non-existent file throws an error that halts "
                           "the program, so testing for it first allows a sensible message to "
                           "be shown and execution to continue.",
                fb="What goes wrong, and what checking lets you do instead.",
                diff="apply", exam=True),
        mcq("A website asks a user to type a word shown in a distorted image. What is this "
            "for?",
            "To check that the user is a person rather than an automated program",
            ["To check that the user's keyboard works",
             "To encrypt the user's password before sending it",
             "To validate the format of the user's email address"],
            fb="A CAPTCHA defends against bots submitting the form thousands of times.",
            diff="understand"),
    ]),

    # ============================================================ rp-l03
    sub("Maintainability", "rp-l03-s1", ["rp-l03-o1", "rp-l03-o2"], [
        multi("Which of these make a program easier to maintain? Tick all that apply.",
              ["Using variable names that say what the variable holds",
               "Adding comments that explain why the code does what it does",
               "Indenting the code consistently",
               "Breaking the program into sub-programs",
               "Using single-letter names to keep the file short",
               "Removing all the white space"],
              ["Using variable names that say what the variable holds",
               "Adding comments that explain why the code does what it does",
               "Indenting the code consistently",
               "Breaking the program into sub-programs"],
              fb="Everything that makes code readable makes it maintainable. Short is not "
                 "the same as clear.",
              diff="retrieve"),
        written("Explain why maintainability matters on a program that will be worked on for "
                "years.", 3,
                [mp("the person maintaining it may not be the person who wrote it",
                    ["someone else|somebody else|another programmer|another person|"
                     "different programmer|different person|new programmer|other people|"
                     "team|not the author|not the original|not the person who wrote|"
                     "did not write|not written by|original author|original programmer|"
                     "original writer|rarely the"],
                    exemplar="The person maintaining it is often not the person who wrote "
                             "it."),
                 mp("so they have to understand it before they can change it safely",
                    ["understand|work out|follow|read|make sense|figure out"],
                    exemplar="They have to understand it before they can change anything."),
                 mp("and unclear code takes longer to change and is easier to break",
                    ["longer|slow|time|costly|expensive|delay|drag",
                     "break|breaks|broken|bug|bugs|mistake|error|introduce|wrong"],
                    developed=True,
                    exemplar="So unclear code takes longer to change and is much easier to "
                             "break by accident."),
                 ],
                example="Over several years the person maintaining a program is usually not "
                        "the person who wrote it, and quite often the author has forgotten it "
                        "too. Whoever picks it up has to understand it before they can safely "
                        "change anything, so code that is hard to follow takes much longer "
                        "to work through and is far easier to break by accident.",
                paraphrase="The programmer making changes later is rarely the original "
                           "author, so they must first make sense of the code, and anything "
                           "unclear slows that down because it raises the chance of "
                           "introducing a fault.",
                fb="Three ideas: who, what they must do first, and the cost of it being "
                   "hard.",
                diff="apply", exam=True),
        mcq("Which comment is the more useful in a maintainable program?",
            "# VAT is applied before the discount, as required by the finance team",
            ["# add 20 per cent", "# this line does a calculation",
             "# written by J. Patel"],
            fb="A comment should say why, not restate what the line already says.",
            diff="understand"),
        sort("Sort each habit by whether it is good practice or bad practice.",
             ["Good practice", "Bad practice"],
             [["Naming a variable totalScore", "Good practice"],
              ["Naming a variable x2", "Bad practice"],
              ["Indenting the body of every loop", "Good practice"],
              ["Writing the whole program in one long block", "Bad practice"],
              ["Commenting why an unusual approach was taken", "Good practice"],
              ["Commenting every single line", "Bad practice"]],
             fb="Commenting every line is as unhelpful as commenting none: the useful "
                "comments get lost in the noise.",
             diff="understand"),
    ]),

    # ============================================================ rp-l04 / rp-l05
    sub("Testing", "rp-l04-s1", ["rp-l04-o1", "rp-l04-o2", "rp-l04-o3"], [
        multi("Which of these are reasons for testing a program? Tick all that apply.",
              ["To make sure it produces the right output for the right input",
               "To make sure it does not crash on unexpected input",
               "To make sure it meets what was asked for",
               "To find errors before users do",
               "To make the program run faster",
               "To reduce the number of lines of code"],
              ["To make sure it produces the right output for the right input",
               "To make sure it does not crash on unexpected input",
               "To make sure it meets what was asked for",
               "To find errors before users do"],
              fb="Testing finds faults. It does not make code faster or shorter.",
              diff="retrieve"),
        written("Explain the difference between iterative testing and final testing.", 2,
                [mp("iterative testing happens while the program is being written, section "
                    "by section",
                    ["iterative", "during|as it is|as you|each section|each part|"
                     "throughout|as it goes|modules|bit by bit|being written|"
                     "not finished|still writing|develop"],
                    exemplar="Iterative testing happens while the program is being written, "
                             "a section at a time."),
                 mp("final testing happens once the whole program is complete",
                    ["final|terminal", "whole|complete|finished|end|all of it|"
                     "everything together|once it is done"],
                    exemplar="Final testing happens once the whole program is finished.")],
                example="Iterative testing is done while the program is being written, "
                        "testing each section as it is added, so faults are found early. "
                        "Final testing is done once the whole program is complete, to check "
                        "that all the parts work together and that it does what was asked "
                        "for.",
                paraphrase="Iterative testing is carried out during development, checking "
                           "each piece as it is built, whereas final testing comes at the "
                           "end, once everything is assembled.",
                fb="Both halves. During, and at the end.",
                diff="understand", exam=True),
        match("Match each test data type to an example, for a program that accepts a mark "
              "between 0 and 100.",
              [["Normal data", "57"], ["Boundary data", "100"],
               ["Invalid data", "101"], ["Erroneous data", "fifty"]],
              fb="Boundary data sits exactly on the limit, which is where most off-by-one "
                 "faults live.",
              diff="apply", exam=True),
        written("Explain why boundary data is particularly important to test.", 2,
                [mp("it sits exactly on the limit the program checks against",
                    ["limit|edge|boundary|border|exactly on|right on|extreme|"
                     "highest|lowest|largest|smallest"],
                    exemplar="Boundary data sits exactly on the limit the program checks "
                             "against."),
                 mp("which is where an off-by-one mistake in the condition shows up",
                    ["off by one|one out|mistake|mistakes|error|errors|fault|slip|"
                     "wrong operator|wrong symbol|wrong sign|incorrect|missed|misses",
                     "condition|comparison|operator|sign|symbol|inequality|"
                     "greater than|less than|equal|if statement"],
                    developed=True,
                    exemplar="So that is where a mistake in the comparison shows up, such as "
                             "writing less than where less than or equal to was meant.")],
                example="Boundary data is the value right on the limit, which is exactly "
                        "where a mistake in the condition shows itself — using > where "
                        ">= was meant only goes wrong for the one value on the boundary, and "
                        "normal data would never find it.",
                paraphrase="Because it falls precisely on the edge of what is allowed, it is "
                           "the only data that exposes an error in the comparison, such as "
                           "using the wrong inequality.",
                fb="On the limit, and what being on the limit catches.",
                diff="stretch", exam=True),
        codeout("A program is meant to accept a mark from 0 to 100 inclusive. What does it "
                "print when the mark entered is 100?",
                "mark = 100\n"
                "if mark >= 0 and mark < 100:\n"
                "    print('Accepted')\n"
                "else:\n"
                "    print('Rejected')",
                "Rejected",
                fb="The condition uses < where <= was meant, so the top boundary is wrongly "
                   "rejected. Only boundary data finds this.",
                hint="Try the value that sits exactly on the limit.",
                diff="apply", exam=True),
    ]),
]
