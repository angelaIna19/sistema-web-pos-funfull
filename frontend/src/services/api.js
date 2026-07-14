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
