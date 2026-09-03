#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/funfull/app}"
ENV_FILE="${ENV_FILE:-/opt/funfull/.env}"
BACKUP_FILE="${1:-}"
TEST_DB="funfull_restore_test"

if [[ -z "${BACKUP_FILE}" || ! -s "${BACKUP_FILE}" ]]; then
  echo "Uso: $0 /ruta/al/respaldo.dump" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "${ENV_FILE}"
set +a

cd "${APP_DIR}"
cleanup() {
  docker compose --env-file "${ENV_FILE}" exec -T db \
    dropdb -U "${POSTGRES_USER}" --if-exists "${TEST_DB}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cleanup
docker compose --env-file "${ENV_FILE}" exec -T db \
  createdb -U "${POSTGRES_USER}" "${TEST_DB}"
docker compose --env-file "${ENV_FILE}" exec -T db \
  pg_restore -U "${POSTGRES_USER}" -d "${TEST_DB}" --no-owner --no-privileges < "${BACKUP_FILE}"
docker compose --env-file "${ENV_FILE}" exec -T db \
  psql -U "${POSTGRES_USER}" -d "${TEST_DB}" -v ON_ERROR_STOP=1 \
  -c "SELECT COUNT(*) AS tablas FROM information_schema.tables WHERE table_schema = 'public';"

echo "Restauracion verificada correctamente en ${TEST_DB}."
