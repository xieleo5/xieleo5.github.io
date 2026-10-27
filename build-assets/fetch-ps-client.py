import urllib.request,re,concurrent.futures
from pathlib import Path
base='https://raw.githubusercontent.com/smogon/pokemon-showdown-client/master/play.pokemonshowdown.com/'
root=Path('build-assets/ps-client');seen=set();todo={'battle','battle-animations'}
def fetch(name):
 p=root/(name+'.ts');data=urllib.request.urlopen(base+'src/'+name+'.ts',timeout=20).read().decode();p.write_text(data);return name,data
while todo:
 result=list(concurrent.futures.ThreadPoolExecutor(max_workers=8).map(fetch,todo));seen.update(todo);todo=set()
 for name,s in result:
  for line in s.splitlines():
   if line.startswith('import ') and not line.startswith('import type '):
    m=re.search(r"from ['\"]\./([^'\"]+)",line)
    if m and m[1].startswith('battle-') and m[1] not in seen:todo.add(m[1])
 print('Downloaded',len(seen),'next',todo)
for file in ['style/battle.css','style/battle-log.css']:
 data=urllib.request.urlopen(base+file,timeout=20).read();(root/Path(file).name).write_bytes(data);print(file,len(data))
for name in ['default','moves','abilities','items']:
 url='https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/text/'+name+'.ts'
 (root/('text-'+name+'.ts')).write_bytes(urllib.request.urlopen(url,timeout=20).read())
