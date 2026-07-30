import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

export function getAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function obtenerProductos() {
  const respuesta = await axios.get(`${API_URL}/productos`);
  return respuesta.data;
}

export async function obtenerProductoPorId(id) {
  const respuesta = await axios.get(`${API_URL}/productos/${id}`);
  return respuesta.data;
}

export async function iniciarSesion(usuario, password) {
  const respuesta = await axios.post(`${API_URL}/auth/login`, { usuario, password });
  return respuesta.data;
}

export async function crearProducto(producto) {
  const respuesta = await axios.post(`${API_URL}/admin/productos`, producto, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function actualizarProducto(id, producto) {
  const respuesta = await axios.put(`${API_URL}/admin/productos/${id}`, producto, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function eliminarProducto(id) {
  const respuesta = await axios.delete(`${API_URL}/admin/productos/${id}`, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function obtenerCategorias() {
  const respuesta = await axios.get(`${API_URL}/categorias`);
  return respuesta.data;
}

export async function crearCategoria(categoria) {
  const respuesta = await axios.post(`${API_URL}/admin/categorias`, categoria, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function actualizarCategoria(id, categoria) {
  const respuesta = await axios.put(`${API_URL}/admin/categorias/${id}`, categoria, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function eliminarCategoria(id) {
  const respuesta = await axios.delete(`${API_URL}/admin/categorias/${id}`, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function obtenerCajas() {
  const respuesta = await axios.get(`${API_URL}/admin/cajas`, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function obtenerCajaActual() {
  const respuesta = await axios.get(`${API_URL}/admin/caja/actual`, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function abrirCaja(datos) {
  const respuesta = await axios.post(`${API_URL}/admin/caja/abrir`, datos, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function cerrarCaja(datos = {}) {
  const respuesta = await axios.post(`${API_URL}/admin/caja/cerrar`, datos, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function registrarMovimientoCaja(datos) {
  const respuesta = await axios.post(`${API_URL}/admin/caja/movimientos`, datos, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function registrarVenta(venta) {
  const respuesta = await axios.post(`${API_URL}/admin/ventas`, venta, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}
export async function obtenerVentas() {
  const respuesta = await axios.get(`${API_URL}/admin/ventas`, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function obtenerDetalleVenta(id) {
  const respuesta = await axios.get(`${API_URL}/admin/ventas/${id}`, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function anularVenta(id, datos) {
  const respuesta = await axios.post(`${API_URL}/admin/ventas/${id}/anular`, datos, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}
export async function obtenerResumenInventario() {
  const respuesta = await axios.get(`${API_URL}/admin/inventario/resumen`, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function obtenerMovimientosInventario() {
  const respuesta = await axios.get(`${API_URL}/admin/inventario/movimientos`, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function obtenerStockBajo() {
  const respuesta = await axios.get(`${API_URL}/admin/inventario/stock-bajo`, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function obtenerDetalleProductoInventario(id) {
  const respuesta = await axios.get(`${API_URL}/admin/inventario/productos/${id}/detalle`, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function registrarEntradaInventario(datos) {
  const respuesta = await axios.post(`${API_URL}/admin/inventario/entradas`, datos, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function registrarSalidaInventario(datos) {
  const respuesta = await axios.post(`${API_URL}/admin/inventario/salidas`, datos, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function registrarAjusteInventario(datos) {
  const respuesta = await axios.post(`${API_URL}/admin/inventario/ajustes`, datos, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}
export async function obtenerReporteVentas() {
  const respuesta = await axios.get(`${API_URL}/admin/reportes/ventas`, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}


export async function obtenerReporteOrdenes(periodo = "mes") {
  const respuesta = await axios.get(`${API_URL}/admin/reportes/ordenes`, {
    headers: getAuthHeaders(),
    params: { periodo },
  });
  return respuesta.data;
}
export async function obtenerProductosMasVendidos() {
  const respuesta = await axios.get(`${API_URL}/admin/reportes/productos-mas-vendidos`, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

export async function obtenerReporteStockBajo() {
  const respuesta = await axios.get(`${API_URL}/admin/reportes/stock-bajo`, {
    headers: getAuthHeaders(),
  });
  return respuesta.data;
}

