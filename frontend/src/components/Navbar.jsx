import { Link } from "react-router-dom";
import logoFunFull from "../assets/logo-funfull.png";

export default function Navbar() {
  return (
    <nav className="main-nav">
      <div className="nav-links">
        <Link to="/">Inicio</Link>
        <Link to="/catalogo">Catálogo</Link>
      </div>

      <div className="nav-right">
        <Link className="nav-session" to="/login" aria-label="Iniciar sesión">
          <span aria-hidden="true">👤</span>
          <span>Iniciar sesión</span>
        </Link>
        <div className="nav-brand">
          <img src={logoFunFull} alt="" />
          <span>Licorería Fun Full</span>
        </div>
      </div>
    </nav>
  );
}
