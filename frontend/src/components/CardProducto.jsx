import { Link } from "react-router-dom";

export default function CardProducto({ producto }) {
  const precioVenta = Number(producto.precioVenta || 0);

  return (
    <article className="producto-vitrina">
      <div className="producto-imagen-wrap">
        {producto.categoria && <span className="producto-etiqueta">{producto.categoria}</span>}
        <img src={producto.imagen} alt={producto.nombre} />
      </div>

      <div className="producto-info">
        <h3>{producto.nombre}</h3>
        <p className="producto-marca">{producto.marca}</p>
        <p className="producto-precio">${precioVenta.toFixed(2)}</p>
        <p className={producto.estado ? "estado disponible" : "estado no-disponible"}>
          <span aria-hidden="true" />
          {producto.estado ? "Disponible" : "No disponible"}
        </p>
      </div>

      <Link className="detalle-link" to={`/producto/${producto.id}`}>
        Ver detalle
      </Link>
    </article>
  );
}
