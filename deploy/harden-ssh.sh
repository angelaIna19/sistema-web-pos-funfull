#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Ejecuta este script como root solo despues de verificar el acceso del usuario deploy." >&2
  exit 1
fi

if ! id deploy >/dev/null 2>&1 || [[ ! -s /home/deploy/.ssh/authorized_keys ]]; then
  echo "El usuario deploy o su authorized_keys no estan listos." >&2
  exit 1
fi

cat > /etc/ssh/sshd_config.d/99-funfull-hardening.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
EOF

sshd -t
systemctl reload ssh
echo "SSH endurecido: root y autenticacion por contrasena quedaron deshabilitados."
