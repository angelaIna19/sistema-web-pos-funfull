import { Link } from "react-router-dom";
import logoFunFull from "../../assets/logo-funfull.png";

// Página de inicio pública con llamada a la acción al catálogo.
export default function Inicio() {
  return (
    <main className="inicio-page">
      <section className="inicio-hero">
        {/* Logo principal de la tienda en la página de bienvenida */}
        <img className="inicio-logo" src={logoFunFull} alt="Licorería Fun Full" />

        <div className="inicio-copy">
          <h1>Bienvenidos a Licorería Fun Full</h1>
          <p>Conoce nuestros productos destacados antes de realizar tu compra.</p>
          <Link className="primary-button" to="/catalogo">
            Ver Catálogo
          </Link>
        </div>
      </section>
    </main>
  );
}
