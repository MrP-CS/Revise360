"""Where each 2D diagram belongs, and what it is there to explain.

The 3D models show what a thing looks like. These show what a thing does. A
diagram earns its place when the teaching point is a process over time, or a
structure whose shape is the point, and a panel of text cannot carry it: the
fetch-execute cycle running, headers being wrapped and unwrapped on their way
down and up a protocol stack, a wave being sampled, a list being sorted.

Each entry is (experience id, station index, diagram kind, title, text). The
station index puts the button at that panel's top LEFT, opposite the 3D button;
see the marker geometry in kit.py.
"""

PLACEMENTS = [
 # ---- 1.1 Systems architecture -----------------------------------------------
 ("sa-l01", 1, "fde", "Watch the cycle run",
  "Follow one instruction all the way round: the address out, the instruction back, decoded, executed. The order is the whole thing."),
 ("sa-l02", 1, "buses", "One memory, two kinds of thing",
  "Instructions and data sit in the same memory and come back along the same bus. Watch what that forces the CPU to do one at a time."),
 ("sa-l03", 0, "cpuperf", "What actually makes it faster",
  "Clock speed, cores and cache, each put to work on the same queue of jobs so you can see which one helps and when."),

 # ---- 1.2 Memory and storage -------------------------------------------------
 ("ms-l02", 2, "virtualmemory", "Watch a swap happen",
  "RAM fills, something not in use is moved out to storage, and is fetched back when it is wanted. Notice how far it has to travel."),
 ("ms-l08", 3, "binaryadd", "Add it column by column",
  "Watch the carry move left, then watch a sum that will not fit in eight bits and see exactly where the overflow comes from."),
 ("ms-l10", 0, "binaryshift", "Watch the bits slide",
  "Every place a bit moves left doubles what it is worth. Shift right and watch what falls off the end, and what that costs."),
 ("ms-l13", 0, "pixels", "Zoom in until you see the binary",
  "From a picture to a grid of pixels to one colour value. Then change the resolution and the colour depth and watch the file size follow."),
 ("ms-l14", 0, "sampling", "Turn a wave into numbers",
  "Samples taken at fixed intervals and rounded to the nearest level. Raise the rate and the bit depth and watch the stair-step get closer to the real wave."),
 ("ms-l15", 4, "compression", "Squeeze it, and get it back",
  "Run-length encoding worked through on a row of pixels, then the trade with lossy compression: smaller, but what went is gone."),

 # ---- 1.3 Computer networks --------------------------------------------------
 ("nw-l03", 0, "clientserver", "Two ways to arrange it",
  "The same job done through a server and then between peers. Watch what happens to each when the middle disappears."),
 ("nw-l06", 4, "topologies", "Break a link and watch",
  "A message crossing a star and a mesh, then a cable cut in each. What still works, and what does not, is the whole comparison."),
 ("nw-l10", 2, "encryption", "Intercept it and see",
  "Plaintext turned to ciphertext letter by letter, read in transit by someone without the key, then turned back at the far end."),
 ("nw-l11", 1, "dns", "From a name to a machine",
  "What happens between pressing enter and the page appearing: the name looked up, the address found, the request sent, the page returned."),
 ("nw-l13", 1, "packets", "Split, routed, reassembled",
  "One file cut into numbered packets that take different routes, arrive out of order, lose one, and are put back together in order."),
 ("nw-l13", 3, "tcpip", "Headers on, headers off",
  "Data going down the four layers picking up a header at each one, crossing the network, then having them stripped off in reverse."),

 # ---- 1.4 Network security ---------------------------------------------------
 ("ns-l03", 2, "sqlinjection", "Why that line is dangerous",
  "Watch typed text get pasted straight into a query and end the condition early - and then watch the fix stop it."),
 ("ns-l06", 2, "bruteforce", "How long would it really take",
  "Guesses tried one after another, then the number of possibilities as the password gets longer. The jump is the point."),
 ("ns-l07", 1, "ddos", "Watch the queue fill",
  "Ordinary requests, then a flood from a botnet, then a real user who cannot get in. Nothing is stolen - the door is simply blocked."),
 ("ns-l09", 2, "firewall", "Checked against the rules",
  "Packets arriving and being allowed or dropped by a rule list, and the one thing a firewall never looks at."),

 # ---- 1.5 Systems software ---------------------------------------------------
 ("ss-l02", 1, "scheduling", "Taking turns, very fast",
  "One processor and three programs. Watch the slices go round, and watch what happens when one stops to wait for a keypress."),
 ("ss-l03", 1, "permissions", "Who is allowed to do what",
  "Users, groups and files, with someone trying an action and being let through or turned away."),
 ("ss-l04", 2, "defrag", "Watch the head jump",
  "One file scattered across a disk, the head collecting the pieces, then the same file gathered up. Count the movements both times."),

 # ---- 1.6 Ethical, legal, cultural and environmental impacts ------------------
 ("el-l05", 0, "lifecycle", "Where the cost really falls",
  "Mining, making, shipping, years of use, then disposal - with the share each one takes. Most people guess this wrong."),

 # ---- 2.1 Algorithms ---------------------------------------------------------
 ("al-l04", 1, "flowchart", "Follow the arrows",
  "The symbols, then a value travelling through a real flowchart: round the loop, out of the loop, and off the end."),
 ("al-l07", 3, "searches", "Run both on the same list",
  "Linear and binary search side by side on one list, with the comparisons counted. Then the catch: binary needs it sorted first."),
 ("al-l08", 1, "bubblesort", "One pass at a time",
  "Each comparison and swap as it happens, the largest value settling at the end of every pass, and the pass that finishes early."),
 ("al-l09", 1, "mergesort", "Watch the merge",
  "Split to single items, then merged back by taking the smaller front item each time. That last part is the bit a description cannot show."),

 # ---- 2.3 Producing robust programs ------------------------------------------
 ("rp-l05", 2, "testdata", "Just inside, just outside",
  "A range rule on a number line, with normal, boundary, invalid and erroneous values each tried against it."),

 # ---- 2.4 Boolean logic ------------------------------------------------------
 ("bl-l01", 0, "gates", "Symbol to truth table",
  "Inputs toggling through every combination, with the output changing and the matching row of the table lighting up."),
 ("bl-l03", 1, "circuit", "Signals through two gates",
  "A 1 or a 0 on every wire, travelling through the first gate into the second, filling the truth table a row at a time."),

 # ---- 2.5 Programming languages and IDEs --------------------------------------
 ("pl-l03", 3, "translators", "Compiled and interpreted, together",
  "The same program translated both ways at once, so you can see exactly when each one finds the error."),
]
