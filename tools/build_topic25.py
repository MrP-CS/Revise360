"""Build original Topic 2.5 scene art, experience JSON and teacher notes.
Run from the repository root: python tools/build_topic25.py
Requires Pillow and numpy. All drawings originate from these primitives and authoring data.
"""
from pathlib import Path
import json, math, textwrap
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from topic25_content import LESSONS
ROOT=Path(__file__).resolve().parents[1];SIZE=2048
C=['#40c4ff','#aa6eeb','#ff785a','#ffa028','#50dc96','#f05aaa']
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';MONO='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
def font(size,bold=False,mono=False):return ImageFont.truetype(MONO if mono else BOLD if bold else FONT,size)
def wrapped(d,text,x,y,w,size=40,fill='#ecf3ff',bold=False,spacing=1.4):
 f=font(size,bold);yy=y
 for block in text.split('\n'):
  line=''
  for word in block.split():
   test=(line+' '+word).strip()
   if d.textlength(test,font=f)>w and line:
    d.text((x,yy),line,font=f,fill=fill);line=word;yy+=int(size*spacing)
   else:line=test
  d.text((x,yy),line,font=f,fill=fill);yy+=int(size*spacing)
 return yy

def wall():
 im=Image.new('RGB',(SIZE,SIZE),'#152036');d=ImageDraw.Draw(im)
 for p in range(0,SIZE,128):d.line((p,0,p,SIZE),fill='#19263c',width=2);d.line((0,p,SIZE,p),fill='#19263c',width=2)
 d.rectangle((0,0,SIZE,280),fill='#1e2c42');d.rectangle((0,1830,SIZE,SIZE),fill='#0d1628');d.line((0,285,SIZE,285),fill='#718cb9',width=7);d.line((0,1800,SIZE,1800),fill='#718cb9',width=7)
 d.rectangle((500,65,1548,115),fill='#dbe8ff');return im

def diagram(d,lesson,k,x,y,w,col):
 # Small original schematic labels; no copied diagrams or visual assets.
 samples={
  1:[['source','translator','CPU'],['total = 4 * 3','clear source'],['mnemonic','CPU operation'],['same source','compatible tools'],['project need','language choice'],['valid syntax','test behaviour']],
  2:[['high-level','small operations'],['ACC: 3','ADD 4','ACC: 7'],['SET 3','ADD 4','EMIT'],['0010','0100','ADD 4'],['predict','step','compare'],['hardware','precise control']],
  3:[['source','translation','execution'],['source','build','run'],['read','execute','next'],['fault','observe','repair'],['edit + test','build + release'],['translation','tests still needed']],
  4:[['edit','run','inspect'],['price + quantity','price * quantity'],['syntax valid','logic wrong?'],['input','program','output'],['pause','watch','step'],['expected','actual','compare']]}
 vals=samples[lesson][k];gap=22;bw=(w-gap*(len(vals)-1))/len(vals)
 for n,v in enumerate(vals):
  xx=x+n*(bw+gap);d.rectangle((xx,y,xx+bw,y+150),fill='#0b1325',outline=col,width=4)
  wrapped(d,v,xx+16,y+35,bw-32,30,col,True,1.25)
  if n<len(vals)-1:d.line((xx+bw+3,y+75,xx+bw+gap-3,y+75),fill=col,width=5)

def panel(im,lesson,k,x):
 s=lesson['stations'][k];d=ImageDraw.Draw(im);w=860;col=C[k]
 d.rectangle((x,355,x+w,1770),fill='#1d2e48',outline=col,width=6)
 d.rectangle((x,355,x+w,505),fill=col)
 wrapped(d,str(k+1)+'  '+s['name'],x+30,377,w-60,43,'#101828',True,1.18)
 diagram(d,lesson['lesson'],k,x+32,545,w-64,col)
 yy=760
 for fact in s['facts']:
  d.ellipse((x+28,yy+17,x+42,yy+31),fill=col);yy=wrapped(d,fact,x+60,yy,w-93,36,spacing=1.38)+30
 assert yy<1450,(lesson['id'],k,yy)
 d.rectangle((x+24,1465,x+w-24,1670),fill='#0e182b',outline='#ffd046',width=3)
 d.text((x+44,1480),'THINK AND EXPLAIN',font=font(29,True),fill='#ffd046')
 wrapped(d,s['challenge'],x+44,1528,w-88,30,spacing=1.28)
 d.text((x+52,1710),'Select the numbered station to practise',font=font(27),fill='#bfcee5')

def faces_for(lesson):
 faces={a:wall() for a in ['front','right','back','left','up','down']}
 for k in range(6):panel(faces[['right','back','left'][k//2]],lesson,k,100 if k%2==0 else 1088)
 d=ImageDraw.Draw(faces['front']);d.text((140,385),'TOPIC 2.5  /  LESSON '+str(lesson['lesson']),font=font(52,True),fill='#ffd046')
 yy=wrapped(d,lesson['title'],140,505,1770,112,'#f4f7ff',True,1.15)
 yy=wrapped(d,lesson['subtitle'],140,yy+35,1770,55,'#9fbdff',False,1.35)
 yy=wrapped(d,lesson['description'],140,yy+70,1760,46,spacing=1.5)
 d.rectangle((140,yy+45,1908,yy+330),fill='#1f304d',outline='#ffd046',width=4)
 wrapped(d,'Write the key facts in your own words. Explain your thinking on the worksheet. Complete the stations, then use the star for the plenary knowledge check.',180,yy+80,1680,42)
 for j,(head,sub,col) in enumerate([('Turn right','Stations 1 and 2',C[0]),('Turn around','Stations 3 and 4',C[2]),('Turn left','Stations 5 and 6',C[4]),('Look down','Plenary check','#ffd046')]):
  x=140+j*446;d.rectangle((x,1450,x+416,1625),fill='#0c1527',outline=col,width=4);d.text((x+22,1475),head,font=font(39,True),fill=col);d.text((x+22,1546),sub,font=font(31),fill='#ecf3ff')
 d.text((140,1690),'REVISE360  /  Explore. Explain. Apply.',font=font(39,True),fill='#a8bbda')
 d=ImageDraw.Draw(faces['down']);d.rectangle((200,340,1848,1390),fill='#0f192d',outline='#ffd046',width=8)
 wrapped(d,'PLENARY\nKNOWLEDGE CHECK',350,450,1380,93,'#ffd046',True,1.35)
 wrapped(d,'Bring together the ideas from all six stations. Apply what you know to the final questions.',350,840,1350,55)
 d=ImageDraw.Draw(faces['up']);d.text((420,750),'REVISE360',font=font(130,True),fill='#344b71')
 return faces

def panorama(faces,width):
 height=width//2;out=np.empty((height,width,3),dtype=np.uint8);arrays={k:np.asarray(v) for k,v in faces.items()}
 lon=(np.arange(width)+.5)/width*2*np.pi-np.pi
 for start in range(0,height,128):
  end=min(height,start+128);lat=np.pi/2-(np.arange(start,end)+.5)/height*np.pi
  R=np.cos(lat)[:,None]*np.sin(lon)[None,:];F=np.cos(lat)[:,None]*np.cos(lon)[None,:];U=np.broadcast_to(np.sin(lat)[:,None],R.shape)
  absR=np.abs(R);absF=np.abs(F);absU=np.abs(U);result=np.empty((*R.shape,3),np.uint8)
  masks={'front':(absF>=absR)&(absF>=absU)&(F>=0),'back':(absF>=absR)&(absF>=absU)&(F<0),'right':(absR>absF)&(absR>=absU)&(R>=0),'left':(absR>absF)&(absR>=absU)&(R<0),'up':(absU>absF)&(absU>absR)&(U>=0),'down':(absU>absF)&(absU>absR)&(U<0)}
  for face,mask in masks.items():
   r=R[mask];f=F[mask];u=U[mask]
   if face=='front':a=(1+r/abs(f))/2;b=(1-u/abs(f))/2
   elif face=='back':a=(1-r/abs(f))/2;b=(1-u/abs(f))/2
   elif face=='right':a=(1-f/abs(r))/2;b=(1-u/abs(r))/2
   elif face=='left':a=(1+f/abs(r))/2;b=(1-u/abs(r))/2
   elif face=='up':a=(1+r/abs(u))/2;b=(1+f/abs(u))/2
   else:a=(1+r/abs(u))/2;b=(1-f/abs(u))/2
   xx=np.clip((a*(SIZE-1)).astype(int),0,SIZE-1);yy=np.clip((b*(SIZE-1)).astype(int),0,SIZE-1);result[mask]=arrays[face][yy,xx]
  out[start:end]=result
 return Image.fromarray(out)

def build():
 reg=json.loads((ROOT/'experiences/registry.json').read_text());reg['experiences']=[e for e in reg['experiences'] if not e['id'].startswith('pl-')]
 notes=['# Topic 2.5 trial guide','\nFour original lessons for OCR J277, with a paper assessment. Each follows the six-station format and an on-screen plenary.','\n## Content and originality','The uploaded resources were used to identify topic coverage, not as source text or artwork. All explanations, questions, scenarios, diagrams, simulated programs and panorama artwork in this addition are newly authored. No uploaded third-party PDF, screenshot, logo or extracted asset is included. Existing site dependencies and fonts keep their own licences. This is an authorship record, not a legal guarantee of exclusive copyright.','\n## Scope','OCR J277 2.5 covers language levels, translators, compiler/interpreter comparisons and IDE facilities. The invented low-level instruction set and assembler concept are enrichment, not required exam recall. Specification checked 25 September 2026: https://www.ocr.org.uk/images/558027-specification-gcse-computer-science-j277.pdf .','\n## Trial instructions','Sign in using the existing local student or teacher trial flow. Open topics.html?topic=2.5. Record key facts in your own words, complete the numbered stations, then the star. First answers count; review mode revisits mistakes without overwriting the original score. Worksheets include written exam-style plenaries. The current site uses local progress unless a hosted backend is configured.','Use Keyboard and screen-reader controls under the new boards for equivalent labelled buttons and live state. In VR, the same boards accept trigger clicks. Physical headset testing is still recommended.','\n## Suggested lesson pacing','Starter 5 minutes; terminology and feedback 5; experience and worksheet 30; plenary knowledge checks and written application 10. Adjust for the class. The IDE simulation supplements hands-on use of your normal programming IDE; it is not a full programming environment.']
 for l in LESSONS:
  stem=f'PL_L{l["lesson"]:02d}_{l["slug"]}';faces=faces_for(l)
  panorama(faces,4096).save(ROOT/f'experiences/img/{stem}_360.jpg',quality=91,optimize=True)
  panorama(faces,6144).save(ROOT/f'experiences/img/{stem}_360_hi.jpg',quality=93,optimize=True)
  # Flat face preview has no curved equirectangular text.
  faces['front'].crop((80,300,1968,1780)).resize((1000,784)).save(ROOT/f'experiences/img/{stem}_card.jpg',quality=91)
  stations=[];infos=[]
  for k,s in enumerate(l['stations']):
   face=['right','back','left'][k//2];xx=540 if k%2==0 else 1508
   stations.append(dict(label=str(k+1),name=s['name'],col=C[k],face=face,x=xx,y=1730,tasks=s['tasks']))
   infos.append(dict(id=f'f{k+1}',face=face,x=920 if k%2==0 else 1888,y=600,title=s['name'],text=' '.join(s['facts'])+' Think: '+s['challenge']))
  stations.append(dict(label='★',name='Plenary knowledge check',col='#ffd046',face='down',x=1024,y=745,tasks=l['plenary']))
  experience=dict(id=l['id'],lesson=l['lesson'],title=l['title'],scenes=[dict(id='main',title=l['title'],img=f'img/{stem}_360.jpg',imgHi=f'img/{stem}_360_hi.jpg',stations=stations,info=infos,models=[])])
  (ROOT/f'experiences/{l["id"]}.json').write_text(json.dumps(experience,ensure_ascii=False,indent=1)+'\n')
  reg['experiences'].append(dict(id=l['id'],topic='2.5',lesson=l['lesson'],title=l['title'],description=l['description'],thumb=f'img/{stem}_card.jpg',worksheet=f'worksheets/{stem}_Worksheet.docx'))
  notes.extend([f'\n## Lesson {l["lesson"]}: {l["title"]}',f'Route: experience.html?id={l["id"]}',f'\nStarter answer: {l["starterAnswer"]}','\nTerminology: '+'; '.join(a+': '+b for a,b in l['terms'])])
  for k,s in enumerate(l['stations']):notes.append(f'\n{k+1}. **{s["name"]}**\n\nChallenge: {s["challenge"]}\n\nSuggested answer: {s["answer"]}')
  notes.append('\n### Written plenary marking guidance')
  for q,marks,answer in l['exam']:notes.append(f'\n{q} [{marks}]\n\n{answer}')
 reg['experiences'].append(dict(id='pl-l05-test',type='worksheet',topic='2.5',lesson=5,title='End-of-topic assessment',description='An original paper assessment covering language choices, translation and IDE tools. Complete it independently, then use teacher feedback to revisit the relevant stations.',worksheet='worksheets/PL_L05_EndOfTopic_Assessment.docx'))
 (ROOT/'experiences/registry.json').write_text(json.dumps(reg,ensure_ascii=False,indent=1)+'\n')
 (ROOT/'docs/topic25-trial-guide.md').write_text('\n\n'.join(notes)+'\n')
 p=ROOT/'index.html';s=p.read_text().replace('<strong>08</strong><span>topics to explore</span>','<strong>09</strong><span>topics to explore</span>')
 if 'topics.html?topic=2.5' not in s:
  needle='<a href="topics.html?topic=2.4"';start=s.index(needle);end=s.index('</a>',start)+4;s=s[:end]+'\n      <a href="topics.html?topic=2.5"><span>2.5</span><strong>Programming languages and IDEs</strong><span aria-hidden="true">↗</span></a>'+s[end:]
 p.write_text(s)
 print('Built four experiences, 360 artwork, registry entries and trial guide.')
if __name__=='__main__':build()
