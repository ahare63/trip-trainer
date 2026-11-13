"use strict";
/* Model access. askJSON(prompt, tier) is the one way the app asks Claude for JSON, in both places it runs:
   - Claude-hosted copy: the page's "sample" capability (the viewer is asked for consent on the first call).
   - GitHub Pages: the visitor's own Anthropic API key, kept in this browser and sent only to api.anthropic.com.
   tier is "default" or "complex". image, if given, is one PNG or JPEG Blob sent with the prompt; it is read for this
   request only and never kept. It rejects with {code} and never resolves with anything but parsed JSON. */
const AI={mode:null,sample:null};
const AI_KEYNAME="trip-phrasebook-key";
const MODELS={default:"claude-sonnet-5-5",complex:"claude-opus-5-5"};
const getKey=()=>{try{return localStorage.getItem(AI_KEYNAME)||""}catch(e){return ""}};
function setKey(v){try{if(v)localStorage.setItem(AI_KEYNAME,v);else localStorage.removeItem(AI_KEYNAME)}catch(e){}}
async function aiInit(){
  if(window.claude&&window.claude.use){
    let f=null;try{f=await window.claude.use("sample")}catch(e){}
    AI.sample=f;AI.mode=f?"claude":"none";
  }else AI.mode="key";
}
const aiReady=aiInit();
/* the Claude-hosted copy can send images only when it is published with sample: {images: true} */
async function aiImagesOK(){
  if(!AI.sample||typeof AI.sample.limits!=="function")return false;
  try{const l=await AI.sample.limits();return !!(l&&l.images)}catch(e){return false}}
async function aiBase64(blob){
  const b=new Uint8Array(await blob.arrayBuffer());let s="";
  for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));
  return btoa(s)}
async function askJSON(prompt,tier,image){
  await aiReady;
  if(AI.mode==="claude"){
    const opts={modelTier:tier==="complex"?"complex":"default",cache:false};
    if(image){if(!(await aiImagesOK()))throw {code:"no_images"};opts.images=[image]}
    return AI.sample.json(prompt,opts)}
  if(AI.mode!=="key")throw {code:"unavailable"};
  const key=getKey(); if(!key)throw {code:"no_key"};
  let content=prompt;
  if(image){
    let data;try{data=await aiBase64(image)}catch(e){throw {code:"failed"}}
    content=[{type:"image",source:{type:"base64",media_type:image.type,data}},{type:"text",text:prompt}]}
  let r;
  try{r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",
    headers:{"content-type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body:JSON.stringify({model:MODELS[tier]||MODELS.default,max_tokens:16000,messages:[{role:"user",content}]})})}
  catch(e){throw {code:"network"}}
  if(!r.ok)throw {code:r.status===401||r.status===403?"bad_key":r.status===429?"rate_limited":"upstream_error"};
  let data;
  try{data=await r.json()}catch(e){throw {code:"invalid_json"}}
  if(data.stop_reason==="refusal")throw {code:"declined"};
  const text=(Array.isArray(data.content)?data.content:[]).filter(b=>b&&b.type==="text").map(b=>b.text).join("");
  const m=text.match(/[\[{][\s\S]*[\]}]/);
  try{return JSON.parse(m[0])}catch(e){throw {code:"invalid_json"}}
}
const AI_COPY={
  not_granted:"You declined access to Claude, so nothing was added. Reload the page to be asked again.",
  rate_limited:"Claude is busy right now, so nothing was added. Wait a minute and try again.",
  no_key:"Add your Anthropic API key above first. Nothing was added.",
  bad_key:"That API key was rejected, so nothing was added. Check it and try again.",
  network:"The request couldn’t reach Claude, so nothing was added. Check your connection and try again.",
  declined:"Claude declined this request, so nothing was added.",
  invalid_json:"Claude’s reply couldn’t be read, so nothing was added. Try again.",
  unavailable:"Claude isn’t available in this view of the page, so nothing was added.",
  no_images:"This copy of the page can’t send images to Claude, so the screenshot wasn’t read. Paste the names into “Add a place by hand” instead."};
const aiMessage=code=>AI_COPY[code]||"The request didn’t complete, so nothing was added. Try again.";
