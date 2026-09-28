import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {FileBlob,PresentationFile} from '@oai/artifact-tool';
import {finalizePresentation} from '/root/.codex/skills/builtins/presentations/container_tools/artifact_tool_utils.mjs';
const root=path.resolve('Revise360'),template=root+'/presentations/PL_L01_LanguageLevelLab_Lesson.pptx';
const p=await PresentationFile.importPptx(await FileBlob.load(template));
await p.inspect({kind:'slide,textbox,image,layout',maxChars:200000});
const M=[
{3:'ALGORITHMS ASSESSMENT',6:'Topic 2.1 review and reflection',7:'PREPARE TO WORK INDEPENDENTLY',8:'Close the experience and notes. Have the assessment worksheet ready.'},
{3:'What this assessment checks',6:'1.',7:'Explain computational thinking and structure diagrams.',8:'2.',9:'Trace searching and sorting algorithms.',10:'3.',11:'Create, correct and trace algorithms.'},
{3:'Assessment: 40 marks',6:'You have 45 minutes. Answer every question on the worksheet. Show the steps for searches and sorts. Read the marks and check your answers.\n\nKeep this slide displayed until the assessment is finished.'},
{3:'Feedback after the assessment',6:'1.',7:'Check your answers against the following slides. Award marks for the required points. Record your total out of 40 and choose one target for improvement.'},
{3:'Question 1: computational thinking',6:'a)',7:'What does abstraction mean?',8:'b–c)',9:'Which loan details matter, and how does decomposition help?'},
{3:'Question 1: answers [6]',6:'Abstraction and relevant details [4]',7:'Keep relevant details and remove unnecessary detail for a purpose. Retain borrower ID or due date. Ignore a favourite film.',8:'Decomposition [2]',9:'Split the system into smaller sub-problems. This makes each part easier to understand, develop or test.'},
{3:'Question 2: structure diagram [4]',6:'01   WHOLE SYSTEM',7:'Place Equipment-loan system at the top.',8:'02   MAIN PARTS',9:'Connect Members, Loans and Returns beneath it.',10:'03   REFINE LOANS',11:'Under Loans, add Check availability and Record loan.',12:'04   CHECK THE CONNECTIONS',13:'Children are parts of their parent. A structure diagram does not show execution order.'},
{3:'Question 3: searching',6:'List: [2, 4, 6, 8, 10, 12, 14]\nTarget: 12\n\nCompare the values checked by linear and binary search.',7:'Use zero-based indices and round binary-search midpoints down.'},
{3:'Question 3: answers [6]',6:'Linear search checks 2, 4, 6, 8, 10, 12. Six target comparisons. [2]\n\nBinary search first checks 8 at index 3. Keep indices 4–6. Then check 12 at index 5 and stop. [3]\n\nBinary search requires sorted data. [1]'},
{3:'Question 4a: bubble sort [4]',6:'First full left-to-right pass on [6, 2, 5, 1].',7:'Record each swap [3]',8:'[2, 6, 5, 1]\n[2, 5, 6, 1]\n[2, 5, 1, 6]',9:'Final position [1]',10:'6 is in its final position at the right-hand end. The other values are not yet fully sorted.'},
{3:'Questions 4b–c: merge and insertion',6:'Do not mix up the methods.',7:'Merge [2, 8] and [3, 7] [2]',8:'Compare 2 with 3 and take 2. Then compare 8 with 3 and take 3.',9:'Complete the merge [1]',10:'The final list is [2, 3, 7, 8].',11:'Insertion sort [5, 2, 4, 1] [3]',12:'After each key: [2,5,4,1], then [2,4,5,1], then [1,2,4,5].'},
{3:'Question 5: flowchart [5]',6:'Check symbols, conditions, labels and connected paths.',7:'Input and decision [2]',8:'Input age in a parallelogram. Test age >= 12 in a diamond.',9:'Branches and outputs [2]',10:'Label True and False. Output Allowed on True and Too young on False, using input/output symbols.',11:'Complete paths [1]',12:'Use start and end terminals, connected by sensible flow lines.'},
{3:'Question 6: debugging [3]',6:'The intended result is the average of a and b.',8:'This is a logic error. [1]\n\nCorrect expression: average = (a + b) / 2. [1]\n\nParentheses ensure the values are added before division by 2. [1]'},
{3:'Question 7: trace table',6:'The loop adds i for i = 1 to 4, starting from total = 0.',7:'a)',8:'Record the initial total and the total after every iteration.',9:'b)',10:'Record the value output after the loop.'},
{3:'Question 7: answer [6]',6:'Keep variable changes separate from output events.',7:'',8:'Initial total: 0\nAfter i = 1: total = 1\nAfter i = 2: total = 3\nAfter i = 3: total = 6\nAfter i = 4: total = 10\nOutput after the loop: 10',9:'One mark for each correct entry.'},
{3:'Find your next step',6:'Use your question scores to choose a useful revision lesson.',7:'Questions 1–2: revisit lessons 1–3.\nQuestions 3–4: revisit lessons 7–10.',8:'Question 5: revisit lesson 11.\nQuestion 6: revisit lesson 15.\nQuestion 7: revisit lesson 16.'},
{3:'Make a correction',6:'Complete the reflection section of the worksheet.',7:'1.',8:'Choose one missed question and write a corrected answer.',9:'2.',10:'Explain what caused the error and how you will avoid it next time.'},
{3:'Check your understanding',6:'Use the relevant experience in review mode after the assessment.',7:'1.',8:'Explain the corrected idea in your own words.',9:'2.',10:'Try a new example without looking at the answer.',11:'3.',12:'Record whether you need more practice or feel confident.'}
];
for(let i=0;i<p.slides.items.length;i++){
 const slide=p.slides.items[i];
 for(const sh of slide.shapes.items){
  const old=sh.text.toString();let v=M[i][sh.id]??'';
  if(sh.id==='2')v='TOPIC 2.1   /   LESSON 17   /   ASSESSMENT';
  if(sh.id==='5')v=`${i+1} / 18`;
  if(old)sh.text.replace(old,v);else if(v)sh.text=v;
 }
 slide.speakerNotes.textFrame.setText('Original Revise360 Topic 2.1 assessment. Keep slide 3 displayed during the 45-minute closed-book assessment. Show feedback slides only after scripts are collected or the assessment has finished. Use the separate mark scheme for marking detail. OCR J277 specification 2.1.1–2.1.3.');
}
const room=p.slides.items[0].images.items.find(x=>x.frame.width>400);if(room){await room.replace({blob:await fs.readFile(root+'/experiences/img/AL_L16_TraceTableObservatory_card.jpg'),contentType:'image/jpeg',fit:'contain'});room.fit='contain';room.crop={left:0,top:0,right:0,bottom:0};}
await fs.mkdir('build/slides/al-l17',{recursive:true});const candidatePath=path.resolve('build/slides/al-l17/candidate.pptx');await(await PresentationFile.exportPptx(p)).save(candidatePath);
await finalizePresentation({workspaceDir:path.resolve('.'),candidatePath,finalPath:root+'/presentations/AL_L17_AlgorithmsAssessment_Lesson.pptx',pythonExecutable:process.env.CODEX_PRIMARY_RUNTIME_PYTHON,integrityValidatorPath:'/root/.codex/skills/builtins/presentations/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:'/root/.codex/skills/builtins/presentations/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:18,fontPolicy:{basis:'reference',families:['DejaVu Sans'],referencePath:template,referenceSha256:createHash('sha256').update(await fs.readFile(template)).digest('hex')},verifyArtifactToolImport:true,receiptPath:path.resolve('build/slides/al-l17/validation.json')});
console.log('Assessment deck exported');
