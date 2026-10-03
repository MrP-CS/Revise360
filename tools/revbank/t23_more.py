"""2.3 Producing robust programs: the rest of it.

tools/revbank/t23.py covers one question per idea. This covers the five lessons
properly - each validation check on its own, authentication, whitelists, naming
and indentation separately from commenting, syntax against logic errors, and each
of the four kinds of test data - because the exam asks about them individually
and a learner revising the topic needs more than eighteen questions.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written,
                    codeout, sub, mp)

TOPIC = "2.3"

BANK = [

    # ============================================================ rp-l01
    sub("Type and presence checks", "rp-l01-s2", ["rp-l01-o3"], [
        mcq("A program asks for a pupil's name and the user presses Enter without typing "
            "anything. Which check catches this?",
            "A presence check",
            ["A type check", "A range check", "A format check"],
            fb="Nothing was entered at all, so there is nothing for the other checks to look "
               "at.",
            diff="apply"),
        mcq("A program expects a whole number and the user types the word 'twelve'. Which "
            "check catches this?",
            "A type check",
            ["A range check", "A presence check", "A length check"],
            fb="Something was entered, and it is in no sensible range, because it is not a "
               "number at all. The type is what is wrong.",
            diff="apply"),
        written("Explain why a program that asks for an age should use both a type check and a "
                "range check.", 2,
                [mp("a type check only makes sure the entry is a number",
                    ["type check|number|numeric|whole number|integer|digits",
                     "only|just|all it|does not|cannot|says nothing|no idea|no opinion|"
                     "nothing about|no view"],
                    exemplar="A type check only makes sure what was entered is a number."),
                 mp("so a number like 250 still has to be rejected for being impossible",
                    ["range|too big|too large|impossible|unrealistic|between|limit|limits|"
                     "sensible|250|300|minus|negative"],
                    developed=True,
                    exemplar="So a range check is still needed, because 250 is a number and "
                             "is not a possible age.")],
                example="A type check makes sure the entry is a number rather than text, but "
                        "it has no opinion about which numbers are sensible. 250 and -7 both "
                        "pass it, so a range check is needed as well to keep the value between "
                        "limits an age could actually take.",
                paraphrase="The first only establishes that a number was given; a second check "
                           "is required because values such as 250 are numbers and still "
                           "impossible ages.",
                fb="What a type check does not do, and what fills the gap.",
                diff="apply", exam=True),
    ]),

    sub("Length and format checks", "rp-l01-s5", ["rp-l01-o3"], [
        mcq("A website requires a password of at least eight characters. Which check enforces "
            "this?",
            "A length check",
            ["A format check", "A presence check", "A type check"],
            fb="How many characters there are is a length check. What they look like would be "
               "a format check.",
            diff="apply"),
        match("Match each entry to the check that would reject it.",
              [["An empty box where a name should be", "Presence check"],
               ["A date of birth of 30/02/2009", "Format check"],
               ["A price of -5", "Range check"],
               ["A phone number with four digits", "Length check"],
               ["The word 'seven' where a quantity should be", "Type check"]],
              fb="Each entry is wrong in a different way, and only the matching check notices.",
              diff="apply", exam=True),
    ]),

    sub("Whitelists and blacklists", "rp-l01-s6", ["rp-l01-o3"], [
        mcq("A program accepts only the words RED, AMBER and GREEN and rejects everything "
            "else. What is this called?",
            "A whitelist", ["A blacklist", "A range check", "A length check"],
            fb="A whitelist names what is allowed. A blacklist names what is not, and "
               "everything it has not thought of gets through.",
            diff="retrieve"),
        written("Explain why a whitelist is usually safer than a blacklist.", 2,
                [mp("a whitelist allows only what is on it",
                    ["whitelist|white list|allowed list|only|just",
                     "allow|allows|allowed|accept|accepts|permitted|on the list"],
                    exemplar="A whitelist allows only the entries that are on it."),
                 mp("so anything the programmer did not think of is rejected rather than "
                    "let through",
                    ["did not think of|not thought of|forgot|forgotten|new|unexpected|"
                     "anything else|everything else|reject|rejected|blocked|refused|"
                     "gets through|let through|slip"],
                    developed=True,
                    exemplar="This means anything the programmer did not think of is rejected "
                             "rather than let through.")],
                example="A whitelist allows only what is on it, so anything nobody thought of "
                        "is refused by default. A blacklist has to name every bad entry in "
                        "advance, and anything new — a misspelling, a trick nobody had seen — "
                        "goes straight through.",
                paraphrase="Because only listed entries are accepted, anything unforeseen is "
                           "turned away, whereas a list of banned entries lets through "
                           "everything it failed to anticipate.",
                fb="What each list decides, and what happens to the thing nobody predicted.",
                diff="stretch", exam=True),
    ]),

    # ============================================================ rp-l02
    sub("Authentication", "rp-l02-s3", ["rp-l02-o3"], [
        multi("Which of these are ways a program can authenticate a user? Tick all that "
              "apply.",
              ["A username and password",
               "A code sent to the user's phone",
               "A fingerprint or face scan",
               "Answering a security question set earlier",
               "Checking that the username is spelled correctly",
               "Checking that the password is at least eight characters long"],
              ["A username and password",
               "A code sent to the user's phone",
               "A fingerprint or face scan",
               "Answering a security question set earlier"],
              fb="Authentication proves who somebody is. The last two are validation: they "
                 "check the entry makes sense, not who typed it.",
              diff="understand"),
        written("Explain why a program should store a hashed version of a password rather than "
                "the password itself.", 2,
                [mp("if the stored data is read the actual passwords are not in it",
                    ["stolen|taken|read|leaked|breach|hacked|copied|got hold of|"
                     "database|if someone sees",
                     "not the password|passwords are not|no passwords|not in it|"
                     "not stored|cannot see|cannot read|does not have|"
                     "hash|hashes|hashed|scrambled|unreadable"],
                    exemplar="If the stored data is stolen, the actual passwords are not in "
                             "it."),
                 mp("because a hash cannot practically be turned back into the original",
                    ["cannot be reversed|not be reversed|cannot be turned back|"
                     "not be turned back|cannot turn it back|cannot be worked backwards|"
                     "not be worked backwards|cannot be undone|one way|oneway|"
                     "cannot get back|cannot work out|cannot undo|impossible to|"
                     "very hard to"],
                    developed=True,
                    exemplar="This is because a hash cannot practically be turned back into "
                             "the password.")],
                example="If the file of accounts is stolen, what the attacker has is a list of "
                        "hashes, and a hash cannot practically be turned back into the password "
                        "it came from. The program can still check a login, because it hashes "
                        "what was typed and compares the two hashes rather than the passwords.",
                paraphrase="Should the stored records be taken, they contain no usable "
                           "passwords, since the process of producing a hash cannot be worked "
                           "backwards.",
                fb="What a thief gets, and why it is no use to them.",
                diff="stretch"),
    ]),

    sub("When things go wrong at run time", "rp-l02-s2", ["rp-l02-o2"], [
        multi("Which of these can go wrong while a program is running, however carefully it "
              "was written? Tick all that apply.",
              ["The user enters something unexpected",
               "A file the program needs has been moved or deleted",
               "The network connection drops part-way through",
               "A calculation ends up dividing by zero",
               "The program's syntax is wrong",
               "The programmer has not finished writing it"],
              ["The user enters something unexpected",
               "A file the program needs has been moved or deleted",
               "The network connection drops part-way through",
               "A calculation ends up dividing by zero"],
              fb="These are run-time problems: they depend on what happens while the program "
                 "runs. A syntax error stops it running at all.",
              diff="understand"),
        mcq("A program asks the user for two numbers and divides the first by the second. What "
            "should it check before dividing?",
            "That the second number is not zero",
            ["That the first number is larger than the second",
             "That both numbers are whole numbers",
             "That the user has entered them in order"],
            fb="Dividing by zero stops the program. Checking for it first is defensive design "
               "in one line.",
            diff="apply", exam=True),
    ]),

    # ============================================================ rp-l03
    sub("Naming and indentation", "rp-l03-s1", ["rp-l03-o2"], [
        mcq("Which variable name is the better choice in a maintainable program?",
            "numberOfPupils", ["n", "x1", "thing2"],
            fb="A name that says what the variable holds saves the next reader working it out "
               "from how it is used.",
            diff="retrieve"),
        written("Explain how consistent indentation helps somebody reading a program.", 2,
                [mp("it shows which lines are inside a loop or a condition",
                    ["inside|within|part of|belongs to|contained|nested|block",
                     "loop|loops|condition|if|selection|iteration|function|"
                     "subprogram|statement"],
                    exemplar="It shows which lines are inside a loop or an if statement."),
                 mp("so the structure can be seen without reading every line",
                    ["structure|shape|layout|see|seen|visible|obvious|glance|quickly|"
                     "immediately|easier to follow|at a look|without reading|"
                     "straight away"],
                    developed=True,
                    exemplar="This means the structure of the program can be seen at a glance.")],
                example="Indentation shows which lines belong inside a loop or an if "
                        "statement, so the shape of the program can be seen at a glance rather "
                        "than worked out line by line. In Python it is not even optional — the "
                        "indentation is what decides where a block ends.",
                paraphrase="Because it makes clear which statements sit within a loop or "
                           "condition, the layout of the program is visible immediately instead "
                           "of having to be traced.",
                fb="What indentation shows, and what seeing it saves.",
                diff="understand"),
        tf("In Python, indentation changes what a program does.", True,
           fb="In most languages indentation is only for readers. In Python it decides which "
              "lines are inside a block, so getting it wrong changes the program."),
    ]),

    sub("Sub-programs and maintainability", "rp-l03-s4", ["rp-l03-o2", "rp-l03-o3"], [
        written("Explain how breaking a program into sub-programs makes it easier to "
                "maintain.", 2,
                [mp("each sub-program does one job and can be read on its own",
                    ["one job|one task|single task|one thing|single job|single purpose|"
                     "own job|separately|on its own|by itself|smaller|short|"
                     "self contained",
                     "sub program|subprogram|procedure|function|routine|part|parts|"
                     "section|sections|block"],
                    exemplar="Each sub-program does one job and can be read on its own."),
                 mp("so a change or a fix only has to be made in one place",
                    ["one place|once|single place|only there|reuse|reused|again|"
                     "rest of the program|does not affect|without changing"],
                    developed=True,
                    exemplar="This means a change only has to be made in one place rather than "
                             "everywhere the code was repeated.")],
                example="Each sub-program does one job, so it can be read and understood "
                        "without holding the whole program in your head. And because the code "
                        "sits in one place rather than being copied, fixing it means changing "
                        "one sub-program rather than hunting for every copy.",
                paraphrase="Since every routine handles a single task it can be understood by "
                           "itself, and as the code appears only once, a correction needs "
                           "making in a single location.",
                fb="One job each, and the one place a fix goes.",
                diff="apply", exam=True),
        order("A program repeats the same eight lines in four different places. Put these "
              "steps in the order a programmer would take to improve it.",
              ["Notice that the same eight lines appear four times",
               "Work out what those eight lines do as one job",
               "Write the eight lines once as a sub-program with a name that says that job",
               "Replace each of the four copies with a call to the sub-program",
               "Test that the program still behaves the same way"],
              fb="Testing last is not optional: refactoring that is not tested is just "
                 "editing.",
              diff="apply"),
    ]),

    # ============================================================ rp-l04
    sub("Syntax and logic errors", "rp-l04-s4", ["rp-l04-o4", "rp-l04-o5"], [
        sort("Sort each fault by whether it is a syntax error or a logic error.",
             ["Syntax error", "Logic error"],
             [["A missing colon at the end of an if line", "Syntax error"],
              ["print spelled as pirnt", "Syntax error"],
              ["A closing bracket left off", "Syntax error"],
              ["Using + where * was meant", "Logic error"],
              ["A loop that runs one time too many", "Logic error"],
              ["Dividing by the wrong variable", "Logic error"]],
             fb="A syntax error stops the program running. A logic error lets it run and "
                "produce the wrong answer, which is why it is harder to find.",
             diff="understand", exam=True),
        written("Explain why a logic error is usually harder to find than a syntax error.", 2,
                [mp("a syntax error is reported by the translator with a line number",
                    ["translator|compiler|interpreter|ide|computer|program",
                     "reports|reported|tells you|points|flagged|flags|identifies|"
                     "highlights|names the line|error message|line number|"
                     "will not run|refuses|stops"],
                    exemplar="A syntax error is reported by the translator, often with a line "
                             "number."),
                 mp("a logic error lets the program run, so nothing points to where it is",
                    ["runs|still works|no message|no error|nothing tells|does not stop|"
                     "looks fine|seems to work|wrong answer|wrong output|wrong result"],
                    developed=True,
                    exemplar="A logic error lets the program run, so nothing tells the "
                             "programmer where to look.")],
                example="A syntax error stops the program from running at all, and the "
                        "translator says which line it could not understand. A logic error "
                        "breaks no rules, so the program runs happily and simply produces the "
                        "wrong answer — the programmer has to work out which part of their own "
                        "reasoning was wrong, with nothing pointing at it.",
                paraphrase="The first is flagged by the translator, which names the line; the "
                           "second allows the program to execute normally, so there is no "
                           "message and no indication of where the fault lies.",
                fb="What you are told about one, and what you are not told about the other.",
                diff="understand", exam=True),
        codeout("What does this program print?",
                "total = 0\n"
                "for n in [4, 8, 15]:\n"
                "    total = n\n"
                "print(total)",
                "15",
                fb="The program was meant to add the numbers up but it replaces total each "
                   "time, so it ends up holding the last one. It runs perfectly: that is what "
                   "makes it a logic error.",
                hint="Read the line inside the loop carefully. Is it adding or replacing?",
                diff="apply", exam=True),
    ]),

    # ============================================================ rp-l05
    sub("Normal, boundary, invalid and erroneous data", "rp-l05-s1",
        ["rp-l05-o1", "rp-l05-o2"], [
        sort("A program accepts a percentage from 0 to 100. Sort each test value by the kind "
             "of data it is.",
             ["Normal", "Boundary", "Invalid", "Erroneous"],
             [["62", "Normal"], ["0", "Boundary"], ["101", "Invalid"], ["ninety", "Erroneous"]],
             fb="Boundary data is on the limit, invalid data is the right type and out of "
                "range, erroneous data is the wrong type altogether.",
             diff="apply", exam=True),
        written("Explain why testing a program with normal data only is not enough.", 2,
                [mp("normal data is what the program was written to expect",
                    ["expect|expected|expects|sensible|designed for|meant to handle|"
                     "supposed to|everyday|written for|designed around|built for"],
                    exemplar="Normal data is exactly what the program was written to expect."),
                 mp("so faults only appear when something unexpected or on the limit is "
                    "entered",
                    ["boundary|limit|edge|invalid|erroneous|unexpected|wrong type|"
                     "out of range|extreme|empty|blank|text|letters"],
                    developed=True,
                    exemplar="This means a fault only shows up when something on the limit or "
                             "of the wrong type is entered.")],
                example="Normal data is what the program was written to handle, so it will "
                        "almost always work. The faults live at the edges: a value exactly on "
                        "the limit, a number just outside the range, or a word where a number "
                        "was expected. Testing only with sensible input finds none of them.",
                paraphrase="Since ordinary values are the ones the program was designed "
                           "around, problems only surface with input at the boundary or of "
                           "entirely the wrong kind.",
                fb="What normal data proves, and where the faults actually are.",
                diff="apply", exam=True),
        mcq("A program accepts a mark from 0 to 50. Which of these is erroneous data?",
            "fifty", ["50", "51", "-1"],
            fb="Erroneous data is the wrong data type. 51 and -1 are numbers in the wrong "
               "range, which makes them invalid rather than erroneous.",
            diff="apply", exam=True),
        multi("A program asks for a date of birth. Which of these would be sensible test "
              "values? Tick all that apply.",
              ["A date in the past",
               "Today's date",
               "A date in the future",
               "30 February",
               "The word 'yesterday'",
               "A date the programmer knows will work"],
              ["A date in the past", "Today's date", "A date in the future",
               "30 February", "The word 'yesterday'"],
              fb="Good test data includes the awkward cases. A value chosen because it works "
                 "tests nothing.",
              diff="apply"),
    ]),
]
