"use strict";
/* ---------- the "Before you go" panel on "Your trip": built-in city notes and notes written for the learner's own places ---------- */
const nv={open:{},err:{},id:""};
const wikiSearch=en=>"https://en.wikipedia.org/w/index.php?search="+encodeURIComponent(en);
const noteBody=body=>noteParas(body).map(p=>`<p>${h(p)}</p>`).join("");
function noteHead(en,c,acts){
  return `<div class="note-head"><div class="e-en">${h(en)} <span class="meta" style="font-weight:400">${C[c].name}</span></div>${acts?`<div class="e-acts">${acts}</div>`:""}</div>`}
function builtinNote(key){
  const n=NOTES[key],open=!!nv.open[key];
  return `<div class="note" data-c="${n.c}">${noteHead(n.title,n.c,`<button class="btn ghost small" data-note="toggle" data-id="${h(key)}" aria-expanded="${open}">${open?"Hide":"Read"}</button>`)}
    ${open?`<div class="note-body">${noteBody(n.body)}</div>
    <p class="meta note-src">Based on the Wikipedia article “<a href="${h(n.source)}" target="_blank" rel="noopener">${h(n.sourceTitle)}</a>” (CC BY-SA)</p>`:""}</div>`}
function placeNote(k){
  const n=state.notes[k.id],open=!!nv.open[k.id],off=trip.busy?" disabled":"",id=h(k.id);
  const writing=trip.busy&&trip.who==="note"&&nv.id===k.id;
  const acts=n?`<button class="btn ghost small" data-note="toggle" data-id="${id}" aria-expanded="${open}">${open?"Hide":"Read"}</button>
      <button class="btn ghost small" data-note="write" data-id="${id}"${off}>${writing?"Writing…":"Rewrite"}</button>
      <button class="btn ghost small" data-note="del" data-id="${id}"${off}>Delete</button>`
    :`<button class="btn small" data-note="write" data-id="${id}"${off}>${writing?"Writing…":"Write a note"}</button>`;
  return `<div class="note" data-c="${k.c}">${noteHead(k.en,k.c,acts)}
    ${writing?`<p class="meta" aria-live="polite">${h(trip.step)}</p>`:""}
    ${nv.err[k.id]?`<p class="err" role="alert" style="margin-top:8px;max-width:62ch">${h(nv.err[k.id])}</p>`:""}
    ${n&&open?`<div class="note-body">${noteBody(n.body)}</div>
    <p class="meta note-src">Written by Claude from its own knowledge, not checked against a source. <a href="${h(wikiSearch(k.en))}" target="_blank" rel="noopener">Read more on Wikipedia</a></p>`:""}</div>`}
function notesHTML(){
  const places=state.trip.filter(k=>k.kind==="place");
  return `<div class="panel"><h3>Before you go</h3>
    <p class="meta" style="margin-top:6px;max-width:62ch">Short history and culture notes to read on the plane. The three cities are summaries of their Wikipedia articles. For your own places, Claude writes a note from what it knows, and that note is not checked against a source.</p>
    ${Object.keys(NOTES).map(builtinNote).join("")}
    ${places.map(placeNote).join("")}
    ${places.length?"":`<p class="meta" style="margin-top:12px">Places you add to your trip appear here, each with a “Write a note” button.</p>`}</div>`}
async function noteAct(a,id){
  if(a==="toggle"){nv.open[id]=!nv.open[id];renderTrip();return}
  if(a==="del"){if(deleteNote(id))nv.open[id]=false;renderTrip();return}
  if(a!=="write"||trip.busy)return;
  const card=state.trip.find(k=>k.id===id); if(!card)return;
  nv.err[id]="";nv.id=id;trip.busy=true;trip.who="note";trip.step="Writing the note. This can take a moment.";renderTrip();
  await aiReady;
  const stop=aiStop();
  const r=stop?{body:"",error:stop}:await writeNote(card,askJSON);
  if(r.error)nv.err[id]=aiMessage(r.error);
  else if(applyNote(id,r.body))nv.open[id]=true;
  else nv.err[id]="That place is no longer on your trip, so nothing was saved.";
  trip.busy=false;trip.who="";trip.step="";renderTrip()}
