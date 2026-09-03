#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_PUBLIC_KEY="${DEPLOY_PUBLIC_KEY:-}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Ejecuta este script como root." >&2
  exit 1
fi

if [[ -z "${DEPLOY_PUBLIC_KEY}" ]]; then
  echo "Define DEPLOY_PUBLIC_KEY con la clave SSH publica del usuario deploy." >&2
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl gnupg ufw git cron openssl

if ! id "${DEPLOY_USER}" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "${DEPLOY_USER}"
fi
usermod -aG sudo "${DEPLOY_USER}"
printf '%s ALL=(ALL) NOPASSWD:ALL\n' "${DEPLOY_USER}" > "/etc/sudoers.d/${DEPLOY_USER}"
chmod 440 "/etc/sudoers.d/${DEPLOY_USER}"

install -d -m 700 -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"
touch "/home/${DEPLOY_USER}/.ssh/authorized_keys"
if ! grep -Fxq "${DEPLOY_PUBLIC_KEY}" "/home/${DEPLOY_USER}/.ssh/authorized_keys"; then
  echo "${DEPLOY_PUBLIC_KEY}" >> "/home/${DEPLOY_USER}/.ssh/authorized_keys"
fi
chown "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh/authorized_keys"
chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

. /etc/os-release
cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker "${DEPLOY_USER}"
systemctl enable --now docker cron

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw --force enable

install -d -m 0755 -o "${DEPLOY_USER}" -g "${DEPLOY_USER}" /opt/funfull

echo "Bootstrap completado. Abre otra terminal y verifica: ssh ${DEPLOY_USER}@$(hostname -I | awk '{print $1}')"
echo "No desactives root ni PasswordAuthentication hasta verificar ese acceso."
