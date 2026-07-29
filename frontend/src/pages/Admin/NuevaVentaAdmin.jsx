import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import { abrirCaja, cerrarCaja, obtenerCajaActual, obtenerProductos, registrarVenta } from "../../services/api";

const formularioInicial = {
  nombreTrabajador: "",
  montoInicial: "",
  observacion: "",
};

const pagoInicial = {
  metodoPago: "EFECTIVO",
  montoRecibido: "",
  observacion: "",
};

export default function NuevaVentaAdmin() {
  const navigate = useNavigate();
  const usuario = useMemo(() => localStorage.getItem("adminUsuario") || "admin", []);
  const [caja, setCaja] = useState(null);
  const [productos, setProductos] = useState([]);
  const [terminoProducto, setTerminoProducto] = useState("");
  const [itemsVenta, setItemsVenta] = useState([]);
  const [itemSeleccionadoId, setItemSeleccionadoId] = useState(null);
  const [cantidadPendiente, setCantidadPendiente] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [pago, setPago] = useState(pagoInicial);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarPago, setMostrarPago] = useState(false);
  const [vistaCaja, setVistaCaja] = useState(false);
  const [menuVentaAbierto, setMenuVentaAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const productosFiltrados = useMemo(() => {
    const termino = terminoProducto.trim().toLowerCase();
    const activos = productos.filter((producto) => producto.estado);

    if (!termino) return activos;

    return activos.filter((producto) => [
      producto.codigo,
      producto.nombre,
      producto.categoria,
      producto.marca,
    ].some((valor) => String(valor || "").toLowerCase().includes(termino)));
  }, [productos, terminoProducto]);

  const itemSeleccionado = useMemo(
    () => itemsVenta.find((item) => item.id === itemSeleccionadoId) || null,
    [itemsVenta, itemSeleccionadoId]
  );

  const subtotalVenta = useMemo(
    () => roundMoney(itemsVenta.reduce((total, item) => total + item.cantidad * item.precioVenta, 0)),
    [itemsVenta]
  );
  const impuestos = subtotalVenta > 0 ? roundMoney(subtotalVenta * 0.15) : 0;
  const totalAPagar = roundMoney(subtotalVenta + impuestos);
  const montoRecibido = Number(pago.montoRecibido);
  const cambio = pago.metodoPago === "EFECTIVO" && Number.isFinite(montoRecibido)
    ? roundMoney(montoRecibido - totalAPagar)
    : 0;
  const puedeConfirmarPago = itemsVenta.length > 0 && Number.isFinite(montoRecibido) && montoRecibido >= totalAPagar;

  async function consultarCajaActual() {
    setCargando(true);
    setError("");

    try {
      const data = await obtenerCajaActual();
      setCaja(data.caja || null);
      if (data.caja) await cargarProductosVenta();
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo consultar la caja registradora.");
    } finally {
      setCargando(false);
    }
  }

  async function cargarProductosVenta() {
    setCargandoProductos(true);
    try {
      const data = await obtenerProductos();
      setProductos(data);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudieron cargar los productos.");
    } finally {
      setCargandoProductos(false);
    }
  }

  useEffect(() => {
    consultarCajaActual();
  }, []);

  function cerrarSesion() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsuario");
    navigate("/login");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  }

  function abrirFormularioCaja() {
    setFormulario(formularioInicial);
    setMensaje("");
    setError("");
    setMostrarFormulario(true);
  }

  function cerrarFormularioCaja() {
    if (guardando) return;
    setMostrarFormulario(false);
    setFormulario(formularioInicial);
  }

  function iniciarNuevaVenta() {
    setItemsVenta([]);
    setItemSeleccionadoId(null);
    setCantidadPendiente("");
    setPago(pagoInicial);
    setMostrarPago(false);
    setMensaje("");
    setError("");
  }

  function volverAlPanelCaja() {
    if (itemsVenta.length > 0) {
      const confirmado = window.confirm("La venta actual tiene productos cargados. ¿Desea salir y limpiar la venta?");
      if (!confirmado) return;
      iniciarNuevaVenta();
    }

    setMenuVentaAbierto(false);
    navigate("/admin/caja");
  }

  function seguirVendiendo() {
    setVistaCaja(false);
    setMenuVentaAbierto(false);
    setMensaje("");
    setError("");
  }

  async function cerrarCajaActual() {
    if (itemsVenta.length > 0) {
      setError("Finalice o limpie la venta actual antes de cerrar caja.");
      setMenuVentaAbierto(false);
      return;
    }

    const confirmado = window.confirm("¿Desea cerrar la caja registradora?");
    if (!confirmado) return;

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const resultado = await cerrarCaja();
      setCaja(null);
      setVistaCaja(false);
      iniciarNuevaVenta();
      setMensaje(resultado.mensaje || "Caja cerrada correctamente.");
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo cerrar la caja registradora.");
    } finally {
      setGuardando(false);
      setMenuVentaAbierto(false);
    }
  }
  function aplicarCantidadAItem(itemId, cantidadTexto) {
    const item = itemsVenta.find((producto) => producto.id === itemId);
    if (!item || !cantidadTexto) return true;

    const cantidad = Number(cantidadTexto);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setError("La cantidad debe ser un número entero mayor a 0.");
      return false;
    }

    if (cantidad > item.stock) {
      setError(`Stock insuficiente. Solo hay ${item.stock} unidades disponibles.`);
      return false;
    }

    setItemsVenta((actual) => actual.map((producto) => (
      producto.id === itemId ? { ...producto, cantidad } : producto
    )));
    setCantidadPendiente("");
    setError("");
    return true;
  }

  function seleccionarItem(itemId) {
    if (itemSeleccionadoId && cantidadPendiente) {
      const aplicado = aplicarCantidadAItem(itemSeleccionadoId, cantidadPendiente);
      if (!aplicado) return;
    }

    setItemSeleccionadoId((actual) => (actual === itemId ? null : itemId));
    setCantidadPendiente("");
    setMensaje("");
    setError("");
  }

  function agregarProducto(producto) {
    if (itemSeleccionadoId && cantidadPendiente) {
      const aplicado = aplicarCantidadAItem(itemSeleccionadoId, cantidadPendiente);
      if (!aplicado) return;
    }

    setError("");
    if (producto.stock <= 0) return;

    setItemsVenta((actual) => {
      const existente = actual.find((item) => item.id === producto.id);
      if (existente) {
        if (existente.cantidad >= producto.stock) {
          setError(`No se puede agregar más de ${producto.stock} unidades de ${producto.nombre}.`);
          return actual;
        }

        return actual.map((item) => (
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        ));
      }

      return [...actual, {
        id: producto.id,
        nombre: producto.nombre,
        precioVenta: producto.precioVenta,
        cantidad: 1,
        stock: producto.stock,
      }];
    });

    setItemSeleccionadoId(producto.id);
    setCantidadPendiente("");
  }

  function eliminarItemSeleccionado() {
    if (!itemSeleccionado) return;

    setItemsVenta((actual) => actual.filter((item) => item.id !== itemSeleccionado.id));
    setItemSeleccionadoId(null);
    setCantidadPendiente("");
    setError("");
  }

  function ingresarNumero(numero) {
    if (!itemSeleccionado) return;

    setCantidadPendiente((actual) => {
      const siguiente = `${actual}${numero}`.replace(/^0+(?=\d)/, "");
      return siguiente.slice(0, 4);
    });
    setError("");
  }

  function aplicarCantidadPendiente() {
    if (!itemSeleccionado || !cantidadPendiente) return;
    aplicarCantidadAItem(itemSeleccionado.id, cantidadPendiente);
  }

  function limpiarCantidadPendiente() {
    if (!itemSeleccionado) return;
    setCantidadPendiente("");
    setError("");
  }

  function abrirModalPago() {
    if (itemsVenta.length === 0) return;
    if (itemSeleccionadoId && cantidadPendiente) {
      const aplicado = aplicarCantidadAItem(itemSeleccionadoId, cantidadPendiente);
      if (!aplicado) return;
    }

    setPago(pagoInicial);
    setError("");
    setMostrarPago(true);
  }

  function cerrarModalPago() {
    if (guardando) return;
    setMostrarPago(false);
    setPago(pagoInicial);
  }

  function handlePagoChange(event) {
    const { name, value } = event.target;
    setPago((actual) => ({ ...actual, [name]: value }));
  }

  async function confirmarVenta(event) {
    event.preventDefault();
    if (!puedeConfirmarPago) return;

    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const venta = await registrarVenta({
        items: itemsVenta.map((item) => ({ productoId: item.id, cantidad: item.cantidad })),
        metodoPago: pago.metodoPago,
        montoRecibido: pago.montoRecibido,
        observacion: pago.observacion,
      });

      iniciarNuevaVenta();
      setMensaje(venta.mensaje || "Venta registrada correctamente.");
      await cargarProductosVenta();
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo registrar la venta.");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarAperturaCaja(event) {
    event.preventDefault();
    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      const cajaAbierta = await abrirCaja({
        nombreTrabajador: formulario.nombreTrabajador,
        montoInicial: formulario.montoInicial,
        observacion: formulario.observacion,
      });
      setCaja(cajaAbierta);
      setVistaCaja(false);
      setMostrarFormulario(false);
      setFormulario(formularioInicial);
      setMensaje("");
      await cargarProductosVenta();
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo abrir la caja registradora.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      {!cargando && caja && !vistaCaja ? (
        <header className="pos-sale-topbar">
          <button className="pos-new-sale-button" type="button" onClick={iniciarNuevaVenta}>
            Nueva Venta
          </button>
          <div className="pos-menu-wrap">
            <button
              className="pos-menu-button"
              type="button"
              aria-label="Menú de venta"
              onClick={() => setMenuVentaAbierto((actual) => !actual)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            {menuVentaAbierto && (
              <div className="pos-quick-menu" role="menu">
                <button type="button" role="menuitem" onClick={volverAlPanelCaja}>Volver al panel</button>
                <button type="button" role="menuitem" className="danger" onClick={cerrarCajaActual}>Cerrar caja</button>
              </div>
            )}
          </div>
        </header>
      ) : (
        <AdminNavbar usuario={usuario} showToolbar={false} />
      )}

      <main className={vistaCaja ? "admin-page sales-page cash-dashboard-page" : "admin-page sales-page"}>
        {(!caja || cargando || vistaCaja) && (
          <header className="admin-header sales-header">
            <div>
              <h2>{vistaCaja ? "Caja" : "Nueva venta"}</h2>
              <p>Administrador: {usuario}</p>
            </div>
          </header>
        )}

        {mensaje && <p className="success-message admin-feedback pos-success-message">{mensaje}</p>}
        {!mostrarFormulario && !mostrarPago && error && <p className="error-message admin-feedback pos-error-message">{error}</p>}

        {cargando && (
          <section className="sales-panel compact-sales-panel">
            <p>Consultando caja registradora...</p>
          </section>
        )}

        {!cargando && !caja && (
          <section className="sales-panel cash-closed-panel">
            <div>
              <h3>Punto de venta</h3>
              <p>No existe una caja registradora abierta.</p>
            </div>
            <button className="admin-primary" type="button" onClick={abrirFormularioCaja}>
              Abrir caja registradora
            </button>
          </section>
        )}

        {!cargando && caja && vistaCaja && (
          <section className="sales-panel cash-dashboard-panel">
            <div className="cash-dashboard-card">
              <div className="cash-dashboard-title">
                <h3>{caja.nombreTrabajador || "funfull"}</h3>
                <span>Por cerrar</span>
              </div>
              <button className="admin-primary" type="button" onClick={seguirVendiendo}>Seguir vendiendo</button>
              <div className="cash-worker-badge" aria-hidden="true">{String(caja.nombreTrabajador || usuario).charAt(0).toUpperCase()}</div>
              <dl className="cash-dashboard-summary">
                <div><dt>Fecha</dt><dd>{formatDate(caja.abiertaEn)}</dd></div>
                <div><dt>Apertura</dt><dd>${Number(caja.montoInicial || 0).toFixed(2)}</dd></div>
                <div><dt>Vendido</dt><dd>${Number(caja.vendido || 0).toFixed(2)} ({Number(caja.ventas || 0)} ventas)</dd></div>
                <div><dt>Estado</dt><dd>{caja.estado}</dd></div>
              </dl>
            </div>
          </section>
        )}

        {!cargando && caja && !vistaCaja && (
          <section className="pos-sale-screen" aria-label="Registro de nueva venta">
            <aside className="pos-ticket-panel">
              <div className="pos-ticket-list">
                {itemsVenta.length === 0 && <p className="pos-ticket-empty">Seleccione productos para la venta.</p>}
                {itemsVenta.map((item) => (
                  <button
                    className={itemSeleccionadoId === item.id ? "pos-ticket-row selected-ticket-row" : "pos-ticket-row"}
                    type="button"
                    key={item.id}
                    onClick={() => seleccionarItem(item.id)}
                  >
                    <span>{itemSeleccionadoId === item.id && cantidadPendiente ? cantidadPendiente : item.cantidad}</span>
                    <strong>{item.nombre}</strong>
                    <b>${(item.cantidad * item.precioVenta).toFixed(2)}</b>
                  </button>
                ))}
              </div>

              <div className="pos-ticket-total">
                <div>
                  <span>Impuestos</span>
                  <strong>${impuestos.toFixed(2)}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>${totalAPagar.toFixed(2)}</strong>
                </div>
              </div>

              <div className="pos-keypad">
                {["1", "2", "3"].map((tecla) => (
                  <button type="button" key={tecla} onClick={() => ingresarNumero(tecla)}>{tecla}</button>
                ))}
                <button type="button" onClick={aplicarCantidadPendiente}>Cant.</button>
                {["4", "5", "6"].map((tecla) => (
                  <button type="button" key={tecla} onClick={() => ingresarNumero(tecla)}>{tecla}</button>
                ))}
                <button type="button">%</button>
                {["7", "8", "9"].map((tecla) => (
                  <button type="button" key={tecla} onClick={() => ingresarNumero(tecla)}>{tecla}</button>
                ))}
                <button type="button">Precio</button>
                <button className="tone-warning" type="button">+/-</button>
                <button type="button" onClick={() => ingresarNumero("0")}>0</button>
                <button className="tone-soft" type="button" onClick={limpiarCantidadPendiente}>C</button>
                <button className="tone-danger" type="button" onClick={eliminarItemSeleccionado}>X</button>
              </div>

              <button className="pos-pay-button" type="button" disabled={itemsVenta.length === 0} onClick={abrirModalPago}>
                Pagar
              </button>
            </aside>

            <section className="pos-products-panel">
              <div className="pos-search-box">
                <span aria-hidden="true" className="pos-search-icon"></span>
                <input
                  aria-label="Buscar productos para venta"
                  placeholder="Buscar productos..."
                  value={terminoProducto}
                  onChange={(event) => setTerminoProducto(event.target.value)}
                />
              </div>

              {cargandoProductos && <p className="pos-products-message">Cargando productos...</p>}
              {!cargandoProductos && productosFiltrados.length === 0 && (
                <p className="pos-products-message">No se encontraron productos.</p>
              )}
              {!cargandoProductos && productosFiltrados.length > 0 && (
                <div className="pos-products-grid">
                  {productosFiltrados.map((producto) => {
                    const itemEnVenta = itemsVenta.find((item) => item.id === producto.id);

                    return (
                      <button
                        className="pos-product-card"
                        type="button"
                        key={producto.id}
                        onClick={() => agregarProducto(producto)}
                        disabled={producto.stock <= 0}
                      >
                        <img src={producto.imagen} alt={producto.nombre} />
                        <span>{producto.nombre}</span>
                        {itemEnVenta && <strong>{itemEnVenta.cantidad}</strong>}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </section>
        )}
      </main>

      {mostrarFormulario && (
        <div className="product-modal-backdrop" role="presentation">
          <section className="product-modal cash-modal" role="dialog" aria-modal="true" aria-labelledby="cash-modal-title">
            <header className="product-modal-header">
              <h3 id="cash-modal-title">Abrir caja registradora</h3>
              <button type="button" aria-label="Cerrar" onClick={cerrarFormularioCaja}>x</button>
            </header>

            <form className="producto-form compact-product-form cash-form" onSubmit={guardarAperturaCaja}>
              <label className="full-field">
                Nombre del trabajador
                <input name="nombreTrabajador" value={formulario.nombreTrabajador} onChange={handleChange} required autoFocus />
              </label>

              <label className="full-field">
                Monto inicial
                <input name="montoInicial" type="number" min="0" step="0.01" value={formulario.montoInicial} onChange={handleChange} required />
              </label>

              <label className="full-field">
                Observación
                <textarea name="observacion" value={formulario.observacion} onChange={handleChange} />
              </label>

              {error && <p className="error-message full-field">{error}</p>}

              <div className="form-actions full-field">
                <button className="admin-primary" type="submit" disabled={guardando}>{guardando ? "Abriendo..." : "Confirmar apertura"}</button>
                <button className="admin-secondary" type="button" onClick={cerrarFormularioCaja} disabled={guardando}>Cancelar</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {mostrarPago && (
        <div className="product-modal-backdrop" role="presentation">
          <section className="product-modal payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
            <header className="product-modal-header">
              <h3 id="payment-modal-title">Finalizar venta</h3>
              <button type="button" aria-label="Cerrar" onClick={cerrarModalPago}>x</button>
            </header>

            <form className="producto-form compact-product-form payment-form" onSubmit={confirmarVenta}>
              <label className="full-field">
                Total a pagar
                <input value={`$${totalAPagar.toFixed(2)}`} readOnly />
              </label>

              <label className="full-field">
                Método de pago
                <select name="metodoPago" value={pago.metodoPago} onChange={handlePagoChange}>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                </select>
              </label>

              <label className="full-field">
                {pago.metodoPago === "TRANSFERENCIA" ? "Monto transferido" : "Monto recibido"}
                <input name="montoRecibido" type="number" min="0" step="0.01" value={pago.montoRecibido} onChange={handlePagoChange} required autoFocus />
              </label>

              <label className="full-field">
                Cambio
                <input value={`$${Math.max(cambio, 0).toFixed(2)}`} readOnly />
              </label>

              <label className="full-field">
                Observación
                <textarea name="observacion" value={pago.observacion} onChange={handlePagoChange} />
              </label>

              {pago.montoRecibido && !puedeConfirmarPago && (
                <p className="error-message full-field">
                  {pago.metodoPago === "TRANSFERENCIA" ? "El monto transferido es insuficiente." : "El monto recibido es insuficiente."}
                </p>
              )}
              {error && <p className="error-message full-field">{error}</p>}

              <div className="form-actions full-field">
                <button className="admin-primary" type="submit" disabled={!puedeConfirmarPago || guardando}>{guardando ? "Registrando..." : "Confirmar venta"}</button>
                <button className="admin-secondary" type="button" onClick={cerrarModalPago} disabled={guardando}>Cancelar</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-EC", { month: "short", day: "2-digit" }).format(new Date(value));
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}