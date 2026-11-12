"use strict";
/* ---------- study ---------- */
let session=null;
function buildQueue(filter,ahead){
  const t=today(),w=curWeek();
  const ok=k=>filter==="all"||k.c===filter;
  const due=CARDS.filter(k=>ok(k)&&state.cards[k.id]&&state.cards[k.id].due<=t);
  let fresh=CARDS.filter(k=>ok(k)&&!state.cards[k.id]&&(k.wk<=w||ahead)).sort((a,b)=>a.wk-b.wk||a.ord-b.ord);
  const allow=ahead?8:Math.max(0,NEW_PER_DAY-(state.day===t?state.newDone:0));
  return shuffle(due).concat(fresh.slice(0,allow)).map(k=>({k,retry:false}));
}
function startSession(filter,ahead,practice){
  let q=buildQueue(filter,ahead);
  if(practice){q=shuffle(CARDS.filter(k=>(filter==="all"||k.c===filter)&&state.cards[k.id])).slice(0,12).map(k=>({k,retry:true}))}
  session={filter,q,i:0,shown:false,done:0,practice:!!practice};
}
function grade(ok){
  const it=session.q[session.i]; if(!it)return; const k=it.k,t=today();
  if(!session.practice){
    const p=state.cards[k.id];
    if(!p){if(state.day!==t){state.day=t;state.newDone=0}state.newDone++}
    if(state.lastDay!==t){state.streak=state.lastDay===t-1?state.streak+1:1;state.lastDay=t}
    if(ok){if(it.retry){state.cards[k.id]={b:1,due:t+1}}else{const b=Math.min(5,(p?p.b:0)+1);state.cards[k.id]={b,due:t+GAP[b]}}}
    else{state.cards[k.id]={b:1,due:t+1}}
    commit();
  }
  if(!ok)session.q.push({k,retry:true}); else session.done++;
  session.i++;session.shown=false;renderStudy();
}
function renderStudy(){
  if(!session)startSession("all");
  const el=$("#v-study"),left=session.q.length-session.i;
  const chips=`<div class="chips" role="group" aria-label="Country">${[["all","All three"],["tw","Taiwan"],["kr","Korea"],["jp","Japan"]].map(x=>`<button class="chip" data-filter="${x[0]}" aria-pressed="${session.filter===x[0]}">${x[1]}</button>`).join("")}</div>`;
  if(left<=0){
    const more=CARDS.some(k=>!state.cards[k.id]&&(session.filter==="all"||k.c===session.filter));
    const any=CARDS.some(k=>state.cards[k.id]&&(session.filter==="all"||k.c===session.filter));
    el.innerHTML=`<h2>Today’s cards</h2><div style="margin-top:14px">${chips}</div>
    <div class="panel"><h3>${session.done?"Done for today":"Nothing due right now"}</h3>
    <p style="margin-top:8px;max-width:56ch">${session.done?`You went through ${session.done} card${session.done===1?"":"s"}. `:""}Cards you got right come back after a growing gap: one day, then two, four, eight and sixteen. Cards you missed return tomorrow.</p>
    <div class="row">${more?`<button class="btn" data-ahead="1">Learn 8 more new cards</button>`:""}${any?`<button class="btn ghost" data-practice="1">Practice 12 at random</button>`:""}<a class="btn ghost" href="#scripts">Open the Hangul drill</a></div></div>`;
    return;
  }
  const it=session.q[session.i],k=it.k,recog=RECOG[k.cat],isNew=!state.cards[k.id]&&!it.retry;
  const answer=`<div class="nat" lang="${C[k.c].hl}">${h(k.nat)}</div>
    <div class="say"><small>Sounds like</small>${h(k.say)}</div>
    <div class="rom"><small>Standard romanization</small>${h(k.rom)}</div>${toneLine(k)}`;
  let body;
  if(recog){
    body=`<div class="ask">${k.cat==="dish"?"You see this on a menu. What is it?":"What does this say?"}</div>
      <div class="nat${signClass(k)}" lang="${C[k.c].hl}">${h(k.nat)}</div>
      ${k.cat==="dish"?`<div class="say"><small>Sounds like</small>${h(k.say)}</div>`:""}
      ${session.shown?`<div class="note" style="border-top-style:solid">${dishPhoto(k)}<div class="en" style="margin:0 0 6px">${h(k.en)}</div>${k.cat!=="dish"?`<div class="say" style="margin:0 0 6px"><small>Sounds like</small>${h(k.say)}</div><div class="rom" style="margin-bottom:8px"><small>Standard romanization</small>${h(k.rom)}</div>${toneLine(k)}`:`<div class="rom" style="margin-bottom:8px">${h(k.rom)}</div>${toneLine(k)}`}${h(k.note)}</div>`:""}`;
  }else{
    const sit=situationOf(k);
    body=`${sit?`<div class="situation">${h(sit)}</div>`:""}<div class="ask">How do you say this in ${C[k.c].tongue}?</div><div class="en">${h(k.en)}</div>
      ${session.shown?`<div style="margin-top:14px">${answer}</div>${k.note?`<div class="note">${h(k.note)}</div>`:""}`:""}`;
  }
  el.innerHTML=`<h2>Today’s cards</h2><div style="margin-top:14px">${chips}</div>
  <div class="card" data-c="${k.c}">
    <div class="top"><span class="row" style="gap:8px">${bul(k.c)}<span>${CATS[k.cat]}${isNew?", new":""}</span></span><span>${session.practice?"Practice, ":""}${left} left</span></div>
    ${body}
    <div class="acts">
      ${session.shown||recog?`<div class="wide">${hearBtn(k.nat,k.c)}</div>`:""}
      ${session.shown?`<button class="btn ghost" data-grade="0">Still learning</button><button class="btn" data-grade="1">Got it</button>`
        :`<button class="btn wide" data-show="1">Show answer</button>`}
    </div>
  </div>
  <p class="meta" style="margin-top:12px"><label><input type="checkbox" id="auto" ${state.auto?"checked":""}> Play the audio when the answer appears</label><br>Keyboard: space shows the answer, 1 is still learning, 2 is got it.</p>`;
}
