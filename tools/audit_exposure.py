"""What of this product can anyone fetch, and what of it was meant to be private?

The repository is public and the site is static files, so "private" here means
only "not linked from a page a pupil sees". This walks the whole site and says,
without softening it, which of four kinds of thing is reachable:

  teacher material    lesson plans, unit guides, the packs, the teacher dashboard
  answer material     model solutions, marking guidance, answer sheets
  experience assets   scene JSON, panoramas, the player and the runtime
  secrets             keys, tokens, raw storage links, anything that looks like one

It also follows the links: a pupil's page must not link to a teacher's document,
and nothing anywhere should link to an answer.

    python3 tools/audit_exposure.py            # the report
    python3 tools/audit_exposure.py --strict   # non-zero if answers or secrets
                                               # are reachable
"""
import os
import re
import sys
import json
import glob
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from paths import SITE_S                                       # noqa: E402

ROOT = SITE_S.rstrip("/")

STUDENT_PAGES = ["index.html", "topics.html", "experience.html", "about.html",
                 "guides.html", "join.html", "signup.html"]
TEACHER_PAGES = ["teacher.html", "teachers.html", "admin.html"]

TEACHER_DIRS = ["lessonplans", "unitdocs", "packs"]
EXPERIENCE_DIRS = ["experiences"]

SECRET = [
    (re.compile(r"\bAKIA[0-9A-Z]{16}\b"), "an AWS access key"),
    (re.compile(r"\bBearer\s+[A-Za-z0-9._-]{20,}"), "a bearer token"),
    (re.compile(r"\bsk-[A-Za-z0-9]{20,}\b"), "an API key"),
    (re.compile(r"[a-z0-9.-]+\.s3\.amazonaws\.com"), "a raw S3 link"),
    (re.compile(r"[a-z0-9-]+\.blob\.core\.windows\.net"), "a raw Azure link"),
    (re.compile(r"\?(?:token|sig|signature|key)=[A-Za-z0-9._-]{12,}"), "a signed URL"),
]

# A password-shaped string is normal in this product's content: lesson 12 of the
# Python course teaches authentication, and its questions contain fictional
# passcodes on purpose. So that pattern is looked for only where a real one would
# live - configuration and anything server-side - and never in the lesson content,
# which other checks already hold to its own standards.
CONFIG_SECRET = [
    (re.compile(r'(?i)\b(?:password|passwd|secret|api[_-]?key)\s*[:=]\s*'
                r'["\'][^"\']{6,}'), "a password or key"),
]
CONFIG_FILES = ("js/config.js", "js/local.js")
CONFIG_DIRS = ("backend/", ".github/")

# "answer" anywhere in a path, at a word boundary that counts an underscore or a
# hyphen as one. The first version anchored to the start of a path segment and
# missed AL_L01_Answers.md, which is exactly how a real answer sheet gets named.
ANSWERY = re.compile(
    r"(?i)(?:^|[/_\- ])(?:answers?|solutions?|mark(?:ing)?[-_ ]?scheme|"
    r"teacher[-_ ]?key|teaching[-_ ]?answers)(?:[/_\-. ]|$)")


def tracked():
    """Every file git is publishing, which is the real definition of public here."""
    out = subprocess.run(["git", "ls-files"], cwd=ROOT, capture_output=True, text=True)
    return [p for p in out.stdout.splitlines() if p]


def links_in(path):
    try:
        text = open(os.path.join(ROOT, path), encoding="utf-8", errors="replace").read()
    except Exception:
        return []
    return re.findall(r'(?:href|src)\s*=\s*["\']([^"\'#?]+)', text)


def main(argv):
    strict = "--strict" in argv
    files = tracked()
    problems = []
    print("%d file(s) are published by this repository." % len(files))
    print()

    # 1. anything that looks like an answer
    print("ANSWER MATERIAL")
    answers = [f for f in files if ANSWERY.search(f)]
    if answers:
        for f in answers:
            print("   PUBLISHED  %s" % f)
        problems.append("%d answer file(s) are published" % len(answers))
    else:
        print("   none is published. answers/ is gitignored and nothing matching an "
              "answer name is tracked.")
    # and in the history, which a public repository also publishes
    hist = subprocess.run(["git", "rev-list", "--all", "--objects"], cwd=ROOT,
                          capture_output=True, text=True).stdout.splitlines()
    old = sorted({l.split(" ", 1)[1] for l in hist if " " in l
                  and ANSWERY.search(l.split(" ", 1)[1])})
    old = [p for p in old if p not in set(files)]
    if old:
        print()
        print("   Still in the repository's HISTORY, which a public repository also")
        print("   publishes. Deleting a file does not remove it from an earlier commit:")
        for p in old:
            print("      %s" % p)
        print("   Removing these needs the history rewritten and force-pushed, which")
        print("   changes every commit id. That is the owner's call, not a build step.")
        problems.append("%d answer file(s) remain in the git history" % len(old))

    # 2. teacher material
    print()
    print("TEACHER MATERIAL")
    teacher = [f for f in files if f.split("/")[0] in TEACHER_DIRS]
    print("   %d file(s) under %s are published at ordinary addresses."
          % (len(teacher), ", ".join(TEACHER_DIRS)))
    print("   They are linked only from the teacher dashboard, behind its sign-in.")
    print("   That sign-in is a panel in the page, not a gate in front of the files:")
    print("   anyone who knows a URL can fetch one. See docs/EXPERIENCE-PROTECTION.md.")
    leaks = []
    for page in STUDENT_PAGES:
        for href in links_in(page):
            top = href.split("/")[0]
            if top in TEACHER_DIRS or ANSWERY.search(href):
                leaks.append((page, href))
    for js in glob.glob(os.path.join(ROOT, "js", "*.js")):
        name = os.path.relpath(js, ROOT)
        if name in ("js/teacher.js", "js/roster.js", "js/admin.js"):
            continue
        text = open(js, encoding="utf-8", errors="replace").read()
        for d in TEACHER_DIRS:
            if re.search(r'["\'`]%s/' % d, text):
                leaks.append((name, d + "/..."))
    if leaks:
        print()
        for where, what in leaks:
            print("   LINKED FROM A STUDENT PAGE  %s -> %s" % (where, what))
        problems.append("%d link(s) to teacher material from a student page" % len(leaks))
    else:
        print("   No student page or student script links to any of it.")

    # 3. the experiences
    print()
    print("EXPERIENCE ASSETS")
    scenes = [f for f in files if f.startswith("experiences/") and f.endswith(".json")]
    imgs = [f for f in files if f.startswith("experiences/img/")]
    code = [f for f in files if f.startswith("js/") or f.startswith("vendor/")]
    print("   %d scene definition(s), %d image(s) and %d script(s) are published at"
          % (len(scenes), len(imgs), len(code)))
    print("   ordinary addresses, because the site is static and the browser fetches")
    print("   them directly. There is no server to refuse a direct request.")
    print("   No download the product offers contains any of them: tools/tests/")
    print("   smokepacks.py fails the build if one appears in a pack.")

    # 4. secrets
    print()
    print("SECRETS")
    found = []
    for f in files:
        if os.path.splitext(f)[1].lower() not in (".js", ".json", ".html", ".css",
                                                  ".py", ".md", ".txt", ".yml"):
            continue
        try:
            text = open(os.path.join(ROOT, f), encoding="utf-8", errors="replace").read()
        except Exception:
            continue
        for pat, what in SECRET:
            m = pat.search(text)
            if m:
                found.append((f, what, m.group(0)[:36]))
        if f in CONFIG_FILES or f.startswith(CONFIG_DIRS):
            for pat, what in CONFIG_SECRET:
                m = pat.search(text)
                if m:
                    found.append((f, what, m.group(0)[:36]))
    if found:
        for f, what, snip in found:
            print("   FOUND  %s: %s (%s...)" % (f, what, snip))
        problems.append("%d possible secret(s) in published files" % len(found))
    else:
        print("   None found in any published file. The password-shaped strings in")
        print("   the Python course's authentication lesson are its teaching content")
        print("   and are fictional; they are not looked for as secrets.")

    # 5. pupil data
    print()
    print("STUDENT RECORDS")
    pupils = [f for f in files
              if re.search(r"(?i)(roster|students?|pupils?|results?)\.(json|csv)$", f)]
    if pupils:
        for f in pupils:
            print("   PUBLISHED  %s" % f)
        problems.append("%d file(s) that may hold student records" % len(pupils))
    else:
        print("   No roster, result or pupil file is published. Progress is kept in")
        print("   the browser's own storage on the device a pupil used.")

    print()
    print("=" * 72)
    if problems:
        print("%d thing(s) to decide about:" % len(problems))
        for p in problems:
            print("   - %s" % p)
    else:
        print("Nothing published that was meant to be private.")
    print()
    print("The standing limitation, which none of the above changes: this build has")
    print("no server. Teacher links are private, not protected, and the experiences")
    print("can be fetched directly by anyone who knows an address. Do not describe")
    print("any of it as access-controlled until a backend authorises each request.")

    hard = [p for p in problems if "answer" in p or "secret" in p or "student" in p]
    return 1 if (strict and hard) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
