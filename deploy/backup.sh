#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/funfull/app}"
ENV_FILE="${ENV_FILE:-/opt/funfull/.env}"
BACKUP_DIR="${BACKUP_DIR:-/opt/funfull/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

if [[ ! -r "${ENV_FILE}" ]]; then
  echo "No se puede leer ${ENV_FILE}." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "${ENV_FILE}"
set +a

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="${BACKUP_DIR}/funfull-${timestamp}.dump"

cd "${APP_DIR}"
docker compose --env-file "${ENV_FILE}" exec -T db \
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Fc > "${target}"

test -s "${target}"
chmod 600 "${target}"
find "${BACKUP_DIR}" -type f -name 'funfull-*.dump' -mtime "+${RETENTION_DAYS}" -delete
echo "Respaldo creado: ${target}"
