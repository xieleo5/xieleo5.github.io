"""Publish the committed dist tree to the existing GitHub Pages branch."""
import subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def git(*args):
    return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
if git('branch','--show-current')!='master':raise SystemExit('Run from master.')
if git('status','--porcelain'):raise SystemExit('Commit changes before publishing.')
subprocess.run(['git','fetch','origin','gh-pages'],cwd=root,check=True)
ignored=git('ls-files','--others','--ignored','--exclude-standard','dist')
if ignored:raise SystemExit('Runtime files are ignored by Git; review before publishing: '+ignored)
tree=git('rev-parse','HEAD:dist');parent=git('rev-parse','origin/gh-pages')
if git('rev-parse','origin/gh-pages^{tree}')==tree:raise SystemExit('This version is already published.')
commit=git('commit-tree',tree,'-p',parent,'-m','Publish homepage '+git('rev-parse','--short','HEAD'))
subprocess.run(['git','push','origin',commit+':refs/heads/gh-pages'],cwd=root,check=True)
print('Published commit '+commit+'; GitHub Pages is building https://xieleo5.github.io/')
