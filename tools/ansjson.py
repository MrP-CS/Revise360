# Answer sheets for the seven lessons built from bespoke scripts, generated from their experience JSON.
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
import json, sys, subprocess, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from buildans import answer_of, LABEL
META = {
 "lesson1": ("1.3", 1, "Types of network", "Zoom out", "Lesson1_ZoomOut"),
 "lesson2": ("1.3", 2, "Network performance", "Network control room", "Lesson2_Performance"),
 "lesson4": ("1.3", 4, "LAN hardware", "Mission: wire up the school", "Lesson4_LANHardware"),
 "lesson6": ("1.3", 6, "Star and mesh topologies", "Star and mesh", "Lesson6_StarMesh"),
 "lesson7": ("1.3", 7, "Revision and catch-up", "Revision HQ", "Lesson7_RevisionHQ"),
 "rp-lesson3": ("2.3", 3, "Maintainability", "Code clinic", "RP_Lesson3_Maintainability"),
 "rp-lesson4": ("2.3", 4, "Testing and errors", "Bug hunt lab", "RP_Lesson4_Testing"),
}
for eid, (topic, lesson, title, expname, stem) in META.items():
    e = json.load(open(SITE_S + f"experiences/{eid}.json"))
    stations = []
    for sc in e["scenes"]:
        for st in sc["stations"]:
            qs = [dict(q=t.get("q",""), a=answer_of(t)) for t in st["tasks"]]
            facts = [t.get("fb") for t in st["tasks"] if t.get("fb")] or ["See the station wall in the experience."]
            stations.append(dict(name=st["name"], facts=facts[:3], challenge=None, challengeAnswer=[], questions=qs))
    final = stations.pop() if stations and ("final" in stations[-1]["name"].lower() or "challenge" in stations[-1]["name"].lower()) else None
    S = dict(topicLabel=LABEL[topic], lesson=lesson, title=title, expName=expname,
             footer=f"{topic} Lesson {lesson}: {title}", stations=stations,
             final=dict(name=final["name"], questions=final["questions"], note="Students should have predicted this on the worksheet before tapping the star.") if final else None,
             exam=[], common=["Naming a term without saying what it does.", "Giving an advantage with no reason attached.", "Repeating the question in the answer."],
             scoreGuide=True, out=OUT_S + f"{stem}_ANSWERS.docx")
    spec=fos.path.join(os.path.dirname(os.path.abspath(__file__)), "wsspecs") + "/ans_{eid}.json"; json.dump(S, open(spec,"w"))
    r=subprocess.run(["node", os.path.join(os.path.dirname(os.path.abspath(__file__)), "ansgen.js"),spec],capture_output=True,text=True,cwd=os.path.dirname(os.path.abspath(__file__)))
    print(r.stdout.strip() or r.stderr.strip()[:200])
    shutil.copy(S["out"], SITE_S + "answers/"+S["out"].split("/")[-1])
