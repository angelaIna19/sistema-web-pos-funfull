# Sistema Web POS Fun Full

Sistema de punto de venta con frontend React/Vite, API Node/Express y PostgreSQL.

- [Documentación del backend](backend/README.md)
- [Documentación del frontend](frontend/README.md)
- [Despliegue con Docker Compose en DigitalOcean](DEPLOYMENT.md)

## Desarrollo local

Ejecuta `npm install` y `npm run dev` por separado en `backend` y `frontend`. El frontend puede usar `VITE_API_URL=http://localhost:3001/api` cuando el servidor de desarrollo de Vite no tenga un proxy configurado.

## Despliegue

La configuración de producción se encuentra en `compose.yaml`. Copia `.env.example` fuera del repositorio, sustituye todos los secretos de ejemplo y sigue `DEPLOYMENT.md`.
