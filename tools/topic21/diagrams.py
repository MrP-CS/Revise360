"""Exact educational diagrams rendered within the established room panels."""
def render(d,x,y,l,i,c,txt,box):
 def text(cx,cy,s,n=30):txt(d,x+cx,y+cy,s,n,c,True)
 def rect(a,b,w,h,label):
  box(d,(x+a,y+b,x+a+w,y+b+h),c);text(a+14,b+14,label)
 def line(points):d.line(tuple(v for point in points for v in (x+point[0],y+point[1])),fill=c,width=4)
 if l==3 and i in [0,1,2]:
  rect(260,10,290,64,'Loan system')
  line([(405,74),(405,112),(130,112),(130,145)]);line([(405,112),(665,112),(665,145)]);line([(405,112),(405,145)])
  for a,lab in [(12,'Members'),(280,'Issue loan'),(550,'Returns')]:rect(a,145,235,65,lab)
  if i==1:
   line([(405,210),(405,260),(240,260),(240,295)]);line([(405,260),(610,260),(610,295)])
   rect(50,295,360,65,'Check availability');rect(450,295,350,65,'Record borrower')
  else:text(115,290,'Child boxes are parts of their parent',28)
  return True
 if l!=11:return False
 if i==0:
  d.ellipse((x+225,y+30,x+590,y+145),outline=c,width=6);text(335,67,'Start',40)
  line([(407,145),(407,245)]);line([(390,223),(407,245),(424,223)])
  d.ellipse((x+225,y+260,x+590,y+375),outline=c,width=6);text(352,300,'End',40)
 elif i==1:
  points=[(110,90),(760,90),(680,280),(30,280),(110,90)];line(points);text(175,165,'Input borrower ID',38)
 elif i==2:rect(75,100,650,165,'total = hours * rate')
 elif i==3:
  line([(410,25),(720,175),(410,315),(100,175),(410,25)]);text(288,149,'available?',35)
  line([(720,175),(800,175)]);text(722,125,'Yes',26)
  line([(410,315),(410,382)]);text(435,330,'No',26)
 elif i==4:
  rect(40,95,750,180,'checkAvailability()');line([(80,95),(80,275)]);line([(750,95),(750,275)])
 else:
  rect(220,0,410,64,'Check availability')
  line([(425,64),(425,100)]);line([(425,100),(610,177),(425,255),(240,177),(425,100)]);text(343,159,'Available?',26)
  line([(240,177),(95,177),(95,294)]);text(135,135,'Yes',27)
  line([(610,177),(705,177),(705,294)]);text(665,135,'No',27)
  rect(5,294,365,68,'Record loan');rect(435,294,360,68,'Show unavailable')
 return True
