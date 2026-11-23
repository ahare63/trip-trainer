"use strict";
/* Country names as a local says them, for next-stop cards (js/nextstop.js): PLACE_NAMES[language][country].
   Only pairs where the language and the country differ. Taiwan says 韓國 for Korea; 南韓 is the news word. */
const PLACE_NAMES={
  tw:{kr:{nat:"韓國",rom:"Hánguó",say:"hahn-gwaw"},jp:{nat:"日本",rom:"Rìběn",say:"rr-bun"}},
  kr:{tw:{nat:"대만",rom:"Daeman",say:"deh-mahn"},jp:{nat:"일본",rom:"Ilbon",say:"eel-bohn"}},
  jp:{tw:{nat:"台湾",rom:"Taiwan",say:"tie-wahn"},kr:{nat:"韓国",rom:"Kankoku",say:"kahn-koh-koo"}}};
