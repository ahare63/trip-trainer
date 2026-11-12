"use strict";
/* Korean alphabet data for the Sounds and scripts view. */
const INIT=["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const INIT_R=["g","kk","n","d","tt","r","m","b","pp","s","ss","","j","jj","ch","k","t","p","h"];
const MED=["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
const MED_R=["a","ae","ya","yae","eo","e","yeo","ye","o","wa","wae","oe","yo","u","wo","we","wi","yu","eu","ui","i"];
const FIN=[[0,"none",""],[1,"ㄱ","k"],[4,"ㄴ","n"],[7,"ㄷ","t"],[8,"ㄹ","l"],[16,"ㅁ","m"],[17,"ㅂ","p"],[19,"ㅅ","t"],[21,"ㅇ","ng"]];
const FIN_ALL=["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const compose=(i,m,f)=>String.fromCharCode(0xAC00+(i*21+m)*28+f);
const splitHangul=block=>{
  const c=block.codePointAt(0)-0xAC00;
  if(block.length!==1||c<0||c>=11172)return [block];
  const f=c%28;
  return [INIT[Math.floor(c/588)],MED[Math.floor((c%588)/28)]].concat(f?[FIN_ALL[f]]:[]);
};
// [letter, romanization, hint, set, type]
const LETTERS=[
["ㅏ","a","“ah,” as in father. The short stroke points right.",1,"v"],
["ㅓ","eo","“uh,” as in sun. The short stroke points left.",1,"v"],
["ㅗ","o","“oh,” as in go. The stroke points up.",1,"v"],
["ㅜ","u","“oo,” as in moon. The stroke points down.",1,"v"],
["ㅡ","eu","Say “oo” but smile instead of rounding your lips.",1,"v"],
["ㅣ","i","“ee,” as in see. A straight line, like the letter i.",1,"v"],
["ㄱ","g / k","Shaped like a gun. Soft g at the start of a word, k at the end.",1,"c"],
["ㄴ","n","Shaped like a nose in profile.",1,"c"],
["ㄷ","d / t","A door frame. Between d and t.",1,"c"],
["ㄹ","r / l","A winding road. A quick tongue-tap between r and l; clearly l at the end of a syllable.",1,"c"],
["ㅁ","m","A square mouth.",1,"c"],
["ㅂ","b / p","A bucket. Between b and p.",1,"c"],
["ㅅ","s","A ski slope. Becomes “sh” before ㅣ, so 시 is “shee.”",1,"c"],
["ㅇ","– / ng","A zero. Silent placeholder before a vowel; “ng” at the bottom of a block.",1,"c"],
["ㅈ","j","A jug with a lid. Between j and ch.",1,"c"],
["ㅊ","ch","ㅈ wearing a hat. The extra stroke means a puff of air.",2,"c"],
["ㅋ","k","ㄱ with an extra stroke: k with a puff of air, as in key.",2,"c"],
["ㅌ","t","ㄷ with an extra stroke: t with a puff of air.",2,"c"],
["ㅍ","p","Looks like the Greek letter pi. P with a puff of air.",2,"c"],
["ㅎ","h","A little man in a hat.",2,"c"],
["ㅐ","ae","“eh,” as in bed.",2,"v"],
["ㅔ","e","Also “eh.” Today it sounds the same as ㅐ.",2,"v"],
["ㅑ","ya","A second short stroke adds a y: ㅏ a becomes ㅑ ya.",2,"v"],
["ㅕ","yeo","“yuh.”",2,"v"],
["ㅛ","yo","“yo.”",2,"v"],
["ㅠ","yu","“you.”",2,"v"],
["ㄲ","kk","Doubled letters are tense: said hard and tight, with no breath. Like the k in sky.",2,"c"],
["ㄸ","tt","Tense t, like the t in stop.",2,"c"],
["ㅃ","pp","Tense p, like the p in spy.",2,"c"],
["ㅆ","ss","A sharp, hissed s.",2,"c"],
["ㅉ","jj","Tense j, like the “ts” in pizza moving toward j.",2,"c"],
["ㅘ","wa","ㅗ + ㅏ said fast: “wa.”",3,"v"],
["ㅝ","wo","ㅜ + ㅓ said fast: “wuh.”",3,"v"],
["ㅟ","wi","ㅜ + ㅣ: “wee.”",3,"v"],
["ㅚ","oe","Looks like o + i but sounds like “weh.”",3,"v"],
["ㅙ","wae","“weh.” In practice ㅚ, ㅙ and ㅞ all sound alike.",3,"v"],
["ㅞ","we","“weh.”",3,"v"],
["ㅢ","ui","ㅡ gliding into ㅣ: “eu-ee,” said quickly.",3,"v"],
["ㅒ","yae","“yeh.” Rare.",3,"v"],
["ㅖ","ye","“yeh.”",3,"v"]
];
// [hangul, meaning, romanization, set]
const WORDS=[
["바나나","banana","banana",1],["버스","bus","beoseu",1],["주스","juice","juseu",1],["소주","soju","soju",1],["라디오","radio","radio",1],["드라마","drama","deurama",1],["아시아","Asia","asia",1],["고기","meat","gogi",1],["우유","milk","uyu",1],["모자","hat","moja",1],["나라","country","nara",1],["비누","soap","binu",1],
["커피","coffee","keopi",2],["카페","café","kape",2],["메뉴","menu","menyu",2],["피자","pizza","pija",2],["치즈","cheese","chijeu",2],["토마토","tomato","tomato",2],["파스타","pasta","paseuta",2],["카드","card","kadeu",2],["아파트","apartment","apateu",2],["뉴스","news","nyuseu",2],["아메리카노","americano","amerikano",2],["요가","yoga","yoga",2],["티셔츠","T-shirt","tisyeocheu",2],["코코아","cocoa","kokoa",2],
["택시","taxi","taeksi",3],["호텔","hotel","hotel",3],["김치","kimchi","gimchi",3],["라면","instant noodles","ramyeon",3],["서울","Seoul","seoul",3],["부산","Busan","busan",3],["비빔밥","bibimbap","bibimbap",3],["아이스크림","ice cream","aiseukeurim",3],["콜라","cola","kolla",3],["치킨","fried chicken","chikin",3],["와이파이","Wi-Fi","waipai",3],["햄버거","hamburger","haembeogeo",3],["샌드위치","sandwich","saendeuwichi",3],["엘리베이터","elevator","ellibeiteo",3],["스타벅스","Starbucks","seutabeokseu",3],["맥주","beer","maekju",3],["화장실","restroom","hwajangsil",3],["출구","exit","chulgu",3],["지하철","subway","jihacheol",3],["편의점","convenience store","pyeonuijeom",3],["테이크아웃","takeout","teikeuaut",3],["감사합니다","thank you","gamsahamnida",3]
];
