"""2.4 Boolean logic: the questions that are not truth tables.

tools/revbank/t24.py is mostly truth tables, which is right - completing one is
the skill the paper tests. But a learner who can fill a table in and cannot read
a circuit diagram, write an expression from a sentence, or say which gate to use,
has half of 2.4. These are those questions, and none of them is a table.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written, sub, mp)

TOPIC = "2.4"

BANK = [

    # ============================================================ bl-l01
    sub("Reading the three gates", "bl-l01-s1", ["bl-l01-o1"], [
        mcq("A two-input AND gate has inputs A = 1 and B = 1. What is its output?",
            "1", ["0", "It depends on the gate", "Both 0 and 1"],
            fb="AND gives 1 only when every input is 1. This is that case.",
            diff="retrieve"),
        mcq("A two-input OR gate has inputs A = 0 and B = 0. What is its output?",
            "0", ["1", "It depends on the gate", "Both 0 and 1"],
            fb="OR gives 1 when at least one input is 1. Neither is, so the output is 0.",
            diff="retrieve"),
        mcq("A NOT gate has input A = 1. What is its output?",
            "0", ["1", "It has no output", "It depends on the other input"],
            fb="A NOT gate has one input and gives the opposite of it.",
            diff="retrieve"),
        multi("Which of these statements about logic gates are true? Tick all that apply.",
              ["An AND gate outputs 1 only when all of its inputs are 1",
               "An OR gate outputs 1 when at least one input is 1",
               "A NOT gate has exactly one input",
               "An OR gate outputs 0 only when all of its inputs are 0",
               "An AND gate outputs 1 when at least one input is 1",
               "A NOT gate has two inputs"],
              ["An AND gate outputs 1 only when all of its inputs are 1",
               "An OR gate outputs 1 when at least one input is 1",
               "A NOT gate has exactly one input",
               "An OR gate outputs 0 only when all of its inputs are 0"],
              fb="AND wants everything, OR wants anything, NOT takes one input and turns it "
                 "round.",
              diff="understand"),
        short("State when an AND gate outputs 1.",
              [mp("only when every one of its inputs is 1",
                  ["only|just|nothing else|unless",
                   "all|every|both|each|all of them|every input|every one"],
                  exemplar="Only when all of its inputs are 1.")],
              example="Only when every one of its inputs is 1. If any input is 0 the output "
                      "is 0.",
              paraphrase="Just in the case where each input is 1; a single 0 anywhere makes "
                         "the output 0.",
              fb="All of them. An answer that says 'when the inputs are 1' without the 'all' "
                 "has not said what makes AND different.",
              cw="state"),
        short("State when an OR gate outputs 1.",
              [mp("when at least one of its inputs is 1",
                  ["at least one|one or more|either|any|any of|a single|one of them|"
                   "one input|not all|does not need all"],
                  exemplar="When at least one of its inputs is 1.")],
              example="When at least one of its inputs is 1. It only outputs 0 when every "
                      "input is 0.",
              paraphrase="As soon as any single input is 1; the output is 0 only if they are "
                         "all 0.",
              fb="At least one. 'When the inputs are 1' would describe AND, not OR.",
              cw="state"),
    ]),

    sub("Symbols and pseudocode", "bl-l01-s4", ["bl-l01-o2"], [
        match("Match each way of writing the same logic to what it means.",
              [["A AND B", "Both A and B have to be true"],
               ["A OR B", "At least one of A and B has to be true"],
               ["NOT A", "A has to be false"],
               ["NOT (A AND B)", "A and B must not both be true"]],
              fb="The brackets in the last one change everything: it is the AND that is "
                 "negated, not A.",
              diff="understand", exam=True),
        mcq("In a circuit diagram, a gate drawn as a D-shape with a flat back is which gate?",
            "AND", ["OR", "NOT", "XOR"],
            fb="AND is the flat-backed D. OR has a curved back and a pointed nose, and NOT is "
               "a triangle with a small circle.",
            diff="retrieve"),
        mcq("A gate drawn as a triangle with a small circle on its output is which gate?",
            "NOT", ["AND", "OR", "XOR"],
            fb="The small circle is what means 'inverted'. The triangle on its own would just "
               "pass the signal through.",
            diff="retrieve"),
    ]),

    sub("Two-level circuits", "bl-l01-s5", ["bl-l01-o3"], [
        mcq("The output of an AND gate taking A and B is fed into a NOT gate. What expression "
            "does the circuit produce?",
            "Q = NOT (A AND B)",
            ["Q = NOT A AND B", "Q = NOT A AND NOT B", "Q = A AND NOT B"],
            fb="The AND happens first and the NOT is applied to its result, which is exactly "
               "what the brackets say.",
            diff="apply", exam=True),
        mcq("A and B each go through their own NOT gate, and both results go into an AND gate. "
            "What expression does the circuit produce?",
            "Q = NOT A AND NOT B",
            ["Q = NOT (A AND B)", "Q = NOT A AND B", "Q = A AND B"],
            fb="Each input is inverted before the AND, so each one needs its own NOT in the "
               "expression.",
            diff="apply", exam=True),
        order("Put these stages in the order a circuit for Q = NOT (A OR B) carries them out.",
              ["A and B arrive as inputs",
               "The OR gate combines A and B",
               "The NOT gate inverts the result of the OR",
               "Q leaves the circuit as the output"],
              fb="Working from the inputs towards the output is how a diagram is read, and the "
                 "order the brackets describe.",
              diff="understand"),
    ]),

    sub("NOT and brackets", "bl-l01-s6", ["bl-l01-o3"], [
        written("Explain why Q = NOT (A AND B) and Q = NOT A AND NOT B are not the same "
                "circuit.", 2,
                [mp("in the first, the AND is worked out and then inverted",
                    ["first|one|bracket|brackets|inside",
                     "worked out|worked out first|combined|combination|result|"
                     "invert the result|inverted afterwards|negated afterwards|"
                     "inverted after|negated after|inverts the output"],
                    exemplar="In the first, the AND is worked out and then the result is "
                             "inverted."),
                 mp("in the second each input is inverted before the AND",
                    ["second|other|two not gates|each input|both inputs|separately|"
                     "own not gate|inverted first|negated first|each one|"
                     "before they are combined|before combining"],
                    exemplar="In the second, each input is inverted before the AND sees it.")],
                example="In NOT (A AND B) the brackets are done first: A and B are combined by "
                        "the AND, and the result is inverted, so the output is 0 only when both "
                        "are 1. In NOT A AND NOT B each input is inverted on its own first, so "
                        "the output is 1 only when both are 0. The two circuits agree on two of "
                        "the four rows and disagree on the other two.",
                paraphrase="The brackets in the first mean the combination is formed and then "
                           "reversed, whereas in the second both inputs are reversed "
                           "individually before being combined.",
                fb="Which operation happens first in each. That is the whole difference.",
                hint="Try A = 1, B = 0 in both and compare.",
                diff="stretch", exam=True),
        tf("In the expression Q = NOT A AND B, the NOT applies only to A.", True,
           fb="Without brackets the NOT takes only the thing immediately after it. Brackets "
              "are the only way to make it apply to more.",
           exam=True),
    ]),

    # ============================================================ bl-l02
    sub("Reading a truth table", "bl-l02-s1", ["bl-l02-o1"], [
        mcq("A truth table for two inputs has an output of 1 on exactly one row, where A = 1 "
            "and B = 1. Which expression does it describe?",
            "Q = A AND B",
            ["Q = A OR B", "Q = NOT A AND B", "Q = NOT (A AND B)"],
            fb="One row of 1, and it is the row where both inputs are 1. That is AND.",
            diff="apply", exam=True),
        mcq("A truth table for two inputs has an output of 1 on three rows and 0 only where "
            "A = 0 and B = 0. Which expression does it describe?",
            "Q = A OR B",
            ["Q = A AND B", "Q = NOT A OR NOT B", "Q = NOT (A OR B)"],
            fb="OR is 0 only when every input is 0, which is the one row left.",
            diff="apply", exam=True),
        written("Explain why a truth table is a complete test of a logic circuit, when testing "
                "a program with every possible input is impossible.", 2,
                [mp("a logic circuit has only a small fixed number of input combinations",
                    ["small|few|only|fixed|limited|two|four|eight|sixteen|2|4|8|16|"
                     "every combination|all the combinations|all of them",
                     "input|inputs|combination|combinations|row|rows"],
                    exemplar="A circuit with three inputs has only eight possible "
                             "combinations."),
                 mp("so every one of them can be listed and checked",
                    ["list|listed|listing|write every one|write them down|"
                     "written out|verified|verify|nothing left out|exhaustive|"
                     "certain|tried"],
                    developed=True,
                    exemplar="This means every single one can be listed and checked.")],
                example="Each input is either 0 or 1, so a circuit with three inputs has only "
                        "eight possible combinations and one with four has sixteen. That is "
                        "few enough to write every one down and check it, which is why a truth "
                        "table proves a circuit works — a program taking a number could be "
                        "given billions of values and never be tested exhaustively.",
                paraphrase="Since every input can only be 0 or 1, the number of possibilities "
                           "is tiny and fixed, so all of them can be written out and verified "
                           "rather than sampled.",
                fb="How few combinations there are, and what being able to list them proves.",
                diff="stretch"),
    ]),

    sub("Counting the rows", "bl-l02-s4", ["bl-l02-o1"], [
        mcq("How many rows does a truth table need for an expression with two inputs?",
            "4", ["2", "6", "8"],
            fb="Two inputs, two choices each: 2 times 2 is 4.",
            diff="retrieve"),
        mcq("An expression has three inputs. A fourth input is added. What happens to the "
            "number of rows its truth table needs?",
            "It doubles", ["It goes up by one", "It goes up by two", "It stays the same"],
            fb="Each new input has two possible values, and every existing row has to be "
               "written out for both of them. 8 becomes 16.",
            diff="apply", exam=True),
        sort("Sort each expression by how many inputs it has.",
             ["One input", "Two inputs", "Three inputs"],
             [["Q = NOT A", "One input"],
              ["Q = A AND B", "Two inputs"],
              ["Q = NOT (A OR B)", "Two inputs"],
              ["Q = A AND (B OR C)", "Three inputs"],
              ["Q = (A AND B) OR C", "Three inputs"]],
             fb="Count the different letters, not the gates. NOT (A OR B) has two inputs and "
                "two gates.",
             diff="understand"),
    ]),

    # ============================================================ bl-l03
    sub("Writing an expression from a sentence", "bl-l03-s1", ["bl-l03-o1"], [
        mcq("A fan turns on when the room is hot AND the window is closed. Using H for hot and "
            "W for the window being open, which expression is right?",
            "Q = H AND NOT W",
            ["Q = H AND W", "Q = NOT (H AND W)", "Q = H OR NOT W"],
            fb="W stands for the window being OPEN, so 'closed' has to be written NOT W. "
               "Reading what each letter actually means is where most marks are lost.",
            diff="apply", exam=True),
        mcq("A door unlocks when a valid card is presented OR the fire alarm is sounding. "
            "Using C and F, which expression is right?",
            "Q = C OR F",
            ["Q = C AND F", "Q = NOT C OR F", "Q = NOT (C OR F)"],
            fb="Either condition on its own is enough, which is OR. A fire alarm that needed a "
               "card as well would be a dangerous door.",
            diff="apply"),
        mcq("A machine starts when the guard is closed AND either the green button OR the foot "
            "pedal is pressed. Using G, B and P, which expression is right?",
            "Q = G AND (B OR P)",
            ["Q = G AND B OR P", "Q = (G AND B) OR P", "Q = G OR (B AND P)"],
            fb="The brackets are what make the guard compulsory. Without them the machine "
               "could start on the pedal alone with the guard open.",
            diff="stretch", exam=True),
        written("A till gives a discount when the customer has a loyalty card AND is either a "
                "student OR over 65. Explain why the expression needs brackets.", 2,
                [mp("the card is needed in every case",
                    ["card|loyalty|first condition|c",
                     "always|every case|both|all|compulsory|must|needed|required|"
                     "whatever|regardless"],
                    exemplar="The loyalty card is needed whichever of the other two applies."),
                 mp("so the OR has to be worked out first and then combined with the card",
                    ["brackets make|brackets mean|brackets force|brackets group|"
                     "inside the brackets|happen first|happens first|worked out first|"
                     "evaluated first|done first|grouped|group|together|"
                     "combined with the card|before being combined"],
                    developed=True,
                    exemplar="So the OR must be worked out first, and its result combined with "
                             "the card by the AND.")],
                example="The loyalty card is needed in every case, and the student-or-over-65 "
                        "test is a choice between two ways of qualifying. The brackets make the "
                        "OR happen first, so its result is then ANDed with the card. Without "
                        "them, AND binds tighter than OR and somebody over 65 with no card "
                        "would get the discount.",
                paraphrase="Because the card is required whichever of the two other conditions "
                           "applies, those two must be grouped and evaluated together before "
                           "being combined with the card.",
                fb="What is always required, and what the brackets therefore have to group.",
                hint="What would happen without the brackets, for somebody over 65 and no "
                     "card?",
                diff="stretch", exam=True),
    ]),

    sub("Reading a diagram back into words", "bl-l03-s6", ["bl-l03-o1"], [
        mcq("A circuit takes inputs A and B. A goes into a NOT gate, and the result goes "
            "into an AND gate with B. When is the output 1?",
            "When A is 0 and B is 1",
            ["When A is 1 and B is 1", "When A is 0 and B is 0",
             "When A is 1 and B is 0"],
            fb="The NOT turns A round first, so the AND sees NOT A and B — and an AND needs "
               "both of the things it is given to be 1.",
            diff="apply", exam=True),
        sort("A circuit computes Q = NOT A AND B. Sort each pair of inputs by what Q is.",
             ["Q is 1", "Q is 0"],
             [["A = 0, B = 1", "Q is 1"], ["A = 0, B = 0", "Q is 0"],
              ["A = 1, B = 1", "Q is 0"], ["A = 1, B = 0", "Q is 0"]],
             fb="Only one of the four rows gives 1. Inverting A first is what moves it there "
                "from the row an ordinary AND would pick.",
             diff="apply", exam=True),
        tf("A circuit diagram and a truth table can describe exactly the same logic.", True,
           fb="They are two ways of writing the same thing, along with the expression. Being "
              "able to move between all three is what 2.4 asks for."),
    ]),
]
