"use strict";
/* ---------- customs ---------- */
function renderCustoms(){
  const T={
  tw:["No eating, drinking or chewing gum on the MRT or anywhere past the fare gates. The fines are real.","No tipping. Sit-down restaurants may add a 10% service charge.","Carry cash for night markets and small shops. An EasyCard covers transit and convenience stores.","Public trash cans are scarce. Carry a small bag for your rubbish.","Hand over money, cards and gifts with both hands when you want to be polite.","On escalators, people stand on the right.","Most people don’t drink tap water straight. Refill at the dispensers in stations and hotels."],
  kr:["No tipping.","Give and receive things with two hands, or with your right hand while the left touches your forearm, especially with older people.","Pour drinks for others rather than yourself, and let the oldest person start eating first.","Side dishes and water are free. Refill them yourself or ask. Call staff with the table button or “jeogiyo.”","Barbecue usually has a two-portion minimum, and staff often do the grilling and cutting for you.","Leave the seats at the ends of subway cars empty: they’re for elderly, pregnant and disabled riders.","Shoes come off in homes, guesthouses and restaurants with floor seating.","Cards work nearly everywhere, but topping up a T-money card usually needs cash. Naver Map and KakaoMap give the most reliable directions."],
  jp:["No tipping. It causes confusion, and staff may chase you to return the money.","Trains are quiet: phone on silent, no calls, low voices.","Don’t eat while walking. Eat beside the stall or shop where you bought the food.","Put your money in the small tray at the register rather than into the cashier’s hand.","Public trash cans are rare. Carry your rubbish until you find one at a convenience store or station.","A raised step or tatami at an entrance means shoes off.","In Tokyo, stand on the left of escalators.","Many ramen and noodle shops take orders through a ticket machine by the door. Some are cash only."]};
  $("#v-customs").innerHTML=`<h2>Customs worth knowing</h2><p class="lede">Small things that locals notice. None of them are hard, and getting them right earns a lot of goodwill.</p>
  <div class="cols">${["tw","kr","jp"].map(c=>`<div class="col" data-c="${c}"><h3>${C[c].name}</h3><ul>${T[c].map(x=>`<li>${h(x)}</li>`).join("")}</ul></div>`).join("")}</div>
  <div class="panel"><h3>True in all three</h3><ul style="padding-left:18px;margin:10px 0 0;max-width:64ch">
    <li>Never stand chopsticks upright in a bowl of rice. It resembles incense at a funeral.</li>
    <li>Convenience stores are your base camp: ATMs, hot food, transit-card top-ups, clean restrooms nearby.</li>
    <li>A phrase attempted badly beats perfect English. Start with hello, end with thank you.</li>
    <li>When speech fails, show the written phrase from the phrasebook on your screen.</li></ul></div>`;
}
