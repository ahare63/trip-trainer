"use strict";
/* Saved progress, small helpers and audio. Loaded before the views. */
/* ---------- state ---------- */
const KEY="trip-phrasebook-v1", NEW_PER_DAY=12, GAP=[0,1,2,4,8,16];
const today=()=>{const d=new Date();return Math.floor((d.getTime()-d.getTimezoneOffset()*60000)/864e5)};
function blank(){return {start:today(),cards:{},day:0,newDone:0,streak:0,lastDay:0,auto:true,updated:0,trip:[],hold:[],itin:"",timeline:[],notes:{}}}
/* trip cards: written by a model from the learner's notes, so every field is checked and capped on the way in */
function cleanCard(x){
  if(!x||typeof x!=="object"||!C[x.c])return null;
  const t=(v,n)=>typeof v==="string"?v.trim().slice(0,n):"";
  const k={id:/^trip-[a-z0-9]{8}$/.test(x.id)?x.id:"trip-"+Math.random().toString(36).slice(2).padEnd(8,"0").slice(0,8),c:x.c,
    kind:["place","dish","phrase"].includes(x.kind)?x.kind:"phrase",en:t(x.en,90),nat:t(x.nat,80),rom:t(x.rom,160),say:t(x.say,160),note:t(x.note,300)};
  return k.en&&k.nat?k:null}
function cleanList(a){const seen={};
  return (Array.isArray(a)?a:[]).map(cleanCard).filter(k=>k&&!seen[k.id]&&(seen[k.id]=1)).slice(0,150)}
/* timeline entries: typed by the learner, but saved data and synced data are checked the same way */
const TL_KINDS=["flight","train","bus","hotel","activity","other"],TL_MAX=200;
const tlDate=v=>{if(typeof v!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+"T00:00:00Z");return !isNaN(d)&&d.toISOString().slice(0,10)===v};
const tlTime=v=>typeof v==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const tlLink=v=>{if(typeof v!=="string"||v.length>500)return false;try{const u=new URL(v);return u.protocol==="https:"||u.protocol==="http:"}catch(e){return false}};
function cleanEntry(x){
  if(!x||typeof x!=="object"||!tlDate(x.date))return null;
  const t=(v,n)=>typeof v==="string"?v.trim().slice(0,n):"";
  const title=t(x.title,120); if(!title)return null;
  const link=typeof x.link==="string"?x.link.trim():"";
  return {id:/^tl-[a-z0-9]{8}$/.test(x.id)?x.id:"tl-"+Math.random().toString(36).slice(2).padEnd(8,"0").slice(0,8),
    date:x.date,time:tlTime(x.time)?x.time:"",endDate:tlDate(x.endDate)&&x.endDate>=x.date?x.endDate:"",
    kind:TL_KINDS.includes(x.kind)?x.kind:"other",title,where:t(x.where,80),status:x.status==="to-book"?"to-book":"booked",
    link:tlLink(link)?link:"",file:typeof x.file==="string"&&/^[\w-]{1,64}$/.test(x.file)?x.file:"",note:t(x.note,300)}}
function cleanTimeline(a){const seen={};
  return (Array.isArray(a)?a:[]).map(cleanEntry).filter(e=>e&&!seen[e.id]&&(seen[e.id]=1)).slice(0,TL_MAX)}
/* generated notes: {tripCardId: {body, at}}, kept only while the trip card exists */
const NOTE_MAX=3000;
function cleanNotes(o,trip){
  const ids=new Set(trip.map(k=>k.id)),out={};
  if(!o||typeof o!=="object"||Array.isArray(o))return out;
  Object.keys(o).forEach(id=>{const n=o[id];
    if(ids.has(id)&&n&&typeof n==="object"&&typeof n.body==="string"&&n.body.trim()&&n.body.length<=NOTE_MAX&&typeof n.at==="number"&&isFinite(n.at))out[id]={body:n.body,at:n.at}});
  return out}
function syncTrip(){
  for(let i=CARDS.length-1;i>=0;i--)if(CARDS[i].cat==="trip")CARDS.splice(i,1);
  state.trip.forEach((x,i)=>CARDS.push({id:x.id,c:x.c,wk:0,cat:"trip",kind:x.kind,en:x.en,nat:x.nat,rom:x.rom,say:x.say,note:x.note,ord:i}))}
function normalize(s){const b=blank();if(!s||typeof s!=="object")return b;
  const trip=cleanList(s.trip);
  return {start:+s.start||b.start,cards:(s.cards&&typeof s.cards==="object")?s.cards:{},day:+s.day||0,newDone:+s.newDone||0,streak:+s.streak||0,lastDay:+s.lastDay||0,auto:s.auto!==false,updated:+s.updated||0,
    trip,hold:cleanList(s.hold),itin:typeof s.itin==="string"?s.itin.slice(0,4000):"",timeline:cleanTimeline(s.timeline),notes:cleanNotes(s.notes,trip)}}
let state=blank();
try{const s=localStorage.getItem(KEY);if(s)state=normalize(JSON.parse(s))}catch(e){}
syncTrip();
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
      if(remote.updated>state.updated){state=remote;syncTrip();saveLocal();session=null;if(!trip.busy){trip.text=null;render()}}
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
