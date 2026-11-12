"use strict";
/* Course structure shared by every view. Loaded first. */
const C={tw:{name:"Taiwan",code:"TW",lang:"zh-TW",hl:"zh-Hant",tongue:"Mandarin"},
         kr:{name:"Korea",code:"KR",lang:"ko-KR",hl:"ko",tongue:"Korean"},
         jp:{name:"Japan",code:"JP",lang:"ja-JP",hl:"ja",tongue:"Japanese"}};
const CATS={basics:"Basics",order:"Ordering",num:"Numbers",dish:"Dishes",menu:"Menu words",around:"Getting around",sign:"Signs",help:"If something goes wrong",trip:"Your trip"};
const RECOG={dish:1,menu:1,sign:1};
// trip cards (cat "trip") carry a kind instead; a trip dish is shown like a course dish
const isDish=k=>k.cat==="dish"||k.kind==="dish";
const isRecog=k=>!!RECOG[k.cat]||k.kind==="dish";
// which week each category unlocks in, per country: one language at a time
const WEEK_OF={tw:{basics:1,order:2,num:2,menu:3,dish:3,around:4,sign:4,help:8},
               kr:{basics:4,order:5,num:5,menu:5,dish:6,around:6,sign:6,help:8},
               jp:{basics:7,order:7,dish:7,around:8,sign:8,help:8}};
const RAW={}; // filled by tw.js, kr.js, jp.js
const WEEKS=[
 {t:"Mandarin: first words",d:"Hello, thank you, sorry, and the questions every traveler asks. On the side, your first fifteen Korean letters. They’re a reading skill, so they won’t compete with the Mandarin.",
  tasks:[["study","Cards: 19 Mandarin basics"],["scripts","Mandarin tones: hear the four shapes"],["scripts","Hangul set 1: six vowels, nine consonants"]]},
 {t:"Mandarin: ordering",d:"Pointing, counting, takeaway or eat-in, and how to get bubble tea the way you like it.",
  tasks:[["study","Cards: ordering phrases and numbers"],["scripts","Hangul set 2: the remaining letters"],["scripts","Build a few syllable blocks by hand"]]},
 {t:"Mandarin: the menu",d:"Ten characters that unlock most menus, then seventeen dishes worth seeking out. You also finish Hangul this week.",
  tasks:[["study","Cards: menu characters and dishes"],["scripts","Hangul set 3, then the decoding drill"],["phrasebook","Browse the Taiwan dishes"]]},
 {t:"Korean: first words",d:"You can already read it; now you learn to say it. Mandarin drops back to review, plus Taiwan’s signs and transit words.",
  tasks:[["study","Cards: 18 Korean basics"],["study","Cards: Taiwan signs and getting around"],["scripts","Decoding drill: keep your Hangul quick"]]},
 {t:"Korean: ordering",d:"“Juseyo” does most of the work. There are two number systems, but you only need a little of each.",
  tasks:[["study","Cards: ordering, numbers, menu words"],["scripts","Decoding drill, up to set 3"],["essentials","Essentials: quiz Mandarin and Korean side by side"]]},
 {t:"Korean: food and signs",d:"Barbecue, stews and street food, then the words on subway signs and doors.",
  tasks:[["study","Cards: 19 dishes, signs, transit words"],["phrasebook","Browse the Korea dishes"],["customs","Read the customs page"]]},
 {t:"Japanese crash course",d:"Everything for a day or two in Tokyo in one week: the basics, restaurant ritual and what to eat. The pronunciation is the easiest of the three.",
  tasks:[["scripts","Japanese sounds: five vowels and a rhythm"],["study","Cards: basics, restaurant phrases, dishes"],["phrasebook","Browse the Japan dishes"]]},
 {t:"Dress rehearsal",d:"Tokyo’s signs, a few phrases for when things go wrong, and mixed review of all three, because on the trip you’ll be switching between them.",
  tasks:[["study","Cards: Japan signs, help phrases in all three"],["essentials","Essentials: quiz all three together"],["customs","Reread the customs page"]]}
];
// the phrases to have ready at any moment: [label, English text of the cards per country]
const ESS=[
 ["Hello",{tw:["Hello"],kr:["Hello"],jp:["Hello"]}],
 ["Goodbye",{tw:["Goodbye"],kr:["Goodbye (you are leaving)","Goodbye (they are leaving)"],jp:["Goodbye"]}],
 ["Yes",{tw:["Yes, that’s right"],kr:["Yes"],jp:["Yes"]}],
 ["No",{tw:["No, it isn’t"],kr:["No"],jp:["No"]}],
 ["Sorry",{tw:["Sorry (a real apology)"],kr:["I’m sorry"],jp:["I’m sorry (a real apology)"]}],
 ["Excuse me",{tw:["Excuse me / sorry to bother you"],kr:["Excuse me (to get someone’s attention)","Excuse me, coming through"],jp:["Excuse me / sorry"]}],
 ["Please",{tw:["Please"],kr:["This one, please"],jp:["Please (when asking for something)"]}],
 ["Thank you",{tw:["Thank you"],kr:["Thank you"],jp:["Thank you"]}]
];
