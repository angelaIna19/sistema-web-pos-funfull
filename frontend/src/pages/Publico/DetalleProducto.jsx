import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { obtenerProductoPorId } from "../../services/api";

export default function DetalleProducto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerProductoPorId(id)
      .then(setProducto)
      .catch((err) => setError(err.response?.data?.mensaje || "Producto no encontrado."))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <main>
        <p>Cargando detalle del producto...</p>
      </main>
    );
  }

  if (error || !producto) {
    return (
      <main style={{ padding: 20 }}>
        <p className="error-message">{error || "Producto no encontrado."}</p>
        <button onClick={() => navigate(-1)}>Volver</button>
      </main>
    );
  }

  const precioVenta = Number(producto.precioVenta || 0);

  return (
    <main className="detalle-producto">
      <div className="detalle-imagen">
        <img src={producto.imagen} alt={producto.nombre} />
      </div>
      <div className="detalle-info">
        <h2>{producto.nombre}</h2>
        <p style={{ fontWeight: 700 }}>${precioVenta.toFixed(2)}</p>
        <p><strong>Código:</strong> {producto.codigo}</p>
        <p><strong>Categoría:</strong> {producto.categoria}</p>
        <p><strong>Marca:</strong> {producto.marca}</p>
        <p><strong>Stock disponible:</strong> {producto.stock}</p>
        <p style={{ color: producto.estado ? "green" : "red" }}>
          {producto.estado ? "Disponible" : "No disponible"}
        </p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 12 }}>
          Volver al catálogo
        </button>
      </div>
    </main>
  );
}
