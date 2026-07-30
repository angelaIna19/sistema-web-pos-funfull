import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import {
  obtenerCajas,
  obtenerProductosMasVendidos,
  obtenerReporteOrdenes,
  obtenerReporteStockBajo,
  obtenerReporteVentas,
  obtenerReporteVentasPorCaja,
} from "../../services/api";

const PERIODOS_ORDENES = [
  { value: "dia", label: "Día" },
  { value: "semana", label: "Semana" },
  { value: "quincena", label: "Quincena" },
  { value: "mes", label: "Mes" },
];

export default function ReportesAdmin({ modo = "ventas" }) {
  const navigate = useNavigate();
  const usuario = useMemo(() => localStorage.getItem("adminUsuario") || "admin", []);
  const [reporteVentas, setReporteVentas] = useState(null);
  const [reporteCaja, setReporteCaja] = useState(null);
  const [cajas, setCajas] = useState([]);
  const [cajaSeleccionadaId, setCajaSeleccionadaId] = useState("");
  const [ordenes, setOrdenes] = useState([]);
  const [periodoOrdenes, setPeriodoOrdenes] = useState("mes");
  const [productosVendidos, setProductosVendidos] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const esVentas = modo === "ventas";
  const esVentasPorCaja = modo === "ventas-por-caja";
  const esOrdenes = modo === "ordenes";
  const esMasVendidos = modo === "productos-mas-vendidos";
  const esStockBajo = modo === "stock-bajo";

  const tituloPantalla = esVentas
    ? "Reporte de ventas"
    : esVentasPorCaja
      ? "Ventas por caja"
      : esOrdenes
        ? "Análisis de órdenes"
        : esMasVendidos
          ? "Productos más vendidos"
          : "Productos con stock bajo";

  const tituloPanel = esVentas
    ? "Resumen de ventas"
    : esVentasPorCaja
      ? "Reporte de ventas por caja"
      : esOrdenes
        ? "Tabla resumen de órdenes"
        : esMasVendidos
          ? "Ranking de productos"
          : "Alertas de stock";

  const datosListado = esVentasPorCaja
    ? reporteCaja?.ventas || []
    : esOrdenes
      ? ordenes
      : esMasVendidos
        ? productosVendidos
        : esStockBajo
          ? stockBajo
          : [];

  const datosFiltrados = useMemo(() => {
    const termino = terminoBusqueda.trim().toLowerCase();
    if (!termino) return datosListado;

    return datosListado.filter((item) => [
      item.id,
      item.periodo,
      item.ordenes,
      item.productosVendidos,
      item.total,
      item.codigo,
      item.nombre,
      item.categoria,
      item.marca,
      item.metodoPago,
      item.trabajador,
      item.estado,
      item.creadaEn,
    ].some((valor) => String(valor || "").toLowerCase().includes(termino)));
  }, [datosListado, terminoBusqueda]);

  useEffect(() => {
    setTerminoBusqueda("");
    cargarReporte();
  }, [modo, periodoOrdenes, cajaSeleccionadaId]);

  async function cargarReporte() {
    setCargando(true);
    setError("");

    try {
      if (esVentas) {
        const data = await obtenerReporteVentas();
        setReporteVentas(data);
        limpiarReportesSecundarios();
      }

      if (esVentasPorCaja) {
        const cajasData = await obtenerCajas();
        const cajaId = cajaSeleccionadaId || cajasData[0]?.id || "";
        setCajas(cajasData);
        setCajaSeleccionadaId(cajaId);
        setReporteVentas(null);
        setOrdenes([]);
        setProductosVendidos([]);
        setStockBajo([]);

        if (cajaId) {
          const data = await obtenerReporteVentasPorCaja(cajaId);
          setReporteCaja(data);
        } else {
          setReporteCaja(null);
        }
      }

      if (esOrdenes) {
        const data = await obtenerReporteOrdenes(periodoOrdenes);
        setOrdenes(data);
        setReporteVentas(null);
        setReporteCaja(null);
        setProductosVendidos([]);
        setStockBajo([]);
      }

      if (esMasVendidos) {
        const data = await obtenerProductosMasVendidos();
        setProductosVendidos(data);
        setReporteVentas(null);
        setReporteCaja(null);
        setOrdenes([]);
        setStockBajo([]);
      }

      if (esStockBajo) {
        const data = await obtenerReporteStockBajo();
        setStockBajo(data);
        setReporteVentas(null);
        setReporteCaja(null);
        setOrdenes([]);
        setProductosVendidos([]);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo cargar el reporte.");
    } finally {
      setCargando(false);
    }
  }

  function limpiarReportesSecundarios() {
    setReporteCaja(null);
    setOrdenes([]);
    setProductosVendidos([]);
    setStockBajo([]);
  }

  function cerrarSesion() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsuario");
    navigate("/login");
  }

  function imprimirReporte() {
    const puedeImprimir = (esVentas && reporteVentas) || (esVentasPorCaja && reporteCaja) || (esMasVendidos && productosVendidos.length > 0);
    if (!puedeImprimir) return;
    window.print();
  }

  return (
    <>
      <AdminNavbar
        usuario={usuario}
        terminoBusqueda={terminoBusqueda}
        onSearchChange={setTerminoBusqueda}
        totalProductos={esVentas ? Number(reporteVentas?.metodosPago?.length || 0) : datosFiltrados.length}
        sectionTitle="Reportes"
        searchFilter={tituloPantalla}
        showEditDelete={false}
        showNewButton={false}
        showViewToggle={false}
        showSearch={!esVentas}
        showToolbarActions={!esVentas}
        toolbarButtons={(esVentas || esVentasPorCaja || esMasVendidos) ? [
          {
            label: "Imprimir",
            className: "admin-toolbar-button report-print-button",
            onClick: imprimirReporte,
            disabled: (esVentas && !reporteVentas) || (esVentasPorCaja && !reporteCaja) || (esMasVendidos && productosVendidos.length === 0),
          },
        ] : null}
        forceToolbar
      />

      <main className="admin-page compact-products-page reports-page">
        <header className="admin-header no-print">
          <div>
            <h2>{tituloPantalla}</h2>
            <p>Administrador: {usuario}</p>
          </div>
        </header>

        {error && <p className="error-message admin-feedback no-print">{error}</p>}

        <section className="productos-admin-list products-only-list reports-panel printable-report">
          <div className="reports-panel-heading no-print">
            <h3>{tituloPanel}</h3>
            {esOrdenes && (
              <label className="reports-period-select">
                Periodo
                <select value={periodoOrdenes} onChange={(event) => setPeriodoOrdenes(event.target.value)}>
                  {PERIODOS_ORDENES.map((periodo) => (
                    <option key={periodo.value} value={periodo.value}>{periodo.label}</option>
                  ))}
                </select>
              </label>
            )}
            {esVentasPorCaja && (
              <label className="reports-period-select cash-report-select">
                Caja
                <select value={cajaSeleccionadaId} onChange={(event) => setCajaSeleccionadaId(event.target.value)}>
                  {cajas.length === 0 && <option value="">Sin cajas registradas</option>}
                  {cajas.map((caja) => (
                    <option key={caja.id} value={caja.id}>
                      {caja.nombreTrabajador} - {formatDateTime(caja.abiertaEn)} - {formatStatus(caja.estado)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {cargando && <p>Cargando reporte...</p>}
          {!cargando && esVentas && renderReporteVentas()}
          {!cargando && esVentasPorCaja && renderVentasPorCaja()}
          {!cargando && esOrdenes && renderOrdenes()}
          {!cargando && esMasVendidos && renderMasVendidos()}
          {!cargando && esStockBajo && renderStockBajo()}
        </section>
      </main>
    </>
  );

  function renderReporteVentas() {
    const resumen = reporteVentas?.resumen || {};
    const metodos = reporteVentas?.metodosPago || [];
    const cards = [
      { label: "Ventas registradas", value: formatNumber(resumen.ventasRegistradas) },
      { label: "Ventas anuladas", value: formatNumber(resumen.ventasAnuladas), tone: "danger" },
      { label: "Subtotal", value: formatMoney(resumen.subtotal) },
      { label: "Impuesto", value: formatMoney(resumen.impuesto) },
      { label: "Total vendido", value: formatMoney(resumen.total), tone: "success" },
    ];

    return (
      <>
        <div className="print-only report-print-document report-print-sales">
          <div className="report-print-header">
            <div>
              <h2>Licorería Fun Full</h2>
              <p>Reporte de ventas</p>
            </div>
            <div>
              <span>Fecha de impresión</span>
              <strong>{formatDateTime(new Date())}</strong>
            </div>
          </div>

          <div className="report-print-totals">
            <div><span>Ventas registradas</span><strong>{formatNumber(resumen.ventasRegistradas)}</strong></div>
            <div><span>Subtotal</span><strong>{formatMoney(resumen.subtotal)}</strong></div>
            <div><span>Impuesto</span><strong>{formatMoney(resumen.impuesto)}</strong></div>
            <div><span>Total vendido</span><strong>{formatMoney(resumen.total)}</strong></div>
          </div>
        </div>

        <div className="inventory-summary-grid reports-summary-grid screen-only">
          {cards.map((card) => (
            <article className={`inventory-summary-card ${card.tone || ""}`} key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </div>

        <div className="admin-table-wrap reports-table-wrap">
          {metodos.length === 0 ? (
            <p>No hay ventas registradas.</p>
          ) : (
            <table className="admin-table products-table reports-table sales-payment-report-table">
              <thead>
                <tr>
                  <th>Método</th>
                  <th>Ventas</th>
                  <th>Subtotal</th>
                  <th>Impuesto</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {metodos.map((metodo) => (
                  <tr key={metodo.metodoPago}>
                    <td><strong>{formatPaymentMethod(metodo.metodoPago)}</strong></td>
                    <td>{metodo.ventas}</td>
                    <td>{formatMoney(metodo.subtotal)}</td>
                    <td>{formatMoney(metodo.impuesto)}</td>
                    <td><strong>{formatMoney(metodo.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  }

  function renderVentasPorCaja() {
    if (cajas.length === 0) return <p>No hay cajas registradas.</p>;
    if (!reporteCaja) return <p>Seleccione una caja para consultar sus ventas.</p>;

    const caja = reporteCaja.caja || {};
    const resumen = reporteCaja.resumen || {};
    const cards = [
      { label: "Trabajador", value: caja.nombreTrabajador || "-" },
      { label: "Estado", value: formatStatus(caja.estado) },
      { label: "Apertura", value: formatDateTime(caja.abiertaEn) },
      { label: "Vendido", value: formatMoney(resumen.totalVendido), tone: "success" },
      { label: "Anuladas", value: formatNumber(resumen.ventasAnuladas), tone: "danger" },
    ];

    return (
      <>
        <div className="print-only report-print-document">
          <div className="report-print-header">
            <div>
              <h2>Licorería Fun Full</h2>
              <p>Reporte de ventas por caja</p>
            </div>
            <div>
              <span>Fecha de impresión</span>
              <strong>{formatDateTime(new Date())}</strong>
            </div>
          </div>

          <div className="report-print-info-grid">
            <div><span>Trabajador</span><strong>{caja.nombreTrabajador || "-"}</strong></div>
            <div><span>Apertura</span><strong>{formatDateTime(caja.abiertaEn)}</strong></div>
            <div><span>Cierre</span><strong>{formatDateTime(caja.cerradaEn)}</strong></div>
            <div><span>Monto inicial</span><strong>{formatMoney(caja.montoInicial)}</strong></div>
            <div><span>Esperado en caja</span><strong>{caja.montoEsperado === null ? "-" : formatMoney(caja.montoEsperado)}</strong></div>
          </div>

          <div className="report-print-totals">
            <div><span>Ventas registradas</span><strong>{formatNumber(resumen.ventasRegistradas)}</strong></div>
            <div><span>Efectivo</span><strong>{formatMoney(resumen.totalEfectivo)}</strong></div>
            <div><span>Transferencia</span><strong>{formatMoney(resumen.totalTransferencia)}</strong></div>
            <div><span>Total vendido</span><strong>{formatMoney(resumen.totalVendido)}</strong></div>
          </div>
        </div>

        <div className="inventory-summary-grid reports-summary-grid cash-box-report-grid screen-only">
          {cards.map((card) => (
            <article className={`inventory-summary-card ${card.tone || ""}`} key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </div>

        <div className="cash-box-report-details screen-only">
          <span>Inicial: <strong>{formatMoney(caja.montoInicial)}</strong></span>
          <span>Efectivo: <strong>{formatMoney(resumen.totalEfectivo)}</strong></span>
          <span>Transferencia: <strong>{formatMoney(resumen.totalTransferencia)}</strong></span>
          <span>Entradas: <strong>{formatMoney(caja.ingresosManuales)}</strong></span>
          <span>Salidas: <strong>{formatMoney(caja.egresosManuales)}</strong></span>
          <span>Esperado: <strong>{caja.montoEsperado === null ? "-" : formatMoney(caja.montoEsperado)}</strong></span>
        </div>

        <div className="admin-table-wrap reports-table-wrap">
          {reporteCaja.ventas.length === 0 ? (
            <p>No hay ventas registradas en esta caja.</p>
          ) : datosFiltrados.length === 0 ? (
            <p>No se encontraron ventas.</p>
          ) : (
            <table className="admin-table products-table reports-table cash-box-sales-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Método</th>
                  <th>Subtotal</th>
                  <th>Impuesto</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.map((venta) => (
                  <tr key={venta.id} className={venta.estado === "ANULADA" ? "sale-cancelled-row" : ""}>
                    <td><strong>#{venta.id}</strong></td>
                    <td>{formatDateTime(venta.creadaEn)}</td>
                    <td>{formatPaymentMethod(venta.metodoPago)}</td>
                    <td>{formatMoney(venta.subtotal)}</td>
                    <td>{formatMoney(venta.impuesto)}</td>
                    <td><strong>{formatMoney(venta.total)}</strong></td>
                    <td><span className={`status-pill ${venta.estado === "ANULADA" ? "danger" : ""}`}>{formatStatus(venta.estado)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  }

  function renderOrdenes() {
    if (ordenes.length === 0) return <p>No hay órdenes registradas.</p>;
    if (datosFiltrados.length === 0) return <p>No se encontraron órdenes.</p>;

    return (
      <div className="admin-table-wrap">
        <table className="admin-table products-table reports-table orders-report-table">
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Órdenes</th>
              <th>Productos vendidos</th>
              <th>Total vendido</th>
            </tr>
          </thead>
          <tbody>
            {datosFiltrados.map((item) => (
              <tr key={item.periodo}>
                <td><strong>{item.periodo}</strong></td>
                <td>{formatNumber(item.ordenes)}</td>
                <td>{formatNumber(item.productosVendidos)}</td>
                <td><strong>{formatMoney(item.total)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderMasVendidos() {
    if (productosVendidos.length === 0) return <p>No hay productos vendidos.</p>;
    if (datosFiltrados.length === 0) return <p>No se encontraron productos.</p>;

    return (
      <>
        <div className="print-only report-print-document report-print-top-products">
          <div className="report-print-header">
            <div>
              <h2>Licorería Fun Full</h2>
              <p>Productos más vendidos</p>
            </div>
            <div>
              <span>Fecha de impresión</span>
              <strong>{formatDateTime(new Date())}</strong>
            </div>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table products-table reports-table top-products-report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Marca</th>
              <th>Cantidad</th>
              <th>Total vendido</th>
            </tr>
          </thead>
          <tbody>
            {datosFiltrados.map((producto, index) => (
              <tr key={producto.id}>
                <td><strong>{index + 1}</strong></td>
                <td>{producto.codigo}</td>
                <td><strong>{producto.nombre}</strong></td>
                <td>{producto.categoria}</td>
                <td>{producto.marca}</td>
                <td>{producto.cantidadVendida}</td>
                <td><strong>{formatMoney(producto.totalVendido)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </>
    );
  }

  function renderStockBajo() {
    if (stockBajo.length === 0) return <p>No hay productos con stock bajo.</p>;
    if (datosFiltrados.length === 0) return <p>No se encontraron productos.</p>;

    return (
      <div className="admin-table-wrap">
        <table className="admin-table products-table reports-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Marca</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {datosFiltrados.map((producto) => (
              <tr key={producto.id}>
                <td>{producto.codigo}</td>
                <td><strong>{producto.nombre}</strong></td>
                <td>{producto.categoria}</td>
                <td>{producto.marca}</td>
                <td className="inventory-negative">{producto.stock}</td>
                <td>{producto.stockMinimo}</td>
                <td>{producto.estado ? "Activo" : "Inactivo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

function formatPaymentMethod(value) {
  const labels = {
    EFECTIVO: "Efectivo",
    TRANSFERENCIA: "Transferencia",
  };
  return labels[value] || value || "-";
}

function formatStatus(value) {
  const labels = {
    ABIERTA: "Abierta",
    CERRADA: "Cerrada",
    REGISTRADA: "Registrada",
    ANULADA: "Anulada",
  };
  return labels[value] || value || "-";
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-EC").format(Number(value || 0));
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






