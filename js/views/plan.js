"use strict";
/* ---------- plan ---------- */
let selWeek=null;
function stats(c){const all=CARDS.filter(k=>k.c===c);let seen=0,solid=0;
  all.forEach(k=>{const p=state.cards[k.id];if(p){seen++;if(p.b>=3)solid++}});return {n:all.length,seen,solid}}
function dueCount(){const t=today(),w=curWeek();let due=0,fresh=0;
  CARDS.forEach(k=>{const p=state.cards[k.id];if(p){if(p.due<=t)due++}else if(k.wk<=w)fresh++});
  const allow=Math.max(0,NEW_PER_DAY-(state.day===t?state.newDone:0));return {due,fresh:Math.min(fresh,allow)}}
function renderPlan(){
  const w=curWeek(); if(selWeek==null)selWeek=w;
  const wk=WEEKS[selWeek-1], d=dueCount(), total=d.due+d.fresh;
  const counts=["tw","kr","jp"].map(c=>[c,CARDS.filter(k=>k.c===c&&k.wk===selWeek).length]).filter(x=>x[1]);
  const startDate=new Date((state.start)*864e5+new Date().getTimezoneOffset()*60000).toLocaleDateString(undefined,{month:"short",day:"numeric"});
  $("#v-plan").innerHTML=`
  <h1>Eight weeks to Taiwan, Korea and Tokyo</h1>
  <p class="lede">About ten minutes a day, one language at a time: Mandarin first, then Korean, then a short Japanese course. Cards you already know keep coming back, less and less often.</p>
  <div class="route">
    <div class="lines" aria-hidden="true"><i data-c="tw"></i><i data-c="kr"></i><i data-c="jp"></i><i class="mix"></i></div>
    <ol class="stations">${WEEKS.map((x,i)=>`<li><button class="stn ${i+1<w?"past":""} ${i+1===w?"here":""}" data-week="${i+1}" aria-pressed="${i+1===selWeek}" aria-label="Week ${i+1}: ${h(x.t)}${i+1===w?" (this week)":""}">${i+1}</button><small>${h(x.t)}</small></li>`).join("")}</ol>
    <div class="legend"><span data-c="tw">Weeks 1 to 3, Mandarin</span><span data-c="kr">Weeks 4 to 6, Korean</span><span data-c="jp">Week 7, Japanese, then all three</span></div>
  </div>
  <div class="panel">
    <h2><small>Week ${selWeek} of 8${selWeek===w?", this week":selWeek<w?", done":", coming up"}</small>${h(wk.t)}</h2>
    <p style="margin-top:8px;max-width:60ch">${h(wk.d)}</p>
    <div class="row meta">New cards: ${counts.map(x=>bul(x[0])+" "+x[1]).join(" &nbsp; ")}</div>
    <ul class="tasks">${wk.tasks.map(t=>`<li><span>${h(t[1])}</span><a href="#${t[0]}">Open</a></li>`).join("")}</ul>
    ${selWeek===w?`<div class="row" style="margin-top:16px"><a class="btn" href="#study">${total?`Start today’s cards (${total})`:"Today’s cards are done"}</a><a class="btn ghost" href="#essentials">Review the essentials</a><span class="meta">${state.streak>1&&state.lastDay>=today()-1?state.streak+" days in a row":""}</span></div>`:""}
  </div>
  <div class="panel">
    <h3>What you’ve learned</h3>
    <div class="prog" style="margin-top:12px">${["tw","kr","jp"].map(c=>{const s=stats(c);return `<div class="line" data-c="${c}"><span>${C[c].name}</span><div class="rail"><i style="width:${s.solid/s.n*100}%"></i><i class="soft" style="width:${(s.seen-s.solid)/s.n*100}%"></i></div><span class="meta">${s.seen} of ${s.n}</span></div>`}).join("")}</div>
    <p class="meta" style="margin:12px 0 0">Solid color means you’ve got a card right three times running.</p>
  </div>
  <div class="panel">
    <h3>Pace and sound</h3>
    <p class="meta" style="margin-top:8px">You’re in week ${w}, started ${startDate}. Leaving sooner, or fell behind? Shift the plan.</p>
    <div class="row"><button class="btn ghost small" data-shift="-1" ${w<=1?"disabled":""}>Go back a week</button><button class="btn ghost small" data-shift="1" ${w>=8?"disabled":""}>Skip ahead a week</button></div>
    <p class="meta" style="margin:16px 0 8px">Audio uses your device’s built-in voices. Check that each one works:</p>
    <div class="row">${hearBtn("你好","tw","Mandarin")}${hearBtn("안녕하세요","kr","Korean")}${hearBtn("こんにちは","jp","Japanese")}</div>
  </div>`;
}
