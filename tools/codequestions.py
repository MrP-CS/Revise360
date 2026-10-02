"""Code-writing questions - practice for Paper 2 Section B.

A pupil writes Python in the built-in editor and the platform marks it by
running it against the test cases below. That is the only honest way to mark
it: comparing an answer with one model solution would fail every pupil who
solved it another way, which is most of them.

Writing one of these:

- `brief` is the specification. Say exactly what to print, because that is what
  is compared. Spacing and capitals are ignored, nothing else is.
- Every test's `in` is the lines the program will read with input(), in order.
  `out` is what it should print, one entry per line.
- Cover the ordinary case, the edges (zero, one, the boundary of a range) and
  anything the brief says to reject. A pupil who hard-codes the first answer
  should fail the second test.
- `marks` is the mark total; the award is the share of tests passed.
- `forbid` is for the one kind of rule running the code cannot check - "write
  the sort yourself" looks identical to sorted() from the outside. Use it
  sparingly: a structural rule punishes a pupil who solved it a different but
  valid way.

  python3 applycode.py            # show what would change
  python3 applycode.py --write
"""

QUESTIONS = [
 # ---- 2.1 Algorithms: writing one down ---------------------------------------
 ("al-l05", 3, {
   "hint": "pywhile", "t": "code", "marks": 3,
   "q": "Write a program that adds up the numbers from 1 to a number the user types in.",
   "brief": [
     "Read one whole number from the user.",
     "Add up every whole number from 1 up to and including that number.",
     "Print only the total."
   ],
   "starter": "# Read the number, add up 1 to that number, print the total\n",
   "tests": [
     {"in": ["5"], "out": ["15"], "why": "1+2+3+4+5 is 15."},
     {"in": ["1"], "out": ["1"], "why": "With 1, the loop should run once and the total is 1."},
     {"in": ["10"], "out": ["55"], "why": "A program that only works for one number will fail here."}
   ],
   "fb": "A for loop over a range, with a running total that starts at 0, is the shortest way."
 }),

 # ---- 2.1 Searching ----------------------------------------------------------
 ("al-l06", 4, {
   "hint": "searches", "t": "code", "marks": 4,
   "q": "Write a linear search. The program should say at which position a name is found, or that it is not there.",
   "brief": [
     "The list is already written for you - do not change it.",
     "Read one name from the user.",
     "If the name is in the list, print the position it is at, counting from 0.",
     "If it is not in the list, print: not found"
   ],
   "starter": "names = ['Ava', 'Ben', 'Chi', 'Dev', 'Eve']\n\n# Read a name, search the list, print the position or 'not found'\n",
   "tests": [
     {"in": ["Chi"], "out": ["2"], "why": "Chi is the third name, and counting from 0 that is position 2."},
     {"in": ["Ava"], "out": ["0"], "why": "The first item is at position 0, not 1."},
     {"in": ["Eve"], "out": ["4"], "why": "The last item has to be checked too - a loop that stops early will miss it."},
     {"in": ["Zoe"], "out": ["not found"], "why": "A name that is not in the list must print exactly: not found"}
   ],
   "fb": "Go through the list one at a time and compare. Remember the answer for a name that is never found."
 }),

 # ---- 2.1 Sorting ------------------------------------------------------------
 ("al-l08", 5, {
   "hint": "bubblesort", "t": "code", "marks": 4,
   "q": "Write a bubble sort. Sort five numbers into order, smallest first.",
   "brief": [
     "Read five whole numbers, one at a time.",
     "Sort them into order using a bubble sort - compare neighbours and swap them.",
     "Print the sorted numbers on one line, separated by a single space.",
     "Do not use Python's own sort."
   ],
   "starter": "nums = []\nfor i in range(5):\n    nums.append(int(input()))\n\n# Sort nums with a bubble sort, then print them separated by spaces\n",
   # Running the code cannot tell a bubble sort from sorted(), so this one thing
   # is checked by looking at the source.
   "forbid": [["sorted(", "The brief asks you to write the sort yourself, not use Python's sorted()."],
              [".sort(", "The brief asks you to write the sort yourself, not use Python's .sort()."]],
   "tests": [
     {"in": ["5", "1", "4", "2", "8"], "out": ["1 2 4 5 8"], "why": "Check your swap: both values have to move."},
     {"in": ["1", "2", "3", "4", "5"], "out": ["1 2 3 4 5"], "why": "A list already in order should come back unchanged."},
     {"in": ["9", "7", "5", "3", "1"], "out": ["1 3 5 7 9"], "why": "Reversed is the hardest case - it needs every pass."}
   ],
   "fb": "Two loops: the outer one repeats the passes, the inner one compares each neighbouring pair."
 }),

 # ---- 2.3 Validation ---------------------------------------------------------
 ("rp-l03", 5, {
   "hint": "pyvalidate", "t": "code", "marks": 4,
   "q": "Write a program that checks a password is long enough and keeps asking until it is.",
   "brief": [
     "Read a password from the user.",
     "If it is fewer than 8 characters, print: too short - and ask again.",
     "Keep asking until a password of 8 characters or more is typed.",
     "When one is accepted, print: accepted"
   ],
   "starter": "# Keep asking until the password is 8 characters or more\n",
   "tests": [
     {"in": ["longenough"], "out": ["accepted"], "why": "A password that is already long enough needs no second go."},
     {"in": ["abc", "password1"], "out": ["too short", "accepted"], "why": "A short one should print 'too short' and then ask again."},
     {"in": ["a", "bb", "ccccccccc"], "out": ["too short", "too short", "accepted"], "why": "It has to keep asking, however many times it takes."},
     {"in": ["12345678"], "out": ["accepted"], "why": "Exactly 8 characters is allowed - check whether you used < or <=."}
   ],
   "fb": "A while loop with the condition on the length, and the input inside it, is the usual shape."
 }),

 # ---- 2.3 Test data ----------------------------------------------------------
 ("rp-l05", 5, {
   "hint": "pyvalidate", "t": "code", "marks": 3,
   "q": "Write a program that accepts a mark only if it is from 0 to 50 inclusive.",
   "brief": [
     "Read one whole number.",
     "If it is from 0 to 50 inclusive, print: valid",
     "Otherwise print: invalid"
   ],
   "starter": "# Read a mark and decide whether it is valid\n",
   "tests": [
     {"in": ["27"], "out": ["valid"], "why": "An ordinary mark inside the range."},
     {"in": ["0"], "out": ["valid"], "why": "0 is the bottom boundary and is allowed."},
     {"in": ["50"], "out": ["valid"], "why": "50 is the top boundary and is allowed."},
     {"in": ["51"], "out": ["invalid"], "why": "Just outside the range - this is where < and <= get mixed up."},
     {"in": ["-1"], "out": ["invalid"], "why": "Below the range as well as above it."}
   ],
   "fb": "Inclusive means the boundaries pass. The test data here is exactly what boundary testing is for."
 }),

 # ---- 1.2 Working with text --------------------------------------------------
 ("ms-l12", 2, {
   "hint": "strslice", "t": "code", "marks": 3,
   "q": "Write a program that prints the character code of every letter in a word.",
   "brief": [
     "Read one word from the user.",
     "For each character in turn, print the character, a space, then its character code.",
     "Use ord() to find the code."
   ],
   "starter": "# Read a word and print each character with its code\n",
   "tests": [
     {"in": ["Cat"], "out": ["C 67", "a 97", "t 116"], "why": "One line per character, in the order they appear."},
     {"in": ["A"], "out": ["A 65"], "why": "A single letter should still work."},
     {"in": ["hi"], "out": ["h 104", "i 105"], "why": "Lower case letters have different codes to capitals."}
   ],
   "fb": "A for loop over the word gives you each character; ord() turns a character into its number."
 })
]
