"use strict";
/* ---------- scripts ---------- */
let sub="hangul",selLetter=null,bld={i:0,m:0,f:0},drill={set:0,cur:null,opts:[],picked:null,score:0,n:0};
function nextWord(){
  if(!drill.set)drill.set=Math.min(3,curWeek());
  const pool=WORDS.filter(w=>w[3]<=drill.set);
  let w;do{w=pool[Math.floor(Math.random()*pool.length)]}while(drill.cur&&w===drill.cur&&pool.length>1);
  const others=shuffle(pool.filter(x=>x!==w)).slice(0,3);
  drill.cur=w;drill.opts=shuffle([w].concat(others));drill.picked=null;
}
function letterSay(L){const j=L[0];if(L[4]==="v")return compose(11,MED.indexOf(j),0);return compose(INIT.indexOf(j),0,0)}
function renderScripts(){
  const el=$("#v-scripts");
  const subs=`<div class="sub" role="group" aria-label="Topic">${[["hangul","Hangul (Korean alphabet)"],["tones","Mandarin tones"],["japanese","Japanese sounds"]].map(x=>`<button class="chip" data-sub="${x[0]}" aria-pressed="${sub===x[0]}">${x[1]}</button>`).join("")}</div>`;
  let body="";
  if(sub==="hangul"){
    if(!drill.cur)nextWord();
    const sets=[[1,"Set 1, week 1: the core fifteen"],[2,"Set 2, week 2: puffs of air, y-vowels, doubles"],[3,"Set 3, week 3: combined vowels"]];
    const L=selLetter!=null?LETTERS[selLetter]:null;
    const syl=compose(bld.i,bld.m,bld.f), fr=FIN.find(x=>x[0]===bld.f);
    const rom=INIT_R[bld.i]+MED_R[bld.m]+fr[2];
    const w=drill.cur;
    body=`
    <div class="panel"><h3>The letters</h3>
      <p class="meta" style="margin-top:6px;max-width:62ch">Hangul was designed in the 1440s to be learned in a morning: 24 basic letters, each with one main sound. Tap a letter to hear it and see a memory hook. Consonants are spoken with “ah” after them.</p>
      ${sets.map(s=>`<h4 style="margin:16px 0 0;font-size:.9rem">${s[1]}</h4><div class="grid">${LETTERS.map((x,i)=>x[3]===s[0]?`<button class="jamo" lang="ko" data-letter="${i}" aria-pressed="${selLetter===i}"><b>${x[0]}</b><span lang="en">${x[1]}</span></button>`:"").join("")}</div>`).join("")}
      <div class="detail" aria-live="polite">${L?`<div class="big" lang="ko">${L[0]}</div><div><strong>${h(L[1])}</strong><br>${h(L[2])}<div style="margin-top:6px">${hearBtn(letterSay(L),"kr","Hear "+letterSay(L))}</div></div>`:`<span class="meta">Tap any letter above.</span>`}</div>
    </div>
    <div class="panel"><h3>Build a syllable</h3>
      <p class="meta" style="margin-top:6px;max-width:62ch">Letters stack into square blocks, one block per syllable, read left to right and top to bottom. Tall vowels (ㅏ ㅓ ㅣ) sit to the right of the first consonant; flat vowels (ㅗ ㅜ ㅡ) sit underneath. An optional final consonant goes at the bottom, where only seven sounds are possible: k, n, t, l, m, p, ng.</p>
      <div class="builder">
        <div class="block"><div class="glyph" lang="ko">${syl}</div><div style="font-weight:600;font-size:1.2rem">${rom||"–"}</div><div style="margin-top:8px">${hearBtn(syl,"kr")}</div></div>
        <div class="pick">
          <h4>First consonant</h4><div class="chips" lang="ko">${INIT.map((x,i)=>`<button class="chip" data-bi="${i}" aria-pressed="${bld.i===i}">${x}</button>`).join("")}</div>
          <h4>Vowel</h4><div class="chips" lang="ko">${MED.map((x,i)=>`<button class="chip" data-bm="${i}" aria-pressed="${bld.m===i}">${x}</button>`).join("")}</div>
          <h4>Final consonant</h4><div class="chips">${FIN.map(x=>`<button class="chip" data-bf="${x[0]}" aria-pressed="${bld.f===x[0]}" ${x[0]?'lang="ko"':""}>${x[1]}</button>`).join("")}</div>
        </div>
      </div>
      <p class="meta" style="margin:10px 0 0">Try 한 (han) then 국 (guk): 한국, Korea.</p>
    </div>
    <div class="panel"><h3>Decoding drill</h3>
      <p class="meta" style="margin-top:6px;max-width:62ch">Real words you’ll see on signs and menus. Many are borrowed from English, so if you can sound them out you already know them.</p>
      <div class="chips" style="margin-top:10px" role="group" aria-label="Difficulty">${[1,2,3].map(n=>`<button class="chip" data-dset="${n}" aria-pressed="${drill.set===n}">Up to set ${n}</button>`).join("")}</div>
      <div style="text-align:center;margin-top:18px"><div class="nat" lang="ko">${w[0]}</div>${hearBtn(w[0],"kr")}</div>
      <div class="opts">${drill.opts.map((o,i)=>{let cls="";if(drill.picked!=null){if(o===w)cls="right";else if(i===drill.picked)cls="wrong"}return `<button data-dopt="${i}" class="${cls}" ${drill.picked!=null?"disabled":""}>${h(o[1])}</button>`}).join("")}</div>
      <div class="row" style="margin-top:14px;justify-content:space-between" aria-live="polite"><span>${drill.picked!=null?`<strong>${h(w[2])}</strong>: ${h(w[1])}`:"&nbsp;"}</span><span class="meta">${drill.score} of ${drill.n} right</span></div>
      ${drill.picked!=null?`<button class="btn" data-dnext="1" style="margin-top:10px">Next word</button>`:""}
    </div>`;
  }else if(sub==="tones"){
    const T=[["First tone","mā","媽","mother","High and level, like holding a sung note.","M6 9 H58"],
             ["Second tone","má","麻","hemp","Rising, like asking “What?”","M6 32 L58 8"],
             ["Third tone","mǎ","馬","horse","Low, with a dip. In fast speech it just stays low.","M6 18 Q28 46 58 14"],
             ["Fourth tone","mà","罵","to scold","A sharp drop, like a firm “No!”","M6 6 L58 34"]];
    body=`
    <div class="panel"><h3>Four tones, one syllable</h3>
      <p class="meta" style="margin-top:6px;max-width:62ch">In Mandarin the pitch shape of a syllable is part of the word. The marks over the vowels in romanization (pinyin) draw the shape. Don’t try to assemble phrases tone by tone; play each phrase and copy its whole tune.</p>
      <div class="tones">${T.map(t=>`<div class="tone"><svg viewBox="0 0 64 40" aria-hidden="true"><path d="${t[5]}"/></svg><b lang="zh-Hant">${t[2]}</b> <strong>${t[1]}</strong><div class="meta">${t[0]}: ${t[3]}</div><p style="margin:6px 0 8px;font-size:.92rem">${t[4]}</p>${hearBtn(t[2],"tw")}</div>`).join("")}</div>
      <p style="margin:14px 0 0;max-width:62ch">There is also a light, toneless syllable, as in the second half of xièxie (thank you) or the question ending ma. ${hearBtn("謝謝","tw","Hear xièxie")}</p>
    </div>
    <div class="panel"><h3>Reading the “sounds like” spellings</h3>
      <p class="meta" style="margin-top:6px;max-width:62ch">The plain-English spellings on the cards are approximations. These are the sounds English spelling handles worst.</p>
      <div class="scroll"><table class="key">
      <tr><th>shr, chr, jr</th><td>Curl your tongue back and buzz; there’s no real vowel. Pinyin writes these shi, chi, zhi.</td><td>${hearBtn("十","tw","shí, ten")}</td></tr>
      <tr><th>suh, tsuh</th><td>A hissed s or ts held with a buzz. Pinyin si, ci.</td><td>${hearBtn("四","tw","sì, four")}</td></tr>
      <tr><th>yoo / ü</th><td>Say “ee” and round your lips. Pinyin ü, or u after j, q, x, y.</td><td>${hearBtn("去","tw","qù, go")}</td></tr>
      <tr><th>x, q, zh, c</th><td>In pinyin, x is close to “sh,” q to “ch,” zh to “j,” and c to “ts.”</td><td>${hearBtn("請問","tw","qǐngwèn")}</td></tr>
      </table></div>
    </div>`;
  }else{
    body=`
    <div class="panel"><h3>Five vowels and an even rhythm</h3>
      <p class="meta" style="margin-top:6px;max-width:62ch">Japanese is the easiest of the three to pronounce. No tones to learn, and almost every sound exists in English.</p>
      <div class="scroll"><table class="key">
      <tr><th>a i u e o</th><td>Always “ah, ee, oo, eh, oh.” They never change.</td><td>${hearBtn("あいうえお","jp")}</td></tr>
      <tr><th>Even beats</th><td>Give every syllable the same length and weight. Not ko-NI-chi-wa but ko-n-ni-chi-wa.</td><td>${hearBtn("こんにちは","jp")}</td></tr>
      <tr><th>Long vowels</th><td>A line over a vowel (ō, ū) means hold it for two beats. It can change the word.</td><td>${hearBtn("ありがとう","jp","arigatō")}</td></tr>
      <tr><th>Quiet u</th><td>At the end of desu and masu the u almost disappears: “dess,” “mahss.”</td><td>${hearBtn("大丈夫です","jp","daijōbu desu")}</td></tr>
      <tr><th>r</th><td>A light tap of the tongue, between r, l and d.</td><td>${hearBtn("ラーメン","jp","rāmen")}</td></tr>
      </table></div>
    </div>
    <div class="panel"><h3>Three scripts, and how little you need</h3>
      <p style="margin-top:8px;max-width:62ch">Japanese mixes three writing systems in one sentence. For two days in Tokyo you don’t need to read any of them; station signs are in English too. It still helps to know what you’re looking at.</p>
      <div class="scroll"><table class="key">
      <tr><th>Kanji</th><td><span lang="ja">出口 東京 牛</span></td><td>Chinese characters. Many mean the same as in Taiwan, so week 7’s signs work in both places.</td></tr>
      <tr><th>Hiragana</th><td><span lang="ja">ありがとう</span></td><td>Curvy. Grammar and everyday native words.</td></tr>
      <tr><th>Katakana</th><td><span lang="ja">コーヒー ビール</span></td><td>Angular. Borrowed words, so menus are full of it: kōhī (coffee), bīru (beer).</td></tr>
      </table></div>
    </div>`;
  }
  el.innerHTML=`<h2>Sounds and scripts</h2>${subs}${body}`;
}
