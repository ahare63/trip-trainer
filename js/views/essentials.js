"use strict";
/* ---------- essentials ---------- */
let essC=null;
function essList(cs){const out=[];ESS.forEach(r=>cs.forEach(c=>r[1][c].forEach(en=>{const k=CARDS.find(x=>x.c===c&&x.en===en);if(k)out.push(k)})));return out}
function renderEssentials(){
  if(essC==null){const w=curWeek();essC=w<=3?"tw":w<=6?"kr":w===7?"jp":"all"}
  const cs=essC==="all"?["tw","kr","jp"]:[essC];
  const cell=k=>`<div class="entry" data-c="${k.c}"><div><div class="e-en">${essC==="all"?bul(k.c)+" ":""}<span class="meta" style="font-weight:400">${h(k.en)}</span></div>
    <div class="e-nat" lang="${C[k.c].hl}">${h(k.nat)}</div><div class="e-say">${h(k.say)}</div><div class="e-rom">${h(k.rom)}</div></div>
    ${hearBtn(k.nat,k.c)}${k.note?`<div class="e-note">${h(k.note)}</div>`:""}</div>`;
  $("#v-essentials").innerHTML=`<h2>Essentials</h2>
  <p class="lede">The eight phrases that carry most encounters. They’re always here in full, whatever week you’re in.</p>
  <div class="chips" style="margin-top:16px" role="group" aria-label="Language">${[["tw","Mandarin"],["kr","Korean"],["jp","Japanese"],["all","Side by side"]].map(x=>`<button class="chip" data-essc="${x[0]}" aria-pressed="${essC===x[0]}">${x[1]}</button>`).join("")}</div>
  <div class="row" style="margin-top:14px"><button class="btn" data-essquiz="1">Quiz me on ${essC==="all"?"all three":"these"}</button><span class="meta">A practice round. It doesn’t change your card schedule.</span></div>
  ${ESS.map(r=>`<div class="ess"><h3>${r[0]}</h3><div class="ess-row ${essC==="all"?"three":""}">${cs.map(c=>`<div>${r[1][c].map(en=>{const k=CARDS.find(x=>x.c===c&&x.en===en);return k?cell(k):""}).join("")}</div>`).join("")}</div></div>`).join("")}`;
}
