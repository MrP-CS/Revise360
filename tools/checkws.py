# Scan every built worksheet and answer sheet for references to other people's resources
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
import zipfile, re, glob, os
BAD = ["smart revise", "craig", "know it all", "knowitall", "pg online", "workbook",
       "task 1", "task 2", "task 3", "task 4", "tasks 1", "seneca", "quizlet"]
hits = {}
for f in sorted(glob.glob(SITE_S + "worksheets/*.docx") + glob.glob(SITE_S + "answers/*.docx")):
    try: x = zipfile.ZipFile(f).read("word/document.xml").decode()
    except Exception: continue
    t = re.sub("<[^>]+>", " ", x).lower()
    found = sorted({b for b in BAD if b in t})
    if found: hits[os.path.basename(f)] = found
print(f"{len(glob.glob(SITE_S + 'worksheets/*.docx'))} worksheets and {len(glob.glob(SITE_S + 'answers/*.docx'))} answer sheets scanned")
if not hits: print("no references to other people's resources found")
for k, v in hits.items(): print(" ", k, "->", ", ".join(v))
