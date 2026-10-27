import json,csv,io,urllib.request,concurrent.futures
from pathlib import Path
root=Path('.');entries=json.loads((root/'dist/battle-roster.json').read_text())['records']
rows=list(csv.DictReader(io.StringIO(urllib.request.urlopen('https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon.csv').read().decode())))
ids={r['identifier']:r['id'] for r in rows}
art=root/'dist/assets/battle';art.mkdir(exist_ok=True)
manifest={}
entries += [dict(id='tatsugiri-droopy',set={'species':'Tatsugiri-Droopy'},form='Tatsugiri-Droopy'),dict(id='tatsugiri-stretchy',set={'species':'Tatsugiri-Stretchy'},form='Tatsugiri-Stretchy')]
entries += [dict(id='charizard',set={'species':'Charizard-Mega-X'},form='Charizard-Mega-X')]
todo={}
for p in entries:
 for species in {p['set']['species'],p['form']}:
  api=species.lower().replace(' ','-');api={'tatsugiri':'tatsugiri-curly','morpeko':'morpeko-full-belly','tornadus':'tornadus-incarnate','ogerpon':'ogerpon'}.get(api,api)
  if api not in ids:
   matches=[r for r in rows if r['identifier'].startswith(species.lower()+'-') and r['is_default']=='1']
   if not matches:raise Exception(api)
   api=matches[0]['identifier']
  key=''.join(c for c in species.lower() if c.isalnum());todo[key]=(ids[api],p['id']=='shiny-rayquaza')
def fetch(pair):
 key,(num,shiny)=pair;result={}
 for back in [False,True]:
  suffix='-back' if back else '';kind=('back/' if back else '')+('shiny/' if shiny else '')
  name=key+suffix+'.gif';url=f'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/{kind}{num}.gif'
  try:
   path=art/name
   data=path.read_bytes() if path.exists() else urllib.request.urlopen(url,timeout=12).read()
   if not data.startswith(b'GIF'):raise Exception('not gif')
   path.write_bytes(data);w=int.from_bytes(data[6:8],'little');h=int.from_bytes(data[8:10],'little')
   result['back' if back else 'front']={'url':'../assets/battle/'+name,'w':w,'h':h,'source':url}
  except Exception:
   if back:result['back']=result['front'];continue
   name=key+'.png';url=f'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/{"shiny/" if shiny else ""}{num}.png'
   path=art/name;data=path.read_bytes() if path.exists() else urllib.request.urlopen(url,timeout=12).read();path.write_bytes(data)
   result['front']={'url':'../assets/battle/'+name,'w':96,'h':96,'source':url}
 return key,result
manifest=dict(concurrent.futures.ThreadPoolExecutor(max_workers=12).map(fetch,todo.items()))
(root/'dist/battle-art.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Prepared battle artwork for',len(manifest),'species/forms')
