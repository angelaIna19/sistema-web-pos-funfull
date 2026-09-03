# Frontend — Sistema POS Fun Full

Interfaz web del sistema de punto de venta de Licorería Fun Full. Incluye un catálogo público y un panel administrativo para productos, categorías, ventas, caja, inventario, reportes y gestión de la cuenta administradora.

## Tecnologías

- React 19
- React Router 7
- Vite 8
- Axios
- Bootstrap 5
- ESLint 10

## Requisitos

- Node.js 20 o superior (se recomienda Node.js 22)
- npm
- Backend del proyecto ejecutándose, por defecto en `http://localhost:3001`

## Instalación

Desde la carpeta `frontend`:

```bash
npm install
```

## Configuración

La aplicación usa esta variable de entorno opcional:

```env
VITE_API_URL=/api
```

Puede guardarse en `frontend/.env`. Si no está definida, se utiliza automáticamente `/api`, que permite que Nginx publique frontend y API bajo el mismo origen. Para desarrollo sin proxy puedes establecer `http://localhost:3001/api`.

## Ejecución

```bash
npm run dev       # servidor de desarrollo
npm run build     # build de producción en frontend/dist
npm run preview   # previsualizar el build
npm run lint      # ejecutar ESLint
```

Vite mostrará la dirección local del servidor de desarrollo, normalmente `http://localhost:5173`.

## Secciones de la aplicación

### Sitio público

- `/`: página de inicio.
- `/catalogo`: catálogo de productos.
- `/producto/:id`: detalle de un producto.
- `/login`: acceso administrativo.

### Panel administrativo

Las rutas `/admin/*` requieren un token guardado en `localStorage` después de iniciar sesión.

- `/admin/cuenta`: datos y credenciales del administrador.
- `/admin/productos`: gestión de productos.
- `/admin/categorias`: gestión de categorías.
- `/admin/ventas/nueva`: registro de ventas.
- `/admin/ventas/historial`: historial, detalle y anulación de ventas.
- `/admin/caja`: apertura, estado y cierre de caja.
- `/admin/caja/historial`: historial de cajas.
- `/admin/inventario/*`: resumen, movimientos, detalle y stock bajo.
- `/admin/reportes/*`: ventas, ventas por caja, órdenes, productos más vendidos y stock bajo.

## Estructura principal

```text
frontend/
├── public/                 # Recursos públicos
├── src/
│   ├── assets/             # Imágenes del sitio
│   ├── components/         # Componentes compartidos
│   ├── pages/Admin/        # Pantallas administrativas
│   ├── pages/Publico/      # Pantallas públicas
│   ├── services/api.js     # Cliente y funciones de la API
│   ├── App.jsx             # Rutas de la aplicación
│   └── main.jsx            # Punto de entrada
├── eslint.config.js
├── package.json
└── vite.config.js
```

## Autenticación

El inicio de sesión guarda `adminToken` y `adminUsuario` en `localStorage`. Las solicitudes administrativas envían:

```http
Authorization: Bearer <token>
```

Si se elimina el token, las rutas protegidas redirigen a `/login`. Las sesiones residen en memoria en el backend; reiniciarlo invalida los tokens existentes.

## Problemas frecuentes

### No se puede conectar con la API

- Comprueba que el backend esté ejecutándose.
- Revisa `VITE_API_URL`.
- La URL debe incluir el prefijo `/api`.

### Verificación antes de entregar cambios

```bash
npm run lint
npm run build
```
