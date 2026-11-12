"use strict";
/* ---------- your trip: cards written from the learner's notes, behind the checks in js/tripcheck.js ---------- */
const trip={text:null,busy:false,step:"",report:null,err:""};
const TRIP_STEP={write:"Writing cards for your trip. This can take a minute.",
  read:"A second model is reading each card without seeing the English.",
  compare:"Comparing the two readings."};
async function buildTrip(){
  if(trip.busy)return;
  const text=(trip.text||"").trim();
  if(text.length<6){trip.err="Add a few places or an itinerary first.";renderTrip();return}
  trip.busy=true;trip.err="";trip.report=null;trip.step="Getting ready.";renderTrip();
  await aiReady;
  let stop=AI.mode==="none"?"unavailable":AI.mode==="key"&&!getKey()?"no_key":"";
  if(!stop){
    if(state.itin!==text){state.itin=text;commit()}
    const rep=await runTripChecks(text,askJSON,CARDS,state.hold,s=>{trip.step=TRIP_STEP[s]||"";renderTrip()});
    if(rep.error)stop=rep.error;
    else{if(applyTripReport(rep))session=null;trip.report=rep}
  }
  if(stop)trip.err=aiMessage(stop);
  trip.busy=false;trip.step="";renderTrip();
}
function tripEntry(k,acts,why){return `<div class="entry" data-c="${k.c}"><div><div class="e-en">${h(k.en)} <span class="meta" style="font-weight:400">${C[k.c].name}, ${h(k.kind)}</span></div>
  <div class="e-nat" lang="${C[k.c].hl}">${h(k.nat)}</div><div class="e-say">${h(k.say)}</div><div class="e-rom">${h(k.rom)}</div>${toneLine(k)}</div>
  ${hearBtn(k.nat,k.c)}${k.note?`<div class="e-note">${h(k.note)}</div>`:""}${why?`<div class="e-why">Left out: ${h(why)}</div>`:""}${acts?`<div class="e-acts">${acts}</div>`:""}</div>`}
function renderTrip(){
  if(trip.text==null)trip.text=state.itin||"";
  const r=trip.report;
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
  <p class="lede">Paste an itinerary, or just list places: hotels, restaurants, stations, neighborhoods. Claude writes cards for them, and each card has to pass the checks below before it joins your deck. Come back and add more whenever you book something.</p>
  ${keyBox}
  <div style="margin-top:18px"><textarea class="ta" id="trip-text" aria-label="Your itinerary or list of places" maxlength="4000" ${trip.busy?"disabled":""} placeholder="Taipei, 4 nights, hotel near Zhongshan station&#10;Day trip to Jiufen&#10;Seoul, 5 nights in Hongdae&#10;KTX to Busan, staying by Haeundae Beach&#10;Tokyo, 2 nights in Asakusa">${h(trip.text)}</textarea></div>
  <div class="row" style="margin-top:12px"><button class="btn" data-build="1" ${trip.busy?"disabled":""}>${trip.busy?"Building…":"Build cards from this"}</button><span class="meta" aria-live="polite">${h(trip.step)}</span></div>
  ${trip.err?`<p class="err" role="alert" style="margin-top:10px">${h(trip.err)}</p>`:""}
  ${rep}
  ${state.hold.length?`<div class="panel"><h3>Confirm these names</h3><p class="meta" style="margin-top:6px;max-width:62ch">These are business names Claude wasn’t certain of in the local script. Compare each one with your booking confirmation or a map before adding it.</p>
    ${state.hold.map(k=>tripEntry(k,`<button class="btn small" data-holdadd="${h(k.id)}">It matches, add it</button><button class="btn ghost small" data-holddrop="${h(k.id)}">Discard</button>`)).join("")}</div>`:""}
  <div class="panel"><h3>Cards from your trip${state.trip.length?` (${state.trip.length})`:""}</h3>
    ${state.trip.length?`<p class="meta" style="margin-top:6px">These appear in Today’s cards alongside the course, and in the phrasebook under “Your trip.”</p>${state.trip.map(k=>tripEntry(k,`<button class="btn ghost small" data-tripdel="${h(k.id)}">Remove</button>`)).join("")}`
      :`<p class="meta" style="margin-top:6px">None yet. Build some from your itinerary above.</p>`}</div>
  <div class="panel"><h3>How the cards are checked</h3><ol style="padding-left:20px;margin:10px 0 0;max-width:64ch">
    <li>Every run includes six test phrases with known answers, two per language. If the generator misses more than one, the whole batch is thrown away.</li>
    <li>Each card must be in the right script for its country, come with a pronunciation, and not already be in your deck.</li>
    <li>A second model reads each card’s foreign text without seeing the English, and says what it means and how it is pronounced.</li>
    <li>The two readings are compared. A card joins your deck only if the meaning, the romanization and the sounds-like spelling all agree.</li></ol>
    <p class="meta" style="margin:12px 0 0;max-width:64ch">This catches mistranslations and wrong scripts. It can’t confirm what a hotel, restaurant or shop calls itself, so check business names against your booking.</p></div>`;
}
