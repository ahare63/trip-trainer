"use strict";
/* ---------- photo credits ---------- */
function renderCredits(){
  const list=CARDS.filter(k=>PHOTOS[k.id]);
  $("#v-credits").innerHTML=`<h2>Photo credits</h2><p class="lede">Dish photos come from Wikimedia Commons. Each keeps its own license, and the photographers keep their credit. Follow a link to see the original file page.</p>
  <ul class="credits">${list.map(k=>{const p=PHOTOS[k.id];return `<li><strong>${h(k.en)}</strong> (${C[k.c].name}): “${h(p.title)}” by ${h(p.author)}, ${h(p.license)}. <a href="${h(p.source)}" target="_blank" rel="noopener">Source</a></li>`}).join("")}</ul>`;
}
