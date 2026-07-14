import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoFunFull from "../../assets/logo-funfull.png";
import { iniciarSesion } from "../../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [recordarme, setRecordarme] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const resetAutofill = setTimeout(() => {
      setUsuario("");
      setPassword("");
    }, 150);

    return () => clearTimeout(resetAutofill);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setCargando(true);

    try {
      const sesion = await iniciarSesion(usuario, password);
      localStorage.setItem("adminToken", sesion.token);
      localStorage.setItem("adminUsuario", sesion.usuario);
      localStorage.setItem("recordarAdmin", recordarme ? "si" : "no");
      navigate("/admin/productos");
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <img className="login-logo" src={logoFunFull} alt="Licorería Fun Full" />
        <h2>Acceso Administrador</h2>
        <p className="login-subtitle">Ingresa tus credenciales para continuar</p>

        <form onSubmit={handleSubmit} autoComplete="off">
          <label className="login-field">
            <span>Usuario</span>
            <div className="login-input-wrap">
              <span className="login-icon" aria-hidden="true">♙</span>
              <input
                name="funfull_usuario"
                value={usuario}
                onChange={(event) => setUsuario(event.target.value)}
                autoComplete="off"
                required
              />
            </div>
          </label>

          <label className="login-field">
            <span>Contraseña</span>
            <div className="login-input-wrap">
              <span className="login-icon" aria-hidden="true">▣</span>
              <input
                name="funfull_clave"
                type={mostrarPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setMostrarPassword((actual) => !actual)}
                aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {mostrarPassword ? "◉" : "◎"}
              </button>
            </div>
          </label>

          <div className="login-options">
            <label className="remember-row">
              <input
                type="checkbox"
                checked={recordarme}
                onChange={(event) => setRecordarme(event.target.checked)}
              />
              <span>Recordarme</span>
            </label>
            <a href="#recuperar" onClick={(event) => event.preventDefault()}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button className="login-submit" type="submit" disabled={cargando}>
            <span aria-hidden="true">↪</span>
            {cargando ? "Validando..." : "Iniciar sesión"}
          </button>
        </form>

        <div className="login-divider"><span>o</span></div>

        <div className="login-access-note">
          <span aria-hidden="true">♢</span>
          <div>
            <strong>Acceso exclusivo para administradores</strong>
            <p>Si no tienes permisos, contacta al propietario del sistema.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
