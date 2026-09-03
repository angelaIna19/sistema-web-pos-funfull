#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/funfull/app}"
ENV_FILE="${ENV_FILE:-/opt/funfull/.env}"
BRANCH="${BRANCH:-main}"

cd "${APP_DIR}"

if docker compose --env-file "${ENV_FILE}" ps --status running --services 2>/dev/null | grep -qx db; then
  bash "${APP_DIR}/deploy/backup.sh"
fi

previous_commit="$(git rev-parse HEAD)"
git fetch --prune origin
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"
current_commit="$(git rev-parse HEAD)"

docker compose --env-file "${ENV_FILE}" config --quiet
docker compose --env-file "${ENV_FILE}" build --pull
docker compose --env-file "${ENV_FILE}" up -d --remove-orphans

for attempt in {1..30}; do
  if curl -fsS http://127.0.0.1/api/health >/dev/null; then
    printf 'Despliegue correcto: %s (anterior: %s)\n' "${current_commit}" "${previous_commit}"
    docker compose --env-file "${ENV_FILE}" ps
    exit 0
  fi
  sleep 2
done

echo "El healthcheck no respondio. Commit anterior para rollback: ${previous_commit}" >&2
docker compose --env-file "${ENV_FILE}" ps >&2
docker compose --env-file "${ENV_FILE}" logs --tail=100 >&2
exit 1
