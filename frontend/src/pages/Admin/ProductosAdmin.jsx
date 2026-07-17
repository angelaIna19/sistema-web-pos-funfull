import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  obtenerProductos,
} from "../../services/api";

const productoVacio = {
  codigo: "",
  nombre: "",
  categoria: "",
  marca: "",
  precioCompra: "",
  precioVenta: "",
  stock: "",
  stockMinimo: "",
  imagen: "",
  estado: true,
};

function leerImagenComoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

export default function ProductosAdmin() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [formulario, setFormulario] = useState(productoVacio);
  const [productoEditando, setProductoEditando] = useState(null);
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [vistaProductos, setVistaProductos] = useState("tabla");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const usuario = useMemo(() => localStorage.getItem("adminUsuario") || "Administrador", []);
  const productosFiltrados = useMemo(() => {
    const termino = terminoBusqueda.trim().toLowerCase();
    if (!termino) return productos;

    return productos.filter((producto) => [
      producto.codigo,
      producto.nombre,
      producto.categoria,
      producto.marca,
    ].some((valor) => String(valor || "").toLowerCase().includes(termino)));
  }, [productos, terminoBusqueda]);
  const productoSeleccionado = useMemo(
    () => productos.find((producto) => producto.id === productoSeleccionadoId) || null,
    [productos, productoSeleccionadoId]
  );

  async function cargarProductos() {
    setCargando(true);
    setError("");

    try {
      const data = await obtenerProductos();
      setProductos(data);
      setProductoSeleccionadoId((actual) => (data.some((producto) => producto.id === actual) ? actual : null));
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

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen valido.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no debe superar 2 MB.");
      return;
    }

    try {
      const imagen = await leerImagenComoDataUrl(file);
      setFormulario((actual) => ({ ...actual, imagen }));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  function abrirNuevoProducto() {
    setProductoEditando(null);
    setFormulario(productoVacio);
    setMensaje("");
    setError("");
    setMostrarFormulario(true);
  }

  function seleccionarProducto(producto) {
    setProductoSeleccionadoId((actual) => (actual === producto.id ? null : producto.id));
    setMensaje("");
    setError("");
  }

  function limpiarSeleccion() {
    setProductoSeleccionadoId(null);
  }

  function cambiarBusqueda(valor) {
    setTerminoBusqueda(valor);
    setProductoSeleccionadoId(null);
  }

  function editarProductoSeleccionado() {
    if (productoSeleccionado) editarProducto(productoSeleccionado);
  }

  function borrarProductoSeleccionado() {
    if (productoSeleccionado) borrarProducto(productoSeleccionado);
  }

  function editarProducto(producto) {
    setProductoEditando(producto.id);
    setFormulario({
      codigo: producto.codigo,
      nombre: producto.nombre,
      categoria: producto.categoria,
      marca: producto.marca,
      precioCompra: producto.precioCompra,
      precioVenta: producto.precioVenta,
      stock: producto.stock,
      stockMinimo: producto.stockMinimo,
      imagen: producto.imagen,
      estado: producto.estado,
    });
    setMensaje("");
    setError("");
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setProductoEditando(null);
    setFormulario(productoVacio);
    setMostrarFormulario(false);
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

      setProductoSeleccionadoId(null);
      cerrarFormulario();
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
    const confirmado = window.confirm(`Eliminar ${producto.nombre}?`);
    if (!confirmado) return;

    setMensaje("");
    setError("");

    try {
      await eliminarProducto(producto.id);
      setProductoSeleccionadoId(null);
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

  function renderTabla() {
    return (
      <div className="admin-table-wrap">
        <table className="admin-table products-table" onClick={(event) => event.stopPropagation()}>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Categoria</th>
              <th>Marca</th>
              <th>Compra</th>
              <th>Venta</th>
              <th>Stock</th>
              <th>Minimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((producto) => (
              <tr
                key={producto.id}
                className={productoSeleccionadoId === producto.id ? "selected-row" : ""}
                onClick={() => seleccionarProducto(producto)}
              >
                <td>{producto.codigo}</td>
                <td><strong>{producto.nombre}</strong></td>
                <td>{producto.categoria}</td>
                <td>{producto.marca}</td>
                <td>${producto.precioCompra.toFixed(2)}</td>
                <td>${producto.precioVenta.toFixed(2)}</td>
                <td>{producto.stock}</td>
                <td>{producto.stockMinimo}</td>
                <td>{producto.estado ? "Activo" : "Inactivo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderKanban() {
    return (
      <div className="products-kanban-grid" onClick={(event) => event.stopPropagation()}>
        {productosFiltrados.map((producto) => (
          <article
            className={productoSeleccionadoId === producto.id ? "product-kanban-card selected-card" : "product-kanban-card"}
            key={producto.id}
            onClick={() => seleccionarProducto(producto)}
          >
            <div className="product-kanban-info">
              <h4>{producto.nombre}</h4>
              <p>
                <strong>${producto.precioVenta.toFixed(2)}</strong>
                <span>{producto.categoria}</span>
              </p>
              <small>{producto.codigo} - {producto.marca}</small>
              <small>Stock: {producto.stock} - Minimo: {producto.stockMinimo}</small>
              <span className={producto.estado ? "kanban-status active" : "kanban-status inactive"}>
                {producto.estado ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="product-kanban-media">
              <img src={producto.imagen} alt={producto.nombre} />
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <>
      <AdminNavbar
        usuario={usuario}
        onNewProduct={abrirNuevoProducto}
        onEditProduct={editarProductoSeleccionado}
        onDeleteProduct={borrarProductoSeleccionado}
        productoSeleccionado={Boolean(productoSeleccionado)}
        vistaProductos={vistaProductos}
        onChangeVista={setVistaProductos}
        terminoBusqueda={terminoBusqueda}
        onSearchChange={cambiarBusqueda}
        totalProductos={productosFiltrados.length}
      />
      <main className={`admin-page compact-products-page ${vistaProductos === "kanban" ? "kanban-products-page" : ""}`}>
        <header className="admin-header">
          <div>
            <h2>Gestion de Productos</h2>
            <p>Administrador: {usuario}</p>
          </div>
        </header>

        {mensaje && <p className="success-message admin-feedback">{mensaje}</p>}
        {!mostrarFormulario && error && <p className="error-message admin-feedback">{error}</p>}

        <section
          className={vistaProductos === "kanban" ? "products-kanban-panel" : "productos-admin-list products-only-list"}
          onClick={limpiarSeleccion}
        >
          <h3>Productos registrados</h3>
          {cargando && <p>Cargando productos...</p>}
          {!cargando && productos.length === 0 && <p>No hay productos registrados.</p>}
          {!cargando && productos.length > 0 && productosFiltrados.length === 0 && <p>No se encontraron productos</p>}
          {!cargando && productosFiltrados.length > 0 && vistaProductos === "tabla" && renderTabla()}
          {!cargando && productosFiltrados.length > 0 && vistaProductos === "kanban" && renderKanban()}
        </section>
      </main>

      {mostrarFormulario && (
        <div className="product-modal-backdrop" role="presentation">
          <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
            <header className="product-modal-header">
              <h3 id="product-modal-title">{productoEditando ? "Modificar producto" : "Registrar producto"}</h3>
              <button type="button" aria-label="Cerrar" onClick={cerrarFormulario}>x</button>
            </header>

            <form className="producto-form compact-product-form" onSubmit={guardarProducto}>
              <label>
                Codigo
                <input name="codigo" value={formulario.codigo} onChange={handleChange} required autoFocus />
              </label>

              <label>
                Nombre
                <input name="nombre" value={formulario.nombre} onChange={handleChange} required />
              </label>

              <label>
                Categoria
                <input name="categoria" value={formulario.categoria} onChange={handleChange} required />
              </label>

              <label>
                Marca
                <input name="marca" value={formulario.marca} onChange={handleChange} required />
              </label>

              <label>
                Precio de compra
                <input name="precioCompra" type="number" min="0" step="0.01" value={formulario.precioCompra} onChange={handleChange} required />
              </label>

              <label>
                Precio de venta
                <input name="precioVenta" type="number" min="0" step="0.01" value={formulario.precioVenta} onChange={handleChange} required />
              </label>

              <label>
                Stock
                <input name="stock" type="number" min="0" step="1" value={formulario.stock} onChange={handleChange} required />
              </label>

              <label>
                Stock minimo
                <input name="stockMinimo" type="number" min="0" step="1" value={formulario.stockMinimo} onChange={handleChange} required />
              </label>

              <label className="full-field">
                Imagen
                <input type="file" accept="image/*" onChange={handleImageChange} required={!formulario.imagen} />
              </label>

              {formulario.imagen && (
                <div className="product-image-preview full-field">
                  <img src={formulario.imagen} alt="Vista previa del producto" />
                  <span>Imagen seleccionada</span>
                </div>
              )}

              <label className="checkbox-row full-field">
                <input name="estado" type="checkbox" checked={formulario.estado} onChange={handleChange} />
                Producto activo para visualizacion publica
              </label>

              {error && <p className="error-message full-field">{error}</p>}

              <div className="form-actions full-field">
                <button className="admin-primary" type="submit">
                  {productoEditando ? "Guardar cambios" : "Registrar"}
                </button>
                <button className="admin-secondary" type="button" onClick={cerrarFormulario}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}