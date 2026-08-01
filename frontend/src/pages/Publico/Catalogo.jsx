import { useEffect, useState } from "react";
import CardProducto from "../../components/CardProducto";
import fondoLicoreria from "../../assets/fondo-licoreria.png";
import { obtenerProductos } from "../../services/api";

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerProductos()
      .then(setProductos)
      .catch((err) => setError(err.response?.data?.mensaje || "No se pudo cargar el catálogo."))
      .finally(() => setCargando(false));
  }, []);

  const normalizarTexto = (valor = "") =>
    valor
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const busquedaNormalizada = normalizarTexto(terminoBusqueda);
  const productosFiltrados = productos.filter((producto) => {
    if (!busquedaNormalizada) return true;

    return [producto.codigo, producto.nombre, producto.categoria, producto.marca].some((campo) =>
      normalizarTexto(campo).includes(busquedaNormalizada),
    );
  });

  const productosPorCategoria = productosFiltrados.reduce((grupos, producto) => {
    const categoria = producto.categoria || "Sin categoría";
    if (!grupos[categoria]) grupos[categoria] = [];
    grupos[categoria].push(producto);
    return grupos;
  }, {});

  const categorias = Object.keys(productosPorCategoria).sort((a, b) => a.localeCompare(b, "es"));

  return (
    <main className="catalogo-page">
      <header
        className="catalogo-header catalogo-header-con-fondo"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(4, 4, 5, 0.9), rgba(4, 4, 5, 0.64)), url(${fondoLicoreria})` }}
      >
        <h2>Selección de Productos</h2>
        <div className="catalogo-subtitle">
          <p>Conoce nuestra variedad disponible en Licorería Fun Full</p>
          <span>Catálogo informativo</span>
        </div>

        <div className="catalogo-buscador" role="search">
          <label htmlFor="busqueda-catalogo">Buscar</label>
          <input
            id="busqueda-catalogo"
            type="search"
            value={terminoBusqueda}
            onChange={(evento) => setTerminoBusqueda(evento.target.value)}
            placeholder="Nombre, categoría, marca o código..."
          />
          {terminoBusqueda.trim() && (
            <button type="button" onClick={() => setTerminoBusqueda("")}>
              Limpiar
            </button>
          )}
        </div>
      </header>

      {cargando && <p>Cargando productos...</p>}
      {error && <p className="error-message">{error}</p>}
      {!cargando && !error && productos.length > 0 && productosFiltrados.length === 0 && (
        <p className="catalogo-vacio">No se encontraron productos.</p>
      )}

      <div className="catalogo-categorias">
        {categorias.map((categoria) => (
          <section className="catalogo-categoria" key={categoria}>
            <header className="categoria-publica-header">
              <h3>{categoria}</h3>
              <span>{productosPorCategoria[categoria].length} productos</span>
            </header>
            <div className="catalog-grid">
              {productosPorCategoria[categoria].map((producto) => (
                <CardProducto key={producto.id} producto={producto} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
