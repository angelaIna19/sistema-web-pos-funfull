import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import RowActionsMenu from "../../components/Admin/RowActionsMenu";
import {
  actualizarCategoria,
  crearCategoria,
  eliminarCategoria,
  obtenerCategorias,
} from "../../services/api";

const categoriaVacia = {
  nombre: "",
  descripcion: "",
  estado: true,
};

export default function CategoriasAdmin() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [formulario, setFormulario] = useState(categoriaVacia);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [menuCategoriaId, setMenuCategoriaId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const usuario = useMemo(() => localStorage.getItem("adminUsuario") || "Administrador", []);
  const categoriasFiltradas = useMemo(() => {
    const termino = terminoBusqueda.trim().toLowerCase();
    if (!termino) return categorias;

    return categorias.filter((categoria) => [
      categoria.nombre,
      categoria.descripcion,
    ].some((valor) => String(valor || "").toLowerCase().includes(termino)));
  }, [categorias, terminoBusqueda]);
  async function cargarCategorias() {
    setCargando(true);
    setError("");

    try {
      const data = await obtenerCategorias();
      setCategorias(data);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo cargar la lista de categorias.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarCategorias();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormulario((actual) => ({
      ...actual,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function abrirNuevaCategoria() {
    setCategoriaEditando(null);
    setFormulario(categoriaVacia);
    setMensaje("");
    setError("");
    setMostrarFormulario(true);
  }

  function cambiarBusqueda(valor) {
    setTerminoBusqueda(valor);
    setMenuCategoriaId(null);
  }

  function editarCategoria(categoria) {
    setCategoriaEditando(categoria.id);
    setFormulario({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
      estado: categoria.estado,
    });
    setMensaje("");
    setError("");
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setCategoriaEditando(null);
    setFormulario(categoriaVacia);
    setMostrarFormulario(false);
  }

  async function guardarCategoria(event) {
    event.preventDefault();
    setMensaje("");
    setError("");

    try {
      if (categoriaEditando) {
        await actualizarCategoria(categoriaEditando, formulario);
        setMensaje("Categoria actualizada correctamente.");
      } else {
        await crearCategoria(formulario);
        setMensaje("Categoria registrada correctamente.");
      }

      cerrarFormulario();
      await cargarCategorias();
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo guardar la categoria.");
    }
  }

  async function borrarCategoria(categoria) {
    if (categoria.productos > 0) {
      setError("No se puede eliminar la categoria porque tiene productos asociados. Primero deben reasignarse o eliminarse esos productos.");
      return;
    }

    const confirmado = window.confirm(`Eliminar ${categoria.nombre}?`);
    if (!confirmado) return;

    setMensaje("");
    setError("");

    try {
      await eliminarCategoria(categoria.id);
      setMensaje("Categoria eliminada correctamente.");
      await cargarCategorias();
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo eliminar la categoria.");
    }
  }

  function cerrarSesion() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsuario");
    navigate("/login");
  }

  return (
    <>
      <AdminNavbar
        usuario={usuario}
        onNewProduct={abrirNuevaCategoria}
        showEditDelete={false}
        terminoBusqueda={terminoBusqueda}
        onSearchChange={cambiarBusqueda}
        totalProductos={categoriasFiltradas.length}
        sectionTitle="Categorias"
        searchFilter="Categorias"
        showViewToggle={false}
      />
      <main className="admin-page compact-products-page">
        <header className="admin-header">
          <div>
            <h2>Gestion de Categorias</h2>
          </div>
        </header>

        {mensaje && <p className="success-message admin-feedback">{mensaje}</p>}
        {!mostrarFormulario && error && <p className="error-message admin-feedback">{error}</p>}

        <section className="productos-admin-list products-only-list">
          <h3>Categorias registradas</h3>
          {cargando && <p>Cargando categorias...</p>}
          {!cargando && categorias.length === 0 && <p>No hay categorias registradas.</p>}
          {!cargando && categorias.length > 0 && categoriasFiltradas.length === 0 && <p>No se encontraron categorias</p>}
          {!cargando && categoriasFiltradas.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table products-table" onClick={(event) => event.stopPropagation()}>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Descripcion</th>
                    <th>Productos</th>
                    <th>Estado</th>
                    <th className="row-actions-heading" aria-label="Opciones"></th>
                  </tr>
                </thead>
                <tbody>
                  {categoriasFiltradas.map((categoria) => (
                    <tr key={categoria.id}>
                      <td><strong>{categoria.nombre}</strong></td>
                      <td>{categoria.descripcion || "Sin descripcion"}</td>
                      <td>{categoria.productos}</td>
                      <td>{categoria.estado ? "Activo" : "Inactivo"}</td>
                      <td className="row-actions-cell">
                        <RowActionsMenu
                          itemId={`categoria-${categoria.id}`}
                          ariaLabel="Opciones de la categoría"
                          isOpen={menuCategoriaId === categoria.id}
                          onOpenChange={(itemId) => setMenuCategoriaId(itemId ? categoria.id : null)}
                          onEdit={() => editarCategoria(categoria)}
                          onDelete={() => borrarCategoria(categoria)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {mostrarFormulario && (
        <div className="product-modal-backdrop" role="presentation">
          <section className="product-modal category-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
            <header className="product-modal-header">
              <h3 id="category-modal-title">{categoriaEditando ? "Modificar categoria" : "Registrar categoria"}</h3>
              <button type="button" aria-label="Cerrar" onClick={cerrarFormulario}>x</button>
            </header>

            <form className="producto-form compact-product-form category-form" onSubmit={guardarCategoria}>
              <label className="full-field">
                Nombre de la categoria
                <input name="nombre" value={formulario.nombre} onChange={handleChange} required autoFocus />
              </label>

              <label className="full-field">
                Descripcion
                <textarea name="descripcion" value={formulario.descripcion} onChange={handleChange} />
              </label>

              <label className="checkbox-row full-field">
                <input name="estado" type="checkbox" checked={formulario.estado} onChange={handleChange} />
                Categoria activa
              </label>

              {error && <p className="error-message full-field">{error}</p>}

              <div className="form-actions full-field">
                <button className="admin-primary" type="submit">
                  {categoriaEditando ? "Guardar cambios" : "Registrar"}
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
