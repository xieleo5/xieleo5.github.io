"""Pin and prepare the official Panda collision/dynamics model for local WASM use."""
from pathlib import Path
import json, shutil, urllib.request, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
COMMIT = '71f066ad0be9cd271f7ed58c030243ef157af9f4'
BASE = f'https://raw.githubusercontent.com/google-deepmind/mujoco_menagerie/{COMMIT}/franka_emika_panda/'
OUT = ROOT / 'dist/assets/franka/physics'
OUT.mkdir(parents=True, exist_ok=True)
def fetch(url):
    return urllib.request.urlopen(url, timeout=60).read()

tree = ET.fromstring(fetch(BASE + 'panda.xml'))
for parent in tree.iter():
    for child in list(parent):
        if child.tag == 'geom' and child.get('class') == 'visual':
            parent.remove(child)
used = {g.get('mesh') for g in tree.iter('geom') if g.get('mesh')}
asset = tree.find('asset')
files = []
for mesh in list(asset.findall('mesh')):
    if mesh.get('name', Path(mesh.get('file')).stem) not in used:
        asset.remove(mesh)
        continue
    name = mesh.get('file')
    (OUT / name).write_bytes(fetch(BASE + 'assets/' + name))
    files.append(name)
tree.find('compiler').set('meshdir', '')
option = tree.find('option')
option.attrib.update(timestep='0.002', integrator='implicitfast', cone='elliptic',
                     solver='Newton', iterations='50', tolerance='1e-8', impratio='10')
default = tree.find('default')
ET.SubElement(default, 'geom', friction='0.6 0.005 0.0001', solref='0.006 1', solimp='0.95 0.99 0.001', condim='4')
for body in tree.findall('.//body'):
    body.set('gravcomp', '1')
for i, body in enumerate(tree.findall('.//body')):
    for j, geom in enumerate(body.findall('geom')):
        geom.set('name', f'{body.get("name")}_collision_{j}')
        if 'finger' in body.get('name', ''):
            geom.attrib.update(friction='1.0 0.01 0.0001', condim='6', priority='1')
tree.remove(tree.find('keyframe'))
act = tree.find('actuator')
act.remove(act[-1])
ET.SubElement(act, 'position', name='gripper', tendon='split', kp='800', kv='15',
              ctrlrange='0 0.04', forcerange='-20 20')
ET.indent(tree)
(OUT / 'panda.xml').write_text(ET.tostring(tree, encoding='unicode'))
(OUT / 'manifest.json').write_text(json.dumps({'source': BASE, 'commit': COMMIT, 'meshes': files}, indent=2)+'\n')
(OUT / 'LICENSE').write_bytes(fetch(BASE + 'LICENSE'))
vendor = ROOT / 'dist/vendor/mujoco'
vendor.mkdir(exist_ok=True)
for name in ('mujoco.js', 'mujoco.wasm'):
    shutil.copyfile(ROOT / 'node_modules/@mujoco/mujoco' / name, vendor / name)
(vendor / 'LICENSE').write_bytes(fetch('https://raw.githubusercontent.com/google-deepmind/mujoco/3.17.0/LICENSE'))
(vendor / 'NOTICE.txt').write_text('MuJoCo 3.17.0 official single-threaded WebAssembly build. Google DeepMind. Apache-2.0. https://github.com/google-deepmind/mujoco\n')
print(f'Prepared {len(files)} official collision meshes and MuJoCo 3.17.0.')
