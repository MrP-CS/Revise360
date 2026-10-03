"""Mark the prescribed data in every Python instruction, from the answers.

A task that says "Change the program so it remembers 25 instead of 10" is asking
for two exact values, and in a paragraph of prose they look like any other two
words. A pupil who misreads one writes a program that is nearly right and is
marked wrong, and cannot see why. So the data is marked in the instruction and
shown in the editor's own token colours: `25` is amber in the sentence and amber
again in their program a moment later.

This tool does the one-off marking. It does NOT read the sentence and guess
which words look like data - that gets "Display Age" wrong in both directions.
It takes the values from the authority: the model solution in answers/codebank,
the test inputs and the required output. Only a value that the solution actually
uses, and that appears verbatim in the instruction, is marked, and the form it
is marked in is the form it has in the program - a string with its quotes, a
number bare, a name bare.

After this has run the marking is authored content in tools/codebank/*.json, and
tools/tests/verifytok.py is what keeps it honest from then on.

    python3 tools/markdata.py            # report what it would mark
    python3 tools/markdata.py --write    # mark it
"""
import os
import re
import sys
import ast
import json
import glob

HERE = os.path.dirname(os.path.abspath(__file__))
BANK = os.path.join(HERE, "codebank")
KEYS = os.path.join(os.path.dirname(HERE), "answers", "codebank")

# Fields of a question that a pupil reads, and that may carry marked data.
TEXT = ("q", "fb")
LISTS = ("brief",)
HINT = ("think", "walk")          # `syntax` and `start` are whole code blocks already

# A brief line whose whole job is to state the required output verbatim. The
# data in it is already unmistakable - the line is nothing but the value after a
# colon - and the panel above it shows the same thing again as one real run. It
# is left unmarked because the marked form of a string carries its quotes, and
# "Display exactly: `"Goodbye"`" would teach a beginner that the quotation marks
# come out of print(). The sentence in `q` carries the marked form instead.
OUTPUT_LINE = re.compile(r"^(?:then\s+)?displays?\s+exactly\b", re.I)

# Words that are a Python name in the solution and an ordinary English word in
# the sentence. Marking "name" every time it appears turns the boxes into noise,
# so a bare name is marked only where the sentence is naming it - "a variable
# called name", "in name" - which NAMED below decides.
NAMED = re.compile(
    r"(?:called|named|variable|constant|list|store(?:s|d)? (?:it )?in|into|holding|holds)\s*$",
    re.I)
# "two lists called left and right" names both of them.
ALSO = re.compile(r"`[^`]+`\s*(?:,|and|or)\s*$", re.I)
# "called" and "named" are the only openings that can introduce a one or two
# letter name. Without that, "turns a procedure into a function" puts a box
# round the article, because "into" is one of the words that introduces a name.
DECLARE = re.compile(r"(?:called|named)\s*$", re.I)

# Once a question has said "a procedure called show", every later "show" in that
# question is the procedure - but only where the sentence is using it as a name.
# This is the list of things a name can follow. It is a list of allowed contexts
# rather than a list of banned words, because the banned list is endless: the
# question that declares a function called whole also says "two whole numbers",
# and the one that declares tag also says "a word and a tag". An article in front
# of it means it is being used as an ordinary noun, so it is left alone.
USE = re.compile(r"(?:^|[(\[,=:;]|'s|\b(?:call|calls|called|use|uses|used|inside|write|"
                 r"writes|from|what|which|how|than|with|into|to|and|or|then|display|"
                 r"column|columns|table|field|fields|key|row|rows|"
                 r"displays|run|runs|name|names|gives|give|does|do|is|are|was|were))\s*$", re.I)

# SQL names are different. A column called kind and a table called games are
# named in the CREATE TABLE line the pupil is given, so they are known exactly;
# and in this lesson's wording those words only ever mean the column or the
# table. They are marked wherever they appear rather than only after "called".
CREATE = re.compile(r"CREATE\s+TABLE\s+(\w+)\s*\(([^)]*)\)", re.I)


def sql_names(src):
    """The table and column names from a CREATE TABLE the question hands over."""
    out = []
    for m in CREATE.finditer(src or ""):
        out.append(m.group(1))
        for col in m.group(2).split(","):
            bits = col.strip().split()
            if bits:
                out.append(bits[0])
    return out


# A string literal is a value in "Display pass when it is 40 or more" and an
# ordinary English word in "Display both when both are above 0". The second one
# is the whole reason not to guess from the sentence: "both" and "neither" and
# "member" are output values AND everyday words, and a box round the everyday use
# teaches a pupil to stop trusting the boxes. So a string is boxed only where the
# sentence is handing it over as a value - after "display", "the word", "is",
# "as", "to". The deciding word is the one in FRONT of it: "Display both" is
# prescribing the word, "when both are above 0" is using it. "when" is therefore
# not on the list, and neither are "both", "neither" or an article.
STR_LEAD = re.compile(
    r"""(?:^|[(\['"]|[,;:](?=\s)|\b(?:display|displays|displayed|shows?|says?|word|words|"""
    r"""message|line|text|letter|letters|value|values|to|as|is|are|was|were|of|"""
    r"""exactly|gives?|holds?|contains?|called|named|put|puts|write|writes|reads?|"""
    r"""with|and|or|than|between|either|then|next|first|second|third|"""
    r"""finally|also|against))\s*$""", re.I)
# A one-word lowercase string is the hard case: "lines", "done", "both" are
# values in this course AND words of its sentences. For those the word in front
# has to be one that hands a value over. "a list of lines" and "the lines it
# already holds" are the sentence talking; "Display the line lines" is not.
STR_LEAD_WORD = re.compile(
    r"""(?:^|[(\['"]|[,;:](?=\s)|\b(?:display|displays|displayed|word|words|line|message|"""
    r"""text|value|to|as|is|are|always|against|between|either|not|type|write|writes|"""
    r"""called|named|or|and|then))\s*$""",
    re.I)
# A word the question offers as one of two answers - "the word member or the word
# guest" - is only ever boxed in that construction. The typed values of a test are
# ordinary English words as often as not ("four words, one on each line"), and a
# box round that "one" would be nonsense.
OFFERED_LEAD = re.compile(r"\b(?:the words?|or(?:\s+the\s+words?)?)\s*$", re.I)

# A filename says what it is: it has a dot in it and only ever means the file.
FILENAME = re.compile(r"^[\w-]+\.[a-z]{2,4}$")
# A run of three or more numbers - "5, 4, 3, 2, 1", "0, 1 and 2", "5, 2 and 9" -
# is marked all or not at all. "Display the numbers 1, 2, 3, 4, 5 and 6" is a
# listing of the output, and boxing whichever of them happen to appear in the
# answer gives "`1`, 2, `3`, 4, 5 and `6`", which says the 2 and the 4 are
# optional. But "row 1 holds the numbers 5, 2 and 9" is the list the pupil has to
# write, and every number in it is prescribed. Whether every number in the run is
# a known value is what tells the two apart.
ENUM = re.compile(r"-?\d+(?:\s*(?:,|and|or)\s*-?\d+){2,}")
# The two ends of a range go together too. A program that counts 1 to 5 is
# written range(1, 6), so the 6 is a known value and the 5 is not; boxing the one
# the answer happens to contain would give "from `1` to 5", which reads as though
# only the start mattered. Both ends, or neither.
RANGE = re.compile(r"-?\d+\s*(?:to|up to|through|into|and then)\s*"
                   r"(?:a |an |the )?-?\d+", re.I)
NUMBER = re.compile(r"-?\d+(?:\.\d+)?")

# A number in a cross-reference is not data: "which you met in lesson 2" is
# pointing at a lesson, and a box round the 2 says the pupil must type it.
NUM_NOT = re.compile(r"\b(?:lesson|station|question|unit|page|attempt|chapter|"
                     r"section|activity|task|step|line)\s*$", re.I)


def literals(src):
    """Every string and number literal in a program, as (python_form, bare).

    Parsed, not matched: a # inside a string is not a comment and a 25 inside a
    name is not a number, and only a parser is reliably right about both.
    """
    out = []
    try:
        tree = ast.parse(src)
    except SyntaxError:
        return out
    for node in ast.walk(tree):
        # -1 is a minus applied to a 1, so the literal on its own would box the
        # 1 and leave the sign in the prose: "until they type -`1`". The sentinel
        # is the whole of -1, so the whole of it is taken.
        if (isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub)
                and isinstance(node.operand, ast.Constant)
                and isinstance(node.operand.value, (int, float))
                and not isinstance(node.operand.value, bool)):
            seg = (ast.get_source_segment(src, node) or "").replace(" ", "")
            if seg:
                out.append((seg, seg))
            continue
        if isinstance(node, ast.Constant):
            if isinstance(node.value, str):
                out.append(('"%s"' % node.value.replace('"', '\\"'), node.value))
            elif isinstance(node.value, bool):
                out.append((str(node.value), str(node.value)))
            elif isinstance(node.value, (int, float)):
                # The source spelling, so 3.50 does not become 3.5 and "007"
                # does not become 7. ast gives the value; the segment gives the
                # text that was written.
                seg = ast.get_source_segment(src, node) or str(node.value)
                out.append((seg, seg))
    return out


def names(src):
    """Names the program creates: variables, constants, loop counters, functions."""
    out = []
    try:
        tree = ast.parse(src)
    except SyntaxError:
        return out
    for node in ast.walk(tree):
        if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
            out.append(node.id)
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            out.append(node.name)
            for a in node.args.args:
                out.append(a.arg)
    return out


def worth_marking(form, bare):
    """Is this value identifiable in a sentence at all?

    A one-character string is not: the "," in line.split(",") would match the
    comma in half the sentences in the course, and a box round a comma teaches
    nobody anything. Numbers are kept at any length, because a threshold of 5 is
    exactly the kind of value a pupil misreads.
    """
    if form != bare:                               # a quoted string
        return len(bare) >= 2 and any(c.isalnum() for c in bare)
    return True


def marked_spans(text):
    """Where nothing may be marked: an existing box, and a [placeholder].

    The course already writes a value it is describing rather than giving in
    square brackets - "displays [word]: [tag]" - and a box inside one of those
    would say the opposite of what the brackets mean, which is that the pupil
    works this part out.
    """
    return ([(m.start(), m.end()) for m in re.finditer(r"`[^`]*`", text)] +
            [(m.start(), m.end()) for m in re.finditer(r"\[[^\]]*\]", text)])


def inside(spans, a, b):
    return any(s <= a and b <= e for s, e in spans)


def splits_output(text, outs, a, b):
    """Would this box cover only PART of a line the program has to display?

    "Finish the program so it displays Score: 10." prescribes the whole of
    "Score: 10"; a box round the 10 alone says the Score: part is ordinary prose
    and the pupil may write what they like. One box round the whole line is
    right, and no box is better than half of one, so a mark that lands inside a
    required output line without covering it is dropped.
    """
    for o in outs:
        if len(o) < 2:
            continue
        i = text.find(o)
        while i >= 0:
            j = i + len(o)
            if a < j and i < b and not (a <= i and j <= b):
                return True
            i = text.find(o, i + 1)
    return False


def mark(text, values, free=(), introduced=None, outs=(), is_brief=False, offered=()):
    """Mark each known value where it appears, longest first.

    Longest first so "Age: 13" is one box rather than a box round 13 inside a
    sentence about Age. Word boundaries on both sides, so the 25 in "£25.99" and
    the name in "names" are left alone.
    """
    if introduced is None:
        introduced = set()
    if not isinstance(text, str) or not text:
        return text, 0
    if is_brief and OUTPUT_LINE.search(text.strip()):
        return text, 0
    known = {bare for form, bare in values if NUMBER.fullmatch(bare)}
    hits = 0
    for form, bare in sorted(values, key=lambda v: -len(v[1])):
        if not bare or not worth_marking(form, bare):
            continue
        i = 0
        while True:
            spans = marked_spans(text)
            m = re.search(r"(?<![\w`\"'])" + re.escape(bare) + r"(?![\w`\"'])", text[i:])
            if not m:
                break
            a, b = i + m.start(), i + m.end()
            if inside(spans, a, b) or splits_output(text, outs, a, b):
                i = b
                continue
            before = text[:a]
            # A bare name is only marked where the sentence is naming it. A
            # literal - a string with its quotes, a number - needs no such test:
            # the value is the value wherever it appears.
            if form.startswith('"'):
                lead = before
                if FILENAME.match(bare):
                    pass                      # unambiguous wherever it appears
                elif bare in offered:
                    if not OFFERED_LEAD.search(lead):
                        i = b
                        continue
                elif re.match(r"^[a-z]+$", bare):
                    if not STR_LEAD_WORD.search(lead):
                        i = b
                        continue
                elif not STR_LEAD.search(lead):
                    i = b
                    continue
            elif re.match(r"^-?[\d.]+$", bare):
                if NUM_NOT.search(before.rstrip()):
                    i = b
                    continue
                run = next((m for pat in (ENUM, RANGE) for m in pat.finditer(text)
                            if m.start() <= a and b <= m.end()), None)
                if run and not all(n in known for n in NUMBER.findall(run.group(0))):
                    i = b
                    continue
            if bare == form and re.match(r"^[A-Za-z_]\w*$", bare):
                lead = before.rstrip()
                declared = DECLARE.search(lead) or ALSO.search(lead)
                if declared:
                    introduced.add(bare)
                elif bare in free and len(bare) >= 3:
                    # a name this question has already declared, or an SQL column
                    if not USE.search(lead):
                        i = b
                        continue
                elif len(bare) < 3 or not NAMED.search(lead):
                    i = b
                    continue
            text = before + "`" + form + "`" + text[b:]
            i = a + len(form) + 2
            hits += 1
    return text, hits


def values_for(q, solution):
    """The data this question prescribes, taken from the answer and the starter.

    Only values the PROGRAM contains. A value that arrives by input() is not
    marked as program data - the "One run of your program" panel is where a pupil
    reads what is typed in - and a value that is in the program is marked even
    when a test happens to type the same number in, because 18 in `if n >= 18`
    is a threshold the pupil has to write down.
    """
    out = []
    seen = set()
    free = set()                 # names that need no "called" in front of them
    offered = set()              # words the question offers as alternatives

    def add(form, bare):
        if (form, bare) not in seen:
            seen.add((form, bare))
            out.append((form, bare))

    for form, bare in literals(solution or ""):
        add(form, bare)
    # A starter already contains some of these; they are still prescribed data,
    # and a task that says to change one of them needs it marked.
    for form, bare in literals(q.get("starter") or ""):
        add(form, bare)
    for n in names(solution or ""):
        add(n, n)
    # A word the question offers as an alternative - "the word member or the word
    # guest" - is prescribed data even when only one of the two is written into
    # the answer, because the other one is what the else branch is for. The typed
    # values are where those words are recorded, so they are candidates too; the
    # strict "the word X" test is what keeps them from being boxed in prose.
    for t in q.get("tests") or []:
        for v in (t.get("in") or []):
            v = str(v)
            if re.match(r"^[A-Za-z][A-Za-z ]*$", v):
                # Only a word the ANSWER does not contain. One the answer does
                # contain is a value of the program and is marked as one.
                if ('"%s"' % v, v) not in seen:
                    offered.add(v)
                add('"%s"' % v, v)
    for n in sql_names((solution or "") + "\n" + (q.get("starter") or "")):
        add(n, n)
        free.add(n)
    return out, free, offered


def walk(q, values, free, offered=()):
    """Mark every field of one question. Returns the number of boxes added.

    Twice over. The first pass marks a name only where the question declares it -
    "a procedure called show". The second pass then knows that `show` is a name
    in this question, so "Call show once for each word" is marked too. One pass
    cannot do it: marking every "show" from the start would box the English verb
    in a question that never declares one.
    """
    declared = set()
    hits = _pass(q, values, set(free), declared, offered)
    # One and two letter names are never freed: a question that declares a
    # variable called a also contains the word "a" forty times.
    extra = {n for n in declared if len(n) >= 3} - set(free)
    if extra:
        hits += _pass(q, values, set(free) | extra, set(), offered)
    return hits


def _pass(q, values, free, introduced, offered=()):
    outs = []
    for t in q.get("tests") or []:
        for line in (t.get("out") or []):
            if line:
                outs.append(str(line))
    hits = 0
    for key in TEXT:
        if isinstance(q.get(key), str):
            q[key], n = mark(q[key], values, free, introduced, outs, False, offered)
            hits += n
    for key in LISTS:
        if isinstance(q.get(key), list):
            done = []
            for item in q[key]:
                item, n = mark(item, values, free, introduced, outs, True, offered)
                hits += n
                done.append(item)
            q[key] = done
    h = q.get("hint")
    if isinstance(h, dict):
        for key in HINT:
            v = h.get(key)
            if isinstance(v, str):
                h[key], n = mark(v, values, free, introduced, outs, False, offered)
                hits += n
            elif isinstance(v, list):
                done = []
                for item in v:
                    item, n = mark(item, values, free, introduced, outs, False, offered)
                    hits += n
                    done.append(item)
                h[key] = done
    return hits


def main(argv):
    write = "--write" in argv
    show = "--show" in argv
    total = 0
    touched = 0
    for path in sorted(glob.glob(os.path.join(BANK, "pr-l*.json"))):
        lesson = os.path.basename(path)[:-5]
        bank = json.load(open(path, encoding="utf-8"))
        kp = os.path.join(KEYS, lesson + ".json")
        sols = json.load(open(kp, encoding="utf-8"))["solutions"] if os.path.exists(kp) else {}
        hits = 0
        for q in bank["questions"]:
            before = json.dumps(q, ensure_ascii=False)
            vals, free, offered = values_for(q, sols.get(q["id"], ""))
            n = walk(q, vals, free, offered)
            hits += n
            if n:
                touched += 1
            if show and n:
                print("  " + q["id"] + ": " + q["q"])
        total += hits
        print("%-10s %3d question(s), %3d value(s) marked" % (lesson, len(bank["questions"]), hits))
        if write:
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(bank, fh, ensure_ascii=False, indent=1)
                fh.write("\n")
    print()
    print("%d value(s) marked across %d question(s)%s"
          % (total, touched, "" if write else " - nothing written, pass --write"))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
