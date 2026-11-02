const http=require('http'),fs=require('fs'),path=require('path');
const P='/mnt/user-data/outputs/part1/propertyindia/public', O='/home/claude/p1/h/out';
const types={'.jpg':'image/jpeg','.ttf':'font/ttf','.svg':'image/svg+xml','.png':'image/png','.css':'text/css','.js':'text/javascript'};
http.createServer((q,s)=>{
  const u=q.url.split('?')[0];
  if(u==='/'){s.setHeader('content-type','text/html; charset=utf-8');return s.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>harness</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/harness.css"></head><body><div id="root">'+fs.readFileSync(O+'/ssr.html','utf8')+'</div><script src="/client.js"></script></body></html>')}
  const f=u==='/harness.css'?O+'/harness.css':u==='/client.js'?O+'/client.js':path.join(P,u);
  if(!f.startsWith(P)&&!f.startsWith(O)){s.statusCode=403;return s.end()}
  fs.readFile(f,(e,d)=>{if(e){s.statusCode=404;return s.end('nf')}s.setHeader('content-type',types[path.extname(f)]||'application/octet-stream');s.end(d)});
}).listen(process.env.PORT||3300);
