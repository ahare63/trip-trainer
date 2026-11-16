#!/usr/bin/env node
/* Tests what a study card shows (spec 12): node tools/test-cards.js
   Loads the same scripts index.html does, plus the study view, in a sandbox, renders real cards
   and checks the HTML a learner gets: where the icon is, and what sits inside “More info”.
   The only stub is the element the view writes into. Exits with code 1 and lists every failure. No dependencies. */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const srcs=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1])
  .filter(s=>(!s.startsWith("js/views/")||s==="js/views/study.js")&&s!=="js/main.js"&&fs.existsSync(path.join(root,s)));
const code=srcs.map(s=>fs.readFileSync(path.join(root,s),"utf8").replace(/^"use strict";/,"")).join("\n")
  +"\n;({CARDS,PHOTOS,PARTS,isDish,isRecog,toneLine,hearBtn,h,normalize,blank,cleanCard,syncTrip,renderStudy,getState:()=>state,setState:s=>{state=s},setSession:s=>{session=s}})";
const store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>{store.set(k,String(v))},removeItem:k=>{store.delete(k)}};
const view={innerHTML:""};
const document={querySelector:s=>s==="#v-study"?view:null,getElementById:()=>null};
let D;
try{D=vm.runInNewContext(code,{window:{},document,console,localStorage,URL,fetch:async()=>{throw new Error("no network in tests")}},{filename:"app"})}
catch(e){console.error("FAIL: the app scripts did not load with the study view: "+e.message);process.exit(1)}

const fails=[];let count=0;
const ok=(cond,msg)=>{count++;if(!cond)fails.push(msg)};

function show(k,shown){
  D.setSession({filter:"all",q:[{k,retry:false}],i:0,shown,done:0,practice:true});
  D.renderStudy();
  const out=view.innerHTML,m=/<details class="more"([^>]*)>([\s\S]*?)<\/details>/.exec(out);
  return {all:out,more:m?m[2]:"",open:m?/\bopen\b/.test(m[1]):false,hasMore:!!m,rest:m?out.replace(m[0],""):out};
}
const ICON_RE=/images\/icons\/([0-9A-F]+(?:-[0-9A-F]+)*)\.svg/g;
const icons=s=>[...s.matchAll(ICON_RE)].map(m=>m[0]);
const iconOK=(s,msg)=>{const f=icons(s);ok(f.length>0,msg+": shows an icon");f.forEach(p=>ok(fs.existsSync(path.join(root,p)),msg+": icon file "+p+" exists"))};
const card=(c,en)=>{const k=D.CARDS.find(x=>x.c===c&&x.en===en);if(!k)throw new Error("no card "+c+" “"+en+"”");return k};
const has=(s,text)=>s.includes(D.h(text));
const ROM="Standard romanization";
/* inside(b,text): in More info and nowhere else on the card; fails when there is no More info at all */
const inside=(b,text)=>b.hasMore&&has(b.more,text)&&!has(b.rest,text);
const outside=(b,text)=>has(b.rest,text)&&!has(b.more,text);

D.setState(D.blank());

/* ===== production card, Taiwan ===== */
{
  const k=card("tw","Half sugar");
  const front=show(k,false);
  iconOK(front.all,"tw “Half sugar” front");
  ok(has(front.all,k.en),"tw “Half sugar” front: shows the English");
  ok(!has(front.all,k.nat),"tw “Half sugar” front: does not show the characters");
  const back=show(k,true);
  ok(back.hasMore,"tw “Half sugar” answer: has a More info section");
  iconOK(back.rest,"tw “Half sugar” answer, outside More info");
  ok(has(back.rest,k.nat),"tw “Half sugar” answer: characters are outside More info");
  ok(has(back.rest,k.say),"tw “Half sugar” answer: sounds-like is outside More info");
  ok(back.rest.includes(D.hearBtn(k.nat,k.c))&&!back.more.includes(D.hearBtn(k.nat,k.c)),"tw “Half sugar” answer: audio button is outside More info");
  ok(D.toneLine(k)&&back.rest.includes(D.toneLine(k))&&!back.more.includes(D.toneLine(k)),"tw “Half sugar” answer: tone line is outside More info");
  ok(inside(back,k.rom)&&inside(back,ROM),"tw “Half sugar” answer: romanization is only inside More info");
  ok(inside(back,k.note),"tw “Half sugar” answer: note is only inside More info");
}
{
  const k=card("tw","Hello"),lit=D.PARTS[k.id].lit,back=show(k,true);
  ok(inside(back,lit),"tw “Hello” answer: literal translation is only inside More info");
  ok(inside(back,"good, well"),"tw “Hello” answer: breakdown glosses are only inside More info");
}
{
  const k=card("jp","Thank you");
  iconOK(show(k,false).all,"jp “Thank you” front");
  ok(inside(show(k,true),k.rom),"jp “Thank you” answer: romanization is only inside More info");
}

/* ===== production card, Korea: letters toggle lives in More info, no tone line ===== */
{
  const k=D.CARDS.find(x=>x.c==="kr"&&!D.isRecog(x)&&D.PARTS[x.id]);
  const back=show(k,true);
  ok(back.hasMore&&back.more.includes("Show letters")&&!back.rest.includes("Show letters"),"kr “"+k.en+"” answer: Show letters is inside More info");
  ok(inside(back,k.rom),"kr “"+k.en+"” answer: romanization is only inside More info");
  ok(!back.all.includes('class="tone-line"'),"kr “"+k.en+"” answer: no tone line");
}

/* ===== sign card: no icon on the front, icon on the answer ===== */
{
  const k=D.CARDS.find(x=>x.c==="tw"&&x.cat==="sign");
  const front=show(k,false);
  ok(icons(front.all).length===0,"tw sign “"+k.en+"” front: shows no icon");
  const back=show(k,true);
  iconOK(back.rest,"tw sign “"+k.en+"” answer, outside More info");
  ok(has(back.rest,k.en),"tw sign “"+k.en+"” answer: English is outside More info");
  ok(inside(back,k.rom),"tw sign “"+k.en+"” answer: romanization is only inside More info");
}

/* ===== menu word: its note is a language tip, so it goes in More info ===== */
{
  const k=card("kr","Meat");
  ok(icons(show(k,false).all).length===0,"kr menu “Meat” front: shows no icon");
  const back=show(k,true);
  iconOK(back.rest,"kr menu “Meat” answer, outside More info");
  ok(inside(back,k.note),"kr menu “Meat” answer: note is only inside More info");
}

/* ===== dish with a photo: photo, no icon, note stays visible ===== */
{
  const k=card("tw","Pork belly bun");
  ok(D.PHOTOS[k.id],"tw “Pork belly bun” has a photo");
  const front=show(k,false);
  ok(icons(front.all).length===0&&!front.all.includes("dish-photo"),"tw “Pork belly bun” front: no icon and no photo");
  const back=show(k,true);
  ok(back.rest.includes('class="dish-photo"'),"tw “Pork belly bun” answer: photo is outside More info");
  ok(icons(back.all).length===0,"tw “Pork belly bun” answer: no icon next to the photo");
  ok(outside(back,k.note),"tw “Pork belly bun” answer: note is outside More info");
  ok(back.rest.includes(D.hearBtn(k.nat,k.c)),"tw “Pork belly bun” answer: audio button is outside More info");
  ok(has(back.rest,k.say),"tw “Pork belly bun” answer: sounds-like is outside More info");
  ok(D.toneLine(k)&&back.rest.includes(D.toneLine(k)),"tw “Pork belly bun” answer: tone line is outside More info");
  ok(inside(back,k.rom),"tw “Pork belly bun” answer: romanization is only inside More info");
}

/* ===== dish without a photo gets an icon on the answer only ===== */
{
  const k=D.CARDS.find(x=>D.isDish(x)&&x.cat==="dish"&&!D.PHOTOS[x.id]);
  ok(k,"there is a dish card without a photo");
  if(k){
    ok(icons(show(k,false).all).length===0,"dish without photo “"+k.en+"” front: shows no icon");
    iconOK(show(k,true).rest,"dish without photo “"+k.en+"” answer");
  }
}

/* ===== trip cards: a generic icon by kind ===== */
{
  const s=D.blank();
  s.trip=["place","dish","phrase"].map((kind,i)=>D.cleanCard({id:"trip-test000"+i,c:"jp",kind,en:"Test "+kind,nat:"テスト",rom:"tesuto",say:"teh-soo-toh",note:"A note."}));
  D.setState(s);D.syncTrip();
  const seen={};
  ["place","dish","phrase"].forEach((kind,i)=>{
    const k=D.CARDS.find(x=>x.id==="trip-test000"+i);
    const back=show(k,true),f=icons(back.rest);
    if(kind==="dish")ok(icons(show(k,false).all).length===0,"trip dish front: shows no icon (local script is the question)");
    else iconOK(show(k,false).all,"trip "+kind+" front");
    iconOK(back.rest,"trip "+kind+" answer");
    seen[kind]=f.join(" ");
    if(kind==="dish")ok(outside(back,k.note),"trip dish answer: note is outside More info");
    else ok(inside(back,k.note),"trip "+kind+" answer: note is only inside More info");
  });
  ok(seen.place!==seen.dish&&seen.dish!==seen.phrase&&seen.place!==seen.phrase,"trip place, dish and phrase cards show different icons");
  D.setState(D.blank());D.syncTrip();
}

/* ===== More info remembers whether it was left open ===== */
{
  const k=card("tw","Half sugar");
  ok(!show(k,true).open,"More info starts closed");
  const s=D.normalize(JSON.parse(JSON.stringify(Object.assign(D.blank(),{more:true}))));
  D.setState(s);
  ok(show(k,true).open,"More info renders open when it was left open, after a save and load");
  const old=D.blank();delete old.more;
  D.setState(D.normalize(JSON.parse(JSON.stringify(old))));
  ok(!show(k,true).open,"a saved state from before this change loads with More info closed");
  ["yes",1,null].forEach(v=>{D.setState(D.normalize(Object.assign(D.blank(),{more:v})));ok(!show(k,true).open,"a saved more of "+JSON.stringify(v)+" loads with More info closed")});
  D.setState(D.blank());
}

if(fails.length){console.error(fails.length+" of "+count+" check(s) failed:\n- "+fails.join("\n- "));process.exit(1)}
console.log("OK: "+count+" card display checks");
