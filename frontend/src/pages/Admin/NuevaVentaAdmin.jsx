import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import { abrirCaja, obtenerCajaActual, obtenerProductos } from "../../services/api";

const formularioInicial = {
  nombreTrabajador: "",
  montoInicial: "",
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
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
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

  const totalVenta = useMemo(
    () => itemsVenta.reduce((total, item) => total + item.cantidad * item.precioVenta, 0),
    [itemsVenta]
  );
  const impuestos = totalVenta > 0 ? totalVenta * 0.15 : 0;

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
    setMensaje("");
    setError("");
  }

  function aplicarCantidadAItem(itemId, cantidadTexto) {
    const item = itemsVenta.find((producto) => producto.id === itemId);
    if (!item || !cantidadTexto) return true;

    const cantidad = Number(cantidadTexto);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setError("La cantidad debe ser un numero entero mayor a 0.");
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
          setError(`No se puede agregar mas de ${producto.stock} unidades de ${producto.nombre}.`);
          return actual;
        }

        return actual.map((item) => (
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
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
      {!cargando && caja ? (
        <header className="pos-sale-topbar">
          <button className="pos-new-sale-button" type="button" onClick={iniciarNuevaVenta}>
            Nueva Venta
          </button>
          <button className="pos-menu-button" type="button" aria-label="Menu de venta">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </header>
      ) : (
        <AdminNavbar usuario={usuario} showToolbar={false} />
      )}

      <main className="admin-page sales-page">
        {(!caja || cargando) && (
          <header className="admin-header sales-header">
            <div>
              <h2>Nueva venta</h2>
              <p>Administrador: {usuario}</p>
            </div>
          </header>
        )}

        {(!caja || cargando) && mensaje && <p className="success-message admin-feedback">{mensaje}</p>}
        {!mostrarFormulario && error && <p className="error-message admin-feedback pos-error-message">{error}</p>}

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

        {!cargando && caja && (
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
                  <strong>${totalVenta.toFixed(2)}</strong>
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

              <button className="pos-pay-button" type="button" disabled={itemsVenta.length === 0}>
                Pago
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
                <input
                  name="nombreTrabajador"
                  value={formulario.nombreTrabajador}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </label>

              <label className="full-field">
                Monto inicial
                <input
                  name="montoInicial"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formulario.montoInicial}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="full-field">
                Observacion
                <textarea name="observacion" value={formulario.observacion} onChange={handleChange} />
              </label>

              {error && <p className="error-message full-field">{error}</p>}

              <div className="form-actions full-field">
                <button className="admin-primary" type="submit" disabled={guardando}>
                  {guardando ? "Abriendo..." : "Confirmar apertura"}
                </button>
                <button className="admin-secondary" type="button" onClick={cerrarFormularioCaja} disabled={guardando}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}