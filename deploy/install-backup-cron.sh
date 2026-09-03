#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/funfull/app}"
LOG_FILE="${LOG_FILE:-/opt/funfull/backup.log}"
CRON_LINE="15 2 * * * bash ${APP_DIR}/deploy/backup.sh >> ${LOG_FILE} 2>&1 # funfull-backup"

current="$(crontab -l 2>/dev/null || true)"
{
  printf '%s\n' "${current}" | grep -v '# funfull-backup' || true
  printf '%s\n' "${CRON_LINE}"
} | crontab -

echo "Respaldo diario instalado para las 02:15 UTC."
