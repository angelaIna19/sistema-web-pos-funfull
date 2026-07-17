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