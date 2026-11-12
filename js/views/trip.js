"use strict";
/* ---------- your trip: cards written from the learner's notes, behind the checks in js/tripcheck.js ---------- */
const trip={text:null,busy:false,who:"",step:"",report:null,err:"",
  hand:{c:"kr",en:"",nat:"",err:"",ok:""},quick:{c:"kr",text:"",err:"",ok:""},focus:""};
const HAND_NAT={tw:"台北君悅酒店",kr:"롯데호텔 서울",jp:"浅草ビューホテル"};
const TRIP_ONE_STEP={write:"Writing the pronunciation.",read:"A second model is reading it without seeing the English.",compare:"Comparing the two readings."};
const countryOptions=sel=>Object.keys(C).map(c=>`<option value="${c}"${c===sel?" selected":""}>${C[c].name}</option>`).join("");
const aiStop=()=>AI.mode==="none"?"unavailable":AI.mode==="key"&&!getKey()?"no_key":"";
async function addOne(who,f,run){
  if(trip.busy)return;
  f.err="";f.ok="";trip.busy=true;trip.who=who;trip.step="Getting ready.";renderTrip();
  await aiReady;
  const stop=aiStop();
  const r=await run(stop?async()=>{throw {code:stop}}:askJSON,s=>{trip.step=TRIP_ONE_STEP[s]||"";renderTrip()});
  if(r.error)f.err=aiMessage(r.error);
  else if(!r.card)f.err="Not added. "+r.why;
  else if(applyTripCard(r)){session=null;f.ok="Added “"+r.card.en+"” to your deck.";f.en="";f.nat="";f.text=""}
  else f.err="Not added. "+TRIP_FULL;
  trip.busy=false;trip.who="";trip.step="";renderTrip();
}
function quickAddNow(){const f=trip.quick;return addOne("quick",f,(ask,step)=>quickAdd({c:f.c,text:f.text},ask,CARDS,state.hold,step))}
function quickFrom(q,c){
  if(q)trip.quick.text=q;
  if(C[c])trip.quick.c=c;
  trip.focus="quick-text";location.hash="trip"}
function addByHand(){const f=trip.hand;return addOne("hand",f,(ask,step)=>addPlaceByHand({c:f.c,en:f.en,nat:f.nat},ask,CARDS,state.hold,step))}
const TRIP_STEP={write:"Writing cards for your trip. This can take a minute.",
  read:"A second model is reading each card without seeing the English.",
  compare:"Comparing the two readings."};
async function buildTrip(){
  if(trip.busy)return;
  const text=(trip.text||"").trim();
  if(text.length<6){trip.err="Add a few places or an itinerary first.";renderTrip();return}
  trip.busy=true;trip.who="build";trip.err="";trip.report=null;trip.step="Getting ready.";renderTrip();
  await aiReady;
  let stop=aiStop();
  if(!stop){
    if(state.itin!==text){state.itin=text;commit()}
    const rep=await runTripChecks(text,askJSON,CARDS,state.hold,s=>{trip.step=TRIP_STEP[s]||"";renderTrip()});
    if(rep.error)stop=rep.error;
    else{if(applyTripReport(rep))session=null;trip.report=rep}
  }
  if(stop)trip.err=aiMessage(stop);
  trip.busy=false;trip.who="";trip.step="";renderTrip();
}
function tripEntry(k,acts,why){return `<div class="entry" data-c="${k.c}"><div><div class="e-en">${h(k.en)} <span class="meta" style="font-weight:400">${C[k.c].name}, ${h(k.kind)}</span></div>
  <div class="e-nat" lang="${C[k.c].hl}">${h(k.nat)}</div><div class="e-say">${h(k.say)}</div><div class="e-rom">${h(k.rom)}</div>${toneLine(k)}</div>
  ${hearBtn(k.nat,k.c)}${k.note?`<div class="e-note">${h(k.note)}</div>`:""}${why?`<div class="e-why">Left out: ${h(why)}</div>`:""}${acts?`<div class="e-acts">${acts}</div>`:""}</div>`}
function renderTrip(){
  if(trip.text==null)trip.text=state.itin||"";
  const r=trip.report,hand=trip.hand,quick=trip.quick;
  let rep="";
  if(r){
    rep=`<div class="panel" aria-live="polite"><h3>${r.blocked?"Nothing was added":"Result of the checks"}</h3>`;
    if(r.blocked)rep+=`<p style="margin-top:8px;max-width:60ch">The generator got only ${r.hits} of ${r.probes} known answers right, so none of its cards were trusted. Try building again.</p>`;
    else{
      const passed=r.added.length+r.held.length;
      rep+=`<ul style="padding-left:18px;margin:10px 0 0;max-width:64ch"><li>Known-answer test: ${r.hits} of ${r.probes} right.</li>
        <li>Second-model check: ${passed} of ${r.checked} cards passed.</li>
        <li>${r.added.length} added to your deck${r.held.length?`, ${r.held.length} waiting for you to confirm a name`:""}${r.dupes?`, ${r.dupes} already there`:""}.</li></ul>`;
      if(!passed&&!r.out.length)rep+=`<p style="margin-top:10px">No cards came back, so nothing was added. Name some places in Taiwan, Korea or Japan and try again.</p>`;
      if(r.out.length)rep+=`<h4 style="margin:16px 0 4px">Left out</h4>${r.out.map(o=>tripEntry(o.card,"",o.why)).join("")}`;
    }
    rep+=`</div>`;
  }
  const keyBox=AI.mode==="key"?`<div class="panel"><h3>Your Anthropic API key</h3>
    <p class="meta" style="margin-top:6px;max-width:62ch">This copy of the page runs outside Claude, so building cards needs your own API key, and each build is billed to it. The key is stored only in this browser and sent only to api.anthropic.com.</p>
    <div class="row"><input class="ta" id="trip-key" type="password" autocomplete="off" placeholder="sk-ant-…" aria-label="Anthropic API key" value="${h(getKey())}" style="max-width:420px">${getKey()?`<button class="btn ghost small" data-keyclear="1">Forget this key</button>`:""}</div></div>`:"";
  $("#v-trip").innerHTML=`<h2>Your trip</h2>
  ${timelineHTML()}
  <p class="lede">Paste an itinerary, or just list places: hotels, restaurants, stations, neighborhoods. Claude writes cards for them, and each card has to pass the checks below before it joins your deck. Build once from your plans, then add each new booking with “Add a place by hand” or “Quick add” below. Building again rewrites cards for the whole list and can add reworded copies of ones you already have.</p>
  ${keyBox}
  <div style="margin-top:18px"><textarea class="ta" id="trip-text" aria-label="Your itinerary or list of places" maxlength="4000" ${trip.busy?"disabled":""} placeholder="Taipei, 4 nights, hotel near Zhongshan station&#10;Day trip to Jiufen&#10;Seoul, 5 nights in Hongdae&#10;KTX to Busan, staying by Haeundae Beach&#10;Tokyo, 2 nights in Asakusa">${h(trip.text)}</textarea></div>
  <div class="row" style="margin-top:12px"><button class="btn" data-build="1" ${trip.busy?"disabled":""}>${trip.busy?"Building…":"Build cards from this"}</button><span class="meta" aria-live="polite">${trip.who==="build"?h(trip.step):""}</span></div>
  ${trip.err?`<p class="err" role="alert" style="margin-top:10px">${h(trip.err)}</p>`:""}
  ${rep}
  ${state.hold.length?`<div class="panel"><h3>Confirm these names</h3><p class="meta" style="margin-top:6px;max-width:62ch">These are business names Claude wasn’t certain of in the local script. Compare each one with your booking confirmation or a map before adding it.</p>
    ${state.hold.map(k=>tripEntry(k,`<button class="btn small" data-holdadd="${h(k.id)}">It matches, add it</button><button class="btn ghost small" data-holddrop="${h(k.id)}">Discard</button>`)).join("")}</div>`:""}
  <div class="panel"><h3>Add a place by hand</h3>
    <p class="meta" style="margin-top:6px;max-width:62ch">Paste a name exactly as it appears on your booking or a map. Claude writes only the pronunciation and never changes the name, so nothing is guessed.</p>
    <div class="fgrid"><label class="fld">Country<select class="ta" id="hand-c" ${trip.busy?"disabled":""}>${countryOptions(hand.c)}</select></label>
      <label class="fld">What it is, in English<input class="ta" id="hand-en" maxlength="90" autocomplete="off" placeholder="My hotel in Seoul" value="${h(hand.en)}" ${trip.busy?"disabled":""}></label>
      <label class="fld">Name in the local script<input class="ta" id="hand-nat" maxlength="80" autocomplete="off" lang="${C[hand.c].hl}" placeholder="${h(HAND_NAT[hand.c])}" value="${h(hand.nat)}" ${trip.busy?"disabled":""}></label></div>
    <div class="row" style="margin-top:12px"><button class="btn" data-handadd="1" ${trip.busy?"disabled":""}>${trip.busy&&trip.who==="hand"?"Adding…":"Add this place"}</button><span class="meta" aria-live="polite">${trip.who==="hand"?h(trip.step):""}</span></div>
    ${hand.err?`<p class="err" role="alert" style="margin-top:10px;max-width:62ch">${h(hand.err)}</p>`:""}${hand.ok?`<p class="good" role="status" style="margin-top:10px">${h(hand.ok)}</p>`:""}</div>
  <div class="panel" id="quick-add"><h3>Quick add</h3>
    <p class="meta" style="margin-top:6px;max-width:62ch">Ran into a word or phrase? Type it in English and Claude translates it, or paste it in the local script and Claude adds the pronunciation and meaning. One card at a time, with the same checks as above.</p>
    <div class="fgrid"><label class="fld">Country<select class="ta" id="quick-c" ${trip.busy?"disabled":""}>${countryOptions(quick.c)}</select></label>
      <label class="fld">Word or phrase<input class="ta" id="quick-text" maxlength="90" autocomplete="off" placeholder="Where is the subway?" value="${h(quick.text)}" ${trip.busy?"disabled":""}></label></div>
    <div class="row" style="margin-top:12px"><button class="btn" data-quickadd="1" ${trip.busy?"disabled":""}>${trip.busy&&trip.who==="quick"?"Adding…":"Add this card"}</button><span class="meta" aria-live="polite">${trip.who==="quick"?h(trip.step):""}</span></div>
    ${quick.err?`<p class="err" role="alert" style="margin-top:10px;max-width:62ch">${h(quick.err)}</p>`:""}${quick.ok?`<p class="good" role="status" style="margin-top:10px">${h(quick.ok)}</p>`:""}</div>
  <div class="panel"><h3>Cards from your trip${state.trip.length?` (${state.trip.length})`:""}</h3>
    ${state.trip.length?`<p class="meta" style="margin-top:6px">These appear in Today’s cards alongside the course, and in the phrasebook under “Your trip.”</p>${state.trip.map(k=>tripEntry(k,`<button class="btn ghost small" data-tripdel="${h(k.id)}">Remove</button>`)).join("")}`
      :`<p class="meta" style="margin-top:6px">None yet. Build some from your itinerary above.</p>`}</div>
  ${notesHTML()}
  <div class="panel"><h3>How the cards are checked</h3><ol style="padding-left:20px;margin:10px 0 0;max-width:64ch">
    <li>Every run includes six test phrases with known answers, two per language. If the generator misses more than one, the whole batch is thrown away.</li>
    <li>Each card must be in the right script for its country, come with a pronunciation, and not already be in your deck.</li>
    <li>A second model reads each card’s foreign text without seeing the English, and says what it means and how it is pronounced.</li>
    <li>The two readings are compared. A card joins your deck only if the meaning, the romanization and the sounds-like spelling all agree.</li></ol>
    <p class="meta" style="margin:12px 0 0;max-width:64ch">This catches mistranslations and wrong scripts. It can’t confirm what a hotel, restaurant or shop calls itself, so check business names against your booking.</p></div>`;
  if(trip.focus){const f=$("#"+trip.focus);trip.focus="";if(f){f.focus({preventScroll:true});f.scrollIntoView({block:"center"})}}
}
