#!/usr/bin/env node
/* Tests skipping a card (spec 13): node tools/test-skip.js
   Loads every script index.html loads, main.js included, in a sandbox. Buttons are clicked by reading their
   data-* attributes out of the rendered HTML and handing them to the app's own click listener.
   The only stubs are page elements. Exits with code 1 and lists every failure. No dependencies. */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const srcs=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]).filter(s=>fs.existsSync(path.join(root,s)));
const KEY="trip-phrasebook-v1";

function boot(saved){
  const store=new Map();if(saved)store.set(KEY,JSON.stringify(saved));
  const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>{store.set(k,String(v))},removeItem:k=>{store.delete(k)}};
  const els={},el=id=>els[id]||(els[id]={id,innerHTML:"",textContent:"",style:{},dataset:{},value:"",classList:{toggle(){},contains:()=>false},focus(){}});
  const on={};
  const document={getElementById:el,querySelector:s=>s.startsWith("#")?el(s.slice(1)):null,querySelectorAll:()=>[],
    addEventListener:(t,f)=>{(on[t]=on[t]||[]).push(f)}};
  const location={hash:"#study"};
  const window={addEventListener(){},scrollTo(){}};
  const code=srcs.map(s=>fs.readFileSync(path.join(root,s),"utf8").replace(/^"use strict";/,"")).join("\n")
    +"\n;({CARDS,h,blank,render,startSession,getState:()=>state,setState:s=>{state=s;syncTrip()},setSession:s=>{session=s},getSession:()=>session})";
  const D=vm.runInNewContext(code,{window,document,location,console,localStorage,URL,setTimeout,clearTimeout,Promise,
    fetch:async()=>{throw new Error("no network in tests")}},{filename:"app"});
  const view=v=>{location.hash="#"+v;D.render();return el("v-"+v).innerHTML};
  /* click the first button in markup whose text includes label */
  const click=(markup,label)=>{
    const m=[...markup.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g)].find(x=>x[2].replace(/<[^>]+>/g,"").includes(label));
    if(!m)return false;
    const dataset={};for(const a of m[1].matchAll(/data-([a-z-]+)="([^"]*)"/g))dataset[a[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=a[2].replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
    const b={dataset};(on.click||[]).forEach(f=>f({target:{closest:()=>b}}));return true};
  const stored=()=>JSON.parse(store.get(KEY)||"null");
  return {D,view,click,toast:()=>el("toast").innerHTML||el("toast").textContent,studyHTML:()=>el("v-study").innerHTML,saved:stored,el};
}

const fails=[];let count=0;
const ok=(cond,msg)=>{count++;if(!cond)fails.push(msg)};
const SKIP="Skip this card",BACK="Bring back to study";
const A=boot();
const card=(c,en)=>{const k=A.D.CARDS.find(x=>x.c===c&&x.en===en);if(!k)throw new Error("no card "+c+" “"+en+"”");return k};
const veg=card("tw","I’m vegetarian"),half=card("tw","Half sugar"),beef=card("tw","Beef");
const skipSaved=id=>{const s=A.saved();return !!s&&Array.isArray(s.skip)&&s.skip.includes(id)};
const shows=(s,k)=>s.includes(A.D.h(k.en));
const fresh=()=>{const s=A.D.blank();A.D.setState(s);return s};
const session=(ks,shown,practice)=>A.D.setSession({filter:"all",q:ks.map(k=>({k,retry:false})),i:0,shown:!!shown,done:0,practice:!!practice});

/* ===== skip from the front of a new card ===== */
{
  fresh();session([veg,half,veg]);
  const front=A.view("study");
  ok(shows(front,veg),"front: the vegetarian card is showing");
  ok(front.includes(SKIP),"front: has a Skip this card button");
  ok(A.click(front,SKIP),"front: Skip this card can be clicked");
  const next=A.studyHTML();
  ok(shows(next,half)&&!shows(next,veg),"after skip: the next card shows");
  ok(next.includes("1 left"),"after skip: every copy of the skipped card left the session (1 left)");
  ok(A.D.getState().newDone===0,"after skip: a skipped new card doesn’t use up a new-card slot");
  ok(/skipped/i.test(A.toast())&&A.toast().includes("Undo"),"after skip: the toast says skipped and offers Undo");
  ok(skipSaved(veg.id),"after skip: the skip is saved");
  ok(A.click(A.toast(),"Undo"),"Undo can be clicked");
  const back=A.studyHTML();
  ok(shows(back,veg),"after Undo: the skipped card is the current card again");
  ok(back.includes("2 left"),"after Undo: the card is back in the session once (2 left)");
  ok(!skipSaved(veg.id),"after Undo: the skip is no longer saved");
}

/* ===== skip from the answer side ===== */
{
  fresh();session([veg,half],true);
  const ans=A.view("study");
  ok(ans.includes(SKIP),"answer side: has a Skip this card button");
  A.click(ans,SKIP);
  ok(shows(A.studyHTML(),half),"answer side: skipping moves on to the next card");
}

/* ===== later queues leave skipped cards out; progress survives and comes back ===== */
{
  const st=fresh(),t=st.start;
  st.cards[veg.id]={b:3,due:t};st.cards[half.id]={b:2,due:t};st.cards[beef.id]={b:2,due:t};
  session([veg]);A.click(A.view("study"),SKIP);
  let seenVeg=false;
  for(let i=0;i<20;i++){A.D.startSession("all",false,true);if(A.D.getSession().q.some(x=>x.k.id===veg.id))seenVeg=true}
  ok(!seenVeg,"practice: a skipped card is never picked");
  ok([half,beef].every(k=>A.D.getSession().q.some(x=>x.k.id===k.id)),"practice: the other seen cards are still picked");
  A.D.startSession("all");
  ok(!A.D.getSession().q.some(x=>x.k.id===veg.id),"today’s queue: a skipped due card is left out");
  ok([half,beef].every(k=>A.D.getSession().q.some(x=>x.k.id===k.id)),"today’s queue: the other due cards are still there");
  ok(A.saved().cards[veg.id].b===3,"skip keeps the card’s saved progress");
  A.D.startSession("all",true);
  ok(!A.D.getSession().q.some(x=>x.k.id===veg.id),"learn more: a skipped card is left out");
}

/* ===== phrasebook marks skipped cards and brings them back ===== */
{
  const B=boot(),st=B.D.blank();B.D.setState(st);
  const k=B.D.CARDS.find(x=>x.c==="tw"&&x.en==="I’m vegetarian"),menu=B.D.CARDS.find(x=>x.c==="tw"&&x.en==="Vegetarian");
  st.cards[k.id]={b:3,due:st.start};
  B.D.setSession({filter:"all",q:[{k,retry:false}],i:0,shown:false,done:0,practice:false});
  B.click(B.view("study"),SKIP);
  B.view("phrasebook");
  const list=()=>B.el("pb-list").innerHTML;
  const entry=(s,card)=>{const i=s.indexOf(B.D.h(card.en)+" <span");if(i<0)return "";const j=s.indexOf('<div class="entry"',i);return s.slice(i,j<0?undefined:j)};
  ok(shows(list(),k),"phrasebook: still lists the skipped card");
  ok(/Skipped/.test(entry(list(),k))&&entry(list(),k).includes(BACK),"phrasebook: the skipped card is marked and has Bring back to study");
  ok(!entry(list(),menu).includes(BACK),"phrasebook: a card that isn’t skipped has no Bring back button");
  ok(B.click(entry(list(),k),BACK),"phrasebook: Bring back to study can be clicked");
  ok(!entry(list(),k).includes(BACK),"after bring back: the phrasebook no longer marks it");
  B.view("study");B.D.startSession("all");
  ok(B.D.getSession().q.some(x=>x.k.id===k.id),"after bring back: the card is due again with its old progress");
  B.D.setSession({filter:"all",q:[{k,retry:false}],i:0,shown:false,done:0,practice:false});
  ok(!B.view("study").includes(", new"),"after bring back: the card isn’t shown as new");
}

/* ===== Undo pressed after moving to the phrasebook updates it ===== */
{
  const B=boot();B.D.setState(B.D.blank());
  const k=B.D.CARDS.find(x=>x.c==="tw"&&x.en==="I’m vegetarian");
  B.D.setSession({filter:"all",q:[{k,retry:false}],i:0,shown:false,done:0,practice:false});
  B.click(B.view("study"),SKIP);
  ok(B.view("phrasebook")&&B.el("pb-list").innerHTML.includes(BACK),"undo elsewhere: the phrasebook shows the skip");
  B.click(B.toast(),"Undo");
  ok(!B.el("pb-list").innerHTML.includes(BACK),"undo elsewhere: the phrasebook updates when Undo is pressed there");
}

/* ===== Undo only goes back into the session the skip came from ===== */
{
  const B=boot(),st=B.D.blank();B.D.setState(st);
  const k=B.D.CARDS.find(x=>x.c==="tw"&&x.en==="I’m vegetarian"),kr=B.D.CARDS.find(x=>x.c==="kr"&&x.en==="Hello");
  st.cards[k.id]={b:4,due:st.start+5};st.cards[kr.id]={b:1,due:st.start};
  B.D.setSession({filter:"all",q:[{k,retry:true}],i:0,shown:false,done:0,practice:true});
  B.click(B.view("study"),SKIP);
  B.click(B.studyHTML(),"Korea");
  B.click(B.toast(),"Undo");
  ok(!shows(B.studyHTML(),k),"undo after switching to Korea: the Taiwan card isn’t put into the Korean session");
  B.D.startSession("all");
  ok(B.D.getSession().q.filter(x=>x.k.id===k.id).length===0&&B.saved().cards[k.id].b===4,"undo after switching: the card keeps box 4 and comes back on its own schedule");
}
{
  const B=boot(),st=B.D.blank();B.D.setState(st);
  const k=B.D.CARDS.find(x=>x.c==="tw"&&x.en==="I’m vegetarian");
  st.cards[k.id]={b:2,due:st.start};
  B.D.setSession({filter:"all",q:[{k,retry:false}],i:0,shown:false,done:0,practice:false});
  B.click(B.view("study"),SKIP);
  B.view("phrasebook");B.click(B.el("pb-list").innerHTML,BACK);
  B.D.startSession("all");
  B.click(B.toast(),"Undo");
  ok(B.D.getSession().q.filter(x=>x.k.id===k.id).length===1,"bring back, new session, then Undo: the card is in the session once");
}

/* ===== bringing a card back doesn’t throw away the session in progress ===== */
{
  const B=boot();B.D.setState(B.D.blank());
  const k=B.D.CARDS.find(x=>x.c==="tw"&&x.en==="I’m vegetarian");
  B.D.setSession({filter:"all",q:[{k,retry:false},{k:half,retry:false},{k:beef,retry:false}],i:0,shown:false,done:0,practice:false});
  B.click(B.view("study"),SKIP);
  B.view("phrasebook");B.click(B.el("pb-list").innerHTML,BACK);
  ok(/[> ]2 left</.test(B.view("study")),"bring back: the study session in progress keeps its place");
}

/* ===== the Essentials quiz has no skip ===== */
{
  const B=boot();B.D.setState(B.D.blank());
  B.view("essentials");
  ok(B.click(B.el("v-essentials").innerHTML,"Quiz"),"essentials: the quiz can be started");
  ok(!B.view("study").includes(SKIP),"essentials quiz: no Skip this card button");
}

/* ===== Plan totals ===== */
{
  const B=boot(),st=B.D.blank();B.D.setState(st);
  const n=B.D.CARDS.filter(x=>x.c==="tw").length;
  const tw=s=>{const m=/<span>Taiwan<\/span>[\s\S]*?(\d+) of (\d+)/.exec(s);return m?+m[2]:-1};
  ok(tw(B.view("plan"))===n,"plan: Taiwan total counts every card when none are skipped");
  B.D.setSession({filter:"all",q:[{k:B.D.CARDS.find(x=>x.c==="tw"&&x.en==="I’m vegetarian"),retry:false}],i:0,shown:false,done:0,practice:false});
  B.click(B.view("study"),SKIP);
  ok(tw(B.view("plan"))===n-1,"plan: Taiwan total leaves out the skipped card");
}

/* ===== Talk readiness counts only cards still in study ===== */
{
  const B=boot(),st=B.D.blank();B.D.setState(st);
  const tws=B.D.CARDS.filter(x=>x.c==="tw"&&x.cat!=="trip").slice(0,10);
  tws.forEach(k=>{st.cards[k.id]={b:1,due:st.start+1}});
  ok(!/You’ve seen \d+/.test(B.view("talk")),"talk: ten seen Taiwan cards are enough");
  B.D.setSession({filter:"all",q:[{k:tws[0],retry:false}],i:0,shown:false,done:0,practice:true});
  B.click(B.view("study"),SKIP);
  ok(/You’ve seen 9\b/.test(B.view("talk")),"talk: a skipped card doesn’t count toward the ten");
}

/* ===== trip cards have Remove on Your trip, so no skip ===== */
{
  const B=boot(),st=B.D.blank();
  st.trip=[{id:"trip-abcd1234",c:"tw",kind:"place",en:"Hotel Test",nat:"測試飯店",rom:"cèshì fàndiàn",say:"tseh-shr fahn-dyen",note:""}];
  B.D.setState(st);
  const k=B.D.CARDS.find(x=>x.id==="trip-abcd1234");
  B.D.setSession({filter:"all",q:[{k,retry:false}],i:0,shown:false,done:0,practice:false});
  ok(!B.view("study").includes(SKIP),"trip card front: no Skip this card button");
  B.D.setSession({filter:"all",q:[{k,retry:false}],i:0,shown:true,done:0,practice:false});
  ok(!B.view("study").includes(SKIP),"trip card answer: no Skip this card button");
}

/* ===== saved data: old data without skip loads; junk in skip is dropped ===== */
{
  const old=boot({start:1,cards:{},day:0,newDone:0,streak:0,lastDay:0,auto:true,updated:5});
  const n=old.D.CARDS.filter(x=>x.c==="tw").length;
  ok(/Taiwan<\/span>[\s\S]*? of /.test(old.view("plan"))&&old.view("plan").includes(" of "+n+"<"),"old saved data without skip: loads with nothing skipped");
  old.D.setSession({filter:"all",q:[{k:old.D.CARDS.find(x=>x.en==="I’m vegetarian"),retry:false}],i:0,shown:false,done:0,practice:false});
  ok(old.view("study").includes(SKIP),"old saved data without skip: Skip this card works");
  const trip=[{id:"trip-abcd1234",c:"tw",kind:"place",en:"Hotel Test",nat:"測試飯店",rom:"cèshì fàndiàn",say:"tseh-shr fahn-dyen",note:""}];
  const junk=boot({start:1,cards:{},updated:5,trip,skip:["tw-order-i-m-vegetarian","tw-order-i-m-vegetarian","not-a-card",7,"trip-abcd1234",null]});
  ok(junk.view("plan").includes(" of "+(junk.D.CARDS.filter(x=>x.c==="tw").length-1)+"<"),"saved skip list: the real course card is skipped");
  junk.click(junk.view("plan"),"Skip ahead a week");
  ok(JSON.stringify(junk.saved().skip)==='["tw-order-i-m-vegetarian"]',"saved skip list: keeps the one course card once and drops the rest, trip ids included");
}

/* ===== Regular ice card ===== */
{
  const k=A.D.CARDS.find(x=>x.c==="tw"&&x.en==="Regular ice");
  ok(k&&k.nat==="正常冰"&&k.cat==="order","tw has a Regular ice order card, 正常冰");
}

if(fails.length){console.error(fails.map(f=>"FAIL: "+f).join("\n")+"\n"+fails.length+" of "+count+" skip checks failed");process.exit(1)}
console.log("OK: "+count+" skip checks passed");
