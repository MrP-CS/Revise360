"""Topic 1.5 Systems software.

Reconstructed by mkspecs15.py after the original spec was lost: the tasks,
info markers and models come from the built experiences, the worksheet fields
from the worksheets, and the wall bullets and illustrations were read off the
rendered scenes. Re-rendering from this file reproduces the committed scenes.
"""
from kit import mcq, multi, sort, match, order

K15 = "1.5 Systems software"
SUB15 = "OCR J277 Paper 1  |  Computer systems"

def memory(q, **kw): return dict(t="memory", q=q, **kw)
def permissions(q, **kw): return dict(t="permissions", q=q, **kw)
def defrag(q, **kw): return dict(t="defrag", q=q, **kw)

# ---------------------------------------------------------------- lesson 1
L1 = dict(id="ss-l01", topic="1.5", lesson=1, title='Control room', img='SS_L01_ControlRoom_360',
  description='Meet the operating system and the four kinds of user interface, then choose the right interface for eight different devices.',
  kicker=f"{K15}  |  Lesson 1", scene_title='Control room', subtitle=SUB15,
  intro='Switch a computer on with no operating system and almost nothing works. Find out what the OS does for you, and meet the four types of user interface.',
  keywords=['Operating system', 'Systems software', 'User interface', 'GUI', 'CLI', 'Menu driven', 'Voice'],
  stations=[
   dict(name='What is systems software?', bullets=[
          'Software is split into two kinds: systems software and application software.',
          'Systems software runs the computer itself: the operating system and utility programs.',
          'Application software is what the user runs to do a job: a browser, a game, a word processor.'],
        challenge='Write your own definition of systems software, with two examples.', ill=(
          'stack',
          [
            ('Applications', 'Browser, game, word processor', 'b'),
            ('Operating system', 'Manages everything', 'p'),
            ('Hardware', 'CPU, memory, storage', 'g')]), fact='Systems software is...',
        tasks=[mcq('Which of these is systems software?', 'The operating system', ['A web browser', 'A spreadsheet', 'A racing game'], 'Systems software runs the machine; applications run on top of it.'),
               sort('Is each program systems software or application software?', ['Systems software', 'Application software'], [
  ['Operating system', 'Systems software'],
  ['Antivirus scanner', 'Systems software'],
  ['Disk defragmenter', 'Systems software'],
  ['Web browser', 'Application software'],
  ['Photo editor', 'Application software'],
  ['Spreadsheet', 'Application software']], "If it looks after the computer, it's systems software. If it does a job for the user, it's an application.")]),
   dict(name='What the OS does', bullets=[
          'It manages the processor, sharing it between programs.',
          'It manages memory, deciding what is held where.',
          'It manages files, users, and input and output devices.',
          'It provides a user interface so people can work with the machine.'],
        challenge='List the five jobs an operating system does, in your own words.', ill=(
          'tiles',
          [
            ('Processor', 'b'),
            ('Memory', 'p'),
            ('Files', 'o'),
            ('Users', 'y'),
            ('Devices', 'g'),
            ('Interface', 'r')],
          3), fact='An operating system manages...',
        tasks=[multi('Which of these are jobs of an operating system? Select all that apply.', [
  'Managing memory',
  'Managing files and folders',
  'Controlling input and output devices',
  'Providing a user interface',
  "Writing the user's essay",
  'Designing the hardware'], [
  'Managing memory',
  'Managing files and folders',
  'Controlling input and output devices',
  'Providing a user interface'], "The OS runs the machine. It doesn't do the user's work, and it doesn't build the hardware."),
               mcq('Why does an application not talk to the hardware directly?', 'The OS handles the hardware, so the same program runs on very different machines', ["Hardware can't be programmed", 'It would be too fast', 'Applications are not allowed to use memory'], "That's why a browser works on machines with completely different processors and printers.")]),
   dict(name='Graphical user interface', bullets=[
          'A GUI uses windows, icons, menus and a pointer.',
          'It is easy to learn, and needs no commands to be memorised.',
          'It uses more memory and processing power than a text interface.'],
        challenge='Give one advantage and one disadvantage of a GUI.', ill=('icons', [('pc', 'Windows'), ('form', 'Icons'), ('user', 'Pointer')]), fact='A graphical user interface...',
        tasks=[mcq('What is the main advantage of a GUI?', 'It is easy to learn, because you can see the options', ['It uses less memory', 'It is faster for experts to automate', 'It works without a screen'], "You don't have to remember any commands."),
               mcq('What is the main disadvantage of a GUI?', 'It uses more memory and processing power', ["It can't show pictures", 'It needs a keyboard', "It can't run applications"], 'Drawing all those windows costs resources.')]),
   dict(name='Command line interface', bullets=[
          'A CLI is text only: the user types commands.',
          'It uses very little memory and processing power.',
          'It is powerful and easy to automate with scripts, but commands must be learned.'],
        challenge='Give one situation where a CLI is a better choice than a GUI.', ill=('code', ['C:\\> dir /s reports', 'C:\\> copy *.csv D:\\backup', 'C:\\> shutdown /r'], 28), fact='A command line interface...',
        tasks=[mcq('Why do network managers often use a command line?', 'Commands can be scripted, so the same job runs on hundreds of machines', ['It looks more impressive', 'It uses more memory', 'It has bigger icons'], 'One script can do in seconds what would take hours of clicking.'),
               mcq('What is the main drawback of a command line interface?', 'The user has to know the commands', ['It is slow to run', 'It cannot use files', 'It needs a graphics card'], 'There is nothing on screen to prompt you.')]),
   dict(name='Menu driven and voice', bullets=[
          'A menu driven interface offers a set of choices, one screen at a time: a cash machine, a ticket machine, an old MP3 player.',
          'It is very easy to use, but slow, and you can only do what the menus allow.',
          "A voice interface listens for spoken commands: useful hands free, and for users who can't use a screen, but it mishears and needs a quiet room."],
        challenge='Choose an interface for a cash machine, a games console and a server, and justify each choice.', ill=(
          'compare',
          'Menu driven',
          ['Simple choices', 'No training', 'Limited options'],
          'Voice',
          ['Hands free', 'Good for accessibility', 'Mishears'],
          'o',
          'p'), fact='A menu driven interface... A voice interface...',
        tasks=[match('Match each situation to the most suitable interface.', [
  ['A cash machine', 'Menu driven'],
  ['A server managed remotely', 'Command line'],
  ['A tablet for a young child', 'Graphical'],
  ['A smart speaker in a kitchen', 'Voice']], 'Match the interface to the user and the situation, not to what you like best.'),
               mcq('What is a drawback of a voice interface?', 'Background noise and accents can cause it to mishear', ['It needs a mouse', 'It uses no memory', "It can't be used hands free"], 'It also struggles with anything that has to be precise, like a long file name.')]),
   dict(name='Choosing an interface', bullets=[
          'Think about the user: their skill, their situation and what they need to do.',
          "Think about the hardware: a device with no screen can't use a GUI.",
          'Exam answers need the choice, the characteristic and the reason.'],
        challenge='Explain which interface you would choose for a self-service checkout, and why.', ill=('flow', ['Who is the user?', 'What hardware?', 'What job?', 'Choose and justify']), fact='To choose an interface, you...',
        tasks=[mcq('Which is the best exam answer for a supermarket self-service till?', 'A menu driven interface, because shoppers need no training and only a few choices are allowed', ['A GUI, because it looks nicer', 'A CLI, because it is fastest', 'Voice, because it is modern'], 'Choice, characteristic, reason.'),
               mcq('A computer in a server room has no monitor attached. Which interface is most suitable?', 'A command line, accessed remotely', ['A graphical interface', 'A menu driven interface', 'A voice interface'], 'No screen means no GUI.')]),
  ],
  final=dict(name='Final challenge: pick the interface', floor_title='Final challenge: pick the interface',
             intro='Eight devices, four interfaces. Tap the star and match each device to the interface that suits it best.',
             ill=('tiles', [('GUI', 'b'), ('Command line', 'g'), ('Menu driven', 'o'), ('Voice', 'p')], 4),
             tasks=[sort('Which interface suits each device best?', ['GUI', 'Command line', 'Menu driven', 'Voice'], [
  ['A laptop used by a Year 7 class', 'GUI'],
  ['A web server managed from another building', 'Command line'],
  ['A ticket machine at a station', 'Menu driven'],
  ['A smart speaker', 'Voice'],
  ['A hands-free system in a car', 'Voice'],
  ['A cash machine', 'Menu driven'],
  ['A digital art tablet', 'GUI'],
  ['Automating a nightly backup on 200 machines', 'Command line']], 'The user and the situation decide, every time.')]),
  info=[
   (0, 'Where the name comes from', "Early computers ran one job at a time, loaded by hand. The first 'operating systems' were programs that loaded the next job automatically, so the operator didn't have to."),
   (1, 'Bigger than you think', 'A modern operating system is tens of millions of lines of code, and is being updated somewhere in the world every day.'),
   (2, 'Xerox first', 'The windows, icons and pointer idea was developed at Xerox PARC in the 1970s, before either Apple or Microsoft shipped a graphical system.'),
   (3, 'The command line never died', 'Most servers, cloud platforms and developer tools are still driven from a command line, because a typed command can be repeated exactly and stored in a script.'),
   (4, 'Interfaces for access', 'Voice control, screen readers and switch devices are interfaces too. Choosing the right one can be the difference between a computer being usable or useless to someone.'),
   (5, 'Embedded systems', 'The washing machine from topic 1.1 has an operating system too, but a tiny one, with a menu driven interface of dials and buttons.'),
  ],
  models=[
   (("right", 363, 411), 'stack', 'The software stack', 'Pull the layers apart: hardware at the bottom, the operating system in the middle, applications on top.'),
   (("right", 1258, 401), 'stack', 'What sits where', 'Every request from an application goes through the operating system before it reaches the hardware.'),
  ],
  ws=dict(
    title='The purpose and functionality of operating systems',
    objectives=[
        'know the purpose and functionality of operating systems',
        'know the different types of user interface and the features of each'],
    starter='How many operating systems can you name? For each one, say what kind of device it runs on.',
    starter_lines=2,
    keyterms=['Operating system', 'User interface', 'Control room'],
    keyq='What does an operating system do, and why does every computer need one?',
    exam=[
        ('State what is meant by systems software, and give two examples.', 3, 3),
        ('Describe two jobs carried out by an operating system.', 4, 4),
        (
          'A museum is building an information point for visitors. Recommend a type of user interface and justify your choice.',
          4,
          4)],
    confidence=['Systems and application software', 'What an operating system does', 'The four types of user interface'],
  ))

# ---------------------------------------------------------------- lesson 2
L2 = dict(id="ss-l02", topic="1.5", lesson=2, title='Multitasking floor', img='SS_L02_MultitaskingFloor_360',
  description='See how one processor runs many programs at once, how the OS shares out RAM, and what virtual memory and device drivers are for.',
  kicker=f"{K15}  |  Lesson 2", scene_title='Multitasking floor', subtitle=SUB15,
  intro="Your computer looks like it runs twenty programs at once. It doesn't. Find out how the operating system shares the processor and the memory, and why every device needs a driver.",
  keywords=['Multitasking', 'Process', 'Time slice', 'Memory management', 'Virtual memory', 'Device driver'],
  stations=[
   dict(name='Multitasking', bullets=[
          'Multitasking means several programs appear to run at the same time.',
          'A single processor core can only run one instruction at a time.',
          'The OS switches between programs so quickly that it looks simultaneous.'],
        challenge='Explain how one core can appear to run five programs at once.', ill=('flow', ['Browser', 'Music', 'Word processor', 'Browser', 'Music']), fact='Multitasking means...',
        tasks=[mcq('How does an operating system multitask on a single core?', 'It switches between programs very quickly, giving each a small slice of processor time', [
  'It runs every program at exactly the same moment',
  'It speeds the clock up',
  'It uses the graphics card instead'], 'Each program gets a few milliseconds, then the OS moves on.'),
               mcq('What is a process?', 'A program that is currently running, with its own place in memory', ['A file saved on disk', 'A folder of documents', 'A type of user interface'], 'A program on disk becomes a process when it is loaded and run.')]),
   dict(name='Sharing the processor', bullets=[
          'Each process gets a short time slice, then the OS interrupts it and moves to the next.',
          'Saving one process and loading the next is called a context switch.',
          'Important jobs can be given priority, so they run sooner.'],
        challenge='Why does a computer feel slower when many programs are open?', ill=(
          'table',
          ['Time', 'Running'],
          [
            ['0-5 ms', 'Browser'],
            ['5-10 ms', 'Music player'],
            ['10-15 ms', 'Word processor'],
            ['15-20 ms', 'Browser']]), fact='The processor is shared by...',
        tasks=[order('Put these steps of a context switch in order.', [
  'A process runs until its time slice ends',
  'The OS saves the state of that process',
  'The OS loads the saved state of the next process',
  'The next process runs until its time slice ends'], 'Switching costs a little time itself, which is why too many open programs slows everything down.'),
               mcq('Why might a video call be given a higher priority than a backup?', 'The call must keep up in real time, while the backup can wait', ['Backups are not important', 'The call uses less memory', 'Priority makes the processor faster'], 'Priority decides who gets the processor sooner, not how fast it runs.')]),
   dict(name='Managing memory', bullets=[
          'Every running process needs space in RAM, and the OS decides where it goes.',
          "The OS keeps processes apart, so one crashing program can't damage another.",
          "When RAM fills up, data that isn't being used is moved to virtual memory on the disk."],
        challenge='Fit the programs into RAM in the experience, then explain what happens when RAM is full.', ill=('tiles', [('RAM', 'b'), ('Process A', 'p'), ('Process B', 'o'), ('Free', 'n')], 2), fact='The OS manages memory by...',
        tasks=[dict(
                    t='memory',
                    q='Open all five programs. RAM has 8 blocks: put what fits into RAM, and the rest into virtual memory.',
                    ram=8,
                    programs=[
                      dict(name='Browser', size=3),
                      dict(name='Word processor', size=2),
                      dict(name='Music player', size=1),
                      dict(name='Photo editor', size=3),
                      dict(name='Antivirus', size=2)],
                    fb='The OS always uses RAM first, because it is far faster than the disk.'),
               mcq('Why does the OS keep each process in its own area of memory?', "So one program can't read or overwrite another program's data", ['To make programs run faster', 'To save electricity', 'Because RAM is read-only'], "It's protection as well as organisation.")]),
   dict(name='Virtual memory', bullets=[
          'Virtual memory is space on secondary storage used as extra RAM.',
          'Data not being used right now is swapped out to disk to make room.',
          'It is far slower than RAM, so it is a last resort, not a plan.'],
        challenge='Describe what the user notices when a computer relies on virtual memory.', ill=('flow', ['RAM full', 'Swap out to disk', 'Space in RAM', 'New program loads']), fact='Virtual memory is...',
        tasks=[dict(
                    t='memory',
                    q='RAM now has only 5 blocks. Load the same programs sensibly.',
                    ram=5,
                    programs=[
                      dict(name='Browser', size=3),
                      dict(name='Word processor', size=2),
                      dict(name='Music player', size=1),
                      dict(name='Photo editor', size=3)],
                    fb='With less RAM, more has to live on the disk, and the machine feels slower.'),
               mcq('What is the best fix for a computer constantly using virtual memory?', 'Install more RAM', ['Buy a bigger monitor', 'Delete the operating system', 'Use a longer cable'], 'More RAM means less swapping.')]),
   dict(name='Device drivers', bullets=[
          'A driver is software that lets the OS communicate with a piece of hardware.',
          'Each device needs a driver written for it, and for that operating system.',
          "Without the right driver, the device either doesn't work or loses its special features."],
        challenge='Why does a printer need a driver, when the OS already knows how to print?', ill=('pair', 'pc', 'printer', 'Operating system', 'Printer', 'Driver translates', 'Device works'), fact='A device driver...',
        tasks=[mcq('What does a device driver do?', 'Translates between the operating system and a particular piece of hardware', ["Stores the user's files", 'Shares the processor between programs', 'Encrypts the hard disk'], 'It is the translator for that one device.'),
               mcq('A new printer prints, but none of its extra features work. What is the most likely cause?', "The OS is using a basic driver rather than the manufacturer's own", ['The printer is out of paper', 'The cable is too short', 'The computer needs more RAM'], 'Generic drivers cover the basics only.')]),
   dict(name='Updates and plug and play', bullets=[
          'Plug and play means the OS recognises a device and finds a driver automatically.',
          'Drivers are updated to fix faults, improve speed and close security holes.',
          'A faulty driver can crash the whole machine, because drivers run with high privileges.'],
        challenge='Why is it important to keep drivers up to date?', ill=('tiles', [('Plug in', 'b'), ('Recognised', 'p'), ('Driver found', 'g'), ('Device works', 'y')], 2), fact='Plug and play means...',
        tasks=[mcq('What does plug and play mean?', 'The operating system detects a new device and sets up its driver automatically', ['The device works without electricity', 'Any cable fits any port', 'Games install themselves'], 'It saves the user finding and installing a driver by hand.'),
               mcq('Why can a bad driver crash the whole computer?', 'Drivers run with high privileges, close to the hardware', ['Drivers are very large files', 'Drivers are stored in ROM', 'Drivers use the internet'], 'A mistake there affects everything, not just one program.')]),
  ],
  final=dict(name='Final challenge: the busy machine', floor_title='Final challenge: the busy machine',
             intro='A machine with 8 blocks of RAM has six programs to run. Load it sensibly, then answer the questions.',
             ill=(
               'tiles',
               [('Multitasking', 'b'), ('Time slice', 'p'), ('Virtual memory', 'o'), ('Driver', 'g')],
               2),
             tasks=[dict(
                         t='memory',
                         q='Load these six programs. RAM has 8 blocks.',
                         ram=8,
                         programs=[
                           dict(name='Browser', size=3),
                           dict(name='Email', size=1),
                           dict(name='Music player', size=1),
                           dict(name='Video editor', size=4),
                           dict(name='Antivirus', size=2),
                           dict(name='Notes', size=1)],
                         fb="Only what doesn't fit belongs in virtual memory."),
                    sort('Which part of the operating system is each job?', ['Processor management', 'Memory management', 'Device management'], [
  ['Giving each process a time slice', 'Processor management'],
  ['Deciding which process runs next', 'Processor management'],
  ['Choosing where a program sits in RAM', 'Memory management'],
  ['Swapping unused data out to disk', 'Memory management'],
  ['Loading a driver for a new printer', 'Device management'],
  ['Sending data to the graphics card', 'Device management']], "Three of the OS's jobs, all happening at once, all the time.")]),
  info=[
   (0, 'Milliseconds', 'A typical time slice is a few milliseconds. In the time it takes to blink, a processor may have switched between programs a hundred times.'),
   (1, 'Task manager', "Open the task manager on any computer and you'll see dozens of processes running that you never started. Most belong to the operating system."),
   (2, 'Thrashing', "If RAM is so full that the OS spends more time swapping than working, it's called thrashing. The disk light stays on and nothing happens."),
   (3, 'Cores help', 'A four-core processor really can run four things at once, and the OS still time slices on top of that, which is why a modern machine copes with so much.'),
   (4, 'Driver disks', 'Hardware used to come with a driver disk in the box. Now the OS downloads drivers automatically, which is why a new mouse works the moment you plug it in.'),
   (5, 'Blue screens', 'Most famous crash screens are caused by drivers rather than by the operating system itself, because drivers run with the deepest access to the hardware.'),
  ],
  ws=dict(
    title='Operating systems: multitasking, memory and drivers',
    objectives=[
        'know what is meant by the term multitasking',
        'understand how the operating system manages memory',
        'understand the need for device drivers'],
    starter='How does a computer manage having lots of programs open at the same time? Write what you think happens.',
    starter_lines=2,
    keyterms=['Multitasking', 'Device driver', 'Multitasking floor'],
    keyq='How does an operating system share out the processor and the memory?',
    exam=[
        ('Explain what is meant by multitasking.', 2, 2),
        ('Describe how an operating system manages memory when RAM is full.', 4, 4),
        ('Explain why a computer needs device drivers.', 3, 3)],
    confidence=['Multitasking and time slices', 'Memory management and virtual memory', 'Device drivers'],
  ))

# ---------------------------------------------------------------- lesson 3
L3 = dict(id="ss-l03", topic="1.5", lesson=3, title='Accounts office', img='SS_L03_AccountsOffice_360',
  description='Set up accounts, access levels and groups for a school network, and follow a file from the root of the hierarchy to its extension.',
  kicker=f"{K15}  |  Lesson 3", scene_title='Accounts office', subtitle=SUB15,
  intro="Every school network gives thousands of people their own space, and lets nobody see anyone else's. Find out how user management and file management make that work.",
  keywords=['User account', 'Access level', 'Permissions', 'User group', 'File', 'Folder', 'Hierarchy', 'Extension'],
  stations=[
   dict(name='User accounts', bullets=[
          'Each person gets an account: a username, a password and their own settings and files.',
          'The OS checks the password before letting anyone in. This is authentication.',
          "Accounts mean the same machine can be shared without anyone seeing anyone else's work."],
        challenge='List three things stored with your school account.', ill=('icons', [('user', 'Account'), ('lock', 'Password'), ('form', 'Settings')]), fact='A user account holds...',
        tasks=[mcq('What is user management?', 'Setting up accounts and deciding what each user is allowed to do', ['Deciding which programs run fastest', 'Cleaning up the hard disk', 'Compressing files'], 'Accounts, passwords, groups and permissions are all part of it.'),
               mcq('Why does a shared computer need separate accounts?', "So each user has their own files and settings, and can't reach anyone else's", ['To use less memory', 'To make it boot faster', 'So the screen is brighter'], "It's about privacy and protection, not performance.")]),
   dict(name='Access levels', bullets=[
          'An access level decides what a user may do with a file: nothing, read it, or read and change it.',
          'Give each user the least access their job needs.',
          'The OS checks the level every time a file is opened.'],
        challenge='Set the access levels in the experience, then explain your choices.', ill=(
          'table',
          ['Level', 'What it allows'],
          [
            ['None', "Can't open it at all"],
            ['Read', "Can open, can't change"],
            ['Read/write', 'Can open and change']]), fact='An access level is...',
        tasks=[dict(
                    t='permissions',
                    q='Set the access each group needs on the school network.',
                    groups=['Students', 'Teachers', 'Network manager'],
                    files=[
                      dict(
                           name="My documents (student's own)",
                           want={'Students': 2, 'Teachers': 1, 'Network manager': 2}),
                      dict(name='Lesson resources', want={'Students': 1, 'Teachers': 2, 'Network manager': 2}),
                      dict(name='Exam papers', want={'Students': 0, 'Teachers': 1, 'Network manager': 2})],
                    fb="Least access that still lets each group do its job. Teachers read student work but shouldn't rewrite it.",
                    note='Tip: a student must be able to change their own work; nobody but the network manager needs full control of everything.'),
               mcq('Why is a student given read access to lesson resources, rather than read/write?', 'They need to open them, but must not be able to change or delete them', ['Reading uses less memory', 'Writing is slower', 'It stops the files being printed'], 'Least privilege: enough to work, no more.')]),
   dict(name='Groups and profiles', bullets=[
          'Setting permissions for thousands of people one at a time is impossible, so users are put into groups.',
          'A permission set on a group applies to everyone in it.',
          "A profile holds a user's settings, so their desktop follows them to any machine on the network."],
        challenge='Why do network managers set permissions on groups rather than on individuals?', ill=('tiles', [('Students', 'b'), ('Teachers', 'p'), ('Office staff', 'o'), ('Network managers', 'r')], 2), fact='A user group is...',
        tasks=[mcq('What is the advantage of user groups?', 'One change to the group applies to every member at once', ['Groups use less disk space', 'Groups make logins faster', 'Groups encrypt files'], 'Add a new teacher to the teachers group and they get the right access immediately.'),
               mcq('A user signs in to a different computer and finds their own desktop and documents. What made that possible?', 'Their profile is stored on the network, not on one machine', ['The computers share a keyboard', 'The files were emailed', 'The OS guessed the settings'], "It's why any machine in the school feels like yours.")]),
   dict(name='Files and folders', bullets=[
          'The OS stores data as files, and organises them in folders.',
          'Folders sit inside folders, forming a hierarchy that starts at the root.',
          'A path describes the route to a file, for example Documents\\Computing\\1.5\\notes.docx.'],
        challenge='Draw three levels of your own folder structure, starting at the root.', ill=(
          'stack',
          [
            ('Root', 'The top of the hierarchy', 'g'),
            ('Documents', 'A folder inside it', 'b'),
            ('Computing', 'A folder inside that', 'p'),
            ('notes.docx', 'A file', 'o')]), fact='Files and folders are organised...',
        tasks=[order('Put these in order, from the top of the hierarchy down to the file.', ['Root', 'Documents', 'Computing', 'Topic 1.5', 'notes.docx'], "That route, written out, is the file's path."),
               mcq("What does a file's path describe?", 'The route through the folders to reach that file', ['How large the file is', 'Who owns the file', 'Which program made it'], 'Each folder name in the path is one step down the hierarchy.')]),
   dict(name='What the OS does with files', bullets=[
          'It creates, opens, renames, moves, copies and deletes files.',
          'It records where each file is physically stored, and how much space is free.',
          'It shows a tidy hierarchy to the user, even though the blocks may be scattered across the disk.'],
        challenge='Explain the difference between moving and copying a file.', ill=(
          'tiles',
          [('Create', 'b'), ('Open', 'b'), ('Rename', 'p'), ('Move', 'p'), ('Copy', 'o'), ('Delete', 'r')],
          3), fact='File management means...',
        tasks=[multi('Which of these are file management jobs done by the operating system? Select all that apply.', [
  'Renaming a file',
  'Moving a file to another folder',
  'Recording where the file is stored on the disk',
  'Deleting a file and freeing its space',
  'Writing the contents of the essay',
  'Choosing the font'], [
  'Renaming a file',
  'Moving a file to another folder',
  'Recording where the file is stored on the disk',
  'Deleting a file and freeing its space'], 'The application writes the contents; the OS looks after the file itself.'),
               mcq('What happens to the disk space when a file is deleted?', 'The OS marks it as free so it can be reused', ['The disk gets physically smaller', 'The space is lost forever', 'The file moves to another disk'], 'Which is also why deleted files can sometimes be recovered until the space is reused.')]),
   dict(name='File extensions', bullets=[
          'The extension is the part after the dot: .docx, .jpg, .mp3, .exe.',
          'It tells the OS which program should open the file.',
          "Changing the extension doesn't change what is inside the file."],
        challenge='Name five extensions and the type of file each one is.', ill=(
          'code',
          [
            'notes.docx   word processed document',
            'photo.jpg    compressed image',
            'song.mp3     compressed audio',
            'setup.exe    a program'],
          26), fact='A file extension...',
        tasks=[match('Match each extension to what it holds.', [
  ['.docx', 'A word processed document'],
  ['.jpg', 'A compressed image'],
  ['.mp3', 'A compressed sound file'],
  ['.exe', 'A program that runs']], 'The OS uses the extension to pick the right program.'),
               mcq('A student renames report.docx to report.jpg. What happens?', 'The file is unchanged inside, but the OS now tries to open it with the wrong program', ['It becomes an image', 'The text is deleted', 'It halves in size'], 'The extension is a label, not a conversion.')]),
  ],
  final=dict(name='Final challenge: lock down the network', floor_title='Final challenge: lock down the network',
             intro='Set the permissions for a school network, then sort the jobs. Tap the star to begin.',
             ill=('tiles', [('None', 'n'), ('Read', 'b'), ('Read/write', 'g')], 3),
             tasks=[dict(
                         t='permissions',
                         q="A school's shared drive. Give each group the least access that lets it work.",
                         groups=['Students', 'Teachers', 'Office staff'],
                         files=[
                           dict(
                                name='Homework hand-in folder',
                                want={'Students': 2, 'Teachers': 2, 'Office staff': 0}),
                           dict(name='Reports to parents', want={'Students': 0, 'Teachers': 2, 'Office staff': 2}),
                           dict(name='School policies', want={'Students': 1, 'Teachers': 1, 'Office staff': 2})],
                         fb='Least privilege every time: enough access to do the job, and no more.'),
                    sort('Is each job user management or file management?', ['User management', 'File management'], [
  ['Creating an account for a new teacher', 'User management'],
  ['Putting a student into the Year 11 group', 'User management'],
  ['Resetting a password', 'User management'],
  ['Moving a file into another folder', 'File management'],
  ['Recording which blocks a file uses', 'File management'],
  ['Freeing space when a file is deleted', 'File management']], 'Both are jobs of the operating system, and both happen constantly.')]),
  info=[
   (0, 'Least privilege', 'Security teams call this the principle of least privilege: give every account the smallest access that still lets the work happen. It limits the damage when an account is stolen.'),
   (1, 'Who did what', "Operating systems keep logs of who signed in, and what they opened. It's how a school can find out who deleted a shared file."),
   (2, 'The root', 'On Windows the top of a drive is C:\\; on Linux and macOS it is simply /. Either way, everything else hangs below it.'),
   (3, 'Long names', 'Early systems allowed eight characters and a three-letter extension, which is why old files have names like REPORT01.DOC.'),
   (4, 'Hidden extensions', 'Many systems hide extensions by default, which attackers exploit: invoice.pdf.exe looks like invoice.pdf in the file list.'),
   (5, "Deleted isn't gone", 'Deleting a file usually removes the entry, not the data. Proper deletion overwrites the blocks, which is why organisations wipe drives before disposal.'),
  ],
  ws=dict(
    title='Operating systems: user and file management',
    objectives=['understand what is meant by user management', 'understand the ways an operating system manages files'],
    starter="Sign in to a school computer and list everything that is yours rather than the machine's. How does it know?",
    starter_lines=2,
    keyterms=['User account', 'File management', 'Accounts office'],
    keyq='How does an operating system manage users and their files?',
    exam=[
        ('State what is meant by user management.', 2, 2),
        ('Explain why a network manager sets permissions on groups rather than on individual users.', 3, 3),
        ('Describe three file management tasks carried out by an operating system.', 6, 6)],
    confidence=['User accounts and authentication', 'Access levels and groups', 'Files, folders and file management'],
  ))

# ---------------------------------------------------------------- lesson 4
L4 = dict(id="ss-l04", topic="1.5", lesson=4, title='Utility workshop', img='SS_L04_UtilityWorkshop_360',
  description='Work through the five utility programs, defragment a disk by hand, and pick the right utility for each situation.',
  kicker=f"{K15}  |  Lesson 4", scene_title='Utility workshop', subtitle=SUB15,
  intro="Utility software doesn't do your work: it looks after the machine. Meet the three you need to know, and defragment a disk yourself.",
  keywords=['Utility software', 'Encryption', 'Cyphertext', 'Defragmentation', 'Compression', 'Lossy', 'Lossless'],
  stations=[
   dict(name='What is utility software?', bullets=[
          'Utility software is systems software that maintains and protects the computer.',
          "It works on the machine itself, not on the user's documents.",
          'Examples: encryption, defragmentation, compression, backup and anti-malware.'],
        challenge='Name three utility programs and say what each one does.', ill=(
          'tiles',
          [
            ('Encryption', 'b'),
            ('Defragmentation', 'p'),
            ('Compression', 'o'),
            ('Backup', 'g'),
            ('Anti-malware', 'r')],
          3), fact='Utility software is...',
        tasks=[mcq('What is utility software for?', 'Maintaining and protecting the computer system', ['Writing documents', 'Playing games', 'Designing hardware'], 'It is systems software, like the OS itself.'),
               sort('Is each program a utility or an application?', ['Utility', 'Application'], [
  ['Disk defragmenter', 'Utility'],
  ['File compression tool', 'Utility'],
  ['Backup software', 'Utility'],
  ['Presentation software', 'Application'],
  ['Video editor', 'Application'],
  ['Web browser', 'Application']], "If it looks after the machine, it's a utility.")]),
   dict(name='Encryption', bullets=[
          'Encryption scrambles data using a key, turning plaintext into cyphertext.',
          'Without the key it is meaningless, so a stolen file or laptop gives nothing away.',
          'The same key, or a matching one, decrypts it back to the original.'],
        challenge='Explain why an encrypted laptop is safer than a password-protected one.', ill=('flow', ['Plaintext', 'Key', 'Cyphertext', 'Key', 'Plaintext']), fact='Encryption utilities...',
        tasks=[mcq('What does an encryption utility produce?', 'Cyphertext, which is meaningless without the key', ['A smaller file', 'A backup copy', 'A defragmented disk'], 'The data is still there, just unreadable.'),
               mcq('A laptop with an encrypted drive is stolen. What can the thief read?', 'Nothing, without the key', ['Everything, once it is plugged in elsewhere', 'Only the photos', 'Only files under 1 MB'], 'Which is why organisations encrypt every mobile device.')]),
   dict(name='Defragmentation', bullets=[
          'Over time, files get split into pieces scattered across a disk. This is fragmentation.',
          'The read/write head then has to jump about to collect one file, which is slow.',
          'A defragmentation utility gathers each file into one run and groups the free space together.'],
        challenge='Defragment the disk in the experience, then explain what changed and why it helps.', ill=(
          'compare',
          'Fragmented',
          ['Files in pieces', 'Head jumps about', 'Slower to open'],
          'Defragmented',
          ['Files in one run', 'Head sweeps once', 'Faster to open'],
          'r',
          'g'), fact='Defragmentation works by...',
        tasks=[dict(
                    t='defrag',
                    q='Defragment this disk: gather each file into one run with the free space at the end.',
                    fb='Every jump the head avoids is time saved on every future read.',
                    title='Disk: three files, badly fragmented'),
               mcq('Why does defragmentation not help a solid state drive?', 'An SSD has no moving head, so it reaches any block equally quickly, and the extra writes wear it out', ['SSDs never get fragmented', 'SSDs are always full', 'SSDs cannot store files'], 'Defragmenting an SSD is at best pointless and at worst harmful.')]),
   dict(name='Compression', bullets=[
          'A compression utility makes files smaller so they use less space and send faster.',
          'Lossless compression restores the original exactly: used for text, programs and archives.',
          'Lossy compression throws data away for a much smaller file: used for photos, music and video.'],
        challenge='Which type of compression would you use for a program file, and why?', ill=(
          'compare',
          'Lossless',
          ['Nothing lost', 'Exact restore', 'Smaller saving'],
          'Lossy',
          ['Data removed', 'Much smaller', 'Cannot be undone'],
          'g',
          'o'), fact='Compression utilities...',
        tasks=[mcq('Why must a program file be compressed losslessly?', 'Losing any data would stop the program working', ['Programs are too small to compress', 'Lossy compression is illegal', 'Programs have no patterns'], 'Every byte matters in a program.'),
               mcq('A 30 MB photo album is emailed as an 8 MB zip file. What has the utility done?', 'Rewritten the data more efficiently so it can be restored exactly', ['Deleted some photos', 'Reduced the number of pixels', 'Encrypted the photos'], 'Zip is lossless: the photos come back unchanged.')]),
   dict(name='Backup and updates', bullets=[
          'A backup utility copies files so they can be restored after loss, theft or ransomware.',
          'A full backup copies everything; an incremental backup copies only what has changed since last time.',
          'Update utilities keep the OS and drivers patched, closing security holes.'],
        challenge='Design a backup routine for a school, saying what runs and how often.', ill=(
          'table',
          ['Type', 'What it copies', 'Restore'],
          [['Full', 'Everything', 'Quickest'], ['Incremental', 'Changes only', 'Needs the full plus each set']]), fact='Backup utilities...',
        tasks=[mcq('What is an incremental backup?', 'A backup of only the files that have changed since the last one', ['A backup of everything, every time', 'A backup that deletes the original', 'A compressed photo'], 'Faster to take, but a restore needs the full backup and every incremental set since.'),
               mcq('Why should one backup be kept off-site or offline?', 'A fire, theft or ransomware attack could destroy both copies at once', ['Backups work faster when cold', 'It saves electricity', 'The law requires two buildings'], "A connected backup is not a backup from ransomware's point of view.")]),
   dict(name='Choosing the right utility', bullets=[
          'Match the utility to the problem: slow mechanical disk, risk of theft, files too large, data loss.',
          'Exam answers need the utility, what it does, and why it fits the situation.'],
        challenge='A laptop is slow, nearly full, and taken home nightly. Recommend three utilities and justify each.', ill=('flow', ["What's the problem?", 'Which utility?', 'Why it fixes it']), fact='To choose a utility, you...',
        tasks=[match('Match each problem to the utility that fixes it.', [
  ['A hard disk that has become slow to open files', 'Defragmentation'],
  ['A laptop that is taken off site', 'Encryption'],
  ['Files too large to email', 'Compression'],
  ['Work lost when a drive failed', 'Backup']], 'Name the utility, what it does, and why it suits the problem.'),
               mcq('Which is the best exam answer?', 'Encryption, because it turns the files into cyphertext, so a thief who takes the laptop cannot read them', [
  'Encryption, because it is secure',
  'Encryption, because everyone uses it',
  'Encryption, because it makes files smaller'], 'Utility, what it does, why it fits.')]),
  ],
  final=dict(name='Final challenge: service the machine', floor_title='Final challenge: service the machine',
             intro='One disk to tidy, then decide which utility each situation needs. Tap the star to begin.',
             ill=(
               'tiles',
               [('Encryption', 'b'), ('Defragmentation', 'p'), ('Compression', 'o'), ('Backup', 'g')],
               2),
             tasks=[dict(
                         t='defrag',
                         q='Defragment this disk, then say what the read/write head no longer has to do.',
                         fb='Files in one run, free space together: fewer jumps, faster reads.'),
                    sort('Which utility does each situation need?', ['Encryption', 'Defragmentation', 'Compression', 'Backup'], [
  ['A hospital laptop holding patient records', 'Encryption'],
  ['A mechanical disk that has slowed down over two years', 'Defragmentation'],
  ['A 60 MB set of photos to send by email', 'Compression'],
  ['A school that must survive a ransomware attack', 'Backup'],
  ['A USB stick that staff carry between sites', 'Encryption'],
  ['Ten years of records to archive in less space', 'Compression']], 'Name the utility, say what it does, and link it to the situation.')]),
  info=[
   (0, 'Utilities used to be separate', 'Defragmenters, backup tools and antivirus were once programs you bought. Most are now built into the operating system.'),
   (1, 'Keys, not passwords', 'An encryption key is far longer than a password. A 256-bit key has more combinations than there are atoms in the observable universe.'),
   (2, 'Why disks fragment', 'When a file grows and the space after it is taken, the extra has to go elsewhere. Do that for years and files end up in dozens of pieces.'),
   (3, 'Zip is everywhere', "A .docx file is really a zip archive: rename one to .zip and open it to find the document's parts inside."),
   (4, 'SSDs do their own thing', 'Solid state drives run a process called TRIM instead of defragmentation, marking deleted blocks so they can be reused quickly.'),
   (5, '3-2-1', 'The standard backup advice: three copies, on two types of media, with one off-site. Most data loss stories come from ignoring the last part.'),
  ],
  models=[
   (("back", 363, 411), 'harddisk', 'Inside a hard disk', 'The platters spin and the head swings across them. On a fragmented disk it jumps between tracks for a single file.'),
   (("left", 1178, 540), 'harddisk', 'Why defragmenting helps', 'Tracks are concentric rings. A file written in one run sits on neighbouring tracks, so the head barely moves.'),
  ],
  ws=dict(
    title='Utility system software',
    objectives=[
        'understand encryption utilities',
        'understand defragmentation utilities',
        'understand data compression utilities'],
    starter='Your laptop is slow, nearly full, and goes everywhere with you. List the three things you would most want software to do about it.',
    starter_lines=2,
    keyterms=['Utility software', 'Defragmentation', 'Utility workshop'],
    keyq='What is the purpose of utility software?',
    exam=[
        ('State what is meant by utility software, and give two examples.', 3, 3),
        ('Describe how a defragmentation utility improves the performance of a hard disk drive.', 4, 4),
        (
          'A company gives every employee a laptop that leaves the building. Recommend two utilities and justify each choice.',
          6,
          6)],
    confidence=['What utility software is', 'Encryption and compression', "Defragmentation, and why SSDs don't need it"],
  ))

