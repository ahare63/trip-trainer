"use strict";
/* ---------- conversations: role-plays with a partner limited to the learner's cards (js/partner.js) ---------- */
const tk={c:"",def:null,scene:null,busy:false,step:"",run:0,text:"",more:false,en:{},msg:"",words:{},focus:false};
const TALK_CHIPS=12;
const TALK_HINT={tw:"wo yao zhege",kr:"igeo juseyo",jp:"kore o kudasai"};
const talkMsg=code=>code==="no_key"?"Add your Anthropic API key on the Your trip tab first. Nothing was added.":aiMessage(code);
const talkDefaultC=()=>["tw","kr","jp"].find(c=>talkVocab(c,state.cards,CARDS,[]).length>=TALK_MIN_VOCAB)||"tw";
const talkRefuse=code=>async()=>{throw {code}};

function talkLineHTML(s,e,i){
  const L=e.line,lang=C[s.c].hl,open=!!tk.en[i];
  const fresh=s.newWords.filter(w=>L.segs.some(g=>g.new&&g.t.trim()===w.t));
  return `<div class="t-line t-them"><div class="t-who">${h(s.def.who)}</div>
    <div class="t-nat" lang="${lang}">${L.segs.map(g=>g.new?`<mark class="t-new">${h(g.t)}</mark>`:h(g.t)).join("")}</div>
    <div class="e-say">${h(L.say)}</div>${L.rom?`<div class="e-rom">${h(L.rom)}</div>`:""}
    ${fresh.map(w=>`<div class="t-newword"><span class="t-tag">New word</span> <span lang="${lang}">${h(w.t)}</span> ${h(w.say)}, “${h(w.en)}”</div>`).join("")}
    <div class="t-acts">${hearBtn(L.text,s.c)}<button class="btn ghost small" data-talk="en" data-i="${i}" aria-expanded="${open}">English</button></div>
    ${open?`<div class="t-en">${h(L.en)}</div>`:""}</div>`}
function talkLogHTML(s){
  const lang=C[s.c].hl;
  return s.log.map((e,i)=>{
    if(e.who==="partner")return talkLineHTML(s,e,i);
    if(e.who==="you")return `<div class="t-line t-you"><div class="t-who">You</div><div class="t-said"${TRIP_CJK.test(e.text)?` lang="${lang}"`:""}>${h(e.text)}</div></div>`;
    const a=e.a;
    return `<div class="t-line t-coach"><div class="t-who">How to say it <span class="meta">(no turn used)</span></div><div class="meta">You asked: ${h(e.q)}</div>
      <div class="t-nat" lang="${lang}">${h(a.nat)}</div><div class="e-say">${h(a.say)}</div>${a.rom?`<div class="e-rom">${h(a.rom)}</div>`:""}<div>${h(a.en)}</div>
      <div class="t-acts">${hearBtn(a.nat,s.c)}</div></div>`}).join("")}
function talkReplyHTML(s){
  const chips=talkChips(s),shown=tk.more?chips:chips.slice(0,TALK_CHIPS),off=tk.busy?" disabled":"",lang=C[s.c].hl;
  return `<div class="t-reply">
    <p class="meta">Tap phrases to build a reply, or type in romanization or English. Ask “How do I say …?” for help; that doesn’t use a turn.</p>
    ${chips.length?`<div class="chips t-chips" role="group" aria-label="Phrases you know">${shown.map((k,i)=>`<button class="chip t-chip" data-talk="chip" data-i="${i}"${off}><span lang="${lang}">${h(k.nat)}</span><small>${h(k.en)}</small></button>`).join("")}
      ${chips.length>TALK_CHIPS?`<button class="chip" data-talk="more" aria-expanded="${tk.more}"${off}>${tk.more?"Fewer phrases":"All "+chips.length+" phrases"}</button>`:""}</div>`:""}
    <div class="t-send"><input class="ta" id="talk-text" maxlength="${TALK_REPLY_MAX}" autocomplete="off" placeholder="${h(TALK_HINT[s.c])}, or “How do I say…?”" aria-label="Your reply" value="${h(tk.text)}"${off}>
      <button class="btn" data-talk="send"${off}>Send</button></div></div>`}
function talkFeedbackHTML(s){
  const f=s.feedback,lang=C[s.c].hl,off=tk.busy?" disabled":"";
  const words=s.newWords.map((w,i)=>{const m=tk.words[i]||{};
    return `<div class="t-word"><div><span class="t-nat-s" lang="${lang}">${h(w.t)}</span> <span class="e-say">${h(w.say)}</span> <span class="meta">“${h(w.en)}”</span></div>
      <div class="t-acts">${hearBtn(w.t,s.c)}<button class="btn small" data-talk="add" data-i="${i}"${off||m.ok?" disabled":""}>${m.busy?"Adding…":m.ok?"Added":"Add as a card"}</button></div>
      ${m.busy&&tk.step?`<p class="meta" aria-live="polite">${h(tk.step)}</p>`:""}${m.err?`<p class="err" role="alert">${h(m.err)}</p>`:""}${m.ok?`<p class="good" role="status">${h(m.ok)}</p>`:""}</div>`}).join("");
  return `<div class="t-fb"><h4>How it went</h4>
    ${f?`${f.worked.length?`<h5>What worked</h5><ul>${f.worked.map(x=>`<li>${h(x)}</li>`).join("")}</ul>`:""}
      ${f.instead.length?`<h5>What to say instead</h5>${f.instead.map(x=>`<div class="t-instead">${x.you?`<div class="meta">You said: ${h(x.you)}</div>`:""}
        <div class="t-nat" lang="${lang}">${h(x.nat)}</div><div class="e-say">${h(x.say)}</div>${x.rom?`<div class="e-rom">${h(x.rom)}</div>`:""}
        <div>${h(x.en)}${x.why?` <span class="meta">${h(x.why)}</span>`:""}</div><div class="t-acts">${hearBtn(x.nat,s.c)}</div></div>`).join("")}`:""}`
      :tk.busy&&!s.end?`<p class="meta" aria-live="polite">${h(tk.step)}</p>`:`<p class="err" role="alert">${h(s.end)}</p>`}
    <h5>New words from this scene</h5>
    ${words||`<p class="meta">No new words came up.</p>`}
    ${words?`<p class="meta">A word you add joins your deck as a trip card, after the same checks as quick add.</p>`:""}
    <div class="row" style="margin-top:14px"><button class="btn" data-talk="close"${off}>Back to scenes</button></div></div>`}
function talkSceneHTML(){
  const d=tk.def,s=tk.scene,talking=!s||s.stage==="talk";
  const turns=s?`${s.turns} of ${TALK_MIN}–${TALK_MAX} turns`:"Starting";
  return `<div class="panel t-scene" id="talk-scene" data-c="${d.c}">
    <div class="t-head"><div><h3>${h(d.title)}</h3><div class="meta">${bul(d.c)} ${turns}</div></div>
      ${talking?`<button class="btn ghost small" data-talk="stop">Stop</button>`:""}</div>
    <p class="t-setup">${h(d.setup)}</p>
    <div class="t-log" aria-live="polite">${s?talkLogHTML(s):""}</div>
    ${talking&&tk.busy?`<p class="meta t-wait">${h(tk.step)}</p>`:""}
    ${s&&s.stage==="talk"?talkReplyHTML(s):""}
    ${s&&s.stage==="ended"?`<p class="err" role="alert">${h(s.end)}</p><div class="row"><button class="btn" data-talk="close">Back to scenes</button></div>`:""}
    ${s&&s.stage==="feedback"?talkFeedbackHTML(s):""}</div>`}
function talkListHTML(){
  const n=talkVocab(tk.c,state.cards,CARDS,[]).length,why=talkReady(SCENES.find(x=>x.c===tk.c),state.cards,CARDS);
  const off=why||AI.mode==="none"||tk.busy?" disabled":"";
  return `<div class="chips" role="group" aria-label="Language" style="margin-top:18px">${["tw","kr","jp"].map(c=>`<button class="chip" data-talkc="${c}" aria-pressed="${tk.c===c}">${C[c].tongue}</button>`).join("")}</div>
    ${tk.msg?`<p class="meta" role="status" style="margin-top:12px">${h(tk.msg)}</p>`:""}
    <p class="meta" style="margin-top:12px">${why?h(why):`The partner can use the ${n} ${C[tk.c].tongue} card${n===1?"":"s"} you’ve seen.`}</p>
    <div class="t-scenes">${SCENES.filter(x=>x.c===tk.c).map(x=>`<div class="entry t-item" data-c="${x.c}"><div><div class="e-en">${h(x.title)}</div><div class="meta">${h(x.setup)}</div></div>
      <button class="btn small" data-talk="start" data-id="${h(x.id)}"${off}>Start</button></div>`).join("")}</div>`}
function renderTalk(){
  if(!tk.c)tk.c=talkDefaultC();
  const note=AI.mode==="none"?`<p class="meta">Claude isn’t available in this view of the page, so conversations can’t start.</p>`
    :AI.mode==="key"&&!getKey()?`<p class="meta">This copy of the page runs outside Claude, so conversations need your own Anthropic API key, and each turn is billed to it. <a href="#trip">Add it on Your trip</a>.</p>`:"";
  $("#v-talk").innerHTML=`<h2>Talk</h2>
    <p class="lede">Short role-plays of travel situations. The other person uses only words from cards you’ve studied, plus at most two new words per scene, which are marked. After six to eight turns you get feedback. Nothing is saved unless you add a new word as a card.</p>
    ${note}${tk.def?talkSceneHTML():talkListHTML()}`;
  if(tk.focus&&!tk.busy){tk.focus=false;const f=$("#talk-text");if(f)f.focus({preventScroll:true})}
}
function talkReset(msg){tk.run++;tk.def=null;tk.scene=null;tk.busy=false;tk.step="";tk.text="";tk.more=false;tk.en={};tk.words={};tk.msg=msg||""}
const talkStepText=(who,a)=>a==="feedback"?"Writing your feedback.":a==="coach"?"Working out how to say it.":who+" is answering.";
async function talkBegin(id){
  const def=SCENES.find(x=>x.id===id); if(!def||tk.busy)return;
  talkReset();tk.def=def;tk.busy=true;tk.step=def.who+" is starting the scene.";renderTalk();
  const run=tk.run;
  await aiReady;
  const stop=aiStop();
  if(stop){if(run===tk.run){talkReset(talkMsg(stop));renderTalk()}return}
  const s=await talkStart(def,state.cards,CARDS,askJSON);
  if(run!==tk.run)return;
  tk.scene=s;tk.busy=false;tk.step="";renderTalk()}
async function talkSend(){
  const s=tk.scene,text=tk.text.trim();
  if(!s||s.stage!=="talk"||tk.busy||!text)return;
  tk.focus=!!document.activeElement&&document.activeElement.id==="talk-text";
  tk.text="";tk.busy=true;tk.step=talkStepText(s.def.who,talkIsHowTo(text)?"coach":"");
  const run=tk.run;
  await aiReady;
  const stop=aiStop();
  const p=talkSay(s,text,stop?talkRefuse(stop):askJSON,a=>{if(run===tk.run){tk.step=talkStepText(s.def.who,a);renderTalk()}});
  renderTalk();
  await p;
  if(run!==tk.run)return;
  if(stop&&s.stage==="ended")s.end=talkMsg(stop);
  tk.busy=false;tk.step="";renderTalk();
  const log=$(".t-log .t-line:last-child");if(log)log.scrollIntoView({block:"nearest"})}
async function talkAddWord(i){
  const s=tk.scene; if(!s||tk.busy||!s.newWords[i])return;
  const m=tk.words[i]={busy:true};tk.busy=true;tk.step="Getting ready.";renderTalk();
  const run=tk.run;
  await aiReady;
  const stop=aiStop();
  const r=await talkOffer(s,i,stop?talkRefuse(stop):askJSON,CARDS,state.hold,a=>{tk.step=TRIP_ONE_STEP[a]||"";if(run===tk.run)renderTalk()});
  if(run!==tk.run)return;
  m.busy=false;
  if(r.error)m.err=talkMsg(r.error);
  else if(!r.card)m.err="Not added. "+r.why;
  else if(applyTripCard(r)){session=null;m.ok="Added “"+r.card.en+"” to your deck. It’s under Your trip."}
  else m.err="Not added. "+TRIP_FULL;
  tk.busy=false;tk.step="";renderTalk()}
function talkAct(a,i,id){
  if(a==="start"){talkBegin(id);return}
  if(a==="stop"){talkStop(tk.scene);talkReset("Scene stopped. Nothing was saved.");renderTalk();return}
  if(a==="close"){if(!tk.busy){talkReset();renderTalk()}return}
  if(a==="en"){tk.en[i]=!tk.en[i];renderTalk();return}
  if(a==="more"){tk.more=!tk.more;renderTalk();return}
  if(a==="send"){talkSend();return}
  if(a==="add"){talkAddWord(+i);return}
  if(a==="chip"&&tk.scene&&!tk.busy){const k=talkChips(tk.scene)[+i];if(k){tk.text=(tk.text.trim()+" "+k.nat).trim().slice(0,TALK_REPLY_MAX);renderTalk()}}
}
