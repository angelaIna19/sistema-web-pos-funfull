import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import {
  obtenerProductosMasVendidos,
  obtenerReporteOrdenes,
  obtenerReporteStockBajo,
  obtenerReporteVentas,
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
  const [ordenes, setOrdenes] = useState([]);
  const [periodoOrdenes, setPeriodoOrdenes] = useState("mes");
  const [productosVendidos, setProductosVendidos] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const esVentas = modo === "ventas";
  const esOrdenes = modo === "ordenes";
  const esMasVendidos = modo === "productos-mas-vendidos";
  const esStockBajo = modo === "stock-bajo";

  const tituloPantalla = esVentas
    ? "Reporte de ventas"
    : esOrdenes
      ? "Análisis de órdenes"
      : esMasVendidos
        ? "Productos más vendidos"
        : "Productos con stock bajo";

  const tituloPanel = esVentas
    ? "Resumen de ventas"
    : esOrdenes
      ? "Tabla resumen de órdenes"
      : esMasVendidos
        ? "Ranking de productos"
        : "Alertas de stock";

  const datosListado = esOrdenes ? ordenes : esMasVendidos ? productosVendidos : esStockBajo ? stockBajo : [];
  const datosFiltrados = useMemo(() => {
    const termino = terminoBusqueda.trim().toLowerCase();
    if (!termino) return datosListado;

    return datosListado.filter((item) => [
      item.periodo,
      item.ordenes,
      item.productosVendidos,
      item.total,
      item.codigo,
      item.nombre,
      item.categoria,
      item.marca,
      item.metodoPago,
    ].some((valor) => String(valor || "").toLowerCase().includes(termino)));
  }, [datosListado, terminoBusqueda]);

  useEffect(() => {
    setTerminoBusqueda("");
    cargarReporte();
  }, [modo, periodoOrdenes]);

  async function cargarReporte() {
    setCargando(true);
    setError("");

    try {
      if (esVentas) {
        const data = await obtenerReporteVentas();
        setReporteVentas(data);
        setOrdenes([]);
        setProductosVendidos([]);
        setStockBajo([]);
      }

      if (esOrdenes) {
        const data = await obtenerReporteOrdenes(periodoOrdenes);
        setOrdenes(data);
        setReporteVentas(null);
        setProductosVendidos([]);
        setStockBajo([]);
      }

      if (esMasVendidos) {
        const data = await obtenerProductosMasVendidos();
        setProductosVendidos(data);
        setReporteVentas(null);
        setOrdenes([]);
        setStockBajo([]);
      }

      if (esStockBajo) {
        const data = await obtenerReporteStockBajo();
        setStockBajo(data);
        setReporteVentas(null);
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

  function cerrarSesion() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsuario");
    navigate("/login");
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
        forceToolbar
      />

      <main className="admin-page compact-products-page reports-page">
        <header className="admin-header">
          <div>
            <h2>{tituloPantalla}</h2>
            <p>Administrador: {usuario}</p>
          </div>
        </header>

        {error && <p className="error-message admin-feedback">{error}</p>}

        <section className="productos-admin-list products-only-list reports-panel">
          <div className="reports-panel-heading">
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
          </div>

          {cargando && <p>Cargando reporte...</p>}
          {!cargando && esVentas && renderReporteVentas()}
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
        <div className="inventory-summary-grid reports-summary-grid">
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
            <table className="admin-table products-table reports-table">
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
      <div className="admin-table-wrap">
        <table className="admin-table products-table reports-table">
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

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-EC").format(Number(value || 0));
}

