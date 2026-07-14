import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  obtenerProductos,
} from "../../services/api";

const productoVacio = {
  nombre: "",
  precio: "",
  imagen: "",
  descripcion: "",
  disponible: true,
  etiqueta: "",
};

export default function ProductosAdmin() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [formulario, setFormulario] = useState(productoVacio);
  const [productoEditando, setProductoEditando] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const usuario = useMemo(() => localStorage.getItem("adminUsuario") || "Administrador", []);

  async function cargarProductos() {
    setCargando(true);
    setError("");

    try {
      const data = await obtenerProductos();
      setProductos(data);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo cargar la lista de productos.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarProductos();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormulario((actual) => ({
      ...actual,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function editarProducto(producto) {
    setProductoEditando(producto.id);
    setFormulario({
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      descripcion: producto.descripcion,
      disponible: producto.disponible,
      etiqueta: producto.etiqueta || "",
    });
    setMensaje("");
    setError("");
  }

  function limpiarFormulario() {
    setProductoEditando(null);
    setFormulario(productoVacio);
  }

  async function guardarProducto(event) {
    event.preventDefault();
    setMensaje("");
    setError("");

    const payload = { ...formulario };

    try {
      if (productoEditando) {
        await actualizarProducto(productoEditando, payload);
        setMensaje("Producto actualizado correctamente.");
      } else {
        await crearProducto(payload);
        setMensaje("Producto registrado correctamente.");
      }

      limpiarFormulario();
      await cargarProductos();
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo guardar el producto.");
    }
  }

  async function borrarProducto(producto) {
    const confirmado = window.confirm(`¿Eliminar ${producto.nombre}?`);
    if (!confirmado) return;

    setMensaje("");
    setError("");

    try {
      await eliminarProducto(producto.id);
      setMensaje("Producto eliminado correctamente.");
      await cargarProductos();
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo eliminar el producto.");
    }
  }

  function cerrarSesion() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsuario");
    navigate("/login");
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h2>Gestión de Productos</h2>
          <p>Administrador: {usuario}</p>
        </div>
        <button className="admin-secondary" onClick={cerrarSesion}>Cerrar sesión</button>
      </header>

      <section className="admin-layout">
        <form className="producto-form" onSubmit={guardarProducto}>
          <h3>{productoEditando ? "Modificar producto" : "Registrar producto"}</h3>

          <label>
            Nombre
            <input name="nombre" value={formulario.nombre} onChange={handleChange} required />
          </label>

          <label>
            Precio
            <input
              name="precio"
              type="number"
              min="0"
              step="0.01"
              value={formulario.precio}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Imagen
            <input name="imagen" value={formulario.imagen} onChange={handleChange} required />
          </label>

          <label>
            Descripción
            <textarea name="descripcion" value={formulario.descripcion} onChange={handleChange} required />
          </label>

          <label>
            Etiqueta
            <input name="etiqueta" value={formulario.etiqueta} onChange={handleChange} />
          </label>

          <label className="checkbox-row">
            <input
              name="disponible"
              type="checkbox"
              checked={formulario.disponible}
              onChange={handleChange}
            />
            Disponible para visualización pública
          </label>

          {mensaje && <p className="success-message">{mensaje}</p>}
          {error && <p className="error-message">{error}</p>}

          <div className="form-actions">
            <button className="admin-primary" type="submit">
              {productoEditando ? "Guardar cambios" : "Registrar"}
            </button>
            {productoEditando && (
              <button className="admin-secondary" type="button" onClick={limpiarFormulario}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <section className="productos-admin-list">
          <h3>Productos registrados</h3>
          {cargando && <p>Cargando productos...</p>}
          {!cargando && productos.length === 0 && <p>No hay productos registrados.</p>}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.id}>
                    <td>
                      <strong>{producto.nombre}</strong>
                      <span>{producto.descripcion}</span>
                    </td>
                    <td>${producto.precio.toFixed(2)}</td>
                    <td>{producto.disponible ? "Disponible" : "No disponible"}</td>
                    <td>
                      <button className="table-action" onClick={() => editarProducto(producto)}>Editar</button>
                      <button className="table-danger" onClick={() => borrarProducto(producto)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}


