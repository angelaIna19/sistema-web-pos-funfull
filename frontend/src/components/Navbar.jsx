import { NavLink } from "react-router-dom";
import logoFunFull from "../assets/logo-funfull.png";

export default function Navbar() {
  return (
    <nav className="main-nav">
      <div className="nav-links">
        <NavLink to="/" end>Inicio</NavLink>
        <NavLink to="/catalogo">Catálogo</NavLink>
      </div>

      <div className="nav-right">
        <LinkLogin />
        <div className="nav-brand">
          <img src={logoFunFull} alt="" />
          <span>Licorería Fun Full</span>
        </div>
      </div>
    </nav>
  );
}

function LinkLogin() {
  return (
    <NavLink className="nav-session" to="/login" aria-label="Iniciar sesión">
      <span aria-hidden="true">👤</span>
      <span>Iniciar sesión</span>
    </NavLink>
  );
}