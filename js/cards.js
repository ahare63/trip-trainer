"use strict";
/* Builds CARDS from the per-language rows. Loaded after all js/data files.
   ids are the keys of saved progress: never change how they are derived. */
const CARDS=[];
(function(){
  const seen={};
  for(const c of ["tw","kr","jp"]){
    const ord={};
    RAW[c].forEach(r=>{
      const wk=WEEK_OF[c][r[0]];
      let id=c+"-"+r[0]+"-"+r[1].toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
      while(seen[id]) id+="x"; seen[id]=1;
      ord[wk]=(ord[wk]||0)+1;
      CARDS.push({id,c,wk,cat:r[0],en:r[1],nat:r[2],rom:r[3],say:r[4],note:r[5]||"",ord:ord[wk]});
    });
  }
})();
