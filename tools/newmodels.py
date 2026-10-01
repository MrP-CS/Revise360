"""Where each 3D model belongs, and what it is there to explain.

A model earns its place when the thing is physical and turning it over shows
something a flat diagram cannot: layers inside a cable, what is and is not moving
inside a drive, how much of a phone is material that had to be dug up. Topics
that are genuinely abstract - algorithms, robust programs, programming languages
- get none, because a 3D box with a word on it teaches nothing.

Each entry is (experience id, station index, model kind, title, text). The
station index places the button at that panel's top right; see kit.py.
"""

PLACEMENTS = [
 # ---- 1.1 Systems architecture -----------------------------------------------
 ("sa-l04", 5, "system", "A general purpose computer",
  "The other side of the comparison. The washing machine runs one program it was built for; this runs whatever you install. Open the case and find the parts the embedded system does without: expansion slots, a graphics card, room to add storage."),

 # ---- 1.2 Memory and storage -------------------------------------------------
 ("ms-l01", 1, "ram", "Inside a memory module",
  "Turn the module over and look at the contacts and the chips. Every program you have open is held on these chips as charge, and charge needs power to stay put."),
 ("ms-l02", 2, "harddisk", "Where the swapping happens",
  "Virtual memory is space on this. Watch the arm: every swap means moving the head, which is why a machine that is swapping heavily feels so slow."),
 ("ms-l03", 1, "harddisk", "Inside a hard disk",
  "Magnetic storage with moving parts. Find the platters and the head, and notice how little space there is between them."),
 ("ms-l03", 2, "opticaldisc", "Inside an optical disc",
  "Follow the spiral track out from the centre and find the pits. The laser reads the change from pit to land as the 1s and 0s."),
 ("ms-l03", 3, "ssd", "Inside a solid state drive",
  "Open it up and look for something that moves. There is nothing: that is the whole difference, and the reason an SSD is faster and survives being dropped."),
 ("ms-l05", 1, "opticaldisc", "Why a disc for a film?",
  "Cheap to stamp out by the million, read-only so it cannot be altered, and it survives a shelf for years. Turn it over while you weigh up the options."),

 # ---- 1.3 Computer networks --------------------------------------------------
 ("nw-l04", 0, "switch", "Inside a switch",
  "Find the ports, the lights and the chip that does the work. The chip keeps a table of which device is on which port, which is how a switch sends a frame to one machine instead of all of them."),
 ("nw-l04", 1, "rj45", "Inside a UTP cable",
  "Four pairs, each one twisted. Turn it and look at the ends: the twisting is what keeps interference out, and the order of the eight wires in the plug has to be right."),
 ("nw-l04", 3, "fibre", "Inside a fibre optic cable",
  "The cable is stripped back in stages so you can see every layer. Watch the beam bounce off the boundary between core and cladding, all the way along."),
 ("nw-l05", 3, "rack", "What the cloud actually is",
  "The cloud is this: racks of other people's computers in a building somewhere, with a switch at the top and a great deal of cooling. Nothing is stored in the sky."),

 # ---- 1.4 Network security ---------------------------------------------------
 ("ns-l08", 1, "switch", "Where a sniffer sits",
  "Traffic for the whole network passes through here. Anything plugged into a port, or the switch itself if an attacker reaches it, can be made to copy what goes by."),

 # ---- 1.5 Systems software ---------------------------------------------------
 ("ss-l02", 2, "ram", "The memory being managed",
  "This is what the operating system is handing out. Each running process is given its own area on these chips, and kept out of everyone else's."),

 # ---- 1.6 Ethical, legal, cultural and environmental impacts ------------------
 ("el-l05", 1, "phone", "What a phone is made of",
  "Take it apart and click each part. Lithium and cobalt in the battery, indium in the screen, gold and rare earths on the board: all of it mined, and most of it never recovered."),

 # ---- 2.4 Boolean logic ------------------------------------------------------
 ("bl-l01", 0, "logicchip", "An AND gate you could hold",
  "Four AND gates on one sliver of silicon, with the lid made see-through. The truth table you fill in is a description of what this chip physically does."),
]

# A model that was never on a station panel at all: topic 1.1's motherboard sat
# on the front wall, where there is no tile to sit at the corner of. It belongs
# with the station about the wider system the CPU sits in.
RELOCATE = {
 ("sa-l01", "motherboard"): 5,      # "Other CPU components"
}

# Topics deliberately left without models: 2.1 Algorithms, 2.3 Producing robust
# programs and 2.5 Programming languages and IDEs. These are about process and
# notation rather than objects, and the interactive boards already carry them.
