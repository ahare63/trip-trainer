"use strict";
/* ---------- study ---------- */
let session=null, studyLetters=false;
function breakdown(k,letters,toggle){
  const e=PARTS[k.id];
  if(!e)return "";
  const kr=k.c==="kr",lang=C[k.c].hl;
  const chunk=c=>letters&&kr?[...c].map(ch=>`<span class="blk">${splitHangul(ch).map(l=>`<span>${h(l)}</span>`).join("")}</span>`).join(""):h(c);
  return `<div class="breakdown"><div class="parts">${e.parts.map(([c,g])=>`<span class="part"><span class="chunk" lang="${lang}">${chunk(c)}</span><span class="gloss">${h(g)}</span></span>`).join("")}</div>${e.lit?`<div class="lit">${h(e.lit)}</div>`:""}${kr?`<button class="btn ghost small" ${toggle} aria-pressed="${letters}">Show letters</button>`:""}</div>`;
}
function buildQueue(filter,ahead){
  const t=today(),w=curWeek();
  const ok=k=>filter==="all"||k.c===filter;
  const cards=studyCards();
  const due=cards.filter(k=>ok(k)&&state.cards[k.id]&&state.cards[k.id].due<=t);
  let fresh=cards.filter(k=>ok(k)&&!state.cards[k.id]&&(k.wk<=w||ahead)).sort((a,b)=>a.wk-b.wk||a.ord-b.ord);
  const allow=ahead?8:Math.max(0,NEW_PER_DAY-(state.day===t?state.newDone:0));
  return shuffle(due).concat(fresh.slice(0,allow)).map(k=>({k,retry:false}));
}
function startSession(filter,ahead,practice){
  let q=buildQueue(filter,ahead);
  if(practice){q=shuffle(studyCards().filter(k=>(filter==="all"||k.c===filter)&&state.cards[k.id])).slice(0,12).map(k=>({k,retry:true}))}
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
/* skip: takes every remaining copy of the card out of the session, ungraded, and offers Undo */
let skipUndo=null;
function skipNow(id){
  if(!session)return; const it=session.q[session.i]; if(!it||it.k.id!==id||it.k.cat==="trip")return;
  session.q=session.q.slice(0,session.i).concat(session.q.slice(session.i).filter(x=>x.k.id!==id));session.shown=false;
  skipUndo={id,it,session};setSkipped(id,true);renderStudy();
  toast("Skipped “"+it.k.en+"”. It stays in the phrasebook.",`<button class="btn ghost small" data-undoskip="${h(id)}">Undo</button>`);
}
function undoSkip(id){
  setSkipped(id,false);
  /* only back into the session it came from, and only if it isn’t already queued there */
  if(skipUndo&&skipUndo.id===id&&session&&session===skipUndo.session&&!session.q.slice(session.i).some(x=>x.k.id===id)){session.q.splice(session.i,0,skipUndo.it);session.shown=false}
  skipUndo=null;$("#toast").style.display="none";
  render();
}
function renderStudy(){
  if(!session)startSession("all");
  const el=$("#v-study"),left=session.q.length-session.i;
  const chips=`<div class="chips" role="group" aria-label="Country">${[["all","All three"],["tw","Taiwan"],["kr","Korea"],["jp","Japan"]].map(x=>`<button class="chip" data-filter="${x[0]}" aria-pressed="${session.filter===x[0]}">${x[1]}</button>`).join("")}</div>`;
  if(left<=0){
    const more=studyCards().some(k=>!state.cards[k.id]&&(session.filter==="all"||k.c===session.filter));
    const any=studyCards().some(k=>state.cards[k.id]&&(session.filter==="all"||k.c===session.filter));
    el.innerHTML=`<h2>Today’s cards</h2><div style="margin-top:14px">${chips}</div>
    <div class="panel"><h3>${session.done?"Done for today":"Nothing due right now"}</h3>
    <p style="margin-top:8px;max-width:56ch">${session.done?`You went through ${session.done} card${session.done===1?"":"s"}. `:""}Cards you got right come back after a growing gap: one day, then two, four, eight and sixteen. Cards you missed return tomorrow.</p>
    <div class="row">${more?`<button class="btn" data-ahead="1">Learn 8 more new cards</button>`:""}${any?`<button class="btn ghost" data-practice="1">Practice 12 at random</button>`:""}<a class="btn ghost" href="#scripts">Open the Hangul drill</a></div></div>`;
    return;
  }
  const it=session.q[session.i],k=it.k,recog=isRecog(k),isNew=!state.cards[k.id]&&!it.retry;
  /* dish notes describe the food and stay in view; every other note is a usage tip and goes in More info */
  const more=withNote=>`<details class="more"${state.more?" open":""}><summary>More info</summary>${breakdown(k,studyLetters,'data-letters="1"')}
    <div class="rom"><small>Standard romanization</small>${h(k.rom)}</div>${withNote&&k.note?`<div class="more-note">${h(k.note)}</div>`:""}</details>`;
  let body;
  if(recog){
    body=`<div class="ask">${isDish(k)?"You see this on a menu. What is it?":"What does this say?"}</div>
      <div class="nat${signClass(k)}" lang="${C[k.c].hl}">${h(k.nat)}</div>
      ${isDish(k)?`<div class="say"><small>Sounds like</small>${h(k.say)}</div>`:""}
      ${session.shown?`<div class="note" style="border-top-style:solid">${dishPhoto(k)}${cardIcon(k)}<div class="en" style="margin:0 0 6px">${h(k.en)}</div>${!isDish(k)?`<div class="say" style="margin:0 0 6px"><small>Sounds like</small>${h(k.say)}</div>`:""}${toneLine(k)}${isDish(k)?h(k.note):""}</div>${more(!isDish(k))}`:""}`;
  }else{
    const sit=situationOf(k);
    body=`${sit?`<div class="situation">${h(sit)}</div>`:""}<div class="ask">How do you say this in ${C[k.c].tongue}?</div>${cardIcon(k)}<div class="en">${h(k.en)}</div>
      ${session.shown?`<div style="margin-top:14px"><div class="nat" lang="${C[k.c].hl}">${h(k.nat)}</div>
      <div class="say"><small>Sounds like</small>${h(k.say)}</div>${toneLine(k)}${more(true)}</div>`:""}`;
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
    ${k.cat!=="trip"&&!session.ess?`<div class="skip"><button class="btn ghost small" data-skip="${h(k.id)}">Skip this card</button></div>`:""}
  </div>
  <p class="meta" style="margin-top:12px"><label><input type="checkbox" id="auto" ${state.auto?"checked":""}> Play the audio when the answer appears</label><br>Keyboard: space shows the answer, 1 is still learning, 2 is got it.</p>`;
}
