#!/usr/bin/env node
/* Tests the trip timeline (spec 09): node tools/test-timeline.js
   Loads the same scripts index.html does (minus the views and the router) in a sandbox.
   The only stub is claude.use("assets"), the platform boundary for attachments.
   Exits with code 1 and lists every failure. No dependencies. */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const srcs=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(s=>!s.startsWith("js/views/")&&s!=="js/main.js"&&fs.existsSync(path.join(root,s)));
const code=srcs.map(s=>fs.readFileSync(path.join(root,s),"utf8").replace(/^"use strict";/,"")).join("\n")
  +"\n;({blank,normalize,cleanEntry,cleanTimeline,tlSorted,tlFilter,tlSplit,tlNextUp,tlSave,tlAssetsInit,tlAttach,tlDropFile,tlDelete,tl,TL_MAX_FILE,getState:()=>state,setState:s=>{state=s}})";
const store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>{store.set(k,String(v))},removeItem:k=>{store.delete(k)}};
const win={};
let D;
try{D=vm.runInNewContext(code,{window:win,console,localStorage,URL,fetch:async()=>{throw new Error("no network in tests")}},{filename:"app"})}
catch(e){console.error("FAIL: the app scripts did not load with the timeline functions: "+e.message);process.exit(1)}

const fails=[];let count=0;
const ok=(cond,msg)=>{count++;if(!cond)fails.push(msg)};
const eq=(got,want,msg)=>ok(got===want,msg+" (got "+JSON.stringify(got)+", expected "+JSON.stringify(want)+")");
const same=(got,want,msg)=>eq(JSON.stringify(got),JSON.stringify(want),msg);
const E=(date,title,o)=>Object.assign({id:"tl-"+Math.random().toString(36).slice(2).padEnd(8,"0").slice(0,8),date,time:"",endDate:"",kind:"other",title,where:"",status:"booked",link:"",file:"",note:""},o);
const titles=a=>a.map(e=>e.title).join(" | ");
const TODAY="2026-11-12";

(async()=>{
  /* ===== sorting ===== */
  {
    const list=[E("2026-11-14","c late",{time:"18:30"}),E("2026-11-14","b early",{time:"07:05"}),E("2026-11-14","a untimed"),
      E("2026-11-13","z day before",{time:"23:59"}),E("2026-11-14","a2 untimed second"),E("2026-11-12","today")];
    const s=D.tlSorted(list);
    eq(titles(s),"today | z day before | a untimed | a2 untimed second | b early | c late","sorted by date, then time, untimed first on their day, ties keep entry order");
    eq(list[0].title,"c late","sorting does not reorder the saved list");
  }

  /* ===== earlier / next up ===== */
  {
    const list=D.tlSorted([E("2026-11-10","past flight"),E("2026-11-08","past hotel",{kind:"hotel",endDate:"2026-11-11"}),
      E("2026-11-11","current hotel",{kind:"hotel",endDate:"2026-11-15"}),
      E("2026-11-12","today untimed"),E("2026-11-12","today train",{time:"09:00"}),E("2026-12-01","later")]);
    const sp=D.tlSplit(list,TODAY);
    eq(titles(sp.earlier),"past hotel | past flight","entries that ended before today are Earlier");
    eq(titles(sp.upcoming),"current hotel | today untimed | today train | later","a stay still going today is not Earlier, nor is today or later");
    eq(titles(D.tlSplit(list,"2026-11-15").earlier),"past hotel | past flight | today untimed | today train","a stay is still shown on its last day");
    eq(D.tlNextUp(list,TODAY).title,"today untimed","next up is the first entry today or later");
    eq(D.tlNextUp(list,"2026-11-13").title,"later","next up moves on when today moves on");
    eq(D.tlNextUp(list,"2027-01-01"),null,"nothing is next up when everything is past");
    eq(D.tlNextUp([],TODAY),null,"nothing is next up in an empty timeline");
  }

  /* ===== filter ===== */
  {
    const list=[E("2026-11-12","a",{status:"booked"}),E("2026-11-13","b",{status:"to-book"}),E("2026-11-14","c",{status:"to-book"})];
    eq(titles(D.tlFilter(list,true)),"b | c","To book shows only to-book entries");
    eq(titles(D.tlFilter(list,false)),"a | b | c","no filter shows everything");
  }

  /* ===== sanitizing ===== */
  {
    const good={id:"tl-abcd1234",date:"2026-12-03",time:"14:20",endDate:"2026-12-06",kind:"hotel",title:"Grand Hyatt Taipei",where:"Taipei",status:"to-book",link:"https://example.com/booking?id=1&x=2",file:"a1b2c3d4e5f60718293a4b5c6d7e8f90",note:"Late check-in"};
    same(D.cleanEntry(good),good,"a valid entry is kept unchanged");
    eq(D.cleanEntry(Object.assign({},good,{link:"javascript:alert(1)"})).link,"","a javascript: link is dropped");
    eq(D.cleanEntry(Object.assign({},good,{link:"JaVaScRiPt:alert(1)"})).link,"","a mixed-case javascript: link is dropped");
    eq(D.cleanEntry(Object.assign({},good,{link:" \tjavascript:alert(1)"})).link,"","a javascript: link with leading whitespace is dropped");
    eq(D.cleanEntry(Object.assign({},good,{link:"data:text/html,<b>x</b>"})).link,"","a data: link is dropped");
    eq(D.cleanEntry(Object.assign({},good,{link:"ftp://example.com/x"})).link,"","an ftp: link is dropped");
    eq(D.cleanEntry(Object.assign({},good,{link:"example.com/no-scheme"})).link,"","a link with no scheme is dropped");
    eq(D.cleanEntry(Object.assign({},good,{link:"http://example.com/x"})).link,"http://example.com/x","an http: link is kept");
    eq(D.cleanEntry(Object.assign({},good,{link:"https://example.com/"+"a".repeat(600)})).link,"","an over-long link is dropped, not cut into a different address");
    eq(D.cleanEntry(Object.assign({},good,{date:""})),null,"an entry with no date is dropped");
    eq(D.cleanEntry(Object.assign({},good,{date:"2026-02-30"})),null,"an impossible date is dropped");
    eq(D.cleanEntry(Object.assign({},good,{date:"12/03/2026"})),null,"a date in another format is dropped");
    eq(D.cleanEntry(Object.assign({},good,{title:"  "})),null,"an entry with no title is dropped");
    eq(D.cleanEntry("junk"),null,"a non-object is dropped");
    eq(D.cleanEntry(Object.assign({},good,{time:"25:99"})).time,"","a bad time is cleared");
    eq(D.cleanEntry(Object.assign({},good,{endDate:"2026-12-01"})).endDate,"","an end date before the start is cleared");
    eq(D.cleanEntry(Object.assign({},good,{kind:"spaceship"})).kind,"other","an unknown kind becomes other");
    eq(D.cleanEntry(Object.assign({},good,{status:"maybe"})).status,"booked","an unknown status becomes booked");
    eq(D.cleanEntry(Object.assign({},good,{file:"../../etc/passwd"})).file,"","a file id that is not a plain id is dropped");
    eq(D.cleanEntry(Object.assign({},good,{id:"bad"})).id.length,11,"a bad id is replaced by tl- plus 8 characters");
    ok(/^tl-[a-z0-9]{8}$/.test(D.cleanEntry(Object.assign({},good,{id:"bad"})).id),"the replacement id has the tl-xxxxxxxx form");
    const long=D.cleanEntry(Object.assign({},good,{title:"t".repeat(500),where:"w".repeat(500),note:"n".repeat(2000)}));
    ok(long.title.length<=120&&long.where.length<=80&&long.note.length<=300,"strings are capped");
    const list=D.cleanTimeline([good,good,{date:"",title:"x"},null,Object.assign({},good,{id:"tl-zzzz9999"})]);
    eq(list.length,2,"duplicate ids and bad entries are dropped from a list");
    same(D.cleanTimeline("not a list"),[],"a non-list becomes an empty timeline");
  }

  /* ===== saved data ===== */
  {
    const old={start:5,cards:{"x":{b:2,due:9}},day:3,newDone:1,streak:2,lastDay:3,auto:true,updated:7,trip:[],hold:[],itin:"hi"};
    const s=D.normalize(JSON.parse(JSON.stringify(old)));
    same(s.timeline,[],"old saved data with no timeline loads with an empty one");
    eq(s.cards.x.b,2,"old progress survives");
    same(D.blank().timeline,[],"a fresh state has an empty timeline");
    const bad=D.normalize({timeline:[{id:"tl-aaaaaaaa",date:"2026-12-01",title:"ok",link:"javascript:1"},{title:"no date"}]});
    eq(bad.timeline.length,1,"normalize drops the dateless entry");
    eq(bad.timeline[0].link,"","normalize drops the bad link");
    eq(D.normalize({timeline:7}).timeline.length,0,"a corrupt timeline field loads as empty");
  }

  /* ===== entering and editing ===== */
  {
    D.setState(D.blank());
    const f={date:"2026-12-03",time:"",endDate:"",kind:"flight",title:"TPE → ICN, EVA BR170",where:"",status:"booked",link:"",note:""};
    const r=D.tlSave(f);
    ok(r.entry&&!r.error,"a valid entry saves");
    eq(D.getState().timeline.length,1,"the saved entry is in state");
    ok(/^tl-[a-z0-9]{8}$/.test(D.getState().timeline[0].id),"new entries get a tl-xxxxxxxx id");
    for(const [patch,word] of [[{title:" "},"title"],[{date:""},"date"],[{date:"2026-13-01"},"date"],[{time:"9am"},"time"],[{endDate:"2026-12-01"},"end date"],[{link:"javascript:alert(1)"},"http"],[{link:"mailto:a@b.co"},"http"],[{link:"www.example.com"},"http"]]){
      const n=D.getState().timeline.length;
      const x=D.tlSave(Object.assign({},f,patch));
      ok(!x.entry&&x.error&&x.error.toLowerCase().includes(word),"refused with a message mentioning "+word+": "+JSON.stringify(patch)+" (got "+JSON.stringify(x.error)+")");
      eq(D.getState().timeline.length,n,"a refused entry adds nothing: "+JSON.stringify(patch));
    }
    const id=D.getState().timeline[0].id;
    const e=D.tlSave(Object.assign({},f,{title:"TPE → ICN, EVA BR171",link:"https://example.com/t"}),id);
    eq(D.getState().timeline.length,1,"editing does not add an entry");
    eq(D.getState().timeline[0].title,"TPE → ICN, EVA BR171","editing changes the entry");
    eq(D.getState().timeline[0].id,id,"editing keeps the id");
  }

  /* ===== attachments, with only claude.use("assets") stubbed ===== */
  {
    eq(await D.tlAssetsInit(),null,"no window.claude: assets are unavailable");
    eq(D.tl.assets,null,"the attach control stays hidden");
    win.claude={use:async n=>n==="assets"?null:{}};
    eq(await D.tlAssetsInit(),null,"use('assets') resolving null: assets are unavailable");
    win.claude={use:async()=>{throw new Error("denied")}};
    eq(await D.tlAssetsInit(),null,"use('assets') throwing: assets are unavailable");

    const log=[];let n=0,failUpload=false,failDelete=false;
    const assets={upload:async b=>{log.push("upload");if(failUpload)throw new Error("boom");return {id:"f"+(++n).toString(16).padStart(31,"0"),url:"/x",sizeBytes:b.size,contentType:b.type}},
      delete:async id=>{log.push("delete "+id);if(failDelete)throw new Error("boom")}};
    win.claude={use:async()=>assets};
    eq(await D.tlAssetsInit(),assets,"assets available when use('assets') resolves");
    const calls=()=>log.splice(0);

    D.setState(D.blank());
    const a=D.tlSave({date:"2026-12-03",kind:"flight",title:"TPE → ICN, EVA BR170",status:"booked"}).entry;
    const b=D.tlSave({date:"2026-12-04",kind:"hotel",title:"Grand Hyatt Taipei",status:"booked"}).entry;
    const get=id=>D.getState().timeline.find(e=>e.id===id);
    const pdf=(size,type)=>({size:size===undefined?1000:size,type:type===undefined?"application/pdf":type});

    for(const [file,label] of [[pdf(1000,"text/html"),"HTML"],[pdf(1000,"image/gif"),"GIF"],[pdf(1000,""),"unknown type"],[pdf(D.TL_MAX_FILE+1),"a file over 20 MiB"],[pdf(0),"an empty file"]]){
      const r=await D.tlAttach(a.id,file);
      ok(r.error&&!r.ok,label+" is refused with a message");
    }
    eq(calls().length,0,"refused files are never uploaded");
    eq(get(a.id).file,"","refused files are not stored");

    let r=await D.tlAttach(a.id,pdf(D.TL_MAX_FILE));
    ok(r.ok,"a PDF at exactly 20 MiB uploads");
    const first=get(a.id).file;
    ok(/^[0-9a-f]{32}$/.test(first),"only the asset id is stored on the entry");
    eq(calls().join(","),"upload","uploading deletes nothing");
    ok(JSON.stringify(D.getState()).indexOf("/_blob")<0,"no URL is stored in state");

    for(const t of ["image/png","image/jpeg"]){r=await D.tlAttach(b.id,pdf(5,t));ok(r.ok,t+" uploads");await D.tlDropFile(b.id)}
    calls();

    /* replace: new file stored, old asset deleted afterwards */
    r=await D.tlAttach(a.id,pdf(50,"image/png"));
    const second=get(a.id).file;
    ok(r.ok&&second!==first,"replacing stores the new id");
    eq(calls().join(","),"upload,delete "+first,"replacing uploads first, then deletes the old asset");

    /* failed upload leaves the old file alone */
    failUpload=true;
    r=await D.tlAttach(a.id,pdf(60));
    ok(r.error&&!r.ok,"a rejected upload reports a message");
    eq(get(a.id).file,second,"a rejected upload keeps the old file on the entry");
    eq(calls().join(","),"upload","a rejected upload deletes nothing");
    failUpload=false;

    /* failed delete during replace: new file is kept, learner is told */
    failDelete=true;
    r=await D.tlAttach(a.id,pdf(70));
    const third=get(a.id).file;
    ok(r.ok&&third!==second&&r.warn,"a rejected delete during replace keeps the new file and warns");
    calls();
    failDelete=false;

    /* remove the file */
    failDelete=true;
    r=await D.tlDropFile(a.id);
    ok(r.error&&!r.ok,"a rejected delete reports a message");
    eq(get(a.id).file,third,"the file stays on the entry when its delete is rejected");
    failDelete=false;calls();
    r=await D.tlDropFile(a.id);
    ok(r.ok,"removing a file works");
    eq(get(a.id).file,"","the entry no longer has a file");
    eq(calls().join(","),"delete "+third,"removing deletes exactly that asset");

    /* delete the entry */
    await D.tlAttach(b.id,pdf(5));const bf=get(b.id).file;calls();
    failDelete=true;
    r=await D.tlDelete(b.id);
    ok(r.error&&!r.ok&&get(b.id),"a rejected asset delete keeps the entry");
    failDelete=false;calls();
    r=await D.tlDelete(b.id);
    ok(r.ok&&!get(b.id),"deleting an entry removes it");
    eq(calls().join(","),"delete "+bf,"deleting an entry deletes its asset");
    r=await D.tlDelete(a.id);
    ok(r.ok&&!get(a.id),"deleting an entry with no file works");
    eq(calls().length,0,"deleting an entry with no file deletes no asset");

    /* nothing deletes on load or normalize */
    const withFile={timeline:[{id:"tl-aaaaaaaa",date:"2026-12-01",title:"x",file:"abc123"}]};
    D.normalize(withFile);D.normalize({timeline:[{id:"tl-bbbbbbbb",date:"bad",title:"y",file:"def456"}]});
    await D.tlAssetsInit();
    eq(calls().length,0,"loading, sanitizing and initialising never delete an asset");

    /* without assets, attaching is refused and nothing is called */
    win.claude=undefined;await D.tlAssetsInit();
    D.setState(D.normalize(withFile));
    r=await D.tlAttach("tl-aaaaaaaa",pdf(5));
    ok(r.error&&!r.ok,"attaching without the assets capability is refused");
  }

  if(fails.length){console.error(fails.length+" of "+count+" checks FAILED:\n- "+fails.join("\n- "));process.exit(1)}
  console.log("OK: "+count+" timeline checks passed");
})().catch(e=>{console.error("FAIL: "+(e&&e.stack||e));process.exit(1)});
