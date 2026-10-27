from pathlib import Path
import json, html
root=Path(__file__).parent
records=json.loads((root/'dist/publications.json').read_text())
esc=lambda text:html.escape(str(text),quote=True)
articles=[]
for p in records:
    names=[]
    for a in p['authors']:
        label=esc(a['name'])+('<sup>*</sup>' if a['equal'] else '')
        if a.get('url'):label=f'<a href="{esc(a["url"])}">{label}</a>'
        if a['name']=='Yuqi Xie':label='<strong>'+label+'</strong>'
        names.append(label)
    authors=', '.join(names)
    if p['authorGroup']:authors='<span class="author-group">NVIDIA:</span> '+authors
    venue=p['venue'].replace('Preprint · ', 'arXiv ')
    if p.get('award'):venue+=' <span class="award">('+esc(p['award'])+')</span>'
    links=[f'<span class="venue">{venue}</span>']
    for key,label in [('project','website'),('paper','paper'),('code','code')]:
        if p.get(key):links.append(f'<a href="{esc(p[key])}">{label}</a>')
    destination=esc(p.get('project',p['paper']))
    articles.append(f'''      <article class="publication{' highlighted' if p.get('highlight') else ''}" data-paper="{esc(p['name'])}">
        <a class="paper-image" href="{destination}" aria-label="{esc(p['name'])} project"><img src="assets/{p['image']}" alt="{esc(p['name'])} research overview" width="380" height="240" loading="lazy"></a>
        <div class="paper-text">
          <h3><a href="{destination}">{esc(p['title'])}</a></h3>
          <p class="authors">{authors}</p>
          <p class="paper-links">{' <span class="separator" aria-hidden="true">|</span> '.join(links)}</p>
        </div>
      </article>''')
page=(root/'homepage.template.html').read_text().replace('<!-- PUBLICATIONS -->','\n'.join(articles))
(root/'dist/index.html').write_text(page)
print(f'Rendered {len(records)} publications with complete author lists.')
