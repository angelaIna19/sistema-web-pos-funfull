import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import { abrirCaja, cerrarCaja, obtenerCajaActual, obtenerCajas, obtenerCajasArchivadas } from "../../services/api";

const formularioInicial = {
  nombreTrabajador: "",
  montoInicial: "",
  observacion: "",
};

const cierreInicial = {
  montoContado: "",
  observacionCierre: "",
};

export default function CajaAdmin({ modo = "actual" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accionProcesada = useRef("");
  const usuario = useMemo(() => localStorage.getItem("adminUsuario") || "admin", []);
  const [cajaActual, setCajaActual] = useState(null);
  const [cajas, setCajas] = useState([]);
  const [tipoHistorial, setTipoHistorial] = useState("reciente");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [formularioCierre, setFormularioCierre] = useState(cierreInicial);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarCierre, setMostrarCierre] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const resumenCierre = useMemo(() => calcularResumenCaja(cajaActual), [cajaActual]);
  const montoContadoNumero = Number(formularioCierre.montoContado || 0);
  const diferenciaCierre = formularioCierre.montoContado === ""
    ? null
    : roundMoney(montoContadoNumero - resumenCierre.montoEsperado);

  async function cargarCaja() {
    setCargando(true);
    setError("");

    try {
      if (modo === "historial") {
        const historialData = tipoHistorial === "archivado" ? await obtenerCajasArchivadas() : await obtenerCajas();
        setCajas(historialData);
      } else {
        const actualData = await obtenerCajaActual();
        setCajaActual(actualData.caja || null);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo cargar la información de caja.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarCaja();
    // The loader follows the selected view and history range.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, tipoHistorial]);

  useEffect(() => {
    if (modo !== "actual" || cargando) return;

    const accion = searchParams.get("accion") || "";
    if (!accion || accionProcesada.current === accion) return;

    accionProcesada.current = accion;

    if (accion === "abrir" && !cajaActual) {
      setFormulario(formularioInicial);
      setMensaje("");
      setError("");
      setMostrarFormulario(true);
    }

    if (accion === "cerrar" && cajaActual) {
      setFormularioCierre(cierreInicial);
      setMensaje("");
      setError("");
      setMostrarCierre(true);
    }
  }, [modo, cargando, cajaActual, searchParams]);

  function cerrarSesion() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsuario");
    navigate("/login");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  }

  function handleCierreChange(event) {
    const { name, value } = event.target;
    setFormularioCierre((actual) => ({ ...actual, [name]: value }));
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

  function abrirModalCierre() {
    if (!cajaActual) return;
    setFormularioCierre(cierreInicial);
    setMensaje("");
    setError("");
    setMostrarCierre(true);
  }

  function cerrarModalCierre() {
    if (guardando) return;
    setMostrarCierre(false);
    setFormularioCierre(cierreInicial);
  }

  async function guardarAperturaCaja(event) {
    event.preventDefault();
    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      await abrirCaja(formulario);
      setMostrarFormulario(false);
      setFormulario(formularioInicial);
      setMensaje("Caja abierta correctamente.");
      navigate("/admin/caja", { replace: true });
      await cargarCaja();
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

  async function guardarCierreCaja(event) {
    event.preventDefault();
    if (!cajaActual) return;

    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      const resultado = await cerrarCaja(formularioCierre);
      setMostrarCierre(false);
      setFormularioCierre(cierreInicial);
      setMensaje(resultado.mensaje || "Caja cerrada correctamente.");
      navigate("/admin/caja", { replace: true });
      await cargarCaja();
    } catch (err) {
      if (err.response?.status === 401) {
        cerrarSesion();
        return;
      }
      setError(err.response?.data?.mensaje || "No se pudo cerrar la caja registradora.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <AdminNavbar
        usuario={usuario}
        showToolbar
        forceToolbar
        sectionTitle="Caja"
        showNewButton={false}
        showEditDelete={false}
        showSearch={false}
        showToolbarActions={false}
        showViewToggle={false}
      />
      <main className="admin-page caja-page">
        <header className="admin-header">
          <div>
            <h2>{modo === "historial" ? "Historial de cajas" : "Gestión de Caja"}</h2>
          </div>
        </header>

        {mensaje && <p className="success-message admin-feedback">{mensaje}</p>}
        {error && !mostrarFormulario && !mostrarCierre && <p className="error-message admin-feedback">{error}</p>}

        {cargando && <section className="sales-panel compact-sales-panel"><p>Consultando caja...</p></section>}

        {!cargando && modo === "actual" && renderCajaActual()}
        {!cargando && modo === "historial" && renderHistorial()}
      </main>

      {mostrarFormulario && renderModalApertura()}
      {mostrarCierre && renderModalCierre()}
    </>
  );

  function renderCajaActual() {
    return (
      <section className="caja-layout caja-layout-single">
        <article className="sales-panel cash-dashboard-panel caja-current-panel">
          {cajaActual ? (
            <div className="cash-dashboard-card caja-card-light">
              <div className="cash-dashboard-title">
                <h3>Caja actual</h3>
                <span>Por cerrar</span>
              </div>
              <button className="admin-primary" type="button" onClick={() => navigate("/admin/ventas/nueva")}>Seguir vendiendo</button>
              <button className="admin-secondary danger-action" type="button" onClick={abrirModalCierre} disabled={guardando}>Cerrar caja</button>
              <dl className="cash-dashboard-summary">
                <div><dt>Trabajador</dt><dd>{cajaActual.nombreTrabajador || "-"}</dd></div>
                <div><dt>Estado</dt><dd>{cajaActual.estado}</dd></div>
                <div><dt>Apertura</dt><dd>{formatDateTime(cajaActual.abiertaEn)}</dd></div>
                <div><dt>Monto inicial</dt><dd>{formatMoney(cajaActual.montoInicial)}</dd></div>
                <div><dt>Vendido</dt><dd>{formatMoney(cajaActual.vendido)}</dd></div>
                <div><dt>Entradas</dt><dd>{formatMoney(cajaActual.ingresosManuales)}</dd></div>
                <div><dt>Salidas</dt><dd>{formatMoney(cajaActual.egresosManuales)}</dd></div>
                <div><dt>Esperado en caja</dt><dd>{formatMoney(cajaActual.montoEsperado)}</dd></div>
                <div><dt>Ventas</dt><dd>{Number(cajaActual.ventas || 0)}</dd></div>
              </dl>
            </div>
          ) : (
            <div className="cash-empty-state">
              <h3>Caja actual</h3>
              <p>No existe una caja registradora abierta.</p>
              <button className="admin-primary" type="button" onClick={abrirFormularioCaja}>Abrir caja registradora</button>
            </div>
          )}
        </article>
      </section>
    );
  }

  function renderHistorial() {
    return (
      <section className="caja-layout caja-layout-history">
        <section className="productos-admin-list caja-history-panel">
          <div className="history-panel-header">
            <h3>{tipoHistorial === "archivado" ? "Cajas archivadas" : "Cajas recientes"}</h3>
            <label className="reports-period-select">
              Historial
              <select value={tipoHistorial} onChange={(event) => setTipoHistorial(event.target.value)}>
                <option value="reciente">Historial reciente</option>
                <option value="archivado">Historial archivado</option>
              </select>
            </label>
          </div>
          {cajas.length === 0 ? (
            <p>No hay cajas registradas.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table caja-table">
                <thead>
                  <tr>
                    <th>Trabajador</th>
                    <th>Estado</th>
                    <th>Apertura</th>
                    <th>Cierre</th>
                    <th>Inicial</th>
                    <th>Vendido</th>
                    <th>Esperado</th>
                    <th>Contado</th>
                    <th>Diferencia</th>
                    <th>Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  {cajas.map((caja) => (
                    <tr key={caja.id}>
                      <td><strong>{caja.nombreTrabajador}</strong></td>
                      <td>{caja.estado}</td>
                      <td>{formatDateTime(caja.abiertaEn)}</td>
                      <td>{caja.cerradaEn ? formatDateTime(caja.cerradaEn) : "-"}</td>
                      <td>{formatMoney(caja.montoInicial)}</td>
                      <td>{formatMoney(caja.vendido)}</td>
                      <td>{caja.montoEsperado === null ? "-" : formatMoney(caja.montoEsperado)}</td>
                      <td>{caja.montoContado === null ? "-" : formatMoney(caja.montoContado)}</td>
                      <td className={getDiferenciaClass(caja.diferencia)}>{caja.diferencia === null ? "-" : formatMoney(caja.diferencia)}</td>
                      <td>{Number(caja.ventas || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    );
  }

  function renderModalApertura() {
    return (
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
    );
  }

  function renderModalCierre() {
    return (
      <div className="product-modal-backdrop" role="presentation">
        <section className="product-modal cash-modal cash-close-modal" role="dialog" aria-modal="true" aria-labelledby="cash-close-title">
          <header className="product-modal-header">
            <h3 id="cash-close-title">Cerrar caja</h3>
            <button type="button" aria-label="Cerrar" onClick={cerrarModalCierre}>x</button>
          </header>

          <form className="producto-form compact-product-form cash-form" onSubmit={guardarCierreCaja}>
            <div className="cash-close-summary full-field">
              <div><span>Trabajador</span><strong>{cajaActual?.nombreTrabajador || "-"}</strong></div>
              <div><span>Monto inicial</span><strong>{formatMoney(cajaActual?.montoInicial)}</strong></div>
              <div><span>Efectivo</span><strong>{formatMoney(resumenCierre.totalEfectivo)}</strong></div>
              <div><span>Transferencia</span><strong>{formatMoney(resumenCierre.totalTransferencia)}</strong></div>
              <div><span>Entradas</span><strong>{formatMoney(resumenCierre.ingresosManuales)}</strong></div>
              <div><span>Salidas</span><strong>{formatMoney(resumenCierre.egresosManuales)}</strong></div>
              <div><span>Total vendido</span><strong>{formatMoney(resumenCierre.totalVendido)}</strong></div>
              <div><span>Esperado en caja</span><strong>{formatMoney(resumenCierre.montoEsperado)}</strong></div>
            </div>

            <label className="full-field">
              Efectivo contado
              <input name="montoContado" type="number" min="0" step="0.01" value={formularioCierre.montoContado} onChange={handleCierreChange} required autoFocus />
            </label>

            <label className="full-field">
              Diferencia
              <input value={diferenciaCierre === null ? "$0.00" : formatMoney(diferenciaCierre)} readOnly />
            </label>

            <label className="full-field">
              Observación
              <textarea name="observacionCierre" value={formularioCierre.observacionCierre} onChange={handleCierreChange} />
            </label>

            {error && <p className="error-message full-field">{error}</p>}

            <div className="form-actions full-field">
              <button className="admin-primary" type="submit" disabled={guardando || formularioCierre.montoContado === ""}>{guardando ? "Cerrando..." : "Confirmar cierre"}</button>
              <button className="admin-secondary" type="button" onClick={cerrarModalCierre} disabled={guardando}>Cancelar</button>
            </div>
          </form>
        </section>
      </div>
    );
  }
}

function calcularResumenCaja(caja) {
  const totalVendido = Number(caja?.vendido || 0);
  const totalEfectivo = Number(caja?.totalEfectivo || 0);
  const totalTransferencia = Number(caja?.totalTransferencia || 0);
  const ingresosManuales = Number(caja?.ingresosManuales || 0);
  const egresosManuales = Number(caja?.egresosManuales || 0);
  const montoInicial = Number(caja?.montoInicial || 0);
  const montoEsperado = caja?.montoEsperado === null || caja?.montoEsperado === undefined
    ? roundMoney(montoInicial + totalEfectivo + ingresosManuales - egresosManuales)
    : Number(caja.montoEsperado);

  return { totalVendido, totalEfectivo, totalTransferencia, ingresosManuales, egresosManuales, montoEsperado };
}

function getDiferenciaClass(value) {
  const diferencia = Number(value || 0);
  if (value === null || value === undefined || diferencia === 0) return "";
  return diferencia > 0 ? "cash-difference-positive" : "cash-difference-negative";
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
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


