from pathlib import Path
import json,urllib.request,concurrent.futures
root=Path(__file__).resolve().parent.parent
results=json.loads((root/'build-assets/champions-icons/results.json').read_text())
roster={p['id']:p for p in json.loads((root/'pokemon-roster.json').read_text())}
def get(row):
 id,url,result=row
 if isinstance(result,int):return row
 p=roster[id]; base='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/scarlet-violet/icons/'
 url=base+('shiny/' if id=='shiny-rayquaza' else '')+str(int(p['number']))+'.png'
 try:
  data=urllib.request.urlopen(url,timeout=30).read();assert data.startswith(b'\x89PNG')
  (root/'build-assets/champions-icons'/f'{id}.png').write_bytes(data);return [id,url,len(data)]
 except Exception as e:return [id,url,str(e)]
results=list(concurrent.futures.ThreadPoolExecutor(max_workers=8).map(get,results))
(root/'build-assets/champions-icons/menu-sources.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
