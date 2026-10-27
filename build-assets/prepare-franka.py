from pathlib import Path
import urllib.request, json, xml.etree.ElementTree as ET, concurrent.futures, struct
root=Path(__file__).resolve().parent.parent
base='https://raw.githubusercontent.com/google-deepmind/mujoco_menagerie/main/franka_emika_panda/'
def fetch(url): return urllib.request.urlopen(url,timeout=60).read()
xml=fetch(base+'panda.xml'); (root/'build-assets/franka/panda.xml').write_bytes(xml)
tree=ET.fromstring(xml)
materials={e.attrib['name']:list(map(float,e.attrib['rgba'].split())) for e in tree.findall('./asset/material')}
files={e.attrib.get('name',Path(e.attrib['file']).stem):e.attrib['file'] for e in tree.findall('./asset/mesh')}
names=sorted({e.attrib['mesh'] for e in tree.findall('.//geom') if e.attrib.get('class')=='visual'})
def get(name):
 p=root/'build-assets/franka'/files[name]
 if not p.exists(): p.write_bytes(fetch(base+'assets/'+files[name]))
 return name,p.read_text()
raw=dict(concurrent.futures.ThreadPoolExecutor(max_workers=8).map(get,names))
blob=bytearray(); meshes={}
for name,txt in raw.items():
 vertices=[]; normals=[]; attributes=[]; indices=[]; cache={}
 for ln in txt.splitlines():
  t=ln.split()
  if not t: continue
  if t[0]=='v':vertices.append(list(map(float,t[1:4])))
  elif t[0]=='vn':normals.append(list(map(float,t[1:4])))
  elif t[0]=='f':
   face=[]
   for item in t[1:]:
    pair=item.split('/'); key=(int(pair[0])-1,int(pair[2])-1 if len(pair)>2 and pair[2] else -1)
    if key not in cache:
     cache[key]=len(attributes)//6; attributes+=vertices[key[0]]+(normals[key[1]] if key[1]>=0 else [0,0,1])
    face.append(cache[key])
   for i in range(1,len(face)-1):indices.extend([face[0],face[i],face[i+1]])
 offset=len(blob);blob+=struct.pack('<%sf'%len(attributes),*attributes)
 indexOffset=len(blob);blob+=struct.pack('<%sI'%len(indices),*indices)
 meshes[name]={'offset':offset,'vertices':len(attributes)//6,'indexOffset':indexOffset,'indices':len(indices)}
def body(el):
 j=el.find('joint'); a=el.attrib
 return {'name':a['name'],'pos':list(map(float,a.get('pos','0 0 0').split())),'quat':list(map(float,a.get('quat','1 0 0 0').split())), 'joint':None if j is None else {'name':j.attrib['name'],'range':list(map(float,j.attrib.get('range','-2.8973 2.8973').split()))},'visuals':[{'mesh':g.attrib['mesh'],'color':materials[g.attrib['material']][:3]} for g in el.findall('geom') if g.attrib.get('class')=='visual'],'children':[body(b) for b in el.findall('body')]}
out=root/'dist/assets/franka'
(out/'panda.bin').write_bytes(blob)
(out/'panda.json').write_text(json.dumps({'meshes':meshes,'body':body(tree.find('./worldbody/body'))},separators=(',',':')))
(out/'LICENSE').write_bytes(fetch(base+'LICENSE'))
(out/'NOTICE.txt').write_text('Franka Emika Panda visual meshes and kinematic description. Source: google-deepmind/mujoco_menagerie/franka_emika_panda, derived from Franka Emika franka_ros. Apache-2.0. OBJ positions, normals, and indices packed without geometric modification for this browser game. See LICENSE.\n')
for name,url in {'three.module.js':'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js','three.core.js':'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.core.js','cannon-es.js':'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js','THREE-LICENSE.txt':'https://cdn.jsdelivr.net/npm/three@0.180.0/LICENSE','CANNON-LICENSE.txt':'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/LICENSE'}.items():
 (root/'dist/vendor'/name).write_bytes(fetch(url))
print(f'Packed {len(meshes)} Franka meshes: {len(blob):,} bytes. Local Three.js 0.180.0 and cannon-es 0.20.0 ready.')
