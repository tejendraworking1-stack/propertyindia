set -e
P=/mnt/user-data/outputs/part2/propertyindia
export NODE_PATH=/home/claude/.npm-global/lib/node_modules
ES=/home/claude/.npm-global/lib/node_modules/tsx/node_modules/esbuild/bin/esbuild
COMMON="--bundle --jsx=automatic --tsconfig=$P/tsconfig.json --alias:next/image=/home/claude/b2/h/shims/next-image.tsx --log-level=warning --define:process.env.NODE_ENV=\"development\""
cd /home/claude/b2/h
$ES entry-server.tsx $COMMON --define:process.env.NEXT_PUBLIC_AI_ENDPOINT=\"\" --platform=node --format=cjs --outfile=out/server.cjs
$ES entry-client.tsx $COMMON --define:process.env.NEXT_PUBLIC_AI_ENDPOINT=\"\" --platform=browser --format=iife --outfile=out/client.js
$ES entry-client.tsx $COMMON --define:process.env.NEXT_PUBLIC_AI_ENDPOINT=\"/ai\" --platform=browser --format=iife --outfile=out/client-ai.js
node out/server.cjs out/ssr.html
python3 - <<'PY'
P='/mnt/user-data/outputs/part2/propertyindia/'
g=open(P+'app/globals.css').read()
css=open(P+'app/fonts.css').read()+'\n'+g[g.index('/* ===='):]+'\n'+open(P+'app/home.css').read()+'\n'+open(P+'app/part1-overrides.css').read()
open('/home/claude/b2/h/out/harness.css','w').write(css)
PY
wc -c out/ssr.html out/client.js out/harness.css
