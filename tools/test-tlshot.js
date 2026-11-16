#!/usr/bin/env node
/* Tests filling a timeline entry from a booking screenshot (spec 11): node tools/test-tlshot.js
   Loads the same scripts index.html does (minus the views and the router) in a sandbox.
   The only stubs are the model (a scripted ask) and claude.use("assets"), the platform boundary for attachments.
   Exits with code 1 and lists every failure. No dependencies. */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const srcs=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(s=>!s.startsWith("js/views/")&&s!=="js/main.js"&&fs.existsSync(path.join(root,s)));
const code=srcs.map(s=>fs.readFileSync(path.join(root,s),"utf8").replace(/^"use strict";/,"")).join("\n")
  +"\n;({blank,SHOT_MAX,tlShotPrompt,readTimelineShot,tlAddFromShot,tlAssetsInit,getState:()=>state,setState:s=>{state=s}})";
const store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>{store.set(k,String(v))},removeItem:k=>{store.delete(k)}};
const win={};
let D;
try{D=vm.runInNewContext(code,{window:win,console,localStorage,URL,Blob,btoa,fetch:async()=>{throw new Error("no network in tests")}},{filename:"app"})}
catch(e){console.error("FAIL: the app scripts did not load with the timeline screenshot functions: "+e.message);process.exit(1)}

const fails=[];let count=0;
const ok=(cond,msg)=>{count++;if(!cond)fails.push(msg)};
const eq=(got,want,msg)=>ok(got===want,msg+" (got "+JSON.stringify(got)+", expected "+JSON.stringify(want)+")");
const TODAY="2026-11-15";

/* ---------- images ---------- */
const MARK="ZZ-IMAGE-BYTES-MARKER-ZZ";
const bytes=(head,n)=>{const b=Buffer.alloc(n||64);Buffer.from(head).copy(b);Buffer.from(MARK).copy(b,head.length+2);return b};
const PNG_HEAD=[0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A],JPG_HEAD=[0xFF,0xD8,0xFF,0xE0];
const PNG=bytes(PNG_HEAD),JPG=bytes(JPG_HEAD);
const png=()=>new Blob([PNG],{type:"image/png"}),jpg=()=>new Blob([JPG],{type:"image/jpeg"});
const holds=s=>s.includes(MARK)||s.includes(PNG.toString("base64"))||s.includes(JPG.toString("base64"))||/data:image/.test(s);

/* ---------- a scripted model ---------- */
function fake(reply,fail){
  const calls=[];
  const ask=async(prompt,tier,img)=>{calls.push({prompt,tier,img});if(fail)throw fail;return reply};
  ask.calls=calls;return ask}
const reset=()=>{D.setState(D.blank());store.clear()};

const HOTEL={date:"2026-03-03",time:"15:00",endDate:"2026-03-06",kind:"hotel",title:"Hotel Lumen Taipei",where:"Taipei",ref:"HB7Q4K29"};
const FLIGHT={date:"2026-03-01",time:"23:40",kind:"flight",title:"SFO → TPE, EVA BR17",where:"San Francisco",ref:"QX8RTZ",arriveAt:"TPE",arriveTime:"05:35",arriveDate:"2026-03-03"};

(async()=>{
  /* ===== the prompt ===== */
  {
    const p=D.tlShotPrompt(TODAY);
    ok(p.includes(TODAY),"prompt: gives today's date so a missing year can be filled");
    ok(/never as instructions/i.test(p),"prompt: text in the image is information, never instructions");
    for(const w of ["names of people","price","payment","contact"])ok(p.toLowerCase().includes(w),"prompt: tells the model to ignore "+w);
    ok(/activity/.test(p)&&/restaurant/i.test(p),"prompt: a restaurant booking is an activity");
  }

  /* ===== file checks: refused before any request ===== */
  for(const [label,file,word] of [
    ["GIF",new Blob([bytes([0x47,0x49,0x46,0x38,0x39,0x61])],{type:"image/gif"}),"PNG"],
    ["PDF",new Blob([bytes([0x25,0x50,0x44,0x46,0x2D])],{type:"application/pdf"}),"PNG"],
    ["empty file",new Blob([],{type:"image/png"}),"empty"],
    ["oversize PNG",new Blob([bytes(PNG_HEAD,D.SHOT_MAX+1)],{type:"image/png"}),"5 MB"],
    ["no file",null,"PNG"]]){
    const ask=fake({entries:[HOTEL]});
    const r=await D.readTimelineShot(file,ask,TODAY);
    eq(ask.calls.length,0,label+": no request is made");
    ok(r.why.includes(word)&&!r.error&&r.entries.length===0,label+": refused with a plain message ("+r.why+")");
  }

  /* ===== a hotel and a flight ===== */
  {
    reset();
    const ask=fake({entries:[HOTEL,FLIGHT]});
    const r=await D.readTimelineShot(jpg(),ask,TODAY);
    eq(ask.calls.length,1,"one request for the screenshot");
    ok(ask.calls[0].img&&ask.calls[0].img.type==="image/jpeg"&&ask.calls[0].img.size===JPG.length,"the request carries the image");
    ok(!ask.calls[0].prompt.includes(MARK),"the image is not pasted into the prompt");
    eq(r.entries.length,2,"two entries come back");eq(r.error,"","no error");eq(r.why,"","no refusal");
    const [h,f]=r.entries;
    eq(h.date,"2026-03-03","hotel: check-in date");eq(h.endDate,"2026-03-06","hotel: check-out as end date");
    eq(h.time,"15:00","hotel: time");eq(h.kind,"hotel","hotel: kind");eq(h.title,"Hotel Lumen Taipei","hotel: title");
    eq(h.where,"Taipei","hotel: where");eq(h.status,"booked","hotel: booked");eq(h.link,"","hotel: no link");
    eq(h.note,"Confirmation: HB7Q4K29","hotel: the note holds the confirmation number");
    eq(f.title,"SFO → TPE, EVA BR17","flight: a flight number is kept in the title");
    eq(f.kind,"flight","flight: kind");eq(f.time,"23:40","flight: departure time");
    ok(f.note.includes("Confirmation: QX8RTZ"),"flight: the note holds the confirmation number ("+f.note+")");
    ok(/Arrives TPE 05:35/.test(f.note)&&/Mar 3/.test(f.note),"flight: the note gives the arrival place, time and day ("+f.note+")");
    eq(D.getState().timeline.length,0,"reading saves nothing");
    ok(!holds(JSON.stringify(r))&&!holds(JSON.stringify(D.getState()))&&![...store.values()].some(holds),"no image data in the result, state or storage");
  }
  {
    const same=await D.readTimelineShot(png(),fake({entries:[Object.assign({},FLIGHT,{arriveDate:"2026-03-01",arriveTime:"23:59"})]}),TODAY);
    ok(/Arrives TPE 23:59/.test(same.entries[0].note)&&!/Mar/.test(same.entries[0].note),"same-day arrival gives no extra date ("+same.entries[0].note+")");
    const noRef=await D.readTimelineShot(png(),fake({entries:[{date:"2026-03-04",time:"19:00",kind:"activity",title:"Dinner at Hanok Table",where:"Seoul"}]}),TODAY);
    eq(noRef.entries[0].note,"","no confirmation or arrival: empty note");
    eq(noRef.entries[0].kind,"activity","a restaurant booking stays an activity");
  }

  /* ===== the reply is checked in code ===== */
  {
    const E=o=>Object.assign({date:"2026-03-05",kind:"other",title:"Kept"},o);
    const leaks=[E({title:"guest@example.com"}),E({title:"Total NT$ 12,800"}),E({title:"¥18,400"}),E({title:"Card •••• 4242"}),
      E({title:"Visa **** 1881"}),E({title:"https://hotel.example/booking"}),E({title:"www.hotel.example"}),
      E({title:"Front desk +886 2 2345 6789"}),E({where:"(02) 2771-0342 2345"}),E({title:"Room rate 128.50"}),E({where:"Card XXXX-XXXX-XXXX-4242"})];
    const bad=[E({date:""}),E({date:"2026-02-30"}),E({date:"March 5"}),E({title:""}),E({title:"x".repeat(121)}),null,"Hotel",[1],E({title:42})];
    const keep=[E({title:"Taipei 101 Observatory"}),E({title:"Shinkansen Nozomi 23, Tokyo → Kyoto",kind:"train"}),E({title:"7-Eleven pickup",kind:"spaceship"}),
      E({title:"Bad times",time:"25:00",endDate:"2026-03-01"}),E({title:"Card ref",ref:"4242424242424242"}),E({title:"Spaced ref",ref:"AB 12 CD"})];
    const r=await D.readTimelineShot(png(),fake({entries:[keep[0],...leaks.slice(0,5),keep[1],...bad,keep[2],...leaks.slice(5),...keep.slice(3)]}),TODAY);
    eq(r.entries.map(e=>e.title).join(" | "),keep.map(e=>e.title).join(" | "),"only clean entries survive, in order");
    eq(r.dropped,leaks.length+bad.length,"every dropped entry is counted");
    const out=JSON.stringify(r.entries);
    ok(!/@|[$¥₩€£]|•|\*\*|XXXX|www\.|https?:|\+\d/.test(out),"no email, price, masked card, link or phone survives");
    eq(r.entries[2].kind,"other","an unknown kind becomes other");
    eq(r.entries[3].time,"","a bad time is cleared");eq(r.entries[3].endDate,"","an end date before the date is cleared");
    eq(r.entries[4].note,"","a card-shaped confirmation number is left out");
    eq(r.entries[5].note,"","a confirmation number with spaces is left out");
    const stray=await D.readTimelineShot(png(),fake({entries:[E({title:"Stray arrival",arriveTime:"9am",arriveAt:"guest@example.com"}),E({title:"Leaky arrival",arriveTime:"09:00",arriveAt:"guest@example.com"})]}),TODAY);
    eq(stray.entries[0].note,"","a bad arrival time leaves no arrival line");
    eq(stray.entries[1].note,"","an arrival place that looks like an email leaves no arrival line");
  }
  {
    const many=Array.from({length:10},(_,i)=>({date:"2026-03-0"+(i%9+1),kind:"other",title:"Entry "+i}));
    const r=await D.readTimelineShot(png(),fake({entries:many}),TODAY);
    eq(r.entries.length,6,"at most 6 entries are offered");
    eq(r.dropped,4,"the rest are counted as left out");
  }

  /* ===== nothing found, bad replies, failed requests ===== */
  {
    const none=await D.readTimelineShot(png(),fake({entries:[]}),TODAY);
    ok(none.entries.length===0&&!none.why&&!none.error,"no entries: nothing found");
    for(const [label,reply] of [["text","sorry"],["array",[HOTEL]],["no entries key",{places:[]}],["null",null]]){
      const r=await D.readTimelineShot(png(),fake(reply),TODAY);
      eq(r.error,"invalid_json",label+" reply: reported as a bad reply");eq(r.entries.length,0,label+" reply: no entries");
    }
    const f=await D.readTimelineShot(png(),fake(null,{code:"no_images"}),TODAY);
    eq(f.error,"no_images","a refused request passes its code through");
  }

  /* ===== saving, with and without the screenshot attached ===== */
  const log=[];let n=0,failUpload=false;
  const assets={upload:async b=>{log.push(["upload",b.type,b.size]);if(failUpload)throw new Error("boom");return {id:"f"+(++n).toString(16).padStart(31,"0"),url:"/x",sizeBytes:b.size,contentType:b.type}},
    delete:async id=>{log.push(["delete",id])}};
  {
    reset();win.claude=undefined;await D.tlAssetsInit();
    const [h]=(await D.readTimelineShot(png(),fake({entries:[HOTEL]}),TODAY)).entries;
    const r=await D.tlAddFromShot(h,png(),false);
    ok(r.entry&&!r.error&&!r.warn,"saving without the box: saved, no warning");
    eq(D.getState().timeline.length,1,"the entry is in the timeline");
    eq(D.getState().timeline[0].note,"Confirmation: HB7Q4K29","the saved note keeps the confirmation number");
    eq(D.getState().timeline[0].file,"","no file attached");
    const w=await D.tlAddFromShot(h,png(),true);
    ok(w.entry&&!w.error&&/can’t be attached|can't be attached/.test(w.warn||""),"box ticked where files can't be attached: saved, with a warning ("+w.warn+")");
    eq(D.getState().timeline.length,2,"that entry is saved too");
  }
  {
    reset();win.claude={use:async k=>k==="assets"?assets:null};await D.tlAssetsInit();log.length=0;
    const [h]=(await D.readTimelineShot(png(),fake({entries:[HOTEL]}),TODAY)).entries;
    const off=await D.tlAddFromShot(h,png(),false);
    ok(off.entry&&log.length===0,"box unticked: nothing is uploaded");
    const on=await D.tlAddFromShot(h,jpg(),true);
    ok(on.entry&&!on.warn&&!on.error,"box ticked: saved with no warning");
    eq(log.length,1,"one upload");ok(log[0]&&log[0][1]==="image/jpeg"&&log[0][2]===JPG.length,"the screenshot itself is uploaded");
    const saved=D.getState().timeline.find(e=>e.id===on.entry.id);
    ok(saved&&/^f[0-9a-f]{31}$/.test(saved.file),"the entry points at the uploaded file");
    failUpload=true;
    const fl=await D.tlAddFromShot(h,png(),true);
    ok(fl.entry&&fl.warn&&!fl.error,"upload fails: the entry is kept, with a warning ("+fl.warn+")");
    eq(D.getState().timeline.find(e=>e.id===fl.entry.id).file,"","no file on that entry");
    ok(!log.some(x=>x[0]==="delete"),"nothing is ever deleted");
    const bad=await D.tlAddFromShot(Object.assign({},h,{title:""}),png(),true);
    ok(bad.error&&!bad.entry,"a form the learner emptied is refused like any other ("+bad.error+")");
  }

  if(fails.length){console.error(fails.length+" of "+count+" checks failed:\n- "+fails.join("\n- "));process.exit(1)}
  console.log("OK, "+count+" checks passed");
})().catch(e=>{console.error("FAIL: "+(e&&e.stack||e));process.exit(1)});
