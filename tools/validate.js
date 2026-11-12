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
const dataFiles=srcs.filter(s=>s.startsWith("js/data/")||s==="js/cards.js"||s==="js/tones.js");
const code=dataFiles.map(s=>fs.readFileSync(path.join(root,s),"utf8").replace(/^"use strict";/,"")).join("\n")
  +"\n;({C,CATS,RECOG,WEEK_OF,RAW,WEEKS,ESS,INIT,MED,LETTERS,WORDS,CARDS,SITUATION_BY_CAT,SITUATION,situationOf,toneMarks,spokenTones:typeof spokenTones==='function'?spokenTones:()=>[]})";
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
const HAN_G=/[\u4e00-\u9fff]/g;
D.CARDS.filter(k=>k.c==="tw").forEach(k=>{
  const n=(k.nat.match(HAN_G)||[]).length,at="tw “"+k.en+"” ("+k.rom+")";
  let t,s;try{t=D.toneMarks(k.rom);s=D.spokenTones(k.rom)}catch(e){err(at+": "+e.message);return}
  if(t.length!==n)err(at+": "+t.length+" syllable(s) in pinyin but "+n+" Chinese character(s)");
  if(s.length!==t.length)err(at+": spoken tones give "+s.length+" syllable(s), written pinyin "+t.length);
});
// spoken contours: third-tone sandhi, low third before other tones, light-syllable pitch from the tone before it
[["nǐ hǎo",["2","3"]],["wǒ hěn hǎo",["2","2","3"]],["hǎochī",["3L","1"]],["kěyǐ shuākǎ ma",["2","3L","1","3L","n4"]],
 ["xièxie",["4","n1"]],["duìbuqǐ",["4","n1","3"]],["nǐ huì shuō Yīngwén ma",["3L","4","1","1","2","n3"]],
 ["wǒ duì … guòmǐn",["3L","4","4","3"]],["bú shì",["2","4"]],["zhēnzhū nǎichá",["1","1","3L","2"]],["Yī",["1"]],["Xīān",["1","1"]]
].forEach(([rom,want])=>{const got=D.spokenTones(rom);
  if(JSON.stringify(got)!==JSON.stringify(want))err("spokenTones(“"+rom+"”) gave "+JSON.stringify(got)+", expected "+JSON.stringify(want))});
const VIEWS=["plan","essentials","study","scripts","phrasebook","customs"];
if(D.WEEKS.length!==8)err("WEEKS must have 8 entries");
D.WEEKS.forEach((w,i)=>{if(!w.t||!w.d||!Array.isArray(w.tasks))err("Week "+(i+1)+" is incomplete");
  (w.tasks||[]).forEach(t=>{if(!VIEWS.includes(t[0]))err("Week "+(i+1)+" links to an unknown view: "+t[0])})});
D.ESS.forEach(r=>Object.keys(D.C).forEach(c=>{
  if(!Array.isArray(r[1][c])||!r[1][c].length)err("Essentials “"+r[0]+"” has nothing for "+c);
  (r[1][c]||[]).forEach(en=>{const n=D.CARDS.filter(k=>k.c===c&&k.en===en).length;if(n!==1)err("Essentials “"+r[0]+"” ("+c+"): “"+en+"” matches "+n+" cards, needs exactly 1")})}));
D.LETTERS.forEach(l=>{if((l[4]==="v"?D.MED:D.INIT).indexOf(l[0])<0)err("Hangul letter not in INIT/MED: "+l[0]);if(![1,2,3].includes(l[3]))err("Hangul letter set must be 1 to 3: "+l[0])});
D.WORDS.forEach(w=>{if(!/^[\uac00-\ud7af]+$/.test(w[0]))err("Decoding word must be Hangul only: "+w[0]);if(![1,2,3].includes(w[3]))err("Decoding word set must be 1 to 3: "+w[0])});

const SITUATION_CATS=["basics","order","num","around","help"];
const cardIds=new Set(D.CARDS.map(k=>k.id));
Object.keys(D.SITUATION_BY_CAT).forEach(c=>{if(!D.CATS[c])err("SITUATION_BY_CAT key is not a category: "+c)});
Object.keys(D.SITUATION).forEach(id=>{if(!cardIds.has(id))err("SITUATION key is not a card id: "+id)});
D.CARDS.forEach(k=>{
  const s=D.situationOf(k);
  if(D.RECOG[k.cat]){if(s!=="")err("Recognition card should have no situation label: "+k.id)}
  else if(SITUATION_CATS.includes(k.cat)){if(typeof s!=="string"||!s.trim())err("Card has no situation label: "+k.id)}
});
const situationLabels=new Set([...Object.values(D.SITUATION_BY_CAT),...Object.values(D.SITUATION)]);
if(situationLabels.size>10)err("Too many distinct situation labels ("+situationLabels.size+"), at most 10");
situationLabels.forEach(l=>{
  if(typeof l!=="string"||!l.trim()){err("Situation label is empty");return}
  if(l.length>32)err("Situation label over 32 characters: "+l);
  if(!/^[A-Z]/.test(l)||l.split(" ").slice(1).some(w=>/^[A-Z]/.test(w)))err("Situation label is not sentence case: "+l);
  if(/\.$/.test(l))err("Situation label ends with a period: "+l);
});

const per=Object.keys(D.RAW).map(c=>c+" "+D.RAW[c].length).join(", ");
if(errors.length){console.error(errors.length+" problem(s):\n- "+errors.join("\n- "));process.exit(1)}
console.log("OK: "+D.CARDS.length+" cards ("+per+"), "+D.LETTERS.length+" Hangul letters, "+D.WORDS.length+" decoding words");
