import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import { actualizarMisCredenciales, obtenerMiCuenta } from "../../services/api";

export default function CuentaAdmin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [usuarioActual, setUsuarioActual] = useState(localStorage.getItem("adminUsuario") || "admin");
  const [nuevoUsuario, setNuevoUsuario] = useState(usuarioActual);
  const [passwordActual, setPasswordActual] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarCuenta() {
      try {
        const cuenta = await obtenerMiCuenta();
        if (!activo) return;
        setUsuarioActual(cuenta.usuario);
        setNuevoUsuario(cuenta.usuario);
        localStorage.setItem("adminUsuario", cuenta.usuario);
      } catch (err) {
        if (activo) setError(err.response?.data?.mensaje || "No se pudo cargar la cuenta.");
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarCuenta();

    const limpiarAutocompletado = window.setTimeout(() => {
      if (!activo) return;
      setPasswordActual("");
      setNuevoPassword("");
      setConfirmarPassword("");
    }, 150);

    return () => {
      activo = false;
      window.clearTimeout(limpiarAutocompletado);
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMensaje("");
    setError("");

    const usuarioLimpio = nuevoUsuario.trim();

    if (!usuarioLimpio) {
      setError("Ingrese el nuevo usuario.");
      return;
    }

    if (nuevoPassword && nuevoPassword !== confirmarPassword) {
      setError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }

    setGuardando(true);

    try {
      const cuenta = await actualizarMisCredenciales({
        usuario: usuarioLimpio,
        passwordActual,
        nuevoPassword: nuevoPassword || undefined,
      });

      localStorage.setItem("adminUsuario", cuenta.usuario);
      setUsuarioActual(cuenta.usuario);
      setNuevoUsuario(cuenta.usuario);
      setPasswordActual("");
      setNuevoPassword("");
      setConfirmarPassword("");
      setMensaje(cuenta.mensaje || "Credenciales actualizadas correctamente.");
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudieron actualizar las credenciales.");
    } finally {
      setGuardando(false);
    }
  }

  function limpiarFormulario() {
    setNuevoUsuario(usuarioActual);
    setPasswordActual("");
    setNuevoPassword("");
    setConfirmarPassword("");
    setError("");
    setMensaje("");
  }

  function cancelarCuenta() {
    const rutaAnterior = location.state?.from || "/admin/productos";
    limpiarFormulario();
    navigate(rutaAnterior, { replace: true });
  }

  return (
    <>
      <AdminNavbar usuario={usuarioActual} sectionTitle="Mi cuenta" showToolbar={false} />
      <main className="admin-page account-page">
        <section className="admin-header">
          <h1>Mi cuenta</h1>
          <p>Administrador: {usuarioActual}</p>
        </section>

        <section className="account-card">
          <h2>Credenciales del administrador</h2>
          <p className="account-hint">Actualiza el usuario o cambia la contraseña usando tu contraseña actual.</p>

          {cargando ? (
            <p>Cargando cuenta...</p>
          ) : (
            <form className="account-form" onSubmit={handleSubmit} autoComplete="off">
              <div className="account-form-grid">
                <label className="account-field">
                  <span>Usuario actual</span>
                  <input value={usuarioActual} readOnly autoComplete="off" />
                </label>

                <label className="account-field">
                  <span>Nuevo usuario</span>
                  <input
                    value={nuevoUsuario}
                    onChange={(event) => setNuevoUsuario(event.target.value)}
                    autoComplete="off"
                    name="nuevo-usuario-admin"
                    required
                  />
                </label>

                <label className="account-field">
                  <span>Contraseña actual</span>
                  <input
                    type="password"
                    name="password-actual-manual"
                    value={passwordActual}
                    onChange={(event) => setPasswordActual(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Escribe tu contraseña actual"
                    required
                  />
                </label>

                <label className="account-field">
                  <span>Nueva contraseña</span>
                  <input
                    type="password"
                    name="nueva-password-admin"
                    value={nuevoPassword}
                    onChange={(event) => setNuevoPassword(event.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>

                <label className="account-field full">
                  <span>Confirmar nueva contraseña</span>
                  <input
                    type="password"
                    name="confirmar-nueva-password-admin"
                    value={confirmarPassword}
                    onChange={(event) => setConfirmarPassword(event.target.value)}
                    required={Boolean(nuevoPassword)}
                    minLength={nuevoPassword ? 8 : undefined}
                    autoComplete="new-password"
                  />
                </label>
              </div>

              {mensaje && <p className="success-message">{mensaje}</p>}
              {error && <p className="error-message">{error}</p>}

              <div className="account-actions">
                <button className="admin-toolbar-button" type="button" onClick={cancelarCuenta}>Cancelar</button>
                <button className="admin-new-button" type="submit" disabled={guardando}>
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </>
  );
}
