#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres --set=app_password="$APP_PASSWORD" <<'SQL'
CREATE ROLE homepage_app LOGIN PASSWORD :'app_password';
CREATE DATABASE homepage OWNER homepage_app;
REVOKE CONNECT ON DATABASE postgres FROM PUBLIC;
SQL
