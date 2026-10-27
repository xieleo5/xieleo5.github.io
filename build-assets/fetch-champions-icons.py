from pathlib import Path
import json,urllib.request,concurrent.futures
root=Path(__file__).resolve().parent.parent
roster=json.loads((root/'pokemon-roster.json').read_text())
base='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ix/champions/icons/'
def get(p):
 url=base+('shiny/' if p['id']=='shiny-rayquaza' else '')+str(int(p['number']))+'.png'
 try:
  data=urllib.request.urlopen(url,timeout=30).read()
  assert data.startswith(b'\x89PNG\r\n\x1a\n')
  (root/'build-assets/champions-icons'/f"{p['id']}.png").write_bytes(data)
  return p['id'],url,len(data)
 except Exception as e:return p['id'],url,str(e)
results=list(concurrent.futures.ThreadPoolExecutor(max_workers=8).map(get,roster))
(root/'build-assets/champions-icons/results.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
