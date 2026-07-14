import { useEffect, useState } from "react";
import CardProducto from "../../components/CardProducto";
import { obtenerProductos } from "../../services/api";

export default function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerProductos()
      .then(setProductos)
      .catch((err) => setError(err.response?.data?.mensaje || "No se pudo cargar el catálogo."))
      .finally(() => setCargando(false));
  }, []);

  return (
    <main className="catalogo-page">
      <header className="catalogo-header">
        <h2>Selección de Productos</h2>
        <div className="catalogo-subtitle">
          <p>Conoce nuestra variedad disponible en Licorería Fun Full</p>
          <span>Catálogo informativo</span>
        </div>
      </header>

      {cargando && <p>Cargando productos...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="catalog-grid">
        {productos.map((producto) => (
          <CardProducto key={producto.id} producto={producto} />
        ))}
      </div>
    </main>
  );
}
