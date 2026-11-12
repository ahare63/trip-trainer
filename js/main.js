"use strict";
/* Router and event handling. Loaded last; starts the app. */
const VIEWS=["plan","essentials","study","trip","scripts","phrasebook","customs","credits"];
const RENDER={plan:renderPlan,essentials:renderEssentials,study:renderStudy,trip:renderTrip,scripts:renderScripts,phrasebook:renderPhrasebook,customs:renderCustoms,credits:renderCredits};
function current(){const v=location.hash.replace("#","");return VIEWS.includes(v)?v:"plan"}
function render(){
  const v=current();
  VIEWS.forEach(x=>document.getElementById("v-"+x).classList.toggle("on",x===v));
  document.querySelectorAll("nav.tabs a").forEach(a=>{if(a.getAttribute("href")==="#"+v)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
  if(v==="study"&&session&&session.i>=session.q.length&&!session.done)session=null;
  RENDER[v]();
}
window.addEventListener("hashchange",()=>{render();window.scrollTo(0,0)});

document.addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b)return; const d=b.dataset;
  if(d.say!=null){speak(d.say,d.c);return}
  if(d.week){selWeek=+d.week;renderPlan();return}
  if(d.shift){state.start-=7*(+d.shift);selWeek=null;session=null;commit();renderPlan();return}
  if(d.filter){startSession(d.filter);renderStudy();return}
  if(d.ahead){startSession(session.filter,true);renderStudy();return}
  if(d.practice){startSession(session.filter,false,true);renderStudy();return}
  if(d.show){reveal();return}
  if(d.letters){studyLetters=!studyLetters;renderStudy();return}
  if(d.pbBreak){pbOpen[d.pbBreak]=!pbOpen[d.pbBreak];renderPhrasebook();return}
  if(d.pbLetters){pbLetters=!pbLetters;renderPhrasebook();return}
  if(d.grade){grade(d.grade==="1");return}
  if(d.sub){sub=d.sub;renderScripts();return}
  if(d.letter){selLetter=+d.letter;renderScripts();speak(letterSay(LETTERS[selLetter]),"kr");return}
  if(d.bi){bld.i=+d.bi;renderScripts();return}
  if(d.bm){bld.m=+d.bm;renderScripts();return}
  if(d.bf){bld.f=+d.bf;renderScripts();return}
  if(d.dset){drill.set=+d.dset;nextWord();renderScripts();return}
  if(d.dopt){const i=+d.dopt;drill.picked=i;drill.n++;if(drill.opts[i]===drill.cur)drill.score++;renderScripts();return}
  if(d.dnext){nextWord();renderScripts();return}
  if(d.pbc){pb.c=d.pbc;renderPhrasebook();return}
  if(d.build){buildTrip();return}
  if(d.handadd){addByHand();return}
  if(d.quickadd){quickAddNow();return}
  if(d.quickfrom!=null){quickFrom(pb.q.trim(),pb.c);return}
  if(d.keyclear){setKey("");trip.err="";renderTrip();return}
  if(d.holdadd||d.holddrop){if(resolveHold(d.holdadd||d.holddrop,!!d.holdadd)){session=null;renderTrip()}return}
  if(d.tl){tlAct(d.tl,d.id);return}
  if(d.tripdel){removeTripCard(d.tripdel);session=null;renderTrip();return}
  if(d.essc){essC=d.essc;renderEssentials();return}
  if(d.essquiz){const cs=essC==="all"?["tw","kr","jp"]:[essC];session={filter:"all",q:shuffle(essList(cs)).map(k=>({k,retry:true})),i:0,shown:false,done:0,practice:true};location.hash="study";return}
});
function reveal(){
  if(!session||session.shown)return; session.shown=true; renderStudy();
  const it=session.q[session.i]; if(state.auto&&it&&!isRecog(it.k))speak(it.k.nat,it.k.c);
  const g=document.querySelector('[data-grade="1"]'); if(g)g.focus({preventScroll:true});
}
document.addEventListener("change",e=>{
  if(e.target.id==="auto"){state.auto=e.target.checked;commit()}
  if(e.target.id==="pb-cat"){pb.cat=e.target.value;renderPhrasebook()}
  if(e.target.id==="hand-c"){trip.hand.c=e.target.value;const n=$("#hand-nat");if(n){n.lang=C[trip.hand.c].hl;n.placeholder=HAND_NAT[trip.hand.c]}}
  if(e.target.id==="quick-c")trip.quick.c=e.target.value;
  if(e.target.id==="tl-file"){const f=e.target.files[0];e.target.value="";tlFilePicked(f)}
  if(e.target.id==="trip-key"){setKey(e.target.value.trim());trip.err="";renderTrip()}
});
document.addEventListener("input",e=>{if(e.target.id==="pb-q"){pb.q=e.target.value;renderPhrasebook()}if(e.target.id==="trip-text")trip.text=e.target.value;if(e.target.dataset.tlf&&tlv.f)tlv.f[e.target.dataset.tlf]=e.target.value;if(e.target.id==="hand-en")trip.hand.en=e.target.value;if(e.target.id==="hand-nat")trip.hand.nat=e.target.value;if(e.target.id==="quick-text")trip.quick.text=e.target.value});
document.addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.isComposing&&e.target.id==="quick-text"){e.preventDefault();quickAddNow();return}
  if(current()!=="study"||!session||session.i>=session.q.length)return;
  const tag=(e.target.tagName||"").toLowerCase(); if(tag==="input"||tag==="select"||tag==="textarea")return;
  if(e.key===" "&&!session.shown&&tag!=="button"){e.preventDefault();reveal()}
  else if(session.shown&&e.key==="1")grade(false);
  else if(session.shown&&e.key==="2")grade(true);
});
render();
aiReady.then(()=>{if(current()==="trip"&&AI.mode!=="claude"&&!trip.busy)renderTrip()});
tl.ready.then(()=>{if(current()==="trip"&&!tlv.busy)renderTrip()});
connect();
