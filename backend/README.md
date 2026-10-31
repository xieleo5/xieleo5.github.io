# Homepage visits and collection records

The GitHub Pages frontend calls `https://gfg-api.duckdns.org/homepage-api/`.
The Oracle VM runs a separate Compose project, `yuqi-homepage`, in
`~/homepage-backend`. It has its own PostgreSQL container, database, app role,
passwords and persistent volume. The Guitar & Frosted Glass API, databases and
routes are not changed. Only Nginx and VM capacity are shared.

## What is recorded

- One page view per document load, with a retry-safe event UUID.
- A random anonymous browser credential; only its SHA-256 digest is stored on the server.
- Collection IDs, first-recorded time, acquisition mode and acquisition time.
  Existing local saves are imported as `legacy`, with unknown acquisition time.
- Daily visitors are distinct browser identities in America/Los_Angeles time.
  This is browser-based counting, not verified people; bots and cleared storage can affect counts.
- No raw IPs, user agent, referrer, typed guesses, bug logs, emails or account names
  are stored by this service. Its Nginx access logging is disabled. Nginx uses
  IPs transiently in memory for rate limiting.

The existing `yuqi-field-notes-v2` collection stays in the browser. Uploads retry
in the background; offline play remains available. Remote and local collections
are merged additively. The opaque browser credential grants access only to that
browser's collection. Clearing browser storage or changing devices creates a new
identity; this is not account-based cross-device sync. Treat the token as a secret.
Collection claims come from the client and are not proof of winning a game.
Local previews do not send visits or collections.

## Read statistics (SSH only)

From the repository:

```sh
./tools/homepage-stats.sh
./tools/homepage-stats.sh --visitors
```

The first prints overall page views, unique browser visitors, daily counts and
collection popularity. The second also includes the latest 1,000 anonymous
visitor records and their collections. No public statistics/admin endpoint exists.
Counts begin when this feature is deployed; past visits cannot be reconstructed.

## Deploy / test

```sh
npm ci --prefix backend
node --test tests/collection-sync.test.mjs backend/test.mjs
./tools/deploy-homepage-backend.sh
```

The deployment script copies only backend sources, creates server-side credentials
with mode 0600 on first deployment, starts the independent stack, runs integration
tests in a disposable PostgreSQL schema, then validates and reloads Nginx. An
invalid Nginx config is rolled back. It does not modify or restart the Guitar app.
The backend role owns only its separate database; it is not a superuser.
Credentials are never included in Git or the Pages artifact.

Frontend publishing follows the normal master / `tools/publish-pages.py` workflow.
`npm run pokemon:sync` refreshes the backend allowlist as well as the frontend;
redeploy the backend before publishing newly added collectibles.

## Operations

```sh
ssh g-f-backend-ubuntu
cd ~/homepage-backend
docker compose ps
docker compose logs --tail 50 api
docker compose exec -T api node stats.mjs
```

API is bound to VM loopback port 4010, proxied only through `/homepage-api/`.
PostgreSQL has no host port. Each container has a memory/CPU cap and bounded logs.
Health: `https://gfg-api.duckdns.org/homepage-api/health`.

Manual backup on the VM (keep backups private):

```sh
cd ~/homepage-backend
umask 077
mkdir -p backups
docker compose exec -T db pg_dump -U postgres -Fc homepage > "backups/homepage-$(date +%Y%m%d-%H%M%S).dump"
```

Backups are not automatically scheduled. The named `homepage_data` volume
survives rebuilds; never use `docker compose down -v` unless intentionally erasing
all homepage records. To stop this service, `docker compose stop` affects only
this independent stack; the frontend continues to play locally.
