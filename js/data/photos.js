"use strict";
/* Dish photos from Wikimedia Commons, keyed by card id. Each file is a local JPEG.
   PHOTOS_MISSING lists dish cards with no suitable freely licensed photo. */
const PHOTOS={
  "tw-dish-beef-noodle-soup":{file:"images/dishes/tw-dish-beef-noodle-soup.jpg",title:"Taiwanese Beef Noodle Soup",author:"Jjj84206",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:Taiwanese_Beef_Noodle_Soup.jpg"},
  "tw-dish-soup-dumplings":{file:"images/dishes/tw-dish-soup-dumplings.jpg",title:"Xiaolongbao in Jiufen Street",author:"YangApinat",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:Xiaolongbao_in_Jiufen_Street.jpg"},
  "tw-dish-braised-pork-rice":{file:"images/dishes/tw-dish-braised-pork-rice.jpg",title:"Lurou fan(Taiwanese cuisine)",author:"Jzest",license:"CC BY-SA 2.5",source:"https://commons.wikimedia.org/wiki/File:Lurou_fan(Taiwanese_cuisine).jpg"},
  "tw-dish-bubble-tea":{file:"images/dishes/tw-dish-bubble-tea.jpg",title:"Pearl Milk Tea in Chun Shui Tang",author:"Battlesnake1",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Pearl_Milk_Tea_in_Chun_Shui_Tang.jpg"},
  "tw-dish-oyster-omelet":{file:"images/dishes/tw-dish-oyster-omelet.jpg",title:"Oyster omelette in Shilin Night Market",author:"Morgan Calliope",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Oyster_omelette_in_Shilin_Night_Market.jpg"},
  "tw-dish-stinky-tofu":{file:"images/dishes/tw-dish-stinky-tofu.jpg",title:"Stinky tofu in Hualien",author:"陳虹樺",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:Stinky_tofu_in_Hualien.jpg"},
  "tw-dish-pork-belly-bun":{file:"images/dishes/tw-dish-pork-belly-bun.jpg",title:"Gua-bao by the Yuan Fang Guabao at Huaxi Street 2023-04-28 01",author:"Wang Yu Ching / Office of the President, ROC (Taiwan) (中華民國總統府)",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Gua-bao_by_the_Yuan_Fang_Guabao_at_Huaxi_Street_2023-04-28_01.jpg"},
  "tw-dish-scallion-pancake":{file:"images/dishes/tw-dish-scallion-pancake.jpg",title:"Green onion pancake",author:"Photo taken by Allen Timothy Chang",license:"CC BY-SA 3.0",source:"https://commons.wikimedia.org/wiki/File:Green_onion_pancake.jpg"},
  "tw-dish-fried-chicken-cutlet":{file:"images/dishes/tw-dish-fried-chicken-cutlet.jpg",title:"2009-03-21 Jipai by Hot-Star Large Fried Chicken",author:"Banzai Hiroaki",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:2009-03-21_Jipai_by_Hot-Star_Large_Fried_Chicken.jpg"},
  "tw-dish-egg-crepe":{file:"images/dishes/tw-dish-egg-crepe.jpg",title:"Dan Bing (Taiwanese egg crepe)",author:"Joy",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Dan_Bing_(Taiwanese_egg_crepe).jpg"},
  "tw-dish-soy-milk":{file:"images/dishes/tw-dish-soy-milk.jpg",title:"Doujiang and youtiao Taipei",author:"KQuhen",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:Doujiang_and_youtiao_Taipei.jpg"},
  "tw-dish-pepper-bun":{file:"images/dishes/tw-dish-pepper-bun.jpg",title:"Hujiao bing Taipei",author:"KQuhen",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:Hujiao_bing_Taipei.jpg"},
  "tw-dish-hot-pot":{file:"images/dishes/tw-dish-hot-pot.jpg",title:"Hot pot with meat",author:"Hrixson",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Hot_pot_with_meat.jpg"},
  "tw-dish-three-cup-chicken":{file:"images/dishes/tw-dish-three-cup-chicken.jpg",title:"Sanbeiji",author:"Archon6812",license:"CC BY-SA 3.0",source:"https://commons.wikimedia.org/wiki/File:Sanbeiji.jpg"},
  "tw-dish-tofu-pudding":{file:"images/dishes/tw-dish-tofu-pudding.jpg",title:"Peanut Douhua",author:"Battlesnake1",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Peanut_Douhua.jpg"},
  "tw-dish-mango-shaved-ice":{file:"images/dishes/tw-dish-mango-shaved-ice.jpg",title:"Mango shaved ice Taipei",author:"KQuhen",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:Mango_shaved_ice_Taipei.jpg"},
  "tw-dish-pineapple-cake":{file:"images/dishes/tw-dish-pineapple-cake.jpg",title:"Taiwanese Pineapple Cake 001",author:"Ocdp",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Taiwanese_Pineapple_Cake_001.jpg"},
  "kr-dish-mixed-rice-bowl":{file:"images/dishes/kr-dish-mixed-rice-bowl.jpg",title:"Bibimbap and kimchi",author:"Stinglehammer",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:Bibimbap_and_kimchi.jpg"},
  "kr-dish-kimchi-stew":{file:"images/dishes/kr-dish-kimchi-stew.jpg",title:"Kimchi jjigae - San Francisco, CA",author:"Daderot",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Kimchi_jjigae_-_San_Francisco,_CA.jpg"},
  "kr-dish-grilled-pork-belly":{file:"images/dishes/kr-dish-grilled-pork-belly.jpg",title:"Samgyeopsal-gui",author:"jinsoo jang",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Samgyeopsal-gui.jpg"},
  "kr-dish-marinated-grilled-beef":{file:"images/dishes/kr-dish-marinated-grilled-beef.jpg",title:"Bulgogi (Marinated beef. Served with rice) - Kogi 2023-09-11",author:"Andy Li",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Bulgogi_(Marinated_beef._Served_with_rice)_-_Kogi_2023-09-11.jpg"},
  "kr-dish-grilled-short-ribs":{file:"images/dishes/kr-dish-grilled-short-ribs.jpg",title:"Galbi-gui 1",author:"김태경",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Galbi-gui_1.jpg"},
  "kr-dish-spicy-rice-cakes":{file:"images/dishes/kr-dish-spicy-rice-cakes.jpg",title:"Korean.snacks-Tteokbokki-08",author:"by jetalone (flickr)",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Korean.snacks-Tteokbokki-08.jpg"},
  "kr-dish-seaweed-rice-roll":{file:"images/dishes/kr-dish-seaweed-rice-roll.jpg",title:"Gimbap 02",author:"최광모",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Gimbap_02.jpg"},
  "kr-dish-fried-chicken-and-beer":{file:"images/dishes/kr-dish-fried-chicken-and-beer.jpg",title:"Iksan City 48 Korean Style Fried chicken",author:"KOREA.NET",license:"CC BY-SA 2.0",source:"https://commons.wikimedia.org/wiki/File:Iksan_City_48_Korean_Style_Fried_chicken.jpg"},
  "kr-dish-cold-buckwheat-noodles":{file:"images/dishes/kr-dish-cold-buckwheat-noodles.jpg",title:"Mul-naengmyeon 3",author:"chomjong",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Mul-naengmyeon_3.jpg"},
  "kr-dish-ginseng-chicken-soup":{file:"images/dishes/kr-dish-ginseng-chicken-soup.jpg",title:"Samgye-tang 2",author:"wizdata",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Samgye-tang_2.jpg"},
  "kr-dish-soft-tofu-stew":{file:"images/dishes/kr-dish-soft-tofu-stew.jpg",title:"Sundubu-jjigae 1",author:"travel oriented",license:"CC BY-SA 2.0",source:"https://commons.wikimedia.org/wiki/File:Sundubu-jjigae_1.jpg"},
  "kr-dish-scallion-pancake":{file:"images/dishes/kr-dish-scallion-pancake.jpg",title:"Pajeon",author:"Brücke-Osteuropa",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Pajeon.jpg"},
  "kr-dish-glass-noodles":{file:"images/dishes/kr-dish-glass-noodles.jpg",title:"Japchae 2",author:"Jordi Sanchez",license:"CC BY-SA 2.0",source:"https://commons.wikimedia.org/wiki/File:Japchae_2.jpg"},
  "kr-dish-black-bean-noodles":{file:"images/dishes/kr-dish-black-bean-noodles.jpg",title:"Jajangmyeon (mixed)",author:"최광모",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Jajangmyeon_(mixed).jpg"},
  "kr-dish-knife-cut-noodle-soup":{file:"images/dishes/kr-dish-knife-cut-noodle-soup.jpg",title:"Korean.noodle-Kalguksu-01",author:"by jslander",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Korean.noodle-Kalguksu-01.jpg"},
  "kr-dish-sweet-filled-pancake":{file:"images/dishes/kr-dish-sweet-filled-pancake.jpg",title:"Hotteok",author:"Korea.net / Korean Culture and Information Service",license:"CC BY-SA 2.0",source:"https://commons.wikimedia.org/wiki/File:Hotteok.jpg"},
  "kr-dish-side-dishes":{file:"images/dishes/kr-dish-side-dishes.jpg",title:"Banchans",author:"stuart spivack (a flickr user)",license:"CC BY-SA 2.0",source:"https://commons.wikimedia.org/wiki/File:Banchans.jpg"},
  "kr-dish-rice-wine":{file:"images/dishes/kr-dish-rice-wine.jpg",title:"Makgeolli 4",author:"jinho kim",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Makgeolli_4.jpg"},
  "kr-dish-shaved-ice-dessert":{file:"images/dishes/kr-dish-shaved-ice-dessert.jpg",title:"Korean shaved ice-Patbingsu-07",author:"Eunice",license:"CC BY-SA 2.0",source:"https://commons.wikimedia.org/wiki/File:Korean_shaved_ice-Patbingsu-07.jpg"},
  "jp-dish-ramen":{file:"images/dishes/jp-dish-ramen.jpg",title:"Ramen Bowl",author:"Shisma",license:"CC BY 4.0",source:"https://commons.wikimedia.org/wiki/File:Ramen_Bowl.jpg"},
  "jp-dish-dipping-noodles":{file:"images/dishes/jp-dish-dipping-noodles.jpg",title:"Tsukemen bowls",author:"Douglas Perkins",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Tsukemen_bowls.jpg"},
  "jp-dish-sushi":{file:"images/dishes/jp-dish-sushi.jpg",title:"Nigiri Sushi (25966163204)",author:"Tim Reckmann from Hamm, Deutschland",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Nigiri_Sushi_(25966163204).jpg"},
  "jp-dish-tempura":{file:"images/dishes/jp-dish-tempura.jpg",title:"Tempura 003",author:"Ocdp",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Tempura_003.jpg"},
  "jp-dish-breaded-pork-cutlet":{file:"images/dishes/jp-dish-breaded-pork-cutlet.jpg",title:"Tonkatsu 003",author:"Ocdp",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Tonkatsu_003.jpg"},
  "jp-dish-buckwheat-noodles":{file:"images/dishes/jp-dish-buckwheat-noodles.jpg",title:"Zaru soba by spinachdip",author:"spinachdip from Minamikiso, Nagano",license:"CC BY-SA 2.0",source:"https://commons.wikimedia.org/wiki/File:Zaru_soba_by_spinachdip.jpg"},
  "jp-dish-thick-wheat-noodles":{file:"images/dishes/jp-dish-thick-wheat-noodles.jpg",title:"Udon by udono",author:"udono",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Udon_by_udono.jpg"},
  "jp-dish-grilled-chicken-skewers":{file:"images/dishes/jp-dish-grilled-chicken-skewers.jpg",title:"Yakitori set and others at Torihei-chan, Kamata East Exit (20230806200725)",author:"N509FZ",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:Yakitori_set_and_others_at_Torihei-chan,_Kamata_East_Exit_(20230806200725).jpg"},
  "jp-dish-beef-rice-bowl":{file:"images/dishes/jp-dish-beef-rice-bowl.jpg",title:"Gyuu-don 001",author:"Ocdp",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Gyuu-don_001.jpg"},
  "jp-dish-rice-ball":{file:"images/dishes/jp-dish-rice-ball.jpg",title:"Onigiri 002",author:"Ocdp",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Onigiri_002.jpg"},
  "jp-dish-set-meal":{file:"images/dishes/jp-dish-set-meal.jpg",title:"Kyukyoku Gyoza Teishoku",author:"妖精書士",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Kyukyoku_Gyoza_Teishoku.jpg"},
  "jp-dish-japanese-curry-rice":{file:"images/dishes/jp-dish-japanese-curry-rice.jpg",title:"Beef curry rice 003",author:"Ocdp",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Beef_curry_rice_003.jpg"},
  "jp-dish-savory-pancake":{file:"images/dishes/jp-dish-savory-pancake.jpg",title:"Okonomiyaki 001",author:"ume-y",license:"CC BY 2.0",source:"https://commons.wikimedia.org/wiki/File:Okonomiyaki_001.jpg"},
  "jp-dish-octopus-balls":{file:"images/dishes/jp-dish-octopus-balls.jpg",title:"Takoyaki dish",author:"sayo ts",license:"CC0",source:"https://commons.wikimedia.org/wiki/File:Takoyaki_dish.jpg"},
  "jp-dish-pan-fried-dumplings":{file:"images/dishes/jp-dish-pan-fried-dumplings.jpg",title:"10pc Gyoza plate",author:"Wesoree",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:10pc_Gyoza_plate.jpg"},
  "jp-dish-powdered-green-tea":{file:"images/dishes/jp-dish-powdered-green-tea.jpg",title:"Matcha Scoop",author:"Evanhoever",license:"CC BY-SA 4.0",source:"https://commons.wikimedia.org/wiki/File:Matcha_Scoop.jpg"}
};
const PHOTOS_MISSING=["jp-dish-japanese-pub"];
function licenseURL(l){
  if(/^CC0/.test(l))return "https://creativecommons.org/publicdomain/zero/1.0/";
  const m=/^CC (BY(?:-SA)?) (\d\.\d)$/.exec(l);
  return m?"https://creativecommons.org/licenses/"+m[1].toLowerCase()+"/"+m[2]+"/":"";
}
