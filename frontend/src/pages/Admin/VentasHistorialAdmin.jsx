import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import { obtenerDetalleVenta, obtenerVentas } from "../../services/api";

export default function VentasHistorialAdmin() {
  const navigate = useNavigate();
  const usuario = useMemo(() => localStorage.getItem("adminUsuario") || "admin", []);
  const [ventas, setVentas] = useState([]);
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [error, setError] = useState("");

  const ventasFiltradas = useMemo(() => {
    const termino = terminoBusqueda.trim().toLowerCase();
    if (!termino) return ventas;

    return ventas.filter((venta) => [
      venta.id,
      venta.trabajador,
      venta.usuario,
      venta.metodoPago,
      formatDateTime(venta.creadaEn),
      venta.total,
    ].some((valor) => String(valor || "").toLowerCase().includes(termino)));
  }, [ventas, terminoBusqueda]);

  useEffect(() => {
    cargarVentas();
  }, []);

  async function cargarVentas() {
    setCargando(true);
    setError("");

    try {
      const data = await obtenerVentas();
      setVentas(data);
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo cargar el historial de ventas.");
    } finally {
      setCargando(false);
    }
  }

  async function abrirDetalle(venta) {
    setCargandoDetalle(true);
    setError("");

    try {
      const data = await obtenerDetalleVenta(venta.id);
      setVentaDetalle(data);
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo cargar el detalle de la venta.");
    } finally {
      setCargandoDetalle(false);
    }
  }

  function cerrarSesion() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsuario");
    navigate("/login");
  }

  return (
    <>
      <AdminNavbar usuario={usuario} showToolbar={false} />
      <main className="admin-page compact-products-page ventas-history-page">
        <header className="admin-header">
          <div>
            <h2>Historial de ventas</h2>
            <p>Administrador: {usuario}</p>
          </div>
        </header>

        {error && <p className="error-message admin-feedback">{error}</p>}

        <section className="productos-admin-list products-only-list ventas-history-panel">
          <div className="history-panel-header">
            <h3>Ventas registradas</h3>
            <label className="history-search">
              <span>Buscar</span>
              <input
                value={terminoBusqueda}
                onChange={(event) => setTerminoBusqueda(event.target.value)}
                placeholder="Fecha, trabajador, método o total..."
              />
            </label>
          </div>

          {cargando && <p>Cargando ventas...</p>}
          {!cargando && ventas.length === 0 && <p>No hay ventas registradas.</p>}
          {!cargando && ventas.length > 0 && ventasFiltradas.length === 0 && <p>No se encontraron ventas.</p>}

          {!cargando && ventasFiltradas.length > 0 && (
            <div className="admin-table-wrap">
              <table className="admin-table products-table sales-history-table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Fecha</th>
                    <th>Trabajador</th>
                    <th>Método</th>
                    <th>Subtotal</th>
                    <th>Impuesto</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.map((venta) => (
                    <tr key={venta.id} onClick={() => abrirDetalle(venta)} className="clickable-row">
                      <td><strong>#{venta.id}</strong></td>
                      <td>{formatDateTime(venta.creadaEn)}</td>
                      <td>{venta.trabajador || "-"}</td>
                      <td>{formatMetodo(venta.metodoPago)}</td>
                      <td>${Number(venta.subtotal || 0).toFixed(2)}</td>
                      <td>${Number(venta.impuesto || 0).toFixed(2)}</td>
                      <td><strong>${Number(venta.total || 0).toFixed(2)}</strong></td>
                      <td>Registrada</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {(ventaDetalle || cargandoDetalle) && (
        <div className="product-modal-backdrop" role="presentation">
          <section className="product-modal sale-detail-modal" role="dialog" aria-modal="true" aria-labelledby="sale-detail-title">
            <header className="product-modal-header">
              <h3 id="sale-detail-title">Detalle de venta</h3>
              <button type="button" aria-label="Cerrar" onClick={() => setVentaDetalle(null)}>x</button>
            </header>

            {cargandoDetalle && <p>Cargando detalle...</p>}
            {!cargandoDetalle && ventaDetalle && (
              <div className="sale-detail-content">
                <div className="sale-detail-summary">
                  <div><span>Venta</span><strong>#{ventaDetalle.id}</strong></div>
                  <div><span>Fecha</span><strong>{formatDateTime(ventaDetalle.creadaEn)}</strong></div>
                  <div><span>Trabajador</span><strong>{ventaDetalle.trabajador || "-"}</strong></div>
                  <div><span>Método</span><strong>{formatMetodo(ventaDetalle.metodoPago)}</strong></div>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table sale-detail-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventaDetalle.detalles.map((detalle) => (
                        <tr key={detalle.id}>
                          <td>{detalle.codigo}</td>
                          <td><strong>{detalle.nombre}</strong></td>
                          <td>{detalle.cantidad}</td>
                          <td>${Number(detalle.precioUnitario || 0).toFixed(2)}</td>
                          <td>${Number(detalle.subtotal || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <dl className="sale-detail-totals">
                  <div><dt>Subtotal</dt><dd>${Number(ventaDetalle.subtotal || 0).toFixed(2)}</dd></div>
                  <div><dt>Impuesto</dt><dd>${Number(ventaDetalle.impuesto || 0).toFixed(2)}</dd></div>
                  <div><dt>Total</dt><dd>${Number(ventaDetalle.total || 0).toFixed(2)}</dd></div>
                  <div><dt>Monto recibido</dt><dd>${Number(ventaDetalle.montoRecibido || 0).toFixed(2)}</dd></div>
                  <div><dt>Cambio</dt><dd>${Number(ventaDetalle.cambio || 0).toFixed(2)}</dd></div>
                </dl>

                {ventaDetalle.observacion && (
                  <p className="sale-detail-note"><strong>Observación:</strong> {ventaDetalle.observacion}</p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMetodo(value) {
  if (value === "EFECTIVO") return "Efectivo";
  if (value === "TRANSFERENCIA") return "Transferencia";
  return value || "-";
}
