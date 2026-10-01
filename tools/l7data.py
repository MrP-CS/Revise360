import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paths import SITE_S, OUT_S, LAND
import json, base64
C = {1:"#40c4ff",2:"#aa6eeb",3:"#ff785a",4:"#ffa028",5:"#50dc96",6:"#f05aaa"}
R1=(1,-0.69,0.473); R2=(1,-0.69,-0.473); B1=(0.473,-0.69,-1); B2=(-0.473,-0.69,-1); L1=(-1,-0.69,-0.473); L2=(-1,-0.69,0.473)
def mcq(q, right, wrong, fb): return dict(t="mcq", q=q, a=[right]+wrong, fb=fb)
st = [
 dict(label="1", name="Lesson 1: Types of network", col=C[1], pos=R1, tasks=[
  mcq("Which best describes a LAN?", "A network covering a small area, such as one site, where the organisation owns the hardware",
      ["A network covering a large area using rented telecoms links", "A computer that isn't connected to anything", "The undersea cables between continents"],
      "LAN = local area network: one site, and the organisation owns the hardware."),
  mcq("Which is the best example of a WAN?", "The internet", ["A school network", "A home Wi-Fi network", "A printer connected by USB"],
      "The internet is the biggest WAN, joining networks all over the world."),
  mcq("Which of these is a disadvantage of networking?", "Viruses can spread from one computer to others",
      ["Files can be shared", "Printers can be shared", "Backups can be done centrally"], "The other three are all advantages of networks.")]),
 dict(label="2", name="Lesson 2: Network performance", col=C[2], pos=R2, tasks=[
  mcq("What is bandwidth?", "The amount of data that can be sent in a given time, such as per second",
      ["The length of a network cable", "The number of devices on a network", "The range of a Wi-Fi signal"],
      "Bandwidth is measured in bits per second. More bandwidth means more data can be sent at once."),
  mcq("Thirty students start streaming video at the same time. Why does the network slow down?", "More users are sharing the same bandwidth",
      ["The cables heat up", "The switch changes its MAC address", "The videos are stored on each computer"],
      "Each user gets a smaller share of the available bandwidth, so everything slows down."),
  mcq("The school wants more CCTV cameras recording video to the file server. What should the network manager check first?", "Whether the network has enough bandwidth for the extra video traffic",
      ["Whether the cameras record in colour", "How many printers the school has", "Whether the cameras are made by the same company"],
      "Video creates a lot of traffic. Extra cameras could use up bandwidth and slow the network for everyone, and the server needs enough storage too.")]),
 dict(label="3", name="Lesson 3: Client-server and P2P", col=C[3], pos=B1, tasks=[
  mcq("In a client-server network, what does the server do?", "Provides services such as file storage, logins and backups to the clients",
      ["Requests files from the clients", "Acts as an equal peer like every other computer", "Connects the LAN to the internet"],
      "Clients request services and the server provides them. Connecting to the internet is the router's job."),
  mcq("Which of these is an advantage of a peer-to-peer network?", "It is cheaper to set up, because no expensive server is needed",
      ["It is easier to back up all the shared data", "It is more secure", "It is easier to manage file security"],
      "The other three are advantages of client-server networks."),
  mcq("Torrenting downloads parts of a file from many other users' computers at once. Which model is this?", "Peer-to-peer",
      ["Client-server", "A star network", "A standalone computer"],
      "Every user's computer shares pieces of the file directly with the others, so they act as peers.")]),
 dict(label="4", name="Lesson 4: LAN hardware", col=C[4], pos=B2, tasks=[
  mcq("What is the difference between a switch and a router?", "A switch connects devices within a LAN; a router connects different networks, such as a LAN and the internet",
      ["A router connects devices within a LAN; a switch connects the LAN to the internet", "There is no difference", "A switch is wireless and a router is wired"],
      "Switches work inside a LAN using MAC addresses. Routers join networks together using IP addresses."),
  mcq("Which device lets wireless devices connect to a wired network?", "A wireless access point (WAP)",
      ["A switch", "A UTP cable", "A fibre optic cable"], "A WAP sends and receives radio waves and is connected to the wired network by cable."),
  mcq("Why is fibre optic used instead of UTP to link buildings that are far apart?", "It carries data much further with high bandwidth, and isn't affected by electrical interference",
      ["It is cheaper and easier to install", "It uses radio waves", "It plugs straight into any laptop"],
      "UTP is limited to about 100 m per run. Fibre works over kilometres, although it costs more.")]),
 dict(label="5", name="Lesson 5: The internet", col=C[5], pos=L1, tasks=[
  mcq("What is the internet?", "A worldwide collection of connected computer networks",
      ["All the websites in the world", "One huge computer owned by a tech company", "The Wi-Fi in your home"],
      "The internet is the network of networks. The websites on it are the World Wide Web, which is a service that uses the internet."),
  mcq("What does DNS do?", "Turns a domain name, such as www.google.com, into an IP address",
      ["Stores the web pages for every website", "Gives each device its MAC address", "Encrypts Wi-Fi signals"],
      "DNS is made up of many domain name servers that look up the IP address for a domain name."),
  mcq("Which of these is a disadvantage of using the cloud?", "It relies on a stable internet connection",
      ["You can access your data anywhere, at any time", "It is easy to scale up", "It has good backup and recovery options"],
      "The other three are advantages of the cloud. Other disadvantages include ongoing costs and less control over your data.")]),
 dict(label="6", name="Lesson 6: Star and mesh", col=C[6], pos=L2, tasks=[
  mcq("In a star network, what happens if the central switch fails?", "Every device loses its connection",
      ["Only one device is affected", "Data is rerouted around the switch", "Nothing happens"], "The switch is a single point of failure."),
  mcq("Why is a mesh network more reliable than a star network?", "Data can be rerouted along another path if a link fails",
      ["It uses less cable", "It has a central switch", "Every device is wireless"], "Mesh networks have many routes between devices, so there is no single point of failure."),
  mcq("The internet is an example of which topology?", "Partial mesh", ["Star", "Full mesh", "Standalone"],
      "Routers connect to several other routers, but not to every one of them.")]),
 dict(label="★", name="Final challenge: DNS", col="#ffd046", pos=(0,-1,0.36), tasks=[
  dict(t="order", q="Put the steps in order, from typing the address to seeing the page.",
       steps=["You type www.google.com into the browser",
              "The browser asks a DNS server for the IP address of www.google.com",
              "DNS servers look up the domain name, asking other DNS servers if they need to",
              "The IP address is sent back to the browser",
              "The browser uses the IP address to request the page from the web server, which sends it back"],
       fb="DNS is not one server but many domain name servers working together. You don't need their names for the exam, just the idea.")]),
]
scenes=[dict(id="p1", title="Revision HQ", img="data:image/jpeg;base64,"+base64.b64encode(open(OUT_S + "L7_RevisionHQ_360.jpg","rb").read()).decode(), stations=st)]
json.dump(scenes, open("l7q.json","w")); print("ok")
