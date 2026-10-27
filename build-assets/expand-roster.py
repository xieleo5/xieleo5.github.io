from pathlib import Path
import json,urllib.request,concurrent.futures,csv,io
root=Path(__file__).resolve().parent.parent
entries=[
('cosmog','cosmog',['小星云','小星雲','科斯莫古','Nebby']),('froakie','froakie',[]),('tornadus','tornadus-incarnate',['Tornadus','龙卷云','龍捲雲']),('amoonguss','amoonguss',[]),('hydreigon','hydreigon',[]),('flutter-mane','flutter-mane',['震翼发','振翼髮']),('oddish','oddish',[]),('xatu','xatu',[]),('vanillite','vanillite',[]),('ferrothorn','ferrothorn',[]),('litwick','litwick',[]),('gastly','gastly',[]),('elekid','elekid',[]),('jirachi','jirachi',[]),('incineroar','incineroar',[]),('chikorita','chikorita',[]),('morpeko','morpeko-full-belly',['Morpeko','莫鲁贝可','莫魯貝可']),('ogerpon-teal','ogerpon',['Ogerpon','Teal Mask Ogerpon','Ogerpon Teal Mask','厄诡椪','厄诡椪青草面具','青草面具厄诡椪','厄鬼椪']),('dragonair','dragonair',[]),('exeggutor-alola','exeggutor-alola',['Alolan Exeggutor','Exeggutor Alola','Exeggutor','阿罗拉椰蛋树','椰蛋树阿罗拉','椰蛋树','阿羅拉椰蛋樹']),('pelipper','pelipper',[]),('rotom-wash','rotom-wash',['Wash Rotom','Rotom Wash','Rotom','冲洗洛托姆','洛托姆冲洗','洛托姆','清洗洛托姆']),('groudon','groudon',[]),('kyogre','kyogre',[])]
def csvrows(name):
 url='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'+name+'.csv'
 return list(csv.DictReader(io.StringIO(urllib.request.urlopen(url).read().decode())))
pokemon={p['identifier']:p for p in csvrows('pokemon')}
languages={p['id']:p['identifier'] for p in csvrows('languages')}
species_names={}
for row in csvrows('pokemon_species_names'):species_names.setdefault(row['pokemon_species_id'],{})[languages[row['local_language_id']]]=row['name']
def prepare(e):
 id,api,aliases=e;p=pokemon[api];species={'id':int(p['species_id'])}
 names=species_names[p['species_id']];name=names['en'];zh=names.get('zh-hans',names.get('zh-hant'))
 if id=='exeggutor-alola':name='Alolan Exeggutor';zh='阿罗拉椰蛋树'
 if id=='rotom-wash':name='Wash Rotom';zh='冲洗洛托姆'
 if id=='ogerpon-teal':name='Ogerpon (Teal Mask)';zh='厄诡椪（青草面具）'
 aliases=list(dict.fromkeys(aliases+[names.get('zh-hant','')]));aliases=[a for a in aliases if a and a not in [name,zh]]
 urls=['https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/'+game+'/icons/'+str(p['id'])+'.png' for game in ['generation-ix/champions','generation-ix/scarlet-violet','generation-viii/brilliant-diamond-shining-pearl']]
 urls+=['https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/'+str(p['id'])+'.png']
 for url in urls:
  try:
   data=urllib.request.urlopen(url,timeout=30).read();assert data.startswith(b'\x89PNG');break
  except Exception:continue
 else:raise RuntimeError('No icon for '+id)
 target=root/'build-assets/roster-expansion';target.mkdir(exist_ok=True);(target/(id+'.png')).write_bytes(data)
 return {'record':{'id':id,'name':name,'number':str(species['id']).zfill(3),'zh':zh,'aliases':aliases},'asset_id':p['id'],'source':url,'identifier':p['identifier']}
results=list(concurrent.futures.ThreadPoolExecutor(max_workers=6).map(prepare,entries))
(root/'build-assets/roster-expansion/records.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
for r in results:print(r['record']['id'],r['record']['zh'],r['asset_id'],r['source'].split('/versions/')[-1])
# Ponyta: a full-body menu icon, or HOME if unavailable. No Legends headshot fallback.
url='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/brilliant-diamond-shining-pearl/icons/77.png'
data=urllib.request.urlopen(url,timeout=30).read();(root/'build-assets/roster-expansion/ponyta.png').write_bytes(data)
(root/'build-assets/roster-expansion/ponyta-source.txt').write_text(url)
print('Ponyta full-body candidate downloaded.')
