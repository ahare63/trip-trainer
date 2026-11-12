"use strict";
/* ---------- tone contours ---------- */
const PY_INITIALS=["zh","ch","sh","b","p","m","f","d","t","n","l","g","k","h","j","q","x","r","z","c","s","y","w"];
const PY_FINALS=["a","o","e","ai","ei","ao","ou","an","en","ang","eng","ong","er","i","ia","ie","iao","iu","ian","in","iang","ing","iong","u","ua","uo","uai","ui","uan","un","uang","ueng","ue"];
const PY_SYLLABLES=(()=>{const s=new Set(["m","n","ng","r"]);PY_FINALS.forEach(f=>{s.add(f);PY_INITIALS.forEach(i=>s.add(i+f))});return s})();
const PY_MARK={"̄":1,"́":2,"̌":3,"̀":4};
const PY_MAXLEN=6;

function pySegment(base,tone){
  const memo=[];
  const best=from=>{
    if(from===base.length)return[];
    if(memo[from]!==undefined)return memo[from];
    let out=null;
    for(let end=Math.min(base.length,from+PY_MAXLEN);end>from;end--){
      if(!PY_SYLLABLES.has(base.slice(from,end)))continue;
      const marks=new Set(tone.slice(from,end).filter(Boolean));
      if(marks.size>1)continue;
      const rest=best(end);
      if(rest===null)continue;
      if(out===null||rest.length+1<out.length)out=[marks.size?[...marks][0]:0].concat(rest);
    }
    return memo[from]=out;
  };
  return best(0);
}

function toneMarks(rom){
  const out=[];
  rom.normalize("NFD").split(/[^a-zA-Z̀-̌]+/).forEach(word=>{
    if(!word)return;
    let base="",tone=[];
    for(const ch of word){
      if(PY_MARK[ch])tone[tone.length-1]=PY_MARK[ch];
      else if(!/[̀-ͯ]/.test(ch)){base+=ch.toLowerCase();tone.push(0)}
    }
    const segs=pySegment(base,tone);
    if(segs===null)throw new Error("Cannot split pinyin into syllables: "+rom);
    out.push(...segs);
  });
  return out;
}

const TONE_PATH={1:"M6 9 H58",2:"M6 32 L58 8",3:"M6 18 Q28 46 58 14",4:"M6 6 L58 34",0:"M32 20 h.1"};
function toneSVG(tones){
  const g=tones.map((t,i)=>`<path transform="translate(${i*64} 0)" d="${TONE_PATH[t]}"${t?"":' stroke-width="12"'}/>`).join("");
  return `<svg class="tonestrip" viewBox="0 0 ${tones.length*64} 40" width="${tones.length*22}" height="14" aria-hidden="true" fill="none" stroke-linecap="round" stroke-width="6" style="stroke:var(--tw)">${g}</svg>`;
}
function toneLine(k){
  if(k.c!=="tw")return "";
  let t;try{t=toneMarks(k.rom)}catch(e){return ""}
  return `<div class="tone-line">${toneSVG(t)}</div>`;
}
