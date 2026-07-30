import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import { anularVenta, obtenerDetalleVenta, obtenerVentas } from "../../services/api";

export default function VentasHistorialAdmin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const usuario = useMemo(() => localStorage.getItem("adminUsuario") || "admin", []);
  const modoPantalla = searchParams.get("modo") || "historial";
  const esModoAnular = modoPantalla === "anular";
  const tituloPantalla = modoPantalla === "detalle" ? "Detalle de ventas" : modoPantalla === "anular" ? "Anular venta" : "Historial de ventas";
  const [ventas, setVentas] = useState([]);
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [ventaAnular, setVentaAnular] = useState(null);
  const [ventaSeleccionadaId, setVentaSeleccionadaId] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardandoAnulacion, setGuardandoAnulacion] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const ventaSeleccionada = useMemo(
    () => ventas.find((venta) => venta.id === ventaSeleccionadaId) || null,
    [ventas, ventaSeleccionadaId]
  );
  const puedeAnularSeleccionada = Boolean(esModoAnular && ventaSeleccionada && ventaSeleccionada.estado === "REGISTRADA");

  const ventasFiltradas = useMemo(() => {
    const termino = terminoBusqueda.trim().toLowerCase();
    if (!termino) return ventas;

    return ventas.filter((venta) => [
      venta.id,
      venta.trabajador,
      venta.usuario,
      venta.metodoPago,
      venta.estado,
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

  function seleccionarVenta(venta) {
    if (modoPantalla === "detalle") {
      abrirDetalle(venta);
      return;
    }

    if (!esModoAnular) return;

    setVentaSeleccionadaId((actual) => (actual === venta.id ? null : venta.id));
    setMensaje("");
    setError("");
  }

  async function abrirDetalle(venta) {
    setCargandoDetalle(true);
    setMensaje("");
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

  function abrirModalAnulacion(venta) {
    if (!venta || venta.estado === "ANULADA") return;
    setVentaAnular(venta);
    setMotivoAnulacion("");
    setMensaje("");
    setError("");
  }

  function cerrarModalAnulacion() {
    if (guardandoAnulacion) return;
    setVentaAnular(null);
    setMotivoAnulacion("");
  }

  async function confirmarAnulacion(event) {
    event.preventDefault();
    if (!ventaAnular || !motivoAnulacion.trim()) return;

    setGuardandoAnulacion(true);
    setMensaje("");
    setError("");

    try {
      const venta = await anularVenta(ventaAnular.id, { motivoAnulacion });
      setMensaje(venta.mensaje || "Venta anulada correctamente.");
      setVentaAnular(null);
      setMotivoAnulacion("");
      setVentaDetalle(null);
      await cargarVentas();
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo anular la venta.");
    } finally {
      setGuardandoAnulacion(false);
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
        showToolbar
        forceToolbar
        onDeleteProduct={() => {
          if (!puedeAnularSeleccionada) return;
          abrirModalAnulacion(ventaSeleccionada);
        }}
        productoSeleccionado={puedeAnularSeleccionada}
        showEditDelete={esModoAnular}
        showEditButton={false}
        showDeleteButton={esModoAnular}
        deleteButtonLabel="Anular venta"
        showNewButton={false}
        showViewToggle={false}
        showToolbarActions
        sectionTitle="Ventas"
        searchFilter={tituloPantalla}
        terminoBusqueda={terminoBusqueda}
        onSearchChange={setTerminoBusqueda}
        totalProductos={ventasFiltradas.length}
        showSearch
      />
      <main className="admin-page compact-products-page ventas-history-page">
        <header className="admin-header">
          <div>
            <h2>{tituloPantalla}</h2>
            <p>Administrador: {usuario}</p>
          </div>
        </header>

        {mensaje && <p className="success-message admin-feedback">{mensaje}</p>}
        {error && !ventaAnular && <p className="error-message admin-feedback">{error}</p>}

        <section className="productos-admin-list products-only-list ventas-history-panel">
          <h3>Ventas registradas</h3>

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
                    <tr key={venta.id} onClick={() => seleccionarVenta(venta)} className={getSaleRowClass(venta, esModoAnular ? ventaSeleccionadaId : null)}>
                      <td><strong>#{venta.id}</strong></td>
                      <td>{formatDateTime(venta.creadaEn)}</td>
                      <td>{venta.trabajador || "-"}</td>
                      <td>{formatMetodo(venta.metodoPago)}</td>
                      <td>{formatMoney(venta.subtotal)}</td>
                      <td>{formatMoney(venta.impuesto)}</td>
                      <td><strong>{formatMoney(venta.total)}</strong></td>
                      <td><span className={venta.estado === "ANULADA" ? "status-pill danger" : "status-pill"}>{formatEstado(venta.estado)}</span></td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {(ventaDetalle || cargandoDetalle) && renderDetalleVenta()}
      {ventaAnular && renderModalAnulacion()}
    </>
  );

  function renderDetalleVenta() {
    return (
      <div className="product-modal-backdrop" role="presentation">
        <section className="product-modal sale-detail-modal" role="dialog" aria-modal="true" aria-labelledby="sale-detail-title">
          <header className="product-modal-header">
            <h3 id="sale-detail-title">Detalle de venta</h3>
            <button type="button" aria-label="Cerrar" onClick={() => setVentaDetalle(null)}>x</button>
          </header>

          {cargandoDetalle && <p>Cargando detalle...</p>}
          {!cargandoDetalle && ventaDetalle && (
            <div className="sale-detail-content">
              <div className="sale-detail-summary compact-sale-summary">
                <div><span>Venta</span><strong>#{ventaDetalle.id}</strong></div>
                <div><span>Fecha</span><strong>{formatDateTime(ventaDetalle.creadaEn)}</strong></div>
                <div><span>Trabajador</span><strong>{ventaDetalle.trabajador || "-"}</strong></div>
                <div><span>Método</span><strong>{formatMetodo(ventaDetalle.metodoPago)}</strong></div>
                <div><span>Estado</span><strong>{formatEstado(ventaDetalle.estado)}</strong></div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table sale-detail-table compact-sale-detail-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventaDetalle.detalles.map((detalle) => (
                      <tr key={detalle.id}>
                        <td><strong>{detalle.nombre}</strong></td>
                        <td>{detalle.cantidad}</td>
                        <td>{formatMoney(detalle.precioUnitario)}</td>
                        <td>{formatMoney(detalle.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <dl className="sale-detail-totals compact-sale-totals">
                <div><dt>Subtotal</dt><dd>{formatMoney(ventaDetalle.subtotal)}</dd></div>
                <div><dt>Impuesto</dt><dd>{formatMoney(ventaDetalle.impuesto)}</dd></div>
                <div><dt>Total</dt><dd>{formatMoney(ventaDetalle.total)}</dd></div>
                <div><dt>Monto recibido</dt><dd>{formatMoney(ventaDetalle.montoRecibido)}</dd></div>
                <div><dt>Cambio</dt><dd>{formatMoney(ventaDetalle.cambio)}</dd></div>
              </dl>

              {ventaDetalle.observacion && (
                <p className="sale-detail-note"><strong>Observación:</strong> {ventaDetalle.observacion}</p>
              )}
              {ventaDetalle.motivoAnulacion && (
                <p className="sale-detail-note"><strong>Motivo de anulación:</strong> {ventaDetalle.motivoAnulacion}</p>
              )}

            </div>
          )}
        </section>
      </div>
    );
  }

  function renderModalAnulacion() {
    return (
      <div className="product-modal-backdrop" role="presentation">
        <section className="product-modal cash-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-sale-title">
          <header className="product-modal-header">
            <h3 id="cancel-sale-title">Anular venta #{ventaAnular.id}</h3>
            <button type="button" aria-label="Cerrar" onClick={cerrarModalAnulacion}>x</button>
          </header>

          <form className="producto-form compact-product-form cash-form" onSubmit={confirmarAnulacion}>
            <p className="full-field cancel-sale-warning">
              La venta quedará marcada como anulada y el stock de sus productos será devuelto automáticamente.
            </p>

            <label className="full-field">
              Motivo de anulación
              <textarea value={motivoAnulacion} onChange={(event) => setMotivoAnulacion(event.target.value)} required autoFocus />
            </label>

            {error && <p className="error-message full-field">{error}</p>}

            <div className="form-actions full-field">
              <button className="admin-primary" type="submit" disabled={guardandoAnulacion || !motivoAnulacion.trim()}>{guardandoAnulacion ? "Anulando..." : "Confirmar anulación"}</button>
              <button className="admin-secondary" type="button" onClick={cerrarModalAnulacion} disabled={guardandoAnulacion}>Cancelar</button>
            </div>
          </form>
        </section>
      </div>
    );
  }
}

function getSaleRowClass(venta, ventaSeleccionadaId) {
  const clases = ["clickable-row"];
  if (venta.estado === "ANULADA") clases.push("sale-cancelled-row");
  if (venta.id === ventaSeleccionadaId) clases.push("selected-row");
  return clases.join(" ");
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

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatMetodo(value) {
  if (value === "EFECTIVO") return "Efectivo";
  if (value === "TRANSFERENCIA") return "Transferencia";
  return value || "-";
}

function formatEstado(value) {
  if (value === "ANULADA") return "Anulada";
  return "Registrada";
}