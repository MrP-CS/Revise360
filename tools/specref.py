"""What is known about the OCR specification, and how it is known.

A coverage map is only worth having if its references are real. This file holds
the facts that were CHECKED against OCR's own pages, the date they were checked
and where, separately from the topic numbering this course uses. Everything that
reads a specification reference reads it from here, so a claim cannot be made in
one document and contradicted in another.

What was checked, and what was not, is the point of the file. A map that looks
authoritative and was written from memory is worse than one that says where it
stops.
"""

# Checked at the source named below. These are OCR's own words for the
# components, their marks and their duration.
CHECKED = {
    "qualification": "GCSE Computer Science (9-1)",
    "code": "J277",
    "first_taught": "from 2020",
    "checked_on": "3 October 2026",
    "source": "https://www.ocr.org.uk/qualifications/gcse/"
              "computer-science-j277-from-2020/specification-at-a-glance/",
    "full_specification": "https://www.ocr.org.uk/Images/"
                          "558027-specification-gcse-computer-science-j277.pdf",
    "components": [
        {"code": "01", "name": "Computer systems", "marks": 80,
         "duration": "1 hour 30 minutes",
         "overview": "the central processing unit (CPU), computer memory and "
                     "storage, data representation, wired and wireless networks, "
                     "network topologies, system security and system software"},
        {"code": "02", "name": "Computational thinking, algorithms and programming",
         "marks": 80, "duration": "1 hour 30 minutes",
         "overview": "computational thinking: algorithms, programming techniques, "
                     "producing robust programs, computational logic and translators"},
    ],
}

# NOT checked against the specification document in this build. These are the
# topic numbers and titles this course uses, and they are on every worksheet and
# every slide. They are standard, but standard is not the same as verified, and
# the documents say so where they use them.
UNCHECKED_NOTE = (
    "The topic numbers and titles below are the ones this course uses on its "
    "worksheets and slides. They were not re-checked against the published "
    "specification document when this map was built: the document could not be "
    "retrieved from this build environment. Check them against %s before relying "
    "on this map for a scheme of work, and treat any finer subdivision as absent "
    "rather than assumed - no sub-point numbers are claimed anywhere in these "
    "documents, because none were verified."
) % CHECKED["full_specification"]

TOPICS = {
    "1.1": ("Systems architecture", "01"),
    "1.2": ("Memory and storage", "01"),
    "1.3": ("Computer networks, connections and protocols", "01"),
    "1.4": ("Network security", "01"),
    "1.5": ("Systems software", "01"),
    "1.6": ("Ethical, legal, cultural and environmental impacts of digital technology", "01"),
    "2.1": ("Algorithms", "02"),
    "2.2": ("Programming fundamentals", "02"),
    "2.3": ("Producing robust programs", "02"),
    "2.4": ("Boolean logic", "02"),
    "2.5": ("Programming languages and Integrated Development Environments", "02"),
}

# The Python pathway is not a specification topic and is never presented as one.
PY_NOTE = (
    "The Python course is not an OCR topic and carries no specification "
    "reference. It teaches programming in a real language, which Component 02 "
    "assesses the thinking behind: a pupil who has written, run and fixed their "
    "own programs reads an exam question about iteration differently from one who "
    "has only read about it. Where it supports a topic, that topic is named. "
    "Where it goes beyond the specification - the editor, the test-based marking, "
    "SQL through sqlite3 - it is named as enrichment, not as coverage."
)

PY_SUPPORTS = {
    "2.1": "the searching and sorting algorithms of lesson 11, written and run "
           "rather than traced on paper",
    "2.2": "every programming technique the topic names: variables and constants, "
           "the three programming constructs, data types and casting, string "
           "handling, arrays, file handling, records, SQL and subprograms",
    "2.3": "validation and authentication in lesson 12, and the habit of reading a "
           "failing test rather than guessing",
}

PY_ENRICHMENT = [
    "The in-browser editor and the Python runtime behind it.",
    "Marking by running a pupil's program against test cases.",
    "sqlite3 as the way SQL is run, which is an implementation choice: the "
    "specification asks for SQL, not for a particular database library.",
    "The compulsory question order and the save-and-resume progression.",
]


def component_of(topic):
    """Which paper a topic sits in, or None for the Python pathway."""
    t = TOPICS.get(topic)
    return t[1] if t else None


def title_of(topic):
    t = TOPICS.get(topic)
    return t[0] if t else None


def reference(topic):
    """How a topic is cited in a document: never more precisely than is known."""
    t = TOPICS.get(topic)
    if not t:
        return "no specification reference: beyond OCR J277"
    comp = next(c for c in CHECKED["components"] if c["code"] == t[1])
    return "OCR %s (%s), Component %s %s, topic %s %s" % (
        CHECKED["qualification"], CHECKED["code"], comp["code"], comp["name"],
        topic, t[0])
