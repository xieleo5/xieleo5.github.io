#!/bin/bash
# Creates/updates only the independent yuqi-homepage Compose project.
set -euo pipefail
cd "$(dirname "$0")/.."
node tools/sync-backend-catalog.mjs
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=10 g-f-backend-ubuntu 'mkdir -p ~/homepage-backend && chmod 700 ~/homepage-backend'
COPYFILE_DISABLE=1 tar --no-xattrs -C backend -czf - package.json package-lock.json Dockerfile compose.yml init-db.sh schema.sql app.mjs server.mjs store.mjs stats.mjs test.mjs catalog.json .dockerignore nginx-location.conf nginx-rate-limit.conf setup-proxy.py | ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=10 g-f-backend-ubuntu 'tar -xzf - -C ~/homepage-backend'
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=10 g-f-backend-ubuntu 'cd ~/homepage-backend && python3 - <<"PY"
from pathlib import Path
import os, secrets
p = Path(".env")
if not p.exists():
    fd = os.open(p, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w") as f:
        f.write("POSTGRES_PASSWORD=" + secrets.token_hex(32) + "\nAPP_PASSWORD=" + secrets.token_hex(32) + "\n")
PY
 docker compose up -d --build --wait --wait-timeout 120 && docker compose exec -T api npm test && sudo -n python3 setup-proxy.py && curl --fail --silent http://127.0.0.1:4010/health && curl --fail --silent http://127.0.0.1:4000/health'
