"""2.4 Boolean logic: the revision bank.

Small topic, heavily examined, and almost entirely a doing topic: complete the
table, read the diagram, turn the sentence into an expression. Every truth table
here is generated from its own Boolean expression by tools/revkit.py and
evaluated again, row by row, by tools/revverify.py - so a table can never
disagree with the expression printed above it.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written,
                    truth, sub, mp)

TOPIC = "2.4"

BANK = [

    # ============================================================ bl-l01
    sub("The three gates", "bl-l01-s1", ["bl-l01-o1", "bl-l01-o2"], [
        match("Match each logic gate to when its output is 1.",
              [["AND", "Only when both inputs are 1"],
               ["OR", "When at least one input is 1"],
               ["NOT", "When its single input is 0"]],
              fb="AND needs both, OR needs one, NOT reverses.",
              diff="retrieve"),
        mcq("A two-input AND gate has inputs A = 1 and B = 0. What is its output?",
            "0", ["1", "Both 0 and 1", "It depends on the previous input"],
            fb="AND gives 1 only when both inputs are 1."),
        mcq("A two-input OR gate has inputs A = 0 and B = 1. What is its output?",
            "1", ["0", "Both 0 and 1", "It cannot be worked out"],
            fb="OR gives 1 when at least one input is 1."),
        truth("Complete the truth table for Q = A AND B.", "A AND B", ["A", "B"],
              fb="Only the last row has both inputs at 1, so only the last row gives 1.",
              diff="retrieve"),
        truth("Complete the truth table for Q = A OR B.", "A OR B", ["A", "B"],
              fb="Everything except both-zero gives 1.",
              diff="retrieve"),
        truth("Complete the truth table for Q = NOT A.", "NOT A", ["A"],
              fb="NOT reverses its input: 0 becomes 1 and 1 becomes 0.",
              diff="retrieve"),
        short("State what the NOT gate does to its input.",
              [mp("it reverses it, so 0 becomes 1 and 1 becomes 0",
                  ["reverse|reverses|reversed|invert|inverts|inverted|opposite|"
                   "flip|flips|changes it|negates|other way round"],
                  exemplar="It reverses the input.")],
              example="It reverses the input, so a 0 becomes a 1 and a 1 becomes a 0.",
              paraphrase="It inverts whatever goes in.",
              fb="Reverses, inverts or gives the opposite — all the same answer.",
              cw="state"),
    ]),

    sub("Combining gates", "bl-l01-s5", ["bl-l01-o3"], [
        truth("Complete the truth table for Q = NOT A AND B.", "(NOT A) AND B",
              ["A", "B"],
              fb="NOT A is worked out first, then ANDed with B, so only A = 0 and B = 1 "
                 "gives 1.",
              hint="Work out NOT A before the AND.",
              diff="apply"),
        truth("Complete the truth table for Q = NOT (A OR B).", "NOT (A OR B)", ["A", "B"],
              fb="The brackets come first: A OR B, then reverse the whole thing. Only "
                 "both-zero gives 1.",
              hint="Brackets first, then the NOT across the whole result.",
              diff="apply"),
        truth("Complete the truth table for Q = A AND (B OR C).", "A AND (B OR C)",
              ["A", "B", "C"], given=2,
              fb="Three inputs give eight rows. Work out the bracket first, then the AND.",
              hint="Eight rows, and the first two are done for you.",
              diff="apply", exam=True),
        truth("Complete the truth table for Q = (A AND B) OR (NOT C).",
              "(A AND B) OR (NOT C)", ["A", "B", "C"], given=2,
              fb="Two brackets, worked out separately, then ORed together. The output is 1 "
                 "whenever C is 0, or whenever A and B are both 1.",
              diff="stretch", exam=True),
        mcq("Why does Q = NOT A AND B give a different answer from Q = NOT (A AND B)?",
            "In the first, only A is reversed; in the second, the whole result is reversed",
            ["They are the same; the brackets make no difference",
             "The second one cannot be worked out without a third input",
             "The first one reverses B rather than A"],
            fb="Brackets decide what the NOT applies to, and that changes every row of the "
               "table.",
            diff="understand", exam=True),
    ]),

    # ============================================================ bl-l02
    sub("Setting out a truth table", "bl-l02-s1", ["bl-l02-o1"], [
        mcq("How many rows does a truth table need for an expression with three inputs?",
            "8", ["3", "6", "9"],
            fb="2³ = 8. Each extra input doubles the number of rows."),
        mcq("How many rows does a truth table need for an expression with four inputs?",
            "16", ["8", "12", "32"],
            fb="2⁴ = 16."),
        written("Explain why a truth table for four inputs has sixteen rows.", 2,
                [mp("each input can be 0 or 1",
                    ["0|zero", "1|one"],
                    ["two values|two states|two possibilities|either"],
                    exemplar="Each input can be either 0 or 1."),
                 mp("so the number of combinations is 2 multiplied by itself four times",
                    ["2|two", "4|four|power|to the|multiplied|times itself|16|sixteen"],
                    developed=True,
                    exemplar="So there are 2 to the power of 4, which is 16, combinations.")],
                example="Each of the four inputs can be either 0 or 1, so the number of "
                        "different combinations is 2 × 2 × 2 × 2, which is 16.",
                paraphrase="Every input takes one of two values, which means the total number "
                           "of possibilities is two to the power of four, or sixteen.",
                fb="Two values each, multiplied together once per input.",
                diff="understand"),
    ]),

    # ============================================================ bl-l03
    sub("From words to logic", "bl-l03-s1", ["bl-l03-o1"], [
        mcq("A shop alarm sounds when the shop is closed AND a door is opened. Which "
            "expression describes it?",
            "Q = Closed AND DoorOpen",
            ["Q = Closed OR DoorOpen", "Q = NOT Closed AND DoorOpen",
             "Q = NOT (Closed AND DoorOpen)"],
            fb="Both conditions have to be true, which is AND.",
            diff="apply"),
        mcq("A greenhouse heater turns on when the temperature is low AND the window is "
            "not open. Which expression describes it?",
            "Q = Low AND NOT Open",
            ["Q = Low AND Open", "Q = NOT Low AND Open", "Q = Low OR NOT Open"],
            fb="'Not open' is NOT applied to Open; both conditions are needed, so AND.",
            diff="apply", exam=True),
        written("A hospital lift will only move when the doors are closed and either the "
                "inside button or the outside button has been pressed. Write a Boolean "
                "expression for this, and explain what each operator does.", 3,
                # A mark point cannot be written on the words AND and OR: they are
                # what the marker splits an answer into clauses on, so they are
                # gone before anything is looked for. These look for what the
                # operators mean instead, which is what the question asks for.
                [mp("both the door condition and a button are required",
                    ["both|as well as|at the same time|all of|two conditions|requires both|"
                     "every condition|together|parts to hold"],
                    exemplar="The doors must be closed as well as a button being pressed."),
                 mp("either button on its own is enough",
                    ["either|one of|at least one|any of the|one button|just one|"
                     "whichever|it does not matter which"],
                    exemplar="Either of the two buttons will do on its own."),
                 mp("and the OR is bracketed, so it is worked out before the AND",
                    ["bracket|brackets|parenthes|first|before the and|grouped"],
                    developed=True,
                    exemplar="The OR is in brackets so that it is worked out before the AND.")],
                example="Q = Closed AND (Inside OR Outside). The AND means the doors must be "
                        "closed as well as a button being pressed; the OR means either button "
                        "will do; and the brackets make sure the OR is worked out first, so "
                        "that the lift cannot move with the doors open just because a button "
                        "was pressed.",
                paraphrase="Writing it as Closed AND (Inside OR Outside): the AND requires "
                           "both parts to hold, the OR accepts either button, and the "
                           "brackets are there so that the button test is worked out "
                           "first.",
                fb="What each operator requires, and what the brackets do. The brackets "
                   "are the mark most answers miss, and without them the expression means "
                   "something else.",
                hint="Which part has to be worked out first for the expression to mean what "
                     "the question says?",
                diff="stretch", exam=True),
        sort("A security light comes on when it is dark AND movement is detected. Sort each "
             "situation by whether the light comes on.",
             ["Light on", "Light off"],
             [["Dark, movement detected", "Light on"],
              ["Dark, no movement", "Light off"],
              ["Daylight, movement detected", "Light off"],
              ["Daylight, no movement", "Light off"]],
             fb="AND needs both. Only the first row has both.",
             diff="apply"),
        tf("In the expression Q = A OR B AND C, the AND is worked out before the OR.", True,
           fb="True. AND binds more tightly than OR, which is why brackets are used to make "
              "the intention clear.",
           diff="stretch"),
    ]),
]
