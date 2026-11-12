"use strict";
/* ---------- the timeline panel on "Your trip": flights, trains, hotels and bookings in order, with links to the tickets ---------- */
const tlv={filter:false,earlier:false,form:null,f:null,err:"",ok:"",bad:"",confirm:"",pick:"",busy:false};
const TL_KIND_NAME={flight:"Flight",train:"Train",bus:"Bus",hotel:"Hotel",activity:"Activity",other:"Other"};
const TL_FIELDS=["date","time","endDate","kind","title","where","status","link","note"];
const tlBlankForm=()=>({date:"",time:"",endDate:"",kind:"flight",title:"",where:"",status:"booked",link:"",note:""});
const tlDay=iso=>new Date(iso+"T00:00:00Z").toLocaleDateString("en-US",{timeZone:"UTC",weekday:"short",month:"short",day:"numeric",year:"numeric"});
const tlHost=u=>{try{return new URL(u).host}catch(e){return ""}};

function tlItem(e,next){
  const off=tlv.busy?" disabled":"";
  const asking=tlv.confirm&&tlv.confirm.id===e.id;
  let files="";
  if(tl.assets){
    files=e.file?`<button class="btn ghost small" data-tl="pick" data-id="${h(e.id)}"${off}>Replace file</button><button class="btn ghost small" data-tl="rmfile" data-id="${h(e.id)}"${off}>Remove file</button>`
      :`<button class="btn ghost small" data-tl="pick" data-id="${h(e.id)}"${off}>Attach file</button>`;
    files+=`<span class="meta tl-vis">Anyone this page is shared with can see attached files.</span>`}
  const confirm=asking?`<div class="tl-ask" role="alert"><span>${tlv.confirm.what==="del"?"Delete this entry?"+(e.file?" Its attached file is deleted too.":""):"Delete the attached file?"} This can’t be undone.</span>
    <button class="btn small" data-tl="${tlv.confirm.what==="del"?"delyes":"rmyes"}" data-id="${h(e.id)}"${off}>Delete</button><button class="btn ghost small" data-tl="keep"${off}>Keep it</button></div>`:"";
  return `<li class="tl-item${next?" next":""}" data-kind="${h(e.kind)}">
    <div class="tl-when">${h(tlDay(e.date))}${e.time?` · ${h(e.time)}`:""}${e.endDate&&e.endDate!==e.date?` <span>to ${h(tlDay(e.endDate))}</span>`:""}</div>
    <div class="tl-title">${h(e.title)}${next?` <span class="tl-tag now">Next up</span>`:""}${e.status==="to-book"?` <span class="tl-tag todo">To book</span>`:""}</div>
    <div class="meta">${h(TL_KIND_NAME[e.kind])}${e.where?` · ${h(e.where)}`:""}</div>
    ${e.note?`<div class="tl-note">${h(e.note)}</div>`:""}
    ${e.link||e.file?`<div class="tl-links">${e.link?`<a href="${h(e.link)}" target="_blank" rel="noopener">Open booking page${tlHost(e.link)?` (${h(tlHost(e.link))})`:""}</a>`:""}${e.file?`<a href="${h("/_blob/"+e.file)}" target="_blank" rel="noopener">Open attached file</a>`:""}</div>`:""}
    ${confirm}
    <div class="e-acts"><button class="btn ghost small" data-tl="edit" data-id="${h(e.id)}"${off}>Edit</button><button class="btn ghost small" data-tl="del" data-id="${h(e.id)}"${off}>Delete</button>${files}</div></li>`}

function tlForm(){
  const f=tlv.f,off=tlv.busy?" disabled":"";
  const inp=(k,label,attrs)=>`<label class="fld">${label}<input class="ta" data-tlf="${k}" id="tlf-${k}" value="${h(f[k])}" ${attrs||""}${off}></label>`;
  const sel=(k,label,opts)=>`<label class="fld">${label}<select class="ta" data-tlf="${k}" id="tlf-${k}"${off}>${opts.map(o=>`<option value="${o[0]}"${f[k]===o[0]?" selected":""}>${o[1]}</option>`).join("")}</select></label>`;
  return `<div class="tl-form"><h4>${tlv.form==="new"?"Add an entry":"Edit entry"}</h4>
    <div class="fgrid">
      <div class="tl-two">${inp("date","Date",'type="date"')}${inp("time","Time, local (optional)",'type="time"')}</div>
      <div class="tl-two">${sel("kind","Kind",Object.keys(TL_KIND_NAME).map(k=>[k,TL_KIND_NAME[k]]))}${sel("status","Status",[["booked","Booked"],["to-book","To book"]])}</div>
      ${inp("title","Title",'maxlength="120" autocomplete="off" placeholder="TPE → ICN, EVA BR170"')}
      ${inp("where","City or station (optional)",'maxlength="80" autocomplete="off"')}
      ${inp("endDate","End date (optional, for a hotel stay)",'type="date"')}
      ${inp("link","Ticket or booking link (optional)",'type="url" inputmode="url" maxlength="500" autocomplete="off" placeholder="https://"')}
      <label class="fld">Note (optional)<textarea class="ta" data-tlf="note" id="tlf-note" maxlength="300" style="min-height:70px"${off}>${h(f.note)}</textarea></label></div>
    ${tlv.err?`<p class="err" role="alert" style="margin-top:10px;max-width:62ch">${h(tlv.err)}</p>`:""}
    <div class="row" style="margin-top:12px"><button class="btn" data-tl="save"${off}>${tlv.form==="new"?"Add to timeline":"Save changes"}</button><button class="btn ghost" data-tl="cancel"${off}>Cancel</button></div></div>`}

function timelineHTML(){
  const all=state.timeline,today=todayISO();
  const shown=tlSorted(tlFilter(all,tlv.filter)),sp=tlSplit(shown,today),next=tlNextUp(shown,today);
  const toBook=all.filter(e=>e.status==="to-book").length;
  const files=tl.assets?`<input type="file" id="tl-file" accept="application/pdf,image/png,image/jpeg" hidden>`
    :`<p class="meta" style="margin-top:6px;max-width:62ch">${TL_NO_FILES}</p>`;
  let list="";
  if(!all.length)list=`<p class="meta" style="margin-top:12px">Nothing here yet. Add a flight, a train or a hotel, with a link to the ticket.</p>`;
  else{
    if(sp.earlier.length)list+=`<button class="chip" data-tl="earlier" aria-expanded="${tlv.earlier}" style="margin-top:14px">Earlier (${sp.earlier.length})</button>`;
    if(tlv.earlier&&sp.earlier.length)list+=`<ul class="tl-list">${sp.earlier.map(e=>tlItem(e,false)).join("")}</ul>`;
    list+=sp.upcoming.length?`<ul class="tl-list">${sp.upcoming.map(e=>tlItem(e,e===next)).join("")}</ul>`
      :`<p class="meta" style="margin-top:12px">${tlv.filter?"Nothing left to book.":"Nothing coming up."}</p>`}
  return `<div class="panel" id="timeline"><h3>Timeline</h3>
    <p class="meta" style="margin-top:6px;max-width:62ch">Flights, trains, hotels and bookings in order, each linking to its ticket or confirmation. Times are local to where each one happens.</p>${files}
    <div class="row" style="margin-top:12px"><button class="btn small" data-tl="new"${tlv.busy?" disabled":""}>Add an entry</button>
      <button class="chip" data-tl="filter" aria-pressed="${tlv.filter}">To book${toBook?` (${toBook})`:""}</button></div>
    ${tlv.bad?`<p class="err" role="alert" style="margin-top:10px;max-width:62ch">${h(tlv.bad)}</p>`:""}
    ${tlv.ok?`<p class="good" role="status" style="margin-top:10px">${h(tlv.ok)}</p>`:""}
    ${tlv.form?tlForm():""}${list}</div>`}

async function tlAct(a,id){
  if(tlv.busy)return;
  tlv.ok="";tlv.bad="";
  if(a==="new"){tlv.form="new";tlv.f=tlBlankForm();tlv.err="";trip.focus="tlf-date";renderTrip();return}
  if(a==="edit"){const e=state.timeline.find(x=>x.id===id);if(!e)return;tlv.form=id;tlv.f=tlBlankForm();TL_FIELDS.forEach(k=>tlv.f[k]=e[k]);tlv.err="";trip.focus="tlf-title";renderTrip();return}
  if(a==="cancel"){tlv.form=null;tlv.err="";renderTrip();return}
  if(a==="save"){const r=tlSave(tlv.f,tlv.form==="new"?undefined:tlv.form);
    if(r.error)tlv.err=r.error;else{tlv.form=null;tlv.err="";tlv.ok="Saved."}
    renderTrip();return}
  if(a==="filter"){tlv.filter=!tlv.filter;renderTrip();return}
  if(a==="earlier"){tlv.earlier=!tlv.earlier;renderTrip();return}
  if(a==="del"||a==="rmfile"){tlv.confirm={what:a==="del"?"del":"rm",id};renderTrip();return}
  if(a==="keep"){tlv.confirm="";renderTrip();return}
  if(a==="pick"){tlv.pick=id;const i=$("#tl-file");if(i)i.click();return}
  if(a==="delyes"||a==="rmyes"){
  tlv.busy=true;renderTrip();
  const r=a==="delyes"?await tlDelete(id):await tlDropFile(id);
  tlv.busy=false;tlv.confirm="";
  if(r.error)tlv.bad=r.error;else tlv.ok=a==="delyes"?"Entry deleted.":"File deleted.";
  renderTrip()}}
async function tlFilePicked(file){
  const id=tlv.pick;tlv.pick="";if(!file||!id||tlv.busy)return;
  tlv.busy=true;tlv.ok="";tlv.bad="";renderTrip();
  const r=await tlAttach(id,file);
  tlv.busy=false;
  if(r.error)tlv.bad=r.error;else tlv.ok=r.warn||"File attached.";
  renderTrip()}
