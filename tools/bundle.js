#!/usr/bin/env node
/* Bundles the site into one self-contained HTML file (dist/claude.html) for the Claude-hosted copy.
   Usage: node tools/bundle.js      No dependencies. */
"use strict";
const fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
let html=read("index.html"),n=0;
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(m,href)=>{n++;return "<style>\n"+read(href)+"</style>"});
html=html.replace(/<script src="([^"]+)"><\/script>/g,(m,src)=>{
  const js=read(src);
  if(/<\/script/i.test(js))throw new Error(src+" contains a closing script tag and cannot be inlined");
  n++;return "<script>\n"+js+"</script>"});
if(/<script src=|rel="stylesheet" href="(?!https:)/.test(html))throw new Error("something was left un-inlined");
fs.mkdirSync(path.join(root,"dist"),{recursive:true});
fs.writeFileSync(path.join(root,"dist/claude.html"),html);
console.log("dist/claude.html: "+n+" files inlined, "+(Buffer.byteLength(html)/1024).toFixed(0)+" kB");
