'use strict';
let app = null;
let busyChat = false;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titles = { dashboard:'Overview', routine:'My Routine', coach:'AI Coach', progress:'Progress', profile:'My Profile', settings:'AI Settings' };
const showToast = message => {const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove('show'),3300)};
async function api(path, method='GET', body){const r=await fetch('/api/'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});let data={};try{data=await r.json()}catch(_){data={}};if(r.status===401){showAuth(false);throw Error('Login required')}if(!r.ok)throw Error(data.error||data.detail||'Request failed');return data}
async function publicApi(path, method='GET', body){const r=await fetch('/api/'+path,{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});let data={};try{data=await r.json()}catch(_){data={}};if(!r.ok)throw Error(data.error||data.detail||'Request failed');return data}
function showAuth(setup){const gate=$('#authGate'); if(!gate)return; gate.classList.remove('hidden'); $('#setupForm').classList.toggle('hidden',!setup); $('#loginForm').classList.toggle('hidden',!!setup); $('#authTitle').textContent=setup?'Create admin password':'Unlock HAMZA OS'; $('#authSubtitle').textContent=setup?'First-time production setup. This password protects your private dashboard on this device/server.':'Enter your admin password to open the dashboard.'; setTimeout(()=> (setup?$('#setupPassword'):$('#loginPassword'))?.focus(),50)}
function hideAuth(){const gate=$('#authGate'); if(gate)gate.classList.add('hidden')}
function prettyDate(day){return new Date(day+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
function weekday(day){return new Date(day+'T12:00:00').toLocaleDateString('en-US',{weekday:'short'})}
function percent(done,total){return total?Math.round(done/total*100):0}
function taskMarkup(t){return `<label class="task-row ${t.done?'done':''}"><input class="task-check" type="checkbox" data-task="${Number(t.id)}" ${t.done?'checked':''} aria-label="Mark ${esc(t.title)} completed"><div class="task-content"><strong>${esc(t.title)}</strong><p>${esc(t.detail)}</p></div><div class="task-meta"><span class="task-time">${esc(t.due_time)}</span><span class="task-cat">${esc(t.category)}</span></div></label>`}
function navigate(page){if(!titles[page])return;$$('.page').forEach(p=>p.classList.toggle('hidden',p.id!=='page-'+page));$$('[data-page]').forEach(el=>el.classList.toggle('active',el.dataset.page===page));$('#crumbCurrent').textContent=titles[page];window.scrollTo({top:0,behavior:'instant'});if(page==='coach')$('#chatInput').focus()}
function render(){if(!app)return;const {date,profile,plan,tasks,checkin,history,ai_enabled}=app;const done=tasks.filter(t=>t.done).length;const pct=percent(done,tasks.length);let h=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Karachi',hour:'numeric',hour12:false}).format(new Date());let greeting=Number(h)<12?'Good morning':Number(h)<17?'Good afternoon':'Good evening';$('#greetName').textContent=profile.name.split(' ')[0];$('.page-head h1').childNodes[0].textContent=greeting+', ';$('#sideName').textContent=profile.name;$('#topDate').textContent=prettyDate(date);$('#heroDate').textContent=prettyDate(date);$('#planMode').textContent=plan.source==='Ollama'?'OLLAMA PERSONALIZED':'STARTER MODE';$('#heroHeadline').textContent=plan.headline;$('#heroNote').textContent=plan.coach_note;$('#completionPct').textContent=pct;$('#completionBar').style.width=pct+'%';$('#completionText').textContent=`${done} of ${tasks.length} tasks completed`;$('#doneCount').textContent=done;$('#ofCount').textContent='/ '+tasks.length;$('#sleepStat').textContent=checkin?.sleep_hours??'—';$('#energyStat').textContent=checkin?.energy??'—';$('#dashboardTasks').innerHTML=tasks.slice(0,5).map(taskMarkup).join('');$('#aiStatus').textContent=ai_enabled?app.ai_provider+' • '+app.ai_model:'Starter mode • configure Ollama';$('#routineDate').textContent=prettyDate(date)+' · Complete tasks as you go';$('#routinePct').textContent=pct+'%';$('#ringPct').textContent=pct+'%';$('#ring').style.background=`conic-gradient(#fff ${pct*3.6}deg,#404040 0deg)`;$('#routineHint').textContent=`${done} of ${tasks.length} activities marked complete.`;
let groups=['Morning','Afternoon','Evening','Night'];let icons={Morning:'☀',Afternoon:'◷',Evening:'◑',Night:'☾'};$('#routineGroups').innerHTML=groups.map(g=>{const list=tasks.filter(t=>t.daypart===g);return list.length?`<div class="group-panel"><div class="group-title"><h3>${icons[g]} &nbsp;${g}</h3><span>${list.filter(t=>t.done).length}/${list.length} DONE</span></div>${list.map(taskMarkup).join('')}</div>`:''}).join('');$('#coachBadge').textContent=ai_enabled?'OLLAMA CONNECTED':'STARTER MODE';$('#chatHeadStatus').textContent=ai_enabled?app.ai_provider+' · '+app.ai_model:'Configure Ollama to start chatting';renderHistory(history);renderProfile(profile);renderSettings(app.ai_settings, plan, done);renderChat(app.messages)}
function renderHistory(history){const byDate=new Map(history.map(x=>[x.day,x]));const days=Array.from({length:7},(_,i)=>{let d=new Date(app.date+'T12:00:00');d.setDate(d.getDate()-(6-i));return d.toISOString().slice(0,10)});$('#weeklyBars').innerHTML=days.map(d=>{let r=byDate.get(d);let pc=r?percent(r.completed,r.total):0;return `<div class="bar-col" title="${esc(d)}: ${pc}%"><div class="bar-track"><div class="bar-fill" style="height:${pc}%"></div></div><span>${weekday(d)}</span></div>`}).join('');const entries=history.filter(h=>h.total>0);let total=entries.reduce((a,r)=>a+r.total,0),completed=entries.reduce((a,r)=>a+r.completed,0);$('#weeklyDetails').textContent=`${completed} of ${total} checked tasks across ${entries.length} recorded day(s). Missed days are information, not failure.`;$('#sleepHistory').innerHTML=history.filter(r=>r.sleep_hours!==null).slice(0,5).map(r=>`<div class="history-row"><span>${weekday(r.day)} · ${prettyDate(r.day)}</span><strong>${esc(r.sleep_hours)} hrs</strong></div>`).join('')||'<p class="muted">No sleep check-ins yet.</p>';$('#moodHistory').innerHTML=history.filter(r=>r.mood).slice(0,5).map(r=>`<div class="history-row"><span>${weekday(r.day)} · ${prettyDate(r.day)}</span><strong>${esc(r.mood)} · ${esc(r.energy)}/5</strong></div>`).join('')||'<p class="muted">No mood check-ins yet.</p>'}
function renderProfile(p){$('#profileHeader').textContent=p.name;const form=$('#profileForm');for(const key of ['name','wake_time','sleep_time','focus','note','height_cm','weight_kg'])if(form.elements[key])form.elements[key].value=p[key]??''}
function renderSettings(config,plan,done){
  if(!config)return;
  const labels={saved:'API key saved on this device',environment:'Connected via environment variable',local:'Local Ollama is enabled',error:'Saved key could not be opened',missing:'No API key saved'};
  const hints={saved:'You do not need to enter it again, even after restarting the app.',environment:'An existing terminal/server key is active. Saving here will take priority.',local:'Local models run without a Cloud key. Restart the server in Cloud mode to save one.',error:'Replace the key to repair the local vault.',missing:'Enter a new Ollama Cloud API key below to enable your coach.'};
  $('#settingsStatus').textContent=labels[config.status]||'Unknown status';
  $('#settingsStatusHelp').textContent=hints[config.status]||'';
  $('#settingsChip').textContent=config.configured?'CONFIGURED':'NOT CONFIGURED';
  $('#settingsChip').classList.toggle('connected',!!config.configured);
  $('#settingsDot').classList.toggle('configured',!!config.configured);
  $('#settingsModel').textContent=config.model;
  $('#settingsProvider').textContent=config.provider;
  $('#removeKey').disabled=config.status!=='saved'&&config.status!=='error';
  $('#saveKey').disabled=config.status==='local';
  $('#ollamaKey').disabled=config.status==='local';
  const canReplan=config.configured&&plan.source==='starter'&&done===0;
  $('#replanNow').disabled=!canReplan;
  $('#replanHelp').textContent=plan.source==='Ollama'?'Today already uses an Ollama plan.':done>0?'Some tasks are already checked. Keep today’s progress; tomorrow will use AI.':!config.configured?'Save your key to enable AI planning.':'You can replace today’s untouched starter checklist.';
}
function renderChat(messages){if(!messages.length)return;$('#chatMessages').innerHTML=messages.map(m=>`<div class="message ${m.role==='user'?'user':'assistant'}"><div class="message-role">${m.role==='user'?'YOU':'HAMZA AI'}</div><div class="bubble">${esc(m.content)}</div></div>`).join('');$('#chatMessages').scrollTop=$('#chatMessages').scrollHeight}
async function refresh(){try{app=await api('state');render()}catch(e){showToast('Could not load dashboard: '+e.message)}}
// Event delegation supports both dashboard and routine tasks.
document.addEventListener('change',async e=>{if(!e.target.matches('[data-task]'))return;let input=e.target;input.disabled=true;try{await api('task','POST',{id:Number(input.dataset.task),done:input.checked});app.tasks.find(t=>t.id===Number(input.dataset.task)).done=input.checked?1:0;render();}catch(err){input.checked=!input.checked;showToast(err.message)}finally{input.disabled=false}});
document.addEventListener('click',e=>{const goto=e.target.closest('[data-goto]');if(goto)navigate(goto.dataset.goto);const nav=e.target.closest('[data-page]');if(nav)navigate(nav.dataset.page)});
for(let id of ['checkinTop','checkinCard','checkinRoutine'])$('#'+id).addEventListener('click',()=>{const f=$('#checkinForm');f.elements.sleep_hours.value=app.checkin?.sleep_hours??'';f.elements.energy.value=app.checkin?.energy??3;f.elements.mood.value=app.checkin?.mood??'Okay';f.elements.notes.value=app.checkin?.notes??'';$('#energyLabel').textContent=f.elements.energy.value+' / 5';$('#checkinDialog').showModal()});$('#closeCheckin').onclick=()=>$('#checkinDialog').close();$('#energyRange').oninput=e=>$('#energyLabel').textContent=e.target.value+' / 5';
$('#checkinForm').addEventListener('submit',async e=>{e.preventDefault();let f=e.target;try{await api('checkin','POST',{sleep_hours:f.elements.sleep_hours.value,energy:Number(f.elements.energy.value),mood:f.elements.mood.value,notes:f.elements.notes.value});$('#checkinDialog').close();showToast('Check-in saved! Next plan will use it.');await refresh()}catch(err){showToast(err.message)}});
$('#toggleKey').addEventListener('click',()=>{
  const input=$('#ollamaKey'),show=input.type==='password';
  input.type=show?'text':'password';
  $('#toggleKey').textContent=show?'Hide':'Show';
  $('#toggleKey').setAttribute('aria-pressed',String(show));
});
$('#apiKeyForm').addEventListener('submit',async e=>{
  e.preventDefault();const input=$('#ollamaKey'),key=input.value.trim(),button=$('#saveKey');
  if(!key){showToast('Enter a new Ollama API key.');return}
  button.disabled=true;$('#keyFeedback').textContent='Saving on this device…';
  try{
    await api('settings/key','POST',{api_key:key});
    input.value='';input.type='password';$('#toggleKey').textContent='Show';
    $('#keyFeedback').textContent='Saved. You will not need to enter your API key again.';
    showToast('Ollama API key saved.');await refresh();
  }catch(err){$('#keyFeedback').textContent=err.message;showToast(err.message)}
  finally{button.disabled=false}
});
$('#removeKey').addEventListener('click',async()=>{
  if(!window.confirm('Remove the stored Ollama Cloud key from this device?'))return;
  try{await api('settings/key/remove','POST',{});$('#ollamaKey').value='';$('#keyFeedback').textContent='Saved API key removed from this device.';await refresh();showToast('Saved key removed.')}catch(err){showToast(err.message)}
});
$('#replanNow').addEventListener('click',async()=>{
  const button=$('#replanNow');button.disabled=true;button.textContent='Generating…';
  try{await api('replan','POST',{});showToast('Today’s AI plan is ready!');await refresh();navigate('routine')}
  catch(err){showToast(err.message);$('#replanHelp').textContent=err.message}
  finally{button.textContent='Generate AI plan ↗';if(app)renderSettings(app.ai_settings,app.plan,app.tasks.filter(t=>t.done).length)}
});
$('#profileForm').addEventListener('submit',async e=>{e.preventDefault();let f=e.target;try{await api('profile','POST',Object.fromEntries(new FormData(f).entries()));$('#profileSaved').textContent='Saved. Tomorrow’s plan will use your updated details.';showToast('Profile saved');await refresh()}catch(err){showToast(err.message)}});
$('#chatForm').addEventListener('submit',async e=>{e.preventDefault();if(busyChat)return;const field=$('#chatInput');const value=field.value.trim();if(!value)return;busyChat=true;$('#sendChat').disabled=true;field.value='';const list=$('#chatMessages');list.insertAdjacentHTML('beforeend',`<div class="message user"><div class="message-role">YOU</div><div class="bubble">${esc(value)}</div></div><div class="message assistant" id="typing"><div class="message-role">HAMZA AI</div><div class="bubble">Thinking…</div></div>`);list.scrollTop=list.scrollHeight;try{const answer=await api('chat','POST',{message:value});$('#typing').remove();list.insertAdjacentHTML('beforeend',`<div class="message assistant"><div class="message-role">HAMZA AI</div><div class="bubble">${esc(answer.reply)}</div></div>`);app.messages.push({role:'user',content:value},{role:'assistant',content:answer.reply});}catch(err){$('#typing').remove();list.insertAdjacentHTML('beforeend',`<div class="message assistant"><div class="message-role">SYSTEM</div><div class="bubble">${esc(err.message)}</div></div>`)}finally{busyChat=false;$('#sendChat').disabled=false;list.scrollTop=list.scrollHeight}});
$('#notifyBtn').addEventListener('click',async()=>{if(!('Notification' in window)){showToast('This browser does not support notifications.');return}if(!window.isSecureContext){showToast('Notifications need HTTPS or localhost.');return}let p=await Notification.requestPermission();showToast(p==='granted'?'Reminder permission enabled while app is open.':'Notification permission not granted.')});
function remind(){if(!app||!('Notification' in window)||Notification.permission!=='granted')return;const clock=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Karachi',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());const mins=x=>{let [h,m]=x.split(':').map(Number);return h*60+m};for(const t of app.tasks){let key='reminded:'+app.date+':'+t.id;let elapsed=mins(clock)-mins(t.due_time);if(!t.done&&elapsed>=0&&elapsed<=10&&!sessionStorage.getItem(key)){sessionStorage.setItem(key,'1');new Notification('HAMZA OS · Task reminder',{body:t.title+' — '+t.detail,icon:'/icon.svg'})}}}

$('#setupForm')?.addEventListener('submit',async e=>{e.preventDefault();const password=$('#setupPassword').value;try{$('#authFeedback').textContent='Creating secure profile…';await publicApi('auth/setup','POST',{password});hideAuth();showToast('Password created. Dashboard unlocked.');await refresh()}catch(err){$('#authFeedback').textContent=err.message}});
$('#loginForm')?.addEventListener('submit',async e=>{e.preventDefault();const password=$('#loginPassword').value;try{$('#authFeedback').textContent='Checking password…';await publicApi('auth/login','POST',{password});hideAuth();$('#loginPassword').value='';showToast('Welcome back, Hamza.');await refresh()}catch(err){$('#authFeedback').textContent=err.message}});
async function boot(){try{const auth=await publicApi('auth/status'); if(auth.setup_required){showAuth(true);return} if(!auth.authenticated){showAuth(false);return} hideAuth(); await refresh(); setInterval(async()=>{if(!app)return;const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Karachi',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));const date=`${parts.year}-${parts.month}-${parts.day}`;if(date!==app.date)await refresh();remind()},60000);}catch(err){showToast('Startup failed: '+err.message)}}
boot();
