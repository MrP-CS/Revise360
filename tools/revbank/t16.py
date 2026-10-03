"""1.6 Ethical, legal, cultural and environmental impacts: the revision bank.

The topic that is examined almost entirely by extended writing, so this leans
harder than any other on written questions and on the self-reviewed six-mark
discussions. The marks here come from giving both sides and reaching a
conclusion, and the mark points say so.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written, extended,
                    sub, mp)

TOPIC = "1.6"

BANK = [

    # ============================================================ el-l01
    sub("Kinds of impact", "el-l01-s2", ["el-l01-o1"], [
        sort("Sort each concern about a new technology by the kind of impact it is.",
             ["Ethical", "Legal", "Cultural", "Environmental"],
             [["Is it right to collect this data at all?", "Ethical"],
              ["Does this break the Data Protection Act?", "Legal"],
              ["Will people without internet access be left out?", "Cultural"],
              ["How much electricity will the data centre use?", "Environmental"],
              ["Should a machine decide who gets a loan?", "Ethical"],
              ["Who owns the copyright in what it produces?", "Legal"]],
             fb="Ethical is about right and wrong; legal is about what the law says. They "
                "often point the same way, but they are different questions.",
             diff="understand", exam=True),
        written("Explain the difference between an ethical issue and a legal issue.", 2,
                [mp("a legal issue is about what the law allows or forbids",
                    ["legal|law|act|legislation|illegal"],
                    ["allow|allows|forbid|forbids|permit|permits|against|breaks|"
                     "required|must|says"],
                    exemplar="A legal issue is about what the law allows or forbids."),
                 mp("an ethical issue is about what is right, whether or not it is legal",
                    ["ethical|ethically|moral|morally|right or wrong|what is right|fair|unfair",
                     "whether or not|even if|even where|still|not illegal|perfectly legal|"
                     "still legal|lawful|law permits|law allows|"
                     "nothing to do with the law|regardless"],
                    exemplar="An ethical issue is about whether something is right, even if "
                             "the law allows it.")],
                example="A legal issue is about whether something breaks the law. An ethical "
                        "issue is about whether it is right, which is a separate question "
                        "— something can be perfectly legal and still be wrong.",
                paraphrase="A legal issue concerns what legislation permits or prohibits. An "
                           "ethical issue concerns whether an action is morally "
                           "acceptable, which can differ even where nothing illegal has "
                           "happened.",
                fb="Both halves, and the second one needs the idea that legal and right are "
                   "not the same thing.",
                diff="understand", exam=True),
        short("State what is meant by a stakeholder.",
              [mp("anybody affected by the decision or the technology",
                  ["affect|affected|affects|impact|impacted|concerned|interest|"
                   "involved|touched by"],
                  exemplar="Anybody affected by the decision.")],
              example="Anybody affected by a decision or a piece of technology, such as the "
                      "users, the workers, the company and the people living nearby.",
              paraphrase="Any person or group with an interest in or affected by what is "
                         "decided.",
              fb="Affected by it. Naming examples without saying what they have in common "
                 "is not the definition.", cw="state"),
    ]),

    # ============================================================ el-l02
    sub("Privacy", "el-l02-s3", ["el-l02-o1", "el-l02-o2"], [
        written("A fitness app collects a user's location every few seconds. Explain one "
                "benefit and one risk of this.", 4,
                [mp("a benefit to the user, such as accurate distance or route mapping",
                    ["distance|route|map|mapping|track|pace|speed|progress|accurate|"
                     "where they ran|training"],
                    exemplar="It can show the user exactly where they ran and how far."),
                 mp("explained as a benefit to that user",
                    ["useful|helps|allows|lets them|improve|better|motivat"],
                    exemplar="This helps them see their progress and improve."),
                 mp("a risk, such as the data revealing where the user lives or works",
                    ["where they live|home|address|work|workplace|routine|pattern|"
                     "identify|identifies|stalk|follow|burgl"],
                    exemplar="The same data shows where they live, because that is where "
                             "every run starts."),
                 mp("explained as a harm if the data is shared, sold or leaked",
                    ["shared|sold|sell|leak|leaked|breach|stolen|hacked|public|"
                     "third party|advertisers"],
                    developed=True,
                    exemplar="If that data were leaked or sold, somebody could work out "
                             "their address.")],
                example="Collecting location constantly lets the app show exactly where the "
                        "user ran and how far, which helps them track their training and see "
                        "their progress. The risk is that the same data reveals where they "
                        "live and work, because every run starts and ends at home, so if the "
                        "data were leaked or sold on, a stranger could work out their address "
                        "and their daily routine.",
                paraphrase="Constant location data gives an accurate record of the route and "
                           "distance, which is useful for following training. On the other "
                           "hand it also exposes the user's home and workplace, since their "
                           "runs always begin in the same place, so a breach or a sale of "
                           "that data would hand somebody their address.",
                fb="Two sides, each with a consequence. A benefit stated without saying who "
                   "it benefits is half a point.",
                cw="discuss", diff="apply", exam=True),
        mcq("Under the Data Protection Act 2018, an organisation must have a lawful basis "
            "for processing personal data. Which of these is one?",
            "The person has given consent",
            ["The data was easy to collect",
             "The data is about a public figure",
             "The organisation paid for the data"],
            fb="Consent is one lawful basis. Buying data does not create one.",
            diff="understand"),
    ]),

    # ============================================================ el-l03
    sub("Legislation", "el-l03-s4", ["el-l03-o1", "el-l03-o2", "el-l03-o3"], [
        match("Match each scenario to the Act it breaches.",
              [["Someone guesses a colleague's password and reads their email",
                "Computer Misuse Act 1990"],
               ["A company keeps customers' addresses for years after they have left",
                "Data Protection Act 2018"],
               ["A pupil uploads a film to a website for anyone to download",
                "Copyright, Designs and Patents Act 1988"]],
              fb="Unauthorised access is the Computer Misuse Act; keeping data too long is "
                 "the Data Protection Act; sharing somebody else's work is copyright.",
              diff="apply", exam=True),
        multi("Which of these are principles of the Data Protection Act 2018? Tick all that "
              "apply.",
              ["Data must be used fairly, lawfully and transparently",
               "Data must be accurate and kept up to date",
               "Data must be kept no longer than necessary",
               "Data must be kept secure",
               "Data must be stored in alphabetical order",
               "Data must be sold only to approved companies"],
              ["Data must be used fairly, lawfully and transparently",
               "Data must be accurate and kept up to date",
               "Data must be kept no longer than necessary",
               "Data must be kept secure"],
              fb="The principles are about how data is treated, not about how it is sorted "
                 "or sold.",
              diff="retrieve"),
        short("State what the Computer Misuse Act 1990 makes illegal.",
              [mp("gaining access to a computer or data without permission",
                  ["without permission|unauthorised|unauthorized|not allowed|no right|"
                   "no permission|without authority|no authority|without consent|not authorised"],
                  ["access|accessing|enter|entering|get into|log in|use|using|hack"],
                  exemplar="Gaining access to a computer or its data without permission.")],
              example="Gaining access to a computer or to data without permission, and doing "
                      "so in order to commit a further offence or to modify the data.",
              paraphrase="Getting into a system or its files when you have no authority to "
                         "do so.",
              fb="Access without permission. The Act has three levels, and all of them start "
                 "there.", cw="state"),
        mcq("A student writes a program for coursework and a classmate copies it and submits "
            "it as their own. Which Act is most relevant?",
            "Copyright, Designs and Patents Act 1988",
            ["Computer Misuse Act 1990", "Data Protection Act 2018",
             "Freedom of Information Act 2000"],
            fb="The program is the student's own work, and copying it without permission "
               "breaches copyright.",
            diff="apply"),
    ]),

    # ============================================================ el-l04
    sub("Culture and the digital divide", "el-l04-s2", ["el-l04-o2", "el-l04-o3"], [
        short("State what is meant by the digital divide.",
              [mp("the gap between those with access to technology and those without",
                  ["gap|divide|difference|split|inequality|some people have|those with"],
                  ["access|afford|connection|internet|technology|devices|online|computers"],
                  exemplar="The gap between people who have access to technology and those "
                           "who do not.")],
              example="The gap between people who have access to technology and the internet "
                      "and those who do not, whether because of cost, location or skills.",
              paraphrase="The inequality between those able to get online and those who "
                         "cannot.",
              fb="A gap in access. Saying only 'people who do not have computers' misses "
                 "that it is a comparison.", cw="state"),
        written("A council decides to put all its services online and close its offices. "
                "Explain how this could disadvantage some residents.", 3,
                [mp("some residents have no internet access or no suitable device",
                    ["no internet|no access|cannot afford|cannot get online|not everybody can|no computer|"
                     "no device|no broadband|no connection|cost|rural|where they live|poor signal"],
                    exemplar="Some residents have no internet access at home."),
                 mp("or lack the skills or confidence to use the website",
                    ["skill|skills|confiden|know how|able to use|training|older|elderly|"
                     "disabilit|cannot use"],
                    exemplar="Others do not have the skills or confidence to use a website."),
                 mp("so they would be unable to get a service they are entitled to",
                    ["cannot|unable|excluded|left out|shut out|denied|lose|miss out|"
                     "no way to|entitled"],
                    developed=True,
                    exemplar="So they would be unable to get a service they are entitled "
                             "to.")],
                example="Some residents have no internet connection at home, either because "
                        "they cannot afford one or because the signal where they live is "
                        "poor. Others have a connection but not the skills or confidence to "
                        "use a website, which is more common among older residents. With the "
                        "offices closed, both groups would be left unable to get a service "
                        "they are entitled to.",
                paraphrase="Not everybody can get online, whether through cost or where they "
                           "live, and some who can lack the confidence to use a site, so "
                           "with nowhere to go in person those people would be shut out of "
                           "services that are theirs by right.",
                fb="Two different reasons somebody might be excluded, and then the "
                   "consequence. Access and skills are not the same barrier.",
                diff="apply", exam=True),
        mcq("Which of these is an example of globalisation made possible by computer "
            "technology?",
            "A company employing a development team in another country and managing it "
            "remotely",
            ["A school installing a new computer room",
             "A user encrypting their hard disk",
             "A website compressing its images"],
            fb="Globalisation is work and trade crossing borders because the technology "
               "makes distance matter less.",
            diff="understand"),
    ]),

    # ============================================================ el-l05
    sub("Environmental impact", "el-l05-s1", ["el-l05-o1", "el-l05-o2", "el-l05-o3"], [
        order("Put the three stages of a computer's environmental impact in the order they "
              "happen.",
              ["Manufacture: raw materials are mined and the device is built",
               "Use: electricity is consumed for as long as it runs",
               "Disposal: the device becomes electronic waste"],
              fb="A full answer in the exam covers all three, not just the electricity.",
              diff="retrieve"),
        written("Explain why throwing away an old smartphone is an environmental problem.", 3,
                [mp("it contains toxic materials such as lead and mercury",
                    ["toxic|poison|harmful|hazardous|dangerous|chemical|"
                     "lead|mercury|cadmium|heavy metal"],
                    exemplar="It contains toxic materials such as lead and mercury."),
                 mp("which can leak into the ground and water if it goes to landfill",
                    ["leak|leach|seep|escape|contaminat|pollut|ground|soil|water|"
                     "landfill|dump"],
                    developed=True,
                    exemplar="These can leak into the ground and water if it goes to "
                             "landfill."),
                 mp("and valuable materials are wasted that could have been recovered",
                    ["valuable|precious|gold|copper|rare|recycle|recycled|recover|"
                     "reuse|wasted|thrown away"],
                    exemplar="Valuable materials that could have been recycled are wasted.")],
                example="A smartphone contains toxic materials including lead and mercury, "
                        "and if it goes to landfill those can leach into the soil and into "
                        "the water supply. It also contains valuable metals such as gold and "
                        "copper which could have been recovered, so throwing it away wastes "
                        "them and means more has to be mined.",
                paraphrase="These devices hold poisonous substances that can contaminate the "
                           "ground and water once dumped, and they also contain precious "
                           "metals which are simply lost rather than being reclaimed.",
                fb="Three ideas: what is in it, what that does, and what is wasted.",
                diff="apply", exam=True),
        multi("Which of these reduce the environmental impact of computing? Tick all that "
              "apply.",
              ["Repairing a device rather than replacing it",
               "Recycling a device at an approved centre",
               "Running data centres on renewable electricity",
               "Buying a new phone every year",
               "Leaving computers switched on overnight"],
              ["Repairing a device rather than replacing it",
               "Recycling a device at an approved centre",
               "Running data centres on renewable electricity"],
              fb="The greenest device is usually the one somebody already owns.",
              diff="understand"),
    ]),

    # ============================================================ el-l07
    sub("Open source and proprietary software", "el-l07-s3", ["el-l07-o1", "el-l07-o2"], [
        sort("Sort each statement by the kind of software licence it describes.",
             ["Open source", "Proprietary"],
             [["The source code is published and can be changed", "Open source"],
              ["The source code is kept secret by the company", "Proprietary"],
              ["Usually free to download and use", "Open source"],
              ["Normally comes with paid support from the company", "Proprietary"],
              ["Anyone may distribute a modified version", "Open source"],
              ["Changing or redistributing it is forbidden by the licence", "Proprietary"]],
             fb="The licence is the difference, not the price. There is paid open source "
                "software and free proprietary software.",
             diff="understand", exam=True),
        written("A charity is choosing between open source and proprietary office software. "
                "Explain one advantage of each.", 4,
                [mp("open source is usually free, which matters to a charity",
                    ["free|no cost|costs nothing|no licence fee|no fee|cheaper|saves money"],
                    exemplar="Open source is usually free, which matters when money is "
                             "tight."),
                 mp("and it can be changed to suit the charity's own needs",
                    ["change|changed|modify|modified|adapt|adapted|alter|customise|"
                     "customize|tailor|source code"],
                    exemplar="Its source code can be changed to suit their own needs."),
                 mp("proprietary software normally comes with support from the company",
                    ["support|help|helpdesk|technical support|customer service|company behind it|someone to call|"
                     "someone to ask|to call when|guarantee|warranty"],
                    exemplar="Proprietary software comes with support from the company."),
                 mp("and is usually better tested and more widely compatible",
                    ["better tested|well tested|thoroughly tested|tested properly|"
                     "reliable|stable|polished|compatible|compatibility|"
                     "works with everything|works with more|widely used|everybody uses|"
                     "industry standard|regular updates"],
                    exemplar="It is also usually better tested and more widely compatible.")],
                example="Open source software is normally free, which matters a great deal "
                        "to a charity, and because the source code is published it could be "
                        "changed to suit the way the charity works. Proprietary software "
                        "costs money but comes with support from the company when something "
                        "goes wrong, and it is usually better tested and more compatible with "
                        "what other organisations send them.",
                paraphrase="The open option costs nothing, which suits a tight budget, and "
                           "its code can be adapted to their particular needs. The paid "
                           "option brings a company behind it to call when things break, "
                           "along with wider compatibility and more thorough testing.",
                fb="Two advantages each, and they have to be advantages of THAT kind of "
                   "licence. 'It is good software' applies to both.",
                cw="compare", diff="apply", exam=True),
        tf("Open source software cannot be sold.", False,
           fb="False. An open source licence is about the source code being available and "
              "modifiable, not about price. Companies do sell open source software, usually "
              "bundled with support.",
           misc="'Open source means free' is the most common misconception in this topic.",
           diff="understand"),
    ]),

    # ============================================================ el-l06
    sub("Weighing a scenario", "el-l06-s5", ["el-l06-o2", "el-l06-o3"], [
        extended("A city council plans to replace its bus timetables with an app, and to "
                 "install cameras at every stop that count waiting passengers. Discuss the "
                 "impacts of this plan and reach a conclusion.", 6,
                 [mp("identifies who is affected: passengers, the council, drivers, "
                     "residents near the stops"),
                  mp("gives an advantage, such as better scheduling or live information"),
                  mp("raises a privacy concern about the cameras and what is recorded"),
                  mp("raises the digital divide: passengers with no smartphone or data"),
                  mp("considers a legal point, such as the Data Protection Act"),
                  mp("reaches a conclusion that weighs the sides, with a reason")],
                 example="The people affected are passengers, the council, the drivers and "
                         "the residents living near the stops. The clearest benefit is "
                         "better scheduling: counting waiting passengers tells the council "
                         "where buses are actually needed, so services can be put where "
                         "people use them and the app can give live arrival times instead of "
                         "a printed guess. Against that, cameras at every stop record people "
                         "going about their lives, and even if only numbers are kept, the "
                         "images exist and have to be protected under the Data Protection "
                         "Act. The app raises a different problem: a passenger without a "
                         "smartphone, or without data, loses the timetable they used to be "
                         "able to read on the wall, and that is most likely to be older or "
                         "poorer passengers who depend on the bus most. My conclusion is "
                         "that the counting is worth doing and the removal of the printed "
                         "timetables is not: the council should keep a printed timetable at "
                         "every stop, and should state publicly that the cameras count "
                         "people rather than identify them and that no images are kept.",
                 fb="You mark this one yourself against the points above. A six-mark "
                    "discussion needs more than one side and a conclusion with a reason "
                    "attached; the stakeholders are what turn a list of opinions into an "
                    "argument.",
                 bands=["CONTENT", "APPLICATION", "DEVELOPMENT", "BALANCE", "CONCLUSION"]),
        written("Explain why a company should consider stakeholders other than its own "
                "customers when introducing new technology.", 2,
                [mp("other people are affected by it too, such as workers or the local area",
                    ["worker|workers|staff|employee|resident|neighbour|community|"
                     "local|public|environment|supplier|society"],
                    exemplar="Other people are affected too, such as its workers and the "
                             "local community."),
                 mp("and ignoring them can cause harm, or damage the company's reputation",
                    ["harm|damage|hurt|reputation|standing|protest|complaint|boycott|"
                     "bad publicity|lose trust|legal|fined"],
                    exemplar="Ignoring them can cause real harm and damage the company's "
                             "reputation.")],
                example="A new technology affects more than the people who buy it: workers "
                        "whose jobs change, residents near a new data centre, and suppliers "
                        "further down the chain. Ignoring them can cause real harm and can "
                        "damage the company's reputation badly enough to cost it customers "
                        "anyway.",
                paraphrase="Staff, neighbours and suppliers all feel the effects as well as "
                           "buyers, and overlooking them can do genuine damage and wreck the "
                           "firm's standing.",
                fb="Who else is affected, and why that matters to the company.",
                diff="understand"),
    ]),
]
