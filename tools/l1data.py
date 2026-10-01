import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
import json, base64
C = {1:"#40c4ff",2:"#aa6eeb",3:"#ff785a",4:"#ffa028",5:"#50dc96",6:"#f05aaa"}
GREEN="#50dc96"; RED="#ff5f5f"; YEL="#ffd046"
R1=(1,-0.69,0.473); R2=(1,-0.69,-0.473); B1=(0.473,-0.69,-1); B2=(-0.473,-0.69,-1)
L=(-1,-0.72,0); BC=(0,-0.74,-1)
def mcq(q, right, wrong, fb): return dict(t="mcq", q=q, a=[right]+wrong, fb=fb)
scenes = [
 dict(id="p1", title="Part 1: Standalone", img="L1_Part1_Standalone_360.jpg", stations=[
  dict(label="1", name="Standalone computer", col=C[1], pos=R1, tasks=[
   mcq("What is a standalone computer?", "A computer that is not connected to any other computer or network",
       ["A computer that stands on the floor rather than a desk", "A computer that connects to the internet only by Wi-Fi", "The main computer that controls a network"],
       "A standalone computer works on its own. Its files, software and hardware can only be used on that one machine."),
   mcq("Which of these is most likely to be standalone?", "A laptop with Wi-Fi switched off, used to write stories",
       ["A games console playing online", "A smart speaker answering questions", "A school PC that you log on to with your network username"],
       "With Wi-Fi off and no cables, the laptop isn't connected to anything, so it is standalone. The others all rely on a network.")]),
  dict(label="2", name="Sharing a file", col=C[2], pos=R2, tasks=[
   mcq("Without a network, how can you get a file onto another computer?", "Copy it onto removable media, such as a USB stick, and carry it over",
       ["Send it by email", "Save it to the cloud", "Print it to the other computer"],
       "Email and the cloud both need a network, so without one you have to carry the file on removable media."),
   mcq("Two friends pass one essay back and forth on a USB stick. What is the most likely problem?", "They end up with different versions, and changes get lost",
       ["The file turns into a virus", "The essay gets shorter every time it is copied", "The USB stick sends it to the wrong person"],
       "Every copy can be edited separately, so it is easy to lose track of which version is the latest.")]),
  dict(label="3", name="Printing", col=C[3], pos=B1, tasks=[
   mcq("A room has 30 standalone computers. How many printers are needed so that every computer can print directly?", "30",
       ["1", "3", "None"], "Each standalone computer needs its own printer plugged in, so 30 computers need 30 printers."),
   mcq("Why would needing so many printers be a problem for a school?", "Buying, powering and maintaining lots of printers is expensive",
       ["Printers can only print one page each per day", "Printers slow down the internet", "Standalone printers can't print in colour"],
       "More printers means more cost for the machines, ink, paper, electricity and repairs. On a network, one printer can be shared.")]),
  dict(label="4", name="Updates and backups", col=C[4], pos=B2, tasks=[
   mcq("On standalone computers, how must software updates be installed?", "Separately on every computer",
       ["Once, on a server, for every computer", "Automatically by the router", "They never need updating"],
       "Without a network, someone has to install each update on each computer individually."),
   mcq("A standalone computer that has never been backed up has a hard drive failure. What happens to its files?", "They are lost, because there is no other copy",
       ["They are restored from the network server", "They move to the cloud automatically", "They are saved on the printer"],
       "There is no network, so there is no server or cloud copy. Without a backup, the files are gone.")]),
  dict(label="?", name="Predict", col=C[6], pos=L, tasks=[
   dict(t="match", q="Match each problem to how a network would solve it.",
        pairs=[["Sharing files", "Save files on a file server that every computer can open"],
               ["Printing", "Share one printer between many computers"],
               ["Installing updates", "Install updates on every computer from one place"],
               ["Backing up", "Back up everyone's data centrally, all at once"]],
        fb="You'll see all four of these in part 2, the school LAN.")]),
 ]),
 dict(id="p2", title="Part 2: LAN", img="L1_Part2_LAN_360.jpg", stations=[
  dict(label="1", name="Local area network (LAN)", col=C[1], pos=R1, tasks=[
   mcq("Which best describes a LAN?", "A network covering a small area, such as one site, where the organisation owns the hardware",
       ["A network covering a large area, using connections rented from telecoms companies", "A single computer not connected to anything", "The cables that link countries under the sea"],
       "LAN stands for local area network: small area, one site, and hardware owned by the organisation."),
   mcq("Is the Wi-Fi network in a home a LAN?", "Yes: it covers one small site and the household owns the equipment",
       ["No: it uses Wi-Fi, so it cannot be a LAN", "No: it connects to the internet, so it is a WAN", "Only if more than 10 devices are connected"],
       "A LAN can use cables, Wi-Fi or both. Connecting to the internet doesn't stop your home network being a LAN.")]),
  dict(label="2", name="Sharing resources", col=C[2], pos=R2, tasks=[
   mcq("On a school LAN, where are shared files kept so that any computer can open them?", "On a file server",
       ["On the router", "On each student's monitor", "On the switch"],
       "The file server stores shared files, and the network lets every computer reach them."),
   mcq("Which of these is NOT a benefit of sharing resources on a LAN?", "Every computer needs its own printer",
       ["One printer can be shared by a whole room", "You can log on at any computer and see your own files", "Files can be opened from any computer"],
       "Sharing a printer is the benefit. Needing one printer per computer is the standalone problem from part 1.")]),
  dict(label="3", name="Advantages", col=GREEN, pos=B1, tasks=[
   mcq("Which of these is an advantage of a network?", "Software can be installed and updated on every computer from one place",
       ["Viruses can spread from one computer to others", "A network manager is needed to run it", "Servers and switches are expensive"],
       "The other three options are all disadvantages of networks."),
   mcq("How does a network make backing up easier?", "Everyone's data is stored centrally, so it can all be backed up at once",
       ["Each computer backs itself up to a USB stick", "Networks never lose data, so backups aren't needed", "The switch keeps a copy of every file"],
       "Central storage on a server means one backup covers everyone's work.")]),
  dict(label="4", name="Disadvantages", col=RED, pos=B2, tasks=[
   mcq("Which of these is a disadvantage of a network?", "Viruses and malware can spread from one computer to many",
       ["Files can be shared easily", "One printer can be shared", "Users can communicate by email"],
       "Because the computers are connected, malware on one machine can reach the others."),
   mcq("Which would best reduce the risk of a virus spreading across a school network?", "Keep anti-malware software up to date and install security updates",
       ["Buy more printers", "Use longer network cables", "Turn off the file server at lunchtime"],
       "Up-to-date anti-malware software and security updates stop most malware before it can spread.")]),
  dict(label="5", name="The LAN in this room", col=C[6], pos=L, tasks=[
   mcq("In the LAN on this wall, which device connects all the computers together?", "The switch",
       ["The printer", "The file server", "The monitor"], "Every computer's cable runs to the switch, which links them all together."),
   mcq("Which device on this wall stores the files that everyone shares?", "The file server",
       ["The switch", "The shared printer", "The cable"], "The file server holds shared files so that any computer on the LAN can open them.")]),
 ]),
 dict(id="p3", title="Part 3: WAN", img="L1_Part3_WAN_360.jpg", stations=[
  dict(label="1", name="Wide area network (WAN)", col=C[1], pos=R1, tasks=[
   mcq("Which best describes a WAN?", "A network covering a large geographical area that connects LANs together",
       ["A network inside one building", "A network that uses no cables at all", "A standalone computer with internet access"],
       "WAN stands for wide area network. It covers towns, countries or the whole world, and joins LANs together."),
   mcq("A school trust links the LANs of its schools in different towns. What is this?", "A WAN, because it covers a large area and joins LANs together",
       ["A LAN, because it all belongs to one organisation", "A standalone network", "It isn't a network at all"],
       "Size is the key: once a network spans different towns, it is a WAN, even if one organisation runs it.")]),
  dict(label="2", name="Who owns the connections?", col=C[2], pos=R2, tasks=[
   mcq("Who usually owns the connections used by a WAN?", "Telecoms companies, who rent (lease) them to organisations",
       ["The school", "The students", "Nobody owns them"],
       "Organisations rent WAN links from telecoms companies rather than building their own."),
   mcq("Why doesn't a school lay its own cable to another school 30 miles away?", "It would cost far too much and cross land the school doesn't own, so renting a link is cheaper",
       ["Cables can't be longer than one mile", "WANs never use cables", "Schools aren't allowed to own any network cables"],
       "Laying cable over long distances is hugely expensive and needs permission from landowners. Telecoms companies already have the cables in place."),
   mcq("What carries WAN traffic across oceans?", "Undersea fibre optic cables",
       ["UTP cables", "Bluetooth", "USB cables"], "Fibre optic cables on the seabed carry most of the internet's traffic between continents.")]),
  dict(label="3", name="LAN vs WAN", col=C[3], pos=BC, tasks=[
   dict(t="sort", q="Sort each statement: does it describe a LAN or a WAN?", cats=["LAN", "WAN"],
        items=[["Covers one building or site", "LAN"], ["Covers towns, countries or the world", "WAN"],
               ["Hardware is owned by the organisation", "LAN"], ["Connections are usually rented from telecoms companies", "WAN"],
               ["Your school network", "LAN"], ["The internet", "WAN"]],
        fb="Now use these to write your three LAN bullet points and three contrasting WAN bullet points in your worksheet.")]),
  dict(label="4", name="Quick check", col=C[6], pos=L, tasks=[
   mcq("What is the biggest WAN in the world?", "The internet",
       ["Your school network", "A home Wi-Fi network", "Bluetooth"], "The internet is a WAN of millions of connected networks.")]),
  dict(label="5", name="Satellite", col=C[5], pos=(0,1,-0.146), tasks=[
   mcq("Why are satellites used for some WAN links?", "To reach places that cables can't easily reach, such as ships at sea",
       ["Because they are the cheapest option everywhere", "Because they are faster than fibre in every situation", "To connect computers in the same room"],
       "Satellites cover remote places, but fibre is usually faster and has less delay where it is available.")]),
 ]),
]
for sc in scenes:
    sc["img"] = "data:image/jpeg;base64," + base64.b64encode(open(OUT_S+sc["img"],"rb").read()).decode()
json.dump(scenes, open("l1q.json","w"))
