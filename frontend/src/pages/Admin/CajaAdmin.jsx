import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import { abrirCaja, cerrarCaja, obtenerCajaActual, obtenerCajas } from "../../services/api";

const formularioInicial = {
  nombreTrabajador: "",
  montoInicial: "",
  observacion: "",
};

export default function CajaAdmin({ modo = "actual" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const accionProcesada = useRef("");
  const usuario = useMemo(() => localStorage.getItem("adminUsuario") || "admin", []);
  const [cajaActual, setCajaActual] = useState(null);
  const [cajas, setCajas] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargarCaja() {
    setCargando(true);
    setError("");

    try {
      if (modo === "historial") {
        const historialData = await obtenerCajas();
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
  }, [modo]);

  useEffect(() => {
    if (modo !== "actual" || cargando) return;

    const accion = searchParams.get("accion") || "";
    if (!accion || accionProcesada.current === accion) return;

    accionProcesada.current = accion;

    if (accion === "abrir" && !cajaActual) {
      abrirFormularioCaja();
    }

    if (accion === "cerrar" && cajaActual) {
      cerrarCajaActual();
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

  async function cerrarCajaActual() {
    if (!cajaActual) return;

    const confirmado = window.confirm("¿Desea cerrar la caja registradora?");
    if (!confirmado) return;

    setGuardando(true);
    setMensaje("");
    setError("");

    try {
      const resultado = await cerrarCaja();
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
      <AdminNavbar usuario={usuario} showToolbar={false} />
      <main className="admin-page caja-page">
        <header className="admin-header">
          <div>
            <h2>{modo === "historial" ? "Historial de cajas" : "Gestión de Caja"}</h2>
            <p>Administrador: {usuario}</p>
          </div>
        </header>

        {mensaje && <p className="success-message admin-feedback">{mensaje}</p>}
        {error && <p className="error-message admin-feedback">{error}</p>}

        {cargando && <section className="sales-panel compact-sales-panel"><p>Consultando caja...</p></section>}

        {!cargando && modo === "actual" && renderCajaActual()}
        {!cargando && modo === "historial" && renderHistorial()}
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
              <button className="admin-secondary danger-action" type="button" onClick={cerrarCajaActual} disabled={guardando}>Cerrar caja</button>
              <dl className="cash-dashboard-summary">
                <div><dt>Trabajador</dt><dd>{cajaActual.nombreTrabajador || "-"}</dd></div>
                <div><dt>Estado</dt><dd>{cajaActual.estado}</dd></div>
                <div><dt>Apertura</dt><dd>{formatDateTime(cajaActual.abiertaEn)}</dd></div>
                <div><dt>Monto inicial</dt><dd>${Number(cajaActual.montoInicial || 0).toFixed(2)}</dd></div>
                <div><dt>Vendido</dt><dd>${Number(cajaActual.vendido || 0).toFixed(2)}</dd></div>
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
          <h3>Cajas registradas</h3>
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
                      <td>${Number(caja.montoInicial || 0).toFixed(2)}</td>
                      <td>${Number(caja.vendido || 0).toFixed(2)}</td>
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