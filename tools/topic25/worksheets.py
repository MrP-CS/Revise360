"""Build Topic 2.5 worksheets directly from the established Logic Gate Lab template."""
from pathlib import Path
from copy import deepcopy
import json,re
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt
ROOT=Path(__file__).resolve().parents[2]
TEMPLATE=ROOT/'worksheets/BL_L01_LogicGateLab_Worksheet.docx'
LESSONS=json.loads((Path(__file__).parent/'lessons.json').read_text())
# Keep the original template's page size, styles, borders, padding and footer fields.
source=Document(TEMPLATE)
def setp(p,text):
 runs=p.runs
 if runs:
  runs[0].text=text
  for r in runs[1:]:r.text=''
 else:p.add_run(text)
def clonep(src,text):
 e=deepcopy(src._p);p=Paragraph(e,src._parent);setp(p,text);return e
def spacer(d):
 p=d.add_paragraph();p.paragraph_format.space_after=Pt(7);p.paragraph_format.space_before=Pt(0);p.paragraph_format.line_spacing=Pt(2);p.add_run().font.size=Pt(2)
def append(d,table):
 e=deepcopy(table._tbl);d._element.body.insert(-1,e);return Table(e,d._body)
def page(d):d.add_page_break()
def clearcell(c):
 for e in list(c._tc):
  if e.tag!=qn('w:tcPr'):c._tc.remove(e)
def addp(c,src,text):c._tc.append(clonep(src,text))
def lines(c,n=1):
 t=deepcopy(source.tables[6].cell(0,0).tables[0]._tbl)
 row=t.find(qn('w:tr'))
 for _ in range(n-1):t.append(deepcopy(row))
 for h in t.iter(qn('w:trHeight')):h.set(qn('w:hRule'),'atLeast')
 c._tc.append(t)
def endcell(c):
 p=OxmlElement('w:p');pr=OxmlElement('w:pPr');sp=OxmlElement('w:spacing');sp.set(qn('w:after'),'0');sp.set(qn('w:line'),'20');sp.set(qn('w:lineRule'),'exact');pr.append(sp);p.append(pr);c._tc.append(p)
def answergrid(c,headers,rows,widths=None):
 base=source.tables[16].cell(0,0).tables[0]
 e=deepcopy(base._tbl);t=Table(e,c)
 for row in list(t._tbl.findall(qn('w:tr')))[1:]:t._tbl.remove(row)
 # Use source column styles and widths, replacing its grid with the required count.
 grid=t._tbl.find(qn('w:tblGrid'))
 for x in list(grid):grid.remove(x)
 widths=widths or [10026//len(headers)]*len(headers)
 for w in widths:g=OxmlElement('w:gridCol');g.set(qn('w:w'),str(w));grid.append(g)
 hr=t.rows[0]
 while len(hr.cells)>len(headers):hr._tr.remove(hr._tr.findall(qn('w:tc'))[-1])
 while len(hr.cells)<len(headers):hr._tr.append(deepcopy(hr.cells[-1]._tc))
 for i,(cell,text) in enumerate(zip(hr.cells,headers)):
  cell._tc.get_or_add_tcPr().find(qn('w:tcW')).set(qn('w:w'),str(widths[i]));setp(cell.paragraphs[0],text)
  for r in cell.paragraphs[0].runs:r.font.size=Pt(10)
 for values in rows:
  tr=deepcopy(hr._tr)
  for h in tr.iter(qn('w:trHeight')):h.set(qn('w:val'),'330');h.set(qn('w:hRule'),'atLeast')
  t._tbl.append(tr)
  for cell,text in zip(t.rows[-1].cells,values):
   for shd in list(cell._tc.get_or_add_tcPr().findall(qn('w:shd'))):cell._tc.get_or_add_tcPr().remove(shd)
   setp(cell.paragraphs[0],text)
   for r in cell.paragraphs[0].runs:r.bold=False;r.font.size=Pt(10)
 c._tc.append(e)
def task(c,t):
 ps=source.tables[6].cell(0,0).paragraphs
 addp(c,ps[4],t['q'])
 if t['t']=='match':
  addp(c,ps[1],'Match each item to a description from the list below.')
  addp(c,ps[1],' / '.join(y for _,y in reversed(t['pairs'])))
  answergrid(c,['Item','Matching description'],[[x,''] for x,_ in t['pairs']], [4500,5526])
 elif t['t']=='sort':
  addp(c,ps[1],'Categories: '+' / '.join(t['cats']))
  answergrid(c,['Item','Category'],[[x,'']for x,_ in t['items']],[7300,2726])
 elif t['t']=='multi':
  for x in t['opts']:addp(c,ps[1],'□  '+x)
 else:lines(c,1)
for l in LESSONS:
 d=Document(TEMPLATE);body=d._element.body
 for e in list(body):
  if e.tag!=qn('w:sectPr'):body.remove(e)
 title=['Language characteristics','Language choices','Compilers and interpreters','Integrated development environments','Programming languages and IDEs review'][l['n']-1]
 t=append(d,source.tables[0]);c=t.cell(0,0)
 setp(c.paragraphs[0],f'OCR J277 2.5 Programming languages and IDEs  |  Lesson {l["n"]}')
 setp(c.paragraphs[1],title);setp(c.paragraphs[2],'Worksheet for the 360° experience: '+l['title'])
 append(d,source.tables[1]);spacer(d)
 t=append(d,source.tables[2]);c=t.cell(0,0);ps=c.paragraphs
 setp(ps[1],'1.  Discuss or research the Do Now on slide 1. Complete the starter and key terminology below.')
 setp(ps[2],f'2.  Open {l["title"]}. Read each station panel and write the key facts in your own words. Complete its worksheet tasks before tapping the badge.')
 setp(ps[3],'3.  Answer the questions on screen. Your first answer counts. Use review mode to learn from mistakes.')
 setp(ps[4],'4.  Copy your score into the yellow box, then complete the exam practice from memory.')
 for i,x in enumerate(l['outcomes']):
  if i<3:setp(ps[6+i],x)
  else:c._tc.append(clonep(ps[8],x))
 spacer(d)
 t=append(d,source.tables[3]);setp(t.cell(0,0).paragraphs[1],l['starter']);spacer(d)
 t=append(d,source.tables[4]);setp(t.cell(0,0).paragraphs[1],l['terms'][0][0]);setp(t.cell(0,0).paragraphs[2],l['terms'][1][0])
 page(d)
 t=append(d,source.tables[5]);setp(t.cell(0,0).paragraphs[0],l['title']);spacer(d)
 # Keep each complete station together, and let Word paginate between stations.
 for i,s in enumerate(l['stations']):
  t=append(d,source.tables[6+i]);c=t.cell(0,0);ps=list(c.paragraphs);clearcell(c)
  addp(c,ps[0],f'{i+1}   {s["name"]}');addp(c,ps[1],['Turn right','Turn around','Turn left'][i//2])
  addp(c,ps[2],'Key facts in your own words:');lines(c,1)
  e=deepcopy(ps[3]._p); cp=Paragraph(e,c); cp.runs[0].text='Challenge: '; cp.runs[1].text=s['challenge']; c._tc.append(e); lines(c,2)
  for item in s['tasks']:task(c,item)
  endcell(c)
  # Prevent splitting a station panel over a page boundary.
  trpr=t.rows[0]._tr.get_or_add_trPr();trpr.append(OxmlElement('w:cantSplit'))
  spacer(d)
 page(d)
 t=append(d,source.tables[12]);c=t.cell(0,0);ps=list(c.paragraphs);clearcell(c)
 addp(c,ps[0],'★   Final challenge (look down)');addp(c,ps[1],'Before you tap the star, complete these tasks on paper.')
 for item in l['final']:task(c,item)
 endcell(c);spacer(d)
 exp=json.loads((ROOT/'experiences'/f'{l["id"]}.json').read_text())
 def marks(t):return len(t['items']) if t['t']=='sort' else len(t['pairs']) if t['t']=='match' else 1
 total=sum(marks(t)for s in exp['scenes'][0]['stations']for t in s['tasks'])
 t=append(d,source.tables[13]);setp(t.cell(0,1).paragraphs[0],f'______ / {total}');spacer(d)
 t=append(d,source.tables[14]);setp(t.cell(0,0).paragraphs[1],l['donow']);spacer(d)
 # Review sits below the score/key question, using the same established panel style.
 t=append(d,source.tables[14]);setp(t.cell(0,0).paragraphs[0],'Review and improve');setp(t.cell(0,0).paragraphs[1],'Use review mode. Explain one correction and why the correct answer fits.' + (' In your class IDE, run print("Ready"), change the message and run it again. Remove the closing bracket, read the diagnostic, then restore it and rerun. Record the IDE name and identify its editor, diagnostics, translator and run-time environment.' if l['n']==4 else ''))
 page(d)
 t=append(d,source.tables[15]);c=t.cell(0,0);ps=list(c.paragraphs);clearcell(c)
 addp(c,ps[0],'Exam practice');addp(c,ps[1],'Near the end of the lesson, close the experience and answer from memory.')
 for i,(q,a) in enumerate(l['plenary']):
  addp(c,ps[2],chr(97+i)+')  '+q);n=int(re.search(r'\[(\d+)\]',q)[1]);lines(c,n+1)
 endcell(c);spacer(d)
 t=append(d,source.tables[16]);c=t.cell(0,0);ps=list(c.paragraphs);clearcell(c);addp(c,ps[0],'How confident am I?')
 answergrid(c,['Objective','Not yet','Getting there','Confident'],[[x,'','','']for x in l['outcomes']],[4850,1500,1900,1776]);endcell(c)
 setp(d.sections[0].footer.paragraphs[0],f'2.5 Lesson {l["n"]}: {title}  |  Page ')
 # Restore the original live page-number field after replacing the footer label.
 d.sections[0].footer.paragraphs[0]._p.append(deepcopy(source.sections[0].footer.paragraphs[0].runs[-1]._r))
 d.core_properties.author='Revise360';d.core_properties.title=title;d.core_properties.subject='Topic 2.5 lesson worksheet'
 d.save(ROOT/'worksheets'/f'{l["stem"]}_Worksheet.docx');print(l['stem'])
