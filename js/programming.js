// Original Revise360 Topic 2.5 activities. Bounded teaching models: no eval or external code execution.
(function () {
  'use strict';
  const W = 1000, H = 720;
  const C = { bg:'#0e1628', panel:'#17243b', line:'#405778', fg:'#f3f6fc', soft:'#bdcbe0', blue:'#40c4ff', gold:'#ffd046', green:'#50dc96', red:'#ff8b8b' };
  function create(title, hint, init, paint, act, stateText, grade, ready) {
    const canvas=document.createElement('canvas'); canvas.width=W; canvas.height=H;
    canvas.setAttribute('role','img');
    const x=canvas.getContext('2d'); let state=init(), locked=false, hits=[], host=null, status=null, focusId=null;
    const text=(s,px,py,size=24,color=C.fg)=>{x.fillStyle=color;x.font=`${size>=28?'700 ':''}${size}px Segoe UI, sans-serif`;x.textAlign='left';x.textBaseline='top';x.fillText(s,px,py);};
    function wrap(s,px,py,width,size=23,color=C.soft){
      x.font=`${size}px Segoe UI, sans-serif`;let line='',yy=py;
      String(s).split(/\s+/).forEach(word=>{const n=line?line+' '+word:word;if(x.measureText(n).width>width&&line){text(line,px,yy,size,color);yy+=size*1.35;line=word;}else line=n;});
      if(line)text(line,px,yy,size,color);return yy+size*1.35;
    }
    function panel(px,py,w,h){x.fillStyle=C.panel;x.fillRect(px,py,w,h);x.strokeStyle=C.line;x.lineWidth=2;x.strokeRect(px,py,w,h);}
    function button(id,label,px,py,w,h=54,on=false,disabled=false){
      x.fillStyle=disabled?'#263143':on?'#225470':C.panel;x.fillRect(px,py,w,h);x.strokeStyle=on?C.gold:C.line;x.lineWidth=on?3:2;x.strokeRect(px,py,w,h);
      const size=Math.min(23, Math.floor((w-20)/Math.max(1,label.length)*1.8));
      text(label,px+12,py+(h-size)/2,size,disabled?'#8290a5':C.fg);hits.push({id,label,px,py,w,h,disabled:disabled||locked,on});
    }
    function dispatch(id){if(locked)return;const hit=hits.find(h=>h.id===id);if(!hit||hit.disabled)return;act(state,id);draw();}
    function sync(){
      canvas.setAttribute('aria-label',title+'. '+stateText(state));
      if(!host)return;
      const active=document.activeElement;const keep=host.contains(active)&&active.dataset.action;
      host.replaceChildren();
      hits.forEach(h=>{const b=document.createElement('button');b.type='button';b.className='btn small ghost';b.textContent=h.label;b.dataset.action=h.id;b.disabled=h.disabled;b.setAttribute('aria-pressed',String(h.on));b.onclick=()=>dispatch(h.id);host.appendChild(b);});
      status.textContent=stateText(state);
      if(keep){const b=[...host.children].find(b=>b.dataset.action===keep);if(b&&!b.disabled)b.focus();}
    }
    function draw(){
      hits=[];x.fillStyle=C.bg;x.fillRect(0,0,W,H);text(title,32,24,31,C.gold);wrap(hint,32,69,936,22);
      paint(state,{text,wrap,panel,button,x});
      if(locked){text('Answer submitted. Use review mode for another attempt.',32,H-34,20,C.soft);}
      api.dirty=true;sync();
    }
    const api={canvas,dirty:true,down(px,py){const h=hits.find(h=>px>=h.px&&px<=h.px+h.w&&py>=h.py&&py<=h.py+h.h);if(h)dispatch(h.id);},move(){},up(){},leave(){},
      clear(){if(locked)return;state=init();draw();},filled(){return ready(state);},
      check(){if(!ready(state))return {incomplete:true,msg:'Complete the investigation shown on the board before submitting.'};locked=true;const r=grade(state);draw();return {ok:r.ok,got:r.ok?1:0,max:1,msg:r.msg};},
      lock(){locked=true;draw();},snapshot(){return JSON.parse(JSON.stringify(state));},
      mountControls(parent){
        const details=document.createElement('details');details.className='programming-access';const summary=document.createElement('summary');summary.textContent='Keyboard and screen-reader controls';details.appendChild(summary);
        const help=document.createElement('p');help.textContent='Use these buttons for the same actions as the board. After completing the activity, use Check my answer below.';details.appendChild(help);
        status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');details.appendChild(status);
        host=document.createElement('div');host.className='mrow';details.appendChild(host);parent.appendChild(details);sync();
      }
    };draw();return api;
  }
  function Language(task){
    const hardware=task.brief==='device';
    const brief=hardware?'A specialist must control a particular processor register in a tiny timing-sensitive routine. Portability is not needed.':'A museum needs a booking tool. Different teams will maintain it, and its source must be usable on several systems with compatible tools.';
    const reasons=hardware?['Precise access to processor operations','Guaranteed to contain no bugs','One binary works on every CPU']:['Readable source and easier portability','No translator is ever needed','Guaranteed fastest on all machines'];
    return create('Language choice desk','Read the brief. Choose a level and a reason that directly meets the need.',()=>({choice:null,reason:null}),
      (s,{wrap,panel,text,button})=>{panel(32,124,936,134);wrap(brief,50,144,895,25);text('1  Choose the language level',32,285,25,C.blue);
        ['High-level','Assembly / low-level','Machine-code binary'].forEach((v,i)=>button('level'+i,v,32+i*316,326,300,66,s.choice===i));
        text('2  Choose the strongest reason',32,420,25,C.blue);reasons.forEach((v,i)=>button('reason'+i,v,32,463+i*64,936,54,s.reason===i));},
      (s,id)=>{if(id.startsWith('level'))s.choice=+id.slice(5);else s.reason=+id.slice(6);},
      s=>brief+' Level: '+(s.choice===null?'not chosen':['High-level','Assembly / low-level','Machine-code binary'][s.choice])+'. Reason: '+(s.reason===null?'not chosen':reasons[s.reason]),
      s=>({ok:s.choice===(hardware?1:0)&&s.reason===0,msg:hardware?'A low-level assembly routine offers precise processor control. It still needs specialist knowledge and testing.':'High-level source supports readable maintenance and easier portability, provided compatible implementations and dependencies exist.'}),
      s=>s.choice!==null&&s.reason!==null);
  }
  const OPS=['SET 3','SET 4','ADD 3','ADD 4','EMIT','HALT'];
  function codeFor(op){const [name,n]=op.split(' ');const code={SET:1,ADD:2,EMIT:4,HALT:0}[name];return code.toString(2).padStart(4,'0')+' '+Number(n||0).toString(2).padStart(4,'0');}
  function machineStep(s){
    if(s.halted)return;
    if(s.pc>=s.program.length){s.halted=true;s.trace.push('No HALT reached.');return;}
    const op=s.program[s.pc];const [name,value]=op.split(' '),n=Number(value||0);const at=s.pc;
    if(name==='SET')s.acc=n;else if(name==='ADD')s.acc=(s.acc+n)&255;else if(name==='EMIT')s.output.push(s.acc);else if(name==='HALT')s.halted=true;
    s.pc++;s.trace.push(`${at+1}: ${op} -> ACC ${s.acc}${name==='EMIT'?', output '+s.acc:''}`);
  }
  function Machine(task){
    const init=()=>({program:task.mode==='repair'?['SET 3','EMIT','ADD 4','HALT']:['SET 3','SET 4','EMIT','HALT'],pc:0,acc:0,output:[],trace:[],halted:false});
    return create('Instruction workshop','Goal: add 3 and 4, display only 7, then halt. Select a slot to change its instruction.',init,
      (s,{text,wrap,panel,button})=>{text('PROGRAM / invented 8-bit encoding',32,128,23,C.blue);
        s.program.forEach((op,i)=>{button('slot'+i,`${i+1}   ${op}   ${codeFor(op)}`,32,171+i*81,480,65,s.pc===i&&!s.halted);});
        panel(536,128,432,172);text('ACCUMULATOR',556,145,21,C.soft);text(String(s.acc),556,177,42,C.gold);text('Output: '+(s.output.join(', ')||'none'),556,239,26,C.green);
        panel(536,318,432,220);text('TRACE',556,335,21,C.blue);s.trace.slice(-5).forEach((v,i)=>text(v,556,376+i*30,21));
        button('step',s.halted?'Halted':'Step instruction',32,528,245,62,false,s.halted);button('reset','Reset execution',294,528,218,62);
        wrap('SET replaces ACC. ADD adds its operand. EMIT displays ACC. HALT stops. Editing resets the trace. This is enrichment, not a real CPU.',32,614,924,21);},
      (s,id)=>{if(id.startsWith('slot')){let i=+id.slice(4);s.program[i]=OPS[(OPS.indexOf(s.program[i])+1)%OPS.length];s.pc=0;s.acc=0;s.output=[];s.trace=[];s.halted=false;}else if(id==='step')machineStep(s);else{s.pc=0;s.acc=0;s.output=[];s.trace=[];s.halted=false;}},
      s=>'Program: '+s.program.join('; ')+'. Next instruction: '+(s.halted?'halted':s.pc+1)+'. Accumulator '+s.acc+'. Output '+(s.output.join(', ')||'none')+'. '+s.trace.join('. '),
      s=>({ok:s.output.length===1&&s.output[0]===7&&s.program[2]==='EMIT'&&s.program[3]==='HALT'&&((s.program[0]==='SET 3'&&s.program[1]==='ADD 4')||(s.program[0]==='SET 4'&&s.program[1]==='ADD 3')),msg:'One correct solution is SET 3, ADD 4, EMIT, HALT. The accumulator becomes 3, then 7; only EMIT produces output. Mnemonics and binary encode the same small operations.'}),
      s=>s.halted&&s.trace.length>0);
  }
  function Translator(){
    const init=()=>({mode:'compiler',fixed:false,built:false,pc:0,value:0,output:[],seen:{compileError:false,interpretError:false,compileRun:false,interpretRun:false},message:'Investigate the faulty source in BOTH modes before repairing it.'});
    const reset=s=>{s.built=false;s.pc=0;s.value=0;s.output=[];};
    return create('Translation exchange','Compare the same source in both modes. Observe the error, repair it, then run both again.',init,
      (s,{text,wrap,panel,button})=>{button('compiler','Compiler mode',32,124,260,54,s.mode==='compiler');button('interpreter','Interpreter mode',305,124,260,54,s.mode==='interpreter');
        panel(32,198,475,248);text('ILLUSTRATIVE SOURCE',50,215,21,C.blue);
        const lines=['value = 6','SHOW value',s.fixed?'value = value + 2':'SETT value = value + 2','SHOW value'];lines.forEach((v,i)=>text(`${i+1}  ${v}`,50,257+i*42,24,i===2&&!s.fixed?C.red:C.fg));
        panel(529,198,439,248);text('OUTPUT',550,215,21,C.green);text(s.output.join(', ')||'none',550,253,37,C.fg);wrap(s.message,550,313,394,21);
        button('build','Build whole program',32,465,292,60,false,s.mode!=='compiler');button('run',s.mode==='compiler'?'Run built program':'Step interpretation',340,465,300,60);
        button('fix',s.fixed?'Source repaired':'Repair line 3',657,465,311,60,false,s.fixed);button('restart','Reset this run',32,548,230,54);
        const count=Object.values(s.seen).filter(Boolean).length;text('Evidence collected: '+count+' / 4',291,563,25,C.gold);
        wrap('Model only: compilation checks all four statements before a run. Interpretation processes one at a time. Real tools can combine techniques or check syntax earlier.',32,625,926,21);},
      (s,id)=>{
        if(id==='compiler'||id==='interpreter'){s.mode=id;reset(s);s.message='Mode changed. The source is '+(s.fixed?'repaired.':'still faulty.');}
        else if(id==='restart'){reset(s);s.message='Execution reset; investigation evidence kept.';}
        else if(id==='fix'){if(!s.seen.compileError||!s.seen.interpretError){s.message='First observe the fault in BOTH modes.';return;}s.fixed=true;reset(s);s.message='Line 3 repaired. Run the corrected source in both modes.';}
        else if(id==='build'){
          s.output=[];if(!s.fixed){s.seen.compileError=true;s.built=false;s.message='Build failed at line 3. No new runnable build; no output.';}else{s.built=true;s.message='Build succeeded. Target code is ready to run.';}
        }else if(id==='run'&&s.mode==='compiler'){
          if(!s.built){s.message='Build successfully before running the compiled result.';return;}s.output=[6,8];s.seen.compileRun=true;s.message='Compiled result ran: 6, then 8. It can run again without rebuilding.';
        }else if(id==='run'){
          if(s.pc>=4){s.message='Run complete. Reset this run to repeat.';return;}
          if(s.pc===2&&!s.fixed){s.seen.interpretError=true;s.message='Stopped at line 3. The earlier output 6 is already visible.';return;}
          if(s.pc===0)s.value=6;if(s.pc===1||s.pc===3)s.output.push(s.value);if(s.pc===2)s.value+=2;s.pc++;
          s.message='Executed statement '+s.pc+'.';if(s.pc===4){s.seen.interpretRun=true;s.message='Interpretation complete: 6, then 8. Source was processed during this run.';}
        }
      },
      s=>s.mode+' mode. '+s.message+' Output: '+(s.output.join(', ')||'none')+'. Evidence '+Object.values(s.seen).filter(Boolean).length+' of 4.',
      s=>({ok:true,msg:'You observed both error paths and both repaired runs. This model produced no output after a failed build, but interpretation displayed 6 before reaching the fault. Neither approach guarantees correct logic.'}),
      s=>Object.values(s.seen).every(Boolean));
  }
  function IDE(){
    const init=()=>({operator:'+',breakpoint:false,paused:false,watched:false,inspected:false,stepped:false,total:null,pc:0,output:null,passed:false,message:'Run the faulty calculation, then use the breakpoint and watch to investigate.'});
    return create('Developer control room','An order of 3 tickets at £4 should total £12. Diagnose the calculation and verify your repair.',init,
      (s,{text,wrap,panel,button})=>{panel(32,124,518,240);text('SOURCE EDITOR',50,141,22,C.blue);text('1  price = 4',50,182,25);text('2  quantity = 3',50,224,25);
        text('3  total = price '+s.operator+' quantity',50,266,25,s.paused?C.gold:C.fg);text('4  print(total)',50,308,25);
        panel(576,124,392,240);text('VARIABLE WATCH',596,142,22,C.green);text(s.watched?'price = 4; quantity = 3':'Use Watch while paused',596,188,21);text('total = '+(s.total===null?'not set':s.total),596,232,23);text('Output: '+(s.output===null?'none':s.output),596,288,27,C.gold);
        button('edit','Edit operator: '+s.operator,32,391,244,57,s.operator==='*');button('break',s.breakpoint?'Breakpoint: ON':'Breakpoint: OFF',293,391,257,57,s.breakpoint);button('diagnose','Syntax diagnostics',576,391,392,57);
        button('run','Run',32,468,160,57);button('watch','Watch values',208,468,212,57,false,!s.paused);button('step','Step calculation',436,468,244,57,false,!s.paused);button('tests','Run both tests',696,468,272,57);
        wrap(s.message,32,556,928,24,C.fg);wrap('Evidence: '+(s.inspected?'values inspected':'inspect before calculation')+' | '+(s.stepped?'calculation stepped':'step calculation')+' | '+(s.passed?'both tests passed':'tests pending'),32,639,928,21,C.blue);},
      (s,id)=>{
        if(id==='edit'){s.operator=s.operator==='+'?'*':'+';s.output=null;s.total=null;s.paused=false;s.passed=false;s.watched=false;s.message='Source changed. Run the tests against this version.';}
        else if(id==='break'){s.breakpoint=!s.breakpoint;s.message=s.breakpoint?'Breakpoint set before line 3. Press Run to pause there.':'Breakpoint removed.';}
        else if(id==='diagnose')s.message='No syntax error: both + and * are valid operators. Test which one meets the requirement.';
        else if(id==='run'){s.output=null;s.total=null;s.watched=false;if(s.breakpoint){s.paused=true;s.message='Paused BEFORE line 3. Inspect the inputs, then step the calculation.';}else{s.paused=false;s.total=s.operator==='*'?12:7;s.output=s.total;s.message='Program completed. Output '+s.output+'; expected 12.';}}
        else if(id==='watch'&&s.paused){s.watched=true;s.inspected=true;s.message='Watch: price is 4 and quantity is 3. The inputs are correct; inspect the calculation.';}
        else if(id==='step'&&s.paused){s.stepped=true;s.total=s.operator==='*'?12:7;s.output=s.total;s.paused=false;s.message='Line 3 produced '+s.total+'; output is '+s.output+'. Expected 12. '+(s.operator==='+'?'Change addition to multiplication.':'The calculation now fits this order.');}
        else if(id==='tests'){s.passed=s.operator==='*';s.message=s.passed?'PASS: 4 × 3 = 12. PASS: 5 × 2 = 10. Both tests used the edited source.':'FAIL: 4 + 3 gives 7 (expected 12). FAIL: 5 + 2 gives 7 (expected 10).';}
      },
      s=>'Operator '+s.operator+'. '+s.message+' Breakpoint '+(s.breakpoint?'on':'off')+'. Inputs inspected '+s.inspected+'. Calculation stepped '+s.stepped+'. Both tests passed '+s.passed+'.',
      s=>({ok:s.operator==='*'&&s.passed,msg:'The editor changed the calculation; the breakpoint, watch and step controls exposed its values; test runs checked 12 and 10. Valid syntax alone did not reveal the original logic error.'}),
      s=>s.inspected&&s.stepped&&s.passed);
  }
  const TYPES=['language','machine','translator','ide'];
  const make=task=>({language:Language,machine:Machine,translator:Translator,ide:IDE}[task.t])(task);
  window.R360Programming={TYPES,make,codeFor,machineStep};
})();
