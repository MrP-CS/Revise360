"""1.4 Network security: the revision bank.

Eleven taught lessons, and a topic where the exam marks sit in the second half
of every answer: not what an attack is, but what the attacker gains and what
stops it. The written questions here all ask for that second half.
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written, extended,
                    num, sub, mp)

TOPIC = "1.4"

BANK = [

    # ============================================================ ns-l01
    sub("Forms of attack", "ns-l01-s2", ["ns-l01-o1"], [
        multi("Which of these are forms of attack listed in the specification? Tick all "
              "that apply.",
              ["Malware", "Phishing", "Social engineering", "Brute-force attack",
               "Denial of service", "Data interception", "Defragmentation",
               "Compression"],
              ["Malware", "Phishing", "Social engineering", "Brute-force attack",
               "Denial of service", "Data interception"],
              fb="Six forms of attack, plus SQL injection. Defragmentation and compression "
                 "are maintenance, not attacks.",
              diff="retrieve"),
        short("Give one thing an attacker might want from a successful attack.",
              [mp("money, data, or disruption",
                  ["money|ransom|payment|financial|profit|bank|sell"],
                  ["personal data|their data|steal data|sell data|personal information|passwords|"
                   "bank details|card details|records|identity"],
                  ["disrupt|disruption|damage|stop|shut down|reputation|revenge|"
                   "embarrass"],
                  exemplar="Money, usually by demanding a ransom.")],
              example="Money, for example by demanding a ransom to unlock encrypted files.",
              paraphrase="Personal data they can sell or use to steal someone's identity.",
              fb="Money, data or disruption are the three. Any one of them earns the mark.",
              cw="give"),
    ]),

    # ============================================================ ns-l02
    sub("Types of malware", "ns-l02-s2", ["ns-l02-o1"], [
        match("Match each kind of malware to what makes it that kind.",
              [["Virus", "Attaches itself to a file and spreads when that file is opened"],
               ["Worm", "Copies itself across a network without anybody opening anything"],
               ["Trojan", "Pretends to be a useful program so the user installs it"],
               ["Ransomware", "Encrypts the user's files and demands payment"],
               ["Spyware", "Records what the user does and sends it to the attacker"]],
              fb="The difference between a virus and a worm is whether a person has to do "
                 "anything.",
              diff="understand", exam=True),
        written("Explain the difference between a virus and a worm.", 2,
                [mp("a virus attaches to a file and needs the user to open or run it",
                    ["virus",
                     "attach|attaches|attached|part of a file|hides in|inside a file|"
                     "user opens|user runs|somebody opens|someone opens|has to be opened|"
                     "needs the user|relies on"],
                    exemplar="A virus attaches to a file and spreads when the user opens "
                             "it."),
                 mp("a worm copies itself across a network on its own",
                    ["worm",
                     "copies itself|replicates|spreads itself|on its own|automatically|by itself|"
                     "no user|without anybody|without the user|does not need the user|independently"],
                    exemplar="A worm copies itself across a network without the user doing "
                             "anything.")],
                example="A virus attaches itself to a file and only spreads when somebody "
                        "opens or runs that file, whereas a worm copies itself across a "
                        "network on its own without anybody having to do anything.",
                paraphrase="A virus hides inside a file and relies on a person running it "
                           "to spread, while a worm replicates itself over the network "
                           "with no human involvement at all.",
                fb="Both halves. The distinction that earns marks is whether a user has to "
                   "act.",
                diff="understand", exam=True),
        mcq("A user downloads what looks like a free photo editor. Once installed, it opens "
            "a back door for an attacker. What kind of malware is this?",
            "A Trojan", ["A worm", "A virus", "Spyware"],
            fb="Pretending to be something useful is what makes it a Trojan.",
            diff="apply"),
        multi("Which of these help protect a computer against malware? Tick all that apply.",
              ["Anti-malware software kept up to date",
               "Installing operating system updates",
               "Not opening attachments from unknown senders",
               "A firewall",
               "Defragmenting the hard disk",
               "Increasing the screen resolution"],
              ["Anti-malware software kept up to date",
               "Installing operating system updates",
               "Not opening attachments from unknown senders",
               "A firewall"],
              fb="Updates matter because most malware exploits a hole that has already been "
                 "fixed.",
              diff="understand"),
    ]),

    # ============================================================ ns-l03
    sub("SQL injection", "ns-l03-s3", ["ns-l03-o1", "ns-l03-o2"], [
        short("State what an SQL injection attack is.",
              [mp("entering SQL into an input box so that it is run by the database",
                  ["sql|code|command|query",
                   "input|text box|form|field|login|box|typed|entered"],
                  exemplar="Typing SQL into an input box so the database runs it.")],
              example="Typing SQL commands into an input box on a website, so that the "
                      "database runs them as part of its own query.",
              paraphrase="Entering database commands into a form field so they get executed.",
              fb="SQL where data was expected. The attack works because the program joins "
                 "the two together without checking.", cw="state"),
        written("Explain how a website can protect itself against SQL injection.", 2,
                [mp("the input is validated or sanitised before it is used",
                    ["validat|sanitis|sanitiz|checked|filter|filtered|clean|escape|"
                     "strip|parameteris|parameteriz|prepared statement",
                     "input|user input|form|box|field|query|database|before it is used"],
                    exemplar="The input is validated before it is used in a query."),
                 mp("so anything that looks like SQL is rejected rather than run",
                    ["reject|rejected|removed|not run|refused|blocked|not executed|"
                     "treated as text|as data|not as code"],
                    developed=True,
                    exemplar="So anything that looks like SQL is rejected rather than run.")],
                example="Every input is validated and sanitised before it goes anywhere near "
                        "a query, so that characters which would turn the input into SQL are "
                        "stripped out or escaped and whatever the user typed is treated as "
                        "data rather than as code.",
                paraphrase="The site checks and cleans anything entered before it reaches the "
                           "database, which means text that would act as a command is "
                           "removed and the entry is handled purely as data.",
                fb="Validation, then what validation achieves.",
                diff="apply", exam=True),
        mcq("Why is SQL injection dangerous even when a website holds no passwords?",
            "An attacker can read, change or delete any data in the database",
            ["It overloads the server with traffic",
             "It installs malware on every visitor's computer",
             "It intercepts data being sent over the network"],
            fb="Injection gives the attacker the database's own powers. Flooding is denial "
               "of service and interception is a different attack entirely.",
            diff="understand"),
    ]),

    # ============================================================ ns-l04 / ns-l05
    sub("Phishing", "ns-l04-s1", ["ns-l04-o1", "ns-l04-o2"], [
        short("State what phishing is.",
              [mp("sending a message pretending to be someone trustworthy, to get personal "
                  "information",
                  ["pretend|pretending|poses|posing|impersonat|claiming to be|looks like|"
                   "appears to be|fake|disguis|trusted|trustworthy",
                   "password|details|information|bank|card|login|personal information"],
                  exemplar="Sending a message that pretends to be from a trusted company, "
                           "to get somebody's password.")],
              example="Sending an email or message that pretends to be from a trusted "
                      "organisation, so that the victim gives away personal information such "
                      "as a password or bank details.",
              paraphrase="Contacting someone while posing as a company they trust, in order "
                         "to trick them into handing over their login details.",
              fb="Pretending to be trusted, in order to get something. Both halves.",
              cw="state"),
        multi("Which of these are signs that an email may be phishing? Tick all that apply.",
              ["The sender's address does not match the organisation it claims to be from",
               "It creates urgency, such as threatening to close an account",
               "The link goes to an address that is not the company's own",
               "It asks for a password or bank details",
               "It is addressed to the recipient by name",
               "It arrives on a weekday"],
              ["The sender's address does not match the organisation it claims to be from",
               "It creates urgency, such as threatening to close an account",
               "The link goes to an address that is not the company's own",
               "It asks for a password or bank details"],
              fb="Being addressed by name is not a sign of safety: spear phishing does "
                 "exactly that, using information from social media.",
              diff="apply", exam=True),
        written("Explain why spear phishing is more likely to succeed than ordinary "
                "phishing.", 2,
                [mp("it is aimed at one person and uses details about them",
                    ["one person|an individual|a single person|specific|targeted|directed at|particular person|"
                     "named|personal details|their name|about them|about their|researched"],
                    exemplar="It is aimed at one particular person and uses real details "
                             "about them."),
                 mp("so it looks far more convincing and the usual warning signs are missing",
                    ["convincing|believable|realistic|genuine|authentic|trustworthy|credible|"
                     "harder to spot|looks real|looks like it|warning signs|no signs|clues|"
                     "less suspicious|nothing obvious"],
                    developed=True,
                    exemplar="This makes it far more convincing, so the victim is less "
                             "likely to be suspicious.")],
                example="Spear phishing targets one individual and uses real details about "
                        "them, often taken from social media, so the message looks like it "
                        "genuinely comes from someone who knows them and the usual warning "
                        "signs are not there.",
                paraphrase="Because it is directed at a single person and draws on "
                           "information about their life, the message appears authentic and "
                           "the normal clues that something is wrong are absent.",
                fb="Targeted, therefore convincing.",
                diff="apply", exam=True),
    ]),

    sub("Social engineering", "ns-l05-s2", ["ns-l05-o3"], [
        match("Match each social engineering technique to what it involves.",
              [["Blagging", "Inventing a story to persuade someone to hand over information"],
               ["Shouldering", "Watching someone enter a password or PIN"],
               ["Baiting", "Leaving infected media where somebody will pick it up"],
               ["Pharming", "Redirecting a user to a fake website without them noticing"]],
              fb="All four exploit people rather than software, which is why no amount of "
                 "anti-malware stops them.",
              diff="understand"),
        written("Explain why people are often described as the weakest point in a computer "
                "system's security.", 2,
                [mp("people can be tricked into giving away information or access",
                    ["people|person|staff|employee|human|user|users|somebody|someone",
                     "trick|tricked|fooled|persuaded|deceived|manipulated|convinced|"
                     "give away|hand over|reveal|revealing|let them in|granting"],
                    exemplar="People can be tricked into giving away their password."),
                 mp("and no amount of technical protection prevents that",
                    ["no technical|no firewall|no amount of|no software|no encryption|cannot stop|"
                     "cannot prevent|will not stop|does not stop|no safeguard|no defence|"
                     "nothing technical|bypass|gets round|goes round"],
                    exemplar="No firewall or encryption can prevent somebody simply telling "
                             "an attacker their password.")],
                example="People can be persuaded, frightened or flattered into handing over "
                        "a password or letting someone through a door, and no firewall, "
                        "encryption or anti-malware prevents that — the attacker has "
                        "gone round the technology rather than through it.",
                paraphrase="Staff can be deceived into revealing credentials or granting "
                           "access, and no technical safeguard can stop somebody who simply "
                           "tells an attacker what they want to know.",
                fb="Tricked, and then why the technology does not help.",
                diff="apply", exam=True),
    ]),

    # ============================================================ ns-l06
    sub("Brute-force attacks", "ns-l06-s1", ["ns-l06-o1", "ns-l06-o2"], [
        short("State what a brute-force attack is.",
              [mp("trying every possible password until the right one is found",
                  ["try|tries|trying|tested|tests|guess|guesses|guessing|attempt|attempts|working through",
                   "every|all|all possible|one after|one by one|each one|repeatedly|"
                   "again and again|thousands|millions|trial and error",
                   "password|combination|key|code|login"],
                  exemplar="Trying every possible password until the right one is found.")],
              example="Trying every possible combination of characters until the right "
                      "password is found.",
              paraphrase="Working through all the possible passwords one by one until one "
                         "of them works.",
              fb="Every possibility, tried in turn. A dictionary attack is the same idea "
                 "with a shortlist of likely passwords.", cw="state"),
        multi("Which of these make a brute-force attack harder? Tick all that apply.",
              ["A longer password",
               "Using upper and lower case, digits and symbols",
               "Locking the account after a number of failed attempts",
               "Using two-factor authentication",
               "Changing the font of the login page"],
              ["A longer password",
               "Using upper and lower case, digits and symbols",
               "Locking the account after a number of failed attempts",
               "Using two-factor authentication"],
              fb="Length and variety increase how many guesses are needed; locking the "
                 "account limits how fast they can be made.",
              diff="understand"),
        written("Explain why a longer password is so much harder to crack by brute force.",
                3,
                [mp("every extra character multiplies the number of possible passwords",
                    ["multipl|times|power|exponential|doubles|many more|far more|"
                     "each extra|every extra|each character|per character"],
                    exemplar="Every extra character multiplies the number of possible "
                             "passwords."),
                 mp("so the number of combinations grows extremely quickly",
                    ["grow|grows|growing|increase|increases|rise|rises|expands|huge|enormous|dramatic|"
                     "millions|billions|very quickly|rapidly|search space"],
                    exemplar="So the number of combinations grows extremely quickly."),
                 mp("and the attack takes far longer, perhaps longer than is worth it",
                    ["longer|years|centuries|too long|not worth|impractical|give up|"
                     "takes time|slow"],
                    developed=True,
                    exemplar="This means the attack would take so long that it is not worth "
                             "attempting.")],
                example="Each extra character multiplies the number of possible passwords by "
                        "the size of the character set, so the total number of combinations "
                        "grows enormously with every character added. That means a brute-"
                        "force attack would take years rather than minutes, which is long "
                        "enough that nobody bothers.",
                paraphrase="Adding a character multiplies the possibilities rather than "
                           "adding to them, so the search space expands dramatically and the "
                           "time required becomes so great that the attack is impractical.",
                fb="Three ideas: multiplication, growth, time. The third is what makes the "
                   "password safe in practice.",
                diff="stretch", exam=True),
        num("A password uses only the 26 lower-case letters and is 3 characters long. How "
            "many different passwords are possible?", 17576, working="26 ** 3",
            fb="26 × 26 × 26 = 17,576. Adding one more character would make it "
               "456,976.",
            diff="apply"),
    ]),

    # ============================================================ ns-l07
    sub("Denial of service", "ns-l07-s1", ["ns-l07-o1", "ns-l07-o2"], [
        short("State what a denial-of-service attack does.",
              [mp("it floods a server with requests so that genuine users cannot get through",
                  ["flood|floods|flooding|swamp|swamps|overload|overloads|overwhelm|overwhelms|bombard|"
                   "too many requests|huge number of requests|too much traffic",
                   "cannot|unable|denied|refused|crash|unavailable|shut down|goes down|"
                   "genuine users|real users|legitimate users"],
                  exemplar="It floods a server with requests so that genuine users cannot "
                           "get through.")],
              example="It overwhelms a server with so many requests that it cannot respond "
                      "to genuine users, so the service becomes unavailable.",
              paraphrase="It swamps a server with traffic until real users can no longer "
                         "reach it.",
              fb="Flooding, and the effect of the flooding. An attack that did not stop "
                 "anybody would not be denying service.", cw="state"),
        mcq("What makes a denial-of-service attack 'distributed'?",
            "The requests come from many computers at once, usually a botnet",
            ["The attack targets several servers at the same time",
             "The attacker is in a different country from the server",
             "The attack is spread out over several weeks"],
            fb="Distributed refers to where the traffic comes from. A botnet of infected "
               "machines is the usual source.",
            diff="understand"),
        written("Explain why a distributed denial-of-service attack is harder to stop than "
                "one from a single computer.", 2,
                [mp("the traffic comes from thousands of different addresses",
                    ["many|thousands|lots of|huge number|different|separate|several|multiple|all over|"
                     "around the world|botnet",
                     "address|addresses|ip|computers|machines|sources|devices"],
                    exemplar="The traffic comes from thousands of different addresses."),
                 mp("so blocking one address does not stop the attack, and the traffic looks "
                    "like ordinary users",
                    ["block|blocking|blocked|filter|ban|cannot just|one address|"
                     "looks like|indistinguishable|genuine|real users|normal traffic"],
                    developed=True,
                    exemplar="So blocking one address does not stop it, and the traffic looks "
                             "like ordinary visitors.")],
                example="The requests come from thousands of infected computers all over the "
                        "world, so blocking one address stops almost none of the traffic, and "
                        "because each machine looks like an ordinary visitor it is very hard "
                        "to tell the attack apart from real users.",
                paraphrase="Because the flood originates from a huge number of separate "
                           "machines, cutting off a single source barely helps, and each one "
                           "resembles a normal visitor so the attack is difficult to filter "
                           "out.",
                fb="Many sources, therefore blocking does not work.",
                diff="apply", exam=True),
    ]),

    # ============================================================ ns-l08
    sub("Data interception", "ns-l08-s1", ["ns-l08-o1", "ns-l08-o2"], [
        mcq("What is packet sniffing?",
            "Capturing and reading the packets travelling across a network",
            ["Flooding a network with packets until it fails",
             "Changing the order in which packets arrive",
             "Checking packets for errors before they are delivered"],
            fb="Sniffing is listening. Flooding is denial of service."),
        written("A café offers free Wi-Fi with no password. Explain the risk to a customer "
                "who signs into their bank on it.", 3,
                [mp("anyone nearby can capture the traffic on an open network",
                    ["anyone|anybody|someone|attacker|other users|nearby|"
                     "in range|within range|same network",
                     "capture|captures|collect|collects|intercept|read|sees|sniff|pick up|"
                     "listen|monitor"],
                    exemplar="Anyone else on the open network can capture the traffic."),
                 mp("so login details could be read if the connection is not encrypted",
                    ["password|login|details|credentials|username|bank details"],
                    ["not encrypted|unencrypted|no encryption|plain text|readable"],
                    exemplar="If the connection is not encrypted, the login details could be "
                             "read."),
                 mp("and the attacker could then use them to take money or steal the "
                    "customer's identity",
                    ["money|steal|theft|fraud|identity|account|transfer|spend|"
                     "impersonate|log in as"],
                    developed=True,
                    exemplar="The attacker could then use them to take money from the "
                             "account.")],
                example="An open Wi-Fi network has no encryption of its own, so anybody in "
                        "range can capture the packets travelling across it. If the bank's "
                        "connection were not itself encrypted, the customer's login details "
                        "would be readable in that captured traffic, and the attacker could "
                        "use them to sign in and take money from the account.",
                paraphrase="With no password on the network, anyone within range can collect "
                           "the data passing over it, and without encryption the customer's "
                           "credentials would be visible in that data, letting the attacker "
                           "access the account and steal from it.",
                fb="Three ideas: who can listen, what they would get, and what they would do "
                   "with it.",
                hint="Think about what an open network does not provide, and what the "
                     "attacker ends up holding.",
                diff="stretch", exam=True),
        tf("Using HTTPS instead of HTTP protects data from being read if it is intercepted.",
           True,
           fb="True. The data can still be captured, but it is encrypted, so it is of no use "
              "to whoever captured it."),
    ]),

    # ============================================================ ns-l09 / ns-l10
    sub("Defences", "ns-l09-s1", ["ns-l09-o2"], [
        match("Match each defence to what it does.",
              [["Firewall", "Inspects traffic entering and leaving, and blocks what breaks "
                            "the rules"],
               ["Anti-malware software", "Scans for known malicious programs and removes "
                                         "them"],
               ["User access levels", "Limits what each person is allowed to see and change"],
               ["Penetration testing", "Attacks a system deliberately to find its weaknesses"],
               ["Physical security", "Keeps people away from the hardware itself"]],
              fb="Penetration testing is the odd one out: it finds weaknesses rather than "
                 "preventing an attack.",
              diff="understand", exam=True),
        short("State what penetration testing is.",
              [mp("deliberately attacking a system to find its weaknesses before an attacker "
                  "does",
                  ["attack|attacking|break in|breaking in|hack|hacking|test|testing|probe"],
                  ["weakness|weaknesses|vulnerab|hole|holes|flaw|gap|problem|"
                   "before an attacker|before someone"],
                  exemplar="Deliberately attacking a system to find its weaknesses before a "
                           "real attacker does.")],
              example="Deliberately attacking a system, with permission, in order to find "
                      "its weaknesses before a real attacker does.",
              paraphrase="Testing a system by trying to break into it, so that any holes can "
                         "be fixed first.",
              fb="Attacking on purpose, to find the holes. Both halves.", cw="state"),
        written("Explain why user access levels improve the security of a school network.", 2,
                [mp("each person can only reach the data their role needs",
                    ["only|just|limited|restrict|restricted|permission|allowed|"
                     "their own|role|need"],
                    exemplar="Each person can only reach the data their role needs."),
                 mp("so an account that is broken into gives the attacker much less",
                    ["less|limited|not everything|cannot reach|damage|contained|"
                     "broken into|compromised|stolen|accident|cannot change"],
                    developed=True,
                    exemplar="So if a pupil's account is broken into, the attacker still "
                             "cannot reach staff data.")],
                example="Access levels mean a pupil can only reach their own work and a "
                        "teacher only their own classes, so if an account is broken into, or "
                        "somebody deletes something by accident, the damage is limited to "
                        "what that account could reach in the first place.",
                paraphrase="People are restricted to the files their role requires, which "
                           "means a compromised or careless account can only affect a small "
                           "part of the system.",
                fb="Restriction, then what the restriction limits when something goes wrong.",
                diff="apply", exam=True),
        sort("A school has had a security review. Sort each recommendation by the kind of "
             "defence it is.",
             ["Technical", "Physical", "People"],
             [["Install a firewall on the network", "Technical"],
              ["Keep the server room locked", "Physical"],
              ["Train staff to recognise phishing emails", "People"],
              ["Require passwords of at least twelve characters", "Technical"],
              ["Fit CCTV in the computer rooms", "Physical"],
              ["Write an acceptable use policy everyone signs", "People"]],
             fb="Most real systems need all three. An attacker only has to find the weakest "
                "one.",
             diff="apply"),
        extended("A small business has been hit by ransomware and has lost a week's work. "
                 "Discuss the measures it should put in place, and recommend which to do "
                 "first.", 6,
                 [mp("explains what ransomware did and why the data was lost"),
                  mp("argues for regular backups kept separately from the network"),
                  mp("argues for anti-malware software and keeping systems updated"),
                  mp("argues for staff training, since most ransomware arrives by email"),
                  mp("argues for user access levels to limit how far an infection spreads"),
                  mp("recommends one measure to do first, with a reason")],
                 example="Ransomware encrypts the files on a system and demands payment for "
                         "the key, and because the business had no usable copy of its work it "
                         "lost everything created that week. The single most important "
                         "measure is a backup regime: regular backups kept off the network, "
                         "so that an infection cannot reach them and the files can simply be "
                         "restored rather than paid for. Alongside that, anti-malware "
                         "software and prompt operating system updates close the holes most "
                         "ransomware arrives through, and user access levels limit how much "
                         "of the business one infected account can encrypt. But the measure "
                         "that matters most is staff training, because the great majority of "
                         "ransomware arrives in an email attachment that somebody opened, and "
                         "no technical measure prevents that. I would do the backups first, "
                         "because they are quick to set up and they are the only measure that "
                         "works even when everything else has failed.",
                 fb="You mark this one yourself against the points above. The mark most "
                    "answers miss is the last: a recommendation with a reason, not a list.",
                 bands=["CONTENT", "APPLICATION", "DEVELOPMENT", "BALANCE", "CONCLUSION"]),
    ]),

    sub("Choosing a defence", "ns-l10-s5", ["ns-l10-o2"], [
        match("Match each threat to the defence that best addresses it.",
              [["Brute-force attack", "A password policy and account lockout"],
               ["Data interception", "Encryption"],
               ["Someone walking in and taking a server", "Physical security"],
               ["Malware in an email attachment", "Anti-malware software and staff training"]],
              fb="Each defence is aimed at a particular threat. An exam answer that names "
                 "the wrong one earns nothing, however well it is explained.",
              diff="apply", exam=True),
        written("Explain why encryption protects data that has already been stolen.", 2,
                [mp("the data is scrambled and cannot be read without the key",
                    ["scramble|unreadable|cannot be read|cannot be understood|meaningless|"
                     "nonsense|cipher|jumbled"],
                    exemplar="The stolen data is scrambled and cannot be read without the "
                             "key."),
                 mp("so it is of no use to whoever took it",
                    ["no use|useless|worthless|cannot use|no value|cannot do anything|tells them nothing|"
                     "pointless|no good|means nothing|cannot read it"],
                    developed=True,
                    exemplar="So it is of no use to whoever took it.")],
                example="Encrypted data is scrambled into a form that cannot be read without "
                        "the key, so even though the attacker has the file, what they have is "
                        "meaningless and of no use to them.",
                paraphrase="Because the information has been turned into something unreadable "
                           "without the key, the thief ends up with a file that tells them "
                           "nothing.",
                fb="Encryption does not stop theft; it makes the theft worthless.",
                misc="A common wrong answer is that encryption stops data being stolen. It "
                     "does not.",
                diff="apply", exam=True),
    ]),
]
