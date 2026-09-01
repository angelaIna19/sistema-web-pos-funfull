import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import {
  obtenerDetalleProductoInventario,
  obtenerMovimientosInventario,
  obtenerMovimientosInventarioArchivados,
  obtenerProductos,
  obtenerResumenInventario,
  obtenerStockBajo,
  registrarAjusteInventario,
  registrarEntradaInventario,
  registrarSalidaInventario,
} from "../../services/api";

const formularioInicial = {
  productoId: "",
  cantidad: "",
  stockFinal: "",
  motivo: "",
};

const accionesMovimiento = {
  entrada: {
    titulo: "Registrar entrada",
    tipo: "ENTRADA",
    mensaje: "Entrada",
  },
  salida: {
    titulo: "Registrar salida",
    tipo: "SALIDA",
    mensaje: "Salida",
  },
  ajuste: {
    titulo: "Registrar ajuste",
    tipo: "AJUSTE",
    mensaje: "Ajuste",
  },
};

export default function InventarioAdmin({ modo = "resumen" }) {
  const navigate = useNavigate();
  const usuario = useMemo(() => localStorage.getItem("adminUsuario") || "admin", []);
  const [resumen, setResumen] = useState(null);
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [tipoHistorial, setTipoHistorial] = useState("reciente");
  const [stockBajo, setStockBajo] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [accionActual, setAccionActual] = useState(null);
  const [productoDetalle, setProductoDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const esResumen = modo === "resumen";
  const esMovimientos = modo === "movimientos";
  const esDetalleProducto = modo === "detalle-producto";
  const esStockBajo = modo === "stock-bajo";
  const accionConfig = accionActual ? accionesMovimiento[accionActual] : null;
  const productosActivos = useMemo(() => productos.filter((producto) => producto.estado), [productos]);

  const tituloPantalla = esResumen
    ? "Resumen de inventario"
    : esStockBajo
      ? "Stock bajo"
      : esDetalleProducto
        ? "Detalle de producto"
        : "Movimientos de inventario";

  const tituloPanel = esResumen
    ? "Estado general"
    : esStockBajo
      ? "Productos con stock bajo"
      : esDetalleProducto
        ? "Productos registrados"
        : "Movimientos registrados";

  const datosFiltrados = useMemo(() => {
    const termino = terminoBusqueda.trim().toLowerCase();
    const datos = esStockBajo ? stockBajo : esDetalleProducto ? productos : movimientos;

    if (!termino) return datos;

    return datos.filter((item) => [
      item.codigo,
      item.nombre,
      item.categoria,
      item.marca,
      item.tipo,
      labelTipo(item.tipo),
    ].some((valor) => String(valor || "").toLowerCase().includes(termino)));
  }, [esDetalleProducto, esStockBajo, movimientos, productos, stockBajo, terminoBusqueda]);

  async function cargarInventario() {
    setCargando(true);
    setError("");

    try {
      if (esResumen) {
        const resumenData = await obtenerResumenInventario();
        setResumen(resumenData);
        setProductos([]);
        setMovimientos([]);
        setStockBajo([]);
      }

      if (esMovimientos) {
        const cargarMovimientos = tipoHistorial === "archivado"
          ? obtenerMovimientosInventarioArchivados
          : obtenerMovimientosInventario;
        const [productosData, movimientosData] = await Promise.all([obtenerProductos(), cargarMovimientos()]);
        setProductos(productosData);
        setMovimientos(movimientosData);
        setStockBajo([]);
        setResumen(null);
      }

      if (esDetalleProducto) {
        const productosData = await obtenerProductos();
        setProductos(productosData);
        setMovimientos([]);
        setStockBajo([]);
        setResumen(null);
      }

      if (esStockBajo) {
        const [productosData, stockData] = await Promise.all([obtenerProductos(), obtenerStockBajo()]);
        setProductos(productosData);
        setStockBajo(stockData);
        setMovimientos([]);
        setResumen(null);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo cargar la información de inventario.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    setTerminoBusqueda("");
    setAccionActual(null);
    setProductoDetalle(null);
    setFormulario(formularioInicial);
    setMensaje("");
    cargarInventario();
    // The loader follows the active inventory mode and movement history range.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, tipoHistorial]);

  function cerrarSesion() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsuario");
    navigate("/login");
  }

  function abrirFormulario(tipoAccion) {
    setFormulario(formularioInicial);
    setMensaje("");
    setError("");
    setAccionActual(tipoAccion);
  }

  function cerrarFormulario() {
    if (guardando) return;
    setAccionActual(null);
    setFormulario(formularioInicial);
  }

  async function abrirDetalleProducto(productoId) {
    setProductoDetalle({ producto: null, movimientos: [] });
    setCargandoDetalle(true);
    setErrorDetalle("");

    try {
      const detalle = await obtenerDetalleProductoInventario(productoId);
      setProductoDetalle(detalle);
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setErrorDetalle(err.response?.data?.mensaje || "No se pudo cargar el detalle del producto.");
    } finally {
      setCargandoDetalle(false);
    }
  }

  function cerrarDetalleProducto() {
    setProductoDetalle(null);
    setErrorDetalle("");
    setCargandoDetalle(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  }

  async function guardarMovimiento(event) {
    event.preventDefault();
    if (!accionActual) return;

    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      let resultado;

      if (accionActual === "entrada") {
        resultado = await registrarEntradaInventario({
          productoId: formulario.productoId,
          cantidad: formulario.cantidad,
          motivo: formulario.motivo,
        });
      }

      if (accionActual === "salida") {
        resultado = await registrarSalidaInventario({
          productoId: formulario.productoId,
          cantidad: formulario.cantidad,
          motivo: formulario.motivo,
        });
      }

      if (accionActual === "ajuste") {
        resultado = await registrarAjusteInventario({
          productoId: formulario.productoId,
          stockFinal: formulario.stockFinal,
          motivo: formulario.motivo,
        });
      }

      setMensaje(resultado?.mensaje || "Movimiento registrado correctamente.");
      cerrarFormulario();
      await cargarInventario();
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo registrar el movimiento de inventario.");
    } finally {
      setGuardando(false);
    }
  }

  const toolbarButtons = esMovimientos ? [
    { label: "Entrada", className: "admin-new-button", onClick: () => abrirFormulario("entrada") },
    { label: "Salida", className: "admin-toolbar-button", onClick: () => abrirFormulario("salida") },
    { label: "Ajuste", className: "admin-toolbar-button", onClick: () => abrirFormulario("ajuste") },
  ] : null;

  return (
    <>
      <AdminNavbar
        usuario={usuario}
        terminoBusqueda={terminoBusqueda}
        onSearchChange={setTerminoBusqueda}
        totalProductos={esResumen ? 0 : datosFiltrados.length}
        sectionTitle="Inventario"
        searchFilter={tituloPantalla}
        showEditDelete={false}
        showViewToggle={false}
        showNewButton={false}
        showSearch={!esResumen}
        showToolbarActions={!esResumen}
        toolbarButtons={toolbarButtons}
        forceToolbar
      />

      <main className="admin-page compact-products-page inventory-page">
        <header className="admin-header">
          <div>
            <h2>{tituloPantalla}</h2>
          </div>
        </header>

        {mensaje && <p className="success-message admin-feedback">{mensaje}</p>}
        {!accionActual && error && <p className="error-message admin-feedback">{error}</p>}

        <section className="productos-admin-list products-only-list inventory-panel">
          {esMovimientos ? (
            <div className="history-panel-header">
              <h3>{tipoHistorial === "archivado" ? "Movimientos archivados" : "Movimientos recientes"}</h3>
              <label className="reports-period-select">
                Historial
                <select value={tipoHistorial} onChange={(event) => setTipoHistorial(event.target.value)}>
                  <option value="reciente">Historial reciente</option>
                  <option value="archivado">Historial archivado</option>
                </select>
              </label>
            </div>
          ) : <h3>{tituloPanel}</h3>}
          {cargando && <p>Cargando inventario...</p>}
          {!cargando && esResumen && renderResumen()}
          {!cargando && !esResumen && datosFiltrados.length === 0 && (
            <p>{terminoBusqueda ? "No se encontraron registros." : esStockBajo ? "No hay productos con stock bajo." : esDetalleProducto ? "No hay productos registrados." : "No hay movimientos registrados."}</p>
          )}
          {!cargando && !esResumen && datosFiltrados.length > 0 && (
            <div className="admin-table-wrap">
              {esStockBajo && renderStockBajoTable()}
              {esDetalleProducto && renderProductosDetalleTable()}
              {esMovimientos && renderMovimientosTable()}
            </div>
          )}
        </section>
      </main>

      {accionActual && renderMovimientoModal()}
      {productoDetalle && renderDetalleProductoModal()}
    </>
  );

  function renderResumen() {
    const data = resumen || {};
    const cards = [
      { label: "Total de productos", value: formatNumber(data.totalProductos) },
      { label: "Unidades en stock", value: formatNumber(data.totalUnidades) },
      { label: "Valor total", value: formatMoney(data.valorTotal) },
      { label: "Stock bajo", value: formatNumber(data.productosStockBajo), tone: "warning" },
      { label: "Agotados", value: formatNumber(data.productosAgotados), tone: "danger" },
    ];

    return (
      <div className="inventory-summary-grid">
        {cards.map((card) => (
          <article className={`inventory-summary-card ${card.tone || ""}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>
    );
  }

  function renderProductosDetalleTable() {
    return (
      <table className="admin-table products-table inventory-table selectable-table">
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
            <tr key={producto.id} onClick={() => abrirDetalleProducto(producto.id)}>
              <td>{producto.codigo}</td>
              <td><strong>{producto.nombre}</strong></td>
              <td>{producto.categoria}</td>
              <td>{producto.marca}</td>
              <td className={producto.stock <= producto.stockMinimo ? "inventory-negative" : ""}>{producto.stock}</td>
              <td>{producto.stockMinimo}</td>
              <td>{producto.estado ? "Activo" : "Inactivo"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderMovimientosTable() {
    return (
      <table className="admin-table products-table inventory-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Código</th>
            <th>Producto</th>
            <th>Anterior</th>
            <th>Movimiento</th>
            <th>Nuevo</th>
            <th>Motivo</th>
          </tr>
        </thead>
        <tbody>
          {datosFiltrados.map((movimiento) => (
            <tr key={movimiento.id}>
              <td>{formatDateTime(movimiento.creadoEn)}</td>
              <td><span className={`inventory-type-pill ${movimiento.tipo.toLowerCase()}`}>{labelTipo(movimiento.tipo)}</span></td>
              <td>{movimiento.codigo}</td>
              <td><strong>{movimiento.nombre}</strong></td>
              <td>{movimiento.cantidadAnterior}</td>
              <td className={movimiento.cantidadMovimiento < 0 ? "inventory-negative" : "inventory-positive"}>{formatSigned(movimiento.cantidadMovimiento)}</td>
              <td>{movimiento.cantidadNueva}</td>
              <td>{movimiento.motivo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function renderStockBajoTable() {
    return (
      <table className="admin-table products-table inventory-table">
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
    );
  }

  function renderMovimientoModal() {
    return (
      <div className="product-modal-backdrop" role="presentation">
        <section className="product-modal inventory-modal" role="dialog" aria-modal="true" aria-labelledby="inventory-modal-title">
          <header className="product-modal-header">
            <h3 id="inventory-modal-title">{accionConfig.titulo}</h3>
            <button type="button" aria-label="Cerrar" onClick={cerrarFormulario}>x</button>
          </header>

          <form className="producto-form compact-product-form inventory-form" onSubmit={guardarMovimiento}>
            <label className="full-field">
              Producto
              <select name="productoId" value={formulario.productoId} onChange={handleChange} required autoFocus>
                <option value="">Seleccione un producto</option>
                {productosActivos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.codigo} - {producto.nombre} (Stock: {producto.stock})
                  </option>
                ))}
              </select>
            </label>

            {accionActual !== "ajuste" ? (
              <label className="full-field">
                Cantidad
                <input name="cantidad" type="number" min="1" step="1" value={formulario.cantidad} onChange={handleChange} required />
              </label>
            ) : (
              <label className="full-field">
                Stock final
                <input name="stockFinal" type="number" min="0" step="1" value={formulario.stockFinal} onChange={handleChange} required />
              </label>
            )}

            <label className="full-field">
              Motivo
              <textarea name="motivo" value={formulario.motivo} onChange={handleChange} required />
            </label>

            {error && <p className="error-message full-field">{error}</p>}

            <div className="form-actions full-field">
              <button className="admin-primary" type="submit" disabled={guardando}>{guardando ? "Registrando..." : `Registrar ${accionConfig.mensaje.toLowerCase()}`}</button>
              <button className="admin-secondary" type="button" onClick={cerrarFormulario} disabled={guardando}>Cancelar</button>
            </div>
          </form>
        </section>
      </div>
    );
  }

  function renderDetalleProductoModal() {
    const producto = productoDetalle.producto;
    const movimientosProducto = productoDetalle.movimientos || [];

    return (
      <div className="product-modal-backdrop" role="presentation">
        <section className="product-modal inventory-detail-modal" role="dialog" aria-modal="true" aria-labelledby="inventory-product-detail-title">
          <header className="product-modal-header">
            <h3 id="inventory-product-detail-title">Detalle de producto</h3>
            <button type="button" aria-label="Cerrar" onClick={cerrarDetalleProducto}>x</button>
          </header>

          {cargandoDetalle && <p className="inventory-detail-loading">Cargando detalle...</p>}
          {errorDetalle && <p className="error-message inventory-detail-loading">{errorDetalle}</p>}

          {!cargandoDetalle && producto && (
            <div className="inventory-detail-content">
              <div className="inventory-detail-main">
                <div className="inventory-detail-image">
                  {producto.imagen ? <img src={producto.imagen} alt={producto.nombre} /> : <span>Sin imagen</span>}
                </div>
                <div className="inventory-detail-info">
                  <h4>{producto.nombre}</h4>
                  <dl>
                    <div><dt>Código</dt><dd>{producto.codigo}</dd></div>
                    <div><dt>Categoría</dt><dd>{producto.categoria}</dd></div>
                    <div><dt>Marca</dt><dd>{producto.marca}</dd></div>
                    <div><dt>Precio compra</dt><dd>{formatMoney(producto.precioCompra)}</dd></div>
                    <div><dt>Precio venta</dt><dd>{formatMoney(producto.precioVenta)}</dd></div>
                    <div><dt>Stock actual</dt><dd>{producto.stock}</dd></div>
                    <div><dt>Stock mínimo</dt><dd>{producto.stockMinimo}</dd></div>
                    <div><dt>Estado</dt><dd>{producto.estado ? "Activo" : "Inactivo"}</dd></div>
                  </dl>
                </div>
              </div>

              <div className="inventory-detail-history">
                <h4>Historial de movimientos</h4>
                {movimientosProducto.length === 0 ? (
                  <p>No hay movimientos registrados para este producto.</p>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table products-table inventory-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Movimiento</th>
                          <th>Anterior</th>
                          <th>Nuevo</th>
                          <th>Usuario</th>
                          <th>Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientosProducto.map((movimiento) => (
                          <tr key={movimiento.id}>
                            <td>{formatDateTime(movimiento.creadoEn)}</td>
                            <td><span className={`inventory-type-pill ${movimiento.tipo.toLowerCase()}`}>{labelTipo(movimiento.tipo)}</span></td>
                            <td className={movimiento.cantidadMovimiento < 0 ? "inventory-negative" : "inventory-positive"}>{formatSigned(movimiento.cantidadMovimiento)}</td>
                            <td>{movimiento.cantidadAnterior}</td>
                            <td>{movimiento.cantidadNueva}</td>
                            <td>{movimiento.usuario}</td>
                            <td>{movimiento.motivo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    );
  }
}

function labelTipo(tipo) {
  const labels = {
    ENTRADA: "Entrada",
    SALIDA: "Salida",
    AJUSTE: "Ajuste",
  };
  return labels[tipo] || tipo || "-";
}

function formatSigned(value) {
  const number = Number(value || 0);
  return number > 0 ? `+${number}` : String(number);
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
