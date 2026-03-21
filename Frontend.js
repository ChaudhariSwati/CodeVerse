// ═══════════════════════════════════════════════════════════
// PASTE THIS <script> BLOCK into your neuralcode.html
// replacing everything between <script> and </script> at the bottom
// ═══════════════════════════════════════════════════════════

// ── CONFIGURATION ─────────────────────────────────────────
const SERVER = 'http://localhost:3001';   // your backend URL
// When deployed to Vercel/Render, change to: 'https://your-app.onrender.com'

// ── AUTH STATE ────────────────────────────────────────────
let currentUser = null;
let JWT_TOKEN   = localStorage.getItem('nc_token') || null;

// ── API HELPER ────────────────────────────────────────────
// All requests to your backend go through this
async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (JWT_TOKEN) headers['Authorization'] = 'Bearer ' + JWT_TOKEN;
  const r = await fetch(SERVER + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Server error');
  return d;
}

// ── AUTH FUNCTIONS ────────────────────────────────────────

function switchTab(tab){
  document.querySelectorAll('.auth-tab').forEach((t,i)=>t.classList.toggle('active',i===(tab==='login'?0:1)));
  document.getElementById('loginForm').style.display=tab==='login'?'block':'none';
  document.getElementById('registerForm').style.display=tab==='register'?'block':'none';
}

function togglePw(id,btn){
  const inp=document.getElementById(id);
  const show=inp.type==='password';
  inp.type=show?'text':'password';
  btn.textContent=show?'🙈':'👁';
}

function checkStrength(pw){
  const fill=document.getElementById('strengthFill');
  const lbl=document.getElementById('strengthLabel');
  if(!pw){fill.style.width='0';lbl.textContent='';return;}
  let score=0;
  if(pw.length>=8)score++;if(pw.length>=12)score++;
  if(/[A-Z]/.test(pw))score++;if(/[0-9]/.test(pw))score++;
  if(/[^A-Za-z0-9]/.test(pw))score++;
  const levels=[{w:'20%',c:'var(--red)',t:'Too weak'},{w:'40%',c:'var(--orange)',t:'Weak'},{w:'60%',c:'var(--gold)',t:'Fair'},{w:'80%',c:'var(--teal)',t:'Good'},{w:'100%',c:'var(--green)',t:'Strong ✓'}];
  const l=levels[Math.min(score,4)];
  fill.style.width=l.w;fill.style.background=l.c;lbl.textContent=l.t;lbl.style.color=l.c;
}

function showErr(id,msg){const el=document.getElementById(id);el.textContent=msg;el.style.display='block';setTimeout(()=>el.style.display='none',4000);}
function showOk(id,msg){const el=document.getElementById(id);el.textContent=msg;el.style.display='block';setTimeout(()=>el.style.display='none',4000);}

async function doLogin(){
  const email=document.getElementById('loginEmail').value.trim();
  const pw=document.getElementById('loginPw').value;
  if(!email||!pw){showErr('loginErr','Please fill in all fields.');return;}
  const btn=document.getElementById('loginBtn');
  btn.disabled=true; btn.textContent='Signing in...';
  try{
    const d = await api('POST', '/auth/login', { email, password: pw });
    JWT_TOKEN = d.token;
    localStorage.setItem('nc_token', d.token);
    loginSuccess(d.user);
  }catch(e){
    showErr('loginErr', e.message);
  }finally{
    btn.disabled=false; btn.textContent='Sign In →';
  }
}

async function doRegister(){
  const name=document.getElementById('regName').value.trim();
  const email=document.getElementById('regEmail').value.trim();
  const pw=document.getElementById('regPw').value;
  const pw2=document.getElementById('regPw2').value;
  const role=document.getElementById('regRole').value;
  if(!name||!email||!pw){showErr('regErr','Please fill in all fields.');return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showErr('regErr','Invalid email format.');return;}
  if(pw.length<6){showErr('regErr','Password must be at least 6 characters.');return;}
  if(pw!==pw2){showErr('regErr','Passwords do not match.');return;}
  const btn=document.getElementById('regBtn');
  btn.disabled=true; btn.textContent='Creating account...';
  try{
    const d = await api('POST', '/auth/register', { name, email, password: pw, role });
    JWT_TOKEN = d.token;
    localStorage.setItem('nc_token', d.token);
    showOk('regSuccess','Account created! Signing you in...');
    setTimeout(()=>loginSuccess(d.user), 1000);
  }catch(e){
    showErr('regErr', e.message);
  }finally{
    btn.disabled=false; btn.textContent='Create Account →';
  }
}

function demoLogin(){
  // Demo mode — bypass backend, use localStorage only
  JWT_TOKEN = null;
  loginSuccess({ name:'Demo User', email:'demo@neuralcode.ai', xp:0, streak:1, stats:[0,0,0,0], progress:[0,0,0,0] });
}

function loginSuccess(user){
  currentUser = user;
  document.getElementById('authScreen').style.display='none';
  document.getElementById('appShell').classList.add('visible');
  initApp();
}

function doLogout(){
  localStorage.removeItem('nc_token');
  JWT_TOKEN = null;
  currentUser = null;
  document.getElementById('appShell').classList.remove('visible');
  document.getElementById('authScreen').style.display='flex';
  document.getElementById('userMenu').classList.remove('open');
}

// Auto-login on page load using saved JWT
window.addEventListener('load', async () => {
  if (JWT_TOKEN) {
    try {
      const d = await api('GET', '/auth/me');
      currentUser = d;
      document.getElementById('authScreen').style.display='none';
      document.getElementById('appShell').classList.add('visible');
      initApp();
    } catch {
      // Token expired — clear it and show login
      localStorage.removeItem('nc_token');
      JWT_TOKEN = null;
    }
  }
});

// ── APP INIT ──────────────────────────────────────────────
function initApp(){
  const ud = currentUser;
  const initial = (ud.name||'A').charAt(0).toUpperCase();
  document.getElementById('avatarLetter').textContent=initial;
  document.getElementById('sidebarAv').textContent=initial;
  document.getElementById('sidebarName').textContent=(ud.name||'User').split(' ')[0];
  document.getElementById('menuName').textContent=ud.name||'User';
  document.getElementById('heroGreeting').textContent='Welcome back, '+(ud.name||'').split(' ')[0]+'! 👋';
  document.getElementById('xpVal').textContent=(ud.xp||0).toLocaleString();
  document.getElementById('st4').textContent=(ud.xp||0).toLocaleString();
  document.getElementById('st1').textContent=(ud.stats||[])[0]||0;
  document.getElementById('st2').textContent=(ud.stats||[])[1]||0;
  document.getElementById('st3').textContent=(ud.stats||[])[2]||0;
  document.getElementById('streakVal').textContent=ud.streak||1;
  const lvl=getLevel(ud.xp||0);
  document.getElementById('levelPill').textContent=lvl;
  document.getElementById('sidebarRole').textContent=lvl;
  updateProgress(ud.progress||[0,0,0,0]);
  renderRoadmap();
  renderAchievements();
}

function getLevel(xp){
  if(xp<100)return 'Beginner';if(xp<300)return 'Novice';
  if(xp<600)return 'Learner';if(xp<1000)return 'Coder';
  if(xp<1500)return 'Developer';return 'Pro Coder';
}

function updateProgress(prog){
  [['p1','p1v'],['p2','p2v'],['p3','p3v'],['p4','p4v']].forEach(([b,l],i)=>{
    const v=prog[i]||0;
    document.getElementById(b).style.width=v+'%';
    document.getElementById(l).textContent=v+'%';
  });
}

// Save progress to MongoDB via backend
async function saveProgress(){
  if(!JWT_TOKEN) return; // skip in demo mode
  try{
    await api('PATCH', '/user/progress', {
      xp: currentUser.xp,
      stats: currentUser.stats,
      progress: currentUser.progress,
      streak: currentUser.streak
    });
  }catch(e){ console.warn('Progress save failed:', e.message); }
}

function addXP(n){
  currentUser.xp=(currentUser.xp||0)+n;
  document.getElementById('xpVal').textContent=currentUser.xp.toLocaleString();
  document.getElementById('st4').textContent=currentUser.xp.toLocaleString();
  document.getElementById('levelPill').textContent=getLevel(currentUser.xp);
  document.getElementById('sidebarRole').textContent=getLevel(currentUser.xp);
  saveProgress();
}

function incStat(idx){
  currentUser.stats=currentUser.stats||[0,0,0,0];
  currentUser.stats[idx]=(currentUser.stats[idx]||0)+1;
  const ids=['st1','st2','st3'];
  if(ids[idx]) document.getElementById(ids[idx]).textContent=currentUser.stats[idx];
  saveProgress();
}

function bumpProgress(idx,amount){
  currentUser.progress=currentUser.progress||[0,0,0,0];
  currentUser.progress[idx]=Math.min(100,(currentUser.progress[idx]||0)+amount);
  updateProgress(currentUser.progress);
  saveProgress();
}

// ── NAVIGATION ────────────────────────────────────────────
function goPage(id,el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.s-item').forEach(i=>i.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  el.classList.add('active');
  if(window.innerWidth<=768) toggleSidebar(true);
}

function toggleSidebar(forceClose){
  const sb=document.getElementById('sidebar');
  const ov=document.getElementById('sidebarOverlay');
  const isOpen=sb.classList.contains('open');
  if(forceClose||isOpen){sb.classList.remove('open');ov.classList.remove('show');}
  else{sb.classList.add('open');ov.classList.add('show');}
}

function toggleMenu(){document.getElementById('userMenu').classList.toggle('open');}
document.addEventListener('click',e=>{
  if(!e.target.closest('#avatarBtn')&&!e.target.closest('#userMenu'))
    document.getElementById('userMenu').classList.remove('open');
});

function quickLearn(q){
  goPage('chat',document.querySelectorAll('.s-item')[1]);
  setTimeout(()=>{document.getElementById('chatTa').value=q;sendMsg();},300);
}

// ── CHAT ──────────────────────────────────────────────────
let chatMode='explain';
const modes={
  explain:{label:'Explain Mode · Beginner Friendly',system:'You are a kind, patient coding instructor for absolute beginners. ALWAYS explain in plain English using real-life analogies. Define every technical term immediately. Show a short commented code example for every concept. End with one "Try it yourself" suggestion. Format code with triple backticks.',chips:['What is a variable?','Explain if/else','What is a function?','What is a loop?']},
  debug:{label:'Fix My Code Mode',system:'You are a friendly debugger for beginners. When given code: 1) Confirm what it should do. 2) List each bug with line number and plain-English explanation. 3) Show corrected code with comments. 4) Give one tip to avoid this bug.',chips:['Find bugs in my code','Why is my loop broken?','My function returns undefined','SyntaxError help']},
  challenge:{label:'Practice Challenge Mode',system:'You are a beginner coding challenge creator. Give ONE small achievable challenge: 1) Friendly intro, 2) Task in plain English with 2-3 bullet requirements, 3) Example input/output, 4) A beginner hint.',chips:['Give me a JavaScript challenge','Give me a Python task','Array practice challenge','Function writing task']},
  eli5:{label:'Super Simple · ELI5 Mode',system:'Explain coding to a 10-year-old. ONLY use the simplest words. Use toy, food, game analogies ONLY. Use emojis freely.',chips:['What is programming?','What is a variable? (simple)','What does a computer do?','Why do we code?']}
};

function setMode(m,el){
  chatMode=m;
  document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('modeLabel').textContent=modes[m].label;
  document.getElementById('msgs').innerHTML=`<div class="msg"><div class="msg-av ai-av">AI</div><div><div class="msg-lbl">${modes[m].label.split('·')[0].trim()}</div><div class="msg-bubble">Switched to <strong>${m}</strong> mode!</div></div></div>`;
  document.getElementById('chipsContainer').innerHTML=modes[m].chips.map(c=>`<span class="chip" onclick="useChip(this)">${c}</span>`).join('');
  document.getElementById('chipsWrap').style.display='block';
}

function useChip(el){document.getElementById('chatTa').value=el.textContent;sendMsg();}

async function sendMsg(){
  const ta=document.getElementById('chatTa');
  const text=ta.value.trim();
  if(!text)return;
  ta.value='';ta.style.height='42px';
  document.getElementById('chipsWrap').style.display='none';
  appendMsg('user',text);
  const tw=document.getElementById('typingWrap');
  tw.style.display='block';
  document.getElementById('sendBtn').disabled=true;
  scrollMsgs();
  try{
    // ← Calls YOUR backend, not Gemini directly
    const d = await api('POST','/api/chat',{ systemPrompt: modes[chatMode].system, userMessage: text });
    tw.style.display='none';
    appendMsg('ai', d.reply);
    addXP(10); incStat(0); bumpProgress(1,2);
    toast('💡 +10 XP!');
  }catch(e){
    tw.style.display='none';
    appendMsg('ai','⚠️ Error: '+e.message);
  }
  document.getElementById('sendBtn').disabled=false;
  scrollMsgs();
}

function appendMsg(role,text){
  const c=document.getElementById('msgs');
  const isAI=role==='ai';
  const div=document.createElement('div');
  div.className='msg'+(isAI?'':' user-msg');
  div.innerHTML=`<div class="msg-av ${isAI?'ai-av':'user-av'}">${isAI?'AI':'You'}</div><div class="msg-bubble">${renderText(text)}</div>`;
  c.appendChild(div);
  scrollMsgs();
}

function scrollMsgs(){const c=document.getElementById('msgs');c.scrollTop=c.scrollHeight;}

function renderText(t){
  t=t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  t=t.replace(/```(\w+)?\n?([\s\S]*?)```/g,(_,l,code)=>`<div class="msg-code">${code.trim()}</div>`);
  t=t.replace(/`([^`]+)`/g,'<span class="msg-icode">$1</span>');
  t=t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  t=t.replace(/\n/g,'<br>');
  return t;
}

document.addEventListener('DOMContentLoaded',()=>{
  const ta=document.getElementById('chatTa');
  if(ta) ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}});
});

// ── QUIZ ──────────────────────────────────────────────────
let Qs=[],qIdx=0,qCorrect=0,qStart=0,qTimer=null;

function pickTopic(topic){
  document.getElementById('vTopics').style.display='none';
  document.getElementById('vLoading').style.display='block';
  document.getElementById('loadTopic').textContent=topic.split(' ').slice(0,4).join(' ');
  generateQuiz(topic);
}

async function generateQuiz(topic){
  try{
    // ← Calls YOUR backend
    const d = await api('POST','/api/quiz',{ topic });
    Qs=d.questions;
    qIdx=0;qCorrect=0;qStart=Date.now();startClock();
    document.getElementById('vLoading').style.display='none';
    document.getElementById('vQuestion').style.display='block';
    renderQ();
  }catch(e){
    document.getElementById('vLoading').innerHTML=`<div style="color:var(--red);padding:40px;font-size:14px">Failed: ${e.message}<br><br><button class="btn" onclick="resetQuiz()">← Back</button></div>`;
  }
}

function startClock(){
  if(qTimer)clearInterval(qTimer);
  qTimer=setInterval(()=>{const s=Math.floor((Date.now()-qStart)/1000);const el=document.getElementById('qClock');if(el)el.textContent=`⏱ ${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;},1000);
}

function renderQ(){
  const q=Qs[qIdx];
  document.getElementById('qBar').style.width=(qIdx/Qs.length*100)+'%';
  document.getElementById('qStep').textContent=`Question ${qIdx+1} of ${Qs.length}`;
  document.getElementById('qText').innerHTML=q.q;
  document.getElementById('qExp').style.display='none';
  document.getElementById('qNext').style.display='none';
  const L=['A','B','C','D'];
  document.getElementById('qOpts').innerHTML=q.options.map((o,i)=>`<div class="q-opt" onclick="pickOpt(${i})"><span class="opt-k">${L[i]}</span>${o.replace(/^[A-D]\)\s*/,'')}</div>`).join('');
}

function pickOpt(i){
  const q=Qs[qIdx];
  document.querySelectorAll('.q-opt').forEach(o=>o.style.pointerEvents='none');
  const opts=document.querySelectorAll('.q-opt');
  if(i===q.correct){opts[i].classList.add('correct');qCorrect++;toast('✅ Correct! +20 XP');}
  else{opts[i].classList.add('wrong');opts[q.correct].classList.add('correct');toast('❌ Not quite!');}
  document.getElementById('qExp').innerHTML='💡 <strong>Explanation:</strong> '+q.explain;
  document.getElementById('qExp').style.display='block';
  document.getElementById('qNext').style.display='inline-flex';
}

function nextQ(){qIdx++;if(qIdx>=Qs.length){clearInterval(qTimer);showQuizResult();}else renderQ();}

function showQuizResult(){
  document.getElementById('vQuestion').style.display='none';
  document.getElementById('vResult').style.display='block';
  const pct=Math.round(qCorrect/Qs.length*100);
  const secs=Math.floor((Date.now()-qStart)/1000);
  const xp=qCorrect*20+(pct===100?50:0);
  document.getElementById('rScore').textContent=`${qCorrect}/${Qs.length}`;
  document.getElementById('rXP').textContent=`+${xp}`;
  document.getElementById('rTime').textContent=`${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}`;
  document.getElementById('rEm').textContent=pct>=80?'🎉':pct>=60?'😊':'💪';
  document.getElementById('rTitle').textContent=pct>=80?'Excellent!':pct>=60?'Good Job!':'Keep Going!';
  document.getElementById('rSub').textContent=`${pct}% — ${pct>=80?'You really know this!':pct>=60?'Nice work!':'Every attempt teaches something!'}`;
  addXP(xp);incStat(1);bumpProgress(1,5);
  toast(`🏆 +${xp} XP earned!`);
}

function retryQ(){
  document.getElementById('vResult').style.display='none';
  qIdx=0;qCorrect=0;qStart=Date.now();startClock();
  document.getElementById('vQuestion').style.display='block';
  renderQ();
}

function resetQuiz(){
  ['vResult','vQuestion','vLoading'].forEach(id=>document.getElementById(id).style.display='none');
  document.getElementById('vTopics').style.display='block';
}

// ── CODE REVIEW ───────────────────────────────────────────
function setRevTab(tab,el){
  document.querySelectorAll('.rev-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('descBlock').style.display=tab==='desc'?'block':'none';
}

function loadSample(){
  document.getElementById('codeArea').value=`function calculateAverage(numbers) {
  var total = 0;
  for (var i = 0; i <= numbers.length; i++) {
    total = total + numbers[i];
  }
  return total / numbers.length;
}`;
  document.getElementById('revLang').value='JavaScript';
}

async function doReview(){
  const code=document.getElementById('codeArea').value.trim();
  if(!code||code.length<8){toast('Please paste some code first!');return;}
  const btn=document.getElementById('revBtn');
  btn.disabled=true;
  btn.innerHTML='<span style="opacity:.6">Analysing...</span>';
  try{
    // ← Calls YOUR backend
    const d = await api('POST','/api/review',{
      code,
      lang: document.getElementById('revLang').value,
      beginner: document.getElementById('chkBeg').checked,
      rewrite: document.getElementById('chkRw').checked,
      desc: document.getElementById('descTa')?.value?.trim()||''
    });
    renderReview(d.review, document.getElementById('chkRw').checked);
    addXP(15);incStat(2);bumpProgress(1,3);
    toast('✅ Review done! +15 XP');
  }catch(e){
    document.getElementById('revResult').style.display='block';
    document.getElementById('revResult').innerHTML=`<div style="color:var(--red);padding:18px;background:var(--red-l);border-radius:var(--r)">⚠️ ${e.message}</div>`;
  }
  btn.disabled=false;
  btn.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Review My Code';
}

function renderReview(r,showRw){
  const el=document.getElementById('revResult');
  el.style.display='block';
  const sc=r.overall;
  const col=sc>=80?'var(--teal)':sc>=60?'var(--gold)':'var(--orange)';
  const tm={good:{cls:'fb-good',ic:'✓'},warn:{cls:'fb-warn',ic:'⚠'},bad:{cls:'fb-bad',ic:'✕'}};
  const issues=(r.issues||[]).map(i=>`<div class="fb ${tm[i.type]?.cls||'fb-warn'}"><span class="fbi">${tm[i.type]?.ic||'•'}</span><span>${i.text}</span></div>`).join('');
  const rwHtml=showRw&&r.rewrite?`<div class="rw-block"><h4>✨ Improved Version</h4><div class="rw-code">${r.rewrite.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div></div>`:'';
  el.innerHTML=`<div class="rev-result">
    <div class="score-big">
      <div class="score-num" style="color:${col}">${r.overall}</div>
      <div><div class="score-label">Grade ${r.grade||''}</div><div class="score-desc">${r.summary||''}</div></div>
    </div>
    <div class="metrics-row">
      <div class="metric-cell"><div class="metric-val" style="color:var(--teal)">${r.metrics?.readability||0}</div><div class="metric-lbl">Readability</div></div>
      <div class="metric-cell"><div class="metric-val" style="color:var(--purple)">${r.metrics?.correctness||0}</div><div class="metric-lbl">Correctness</div></div>
      <div class="metric-cell"><div class="metric-val" style="color:var(--gold)">${r.metrics?.bestPractices||0}</div><div class="metric-lbl">Best Practices</div></div>
    </div>
    <div class="fb-list">${issues}</div>${rwHtml}
  </div>`;
}

// ── ROADMAP ───────────────────────────────────────────────
const rmData=[
  {done:true, title:'What is Programming?',    sub:'How computers work, your first Hello World', tags:['basics','syntax']},
  {done:true, title:'Variables & Data Types',  sub:'Storing numbers, text, booleans',           tags:['let','const','string']},
  {done:true, title:'Conditions (If/Else)',    sub:'Making decisions in code',                  tags:['if','else','boolean']},
  {active:true,title:'Functions',              sub:'Reusable blocks, parameters, return values', tags:['function','return']},
  {title:'Loops',                              sub:'for/while loops, iterating arrays',          tags:['for','while','forEach']},
  {title:'Arrays & Objects',                  sub:'Collections, key-value pairs, methods',      tags:['array','object','map']},
  {locked:true,title:'DOM & Web Pages',        sub:'Making pages respond to user input',         tags:['DOM','events']},
  {locked:true,title:'APIs & Fetch',           sub:'Getting data from the internet',             tags:['fetch','async','JSON']},
];

function renderRoadmap(){
  const done=rmData.filter(s=>s.done).length;
  const pct=Math.round(done/rmData.length*100);
  document.getElementById('rmPct').textContent=pct+'% done';
  document.getElementById('rmBar').style.width=pct+'%';
  document.getElementById('rmContainer').innerHTML=rmData.map((s,i)=>{
    const dotCls=s.done?'done':s.active?'now':s.locked?'lock':'';
    const icon=s.done?'✓':s.active?'▶':s.locked?'🔒':`${i+1}`;
    const nowBadge=s.active?'<span class="now-badge">You are here</span>':'';
    const learnBtn=s.active?`<button class="btn btn-primary btn-sm" style="margin-top:9px" onclick="quickLearn('Teach me about functions in JavaScript for a complete beginner.')">Start learning →</button>`:'';
    return `<div class="rm-row">
      <div class="rm-spine">
        <div class="rm-dot ${dotCls}">${icon}</div>
        ${i<rmData.length-1?`<div class="rm-line ${s.done?'done':''}"></div>`:''}
      </div>
      <div class="rm-info ${s.active?'now':''}">
        <div class="rm-info-title">${s.title} ${nowBadge}</div>
        <div class="rm-info-sub">${s.sub}</div>
        <div class="rm-chips">${s.tags.map(t=>`<span class="rm-chip">${t}</span>`).join('')}</div>
        ${learnBtn}
      </div>
    </div>`;
  }).join('');
}

function renderAchievements(){
  const ud=currentUser;
  const xp=ud.xp||0;
  const all=[
    {icon:'🌱',name:'First Steps',    desc:'Asked your first question', xp:'+20 XP', earned:(ud.stats||[])[0]>0},
    {icon:'🔥',name:'On a Roll',      desc:'Completed a quiz',          xp:'+30 XP', earned:(ud.stats||[])[1]>0},
    {icon:'🧠',name:'Quiz Fan',       desc:'Completed 3 quizzes',       xp:'+50 XP', earned:(ud.stats||[])[1]>=3},
    {icon:'🔍',name:'Code Critic',    desc:'Got code reviewed',          xp:'+25 XP', earned:(ud.stats||[])[2]>0},
    {icon:'⚡',name:'Century Club',   desc:'Earned 100+ XP',             xp:'+50 XP', earned:xp>=100},
    {icon:'🏆',name:'Dedicated',      desc:'Earned 500+ XP',             xp:'+100 XP',earned:xp>=500},
  ];
  document.getElementById('achievements').innerHTML=all.map(a=>`
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r);${a.earned?'background:var(--teal-l);border:1.5px solid #00c9a725':'background:var(--bg);border:1.5px solid var(--border);opacity:.5'}">
      <span style="font-size:22px">${a.icon}</span>
      <div><div style="font-size:13px;font-weight:700">${a.name}</div><div style="font-size:11.5px;color:var(--text2)">${a.desc}</div></div>
      <span style="font-family:var(--mono);font-size:11.5px;color:${a.earned?'var(--teal)':'var(--text3)'};font-weight:700;margin-left:auto">${a.earned?a.xp:'Locked'}</span>
    </div>`).join('');
}

// ── TOAST ─────────────────────────────────────────────────
function toast(msg){
  const t=document.getElementById('toast');
  document.getElementById('toastMsg').textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3000);
}