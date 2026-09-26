"""Build original Topic 2.5 rooms from editable content, without external artwork."""
from pathlib import Path
import json,sys
from PIL import Image,ImageDraw,ImageFont
from content import LESSONS,C
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).parent
LESSONS.insert(0,json.loads((HERE/'lesson1.json').read_text()))
F=Path('/usr/share/fonts/truetype/dejavu');SCALE=2
class Draw:
 def __init__(self,im):self.d=ImageDraw.Draw(im)
 def coords(self,p):return tuple(v*SCALE for v in p)
 def text(self,xy,s,**kw):self.d.text(self.coords(xy),s,**kw)
 def textlength(self,s,**kw):return self.d.textlength(s,**kw)/SCALE
 def rectangle(self,xy,**kw):self.d.rectangle(self.coords(xy),**kw)
 def rounded_rectangle(self,xy,radius,**kw):
  if 'width'in kw:kw['width']*=SCALE
  self.d.rounded_rectangle(self.coords(xy),radius*SCALE,**kw)
 def ellipse(self,xy,**kw):self.d.ellipse(self.coords(xy),**kw)
 def line(self,xy,**kw):
  if 'width'in kw:kw['width']*=SCALE
  self.d.line(self.coords(xy),**kw)
def font(n,b=False,mono=False):return ImageFont.truetype(str(F/('DejaVuSans'+('Mono'if mono else'')+('-Bold'if b else'')+'.ttf')),int(n*SCALE))
def txt(d,x,y,s,n=44,c='#f0f4fa',b=False,mono=False):d.text((x,y),s,font=font(n,b,mono),fill=c)
def wrap(d,s,x,y,w,n=44,c='#f0f4fa',b=False,gap=10):
 words=s.split();line=''
 for word in words:
  v=(line+' '+word).strip()
  if d.textlength(v,font=font(n,b))>w and line:txt(d,x,y,line,n,c,b);y+=n+gap;line=word
  else:line=v
 if line:txt(d,x,y,line,n,c,b);y+=n+gap
 return y
def center(d,s,y,n=48,c='#f0f4fa',b=False):txt(d,(2048-d.textlength(s,font=font(n,b)))/2,y,s,n,c,b)
def box(d,xy,c='#3c5a87',fill='#10192b',width=4):d.rounded_rectangle(xy,18,fill=fill,outline=c,width=width)
def base():
 im=Image.new('RGB',(2048*SCALE,2048*SCALE),'#121d31');d=Draw(im)
 for z in range(0,2049,128):d.line((z,0,z,2048),fill='#172338',width=2);d.line((0,z,2048,z),fill='#172338',width=2)
 d.rectangle((0,0,2048,280),fill='#1b263a');d.line((0,282,2048,282),fill='#6172a0',width=5);d.line((0,296,2048,296),fill='#604080',width=3);d.rectangle((0,1940,2048,2048),fill='#0c1321');d.line((0,1940,2048,1940),fill='#435777',width=6)
 return im,d
manifest=[]
for l in LESSONS:
 stem=f'PL_L{l["n"]:02d}_{l["slug"]}';folder=ROOT/'experiences/img'/stem;folder.mkdir(parents=True,exist_ok=True);faces={}
 for fi,side in enumerate(['right','back','left']):
  im,d=base()
  for n in range(2):
   i=fi*2+n;s=l['stations'][i];x=70+968*n;c=C[i]
   box(d,(x,380,x+900,1888),c,'#1c2c4a');d.rounded_rectangle((x,380,x+900,503),22,fill=c);d.rectangle((x,445,x+900,503),fill=c)
   d.ellipse((x+28,410,x+94,476),fill='#f0f4fa');txt(d,x+46,412,str(i+1),43,c,True)
   size=46
   while d.textlength(s['name'],font=font(size,True))>750:size-=1
   txt(d,x+114,413,s['name'],size,'#10203a',True)
   box(d,(x+34,615,x+866,1035),c)
   for j,line in enumerate(s['diagram']):
    size=36
    while d.textlength(line,font=font(size,False,True))>778:size-=1
    assert size>=28,(l['n'],i,line)
    txt(d,x+60,646+j*69,line,size,c if j==0 else'#f0f4fa',mono=True)
   y=1070
   for fact in s['facts']:
    d.ellipse((x+28,y+15,x+42,y+29),fill=c);y=wrap(d,fact,x+60,y,808,40,gap=8)+22
   assert y<=1480,(l['n'],i,y)
   box(d,(x+28,1490,x+872,1685),'#ffd046');txt(d,x+50,1505,'Challenge',36,'#ffd046',True)
   y=wrap(d,s['challenge'],x+50,1557,800,34,gap=6);assert y<=1677,(l['n'],i,y)
  faces[side]=im
 im,d=base();center(d,f'2.5 Programming languages and IDEs  |  Lesson {l["n"]}',375,42,'#ffd046',True);center(d,l['title'],452,78,b=True);center(d,'OCR J277 Paper 2  |  Computational thinking, algorithms and programming',555,31,'#b4c4dc')
 box(d,(160,650,1888,1180),'#ffd046','#1c2c4a');y=wrap(d,l['mission'],210,690,1610,48,gap=12);txt(d,210,y+44,'At each numbered station, record:',46,'#ffd046',True);txt(d,225,y+126,'• the key facts in your own words',44);txt(d,225,y+202,'• your answer to the challenge question',44)
 for j,(a,b,c) in enumerate([('Turn right','Stations 1 and 2',C[0]),('Turn around','Stations 3 and 4',C[2]),('Turn left','Stations 5 and 6',C[4]),('Look down','Final challenge','#ffd046')]):
  x=164+j*436;box(d,(x,1260,x+410,1500),c);txt(d,x+22,1308,a,42,c,True);txt(d,x+22,1392,b,30)
 center(d,'Blue i markers open readable notes for each station.',1580,34,'#b4c4dc');center(d,'Complete the room, then move on to the plenary knowledge checks.',1670,32,'#ffd046');faces['front']=im
 im,d=base();box(d,(125,130,1923,640),'#ffd046');center(d,'Final challenge',185,78,b=True);wrap(d,'Bring the ideas together. Complete the final challenge on your worksheet before selecting the star.',230,310,1588,52,gap=14);center(d,'Predict. Explain your reasoning. Check your understanding.',530,39,'#ffd046')
 for j,(a,b,c) in enumerate([('RECALL','Which facts help?',C[0]),('APPLY','Use the facts in the task.',C[1]),('EXPLAIN','Give a linked reason.',C[4])]):
  x=155+j*590;box(d,(x,1050,x+550,1510),c);txt(d,x+35,1110,a,48,c,True);wrap(d,b,x+35,1240,478,44,gap=14)
 center(d,'Use review mode to learn from any mistakes.',1690,44,'#ffd046');faces['down']=im
 im,d=base()
 for rect in [(320,370,800,610),(1248,370,1728,610),(320,1438,800,1678),(1248,1438,1728,1678)]:d.rounded_rectangle(rect,25,fill='#e9eefb')
 faces['up']=im
 for name,im in faces.items():im.save(folder/(name+'.webp'),quality=95,method=6)
 # The selection thumbnail is a flat overview, never a warped panorama crop.
 faces['front'].crop((280,670,3816,3550)).resize((1000,815),Image.Resampling.LANCZOS).save(ROOT/'experiences/img'/(stem+'_card.jpg'),quality=95)
 # Keep a fallback image for older players; face rendering takes priority.
 faces['front'].resize((1024,1024),Image.Resampling.LANCZOS).save(folder/'fallback.jpg',quality=92)
 stations=[];infos=[]
 for i,s in enumerate(l['stations']):
  stations.append(dict(label=str(i+1),name=s['name'],col=C[i],face=['right','back','left'][i//2],x=[540,1508][i%2],y=1770,tasks=s['tasks']))
  infos.append(dict(id='f'+str(i+1),face=['right','back','left'][i//2],x=[920,1888][i%2],y=540,title=s['name'],text='\n\n'.join(s['facts'])+'\n\nChallenge: '+s['challenge']+'\n\n'+s['info']))
 stations.append(dict(label='★',name='Final challenge',col='#ffd046',face='down',x=1024,y=800,tasks=l['final']))
 exp=dict(id=f'pl-l{l["n"]:02d}',lesson=l['n'],title=l['title'],scenes=[dict(id='main',title=l['title'],img=f'img/{stem}/fallback.jpg',faces={k:f'img/{stem}/{k}.webp'for k in faces},stations=stations,info=infos,models=[])])
 (ROOT/'experiences'/f'{exp["id"]}.json').write_text(json.dumps(exp,indent=2,ensure_ascii=False))
 entry=dict(id=exp['id'],topic='2.5',lesson=l['n'],title=l['title'],description=l['mission'],thumb=f'img/{stem}_card.jpg',worksheet=f'worksheets/{stem}_Worksheet.docx',powerpoint=f'presentations/{stem}_Lesson.pptx')
 manifest.append(entry);l.update(stem=stem,id=exp['id'])
regpath=ROOT/'experiences/registry.json';reg=json.loads(regpath.read_text());key=next(k for k,v in reg.items() if isinstance(v,list));reg[key]=[e for e in reg[key] if e.get('topic')!='2.5']+manifest;regpath.write_text(json.dumps(reg,indent=1,ensure_ascii=False))
(HERE/'lessons.json').write_text(json.dumps(LESSONS,indent=2,ensure_ascii=False));print('Built',len(LESSONS),'rooms')
