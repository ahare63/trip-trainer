#!/usr/bin/env node
/* Checks the course data. Run after every change: node tools/validate.js
   Exits with code 1 and lists every problem if anything is wrong. No dependencies. */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const srcs=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m=>m[1]);
const errors=[],err=m=>errors.push(m);
for(const s of srcs)if(!fs.existsSync(path.join(root,s)))err("index.html loads a missing file: "+s);

// load the data files and the card builder in a sandbox
const dataFiles=srcs.filter(s=>s.startsWith("js/data/")).concat("js/cards.js");
const code=dataFiles.map(s=>fs.readFileSync(path.join(root,s),"utf8").replace(/^"use strict";/,"")).join("\n")
  +"\n;({C,CATS,RECOG,WEEK_OF,RAW,WEEKS,ESS,INIT,MED,LETTERS,WORDS,CARDS,SIGN_STYLE:typeof SIGN_STYLE==='undefined'?undefined:SIGN_STYLE})";
let D;
try{D=vm.runInNewContext(code,{},{filename:"data"})}catch(e){console.error("Data files failed to load: "+e.message);process.exit(1)}

const HAN=/[\u4e00-\u9fff]/,KANA=/[\u3040-\u30ff]/,HANGUL=/[\uac00-\ud7af]/,CJK=/[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/;
const scriptOK={tw:n=>HAN.test(n)&&!KANA.test(n)&&!HANGUL.test(n),kr:n=>HANGUL.test(n)&&!KANA.test(n)&&!HAN.test(n),jp:n=>(KANA.test(n)||HAN.test(n))&&!HANGUL.test(n)};
const ids=new Set();
for(const c of Object.keys(D.RAW)){
  if(!D.C[c]){err("Unknown country key in RAW: "+c);continue}
  D.RAW[c].forEach((r,i)=>{
    const at=c+" row "+(i+1)+" ("+(r&&r[1])+")";
    if(!Array.isArray(r)||r.length<5||r.length>6||r.some(x=>typeof x!=="string")){err(at+": needs 5 or 6 strings");return}
    const [cat,en,nat,rom,say,note]=r;
    if(!D.CATS[cat])err(at+": unknown category "+cat);
    if(!D.WEEK_OF[c][cat])err(at+": category "+cat+" has no week in WEEK_OF."+c);
    if(!en.trim()||!nat.trim()||!rom.trim()||!say.trim())err(at+": empty field");
    if(!scriptOK[c](nat))err(at+": native text is not in the expected script");
    if(CJK.test(en)||CJK.test(say)||CJK.test(rom))err(at+": English, romanization and sounds-like must not contain native script");
    if(/['"]/.test(en+(note||"")))err(at+": use curly quotes (’ “ ”) in English text and notes");
    if(en.length>60)err(at+": English text is over 60 characters");
  });
}
D.CARDS.forEach(k=>{if(ids.has(k.id))err("Duplicate card id: "+k.id);ids.add(k.id)});
const pairs={};D.CARDS.forEach(k=>{const p=k.c+"|"+k.cat+"|"+k.en;if(pairs[p])err("Two cards share country, category and English text: "+p);pairs[p]=1});
const VIEWS=["plan","essentials","study","scripts","phrasebook","customs"];
if(D.WEEKS.length!==8)err("WEEKS must have 8 entries");
D.WEEKS.forEach((w,i)=>{if(!w.t||!w.d||!Array.isArray(w.tasks))err("Week "+(i+1)+" is incomplete");
  (w.tasks||[]).forEach(t=>{if(!VIEWS.includes(t[0]))err("Week "+(i+1)+" links to an unknown view: "+t[0])})});
D.ESS.forEach(r=>Object.keys(D.C).forEach(c=>{
  if(!Array.isArray(r[1][c])||!r[1][c].length)err("Essentials “"+r[0]+"” has nothing for "+c);
  (r[1][c]||[]).forEach(en=>{const n=D.CARDS.filter(k=>k.c===c&&k.en===en).length;if(n!==1)err("Essentials “"+r[0]+"” ("+c+"): “"+en+"” matches "+n+" cards, needs exactly 1")})}));
D.LETTERS.forEach(l=>{if((l[4]==="v"?D.MED:D.INIT).indexOf(l[0])<0)err("Hangul letter not in INIT/MED: "+l[0]);if(![1,2,3].includes(l[3]))err("Hangul letter set must be 1 to 3: "+l[0])});
D.WORDS.forEach(w=>{if(!/^[\uac00-\ud7af]+$/.test(w[0]))err("Decoding word must be Hangul only: "+w[0]);if(![1,2,3].includes(w[3]))err("Decoding word set must be 1 to 3: "+w[0])});
if(!D.SIGN_STYLE)err("js/data/signs.js must be loaded in index.html and define SIGN_STYLE");
else{
  const STYLES=["board","door","notice","plaque","compass"],has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  D.CARDS.filter(k=>k.cat==="sign").forEach(k=>{if(!has(D.SIGN_STYLE,k.id))err("Sign card has no SIGN_STYLE entry: "+k.id)});
  Object.keys(D.SIGN_STYLE).forEach(id=>{
    if(!ids.has(id))err("SIGN_STYLE key is not a card id: "+id);
    if(!STYLES.includes(D.SIGN_STYLE[id]))err("SIGN_STYLE "+id+" must be one of "+STYLES.join(", ")+", not "+D.SIGN_STYLE[id]);
  });
}

const per=Object.keys(D.RAW).map(c=>c+" "+D.RAW[c].length).join(", ");
if(errors.length){console.error(errors.length+" problem(s):\n- "+errors.join("\n- "));process.exit(1)}
console.log("OK: "+D.CARDS.length+" cards ("+per+"), "+D.LETTERS.length+" Hangul letters, "+D.WORDS.length+" decoding words");
