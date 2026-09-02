// SOUND ENGINE
let audioCtx=null,soundOn=true,bgMusicNode=null,bgGainNode=null,bgCustomNode=null;
const customAudio={bg:null,correct:null,wrong:null,pull:null,win:null,newq:null};

async function tryLoadAudio(key,path){
  try{ const r=await fetch(path,{method:'HEAD'}); if(r.ok){const a=new Audio(path);a.preload='auto';customAudio[key]=a;} }catch(e){}
}
tryLoadAudio('bg','audio/bg.mp3');tryLoadAudio('correct','audio/correct.mp3');
tryLoadAudio('wrong','audio/wrong.mp3');tryLoadAudio('pull','audio/pull.mp3');
tryLoadAudio('win','audio/win.mp3');tryLoadAudio('newq','audio/newq.mp3');

function playCustom(key){
  if(!soundOn) return false;
  const a=customAudio[key]; if(!a) return false;
  const c=a.cloneNode(); c.volume=key==='bg'?0.3:0.9; c.play().catch(()=>{}); return c;
}
function getCtx(){ if(!audioCtx) audioCtx=new(window.AudioContext||window.webkitAudioContext)(); return audioCtx; }
function toggleSound(){
  soundOn=!soundOn;
  document.getElementById('sound-toggle').textContent=soundOn?'🔊':'🔇';
  if(bgCustomNode) bgCustomNode.volume=soundOn?0.3:0;
  if(bgGainNode) bgGainNode.gain.setTargetAtTime(soundOn?0.07:0,getCtx().currentTime,0.3);
}
let isDayMode=false;
function toggleTheme(){
  isDayMode=!isDayMode;
  document.body.classList.toggle('day',isDayMode);
  localStorage.setItem('dzongkha-theme',isDayMode?'day':'night');
}
(function(){ if(localStorage.getItem('dzongkha-theme')==='day'){isDayMode=true;document.body.classList.add('day');} })();

function startBgMusic(){
  if(!soundOn) return;
  if(customAudio['bg']){ if(bgCustomNode) return; const a=customAudio['bg'].cloneNode();a.loop=true;a.volume=0.3;a.play().catch(()=>{});bgCustomNode=a;return; }
  const ctx=getCtx(); if(bgMusicNode) return;
  bgGainNode=ctx.createGain();bgGainNode.gain.value=0.07;bgGainNode.connect(ctx.destination);
  const notes=[261.63,293.66,329.63,392,440,392,329.63,293.66];let step=0;const beat=60/120;
  function playNote(){
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='triangle';osc.frequency.value=notes[step%notes.length]*(step<notes.length?1:2);
    gain.gain.setValueAtTime(0.4,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+beat*0.9);
    osc.connect(gain);gain.connect(bgGainNode);osc.start(ctx.currentTime);osc.stop(ctx.currentTime+beat);
    step++;bgMusicNode=setTimeout(playNote,beat*900);
  }
  playNote();
}
function stopBgMusic(){
  if(bgCustomNode){bgCustomNode.pause();bgCustomNode.currentTime=0;bgCustomNode=null;}
  if(bgMusicNode){clearTimeout(bgMusicNode);bgMusicNode=null;}
}
function playCorrect(){
  if(!soundOn) return; if(playCustom('correct')) return;
  const ctx=getCtx();
  [523.25,659.25,783.99,1046.5].forEach((freq,i)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+i*0.1;
    osc.type='sine';osc.frequency.value=freq;
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(0.5,t+0.03);gain.gain.exponentialRampToValueAtTime(0.001,t+0.35);
    osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+0.4);
  });
}
function playWrong(){
  if(!soundOn) return; if(playCustom('wrong')) return;
  const ctx=getCtx(),osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type='sawtooth';osc.frequency.setValueAtTime(300,ctx.currentTime);osc.frequency.linearRampToValueAtTime(80,ctx.currentTime+0.4);
  gain.gain.setValueAtTime(0.4,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.45);
  osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.5);
}
function playPull(){
  if(!soundOn) return; if(playCustom('pull')) return;
  const ctx=getCtx(),buf=ctx.createBuffer(1,ctx.sampleRate*0.2,ctx.sampleRate),data=buf.getChannelData(0);
  for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*0.06));
  const src=ctx.createBufferSource(),gain=ctx.createGain(),filt=ctx.createBiquadFilter();
  filt.type='lowpass';filt.frequency.value=200;src.buffer=buf;gain.gain.value=1.2;
  src.connect(filt);filt.connect(gain);gain.connect(ctx.destination);src.start();
}
function playNewQ(){
  if(!soundOn) return; if(playCustom('newq')) return;
  const ctx=getCtx(),osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(880,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(440,ctx.currentTime+0.15);
  gain.gain.setValueAtTime(0.3,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.2);
  osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.25);
}
function playWinFanfare(){
  if(!soundOn) return; if(playCustom('win')) return;
  const ctx=getCtx(),melody=[523.25,659.25,783.99,1046.5,1318.5];
  melody.forEach((freq,i)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+i*0.18;
    osc.type='square';osc.frequency.value=freq;
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(0.35,t+0.04);gain.gain.exponentialRampToValueAtTime(0.001,t+0.5);
    osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+0.55);
  });
  setTimeout(()=>{ for(let i=0;i<6;i++) setTimeout(()=>playPull(),i*80); },melody.length*180);
}

// DEMO DATA
const DEMO={
  topic:"Computer Basics – Hardware & Software",
  questions:[
    {q:"Which of the following is computer hardware?",choices:["Microsoft Word", "Keyboard", "Windows", "Google Chrome"],correct:1},
    {q:"Which device is mainly used to type text into a computer?",choices:["Monitor", "Printer", "Keyboard", "Speaker"],correct:2},
    {q:"Which device is used to display information from a computer?",choices:["Keyboard", "Monitor", "Mouse", "Scanner"],correct:1},
    {q:"Which of the following is an input device?",choices:["Monitor", "Printer", "Speaker", "Mouse"],correct:3},
    {q:"Which device is used to print documents on paper?",choices:["Scanner", "Monitor", "Printer", "Keyboard"],correct:2},
    {q:"Which device is used to move the pointer on the screen?",choices:["Mouse", "Speaker", "Printer", "Monitor"],correct:0},
    {q:"Which of the following is used to store data?",choices:["Monitor", "USB flash drive", "Keyboard", "Speaker"],correct:1},
    {q:"Which device is used to record sound into a computer?",choices:["Microphone", "Monitor", "Printer", "Projector"],correct:0},
    {q:"Which of the following is an output device?",choices:["Keyboard", "Mouse", "Monitor", "Scanner"],correct:2},
    {q:"Which part of the computer is often called the 'brain' of the computer?",choices:["Monitor", "CPU", "Keyboard", "Printer"],correct:1},
    {q:"What is computer software?",choices:["Physical parts of a computer", "Instructions that tell a computer what to do", "A computer cable", "A storage device"],correct:1},
    {q:"Which of the following is application software?",choices:["Keyboard", "Microsoft Word", "Monitor", "Mouse"],correct:1},
    {q:"Which software is mainly used for creating and editing documents?",choices:["Microsoft Word", "Calculator", "Paint", "Windows"],correct:0},
    {q:"Which of the following is an operating system?",choices:["Microsoft Word", "Windows", "Google Chrome", "PowerPoint"],correct:1},
    {q:"What is the main purpose of an operating system?",choices:["To print documents only", "To manage the computer and its resources", "To type letters only", "To play music only"],correct:1},
    {q:"Which of the following is a web browser?",choices:["Windows", "Google Chrome", "Microsoft Word", "Calculator"],correct:1},
    {q:"Which of the following is NOT software?",choices:["Windows", "Microsoft Word", "Keyboard", "Google Chrome"],correct:2},
    {q:"Which statement is correct?",choices:["Hardware can be touched, but software cannot", "Software can be touched, but hardware cannot", "Both can be touched", "Neither can be used on a computer"],correct:0},
    {q:"Which pair contains only hardware?",choices:["Keyboard and Mouse", "Windows and Word", "Chrome and PowerPoint", "Windows and Chrome"],correct:0},
    {q:"Which pair contains only software?",choices:["Keyboard and Mouse", "Monitor and Printer", "Windows and Microsoft Word", "CPU and Scanner"],correct:2},
    {q:"A student wants to type a story and save it on a computer. Which combination would be most useful?",choices:["Keyboard and Microsoft Word", "Printer and Speaker", "Monitor and Mouse only", "Scanner and Speaker"],correct:0},
    {q:"You can see a document on the screen but cannot physically touch the document itself. What is the document mainly considered?",choices:["Hardware", "Software/data", "Keyboard", "CPU"],correct:1},
    {q:"A student wants to transfer a file from one computer to another. Which device can be used?",choices:["Monitor", "USB flash drive", "Speaker", "Keyboard"],correct:1},
    {q:"Which device allows you to hear sound from a computer?",choices:["Microphone", "Scanner", "Speaker", "Keyboard"],correct:2},
    {q:"You want to create a presentation. Which software would be most suitable?",choices:["Microsoft PowerPoint", "Calculator", "File Explorer", "Antivirus"],correct:0},
    {q:"Which software helps a computer to perform basic operations and manage hardware?",choices:["Operating System", "Microsoft Word", "Paint", "Web Browser"],correct:0},
    {q:"What happens when hardware and software work together?",choices:["The computer can perform tasks", "The computer becomes smaller", "The monitor turns off", "Nothing happens"],correct:0},
    {q:"Which of these devices can both input and output information?",choices:["Touchscreen", "Keyboard", "Printer", "Speaker"],correct:0},
  ]
};

// GAME STATE
let questions=[],topic="";
let currentQ=0,ropePos=50,scores=[0,0],streaks=[0,0];
let wrongCounts=[0,0];
let answered=false;
const BASE_PULL=13;
let teamNames=['Team A','Team B'];

function buildCrowd(){
  const row=document.getElementById('crowd-row');
  row.innerHTML='';
  const colors=['#3B6EA5','#2d5a8e','#e8a020','#c8956a','#c0392b','#e74c3c','#27AE60','#8e44ad'];
  const count=Math.floor(row.offsetWidth/14)||50;
  for(let i=0;i<count;i++){
    const d=document.createElement('div');
    d.className='crowd-person '+(i<count/2?'side-a':'side-b');
    d.style.cssText=`background:${colors[Math.floor(Math.random()*colors.length)]};height:${18+Math.random()*10}px;animation-delay:${Math.random()*0.5}s`;
    row.appendChild(d);
  }
}

function loadDemo(){ questions=DEMO.questions; topic=DEMO.topic; readTeamNames(); startGame(); }

function readTeamNames(){
  const a=document.getElementById('name-a').value.trim();
  const b=document.getElementById('name-b').value.trim();
  teamNames=[a||'Team A', b||'Team B'];
}

// ─────────────────────────────────────────
// GOOGLE SHEET LOADING
// Accepts: normal "share link" URLs, view-only
// links, links pointing at a specific tab
// (#gid=...), AND already-published CSV links.
// "Publish to web" is no longer required —
// the sheet just needs to be shared as
// "Anyone with the link can view".
// ─────────────────────────────────────────

function extractSheetInfo(url){
  const gidMatch=url.match(/[?#&]gid=(\d+)/);
  const gid=gidMatch?gidMatch[1]:'0';

  // Published-to-web link: /d/e/PUBLISHED_ID/pubhtml or /pub
  const pubMatch=url.match(/\/d\/e\/([a-zA-Z0-9-_]+)/);
  if(pubMatch) return { id:null, publishedId:pubMatch[1], gid };

  // Normal share link: /d/SHEET_ID/edit
  const idMatch=url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return { id: idMatch?idMatch[1]:null, publishedId:null, gid };
}

// Multiple CORS proxies, tried in order — if one is down/rate-limited/
// misconfigured, we fall through to the next rather than failing outright.
const CORS_PROXIES=[
  u => 'https://api.allorigins.win/raw?url='+encodeURIComponent(u),
  u => 'https://corsproxy.io/?url='+encodeURIComponent(u),
  u => 'https://api.codetabs.com/v1/proxy?quest='+encodeURIComponent(u),
];

async function tryFetchCSV(url){
  for(const buildProxyUrl of CORS_PROXIES){
    try{
      const r=await fetch(buildProxyUrl(url));
      if(!r.ok) continue;
      const text=await r.text();
      if(!text || text.trim().length<10) continue;
      if(text.trim().startsWith('<')) continue; // got an HTML/login page, not CSV
      return text;
    }catch(e){ /* try next proxy */ }
  }
  return null;
}

async function loadSheet(){
  const url=document.getElementById('sheet-url').value.trim();
  const errEl=document.getElementById('url-err'),ldEl=document.getElementById('load-msg');
  errEl.style.display='none';

  // ── Path 1: Apps Script /exec endpoint — fetched directly, no proxy
  // needed, since Apps Script web apps send CORS-friendly headers. This
  // is the reliable path; recommend it when public proxies are down.
  if(url.includes('script.google.com') && url.includes('/exec')){
    ldEl.style.display='block';
    try{
      const r=await fetch(url);
      if(r.ok){
        const text=await r.text();
        if(text && text.trim().length>=10 && !text.trim().startsWith('<')){
          parseCSV(text);
          if(questions.length>0){
            ldEl.style.display='none';
            readTeamNames(); startGame();
            return;
          }
        }
      }
    }catch(e){ /* fall through to error below */ }
    ldEl.style.display='none';
    errEl.textContent='⚠️ Could not reach that Apps Script URL. Make sure it is deployed as a Web app with access set to "Anyone".';
    errEl.style.display='block';
    return;
  }

  if(!url.includes('docs.google.com/spreadsheets')){
    errEl.textContent='⚠️ Please paste a valid Google Sheets URL or Apps Script /exec URL';errEl.style.display='block';return;
  }

  // ── Path 2: normal Google Sheets link — routed through public CORS
  // proxies. These can be unreliable (rate limits, outages, auth walls),
  // so this is the fallback path, not the primary one.
  const {id,publishedId,gid}=extractSheetInfo(url);
  const candidates=[];

  if(url.includes('output=csv')||url.includes('format=csv')) candidates.push(url.split('#')[0]);

  if(publishedId){
    candidates.push(`https://docs.google.com/spreadsheets/d/e/${publishedId}/pub?output=csv&gid=${gid}&single=true`);
    candidates.push(`https://docs.google.com/spreadsheets/d/e/${publishedId}/pub?output=csv`);
  } else if(id){
    candidates.push(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`);
    candidates.push(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`);
    if(gid!=='0') candidates.push(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv`);
  }

  if(candidates.length===0){
    errEl.textContent='⚠️ Could not read a Sheet ID from that link';errEl.style.display='block';return;
  }

  ldEl.style.display='block';

  for(const csvUrl of candidates){
    const text=await tryFetchCSV(csvUrl);
    if(text){
      parseCSV(text);
      if(questions.length>0){
        ldEl.style.display='none';
        readTeamNames(); startGame();
        return;
      }
    }
  }

  ldEl.style.display='none';
  if(publishedId){
    errEl.textContent='⚠️ Could not load via public proxies (they are currently unreliable). Use an Apps Script /exec URL instead — see the setup steps below.';
  } else {
    errEl.textContent='⚠️ Could not load via public proxies (they are currently unreliable). Use an Apps Script /exec URL instead — see the setup steps below.';
  }
  errEl.style.display='block';
}

function parseCSVRow(row){
  const res=[];let cur='',inQ=false;
  for(let i=0;i<row.length;i++){
    const c=row[i];
    if(c==='"'&&!inQ) inQ=true;
    else if(c==='"'&&inQ&&row[i+1]==='"'){cur+='"';i++;}
    else if(c==='"'&&inQ) inQ=false;
    else if(c===','&&!inQ){res.push(cur.trim());cur='';}
    else cur+=c;
  }
  res.push(cur.trim());return res;
}

function parseCSV(text){
  const rows=text.trim().replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').map(l=>parseCSVRow(l));
  topic=rows[0]?.[0]||"Dzongkha Quiz";
  questions=[];
  for(let i=0;i<rows.length;i++){
    const r=rows[i];
    if(!r[1]) continue;
    if(r[1].toLowerCase().trim()==='question') continue;
    let cor;const raw=(r[6]||'').toString().toUpperCase().trim();
    if(['A','B','C','D'].includes(raw)) cor=['A','B','C','D'].indexOf(raw);
    else cor=parseInt(raw);
    if(isNaN(cor)||cor<0||cor>3) cor=0;
    questions.push({q:r[1],choices:[r[2]||'',r[3]||'',r[4]||'',r[5]||''],correct:cor});
  }
}

function startGame(){
  if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume();
  getCtx();
  currentQ=0;ropePos=50;scores=[0,0];streaks=[0,0];wrongCounts=[0,0];answered=false;
  document.getElementById('landing').style.display='none';
  document.getElementById('win-overlay').style.display='none';
  document.getElementById('game').style.display='flex';
  document.getElementById('topic-pill').textContent=topic;
  document.getElementById('qtot').textContent=questions.length;
  document.getElementById('header-a').textContent='🔵 '+teamNames[0];
  document.getElementById('header-b').textContent='🔴 '+teamNames[1];
  buildCrowd();
  updateRope();updateScores();
  startBgMusic();
  renderQ();
}

function renderQ(){
  if(currentQ>=questions.length){showWin('end');return;}
  answered=false;
  clearCharStates();

  const card=document.getElementById('q-card');
  card.classList.add('slide-out');
  setTimeout(()=>{
    const q=questions[currentQ];
    const L=['A','B','C','D'];
    document.getElementById('qnum').textContent=currentQ+1;
    document.getElementById('q-text').textContent=q.q;
    document.getElementById('feedback').textContent='';
    document.getElementById('feedback').className='feedback';
    document.getElementById('race-banner').textContent='⚡ Both teams race to answer!';
    playNewQ();

    ['a','b'].forEach((team,ti)=>{
      const el=document.getElementById('answers-'+team);
      el.innerHTML='';
      q.choices.forEach((c,i)=>{
        const btn=document.createElement('button');
        btn.className=`ans-btn ${ti===0?'blue-h':'red-h'}`;
        btn.dataset.idx=i;btn.dataset.team=ti;
        btn.innerHTML=`<span class="ans-lbl ${ti===0?'blue':'red'}">${L[i]}</span>${c}`;
        btn.onclick=()=>pick(i,ti);
        el.appendChild(btn);
      });
    });

    card.classList.remove('slide-out');
    card.classList.add('slide-in');
    setTimeout(()=>card.classList.remove('slide-in'),400);
  },200);
}

function clearCharStates(){
  ['team-a-players','team-b-players'].forEach(id=>{
    document.getElementById(id).classList.remove('pulling','wrong','celebrating','sad');
  });
  document.getElementById('crowd-row').classList.remove('cheering','cheering-b');
}

function showPowerPull(){
  const b=document.getElementById('power-pull-banner');
  b.classList.add('show');
  setTimeout(()=>b.classList.remove('show'),1800);
}

function pick(idx,team){
  if(answered) return;
  answered=true;
  if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume();

  const q=questions[currentQ];
  document.querySelectorAll('.ans-btn').forEach(b=>b.disabled=true);
  const correct=idx===q.correct;

  document.querySelectorAll('.ans-btn').forEach(b=>{
    if(parseInt(b.dataset.idx)===q.correct) b.classList.add('correct');
    else b.classList.add('dim');
  });

  const fb=document.getElementById('feedback');
  const rb=document.getElementById('race-banner');
  const crowd=document.getElementById('crowd-row');
  const winnerEl=document.getElementById(team===0?'team-a-players':'team-b-players');
  const loserEl =document.getElementById(team===0?'team-b-players':'team-a-players');

  if(correct){
    document.querySelectorAll(`.ans-btn[data-team="${team}"][data-idx="${idx}"]`).forEach(b=>{
      b.classList.remove('dim');b.classList.add('correct');
    });
    scores[team]++;streaks[team]++;streaks[1-team]=0;

    const isPower = streaks[team]>=3 && streaks[team]%3===0;
    const pullDist = isPower ? BASE_PULL*2 : BASE_PULL;

    fb.textContent=`✅ ${teamNames[team]} got it first!${isPower?' ⚡ POWER PULL!':''}`;
    fb.className='feedback ok';
    rb.textContent=`🎉 ${teamNames[team]} pulls the rope!`;

    if(isPower) showPowerPull();

    ropePos+=team===0?-pullDist:pullDist;
    ropePos=Math.max(5,Math.min(95,ropePos));

    playCorrect();setTimeout(playPull,300);

    clearCharStates();
    winnerEl.classList.add('pulling');
    loserEl.classList.add('wrong');
    crowd.classList.add(team===0?'cheering':'cheering-b');
    setTimeout(()=>{ winnerEl.classList.remove('pulling');loserEl.classList.remove('wrong'); },1700);

  } else {
    document.querySelectorAll(`.ans-btn[data-team="${team}"][data-idx="${idx}"]`).forEach(b=>{
      b.classList.remove('dim');b.classList.add('wrong');
    });
    wrongCounts[team]++;
    fb.textContent=`❌ Wrong! ${teamNames[team]} missed it!`;
    fb.className='feedback no';
    rb.textContent='No pull this round — rope stays!';
    playWrong();
    clearCharStates();
    ['team-a-players','team-b-players'].forEach(id=>document.getElementById(id).classList.add('wrong'));
    setTimeout(()=>['team-a-players','team-b-players'].forEach(id=>document.getElementById(id).classList.remove('wrong')),1000);
  }

  updateRope();updateScores();
  if(ropePos<=10){setTimeout(()=>showWin(0),1100);return;}
  if(ropePos>=90){setTimeout(()=>showWin(1),1100);return;}
  currentQ++;
  setTimeout(renderQ,2000);
}

function updateRope(){
  document.getElementById('rope-flag').style.left=ropePos+'%';
  const offset=ropePos-50, drag=offset*3.5;
  const teamA=document.getElementById('team-a-players');
  const teamB=document.getElementById('team-b-players');
  teamA.style.transform=`translateX(${drag}px)`;
  teamB.style.transform=`scaleX(-1) translateX(${-drag}px)`;
}

function updateScores(){
  document.getElementById('pts-a').textContent=scores[0];
  document.getElementById('pts-b').textContent=scores[1];
  document.getElementById('streak-a').textContent=streaks[0]>=2?'🔥'.repeat(Math.min(streaks[0],5)):'';
  document.getElementById('streak-b').textContent=streaks[1]>=2?'🔥'.repeat(Math.min(streaks[1],5)):'';
}

function showWin(team){
  stopBgMusic();playWinFanfare();
  clearCharStates();

  const teamA=document.getElementById('team-a-players');
  const teamB=document.getElementById('team-b-players');
  const crowd=document.getElementById('crowd-row');

  let winnerIdx;
  if(team==='end'){
    winnerIdx=scores[0]>scores[1]?0:scores[0]<scores[1]?1:null;
  } else {
    winnerIdx=team;
  }

  if(winnerIdx===null){
    teamA.classList.add('celebrating');teamB.classList.add('celebrating');
  } else {
    const wEl=winnerIdx===0?teamA:teamB;
    const lEl=winnerIdx===0?teamB:teamA;
    wEl.classList.add('celebrating');lEl.classList.add('sad');
    crowd.classList.add(winnerIdx===0?'cheering':'cheering-b');
  }

  const aCorrect=scores[0], bCorrect=scores[1];
  const aWrong=wrongCounts[0], bWrong=wrongCounts[1];
  const aAcc=aCorrect+aWrong>0?Math.round(aCorrect/(aCorrect+aWrong)*100):0;
  const bAcc=bCorrect+bWrong>0?Math.round(bCorrect/(bCorrect+bWrong)*100):0;

  document.getElementById('stats-row-a').innerHTML=`
    <div class="stats-team-name blue">🔵 ${teamNames[0]}</div>
    <div class="stats-item"><span>✅ Correct</span><span>${aCorrect}</span></div>
    <div class="stats-item"><span>❌ Wrong</span><span>${aWrong}</span></div>
    <div class="stats-item"><span>🎯 Accuracy</span><span>${aAcc}%</span></div>
  `;
  document.getElementById('stats-row-b').innerHTML=`
    <div class="stats-team-name red">🔴 ${teamNames[1]}</div>
    <div class="stats-item"><span>✅ Correct</span><span>${bCorrect}</span></div>
    <div class="stats-item"><span>❌ Wrong</span><span>${bWrong}</span></div>
    <div class="stats-item"><span>🎯 Accuracy</span><span>${bAcc}%</span></div>
  `;

  const ov=document.getElementById('win-overlay');
  setTimeout(()=>{
    ov.style.display='flex';
    if(winnerIdx===null){
      document.getElementById('win-emoji').textContent='🤝';
      document.getElementById('win-title').textContent="It's a Draw!";
    } else {
      document.getElementById('win-emoji').textContent='🏆';
      const knockout=team!=='end';
      document.getElementById('win-title').textContent=
        `${teamNames[winnerIdx]} Wins${knockout?' by Knockout!':'!'}`;
    }
    document.getElementById('win-sub').textContent=
      `Final — 🔵 ${teamNames[0]}: ${scores[0]}  |  🔴 ${teamNames[1]}: ${scores[1]}`;
    spawnConfetti();
  },600);
}

function spawnConfetti(){
  const cols=['#F5A623','#E8611A','#3B8BEB','#27AE60','#E74C3C','#fff','#a855f7'];
  for(let i=0;i<100;i++){
    const d=document.createElement('div');
    const rect=Math.random()>.5;
    d.className=rect?'confetti-rect':'confetti-dot';
    const size=6+Math.random()*10;
    d.style.cssText=`left:${Math.random()*100}vw;top:-30px;background:${cols[Math.floor(Math.random()*cols.length)]};animation-delay:${Math.random()*2}s;width:${size}px;height:${rect?size*0.5:size}px;border-radius:${rect?'2px':'50%'};`;
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),5500);
  }
}

function restartGame(){document.getElementById('win-overlay').style.display='none';startGame();}
function backHome(){
  stopBgMusic();
  document.getElementById('team-a-players').style.transform='';
  document.getElementById('team-b-players').style.transform='scaleX(-1)';
  document.getElementById('game').style.display='none';
  document.getElementById('win-overlay').style.display='none';
  document.getElementById('landing').style.display='flex';
  document.getElementById('sheet-url').value='';
  document.getElementById('url-err').style.display='none';
}
