"""Topic 1.5 content that existed only in the rendered scenes.

The tasks, info markers and models survived in the experience JSON, and the
worksheet fields in the worksheets. The wall bullets and the illustrations did
not survive anywhere, so they were read off the four rendered scenes - the six
station panels on the right, back and left walls, and the final challenge on the
floor - and transcribed here verbatim.

mkspecs15.py combines this with the mechanical sources to write specs15.py.
"""

DESCRIPTION = {
 "ss-l01": "Meet the operating system and the four kinds of user interface, then choose the right interface for eight different devices.",
 "ss-l02": "See how one processor runs many programs at once, how the OS shares out RAM, and what virtual memory and device drivers are for.",
 "ss-l03": "Set up accounts, access levels and groups for a school network, and follow a file from the root of the hierarchy to its extension.",
 "ss-l04": "Work through the five utility programs, defragment a disk by hand, and pick the right utility for each situation.",
}

INTRO = {
 "ss-l01": "Switch a computer on with no operating system and almost nothing works. Find out what the OS does for you, and meet the four types of user interface.",
 "ss-l02": "Your computer looks like it runs twenty programs at once. It doesn't. Find out how the operating system shares the processor and the memory, and why every device needs a driver.",
 "ss-l03": "Every school network gives thousands of people their own space, and lets nobody see anyone else's. Find out how user management and file management make that work.",
 "ss-l04": "Utility software doesn't do your work: it looks after the machine. Meet the three you need to know, and defragment a disk yourself.",
}

KEYWORDS = {
 "ss-l01": ["Operating system", "Systems software", "User interface", "GUI", "CLI", "Menu driven", "Voice"],
 "ss-l02": ["Multitasking", "Process", "Time slice", "Memory management", "Virtual memory", "Device driver"],
 "ss-l03": ["User account", "Access level", "Permissions", "User group", "File", "Folder", "Hierarchy", "Extension"],
 "ss-l04": ["Utility software", "Encryption", "Cyphertext", "Defragmentation", "Compression", "Lossy", "Lossless"],
}

BULLETS = {
 "ss-l01": {
  "What is systems software?": [
    "Software is split into two kinds: systems software and application software.",
    "Systems software runs the computer itself: the operating system and utility programs.",
    "Application software is what the user runs to do a job: a browser, a game, a word processor."],
  "What the OS does": [
    "It manages the processor, sharing it between programs.",
    "It manages memory, deciding what is held where.",
    "It manages files, users, and input and output devices.",
    "It provides a user interface so people can work with the machine."],
  "Graphical user interface": [
    "A GUI uses windows, icons, menus and a pointer.",
    "It is easy to learn, and needs no commands to be memorised.",
    "It uses more memory and processing power than a text interface."],
  "Command line interface": [
    "A CLI is text only: the user types commands.",
    "It uses very little memory and processing power.",
    "It is powerful and easy to automate with scripts, but commands must be learned."],
  "Menu driven and voice": [
    "A menu driven interface offers a set of choices, one screen at a time: a cash machine, a ticket machine, an old MP3 player.",
    "It is very easy to use, but slow, and you can only do what the menus allow.",
    "A voice interface listens for spoken commands: useful hands free, and for users who can't use a screen, but it mishears and needs a quiet room."],
  "Choosing an interface": [
    "Think about the user: their skill, their situation and what they need to do.",
    "Think about the hardware: a device with no screen can't use a GUI.",
    "Exam answers need the choice, the characteristic and the reason."],
 },
 "ss-l02": {
  "Multitasking": [
    "Multitasking means several programs appear to run at the same time.",
    "A single processor core can only run one instruction at a time.",
    "The OS switches between programs so quickly that it looks simultaneous."],
  "Sharing the processor": [
    "Each process gets a short time slice, then the OS interrupts it and moves to the next.",
    "Saving one process and loading the next is called a context switch.",
    "Important jobs can be given priority, so they run sooner."],
  "Managing memory": [
    "Every running process needs space in RAM, and the OS decides where it goes.",
    "The OS keeps processes apart, so one crashing program can't damage another.",
    "When RAM fills up, data that isn't being used is moved to virtual memory on the disk."],
  "Virtual memory": [
    "Virtual memory is space on secondary storage used as extra RAM.",
    "Data not being used right now is swapped out to disk to make room.",
    "It is far slower than RAM, so it is a last resort, not a plan."],
  "Device drivers": [
    "A driver is software that lets the OS communicate with a piece of hardware.",
    "Each device needs a driver written for it, and for that operating system.",
    "Without the right driver, the device either doesn't work or loses its special features."],
  "Updates and plug and play": [
    "Plug and play means the OS recognises a device and finds a driver automatically.",
    "Drivers are updated to fix faults, improve speed and close security holes.",
    "A faulty driver can crash the whole machine, because drivers run with high privileges."],
 },
 "ss-l03": {
  "User accounts": [
    "Each person gets an account: a username, a password and their own settings and files.",
    "The OS checks the password before letting anyone in. This is authentication.",
    "Accounts mean the same machine can be shared without anyone seeing anyone else's work."],
  "Access levels": [
    "An access level decides what a user may do with a file: nothing, read it, or read and change it.",
    "Give each user the least access their job needs.",
    "The OS checks the level every time a file is opened."],
  "Groups and profiles": [
    "Setting permissions for thousands of people one at a time is impossible, so users are put into groups.",
    "A permission set on a group applies to everyone in it.",
    "A profile holds a user's settings, so their desktop follows them to any machine on the network."],
  "Files and folders": [
    "The OS stores data as files, and organises them in folders.",
    "Folders sit inside folders, forming a hierarchy that starts at the root.",
    "A path describes the route to a file, for example Documents\\Computing\\1.5\\notes.docx."],
  "What the OS does with files": [
    "It creates, opens, renames, moves, copies and deletes files.",
    "It records where each file is physically stored, and how much space is free.",
    "It shows a tidy hierarchy to the user, even though the blocks may be scattered across the disk."],
  "File extensions": [
    "The extension is the part after the dot: .docx, .jpg, .mp3, .exe.",
    "It tells the OS which program should open the file.",
    "Changing the extension doesn't change what is inside the file."],
 },
 "ss-l04": {
  "What is utility software?": [
    "Utility software is systems software that maintains and protects the computer.",
    "It works on the machine itself, not on the user's documents.",
    "Examples: encryption, defragmentation, compression, backup and anti-malware."],
  "Encryption": [
    "Encryption scrambles data using a key, turning plaintext into cyphertext.",
    "Without the key it is meaningless, so a stolen file or laptop gives nothing away.",
    "The same key, or a matching one, decrypts it back to the original."],
  "Defragmentation": [
    "Over time, files get split into pieces scattered across a disk. This is fragmentation.",
    "The read/write head then has to jump about to collect one file, which is slow.",
    "A defragmentation utility gathers each file into one run and groups the free space together."],
  "Compression": [
    "A compression utility makes files smaller so they use less space and send faster.",
    "Lossless compression restores the original exactly: used for text, programs and archives.",
    "Lossy compression throws data away for a much smaller file: used for photos, music and video."],
  "Backup and updates": [
    "A backup utility copies files so they can be restored after loss, theft or ransomware.",
    "A full backup copies everything; an incremental backup copies only what has changed since last time.",
    "Update utilities keep the OS and drivers patched, closing security holes."],
  "Choosing the right utility": [
    "Match the utility to the problem: slow mechanical disk, risk of theft, files too large, data loss.",
    "Exam answers need the utility, what it does, and why it fits the situation."],
 },
}

ILL = {
 "ss-l01": {
  "What is systems software?": ("stack", [("Applications", "Browser, game, word processor", "b"),
                                          ("Operating system", "Manages everything", "p"),
                                          ("Hardware", "CPU, memory, storage", "g")]),
  "What the OS does": ("tiles", [("Processor", "b"), ("Memory", "p"), ("Files", "o"),
                                 ("Users", "y"), ("Devices", "g"), ("Interface", "r")], 3),
  "Graphical user interface": ("icons", [("pc", "Windows"), ("form", "Icons"), ("user", "Pointer")]),
  "Command line interface": ("code", ["C:\\> dir /s reports", "C:\\> copy *.csv D:\\backup",
                                      "C:\\> shutdown /r"], 28),
  "Menu driven and voice": ("compare", "Menu driven", ["Simple choices", "No training", "Limited options"],
                            "Voice", ["Hands free", "Good for accessibility", "Mishears"], "o", "p"),
  "Choosing an interface": ("flow", ["Who is the user?", "What hardware?", "What job?", "Choose and justify"]),
  "__final__": ("tiles", [("GUI", "b"), ("Command line", "g"), ("Menu driven", "o"), ("Voice", "p")], 4),
 },
 "ss-l02": {
  "Multitasking": ("flow", ["Browser", "Music", "Word processor", "Browser", "Music"]),
  "Sharing the processor": ("table", ["Time", "Running"],
                            [["0-5 ms", "Browser"], ["5-10 ms", "Music player"],
                             ["10-15 ms", "Word processor"], ["15-20 ms", "Browser"]]),
  "Managing memory": ("tiles", [("RAM", "b"), ("Process A", "p"), ("Process B", "o"), ("Free", "n")], 2),
  "Virtual memory": ("flow", ["RAM full", "Swap out to disk", "Space in RAM", "New program loads"]),
  "Device drivers": ("pair", "pc", "printer", "Operating system", "Printer", "Driver translates", "Device works"),
  "Updates and plug and play": ("tiles", [("Plug in", "b"), ("Recognised", "p"),
                                          ("Driver found", "g"), ("Device works", "y")], 2),
  "__final__": ("tiles", [("Multitasking", "b"), ("Time slice", "p"),
                          ("Virtual memory", "o"), ("Driver", "g")], 2),
 },
 "ss-l03": {
  "User accounts": ("icons", [("user", "Account"), ("lock", "Password"), ("form", "Settings")]),
  "Access levels": ("table", ["Level", "What it allows"],
                    [["None", "Can't open it at all"], ["Read", "Can open, can't change"],
                     ["Read/write", "Can open and change"]]),
  "Groups and profiles": ("tiles", [("Students", "b"), ("Teachers", "p"),
                                    ("Office staff", "o"), ("Network managers", "r")], 2),
  "Files and folders": ("stack", [("Root", "The top of the hierarchy", "g"),
                                  ("Documents", "A folder inside it", "b"),
                                  ("Computing", "A folder inside that", "p"),
                                  ("notes.docx", "A file", "o")]),
  "What the OS does with files": ("tiles", [("Create", "b"), ("Open", "b"), ("Rename", "p"),
                                            ("Move", "p"), ("Copy", "o"), ("Delete", "r")], 3),
  "File extensions": ("code", ["notes.docx   word processed document", "photo.jpg    compressed image",
                               "song.mp3     compressed audio", "setup.exe    a program"], 26),
  "__final__": ("tiles", [("None", "n"), ("Read", "b"), ("Read/write", "g")], 3),
 },
 "ss-l04": {
  "What is utility software?": ("tiles", [("Encryption", "b"), ("Defragmentation", "p"),
                                          ("Compression", "o"), ("Backup", "g"), ("Anti-malware", "r")], 3),
  "Encryption": ("flow", ["Plaintext", "Key", "Cyphertext", "Key", "Plaintext"]),
  "Defragmentation": ("compare", "Fragmented", ["Files in pieces", "Head jumps about", "Slower to open"],
                      "Defragmented", ["Files in one run", "Head sweeps once", "Faster to open"], "r", "g"),
  "Compression": ("compare", "Lossless", ["Nothing lost", "Exact restore", "Smaller saving"],
                  "Lossy", ["Data removed", "Much smaller", "Cannot be undone"], "g", "o"),
  "Backup and updates": ("table", ["Type", "What it copies", "Restore"],
                         [["Full", "Everything", "Quickest"],
                          ["Incremental", "Changes only", "Needs the full plus each set"]]),
  "Choosing the right utility": ("flow", ["What's the problem?", "Which utility?", "Why it fixes it"]),
  "__final__": ("tiles", [("Encryption", "b"), ("Defragmentation", "p"),
                          ("Compression", "o"), ("Backup", "g")], 2),
 },
}

FINAL_INTRO = {
 "ss-l01": "Eight devices, four interfaces. Tap the star and match each device to the interface that suits it best.",
 "ss-l02": "A machine with 8 blocks of RAM has six programs to run. Load it sensibly, then answer the questions.",
 "ss-l03": "Set the permissions for a school network, then sort the jobs. Tap the star to begin.",
 "ss-l04": "One disk to tidy, then decide which utility each situation needs. Tap the star to begin.",
}

# The fact stems and challenges come from the worksheets, which survived; they
# are read by mkspecs15.py rather than duplicated here.
FACT = {}
CHALLENGE = {}
