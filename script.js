// ══════════════════════════════════════
//  SOUND ENGINE
// ══════════════════════════════════════
let audioCtx = null;
let soundOn  = true;
let bgMusicNode = null;
let bgGainNode  = null;

const customAudio = { bg:null, correct:null, wrong:null, pull:null, win:null, newq:null };

async function tryLoadAudio(key, path){
  try {
    const res = await fetch(path, { method: 'HEAD' });
    if(res.ok) { const a = new Audio(path); a.preload='auto'; customAudio[key]=a; }
  } catch(e){}
}
tryLoadAudio('bg','audio/bg.mp3');
tryLoadAudio('correct','audio/correct.mp3');
tryLoadAudio('wrong','audio/wrong.mp3');
tryLoadAudio('pull','audio/pull.mp3');
tryLoadAudio('win','audio/win.mp3');
tryLoadAudio('newq','audio/newq.mp3');

function playCustom(key, loop=false){
  if(!soundOn) return false;
  const a = customAudio[key]; if(!a) return false;
  const c = a.cloneNode(); c.volume=key==='bg'?0.3:0.9; c.loop=loop;
  c.play().catch(()=>{}); return c;
}
function getCtx(){
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  return audioCtx;
}
function toggleSound(){
  soundOn = !soundOn;
  document.getElementById('sound-toggle').textContent = soundOn ? '🔊' : '🔇';
  if(bgCustomNode) bgCustomNode.volume = soundOn ? 0.3 : 0;
  if(bgGainNode) bgGainNode.gain.setTargetAtTime(soundOn?0.07:0, getCtx().currentTime, 0.3);
}
let isDayMode = false;
function toggleTheme(){
  isDayMode = !isDayMode;
  document.body.classList.toggle('day', isDayMode);
  localStorage.setItem('dzongkha-theme', isDayMode ? 'day' : 'night');
}
(function(){
  if(localStorage.getItem('dzongkha-theme')==='day'){ isDayMode=true; document.body.classList.add('day'); }
})();

let bgCustomNode = null;
function startBgMusic(){
  if(!soundOn) return;
  if(customAudio['bg']){
    if(bgCustomNode) return;
    const a=customAudio['bg'].cloneNode(); a.loop=true; a.volume=0.3; a.play().catch(()=>{}); bgCustomNode=a; return;
  }
  const ctx=getCtx(); if(bgMusicNode) return;
  bgGainNode=ctx.createGain(); bgGainNode.gain.value=0.07; bgGainNode.connect(ctx.destination);
  const notes=[261.63,293.66,329.63,392.00,440.00,392.00,329.63,293.66]; let step=0;
  const beat=60/120;
  function playNote(){
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type='triangle'; osc.frequency.value=notes[step%notes.length]*(step<notes.length?1:2);
    gain.gain.setValueAtTime(0.4,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+beat*0.9);
    osc.connect(gain); gain.connect(bgGainNode); osc.start(ctx.currentTime); osc.stop(ctx.currentTime+beat);
    step++; bgMusicNode=setTimeout(playNote,beat*900);
  }
  playNote();
}
function stopBgMusic(){
  if(bgCustomNode){ bgCustomNode.pause(); bgCustomNode.currentTime=0; bgCustomNode=null; }
  if(bgMusicNode){ clearTimeout(bgMusicNode); bgMusicNode=null; }
}

function playCorrect(){
  if(!soundOn) return; if(playCustom('correct')) return;
  const ctx=getCtx();
  [523.25,659.25,783.99,1046.5].forEach((freq,i)=>{
    const osc=ctx.createOscillator(), gain=ctx.createGain(), t=ctx.currentTime+i*0.1;
    osc.type='sine'; osc.frequency.value=freq;
    gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(0.5,t+0.03);
    gain.gain.exponentialRampToValueAtTime(0.001,t+0.35);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(t); osc.stop(t+0.4);
  });
}
function playWrong(){
  if(!soundOn) return; if(playCustom('wrong')) return;
  const ctx=getCtx(), osc=ctx.createOscillator(), gain=ctx.createGain();
  osc.type='sawtooth'; osc.frequency.setValueAtTime(300,ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(80,ctx.currentTime+0.4);
  gain.gain.setValueAtTime(0.4,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.45);
  osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+0.5);
}
function playPull(){
  if(!soundOn) return; if(playCustom('pull')) return;
  const ctx=getCtx(), buf=ctx.createBuffer(1,ctx.sampleRate*0.2,ctx.sampleRate);
  const data=buf.getChannelData(0);
  for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*0.06));
  const src=ctx.createBufferSource(), gain=ctx.createGain(), filt=ctx.createBiquadFilter();
  filt.type='lowpass'; filt.frequency.value=200; src.buffer=buf; gain.gain.value=1.2;
  src.connect(filt); filt.connect(gain); gain.connect(ctx.destination); src.start();
}
function playNewQ(){
  if(!soundOn) return; if(playCustom('newq')) return;
  const ctx=getCtx(), osc=ctx.createOscillator(), gain=ctx.createGain();
  osc.type='sine'; osc.frequency.setValueAtTime(880,ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440,ctx.currentTime+0.15);
  gain.gain.setValueAtTime(0.3,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.2);
  osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+0.25);
}
function playWinFanfare(){
  if(!soundOn) return; if(playCustom('win')) return;
  const ctx=getCtx();
  [523.25,659.25,783.99,1046.5,1318.5].forEach((freq,i)=>{
    const osc=ctx.createOscillator(), gain=ctx.createGain(), t=ctx.currentTime+i*0.18;
    osc.type='square'; osc.frequency.value=freq;
    gain.gain.setValueAtTime(0,t); gain.gain.linearRampToValueAtTime(0.35,t+0.04);
    gain.gain.exponentialRampToValueAtTime(0.001,t+0.5);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(t); osc.stop(t+0.55);
  });
  setTimeout(()=>{ for(let i=0;i<6;i++) setTimeout(()=>playPull(),i*80); }, 5*180);
}
function playTick(){
  if(!soundOn) return;
  const ctx=getCtx(), osc=ctx.createOscillator(), gain=ctx.createGain();
  osc.frequency.value=1200; gain.gain.setValueAtTime(0.15,ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.08);
  osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+0.1);
}

// ══════════════════════════════════════
//  DEMO DATA
// ══════════════════════════════════════
const DEMO = {
  topic: "Dzongkha Basics – Demo",
  questions: [
    {q:"ཆུ་ means what?",           choices:["Fire 🔥","Water 💧","Tree 🌳","Sky ☁️"],   correct:1},
    {q:"མེ་ means what?",            choices:["Water","Earth","Fire 🔥","Wind"],          correct:2},
    {q:"Which verb means 'to go'?",  choices:["ཟ་ (eat)","འགྲོ་ (go)","སྡོད་ (stay)","ལྟ་ (see)"], correct:1},
    {q:"སྐྱིད་པོ་ means?",            choices:["Sad 😢","Angry 😠","Happy 😊","Tired 😴"],  correct:2},
    {q:"'Teacher' in Dzongkha?",     choices:["སློབ་དཔོན་","སློབ་མ་","ཨ་མ་","ཕ་"],          correct:0},
    {q:"དེབ་ means?",                choices:["Pen ✏️","Chair 🪑","Book 📚","Bag 🎒"],    correct:2},
    {q:"Honorific of 'eat' (ཟ་)?",  choices:["ཟ་","མཆོད་","འཐུང་","བཞེས་"],               correct:3},
    {q:"ལགཔ་ means?",               choices:["Foot 🦶","Hand ✋","Eye 👁️","Ear 👂"],      correct:1},
  ]
};

// ══════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════
let questions=[], topic="";
let currentQ=0, ropePos=50, scores=[0,0], streaks=[0,0];
let answered=false;
const PULL=13;

// ══════════════════════════════════════
//  GAME MODE  ('teams' | 'solo')
// ══════════════════════════════════════
let gameMode = 'teams';   // set before startGame()

// Solo mode state
let soloScore = 0;
let soloStreak = 0;
let soloCorrect = 0;
let soloTotal = 0;
let soloTimeLimit = 15;   // seconds per question
let soloTimer = null;
let soloTimeLeft = 0;

// ── LANDING ──
function loadDemo(){
  questions=DEMO.questions; topic=DEMO.topic;
  // respect whichever mode button was last clicked
  startGame();
}

function loadDemoSolo(){
  questions=DEMO.questions; topic=DEMO.topic;
  gameMode='solo'; startGame();
}

function loadDemoTeams(){
  questions=DEMO.questions; topic=DEMO.topic;
  gameMode='teams'; startGame();
}

async function loadSheet(){
  const url = document.getElementById('sheet-url').value.trim();
  const errEl = document.getElementById('url-err');
  const ldEl  = document.getElementById('load-msg');
  errEl.style.display = 'none';

  if(!url.includes('docs.google.com/spreadsheets')){
    errEl.textContent='⚠️ Please paste a valid Google Sheets URL'; errEl.style.display='block'; return;
  }

  let csvUrl='';
  if(url.includes('/pub')&&url.includes('output=csv')) csvUrl=url;
  else if(url.includes('/d/e/')) csvUrl=url.split('?')[0]+'?output=csv';
  else {
    const m=url.match(/\/d\/([\w-]+)/);
    if(!m){ errEl.textContent='⚠️ Could not read Sheet ID'; errEl.style.display='block'; return; }
    csvUrl=`https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv`;
  }

  ldEl.style.display='block';
  const proxy='https://corsproxy.io/?'+encodeURIComponent(csvUrl);
  try{
    const r=await fetch(proxy); if(!r.ok) throw 0;
    const text=await r.text(); if(!text||text.trim().length<10) throw 0;
    parseCSV(text); if(questions.length===0) throw 0;
    startGame();
  }catch{
    ldEl.style.display='none';
    errEl.textContent='⚠️ Could not load. Make sure the sheet is published as CSV (File → Share → Publish to web → CSV).';
    errEl.style.display='block';
  }
}

// ── load sheet with a chosen mode ──
async function loadSheetWithMode(mode){
  gameMode = mode;
  await loadSheet();
}

function parseCSVRow(row){
  const res=[]; let cur='', inQ=false;
  for(let i=0;i<row.length;i++){
    const c=row[i];
    if(c==='"'&&!inQ) inQ=true;
    else if(c==='"'&&inQ&&row[i+1]==='"'){ cur+='"'; i++; }
    else if(c==='"'&&inQ) inQ=false;
    else if(c===','&&!inQ){ res.push(cur.trim()); cur=''; }
    else cur+=c;
  }
  res.push(cur.trim()); return res;
}
function parseCSV(text){
  const rows=text.trim().replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').map(l=>parseCSVRow(l));
  topic=rows[0]?.[0]||"Dzongkha Quiz"; questions=[];
  for(let i=0;i<rows.length;i++){
    const r=rows[i]; if(!r[1]) continue;
    if(r[1].toLowerCase().trim()==='question') continue;
    let cor; const raw=(r[6]||'').toString().toUpperCase().trim();
    if(['A','B','C','D'].includes(raw)) cor=['A','B','C','D'].indexOf(raw);
    else cor=parseInt(raw); // expects 0-based: A=0, B=1, C=2, D=3
    if(isNaN(cor)||cor<0||cor>3) cor=0;
    questions.push({q:r[1],choices:[r[2]||'',r[3]||'',r[4]||'',r[5]||''],correct:cor});
  }
}

// ══════════════════════════════════════
//  START GAME — branches by mode
// ══════════════════════════════════════
function startGame(){
  if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume();
  getCtx();
  currentQ=0; ropePos=50; scores=[0,0]; streaks=[0,0]; answered=false;
  soloScore=0; soloStreak=0; soloCorrect=0; soloTotal=0;

  document.getElementById('landing').style.display='none';
  document.getElementById('win-overlay').style.display='none';

  if(gameMode==='solo'){
    startSoloGame();
  } else {
    startTeamsGame();
  }
}

// ══════════════════════════════════════
//  TEAMS MODE  (original)
// ══════════════════════════════════════
function startTeamsGame(){
  document.getElementById('game').style.display='flex';
  document.getElementById('solo-game').style.display='none';
  document.getElementById('topic-pill').textContent=topic;
  document.getElementById('qtot').textContent=questions.length;
  updateRope(); updateScores();
  startBgMusic();
  renderQ();
}

function renderQ(){
  if(currentQ>=questions.length){ showWin('end'); return; }
  answered=false;
  clearCharStates();
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
      btn.dataset.idx=i; btn.dataset.team=ti;
      btn.innerHTML=`<span class="ans-lbl ${ti===0?'blue':'red'}">${L[i]}</span>${c}`;
      btn.onclick=()=>pick(i,ti);
      el.appendChild(btn);
    });
  });
}

function clearCharStates(){
  ['team-a-players','team-b-players'].forEach(id=>{
    const c=document.getElementById(id);
    c.classList.remove('pulling','wrong','celebrating','sad');
  });
}

function pick(idx, team){
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
  const winner=document.getElementById(team===0?'team-a-players':'team-b-players');
  const loser=document.getElementById(team===0?'team-b-players':'team-a-players');

  if(correct){
    document.querySelectorAll(`.ans-btn[data-team="${team}"][data-idx="${idx}"]`).forEach(b=>{
      b.classList.remove('dim'); b.classList.add('correct');
    });
    scores[team]++; streaks[team]++; streaks[1-team]=0;
    fb.textContent=`✅ ${team===0?'🔵 Team A':'🔴 Team B'} got it first!`;
    fb.className='feedback ok';
    rb.textContent=`🎉 ${team===0?'Team A':'Team B'} pulls the rope!`;
    ropePos += team===0 ? -PULL : PULL;
    ropePos = Math.max(5,Math.min(95,ropePos));
    playCorrect(); setTimeout(playPull,300);
    clearCharStates();
    winner.classList.add('pulling'); loser.classList.add('wrong');
    setTimeout(()=>{ winner.classList.remove('pulling'); loser.classList.remove('wrong'); },1700);
  } else {
    document.querySelectorAll(`.ans-btn[data-team="${team}"][data-idx="${idx}"]`).forEach(b=>{
      b.classList.remove('dim'); b.classList.add('wrong');
    });
    fb.textContent=`❌ Wrong! ${team===0?'🔵 Team A':'🔴 Team B'} missed it!`;
    fb.className='feedback no';
    rb.textContent='No pull this round — rope stays!';
    playWrong();
    clearCharStates();
    ['team-a-players','team-b-players'].forEach(id=>{
      document.getElementById(id).classList.add('wrong');
    });
    setTimeout(()=>{ ['team-a-players','team-b-players'].forEach(id=>document.getElementById(id).classList.remove('wrong')); },1000);
  }

  updateRope(); updateScores();
  if(ropePos<=10){ setTimeout(()=>showWin(0),1100); return; }
  if(ropePos>=90){ setTimeout(()=>showWin(1),1100); return; }
  currentQ++;
  setTimeout(renderQ,2000);
}

function updateRope(){
  document.getElementById('rope-flag').style.left=ropePos+'%';
  const offset=ropePos-50, drag=offset*1.4;
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
  stopBgMusic(); playWinFanfare();
  clearCharStates();
  const teamA=document.getElementById('team-a-players');
  const teamB=document.getElementById('team-b-players');
  if(team==='end'){
    const w=scores[0]>scores[1]?0:scores[0]<scores[1]?1:'draw';
    if(w==='draw'){ teamA.classList.add('celebrating'); teamB.classList.add('celebrating'); }
    else { (w===0?teamA:teamB).classList.add('celebrating'); (w===0?teamB:teamA).classList.add('sad'); }
  } else {
    (team===0?teamA:teamB).classList.add('celebrating'); (team===0?teamB:teamA).classList.add('sad');
  }
  const ov=document.getElementById('win-overlay');
  setTimeout(()=>{
    ov.style.display='flex';
    if(team==='end'){
      const w=scores[0]>scores[1]?0:scores[0]<scores[1]?1:'draw';
      if(w==='draw'){ document.getElementById('win-emoji').textContent='🤝'; document.getElementById('win-title').textContent="It's a Draw!"; }
      else { document.getElementById('win-emoji').textContent='🏆'; document.getElementById('win-title').textContent=`Team ${w===0?'A 🔵':'B 🔴'} Wins!`; }
    } else {
      document.getElementById('win-emoji').textContent='🏆';
      document.getElementById('win-title').textContent=`Team ${team===0?'A 🔵':'B 🔴'} Wins by Knockout!`;
    }
    document.getElementById('win-sub').textContent=`Final — 🔵 Team A: ${scores[0]}  |  🔴 Team B: ${scores[1]}`;
    spawnConfetti();
  },600);
}

// ══════════════════════════════════════
//  SOLO MODE  — individual student play
// ══════════════════════════════════════
function startSoloGame(){
  document.getElementById('game').style.display='none';
  const soloEl=document.getElementById('solo-game');
  soloEl.style.display='flex';
  document.getElementById('solo-topic-pill').textContent=topic;
  document.getElementById('solo-qtot').textContent=questions.length;

  // Read timer setting
  soloTimeLimit = parseInt(document.getElementById('solo-timer-select')?.value || 15);

  updateSoloHUD();
  startBgMusic();
  renderSoloQ();
}

function renderSoloQ(){
  if(currentQ>=questions.length){ showSoloEnd(); return; }
  answered=false;
  soloTotal = currentQ + 1;

  const q=questions[currentQ];
  const L=['A','B','C','D'];

  document.getElementById('solo-qnum').textContent=currentQ+1;
  document.getElementById('solo-q-text').textContent=q.q;
  document.getElementById('solo-feedback').textContent='';
  document.getElementById('solo-feedback').className='feedback';

  const el=document.getElementById('solo-answers');
  el.innerHTML='';
  q.choices.forEach((c,i)=>{
    const btn=document.createElement('button');
    btn.className='ans-btn solo-btn';
    btn.dataset.idx=i;
    btn.innerHTML=`<span class="ans-lbl blue">${L[i]}</span>${c}`;
    btn.onclick=()=>soloPickAnswer(i);
    el.appendChild(btn);
  });

  playNewQ();
  startSoloTimer();
}

function startSoloTimer(){
  clearSoloTimer();
  soloTimeLeft = soloTimeLimit;
  updateSoloTimerBar();

  soloTimer = setInterval(()=>{
    soloTimeLeft--;
    updateSoloTimerBar();
    if(soloTimeLeft <= 3) playTick();
    if(soloTimeLeft <= 0){
      clearSoloTimer();
      if(!answered) soloTimeUp();
    }
  }, 1000);
}
function clearSoloTimer(){
  if(soloTimer){ clearInterval(soloTimer); soloTimer=null; }
}
function updateSoloTimerBar(){
  const bar=document.getElementById('solo-timer-bar');
  const pct=Math.max(0,(soloTimeLeft/soloTimeLimit)*100);
  if(bar){
    bar.style.width=pct+'%';
    bar.style.background=soloTimeLeft<=5?'#e74c3c':soloTimeLeft<=10?'#f5a623':'#27ae60';
  }
  const label=document.getElementById('solo-timer-label');
  if(label) label.textContent=soloTimeLeft+'s';
}

function soloTimeUp(){
  if(answered) return;
  answered=true;
  clearSoloTimer();
  const q=questions[currentQ];
  document.querySelectorAll('#solo-answers .ans-btn').forEach(b=>{
    b.disabled=true;
    if(parseInt(b.dataset.idx)===q.correct) b.classList.add('correct');
    else b.classList.add('dim');
  });
  const fb=document.getElementById('solo-feedback');
  fb.textContent='⏰ Time\'s up! No points this round.';
  fb.className='feedback no';
  soloStreak=0;
  playWrong();
  updateSoloHUD();
  currentQ++;
  setTimeout(renderSoloQ, 2200);
}

function soloPickAnswer(idx){
  if(answered) return;
  answered=true;
  clearSoloTimer();
  if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume();

  const q=questions[currentQ];
  const correct=idx===q.correct;

  document.querySelectorAll('#solo-answers .ans-btn').forEach(b=>{
    b.disabled=true;
    if(parseInt(b.dataset.idx)===q.correct) b.classList.add('correct');
    else b.classList.add('dim');
  });
  document.querySelectorAll(`#solo-answers .ans-btn[data-idx="${idx}"]`).forEach(b=>{
    b.classList.remove('dim');
    b.classList.add(correct?'correct':'wrong');
  });

  const fb=document.getElementById('solo-feedback');
  if(correct){
    // Points: base 10 + time bonus
    const timeBonus = Math.floor(soloTimeLeft * 2);
    const pts = 10 + timeBonus;
    soloScore += pts; soloStreak++; soloCorrect++;

    fb.textContent=`✅ Correct! +${pts} pts${timeBonus>0?' (⚡ speed bonus!)':''}`;
    fb.className='feedback ok';
    playCorrect();

    // Celebrate the solo character
    document.getElementById('solo-player').classList.remove('pulling','wrong','sad');
    document.getElementById('solo-player').classList.add('celebrating');
    setTimeout(()=>{
      document.getElementById('solo-player').classList.remove('celebrating');
    }, 1700);
  } else {
    soloStreak=0;
    fb.textContent=`❌ Wrong! The correct answer was ${['A','B','C','D'][q.correct]}.`;
    fb.className='feedback no';
    playWrong();

    document.getElementById('solo-player').classList.remove('pulling','celebrating','sad');
    document.getElementById('solo-player').classList.add('wrong');
    setTimeout(()=>{
      document.getElementById('solo-player').classList.remove('wrong');
    }, 1000);
  }

  updateSoloHUD();
  currentQ++;
  setTimeout(renderSoloQ, 2000);
}

function updateSoloHUD(){
  document.getElementById('solo-score').textContent=soloScore;
  const streakEl=document.getElementById('solo-streak');
  if(streakEl) streakEl.textContent=soloStreak>=2?'🔥'.repeat(Math.min(soloStreak,5)):'';
  const accEl=document.getElementById('solo-accuracy');
  if(accEl&&currentQ>0){
    const acc=Math.round((soloCorrect/currentQ)*100);
    accEl.textContent=acc+'%';
  }
}

function showSoloEnd(){
  stopBgMusic(); playWinFanfare();
  const totalQ=questions.length;
  const acc=totalQ>0?Math.round((soloCorrect/totalQ)*100):0;
  const grade=acc>=90?'🏆 Excellent!':acc>=70?'😊 Good job!':acc>=50?'📚 Keep practising!':'💪 Don\'t give up!';

  const ov=document.getElementById('win-overlay');
  document.getElementById('win-emoji').textContent=acc>=70?'🌟':'📖';
  document.getElementById('win-title').textContent=grade;
  document.getElementById('win-sub').innerHTML=
    `Score: <b>${soloScore}</b> &nbsp;|&nbsp; ${soloCorrect}/${totalQ} correct &nbsp;|&nbsp; Accuracy: ${acc}%`;
  ov.style.display='flex';
  spawnConfetti();
}

// ══════════════════════════════════════
//  SHARED HELPERS
// ══════════════════════════════════════
function spawnConfetti(){
  const cols=['#F5A623','#E8611A','#3B8BEB','#27AE60','#E74C3C','#fff','#a855f7'];
  for(let i=0;i<80;i++){
    const d=document.createElement('div');
    const rect=Math.random()>.5;
    d.className=rect?'confetti-rect':'confetti-dot';
    const size=6+Math.random()*10;
    d.style.cssText=`left:${Math.random()*100}vw;top:-30px;background:${cols[Math.floor(Math.random()*cols.length)]};animation-delay:${Math.random()*1.8}s;width:${size}px;height:${rect?size*0.5:size}px;border-radius:${rect?'2px':'50%'};`;
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),5000);
  }
}

function restartGame(){
  document.getElementById('win-overlay').style.display='none';
  clearSoloTimer();
  startGame();
}
function backHome(){
  stopBgMusic(); clearSoloTimer();
  document.getElementById('team-a-players').style.transform='';
  document.getElementById('team-b-players').style.transform='scaleX(-1)';
  document.getElementById('game').style.display='none';
  document.getElementById('solo-game').style.display='none';
  document.getElementById('win-overlay').style.display='none';
  document.getElementById('landing').style.display='flex';
  document.getElementById('sheet-url').value='';
  document.getElementById('url-err').style.display='none';
}
