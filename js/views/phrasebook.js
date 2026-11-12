"use strict";
/* ---------- phrasebook ---------- */
let pb={c:"all",cat:"all",q:""};
function renderPhrasebook(keepFocus){
  const el=$("#v-phrasebook");
  if(!el.dataset.built){
    el.innerHTML=`<h2>Phrasebook</h2><p class="lede">Everything in the course, for looking things up on the trip itself.</p>
    <div class="filters"><div class="chips" id="pb-c" role="group" aria-label="Country"></div>
      <select id="pb-cat" aria-label="Category"><option value="all">All categories</option>${Object.keys(CATS).map(k=>`<option value="${k}">${CATS[k]}</option>`).join("")}</select>
      <input id="pb-q" type="search" placeholder="Search in English" aria-label="Search in English"></div>
    <div id="pb-list"></div>`;
    el.dataset.built="1";
  }
  $("#pb-c").innerHTML=[["all","All three"],["tw","Taiwan"],["kr","Korea"],["jp","Japan"]].map(x=>`<button class="chip" data-pbc="${x[0]}" aria-pressed="${pb.c===x[0]}">${x[1]}</button>`).join("");
  $("#pb-cat").value=pb.cat;
  const q=pb.q.trim().toLowerCase();
  const list=CARDS.filter(k=>(pb.c==="all"||k.c===pb.c)&&(pb.cat==="all"||k.cat===pb.cat)&&(!q||k.en.toLowerCase().includes(q)||k.note.toLowerCase().includes(q)||k.say.includes(q)));
  $("#pb-list").innerHTML=list.length?list.map(k=>`<div class="entry" data-c="${k.c}">
    <div><div class="e-en">${h(k.en)} <span class="meta" style="font-weight:400">${C[k.c].name}, ${CATS[k.cat].toLowerCase()}</span></div>
    <div class="e-nat" lang="${C[k.c].hl}">${h(k.nat)}</div><div class="e-say">${h(k.say)}</div><div class="e-rom">${h(k.rom)}</div></div>
    ${hearBtn(k.nat,k.c)}
    ${k.note?`<div class="e-note">${h(k.note)}</div>`:""}</div>`).join("")
    :`<p class="meta">Nothing matches. Clear the search or choose “All categories.”</p>`;
}
