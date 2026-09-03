# Guía de operación y acceso — Fun Full POS

## Estado del despliegue

La aplicación se encuentra desplegada en Docker Compose sobre el droplet `104.248.233.51`.

- Nginx publica el frontend React y dirige `/api` al backend.
- La API Node/Express solo está disponible dentro de la red privada de Docker.
- PostgreSQL está enlazado únicamente a `127.0.0.1:5432` del droplet para acceso mediante túnel SSH.
- Únicamente los puertos `22` (SSH) y `80` (HTTP) están abiertos.
- UFW está activo.
- El acceso SSH de `root` y la autenticación por contraseña están deshabilitados.
- Los secretos se guardan en `/opt/funfull/.env` con permisos `600`.
- PostgreSQL utiliza un volumen persistente.
- Hay backups diarios a las `02:15 UTC` (`21:15` de Ecuador) con retención de siete días.
- Se comprobó la restauración de un backup y el arranque automático después de reiniciar el droplet.
- El commit desplegado puede consultarse con `git -C /opt/funfull/app rev-parse --short HEAD`.
- La auditoría de dependencias terminó con cero vulnerabilidades reportadas por npm.

## Acceso al droplet

| Dato | Valor |
| --- | --- |
| Servidor | `104.248.233.51` |
| Usuario | `deploy` |
| Clave privada local | `C:\Users\anela\.ssh\id_ed25519` |
| Autenticación | Clave SSH protegida con frase secreta |

Desde PowerShell:

```powershell
ssh -i C:\Users\anela\.ssh\id_ed25519 deploy@104.248.233.51
```

La frase secreta de la clave SSH no debe guardarse en este repositorio. Para cambiarla sin reemplazar la clave pública instalada en el servidor:

```powershell
ssh-keygen -p -f C:\Users\anela\.ssh\id_ed25519
```

## Acceso al sitio web

- Sitio: [http://104.248.233.51](http://104.248.233.51)
- Login administrativo: [http://104.248.233.51/login](http://104.248.233.51/login)
- Healthcheck: [http://104.248.233.51/api/health](http://104.248.233.51/api/health)
- Usuario administrativo inicial: `administrador`

La contraseña administrativa se generó aleatoriamente y no se guarda en Git. Para consultarla por el canal SSH cifrado:

```powershell
ssh deploy@104.248.233.51 "grep '^ADMIN_' /opt/funfull/.env"
```

> Este entorno se publica por HTTP para pruebas. El usuario, la contraseña y el token administrativo no viajan cifrados entre el navegador y el servidor. No debe utilizarse con credenciales ni datos reales hasta activar HTTPS.

## Actualizar la aplicación

### 1. Validar y publicar cambios desde la PC

```powershell
cd C:\Users\anela\Documents\sistema-web-pos-funfull

npm --prefix frontend run lint
npm --prefix frontend run build

git status
git add .
git commit -m "Descripción del cambio"
git push origin main
```

Antes de confirmar cambios, revisa `git status` para evitar incluir archivos locales o secretos.

### 2. Desplegar la nueva versión

```powershell
ssh deploy@104.248.233.51 "bash /opt/funfull/app/deploy/deploy.sh"
```

El script de despliegue:

1. Crea un backup si PostgreSQL está activo.
2. Descarga la rama `main` mediante fast-forward.
3. Construye las imágenes Docker.
4. Actualiza los contenedores.
5. Comprueba `/api/health`.
6. Informa el commit anterior para facilitar un rollback.

### 3. Verificar el estado

```powershell
ssh deploy@104.248.233.51 "cd /opt/funfull/app && docker compose --env-file /opt/funfull/.env ps"
```

Los servicios `db`, `api` y `web` deben aparecer como `healthy`.

Verifica también desde el exterior:

```powershell
curl.exe --fail http://104.248.233.51/api/health
```

## Logs y diagnóstico

Últimos logs de todos los servicios:

```powershell
ssh deploy@104.248.233.51 "cd /opt/funfull/app && docker compose --env-file /opt/funfull/.env logs --tail=100 api web db"
```

Seguir los logs en tiempo real:

```powershell
ssh -t deploy@104.248.233.51 "cd /opt/funfull/app && docker compose --env-file /opt/funfull/.env logs --follow --tail=100 api web db"
```

Consultar recursos:

```powershell
ssh -t deploy@104.248.233.51 "docker stats"
```

## Backups de PostgreSQL

Crear un backup manual:

```powershell
ssh deploy@104.248.233.51 "bash /opt/funfull/app/deploy/backup.sh"
```

Listar los respaldos:

```powershell
ssh deploy@104.248.233.51 "ls -lh /opt/funfull/backups"
```

Ver el trabajo programado:

```powershell
ssh deploy@104.248.233.51 "crontab -l"
```

Verificar que un dump puede restaurarse en una base temporal:

```powershell
ssh deploy@104.248.233.51 "bash /opt/funfull/app/deploy/verify-restore.sh /opt/funfull/backups/NOMBRE-DEL-BACKUP.dump"
```

## Acceso a PostgreSQL

| Dato | Valor |
| --- | --- |
| Base de datos | `funfull_pos` |
| Usuario | `funfull_app` |
| Puerto interno | `5432` |
| Servicio de Compose | `db` |

Consultar las variables de conexión sin almacenarlas localmente:

```powershell
ssh deploy@104.248.233.51 "grep '^POSTGRES_' /opt/funfull/.env"
```

### Consola SQL por SSH

```powershell
ssh -t deploy@104.248.233.51 "cd /opt/funfull/app && docker compose --env-file /opt/funfull/.env exec db psql -U funfull_app -d funfull_pos"
```

Comandos útiles dentro de `psql`:

```sql
\dt
SELECT * FROM usuarios_admin;
\q
```

### DBeaver o pgAdmin

PostgreSQL no está publicado directamente en Internet y el puerto `5432` debe permanecer cerrado en los firewalls. La configuración permite administración mediante `docker compose exec` o mediante un túnel SSH.

PostgreSQL está enlazado exclusivamente a `127.0.0.1` del droplet. No se debe cambiar por `5432:5432`, porque eso lo publicaría en todas las interfaces.

La configuración desplegada en el servicio `db` es:

```yaml
ports:
  - "127.0.0.1:5432:5432"
```

Desde la PC, abre el túnel y deja esa ventana de PowerShell funcionando:

```powershell
ssh -i C:\Users\anela\.ssh\id_ed25519 -N -L 127.0.0.1:5433:127.0.0.1:5432 deploy@104.248.233.51
```

La herramienta gráfica se configuraría con:

| Dato | Valor |
| --- | --- |
| Host | `127.0.0.1` |
| Puerto | `5433` |
| Base | `funfull_pos` |
| Usuario | `funfull_app` |
| Contraseña | Valor `POSTGRES_PASSWORD` de `/opt/funfull/.env` |

Mientras el túnel esté activo, la conexión viaja cifrada por SSH. Cerrar esa ventana de PowerShell termina el acceso local a la base.

## Archivos operativos

- `compose.yaml`: definición de los servicios.
- `.env.example`: nombres de variables requeridas, sin secretos reales.
- `DEPLOYMENT.md`: procedimiento de preparación y primer despliegue.
- `deploy/deploy.sh`: actualizaciones con backup y healthcheck.
- `deploy/backup.sh`: generación de dumps.
- `deploy/verify-restore.sh`: restauración de prueba.
- `deploy/install-backup-cron.sh`: programación de backups.
- `deploy/harden-ssh.sh`: endurecimiento de SSH.
