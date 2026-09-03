# Despliegue en DigitalOcean

Este despliegue usa Docker Compose con tres servicios: PostgreSQL, API Node y Nginx con la SPA React. Solo Nginx publica un puerto del host (`80`). PostgreSQL y la API permanecen en la red interna de Docker.

> **Advertencia:** `http://104.248.233.51` es un entorno temporal de pruebas. No uses credenciales ni datos reales: HTTP no cifra el usuario, la contraseña ni el token administrativo.

## 1. Preparar el acceso SSH

Genera una clave SSH administrativa en tu equipo si aún no tienes una:

```bash
ssh-keygen -t ed25519 -C "funfull-deploy"
```

Copia `deploy/bootstrap-ubuntu.sh` al droplet y ejecútalo inicialmente como `root`, pasando la clave pública:

```bash
export DEPLOY_PUBLIC_KEY='ssh-ed25519 AAAA... funfull-deploy'
bash bootstrap-ubuntu.sh
```

Abre una terminal nueva y verifica `ssh deploy@104.248.233.51`. Solo después de confirmar ese acceso ejecuta como root `deploy/harden-ssh.sh`. Mantén además un DigitalOcean Cloud Firewall con `80/tcp` público y `22/tcp` limitado a tu IP administrativa; no abras `3001` ni `5432`.

## 2. Dar acceso al repositorio privado

En el droplet, como `deploy`, crea una deploy key sin contraseña:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/funfull_github -C "funfull-droplet" -N ''
cat ~/.ssh/funfull_github.pub
```

Registra la clave pública en GitHub, en **Settings > Deploy keys** del repositorio, sin habilitar escritura. Configura `~/.ssh/config`:

```text
Host github.com
  IdentityFile ~/.ssh/funfull_github
  IdentitiesOnly yes
```

Protege el archivo y valida la huella de GitHub al realizar la primera conexión:

```bash
chmod 600 ~/.ssh/config
ssh -T git@github.com
```

Después:

```bash
git clone --branch main git@github.com:angelaIna19/sistema-web-pos-funfull.git /opt/funfull/app
chmod +x /opt/funfull/app/deploy/*.sh
```

## 3. Crear secretos

Copia `.env.example` a `/opt/funfull/.env`, reemplaza todas las claves de ejemplo y limita sus permisos:

```bash
cp /opt/funfull/app/.env.example /opt/funfull/.env
chmod 600 /opt/funfull/.env
```

Puedes generar valores aleatorios con `openssl rand -base64 36`. Evita espacios y los valores `postgres`, `admin` o `admin123`.

## 4. Primer despliegue

```bash
cd /opt/funfull/app
docker compose --env-file /opt/funfull/.env config --quiet
docker compose --env-file /opt/funfull/.env build --pull
docker compose --env-file /opt/funfull/.env up -d
docker compose --env-file /opt/funfull/.env ps
curl --fail http://127.0.0.1/api/health
```

Abre `http://104.248.233.51`. Comprueba el login, productos, inventario, caja, ventas y reportes, además de recargar directamente una ruta React. Desde otro equipo, los puertos `3001` y `5432` no deben aceptar conexiones.

## 5. Backups y actualizaciones

Instala el respaldo diario como `deploy`:

```bash
bash /opt/funfull/app/deploy/install-backup-cron.sh
bash /opt/funfull/app/deploy/backup.sh
bash /opt/funfull/app/deploy/verify-restore.sh /opt/funfull/backups/funfull-AAAAmmddTHHMMSSZ.dump
```

Los respaldos se guardan con permisos restringidos y retención de siete días. Para actualizaciones posteriores ejecuta `bash /opt/funfull/app/deploy/deploy.sh`: crea un dump si la base está activa, actualiza `main` con fast-forward, reconstruye y comprueba `/api/health`.

Para revertir el código, usa el commit anterior informado por el script, reconstruye los contenedores y restaura la base solo si el despliegue incluyó un cambio de esquema incompatible.

## 6. Operación

- Activa Monitoring y backups automáticos en el panel de DigitalOcean.
- Revisa periódicamente `docker compose ps`, `docker stats`, espacio en disco y `/opt/funfull/backup.log`.
- Los logs Docker rotan a tres archivos de 10 MB por servicio.
- Reiniciar la API invalida las sesiones porque actualmente se almacenan en memoria.
- Antes de usar información real, habilita HTTPS sobre la IP o un dominio y rota todas las credenciales de prueba.
