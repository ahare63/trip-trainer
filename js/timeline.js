"use strict";
/* The trip timeline, with no page access: ordering, filtering, entering entries and attached files.
   Entries are cleaned by cleanEntry() in core.js. Dates are "YYYY-MM-DD" strings, which sort as text. */
const TL_MAX_FILE=20*1024*1024, TL_TYPES=["application/pdf","image/png","image/jpeg"];
const tl={assets:null,busy:false};

/* ---------- ordering ---------- */
/* date, then time; an entry with no time comes before the timed ones on its day; ties keep their saved order */
function tlSorted(list){
  return list.map((e,i)=>[e,i]).sort((a,b)=>(a[0].date<b[0].date?-1:a[0].date>b[0].date?1:0)||(a[0].time<b[0].time?-1:a[0].time>b[0].time?1:0)||a[1]-b[1]).map(x=>x[0])}
const tlFilter=(list,onlyToBook)=>onlyToBook?list.filter(e=>e.status==="to-book"):list;
/* list must already be sorted; today is "YYYY-MM-DD" */
function tlSplit(list,today){return {earlier:list.filter(e=>e.date<today),upcoming:list.filter(e=>e.date>=today)}}
const tlNextUp=(list,today)=>list.find(e=>e.date>=today)||null;
const todayISO=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};

/* ---------- entering ---------- */
/* fields come from the form; id is set when editing. Resolves {entry} or {error}; saves nothing but the entry itself. */
function tlSave(f,id){
  const old=id?state.timeline.find(e=>e.id===id):null;
  if(id&&!old)return {error:"That entry is no longer there."};
  if(!old&&state.timeline.length>=TL_MAX)return {error:"The timeline holds "+TL_MAX+" entries. Delete one first."};
  const v=k=>typeof f[k]==="string"?f[k].trim():"";
  if(!v("title"))return {error:"Add a title."};
  if(!v("date"))return {error:"Add a date."};
  if(!tlDate(v("date")))return {error:"The date must be a real day, written YYYY-MM-DD."};
  if(v("time")&&!tlTime(v("time")))return {error:"The time must be written HH:MM, for example 14:20."};
  if(v("endDate")&&(!tlDate(v("endDate"))||v("endDate")<v("date")))return {error:"The end date must be a real day on or after the date."};
  if(v("link")&&!tlLink(v("link")))return {error:"A link must start with https:// or http:// and be under 500 characters."};
  const entry=cleanEntry({id:old&&old.id,date:v("date"),time:v("time"),endDate:v("endDate"),kind:f.kind,title:v("title"),where:v("where"),status:f.status,link:v("link"),file:old&&old.file,note:v("note")});
  if(!entry)return {error:"That entry couldn’t be saved. Check the title and date."};
  if(old)state.timeline[state.timeline.indexOf(old)]=entry;else state.timeline.push(entry);
  commit();return {entry}}

/* ---------- attached files (Claude-hosted copy only) ---------- */
/* resolves the assets namespace, or null when this copy can't store files */
async function tlAssetsInit(){
  tl.assets=null;
  if(window.claude&&window.claude.use){try{tl.assets=(await window.claude.use("assets"))||null}catch(e){tl.assets=null}}
  return tl.assets}
tl.ready=tlAssetsInit();
const TL_NO_FILES="Files can’t be attached in this copy of the page. Links still work.";
/* Every delete below is called only from a button the learner pressed. */
async function tlAttach(id,file){
  const e=state.timeline.find(x=>x.id===id);
  if(!e)return {error:"That entry is no longer there."};
  if(!tl.assets)return {error:TL_NO_FILES};
  if(!file||!TL_TYPES.includes(file.type))return {error:"Attach a PDF, PNG or JPEG file."};
  if(!(file.size>0))return {error:"That file is empty."};
  if(file.size>TL_MAX_FILE)return {error:"That file is over 20 MB."};
  let up;
  try{up=await tl.assets.upload(file)}catch(x){return {error:"The file didn’t upload, so nothing changed. Try again."}}
  if(!up||typeof up.id!=="string"||!/^[\w-]{1,64}$/.test(up.id))return {error:"The file didn’t upload, so nothing changed. Try again."};
  const old=e.file;e.file=up.id;commit();
  if(old){try{await tl.assets.delete(old)}catch(x){return {ok:true,warn:"The new file is attached, but the old one couldn’t be deleted from storage."}}}
  return {ok:true}}
async function tlDropFile(id){
  const e=state.timeline.find(x=>x.id===id);
  if(!e||!e.file)return {error:"That entry has no file."};
  if(!tl.assets)return {error:TL_NO_FILES};
  try{await tl.assets.delete(e.file)}catch(x){return {error:"The file couldn’t be deleted, so it is still attached. Try again."}}
  e.file="";commit();return {ok:true}}
async function tlDelete(id){
  const e=state.timeline.find(x=>x.id===id);
  if(!e)return {error:"That entry is no longer there."};
  if(e.file){
    if(!tl.assets)return {error:"The attached file can’t be deleted from this copy of the page, so the entry was kept. Open the Claude-hosted copy to delete it."};
    try{await tl.assets.delete(e.file)}catch(x){return {error:"The attached file couldn’t be deleted, so the entry was kept. Try again."}}}
  state.timeline.splice(state.timeline.indexOf(e),1);commit();return {ok:true}}
