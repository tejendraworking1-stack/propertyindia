const http=require('http'),fs=require('fs');
const FONT='/mnt/user-data/outputs/propertyindia/public/fonts/PlusJakartaSans-VariableFont_wght.ttf';
http.createServer((q,s)=>{
  if(q.url.startsWith('/dev/foundation')){s.setHeader('content-type','text/html');return s.end(fs.readFileSync('/tmp/shim/site.html'))}
  if(q.url.startsWith('/fonts/PlusJakartaSans')){s.setHeader('content-type','font/ttf');return s.end(fs.readFileSync(FONT))}
  if(q.url.startsWith('/favicon')){s.statusCode=204;return s.end()}s.statusCode=404;s.end('nf')
}).listen(process.env.PORT);
