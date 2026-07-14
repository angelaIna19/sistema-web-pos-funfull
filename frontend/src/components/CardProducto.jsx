import { Link } from "react-router-dom";

// Componente de tarjeta individual para cada producto del catálogo.
export default function CardProducto({ producto }) {
  return (
    <article className="producto-vitrina">
      <div className="producto-imagen-wrap">
        {/* Etiqueta opcional como "Destacado" */}
        {producto.etiqueta && <span className="producto-etiqueta">{producto.etiqueta}</span>}
        <img src={producto.imagen} alt={producto.nombre} />
      </div>

      <div className="producto-info">
        <h3>{producto.nombre}</h3>
        <p className="producto-precio">${producto.precio.toFixed(2)}</p>
        <p className={producto.disponible ? "estado disponible" : "estado no-disponible"}>
          <span aria-hidden="true" />
          {producto.disponible ? "Disponible" : "No disponible"}
        </p>
      </div>

      {/* Link hacia la página de detalle de este producto */}
      <Link className="detalle-link" to={`/producto/${producto.id}`}>
        Ver detalle
      </Link>
    </article>
  );
}
