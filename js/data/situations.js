"use strict";
/* Where a production card is used, shown above the English on study cards and in the phrasebook.
   SITUATION overrides SITUATION_BY_CAT, keyed by card id. Recognition cards get no label. */
const SITUATION_BY_CAT={
  basics:"Almost anywhere you go",
  order:"Ordering food and drinks",
  num:"Counting items and prices",
  around:"On the street and on transit",
  help:"When something goes wrong"
};
const SITUATION={
  "tw-order-half-sugar":"At a bubble tea counter",
  "tw-order-less-ice":"At a bubble tea counter",
  "tw-order-no-ice":"At a bubble tea counter",
  "tw-order-the-bill-please":"When paying",
  "tw-basics-can-i-pay-by-card":"When paying",
  "kr-order-the-bill-please":"When paying",
  "kr-basics-do-you-take-cards":"When paying",
  "jp-order-the-bill-please":"When paying",
  "jp-basics-can-i-use-a-card":"When paying",
  "kr-around-please-take-me-here":"In a taxi",
  "jp-around-to-please-taxi":"In a taxi",
  "jp-order-two-people":"At a restaurant door",
  "jp-order-do-you-have-an-english-menu":"At a restaurant door"
};
function situationOf(card){
  return Object.prototype.hasOwnProperty.call(SITUATION,card.id)?SITUATION[card.id]:(SITUATION_BY_CAT[card.cat]||"");
}
