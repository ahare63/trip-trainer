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
  +"\n;({C,CATS,RECOG,WEEK_OF,RAW,WEEKS,ESS,INIT,MED,LETTERS,WORDS,CARDS,PHOTOS,PHOTOS_MISSING,licenseURL:typeof licenseURL==='function'?licenseURL:()=>'',SITUATION_BY_CAT,SITUATION,situationOf,toneMarks,spokenTones:typeof spokenTones==='function'?spokenTones:()=>[],SIGN_STYLE:typeof SIGN_STYLE==='undefined'?undefined:SIGN_STYLE,PARTS:typeof PARTS==='undefined'?undefined:PARTS,PARTS_SKIPPED:typeof PARTS_SKIPPED==='undefined'?undefined:PARTS_SKIPPED})";
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
const VIEWS=["plan","essentials","study","trip","scripts","phrasebook","customs","credits"];
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

// dish photos
const LICENSES=["Public domain","CC0","CC0 1.0","CC BY 1.0","CC BY 2.0","CC BY 2.5","CC BY 3.0","CC BY 4.0","CC BY-SA 1.0","CC BY-SA 2.0","CC BY-SA 2.5","CC BY-SA 3.0","CC BY-SA 4.0"];
const MAX_KB=60,MAX_W=640;
function jpegWidth(buf){
  if(buf[0]!==0xFF||buf[1]!==0xD8)return null;
  let i=2;
  while(i+9<buf.length){
    if(buf[i]!==0xFF){i++;continue}
    const m=buf[i+1];
    if(m===0xFF){i++;continue}
    if(m===0xD8||(m>=0xD0&&m<=0xD7)||m===0x01){i+=2;continue}
    const len=buf.readUInt16BE(i+2);
    if(m>=0xC0&&m<=0xCF&&m!==0xC4&&m!==0xC8&&m!==0xCC)return buf.readUInt16BE(i+7);
    i+=2+len;
  }
  return null;
}
const dishIds=new Set(D.CARDS.filter(k=>k.cat==="dish").map(k=>k.id));
Object.keys(D.PHOTOS).forEach(id=>{
  const p=D.PHOTOS[id],at="Photo "+id;
  if(!dishIds.has(id))err(at+": not a dish card id");
  if(D.PHOTOS_MISSING.includes(id))err(at+": is in both PHOTOS and PHOTOS_MISSING");
  if(p.file!=="images/dishes/"+id+".jpg")err(at+": file must be images/dishes/"+id+".jpg");
  const f=path.join(root,p.file||"");
  if(!p.file||!fs.existsSync(f))err(at+": image file is missing");
  else{
    const buf=fs.readFileSync(f);
    if(buf.length>MAX_KB*1024)err(at+": image is "+(buf.length/1024).toFixed(1)+" kB, limit "+MAX_KB);
    const w=jpegWidth(buf);
    if(w===null)err(at+": not a readable JPEG");
    else if(w>MAX_W)err(at+": image is "+w+" px wide, limit "+MAX_W);
  }
  if(!LICENSES.includes(p.license))err(at+": license “"+p.license+"” is not in the allowed list");
  else if(p.license!=="Public domain"&&!/^https:\/\/creativecommons\.org\/(licenses|publicdomain)\//.test(D.licenseURL(p.license)))err(at+": no license link for “"+p.license+"”");
  if(!p.title||!String(p.title).trim())err(at+": title is missing");
  if(!p.author||!String(p.author).trim())err(at+": author is missing");
  if(!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:\S+$/.test(p.source||""))err(at+": source must be a https://commons.wikimedia.org/wiki/File: URL");
});
[["CC BY-SA 2.5","https://creativecommons.org/licenses/by-sa/2.5/"],["CC BY 4.0","https://creativecommons.org/licenses/by/4.0/"],
 ["CC0","https://creativecommons.org/publicdomain/zero/1.0/"],["CC0 1.0","https://creativecommons.org/publicdomain/zero/1.0/"],["Public domain",""]
].forEach(([l,want])=>{const got=D.licenseURL(l);if(got!==want)err("licenseURL(“"+l+"”) gave “"+got+"”, expected “"+want+"”")});
D.PHOTOS_MISSING.forEach(id=>{if(!dishIds.has(id))err("PHOTOS_MISSING: not a dish card id: "+id)});
if(new Set(D.PHOTOS_MISSING).size!==D.PHOTOS_MISSING.length)err("PHOTOS_MISSING has duplicates");
dishIds.forEach(id=>{if(!D.PHOTOS[id]&&!D.PHOTOS_MISSING.includes(id))err("Dish card "+id+" is in neither PHOTOS nor PHOTOS_MISSING")});

// word and character breakdowns
if(!D.PARTS||!Array.isArray(D.PARTS_SKIPPED))err("js/data/parts-tw.js must be loaded in index.html and define PARTS and PARTS_SKIPPED");
else{
  const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),byId={};D.CARDS.forEach(k=>byId[k.id]=k);
  const BLANK=/^[\s\p{P}]+$/u,STRAIGHT=/['"]/;
  if(new Set(D.PARTS_SKIPPED).size!==D.PARTS_SKIPPED.length)err("PARTS_SKIPPED has duplicates");
  D.PARTS_SKIPPED.forEach(id=>{if(!byId[id])err("PARTS_SKIPPED: not a card id: "+id);if(has(D.PARTS,id))err("Card is in both PARTS and PARTS_SKIPPED: "+id)});
  D.CARDS.forEach(k=>{if(!has(D.PARTS,k.id)&&!D.PARTS_SKIPPED.includes(k.id))err("Card is in neither PARTS nor PARTS_SKIPPED: "+k.id)});
  Object.keys(D.PARTS).forEach(id=>{
    const e=D.PARTS[id],k=byId[id],at="PARTS "+id;
    if(!k){err(at+": not a card id");return}
    if(!e||!Array.isArray(e.parts)||!e.parts.length){err(at+": needs a non-empty parts array");return}
    if(e.parts.some(p=>!Array.isArray(p)||p.length!==2||typeof p[0]!=="string"||!p[0]||typeof p[1]!=="string")){err(at+": each part must be [chunk, gloss], two strings, chunk not empty");return}
    const joined=e.parts.map(p=>p[0]).join("");
    if(joined!==k.nat)err(at+": chunks join to “"+joined+"”, card says “"+k.nat+"”");
    if(e.parts.filter(p=>p[1]).length<2)err(at+": fewer than two glossed chunks; list it in PARTS_SKIPPED instead");
    const enWords=new Set(k.en.match(/[A-Za-z]+/g)||[]);
    e.parts.forEach(([chunk,gloss])=>{
      const g=at+" “"+chunk+"”";
      if(!gloss){if(!BLANK.test(chunk))err(g+": only punctuation, spaces and placeholders may have an empty gloss");return}
      if(BLANK.test(chunk))err(g+": punctuation, spaces and placeholders get an empty gloss");
      if(gloss!==gloss.trim())err(g+": gloss has leading or trailing spaces");
      if(gloss.length>24)err(g+": gloss is over 24 characters: "+gloss);
      if(STRAIGHT.test(gloss))err(g+": use curly quotes (’ “ ”) in the gloss");
      (gloss.match(/[A-Za-z]+/g)||[]).forEach(w=>{if(/[A-Z]/.test(w)&&!enWords.has(w))err(g+": gloss must be lowercase (“"+w+"” is not capitalized in the card’s English)")});
    });
    Object.keys(e).forEach(f=>{if(f!=="parts"&&f!=="lit")err(at+": unknown field "+f)});
    if(has(e,"lit")){
      if(typeof e.lit!=="string"||!e.lit.trim())err(at+": lit must be a non-empty string");
      else{if(e.lit.length>60)err(at+": lit is over 60 characters");if(STRAIGHT.test(e.lit))err(at+": use curly quotes (’ “ ”) in lit")}
    }
  });
}

const per=Object.keys(D.RAW).map(c=>c+" "+D.RAW[c].length).join(", ");
if(errors.length){console.error(errors.length+" problem(s):\n- "+errors.join("\n- "));process.exit(1)}
console.log("OK: "+D.CARDS.length+" cards ("+per+"), "+D.LETTERS.length+" Hangul letters, "+D.WORDS.length+" decoding words");
