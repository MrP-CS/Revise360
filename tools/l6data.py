import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
import json, base64, io
from l6 import *
# break-it diagram image
im = Image.new("RGB", (1800, 860), BG); d = ImageDraw.Draw(im)
break_diagram(d, -150, -600)
buf = io.BytesIO(); im.resize((900, 430), Image.LANCZOS).save(buf, "PNG")
DIAG = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

C = {1:"#40c4ff",2:"#aa6eeb",3:"#ff785a",4:"#ffa028",5:"#50dc96",6:"#f05aaa"}
R1=(1,-0.69,0.473); R2=(1,-0.69,-0.473); B1=(0.473,-0.69,-1); B2=(-0.473,-0.69,-1); L=(-1,-0.74,0)
def mcq(q, right, wrong, fb, img=None): return dict(t="mcq", q=q, a=[right]+wrong, fb=fb, img=img)
def multi(q, opts, correct, fb): return dict(t="multi", q=q, opts=opts, correct=correct, fb=fb, img=DIAG)
DEV5 = ["Reception", "Sales 1", "Sales 2", "Accounts", "Conference"]
scenes = [
 dict(id="p1", title="Part 1: Star", img="L6_Part1_Star_360.jpg", stations=[
  dict(label="1", name="Star topology", col=C[1], pos=R1, tasks=[
   mcq("What is at the centre of a star network?", "A switch", ["A printer", "A laptop", "The internet"],
       "Every device in a star connects to the central switch, and all data passes through it."),
   mcq("How does each device connect in a star network?", "With its own cable to the central switch",
       ["With a cable to the next device along", "With cables to every other device", "Only by Bluetooth"],
       "Each device has its own dedicated cable to the switch. Cables to every other device would be a full mesh.")]),
  dict(label="2", name="Advantages of star", col=C[2], pos=R2, tasks=[
   mcq("One cable in a star network is cut. What happens?", "Only the device on that cable loses its connection",
       ["The whole network stops working", "Every device slows down", "The data is automatically rerouted along another cable"],
       "Each device has its own cable, so a cut cable only affects that one device. There is no other route, so the data can't be rerouted."),
   mcq("Why does a star network perform well?", "The switch sends data only to the device it is meant for, so there is less unnecessary traffic",
       ["Every device receives every message", "Data travels around a ring", "It doesn't use any cables"],
       "The switch forwards each piece of data only where it needs to go, which keeps traffic down.")]),
  dict(label="3", name="Disadvantages of star", col=C[3], pos=B1, tasks=[
   mcq("What is the biggest weakness of a star network?", "If the central switch fails, every device loses its connection",
       ["If one cable fails, every device loses its connection", "It is hard to add new devices", "Data can go the wrong way round the star"],
       "The switch is a single point of failure: everything depends on it."),
   mcq("Why can a star network be expensive to install?", "Every device needs its own cable back to the switch, which uses a lot of cable",
       ["Every device needs its own switch", "Each computer needs a satellite dish", "Star networks need a separate router for every room"],
       "Running a separate cable from every device to the switch adds up to a lot of cable and installation work.")]),
  dict(label="4", name="Joining star networks", col=C[4], pos=B2, tasks=[
   mcq("An office has two star networks, each with its own switch. How are they joined together?", "A cable links the two switches",
       ["Every computer is plugged into both switches", "They are joined through the printer", "Star networks can't be joined"],
       "Linking the switches lets devices on one star reach devices on the other."),
   mcq("The link cable between the two switches is cut. What happens?", "Devices can still talk to others on the same switch, but not to devices on the other switch",
       ["Every device loses its connection", "Nothing changes", "Only the two switches stop working"],
       "Each star still works on its own. Only traffic between the two stars is cut off.")]),
  dict(label="5", name="Break it!", col=C[6], pos=L, tasks=[
   multi("The cable between Sales 2 and Switch A is cut. Which devices can no longer reach the file server? Select all that apply.",
         DEV5, ["Sales 2"], "Only Sales 2 is cut off. Everyone else's cables and switches still work."),
   multi("Switch A fails. Which devices can no longer reach the file server? Select all that apply.",
         DEV5, ["Reception", "Sales 1", "Sales 2"], "Everything plugged into Switch A loses its connection. Accounts and Conference are on Switch B with the server, so they are fine."),
   multi("The link cable between the two switches is cut. Which devices can still reach the file server? Select all that apply.",
         DEV5, ["Accounts", "Conference"], "Accounts and Conference share Switch B with the server. Reception and Sales are stranded on Switch A."),
   mcq("Which single failure would stop every device from reaching the file server?", "Switch B fails",
       ["Switch A fails", "The cable to Reception is cut", "The link cable between the switches is cut"],
       "The server is plugged into Switch B, so if Switch B fails nobody can reach it. Cutting the server's own cable would do the same.", img=DIAG)]),
 ]),
 dict(id="p2", title="Part 2: Mesh", img="L6_Part2_Mesh_360.jpg", stations=[
  dict(label="1", name="Full mesh", col=C[1], pos=R1, tasks=[
   mcq("What is a full mesh network?", "Every device is connected directly to every other device",
       ["Every device connects to one central switch", "Devices are connected in a single line", "Devices connect only by Wi-Fi"],
       "In a full mesh every device has a direct link to every other device."),
   mcq("How many cables are needed to connect four devices in a full mesh?", "6", ["4", "8", "12"],
       "Each of the 4 devices links to the 3 others: 4 × 3 = 12, but each cable joins two devices, so 12 ÷ 2 = 6.")]),
  dict(label="2", name="Mesh: pros and cons", col=C[2], pos=R2, tasks=[
   mcq("One link in a mesh network fails. What happens?", "The data is rerouted along another path",
       ["The whole network stops working", "Every device loses its connection", "Data waits until the link is repaired"],
       "There are many routes between devices, so data simply takes a different one."),
   mcq("What is the main disadvantage of a full mesh network?", "It needs a lot of cable and is hard to set up, so it is expensive",
       ["It has a single point of failure", "Data can only travel one way", "It can only connect two devices"],
       "The number of cables grows quickly as devices are added, which makes a full mesh costly.")]),
  dict(label="3", name="Partial mesh: the internet", col=C[3], pos=B1, tasks=[
   mcq("Why is the internet a partial mesh rather than a full mesh?", "Connecting every router to every other router would need an impossible amount of cabling",
       ["Routers can only have one connection each", "The internet doesn't use routers", "A partial mesh has no single point of failure but a full mesh does"],
       "Routers connect to several others, which gives plenty of alternative routes without linking every pair."),
   mcq("A router on the internet fails. What happens to data that was going to pass through it?", "It is sent a different way through other routers",
       ["The whole internet goes down", "It is deleted", "It waits in the failed router until it is fixed"],
       "Because the internet is a mesh, other routes are available around the failed router.")]),
  dict(label="4", name="Wireless mesh", col=C[4], pos=B2, tasks=[
   mcq("In a wireless mesh, what must be true of each wireless access point?", "It must be within range of at least one other WAP",
       ["It must be plugged into the router with a cable", "It must be in the same room as the router", "It must connect to every device in the building"],
       "WAPs pass data to each other by Wi-Fi, so each one needs at least one neighbour in range. Only one needs a cable."),
   mcq("What is a disadvantage of a wireless mesh compared with a wired network?", "It can be slower and less reliable, because data hops between WAPs and walls cause interference",
       ["It needs much more cable", "Devices must stay plugged in", "It has no range limits"],
       "Every hop between WAPs adds delay, and walls and other devices can weaken the signal.")]),
  dict(label="5", name="Star vs mesh", col=C[6], pos=L, tasks=[
   dict(t="sort", q="Sort each statement: does it describe a star or a mesh network?", cats=["Star", "Mesh"],
        items=[["The central switch is a single point of failure", "Star"], ["Data can be rerouted if a link fails", "Mesh"],
               ["Uses the least cable of the two", "Star"], ["Each device connects to several others", "Mesh"],
               ["A new device needs just one cable to the switch", "Star"], ["The internet is an example", "Mesh"]],
        fb="Use these to answer the worksheet question: why is a mesh network better than a star network, and when would you still choose a star?")]),
 ]),
]
for sc in scenes:
    sc["img"] = "data:image/jpeg;base64," + base64.b64encode(open(OUT_S+sc["img"],"rb").read()).decode()
json.dump(scenes, open("l6q.json","w"))
print("ok")
