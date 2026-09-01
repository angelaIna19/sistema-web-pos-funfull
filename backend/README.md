# Backend — Sistema POS Fun Full

API REST del sistema de punto de venta de Licorería Fun Full. Gestiona autenticación administrativa, productos, categorías, caja, ventas, inventario, reportes y credenciales del administrador.

## Tecnologías

- Node.js y Express 5
- PostgreSQL mediante `pg`
- `dotenv` y `cors`

## Requisitos

- Node.js 20 o superior (se recomienda Node.js 22)
- npm
- PostgreSQL en ejecución
- Una base de datos creada para la aplicación

## Instalación

Desde la carpeta `backend`:

```bash
npm install
```

## Configuración

Crea `backend/.env`. Puedes configurar PostgreSQL con parámetros separados:

```env
PORT=3001
PGHOST=localhost
PGPORT=5432
PGDATABASE=funfull_pos
PGUSER=postgres
PGPASSWORD=postgres
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
```

O usar una URL completa:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/funfull_pos
PORT=3001
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
```

`ADMIN_USER` y `ADMIN_PASSWORD` crean el primer administrador únicamente cuando la tabla está vacía. Cambia los valores predeterminados en cualquier entorno compartido o productivo.

## Base de datos

Crea primero la base de datos, por ejemplo:

```sql
CREATE DATABASE funfull_pos;
```

Al arrancar, `src/database/initDb.js` crea o actualiza las tablas necesarias y registra el administrador inicial. Las entidades principales son administradores, productos, categorías, cajas, movimientos de caja, ventas, detalles de venta y movimientos de inventario.

El archivo `db/schema.sql` es una referencia parcial. La inicialización vigente está en `src/database/initDb.js`.

## Ejecución

```bash
npm run dev    # desarrollo con nodemon
npm start      # ejecución normal
```

Por defecto, la API queda disponible en `http://localhost:3001`, con endpoints bajo `/api`.

Comprueba el servidor y PostgreSQL con:

```http
GET http://localhost:3001/api/health
```

Respuesta esperada:

```json
{
  "estado": "ok",
  "baseDatos": "PostgreSQL conectada"
}
```

## Autenticación

El login devuelve un token que debe enviarse a los endpoints administrativos:

```http
Authorization: Bearer <token>
```

Las sesiones se almacenan en memoria; reiniciar el backend invalida los tokens activos. Tampoco se permite cerrar sesión mientras exista una caja abierta: primero debe cerrarse la caja.

## Endpoints principales

### Públicos

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/` | Identificación de la API |
| `GET` | `/api/health` | Estado de PostgreSQL |
| `POST` | `/api/auth/login` | Inicio de sesión |
| `GET` | `/api/productos` | Lista de productos |
| `GET` | `/api/productos/:id` | Detalle de producto |
| `GET` | `/api/categorias` | Lista de categorías |

### Administrativos

Todos requieren el encabezado `Authorization`.

| Área | Endpoints |
| --- | --- |
| Sesión | `POST /api/auth/logout` |
| Cuenta | `GET /api/admin/usuarios/me`, `PUT /api/admin/usuarios/me/credenciales` |
| Productos | `POST /api/admin/productos`, `PUT /api/admin/productos/:id`, `DELETE /api/admin/productos/:id` |
| Categorías | `POST /api/admin/categorias`, `PUT /api/admin/categorias/:id`, `DELETE /api/admin/categorias/:id` |
| Caja | `GET /api/admin/caja/actual`, `GET /api/admin/cajas`, `POST /api/admin/caja/abrir`, `POST /api/admin/caja/cerrar`, `POST /api/admin/caja/movimientos` |
| Ventas | `GET /api/admin/ventas`, `GET /api/admin/ventas/:id`, `POST /api/admin/ventas`, `POST /api/admin/ventas/:id/anular` |
| Inventario | `GET /api/admin/inventario/resumen`, `GET /api/admin/inventario/movimientos`, `GET /api/admin/inventario/stock-bajo`, `GET /api/admin/inventario/productos/:id/detalle`, `POST /api/admin/inventario/entradas`, `POST /api/admin/inventario/salidas`, `POST /api/admin/inventario/ajustes` |
| Reportes | `GET /api/admin/reportes/ventas`, `GET /api/admin/reportes/ventas-por-caja`, `GET /api/admin/reportes/ordenes`, `GET /api/admin/reportes/productos-mas-vendidos`, `GET /api/admin/reportes/stock-bajo` |

## Restablecer el administrador

Para crear o actualizar las credenciales del primer administrador:

```bash
npm run admin:reset -- --usuario admin --password nueva-clave-segura
```

La contraseña debe tener al menos ocho caracteres y el usuario no puede contener espacios.

## Estructura principal

```text
backend/
├── db/schema.sql
├── scripts/resetAdminPassword.js
├── src/
│   ├── config/             # Entorno y conexión PostgreSQL
│   ├── database/           # Inicialización del esquema
│   ├── middlewares/        # Validación del token
│   ├── modules/            # Rutas, controladores, servicios y repositorios
│   ├── utils/              # Utilidades de contraseña
│   ├── app.js              # Configuración de Express
│   └── server.js           # Inicialización y escucha
├── index.js
└── package.json
```

## Problemas frecuentes

### El servidor inicia sin PostgreSQL

El proceso puede quedar escuchando aunque falle la inicialización. Revisa el mensaje de la terminal, las variables `DATABASE_URL` o `PG*`, y confirma que PostgreSQL acepte conexiones.

### Respuestas `401`

- Inicia sesión nuevamente.
- Comprueba el formato `Bearer <token>`.
- Recuerda que reiniciar el backend elimina las sesiones en memoria.

### Puerto ocupado

Cambia `PORT` en `backend/.env` y actualiza `VITE_API_URL` en el frontend para usar el mismo puerto.
