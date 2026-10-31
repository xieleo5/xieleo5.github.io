#!/usr/bin/env python3
"""Run with sudo on the VM after the isolated API has passed its tests."""
from pathlib import Path
import datetime
import subprocess
site = Path('/etc/nginx/sites-available/gfg-api')
snippet = Path('/etc/nginx/snippets/homepage-api.conf')
rate = Path('/etc/nginx/conf.d/homepage-rate-limit.conf')
include = '    include /etc/nginx/snippets/homepage-api.conf;\n'
original = site.read_text()
if 'server_name gfg-api.duckdns.org;' not in original:
    raise SystemExit('Unexpected nginx config; refusing to change it')
backup = site.with_name('gfg-api.backup-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
backup.write_text(original)
previous_snippet = snippet.read_bytes() if snippet.exists() else None
previous_rate = rate.read_bytes() if rate.exists() else None
try:
    snippet.write_bytes(Path('nginx-location.conf').read_bytes())
    rate.write_bytes(Path('nginx-rate-limit.conf').read_bytes())
    if include not in original:
        site.write_text(original.replace('    server_name gfg-api.duckdns.org;\n', '    server_name gfg-api.duckdns.org;\n' + include, 1))
    subprocess.run(['nginx', '-t'], check=True)
    subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
except BaseException:
    site.write_text(original)
    for path, content in [(snippet, previous_snippet), (rate, previous_rate)]:
        if content is None:
            path.unlink(missing_ok=True)
        else:
            path.write_bytes(content)
    raise
print('Homepage API proxy enabled; backup:', backup)
