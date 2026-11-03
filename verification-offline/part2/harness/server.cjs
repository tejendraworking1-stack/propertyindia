const http=require('http'),fs=require('fs'),path=require('path');
const P='/mnt/user-data/outputs/part2/propertyindia/public', O='/home/claude/b2/h/out';
const types={'.jpg':'image/jpeg','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.css':'text/css','.js':'text/javascript'};
const page=(js)=>'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>harness</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/harness.css"></head><body><div id="root">'+fs.readFileSync(O+'/ssr.html','utf8')+'</div><script src="/'+js+'"></script></body></html>';
http.createServer((q,s)=>{
  const u=q.url.split('?')[0];
  if(u==='/'){s.setHeader('content-type','text/html; charset=utf-8');return s.end(page('client.js'))}
  if(u==='/with-ai'){s.setHeader('content-type','text/html; charset=utf-8');return s.end(page('client-ai.js'))}
  if(u==='/ai'&&q.method==='POST'){let b='';q.on('data',c=>b+=c);q.on('end',()=>{let j={};try{j=JSON.parse(b)}catch(e){}
    const m=String(j.message||'');s.setHeader('content-type','application/json');
    if(m.includes('slow'))return; // never answers
    if(m.includes('err')){s.statusCode=500;return s.end('{}')}
    if(m.includes('bad'))return s.end('{}');
    s.end(JSON.stringify({reply:'Echo: '+m+' | history='+((j.history||[]).length)+' | source='+j.source}))});return}
  const f=u==='/harness.css'?O+'/harness.css':u==='/client.js'?O+'/client.js':u==='/client-ai.js'?O+'/client-ai.js':path.join(P,u);
  if(!f.startsWith(P)&&!f.startsWith(O)){s.statusCode=403;return s.end()}
  fs.readFile(f,(e,d)=>{if(e){s.statusCode=404;return s.end('nf')}s.setHeader('content-type',types[path.extname(f)]||'application/octet-stream');s.end(d)});
}).listen(process.env.PORT||3400);
