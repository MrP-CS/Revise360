/* Revise 360 - the Python syntax reference.
 *
 * The teacher's class works from a book that "gives the syntax required and an
 * explanation as to what they do", and asked for the same thing here. This is
 * it: the data behind the Syntax button on every coding question, which calls
 * R360Ref.upTo(lessonNumber) and shows every group the course has reached.
 *
 * What it is, and what it is carefully not:
 *
 *   - It answers "how do I write it?", never "what is the answer?". Each entry
 *     is one construct, one sentence, and an example on ordinary data - colours,
 *     animals, a few numbers. No entry is a program that satisfies any brief in
 *     tools/codebank/, and no example borrows a question's scenario or data.
 *   - Nothing appears before the lesson that teaches it. The lesson numbers and
 *     the contents of each group come from tools/codebank/pr-l01.json to
 *     pr-l13.json, station by station, so a pupil on lesson 4 cannot look up a
 *     list method and a pupil on lesson 11 can look up the swap that a sort
 *     needs. Lesson 11 brings in nothing of its own but the swap, list slicing,
 *     and joining a list that is already text onto one line. Building a line up
 *     with str() a value at a time sits in lesson 8 instead, which is where
 *     printing a row or a column of a grid on one line first asks for it.
 *   - Where a question's model answer needs a construct, the construct is here.
 *     while True and break are not in any taught example in the bank, but four
 *     of lesson 12's solutions use them, so they are in the lesson 12 group: a
 *     pupil cannot be asked for something the course never shows them.
 *   - It is short. A reference nobody can skim is a reference nobody opens, so
 *     `what` is one sentence and `eg` is one or two lines wherever one or two
 *     lines can show the thing honestly. Blocks that cannot be shown in two -
 *     if/else, a running total, global - run to four or five.
 *
 * Every example below was run under Python 3 and its output compared with the
 * egOut written here, by tools/verifyref.py. The file examples run against a
 * notes.txt holding "red\nblue\n"; the SQL examples run against a table pet
 * holding rex/dog/5, mitts/cat/2 and sooty/cat/7, which is also the table the
 * SQL group's own examples describe. Where an example reads input, the value
 * the user typed is in a comment, exactly as the taught examples in the
 * question bank write it, and the prompt is not part of the output - the marker
 * does not echo prompts either (see js/pyworker.js).
 *
 * Shape:
 *   { name, lesson, items: [ { syntax, what, eg: [..], egOut: [..] } ] }
 * egOut is left out when the example prints nothing.
 */
(function () {
  "use strict";

  const GROUPS = [

    /* ---- Lesson 1: first programs ------------------------------------- */
    {
      name: "Output and variables", lesson: 1, items: [
        {
          syntax: 'print(something)',
          what: "Shows one line on the screen; text to show goes in quotation marks.",
          eg: ['print("Good morning")'],
          egOut: ["Good morning"]
        },
        {
          syntax: 'print(one, two)',
          what: "Shows two values on the same line, with one space put between them. The other way is to join them yourself with + and str(), which is what the lessons do, because then you decide where every space goes.",
          eg: ['print("socks", 3)'],
          egOut: ["socks 3"]
        },
        {
          syntax: 'variable = value',
          what: "Stores a value under a name, throwing away whatever that name held before.",
          eg: ['colour = "amber"', 'print(colour)'],
          egOut: ["amber"]
        },
        {
          syntax: 'NAME = value',
          what: "A constant: a variable written in capitals to show that it must never change.",
          eg: ['SPEED_LIMIT = 30', 'print(SPEED_LIMIT)'],
          egOut: ["30"]
        },
        {
          syntax: '"text" + "text"',
          what: "Joins two pieces of text into one, adding no space of its own.",
          eg: ['print("sun" + "flower")'],
          egOut: ["sunflower"]
        },
        {
          syntax: '# a note',
          what: "A comment: everything after the # is for people to read and Python ignores it.",
          eg: ['print("ready")   # this part is ignored'],
          egOut: ["ready"]
        }
      ]
    },
    {
      name: "Reading input, and types", lesson: 1, items: [
        {
          syntax: 'input(prompt)',
          what: "Waits for the user to type a line and hands back what they typed, always as text.",
          eg: ['animal = input("Animal? ")   # the user types otter', 'print("You chose", animal)'],
          egOut: ["You chose otter"]
        },
        {
          syntax: 'int(text)',
          what: "Turns text into a whole number, so that sums can be done with what was typed.",
          eg: ['age = int(input("Age? "))   # the user types 14', 'print("Next year", age + 1)'],
          egOut: ["Next year 15"]
        },
        {
          syntax: 'float(text)',
          what: "Turns text into a number that is allowed a decimal part.",
          eg: ['mass = float(input("Mass? "))   # the user types 2', 'print("Mass is", mass)'],
          egOut: ["Mass is 2.0"]
        },
        {
          syntax: 'str(number)',
          what: "Turns a number into text, so that + can join it onto other text.",
          eg: ['legs = 8', 'print("Legs: " + str(legs))'],
          egOut: ["Legs: 8"]
        }
      ]
    },

    /* ---- Lesson 2: arithmetic ----------------------------------------- */
    {
      name: "Arithmetic", lesson: 2, items: [
        {
          syntax: 'a + b    a - b    a * b',
          what: "Adds, takes away and multiplies two numbers.",
          eg: ['print(7 + 2, 7 - 2, 7 * 2)'],
          egOut: ["9 5 14"]
        },
        {
          syntax: 'a / b',
          what: "Divides, and the answer always keeps a decimal part, even when it goes exactly.",
          eg: ['print(9 / 2, 8 / 2)'],
          egOut: ["4.5 4.0"]
        },
        {
          syntax: 'a // b',
          what: "Divides and throws the fraction away, so it says how many whole lots fit (OCR calls it DIV).",
          eg: ['print(17 // 5)'],
          egOut: ["3"]
        },
        {
          syntax: 'a % b',
          what: "Gives what is left over after dividing (OCR calls it MOD).",
          eg: ['print(17 % 5)'],
          egOut: ["2"]
        },
        {
          syntax: 'a ** b',
          what: "Raises a number to a power, and a power of 0.5 is the square root.",
          eg: ['print(2 ** 5, 49 ** 0.5)'],
          egOut: ["32 7.0"]
        },
        {
          syntax: 'round(number, places)',
          what: "Rounds a number, keeping as many decimal places as you ask for, or to a whole number if you ask for none.",
          eg: ['print(round(8.476, 2))', 'print(round(8.476))'],
          egOut: ["8.48", "8"]
        },
        {
          syntax: 'random.randint(low, high)',
          what: "Picks a whole number from low to high, and both of those ends can come up.",
          eg: ['import random', 'roll = random.randint(1, 6)   # 1, 2, 3, 4, 5 or 6']
        }
      ]
    },

    /* ---- Lesson 3: selection ------------------------------------------ */
    {
      name: "Deciding with if", lesson: 3, items: [
        {
          syntax: 'if condition:',
          what: "Runs the indented lines underneath only when the condition is true.",
          eg: ['if 8 > 3:', '    print("bigger")'],
          egOut: ["bigger"]
        },
        {
          syntax: 'else:',
          what: "Runs its own indented lines when the if above it was false.",
          eg: ['if 4 > 9:', '    print("bigger")', 'else:', '    print("smaller")'],
          egOut: ["smaller"]
        },
        {
          syntax: 'elif condition:',
          what: "Asks a further question, but only when every if and elif above it was false.",
          eg: ['mark = 55', 'if mark >= 70:', '    print("high")', 'elif mark >= 40:', '    print("middle")'],
          egOut: ["middle"]
        }
      ]
    },
    {
      name: "Comparing and combining", lesson: 3, items: [
        {
          syntax: 'a == b    a != b',
          what: "Asks whether two values are the same, or are not the same; one = would store a value instead of asking.",
          eg: ['print(5 == 5, 5 != 5)'],
          egOut: ["True False"]
        },
        {
          syntax: 'a < b    a > b    a <= b    a >= b',
          what: "Asks which of two values is the smaller or the bigger, and <= and >= allow them to be equal.",
          eg: ['print(4 < 4, 4 <= 4)'],
          egOut: ["False True"]
        },
        {
          syntax: 'condition and condition',
          what: "True only when both sides are true, and each side needs a full comparison of its own.",
          eg: ['print(5 < 10 and 3 > 1, 5 < 10 and 3 > 9)'],
          egOut: ["True False"]
        },
        {
          syntax: 'condition or condition',
          what: "True when at least one of the two sides is true.",
          eg: ['print(2 > 7 or 3 == 3)'],
          egOut: ["True"]
        },
        {
          syntax: 'not condition',
          what: "Turns true into false, and false into true.",
          eg: ['print(not 3 == 3)'],
          egOut: ["False"]
        }
      ]
    },

    /* ---- Lesson 4: count-controlled loops ----------------------------- */
    {
      name: "Counting loops", lesson: 4, items: [
        {
          syntax: 'for i in range(stop):',
          what: "Repeats the indented lines, with i counting 0, 1, 2 up to one less than stop.",
          eg: ['for i in range(3):', '    print(i)'],
          egOut: ["0", "1", "2"]
        },
        {
          syntax: 'for i in range(start, stop):',
          what: "Counts from start and stops before stop, so to finish on 10 you write range(1, 11).",
          eg: ['for i in range(1, 4):', '    print(i)'],
          egOut: ["1", "2", "3"]
        },
        {
          syntax: 'for i in range(start, stop, step):',
          what: "Counts in steps of your own size, and a step of -1 counts downwards.",
          eg: ['for n in range(5, 2, -1):', '    print(n)'],
          egOut: ["5", "4", "3"]
        },
        {
          syntax: 'total = total + value',
          what: "A running total: set it to 0 before the loop, add to it inside the loop, print it after.",
          eg: ['total = 0', 'for n in range(1, 4):', '    total = total + n', 'print(total)'],
          egOut: ["6"]
        }
      ]
    },

    /* ---- Lesson 5: condition-controlled loops ------------------------- */
    {
      name: "Loops that wait for a condition", lesson: 5, items: [
        {
          syntax: 'while condition:',
          what: "Repeats the indented lines for as long as the condition stays true, so something inside has to change it.",
          eg: ['n = 3', 'while n > 0:', '    print(n)', '    n = n - 1'],
          egOut: ["3", "2", "1"]
        },
        {
          syntax: 'while value != sentinel:',
          what: "Reads one value before the loop and the next at the bottom of it, stopping on the value that means finish.",
          eg: ['line = input()   # the user types 4', 'while line != "quit":', '    print(line)', '    line = input()   # then quit'],
          egOut: ["4"]
        },
        {
          syntax: 'if value > best:',
          what: "Keeps the biggest so far: start it low, and replace it whenever something bigger turns up.",
          eg: ['best = 0', 'if 6 > best:', '    best = 6', 'print(best)'],
          egOut: ["6"]
        }
      ]
    },

    /* ---- Lesson 6: strings -------------------------------------------- */
    {
      name: "Working with text", lesson: 6, items: [
        {
          syntax: 'len(thing)',
          what: "How many characters a piece of text holds.",
          eg: ['print(len("otter"))'],
          egOut: ["5"]
        },
        {
          syntax: 'text[position]',
          what: "The one character at that position, counting from 0, so the last one is at len() - 1.",
          eg: ['word = "otter"', 'print(word[0], word[4])'],
          egOut: ["o r"]
        },
        {
          syntax: 'text[-1]',
          what: "The last character, without having to work out how long the text is.",
          eg: ['print("otter"[-1])'],
          egOut: ["r"]
        },
        {
          syntax: 'text[start:end]',
          what: "A slice: the characters from start up to but not including end.",
          eg: ['print("anchor"[0:3])'],
          egOut: ["anc"]
        },
        {
          syntax: 'text.upper()    text.lower()',
          what: "Hands back a copy with every letter made capital, or made small, leaving the original as it was.",
          eg: ['print("Ferry".upper(), "Ferry".lower())'],
          egOut: ["FERRY ferry"]
        },
        {
          syntax: 'word in text',
          what: "True when the word appears somewhere inside the text, although it does not say where.",
          eg: ['print("paint" in "wet paint")'],
          egOut: ["True"]
        },
        {
          syntax: 'text.find(word)',
          what: "The position where the word first appears, or -1 when it is not in there at all.",
          eg: ['print("wet paint".find("paint"), "wet paint".find("dry"))'],
          egOut: ["4 -1"]
        },
        {
          syntax: 'for ch in text:',
          what: "Hands you the characters one at a time, starting at the front.",
          eg: ['for ch in "hi":', '    print(ch)'],
          egOut: ["h", "i"]
        },
        {
          syntax: 'text = text + more',
          what: "Builds longer text by joining more onto the end of what is there already.",
          eg: ['keep = ""', 'for ch in "a1b":', '    keep = keep + ch + "-"', 'print(keep)'],
          egOut: ["a-1-b-"]
        },
        {
          syntax: 'ord(character)    chr(code)',
          what: "ord() gives a character's number code and chr() turns a code back into a character.",
          eg: ['print(ord("a"), chr(98))'],
          egOut: ["97 b"]
        }
      ]
    },

    /* ---- Lesson 7: lists ---------------------------------------------- */
    {
      name: "Lists", lesson: 7, items: [
        {
          syntax: '[value, value, value]',
          what: "Makes a list, which holds many values in one variable.",
          eg: ['pets = ["cat", "dog"]', 'print(pets)'],
          egOut: ["['cat', 'dog']"]
        },
        {
          syntax: 'list[position]',
          what: "The item at that position, counting from 0, exactly as with text.",
          eg: ['pets = ["cat", "dog", "ant"]', 'print(pets[1])'],
          egOut: ["dog"]
        },
        {
          syntax: 'list[position] = value',
          what: "Replaces the item stored at that position and leaves the rest of the list alone.",
          eg: ['nums = [4, 9]', 'nums[0] = 7', 'print(nums)'],
          egOut: ["[7, 9]"]
        },
        {
          syntax: 'list.append(value)',
          what: "Adds a value onto the end of the list, making it one item longer.",
          eg: ['pets = ["cat"]', 'pets.append("dog")', 'print(pets)'],
          egOut: ["['cat', 'dog']"]
        },
        {
          syntax: 'len(list)',
          what: "How many items the list holds, so the last position is len(list) - 1.",
          eg: ['print(len([4, 9, 2]))'],
          egOut: ["3"]
        },
        {
          syntax: 'for item in list:',
          what: "Hands you each item of the list in turn, with no position numbers needed.",
          eg: ['for p in ["cat", "dog"]:', '    print(p)'],
          egOut: ["cat", "dog"]
        },
        {
          syntax: 'for i in range(len(list)):',
          what: "Counts the positions of the list, so list[i] is the item the loop has reached.",
          eg: ['pets = ["cat", "dog"]', 'for i in range(len(pets)):', '    print(i, pets[i])'],
          egOut: ["0 cat", "1 dog"]
        },
        {
          syntax: 'total / len(list)',
          what: "The average: a total shared out between however many items there are.",
          eg: ['nums = [5, 7, 9]', 'total = 5 + 7 + 9', 'print(total / len(nums))'],
          egOut: ["7.0"]
        },
        {
          syntax: 'list.remove(value)',
          what: "Takes the first item matching that value out of the list.",
          eg: ['pets = ["cat", "dog", "cat"]', 'pets.remove("cat")', 'print(pets)'],
          egOut: ["['dog', 'cat']"]
        },
        {
          syntax: 'del list[position]',
          what: "Takes out the item at that position, and everything after it shuffles up one place.",
          eg: ['pets = ["cat", "dog", "ant"]', 'del pets[0]', 'print(pets)'],
          egOut: ["['dog', 'ant']"]
        }
      ]
    },

    /* ---- Lesson 8: two-dimensional lists ------------------------------ */
    {
      name: "Grids: lists inside lists", lesson: 8, items: [
        {
          syntax: '[[a, b], [c, d]]',
          what: "A two-dimensional list: a list whose items are themselves lists, one for each row.",
          eg: ['grid = [[4, 9], [8, 1]]', 'print(grid)'],
          egOut: ["[[4, 9], [8, 1]]"]
        },
        {
          syntax: 'grid[row][column]',
          what: "The value in that row and that column, both counting from 0.",
          eg: ['grid = [[4, 9], [8, 1]]', 'print(grid[1][0])'],
          egOut: ["8"]
        },
        {
          syntax: 'grid[row]',
          what: "One whole row, which is an ordinary list you can print, measure or total.",
          eg: ['grid = [[4, 9], [8, 1]]', 'print(grid[0])'],
          egOut: ["[4, 9]"]
        },
        {
          syntax: 'len(grid)    len(grid[0])',
          what: "How many rows the grid has, and how many values are in one row.",
          eg: ['grid = [[4, 9, 3], [8, 1, 5]]', 'print(len(grid), len(grid[0]))'],
          egOut: ["2 3"]
        },
        {
          syntax: 'for row in grid:',
          what: "Hands you one whole row at a time, and a loop inside it walks along that row.",
          eg: ['for row in [[4, 9], [8, 1]]:', '    for v in row:', '        print(v)'],
          egOut: ["4", "9", "8", "1"]
        },
        {
          syntax: 'grid[r][column]',
          what: "To go down a column, keep the column number still and let the row number change.",
          eg: ['grid = [[4, 9], [8, 1]]', 'for r in range(len(grid)):', '    print(grid[r][1])'],
          egOut: ["9", "1"]
        },
        {
          syntax: 'line = line + str(item) + " "',
          what: "Numbers have to be made into text before they can be joined, so build the line up a number at a time and print it once at the end; the space left on the end of it is ignored when your answer is marked.",
          eg: ['line = ""', 'for n in [2, 5, 8]:', '    line = line + str(n) + " "', 'print(line)'],
          egOut: ["2 5 8 "]
        }
      ]
    },

    /* ---- Lesson 9: subprograms ---------------------------------------- */
    {
      name: "Subprograms", lesson: 9, items: [
        {
          syntax: 'def name():',
          what: "Gives a block of code a name, and its indented lines do nothing until something calls that name.",
          eg: ['def warn():', '    print("check the seals")', 'warn()'],
          egOut: ["check the seals"]
        },
        {
          syntax: 'def name(parameter):',
          what: "A parameter is a name in the brackets, and whatever you pass in arrives under that name.",
          eg: ['def shout(word):', '    print(word + "!")', 'shout("oi")'],
          egOut: ["oi!"]
        },
        {
          syntax: 'return value',
          what: "Hands a value back to the line that called it, for the caller to print or to store.",
          eg: ['def triple(n):', '    return n * 3', 'print(triple(4))'],
          egOut: ["12"]
        },
        {
          syntax: 'variable = value    (inside a def)',
          what: "A variable first given a value inside a subprogram is local: it exists only while that subprogram is running.",
          eg: ['def tidy():', '    box = "new"', '    print(box)', 'tidy()'],
          egOut: ["new"]
        },
        {
          syntax: 'global name',
          what: "Tells a subprogram to change the variable of that name outside it instead of making a local one.",
          eg: ['count = 0', 'def tick():', '    global count', '    count = count + 1', 'tick()', 'print(count)'],
          egOut: ["1"]
        }
      ]
    },

    /* ---- Lesson 10: files --------------------------------------------- */
    {
      name: "Files", lesson: 10, items: [
        {
          syntax: 'open(filename, "r")',
          what: '"r" opens a file that is already there so that it can be read.',
          eg: ['f = open("notes.txt", "r")', 'print(f.readline().strip())', 'f.close()'],
          egOut: ["red"]
        },
        {
          syntax: 'file.read()',
          what: "Brings the whole file back as one piece of text, newlines and all.",
          eg: ['f = open("notes.txt", "r")   # it holds red then blue', 'print("Contents:")', 'print(f.read())'],
          egOut: ["Contents:", "red", "blue", ""]
        },
        {
          syntax: 'file.readline()',
          what: "Reads only as far as the next newline, and that newline is still on the end of what comes back.",
          eg: ['f = open("notes.txt", "r")', 'first = f.readline().strip()', 'f.close()', 'print("First line is " + first)'],
          egOut: ["First line is red"]
        },
        {
          syntax: 'file.readlines()',
          what: "Reads the whole file into a list, with one line of it in each item.",
          eg: ['f = open("notes.txt", "r")', 'print(f.readlines())'],
          egOut: ["['red\\n', 'blue\\n']"]
        },
        {
          syntax: 'open(filename, "w")',
          what: '"w" opens a file for writing, and empties it first if it already held anything.',
          eg: ['f = open("notes.txt", "w")   # notes.txt is empty again', 'f.write("green\\n")', 'f.close()']
        },
        {
          syntax: 'file.write(text)',
          what: "Writes text into the file, adding no newline of its own, so put the \\n in yourself.",
          eg: ['f = open("notes.txt", "w")', 'f.write("green tea\\n")   # the \\n ends the line', 'f.close()']
        },
        {
          syntax: 'open(filename, "a")',
          what: '"a" means append: it writes onto the end and keeps everything already in the file.',
          eg: ['f = open("notes.txt", "a")', 'f.write("green\\n")   # notes.txt now ends with green', 'f.close()']
        },
        {
          syntax: 'file.close()',
          what: "Finishes with the file, and anything written is only safely in it once it is closed.",
          eg: ['f = open("notes.txt", "r")', 'f.close()   # the link to the file has gone']
        },
        {
          syntax: 'with open(filename, "r") as f:',
          what: "Does the same as open() and closes the file for you when the indented lines end.",
          eg: ['with open("notes.txt", "r") as f:', '    print(f.readline().strip())'],
          egOut: ["red"]
        },
        {
          syntax: 'text.strip()',
          what: "Hands back the text with the spaces and the newline taken off each end.",
          eg: ['print(len("red\\n"), len("red\\n".strip()))'],
          egOut: ["4 3"]
        },
        {
          syntax: 'text.split(",")',
          what: "Breaks a line into a list of its parts, cutting it at every comma.",
          eg: ['fields = "ash,blue,7".split(",")', 'print(fields[0], fields[2])'],
          egOut: ["ash 7"]
        },
        {
          syntax: 'text.split()',
          what: "With nothing in the brackets it cuts at the spaces instead, which turns a typed line into a list of words.",
          eg: ['words = "red blue green".split()', 'print(words)'],
          egOut: ["['red', 'blue', 'green']"]
        }
      ]
    },

    /* ---- Lesson 11: what searching and sorting add -------------------- */
    {
      name: "Swapping, slicing and printing a list", lesson: 11, items: [
        {
          syntax: 'list[a], list[b] = list[b], list[a]',
          what: "Swaps two items over in one line, which is the move every sort makes again and again.",
          eg: ['pair = [9, 4]', 'pair[0], pair[1] = pair[1], pair[0]', 'print(pair)'],
          egOut: ["[4, 9]"]
        },
        {
          syntax: 'list[start:stop]',
          what: "A slice of a list: a new list of the items from start up to but not including stop.",
          eg: ['nums = [2, 5, 8, 1]', 'print(nums[0:2], nums[2:])'],
          egOut: ["[2, 5] [8, 1]"]
        },
        {
          syntax: '" ".join(list)',
          what: "Puts a list whose items are already text onto one line, with one space between each of them.",
          eg: ['words = ["red", "blue", "green"]', 'print(" ".join(words))'],
          egOut: ["red blue green"]
        }
      ]
    },

    /* ---- Lesson 12: validation ---------------------------------------- */
    {
      name: "Checking what was typed", lesson: 12, items: [
        {
          syntax: 'text.isdigit()',
          what: "True when the text is all digits and not empty, so int() is safe to use on it.",
          eg: ['print("42".isdigit(), "4.2".isdigit())'],
          egOut: ["True False"]
        },
        {
          syntax: 'text.isalpha()',
          what: "True when the text is all letters and nothing else.",
          eg: ['print("AB".isalpha(), "A1".isalpha())'],
          egOut: ["True False"]
        },
        {
          syntax: 'text.isalnum()',
          what: "True when the text is all letters and digits, with no spaces or punctuation among them.",
          eg: ['print("ab12".isalnum(), "ab 12".isalnum())'],
          egOut: ["True False"]
        },
        {
          syntax: 'try:  ...  except ValueError:',
          what: "Runs the lines under try, and if they go wrong the lines under except run instead of the program stopping.",
          eg: ['try:', '    n = int("seven")', 'except ValueError:', '    print("not a number")'],
          egOut: ["not a number"]
        },
        {
          syntax: 'if value < low or value > high:',
          what: "A range check, and inclusive means the two end values are allowed, so only what is past them is refused.",
          eg: ['n = 10', 'if n < 1 or n > 10:', '    print("out of range")', 'else:', '    print("valid")'],
          egOut: ["valid"]
        },
        {
          syntax: 'if len(text) < low or len(text) > high:',
          what: "A length check: how many characters were typed, spaces counted in.",
          eg: ['word = "spaniel"', 'if len(word) < 8:', '    print("too short")'],
          egOut: ["too short"]
        },
        {
          syntax: 'while not entry.isdigit():',
          what: "Asking again: read once before the loop, then keep reading while what came back still breaks the rule.",
          eg: ['entry = input()   # the user types ten', 'while not entry.isdigit():', '    print("digits only")', '    entry = input()   # then 10', 'print(int(entry))'],
          egOut: ["digits only", "10"]
        },
        {
          syntax: 'while True:',
          what: "A loop with no condition to stop it, so something inside has to decide when it has finished.",
          eg: ['while True:', '    colour = input()   # the user types blue, then red', '    if colour == "red":', '        break', '    print("not red")'],
          egOut: ["not red"]
        },
        {
          syntax: 'break',
          what: "Leaves the loop immediately: the rest of that turn is skipped and no further turns are taken.",
          eg: ['for n in [4, 9, 2]:', '    if n == 9:', '        break', '    print(n)'],
          egOut: ["4"]
        }
      ]
    },

    /* ---- Lesson 13: SQL ----------------------------------------------- */
    {
      name: "Asking a table with SQL", lesson: 13, items: [
        {
          syntax: "SELECT column FROM table",
          what: "Picks the column wanted and the table it comes from - these examples all use a table pet holding rex dog 5, mitts cat 2 and sooty cat 7.",
          eg: ['SELECT name FROM pet'],
          egOut: ["rex", "mitts", "sooty"]
        },
        {
          syntax: "SELECT column, column FROM table",
          what: "Names more than one column, and they come back in the order you asked for them.",
          eg: ['SELECT name, age FROM pet'],
          egOut: ["rex 5", "mitts 2", "sooty 7"]
        },
        {
          syntax: "WHERE column = 'text'",
          what: "Keeps only the rows that match, and text being compared against goes in single quotes.",
          eg: ["SELECT name FROM pet WHERE kind = 'cat'"],
          egOut: ["mitts", "sooty"]
        },
        {
          syntax: "WHERE column > number",
          what: "Compares a number with >, <, >= or <=, so a rule about a number need not be an exact match.",
          eg: ['SELECT name FROM pet WHERE age > 4'],
          egOut: ["rex", "sooty"]
        },
        {
          syntax: "WHERE column <> value",
          what: "<> means is not equal to, so every row except the matching ones is kept.",
          eg: ["SELECT name FROM pet WHERE kind <> 'cat'"],
          egOut: ["rex"]
        },
        {
          syntax: "WHERE ... AND ...",
          what: "AND keeps a row only when both comparisons are true, and each side needs a comparison of its own.",
          eg: ["SELECT name FROM pet WHERE kind = 'cat' AND age > 4"],
          egOut: ["sooty"]
        },
        {
          syntax: "WHERE ... OR ...",
          what: "OR keeps a row when at least one of the comparisons is true.",
          eg: ["SELECT name FROM pet WHERE kind = 'rat' OR age > 4"],
          egOut: ["rex", "sooty"]
        },
        {
          syntax: "ORDER BY column",
          what: "Sorts the rows by one column, smallest or earliest first, and comes last of all: SELECT, FROM, WHERE, then ORDER BY.",
          eg: ['SELECT name, age FROM pet ORDER BY age'],
          egOut: ["mitts 2", "rex 5", "sooty 7"]
        },
        {
          syntax: "ORDER BY column DESC",
          what: "DESC turns the order round, so the biggest or latest comes first.",
          eg: ['SELECT name, age FROM pet ORDER BY age DESC'],
          egOut: ["sooty 7", "rex 5", "mitts 2"]
        },
        {
          syntax: 'for row in db.execute(query):',
          what: "Runs the query and hands back the rows it found, one row at a time.",
          eg: ['for row in db.execute("SELECT name FROM pet"):', '    print(row[0])'],
          egOut: ["rex", "mitts", "sooty"]
        },
        {
          syntax: 'row[position]',
          what: "One value out of a row, counting from 0 in the order the SELECT named the columns.",
          eg: ['for row in db.execute("SELECT name, age FROM pet"):', '    print(row[0], row[1])'],
          egOut: ["rex 5", "mitts 2", "sooty 7"]
        }
      ]
    }
  ];

  window.R360Ref = {
    /* Every group the course has reached by lesson n, in course order. The
     * viewer passes 99 when it cannot tell which lesson it is in, which means
     * "all of it". */
    upTo(n) {
      const lim = Number.isFinite(Number(n)) ? Number(n) : 99;
      return GROUPS.filter(g => g.lesson <= lim).sort((a, b) => a.lesson - b.lesson);
    }
  };
})();
