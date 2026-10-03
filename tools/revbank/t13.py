"""1.3 Computer networks, connections and protocols: the revision bank.

Thirteen taught lessons, and the topic where most exam marks are lost to answers
that name a thing without saying what it does. So the written questions here
lean on the second half of that: not "what is a switch" but "why does a switch
send a frame to one port and a hub sends it to all of them".
"""
from revkit import (mcq, tf, multi, match, order, sort, short, written, extended,
                    num, step, sub, mp)

TOPIC = "1.3"

FASTER = "fast|faster|quick|quicker|speed|speeds up|more data"
SLOWER = "slow|slower|slowly|takes longer|less quick|sluggish"

BANK = [

    # ============================================================ nw-l01
    sub("Standalone and networked computers", "nw-l01-s1", ["nw-l01-o1"], [
        short("State what is meant by a standalone computer.",
              [mp("a computer that is not connected to a network",
                  ["not connected|no connection|not on a network|not networked|"
                   "no network|on its own|by itself|alone|isolated|not linked"],
                  exemplar="A computer that is not connected to a network.")],
              example="A computer that is not connected to any network.",
              paraphrase="A machine working on its own, with no network connection.",
              fb="Not connected is the whole definition. Being portable or old has nothing "
                 "to do with it.", cw="state"),
        mcq("Two standalone computers in the same room need to share a file. What has to "
            "happen?",
            "The file has to be copied onto something and carried across",
            ["The file is sent automatically when both are switched on",
             "One computer prints it and the other scans it back in",
             "The file cannot be shared at all"],
            fb="Without a network, the only route is physical. That inconvenience is the "
               "argument for networking.",
            diff="understand"),
    ]),

    sub("LAN and WAN", "nw-l01-s11", ["nw-l01-o2"], [
        match("Match each term to what it means.",
              [["LAN", "A network over a small geographical area, on hardware the "
                       "organisation owns"],
               ["WAN", "A network over a large geographical area, using connections the "
                       "organisation does not own"]],
              fb="Size is the obvious difference; who owns the cable is the one that gets "
                 "the marks.",
              diff="retrieve"),
        mcq("Which of these is a wide area network?",
            "The internet",
            ["A school's computer rooms, linked by its own switches",
             "Two laptops sharing files over Bluetooth",
             "A home router and the devices connected to it"],
            fb="The internet is the largest WAN there is. The other three are all local."),
        written("Explain one difference between a LAN and a WAN, other than their size.", 2,
                [mp("a LAN uses hardware the organisation owns",
                    ["lan|local area network|local network", "own|owns|owned|belongs|their own|its own"],
                    exemplar="A LAN runs on hardware the organisation owns itself."),
                 mp("a WAN uses connections provided by someone else, such as a "
                    "telecommunications company",
                    ["wan|wide area network", "someone else|third party|rent|rented|leased|"
                     "telecom|bt|provider|isp|does not own|not owned|hired"],
                    exemplar="A WAN uses connections rented from a telecommunications "
                             "company.")],
                example="A LAN runs on cables and switches the organisation owns and looks "
                        "after itself, while a WAN uses connections provided by a "
                        "telecommunications company that the organisation rents rather than "
                        "owns.",
                paraphrase="With a local network the company owns all the equipment, whereas "
                           "a wide area network relies on lines leased from an outside "
                           "provider.",
                fb="Ownership of the connections. Saying only 'a WAN is bigger' is the size "
                   "difference the question rules out.",
                diff="understand", exam=True),
        tf("A WAN is always slower than a LAN.", False,
           fb="False, though it usually is. A WAN crosses longer distances on connections "
              "shared with others, which normally means more latency — but a leased "
              "fibre WAN can be faster than an old LAN.",
           misc="'WAN means slow' is a rule of thumb, not a definition."),
    ]),

    sub("Advantages and disadvantages of networking", "nw-l01-s8",
        ["nw-l01-o3", "nw-l01-o4"], [
        sort("Sort each statement by whether it is an advantage or a disadvantage of "
             "networking a set of computers.",
             ["Advantage", "Disadvantage"],
             [["Files can be shared without copying them onto a drive", "Advantage"],
              ["One printer can serve a whole room", "Advantage"],
              ["Updates can be installed from one place", "Advantage"],
              ["Malware can spread from one machine to all of them", "Disadvantage"],
              ["If the server fails, nobody can work", "Disadvantage"],
              ["Setting it up costs money and needs expertise", "Disadvantage"]],
             fb="Sharing is the advantage and the disadvantage: whatever can be shared "
                "includes the things you did not want shared.",
             diff="understand"),
        written("A small business is deciding whether to network its six computers. Explain "
                "one disadvantage it should consider.", 2,
                [mp("names a real disadvantage: cost, expertise, malware spreading, or a "
                    "single point of failure",
                    ["cost|costs|expensive|money|price|pay"],
                    ["malware|virus|worm|ransomware|infection|spread"],
                    ["server fail|server goes down|single point|everyone stops|nobody can|"
                     "whole network|all of them stop"],
                    ["expert|expertise|technician|skill|training|manage|maintain"],
                    exemplar="Malware on one computer could spread to all of them."),
                 mp("and explains what it would mean for this business",
                    ["business|company|staff|work|six|they|them|everyone"],
                    developed=True,
                    exemplar="This means one infected machine could stop the whole business "
                             "working.")],
                example="Malware is the main risk: on standalone machines an infection stays "
                        "where it lands, but on a network it can spread to all six computers, "
                        "so one careless download could stop the whole business working.",
                paraphrase="If one machine picks up a virus it can travel to every other "
                           "computer on the network, which means the entire business could "
                           "be brought to a halt by a single infection.",
                fb="Name it, then say what it costs this business. The second mark is the "
                   "application.",
                diff="apply", exam=True),
    ]),

    # ============================================================ nw-l02
    sub("Bandwidth", "nw-l02-s1", ["nw-l02-o1", "nw-l02-o2"], [
        short("State what is meant by bandwidth.",
              [mp("the amount of data that can be carried in a given time",
                  ["amount|quantity|how much|volume|data|bits",
                   "time|second|per second|at once|given time"],
                  exemplar="The amount of data that can be sent in a given time.")],
              example="The amount of data that can be carried over a connection in a given "
                      "time, usually measured in megabits per second.",
              paraphrase="How much data the connection can carry each second.",
              fb="A rate, not a speed: it is how much goes through, not how fast each bit "
                 "travels.", cw="state"),
        written("Explain why a network slows down when many users are connected at once.", 2,
                [mp("the available bandwidth is shared between them",
                    ["shared|share|sharing|divided|split|between them|each gets less"],
                    exemplar="The bandwidth is shared between all the users."),
                 mp("so each user has less of it and their data takes longer to arrive",
                    ["less|smaller share|slower|takes longer|wait|queue|congestion|"
                     "collision|delay"],
                    developed=True,
                    exemplar="So each one has less of it and their data takes longer to "
                             "arrive.")],
                example="There is a fixed amount of bandwidth and it is shared between "
                        "everybody using the network, so the more users there are the less "
                        "each one gets and the longer their data takes to arrive.",
                paraphrase="Everyone is drawing on the same fixed capacity, which means each "
                           "person's share shrinks as more join and their transfers take "
                           "longer.",
                fb="Shared, therefore less each. The second mark is the consequence.",
                diff="understand", exam=True),
    ]),

    sub("What affects network performance", "nw-l02-s5", ["nw-l02-o1"], [
        multi("Which of these affect the performance of a network? Tick all that apply.",
              ["Bandwidth", "The number of users connected", "The transmission media used",
               "The error rate", "Latency", "The colour of the cables"],
              ["Bandwidth", "The number of users connected", "The transmission media used",
               "The error rate", "Latency"],
              fb="Five real factors. The error rate matters because every corrupted packet "
                 "has to be sent again.",
              diff="retrieve"),
        short("State what is meant by latency.",
              [mp("the delay before data arrives",
                  ["delay|lag|time taken|wait|how long|time it takes|pause"],
                  exemplar="The delay between sending data and it arriving.")],
              example="The delay between data being sent and it arriving at the other end.",
              paraphrase="The lag before the data gets there.",
              fb="Latency is a delay, not a quantity. A connection can have huge bandwidth "
                 "and poor latency — a satellite link is the classic example.",
              cw="state"),
        written("A video call over a satellite connection has plenty of bandwidth but is "
                "still difficult to hold. Explain why.", 2,
                [mp("the signal has a long way to travel, so latency is high",
                    ["latency|delay|lag"],
                    ["distance|far|long way|thousands of|orbit|space|travel"],
                    exemplar="The signal has to travel out to the satellite and back, so "
                             "there is a long delay."),
                 mp("and a conversation needs the delay to be short, not the bandwidth to "
                    "be large",
                    ["conversation|talk|talking|speaking|real time|interrupt|"
                     "talk over|reply|response"],
                    developed=True,
                    exemplar="A conversation needs a short delay rather than a lot of "
                             "bandwidth, so people keep talking over each other.")],
                example="The signal has to travel up to the satellite and back down again, "
                        "which is a very long way, so the latency is high. A conversation "
                        "depends on short delays rather than on large bandwidth, so the two "
                        "people keep talking over each other.",
                paraphrase="Because the data goes all the way to orbit and back there is a "
                           "noticeable lag, and holding a conversation depends on quick "
                           "responses rather than on how much data can be carried.",
                fb="Bandwidth and latency are different things. This question is entirely "
                   "about the second one.",
                hint="How far does the signal actually travel, and what does a conversation "
                     "need that a file download does not?",
                diff="stretch", exam=True),
        mcq("A school replaces its copper cables with fibre optic. Which network problem is "
            "this most likely to improve?",
            "A high error rate causing packets to be resent",
            ["The number of users connected at once",
             "The distance to the web server",
             "The cost of running the network"],
            fb="Fibre is immune to electrical interference, so fewer packets are corrupted "
               "and fewer have to be sent again.",
            diff="apply"),
    ]),

    # ============================================================ nw-l03
    sub("Client-server and peer-to-peer", "nw-l03-s1", ["nw-l03-o1", "nw-l03-o2"], [
        mcq("In a client-server network, what does the server do?",
            "It provides services and resources that the clients request",
            ["It shares its files equally with every other computer",
             "It connects the network to the internet",
             "It converts domain names into IP addresses"],
            fb="A server serves. Connecting to the internet is a router's job, and names to "
               "addresses is DNS."),
        sort("Sort each statement by the network model it describes.",
             ["Client-server", "Peer-to-peer"],
             [["Files are stored centrally and backed up in one place", "Client-server"],
              ["Every computer has equal status", "Peer-to-peer"],
              ["Cheaper to set up, with no dedicated hardware", "Peer-to-peer"],
              ["Easier to keep secure and to manage accounts", "Client-server"],
              ["If one machine is switched off, its files are unavailable", "Peer-to-peer"],
              ["Needs expertise to administer", "Client-server"]],
             fb="Central control is the client-server trade: easier to manage, more "
                "expensive, and one failure takes everything with it.",
             diff="understand"),
        written("A small design studio with four computers and no IT staff is choosing "
                "between a client-server and a peer-to-peer network. Recommend one and "
                "justify your choice.", 3,
                [mp("recommends peer-to-peer",
                    ["peer|p2p|peer to peer|peertopeer"],
                    exemplar="I would recommend a peer-to-peer network."),
                 mp("because it needs no dedicated server and is cheaper to set up",
                    ["no server|without a server|no dedicated|no need for a server|"
                     "cheap|cheaper|less expensive|costs less|no extra hardware|"
                     "do not warrant|not worth buying"],
                    exemplar="It needs no dedicated server, so it is cheaper to set up."),
                 mp("and it needs no specialist to administer it, which suits a studio with "
                    "no IT staff",
                    ["no it staff|no technician|no expert|no expertise|easy to set up|"
                     "simple|anyone can|no administrator|no specialist|nobody employed|nobody to manage|no staff|run themselves|run it themselves"],
                    developed=True,
                    exemplar="It also needs no specialist to run it, which matters when "
                             "there are no IT staff.")],
                example="A peer-to-peer network. With only four computers there is no need "
                        "for a dedicated server, so it is cheaper to set up, and it needs no "
                        "specialist administrator, which matters in a studio with no IT staff "
                        "to look after it.",
                paraphrase="I would go with peer to peer: four machines do not warrant buying "
                           "a server, so it costs less, and because there is nobody employed "
                           "to manage a network it has to be something they can run "
                           "themselves.",
                fb="A recommendation, then two reasons, and the second one has to connect to "
                   "something the question told you.",
                cw="justify", diff="apply", exam=True),
    ]),

    # ============================================================ nw-l04
    sub("LAN hardware", "nw-l04-s1", ["nw-l04-o1", "nw-l04-o2"], [
        match("Match each piece of network hardware to its job.",
              [["Switch", "Sends a frame only to the device it is addressed to"],
               ["Router", "Sends data between different networks"],
               ["Wireless access point", "Lets devices join the network without a cable"],
               ["Network interface card", "Gives a device its MAC address and its connection"]],
              fb="A switch works within one network; a router works between networks.",
              diff="understand"),
        written("Explain why a switch is more efficient than a hub.", 2,
                [mp("a switch sends data only to the device it is addressed to",
                    ["only|just|single|one device|the right device|intended|destination|"
                     "correct device"],
                    exemplar="A switch sends the data only to the device it is addressed to."),
                 mp("so less of the network's bandwidth is wasted on devices that do not "
                    "need the data",
                    ["bandwidth|traffic|congestion|collision|wasted|unnecessary|"
                     "every device|all devices|broadcast"],
                    developed=True,
                    exemplar="This means less bandwidth is wasted sending data to devices "
                             "that do not want it.")],
                example="A switch reads the MAC address on each frame and sends it only to "
                        "the port the destination device is on, whereas a hub sends it to "
                        "every port, so a switch wastes far less of the network's bandwidth.",
                paraphrase="Because a switch directs each frame to just the intended machine "
                           "rather than broadcasting it everywhere, much less of the "
                           "available capacity is used up on traffic nobody wanted.",
                fb="One device rather than all of them, and then what that saves.",
                diff="apply", exam=True),
        mcq("Which piece of hardware joins a home network to the internet?",
            "A router", ["A switch", "A network interface card",
                         "A wireless access point"],
            fb="A router moves data between networks — here, between the home LAN and "
               "the internet."),
        written("Compare UTP copper cable with fibre optic cable for connecting two school "
                "buildings 400 metres apart.", 4,
                [mp("fibre carries data much further without the signal weakening",
                    ["fibre|fiber|optic|optical", "further|greater runs|greater distance|longer distance|long distance|"
                     "does not weaken|no attenuation|400|hundreds of metres"],
                    exemplar="Fibre can carry the signal far further than copper without it "
                             "weakening."),
                 mp("copper is limited to about 100 metres, which is not far enough here",
                    ["100|hundred|limit|limited|only", "metre|meter|m\\b"],
                    ["not far enough|too short|would not reach|not enough"],
                    exemplar="UTP is limited to about 100 metres, so it would not reach."),
                 mp("fibre is immune to electrical interference, so the error rate is lower",
                    ["not affected by interference|not affected by electrical|unaffected|immune|no interference|does not pick up|not disturbed"],
                    exemplar="Fibre is not affected by electrical interference."),
                 mp("but fibre is more expensive to buy and to install",
                    ["expensive|costly|dearer|cost more|more to install|price"],
                    exemplar="Fibre costs more to buy and to install.")],
                example="UTP copper is limited to about 100 metres before the signal weakens "
                        "too much, so it could not cover 400 metres in one run. Fibre optic "
                        "carries the signal far further without weakening, and because it "
                        "uses light it is immune to the electrical interference that copper "
                        "picks up, so the error rate is lower. The drawback is cost: fibre "
                        "and the equipment to terminate it are considerably more expensive.",
                paraphrase="Twisted pair only works over about a hundred metres, which is "
                           "nowhere near the distance needed, while optical cable manages "
                           "far greater runs and is unaffected by electrical noise, giving "
                           "fewer errors. Against that, it is dearer to buy and to fit.",
                fb="Four points, and the distance one is the one the scenario is really "
                   "asking about.",
                cw="compare", diff="stretch", exam=True),
    ]),

    # ============================================================ nw-l05
    sub("The internet and DNS", "nw-l05-s2", ["nw-l05-o1", "nw-l05-o2"], [
        short("State what the Domain Name Service does.",
              [mp("it translates a domain name into an IP address",
                  ["domain name|url|web address|site name|hostname"],
                  ["ip address|ip|internet protocol address|numerical address"],
                  exemplar="It translates a domain name into an IP address.")],
              example="It translates a domain name such as revise360.co.uk into the IP "
                      "address of the server that holds the site.",
              paraphrase="It converts a web address people type into the numerical address "
                         "computers use.",
              fb="Name in, address out. Both halves are needed.", cw="state"),
        order("Put these steps in order for what happens when a user types a web address "
              "into a browser.",
              ["The browser asks a domain name server for the IP address",
               "The domain name server returns the IP address",
               "The browser requests the page from the web server at that address",
               "The web server sends the page back to the browser"],
              fb="The name has to become an address before anything can be requested.",
              diff="apply", exam=True),
        mcq("A domain name server does not have the address being asked for. What happens?",
            "It passes the request on to another domain name server",
            ["The page cannot be loaded and an error is shown immediately",
             "The browser guesses the IP address from the domain name",
             "The request is sent to every computer on the internet"],
            fb="DNS is a hierarchy: a server that does not know asks one that is more likely "
               "to.",
            diff="apply"),
        written("Explain what is meant by 'the cloud'.", 2,
                [mp("data and software are stored on remote servers rather than on the "
                    "user's own device",
                    ["remote|someone else|somebody else|other|another|data centre|data center|internet|"
                     "online|offsite|elsewhere",
                     "server|servers|computer|computers|machine|machines|storage"],
                    exemplar="Data is stored on remote servers rather than on the user's own "
                             "computer."),
                 mp("and is reached over the internet from any device",
                    ["internet|online|network|anywhere|any device|any computer|"
                     "from home|access"],
                    exemplar="It is reached over the internet from any device.")],
                example="The cloud means storing data and running software on remote servers "
                        "owned by someone else, rather than on your own computer, and "
                        "reaching them over the internet from any device.",
                paraphrase="Your files and programs live on somebody else's machines in a "
                           "data centre, and you get at them through the internet from "
                           "wherever you are.",
                fb="Somewhere else, reached over the internet. 'The cloud is the internet' is "
                   "not enough on its own.",
                diff="understand"),
    ]),

    # ============================================================ nw-l06
    sub("Star topology", "nw-l06-s1", ["nw-l06-o1", "nw-l06-o4"], [
        mcq("In a star network, how is each device connected?",
            "By its own cable to a central switch",
            ["To the two devices either side of it",
             "To every other device on the network",
             "By a single cable that every device shares"],
            fb="Its own cable to the centre. That is why one failing cable affects one "
               "device."),
        written("Explain one advantage of a star network over a network where all devices "
                "share one cable.", 2,
                [mp("each device has its own connection to the switch",
                    ["own cable|own connection|own line|separate cable|separate line|separate connection|individual|its own|dedicated"],
                    exemplar="Each device has its own cable to the switch."),
                 mp("so one cable failing affects only that device, and there are no "
                    "collisions",
                    ["only one device|just one device|one device|that one device|"
                     "rest keep working|others continue|rest carry on|one computer|"
                     "only the computer|only the machine|a single device|"
                     "no collision|collisions|does not affect"],
                    developed=True,
                    exemplar="So if one cable fails only that device is affected and the "
                             "rest keep working.")],
                example="In a star network each device has its own cable to the central "
                        "switch, so if one cable fails only that one device drops off and "
                        "everybody else carries on working.",
                paraphrase="Every machine runs a separate line to the switch, which means a "
                           "broken cable only takes out the computer at the end of it.",
                fb="Own cable, therefore isolated failure. Either consequence — one "
                   "device affected, or no collisions — earns the second mark.",
                diff="understand", exam=True),
        mcq("What is the main disadvantage of a star network?",
            "If the central switch fails, the whole network goes down",
            ["Data has to pass through every other device first",
             "Only one device can send data at a time",
             "Every device needs to know every other device's address"],
            fb="The centre is a single point of failure. That is the price of the "
               "convenience."),
    ]),

    sub("Mesh topology", "nw-l06-s6", ["nw-l06-o2", "nw-l06-o3", "nw-l06-o4"], [
        short("State what is meant by a full mesh network.",
              [mp("every device is connected directly to every other device",
                  ["every|all|each", "connected|connection|link|linked|joined"],
                  exemplar="Every device is connected directly to every other device.")],
              example="A network in which every device is connected directly to every other "
                      "device.",
              paraphrase="All the machines are linked to all of the others.",
              fb="Every device to every other. A partial mesh has some of those connections "
                 "but not all.", cw="state"),
        written("Explain why a mesh network is more reliable than a star network.", 2,
                [mp("there is more than one route between any two devices",
                    ["more than one route|more than one path|several routes|several paths|many routes|another route|another path|"
                     "multiple paths|different paths|alternative|other path|different route|reroute|redirect"],
                    exemplar="There is more than one route between any two devices."),
                 mp("so if one connection fails the data can take a different path",
                    ["fail|fails|breaks|broken|goes down|lost|damaged|cut"],
                    developed=True,
                    exemplar="So if one connection fails the data simply takes another "
                             "route.")],
                example="In a mesh there is more than one route between any two devices, so "
                        "if a connection fails the data can be sent by a different path, "
                        "whereas in a star everything depends on the one switch in the middle.",
                paraphrase="Because several different paths link each pair of devices, a "
                           "broken link just means the traffic goes round another way.",
                fb="More than one route, therefore a failure is survivable.",
                diff="understand", exam=True),
        tf("The internet is an example of a full mesh network.", False,
           fb="False. It is a partial mesh: there are many alternative routes, but no "
              "computer is connected directly to every other one.",
           misc="A full mesh of the internet would need an impossible number of "
                "connections.", diff="understand"),
        written("A full mesh network of 50 computers is rarely built. Explain why.", 2,
                [mp("the number of connections needed is enormous",
                    ["number of|how many|lots of|huge|enormous|many|1225|hundreds|thousands"],
                    ["cable|connection|link|wire|port"],
                    exemplar="The number of cables needed is enormous."),
                 mp("which makes it very expensive and difficult to install",
                    ["expensive|cost|costly|price"],
                    ["difficult|hard|impractical|complex|time consuming|awkward"],
                    developed=True,
                    exemplar="This makes it far too expensive and difficult to install.")],
                example="Every computer would need a direct connection to all 49 others, "
                        "which is well over a thousand cables in total, so the cost of the "
                        "cable and the difficulty of installing it make a full mesh "
                        "impractical at that size.",
                paraphrase="Each machine would have to be wired to all the rest, running to "
                           "more than a thousand links, which is far too costly and awkward "
                           "to put in.",
                fb="The number of connections grows very fast, and the cost and difficulty "
                   "grow with it.",
                diff="stretch", exam=True),
        num("In a full mesh network of 6 computers, how many connections are needed?", 15,
            working="6 * 5 / 2", unit="connections",
            fb="Each of the 6 connects to 5 others, and each cable is counted twice, so "
               "(6 × 5) ÷ 2 = 15.",
            hint="How many does each computer need, and how many times is each cable "
                 "counted?",
            diff="stretch", exam=True),
    ]),

    # ============================================================ nw-l09
    sub("Wired and wireless connections", "nw-l09-s5",
        ["nw-l09-o1", "nw-l09-o2", "nw-l09-o3"], [
        sort("Sort each statement by the kind of connection it describes.",
             ["Wired", "Wireless"],
             [["Usually faster and more reliable", "Wired"],
              ["Lets a device be moved around freely", "Wireless"],
              ["Signal can be weakened by walls and distance", "Wireless"],
              ["Harder for someone outside the building to intercept", "Wired"],
              ["Needs no cable to be run to each device", "Wireless"],
              ["Less affected by other devices nearby", "Wired"]],
             fb="Wired wins on speed, reliability and security; wireless wins on convenience.",
             diff="understand"),
        mcq("Why is Bluetooth used for a wireless keyboard rather than Wi-Fi?",
            "It uses very little power and is designed for short-range links between two "
            "devices",
            ["It has much higher bandwidth than Wi-Fi",
             "It works over a much longer range than Wi-Fi",
             "It encrypts data and Wi-Fi does not"],
            fb="Bluetooth is for short range and low power. Wi-Fi is faster and reaches "
               "further, and both can be encrypted.",
            diff="apply"),
        written("A library is installing a network for visitors' laptops and its own "
                "catalogue computers. Recommend a connection type for each, and justify "
                "your choices.", 4,
                [mp("wireless for the visitors' laptops",
                    ["wireless|wifi|wi-fi"],
                    exemplar="Wi-Fi for the visitors' laptops."),
                 mp("because visitors move around and cannot be cabled in",
                    ["move|moving|anywhere|around|different|sit|their own device|"
                     "no cable|cannot be wired|convenient"],
                    exemplar="Visitors sit wherever they like, so they cannot be cabled in."),
                 mp("wired for the catalogue computers",
                    ["wired|ethernet|cable|cabled"],
                    exemplar="Wired Ethernet for the catalogue computers."),
                 mp("because they stay in one place and need a fast, reliable and more "
                    "secure connection",
                    ["fixed|stay|do not move|one place|permanent"],
                    ["fast|faster|reliable|reliability|secure|security|stable"],
                    exemplar="They never move, and a wired link is faster, more reliable "
                             "and harder to intercept.")],
                example="The visitors' laptops should use Wi-Fi, because visitors sit "
                        "wherever they like and cannot be cabled in. The catalogue computers "
                        "should be wired with Ethernet: they stay in one place, so running a "
                        "cable is easy, and a wired connection is faster, more reliable and "
                        "harder for anybody to intercept.",
                paraphrase="Give the public wireless access, since they move about the "
                           "building and could not be plugged in anywhere useful. Put the "
                           "library's own terminals on cable, as they are fixed in position "
                           "and benefit from the greater speed, stability and security.",
                fb="Two recommendations and a reason for each. A reason that could apply to "
                   "either one is not really a justification.",
                cw="justify", diff="apply", exam=True),
    ]),

    # ============================================================ nw-l10
    sub("Encryption and keys", "nw-l10-s3", ["nw-l10-o1", "nw-l10-o3", "nw-l10-o4"], [
        short("State what encryption does to data.",
              [mp("it scrambles the data so it cannot be understood without the key",
                  ["scramble|scrambled|unreadable|cannot be read|cannot be understood|"
                   "meaningless|cipher|ciphertext|jumbled|coded|unintelligible|"
                   "not readable"],
                  exemplar="It scrambles the data so it cannot be understood without the "
                           "key.")],
              example="It scrambles the data into a form that cannot be understood by anyone "
                      "without the key.",
              paraphrase="It turns the information into something unreadable unless you hold "
                         "the key.",
              fb="Unreadable without the key. Encryption does not stop data being "
                 "intercepted — it stops it being useful once it has been.",
              cw="state"),
        written("Explain why encrypting data sent over a public Wi-Fi network protects a "
                "user, even though anyone nearby can pick up the signal.", 3,
                [mp("the signal can still be intercepted",
                    ["intercept|intercepted|pick up|picked up|capture|captured|received|"
                     "read the signal|listen"],
                    exemplar="Anyone nearby can still intercept the signal."),
                 mp("but encrypted data is meaningless without the key",
                    ["without the key|no key|do not have the key|unless they have the key"],
                    ["unreadable|meaningless|nonsense|scrambled|cannot read|"
                     "cannot understand|no use"],
                    exemplar="What they intercept is meaningless without the key."),
                 mp("so the data is useless to the attacker",
                    ["useless|no use|cannot use|worthless|cannot do anything|safe|"
                     "protected|cannot read it|tells them nothing|means nothing|gets them nothing|of no value"],
                    developed=True,
                    exemplar="So the data is of no use to them.")],
                example="Encryption does not stop the signal being intercepted — anybody "
                        "in range can still capture it. What it does is turn the data into "
                        "something meaningless to anyone without the key, so even though the "
                        "attacker has the data, it is useless to them.",
                paraphrase="Someone nearby can certainly capture what is transmitted, but "
                           "because it has been scrambled and they have no key, what they "
                           "end up with tells them nothing.",
                fb="Three ideas, and the first one matters: encryption is not a way of "
                   "hiding the signal.",
                misc="A common wrong answer is that encryption stops the data being "
                     "intercepted. It does not.",
                diff="apply", exam=True),
        written("Explain why a private key must never be shared.", 2,
                [mp("anyone with the private key can decrypt the messages",
                    ["decrypt|read|unscramble|open|understand|access"],
                    exemplar="Anyone who has the private key can decrypt the messages."),
                 mp("so sharing it removes the protection entirely",
                    ["no longer|not secure|no protection|pointless|useless|removes|"
                     "anyone could|not private|no point|stops protecting|nothing is protected|protects nothing"],
                    developed=True,
                    exemplar="So sharing it means the encryption no longer protects "
                             "anything.")],
                example="The private key is what decrypts the messages, so anyone who has a "
                        "copy of it can read everything that was meant to be protected, which "
                        "means sharing it removes the protection completely.",
                paraphrase="Whoever holds that key can unscramble the messages, so passing it "
                           "around means the encryption stops protecting anything at all.",
                fb="What the key does, and what sharing it costs. The public key may be "
                   "shared freely — that is the point of it.",
                diff="understand"),
    ]),

    # ============================================================ nw-l11
    sub("MAC and IP addressing", "nw-l11-s1", ["nw-l11-o1"], [
        match("Match each kind of address to what it identifies.",
              [["MAC address", "A specific piece of hardware, set when it was manufactured"],
               ["IP address", "A device's position on a network, which can change"]],
              fb="MAC is permanent and belongs to the hardware; IP is assigned and can "
                 "change when a device moves network.",
              diff="retrieve"),
        mcq("A laptop is taken from home to school. Which of its addresses changes?",
            "Its IP address", ["Its MAC address", "Both of them", "Neither of them"],
            fb="The MAC address is burnt into the network interface card. The IP address is "
               "given out by whichever network the laptop joins.",
            diff="apply", exam=True),
        written("Explain why IPv6 was developed.", 2,
                [mp("IPv4 addresses were running out",
                    ["running out|ran out|run out|not enough|too few|exhausted|"
                     "no more|limited|shortage|4 billion|4.3 billion"],
                    exemplar="The supply of IPv4 addresses was running out."),
                 mp("because IPv6 uses many more bits, it provides vastly more addresses",
                    ["128|more bits|longer|bigger|more addresses|far more|vastly more|"
                     "huge number|trillions"],
                    exemplar="IPv6 uses 128 bits, which gives vastly more addresses.")],
                example="IPv4 uses 32 bits, which gives about four billion addresses, and "
                        "with so many devices connecting they were running out. IPv6 uses 128 "
                        "bits, which provides an enormous number of addresses and removes the "
                        "problem.",
                paraphrase="There were simply not enough of the old 32-bit addresses left for "
                           "all the devices coming online, so a scheme with 128 bits and a "
                           "far larger supply was introduced.",
                fb="Running out, then what IPv6 does about it.",
                diff="understand", exam=True),
        mcq("How many bits does an IPv4 address use?",
            "32", ["8", "48", "128"],
            fb="32 bits, written as four numbers from 0 to 255. 48 bits is a MAC address and "
               "128 is IPv6."),
    ]),

    # ============================================================ nw-l12
    sub("Standards and protocols", "nw-l12-s1", ["nw-l12-o1"], [
        short("State what is meant by a protocol.",
              [mp("a set of rules for how devices communicate",
                  ["rule|rules|set of rules|agreement|standard|convention",
                   "communicate|communication|send|sending|transmit|exchange|talk to|data"],
                  exemplar="A set of rules for how devices communicate.")],
              example="A set of rules that says how data is to be sent between devices.",
              paraphrase="Agreed rules governing how machines exchange data.",
              fb="Rules for communicating. Without the second half it could be a definition "
                 "of anything.", cw="state"),
        written("Explain why standards are needed in computing.", 2,
                [mp("they let equipment from different manufacturers work together",
                    ["different|various|any|other|several", "manufacturer|maker|company|"
                     "vendor|brand|supplier"],
                    ["work together|compatible|interoperate|communicate|connect|"
                     "talk to each other"],
                    exemplar="They let equipment made by different companies work together."),
                 mp("so a user is not tied to one manufacturer and more devices can be "
                    "connected",
                    ["not tied|not locked|locked to one|choice|any device|wider|more devices|free to choose|"
                     "mix|combine|several suppliers|any manufacturer|cheaper|competition"],
                    developed=True,
                    exemplar="So a buyer is not tied to one manufacturer's equipment.")],
                example="Standards mean equipment made by different manufacturers follows the "
                        "same rules, so it can be connected together — which means a "
                        "buyer is not tied to one company's products and can mix equipment "
                        "freely.",
                paraphrase="Because every maker follows the same agreed rules their devices "
                           "are compatible, so a customer can combine hardware from several "
                           "suppliers instead of being locked to one.",
                fb="Different manufacturers working together, then why that matters to "
                   "somebody.",
                diff="understand"),
        match("Match each protocol to what it is used for.",
              [["HTTPS", "Requesting web pages securely"],
               ["SMTP", "Sending email"],
               ["IMAP", "Reading email that stays on the server"],
               ["FTP", "Transferring files between computers"],
               ["TCP", "Splitting data into packets and checking they all arrive"],
               ["IP", "Routing packets across networks to the right address"]],
              fb="SMTP sends, IMAP reads. TCP looks after the packets; IP looks after where "
                 "they go.",
              diff="understand", exam=True),
        mcq("A user downloads email so that it is removed from the server and kept on one "
            "device. Which protocol is being used?",
            "POP", ["IMAP", "SMTP", "FTP"],
            fb="POP takes the mail off the server; IMAP leaves it there so several devices "
               "can see the same mailbox.",
            diff="apply"),
        written("Explain the difference between IMAP and POP.", 2,
                [mp("POP downloads the email and removes it from the server",
                    ["pop", "download|downloads|removes|removed|deletes|deleted|takes off|"
                     "off the server|one device"],
                    exemplar="POP downloads the email and removes it from the server."),
                 mp("IMAP leaves the email on the server so it can be read from several "
                    "devices",
                    ["imap", "leaves|stays|remains|kept|stored on the server|"
                     "several devices|multiple devices|any device|synchronise|sync"],
                    exemplar="IMAP leaves the email on the server so several devices can see "
                             "it.")],
                example="POP downloads messages to one device and removes them from the "
                        "server, so they can only be read there. IMAP leaves them on the "
                        "server, so the same mailbox can be read from a phone, a laptop and a "
                        "desktop and stays in step.",
                paraphrase="With POP the mail is pulled down to a single machine and taken "
                           "off the server; with IMAP it stays on the server and every device "
                           "sees the same thing.",
                fb="Both halves. The practical difference is whether a second device can see "
                   "the same mail.",
                diff="apply", exam=True),
    ]),

    # ============================================================ nw-l13
    sub("Layers", "nw-l13-s3", ["nw-l13-o1", "nw-l13-o2"], [
        multi("Which of these are advantages of dividing network protocols into layers? "
              "Tick all that apply.",
              ["A change to one layer does not require the others to be rewritten",
               "Each layer can be developed by different people",
               "It is easier to find where a fault is",
               "Data is transmitted faster than it would be without layers",
               "Less data has to be sent"],
              ["A change to one layer does not require the others to be rewritten",
               "Each layer can be developed by different people",
               "It is easier to find where a fault is"],
              fb="Layering is about managing complexity. It adds a little overhead rather "
                 "than removing any.",
              diff="understand"),
        written("Explain one advantage of layering network protocols.", 2,
                [mp("each layer can be changed or replaced on its own",
                    ["change|changed|replace|replaced|update|updated|improve|rewritten|"
                     "swap|swapped",
                     "one layer|a single layer|a layer|independently|on its own|"
                     "without affecting|without rewriting"],
                    exemplar="A layer can be changed without the others being rewritten."),
                 mp("because the layers only have to agree on what passes between them",
                    ["interface|between them|agree|agrees|boundary|"
                     "do not need to know|hidden|self contained|selfcontained"],
                    developed=True,
                    exemplar="This is because each layer only has to agree with its "
                             "neighbours on what passes between them.")],
                example="One layer can be changed or replaced without rewriting the others, "
                        "because each layer only has to agree with its neighbours about what "
                        "is passed between them — so Wi-Fi could replace Ethernet "
                        "underneath without anything above it changing.",
                paraphrase="You can swap out or improve a single layer on its own, since the "
                           "layers only need to agree on the interface between them rather "
                           "than on how each other works inside.",
                fb="Independence, and then the reason independence is possible.",
                diff="apply", exam=True),
        order("Put the four layers of the TCP/IP model in order, starting with the one "
              "closest to the user.",
              ["Application", "Transport", "Internet", "Link"],
              fb="Application at the top where the user is, link at the bottom where the "
                 "cable is.",
              diff="retrieve"),
        extended("A network manager is explaining to a head teacher why the school's network "
                 "uses layered protocols rather than one large program that does everything. "
                 "Discuss the arguments she could use.", 6,
                 [mp("explains what layering means in this context"),
                  mp("argues that a layer can be changed without the rest being rewritten"),
                  mp("argues that faults are easier to find when each layer is separate"),
                  mp("argues that different specialists can work on different layers"),
                  mp("acknowledges a cost: more overhead, or more complexity to understand"),
                  mp("reaches a judgement about whether layering is worth it here, with a "
                     "reason")],
                 example="Layering means the job of getting data from one machine to another "
                         "is divided into separate stages, each with its own rules, and each "
                         "only having to agree with its neighbours about what is passed "
                         "between them. The first argument is that this makes change "
                         "possible: when the school replaces its wireless access points, only "
                         "the bottom layer is affected and nothing above it has to be touched. "
                         "The second is that faults become findable: if web pages load but "
                         "email does not, the problem is in the application layer and not in "
                         "the cabling, which saves hours. The third is that nobody has to "
                         "understand all of it at once, so different specialists, and "
                         "different manufacturers, can work on different layers. Against "
                         "that, layering does add some overhead to every packet and is harder "
                         "to explain than one program would be. For a school network that has "
                         "to be maintained for years by people who did not build it, I would "
                         "say the ability to change and diagnose one layer at a time is worth "
                         "far more than the overhead it costs.",
                 fb="You mark this one yourself against the points above. The mark that "
                    "separates a discussion from a list is the last one: a judgement with a "
                    "reason attached.",
                 bands=["CONTENT", "APPLICATION", "DEVELOPMENT", "BALANCE", "CONCLUSION"]),
    ]),
]
