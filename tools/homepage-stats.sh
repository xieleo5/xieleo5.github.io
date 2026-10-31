#!/bin/sh
set -eu
case "${1:-}" in
  '') remote='cd ~/homepage-backend && docker compose exec -T api node stats.mjs' ;;
  --visitors) remote='cd ~/homepage-backend && docker compose exec -T api node stats.mjs --visitors' ;;
  *) echo 'Usage: tools/homepage-stats.sh [--visitors]' >&2; exit 2 ;;
esac
exec ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=10 g-f-backend-ubuntu "$remote"
