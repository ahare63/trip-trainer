"use strict";
/* Saved progress, small helpers and audio. Loaded before the views. */
/* ---------- state ---------- */
const KEY="trip-phrasebook-v1", NEW_PER_DAY=12, GAP=[0,1,2,4,8,16];
const today=()=>{const d=new Date();return Math.floor((d.getTime()-d.getTimezoneOffset()*60000)/864e5)};
function blank(){return {start:today(),cards:{},day:0,newDone:0,streak:0,lastDay:0,auto:true,updated:0}}
function normalize(s){const b=blank();if(!s||typeof s!=="object")return b;
  return {start:+s.start||b.start,cards:(s.cards&&typeof s.cards==="object")?s.cards:{},day:+s.day||0,newDone:+s.newDone||0,streak:+s.streak||0,lastDay:+s.lastDay||0,auto:s.auto!==false,updated:+s.updated||0}}
let state=blank();
try{const s=localStorage.getItem(KEY);if(s)state=normalize(JSON.parse(s))}catch(e){}
let docRef=null,saving=false,dirty=false,saveTimer=null;
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
function commit(){state.updated=Date.now();saveLocal();if(docRef){dirty=true;clearTimeout(saveTimer);saveTimer=setTimeout(flush,1500)}}
async function flush(){if(!docRef||saving||!dirty)return;saving=true;dirty=false;
  try{await docRef.set(JSON.parse(JSON.stringify(state)))}catch(e){if(e&&e.code==="unavailable"){dirty=true}else{docRef=null;setSync(false)}}
  saving=false;if(dirty&&docRef){clearTimeout(saveTimer);saveTimer=setTimeout(flush,1500)}}
function setSync(on){document.getElementById("sync").textContent=on?"Progress is saved to your account, so it follows you between phone and computer.":"Progress is saved on this device."}
async function connect(){
  if(!window.claude||!window.claude.use)return;
  try{
    const [db,user]=await Promise.all([window.claude.use("db"),window.claude.use("user")]);
    if(!db||!user)return;
    const id=await user.id(); if(!id)return;
    const ref=db.doc("data/users/"+id+"/progress");
    const snap=await ref.get();
    docRef=ref;setSync(true);
    if(snap.exists){
      const remote=normalize(JSON.parse(JSON.stringify(snap.data())));
      if(remote.updated>state.updated){state=remote;saveLocal();session=null;render()}
      else if(state.updated>remote.updated){dirty=true;flush()}
    }else if(state.updated){dirty=true;flush()}
  }catch(e){docRef=null}
}

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const h=s=>String(s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const curWeek=()=>Math.max(1,Math.min(8,Math.floor((today()-state.start)/7)+1));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
let toastTimer;
function toast(msg){const t=$("#toast");t.textContent=msg;t.style.display="block";clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.style.display="none",4500)}
const bul=c=>`<span class="bul" data-c="${c}">${C[c].code}</span>`;
const hearBtn=(text,c,label)=>`<button class="hear" data-c="${c}" data-say="${h(text)}">${label||"Hear it"}</button>`;
const signClass=k=>k.cat==="sign"?` sign sign-${h(SIGN_STYLE[k.id])}`:"";

const dishPhoto=(k,lazy)=>PHOTOS[k.id]?`<img class="dish-photo" src="${h(PHOTOS[k.id].file)}" alt="${h(k.en)}"${lazy?' loading="lazy"':""}>`:"";

/* ---------- audio ---------- */
let voices=[];
function loadVoices(){try{voices=window.speechSynthesis.getVoices()||[]}catch(e){voices=[]}}
if("speechSynthesis" in window){loadVoices();try{window.speechSynthesis.addEventListener("voiceschanged",loadVoices)}catch(e){}}
function pickVoice(lang){const norm=v=>(v.lang||"").replace("_","-").toLowerCase();const pre=lang.slice(0,2).toLowerCase();
  return voices.find(v=>norm(v)===lang.toLowerCase())||voices.find(v=>norm(v).startsWith(pre))||null}
function speak(text,c){
  if(!("speechSynthesis" in window)){toast("This browser can’t play speech. Use the “sounds like” spelling instead.");return}
  if(!voices.length)loadVoices();
  const v=pickVoice(C[c].lang);
  if(voices.length&&!v){toast("No "+C[c].tongue+" voice is installed on this device. You can add one in your system’s text-to-speech settings.");return}
  try{const u=new SpeechSynthesisUtterance(text.replace(/[…?]/g," ").trim());u.lang=C[c].lang;if(v)u.voice=v;u.rate=0.8;
    window.speechSynthesis.cancel();window.speechSynthesis.speak(u)}catch(e){toast("Audio didn’t start. Use the “sounds like” spelling instead.")}
}
