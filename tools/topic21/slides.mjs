import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {FileBlob,PresentationFile} from '@oai/artifact-tool';
import {finalizePresentation} from '/root/.codex/skills/builtins/presentations/container_tools/artifact_tool_utils.mjs';
const root=path.resolve('Revise360'), workspaceDir=path.resolve('.');
const template=root+'/presentations/PL_L01_LanguageLevelLab_Lesson.pptx';
const lessons=JSON.parse(await fs.readFile(root+'/tools/topic21/lessons.json','utf8'));
function ans(t){return t.t==='mcq'?t.a[0]:t.t==='order'?t.steps.join(' → '):t.t==='sort'?t.items.map(x=>x.join(': ')).join('; '):t.pairs.map(x=>x.join(': ')).join('; ')}
await fs.mkdir('build/final-v5',{recursive:true});
for(const l of lessons){
 const p=await PresentationFile.importPptx(await FileBlob.load(template));
 const snap=await p.inspect({kind:'slide,textbox,image,layout',maxChars:2000000});
 await fs.mkdir(`build/slides/${l.id}`,{recursive:true});
 await fs.writeFile(`build/slides/${l.id}/import.ndjson`,snap.ndjson);
 const maps={
 0:{3:l.title.toUpperCase(),6:l.subject,8:l.donow},
 1:{7:l.outcomes[0],9:l.outcomes[1],11:l.outcomes[2]},
 2:{6:l.starter},3:{7:l.starter_answer},4:{7:l.terms[0][0],9:l.terms[1][0]},
 5:{6:l.terms[0][0],7:l.terms[0][1],8:l.terms[1][0],9:l.terms[1][1]},
 6:{7:`Open ${l.title} in Topic 2.1. Keep the worksheet beside you.`},
 7:{7:'Link your explanation to the problem and use a worked example where it helps.'},
 8:{6:l.practical||'Use review mode to correct any mistakes. Write one correction and explain why the right answer fits. Then complete the plenary from memory.'},
 9:{7:l.stations[5].name,8:l.stations[5].answer},
 12:{8:l.final.map((t,i)=>`${i+1}. ${t.q}\nAnswer: ${ans(t)}${t.fb.trim()!==ans(t).trim()?"\n"+t.fb:""}`).join('\n\n')},
 13:{8:l.plenary[0][0],10:l.plenary[1][0]},14:{8:l.plenary[2][0]},
 15:{7:'a  '+l.plenary[0][1],8:'b  '+l.plenary[1][1]},
 16:{7:'',8:l.plenary[2][1],9:'',10:''},
 17:{8:l.outcomes[0],10:l.outcomes[1],12:l.outcomes[2]}
 };
 for(let half=0;half<2;half++){
  maps[10+half]={};for(let j=0;j<3;j++){const s=l.stations[half*3+j];maps[10+half][7+2*j]=`${half*3+j+1}  ${s.name}`;maps[10+half][8+2*j]=s.answer;}
 }
 for(let i=0;i<p.slides.items.length;i++){
  const slide=p.slides.items[i];
  for(const sh of slide.shapes.items){
   const old=sh.text.toString();let next=maps[i]?.[sh.id];
   if(sh.id==='2')next=old.replace('TOPIC 2.5','TOPIC 2.1').replace('LESSON 01',`LESSON ${String(l.n).padStart(2,'0')}`);
   if(next!==undefined){ if(old)sh.text.replace(old,next);else sh.text=next; }
  }
  slide.speakerNotes.textFrame.setText(`Topic 2.1 lesson ${l.n}: ${l.subject}.\nSource sequence: supplied 2.1 - Algorithms(3).pdf, lessons 1–16. Original Revise360 explanations and practice questions.\nCurriculum: OCR J277 specification v3.1, sections 2.1.1–2.1.3, https://www.ocr.org.uk/Images/558027-specification-gcse-computer-science-j277.pdf\n${i===6?'Allow approximately 25–30 minutes for the experience and worksheet. Pupils record facts in their own words.':i===13?'Close the experience before attempting the questions.':''}`);
 }
 const room=p.slides.items[0].images.items.find(x=>x.frame.width>400);
 if(room){const frame=room.frame; await room.replace({blob:await fs.readFile(root+`/experiences/img/${l.stem}_card.jpg`),contentType:'image/jpeg',fit:'contain',alt:l.title+' panoramic room overview'});room.frame=frame;room.fit="contain";room.crop={left:0,top:0,right:0,bottom:0};}
 const candidatePath=path.resolve(`build/slides/${l.id}/candidate.pptx`);
 await (await PresentationFile.exportPptx(p)).save(candidatePath);
 await finalizePresentation({workspaceDir,candidatePath,finalPath:path.resolve(`build/final-v5/${l.id}.pptx`),pythonExecutable:process.env.CODEX_PRIMARY_RUNTIME_PYTHON,integrityValidatorPath:'/root/.codex/skills/builtins/presentations/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:'/root/.codex/skills/builtins/presentations/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],explicitTotalSlideCount:18,fontPolicy:{basis:'reference',families:['DejaVu Sans'],referencePath:template,referenceSha256:createHash('sha256').update(await fs.readFile(template)).digest('hex')},verifyArtifactToolImport:true,receiptPath:path.resolve(`build/slides/${l.id}/validation-v5.json`)});
 await fs.copyFile(path.resolve(`build/final-v5/${l.id}.pptx`),root+`/presentations/${l.stem}_Lesson.pptx`);
 console.log('Exported',l.id);
}
