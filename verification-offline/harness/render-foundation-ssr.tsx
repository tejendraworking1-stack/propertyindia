import { renderToStaticMarkup } from "react-dom/server";
import * as fs from "fs";
import Page from "./proj/app/dev/foundation/page";
import Icon from "./proj/components/ui/Icon";
import { icons, type IconName } from "./proj/components/ui/icons";
const P="/mnt/user-data/outputs/propertyindia/";
let css=fs.readFileSync("/home/claude/p0/out.css","utf8").replace('url("/fonts/','url("file://'+P+'public/fonts/');
const wrap=(body:string)=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${body}</body></html>`;
fs.writeFileSync("/home/claude/p0/foundation.html",wrap(renderToStaticMarkup(<Page/>)));
// icon parity page: React icon (left) vs original sprite <use> (right)
const names=Object.keys(icons) as IconName[];
const sprite=fs.readFileSync("/home/claude/p0/sprite.svg","utf8");
const cells=names.map(n=>`<div class="cell"><span class="a">${renderToStaticMarkup(<Icon name={n}/>)}</span><span class="b"><svg><use href="#i-${n}"/></svg></span></div>`).join("");
fs.writeFileSync("/home/claude/p0/parity.html",wrap(`${sprite}<style>.cell{display:inline-flex;gap:0;margin:6px;font-size:40px;color:#174a8b}.cell svg{width:1.25em;height:1.25em}</style>${cells}`));
console.log("rendered", names.length);
