"use strict";
/* ---------- credits: dish photos and card icons ---------- */
function renderCredits(){
  const list=CARDS.filter(k=>PHOTOS[k.id]);
  $("#v-credits").innerHTML=`<h2>Credits</h2><p class="lede">Card icons are from <a href="https://openmoji.org/" target="_blank" rel="noopener">OpenMoji</a>, the open-source emoji and icon project, under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. The outline versions are drawn here in each country’s colour, some combined with a no sign or a price tag; these adapted versions are shared under the same license.</p><h3 style="margin-top:20px">Dish photos</h3><p class="lede">Dish photos come from Wikimedia Commons. Each keeps its own license, and the photographers keep their credit. Follow a link to see the original file page. The photos here have been resized and recompressed.</p>
  <ul class="credits">${list.map(k=>{const p=PHOTOS[k.id],u=licenseURL(p.license);return `<li><strong>${h(k.en)}</strong> (${C[k.c].name}): “${h(p.title)}” by ${h(p.author)}, ${u?`<a href="${h(u)}" target="_blank" rel="noopener">${h(p.license)}</a>`:h(p.license)}. <a href="${h(p.source)}" target="_blank" rel="noopener">Source</a></li>`}).join("")}</ul>`;
}
