import { Link } from "react-router-dom";
import logoFunFull from "../../assets/logo-funfull.png";
import fondoLicoreria from "../../assets/fondo-licoreria.png";

export default function Inicio() {
  return (
    <main className="inicio-page public-home">
      <section className="home-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(5, 5, 6, 0.9), rgba(5, 5, 6, 0.58)), url(${fondoLicoreria})` }}>
        <div className="home-hero-inner">
          <img className="home-hero-logo" src={logoFunFull} alt="Licorería Fun Full" />
          <div className="home-hero-copy">
            <p className="home-eyebrow">Licorería Fun Full</p>
            <h1>Cada botella tiene un momento para disfrutar</h1>
            <p>
              Explora nuestro catálogo informativo y conoce las bebidas disponibles antes de visitarnos.
            </p>
            <Link className="primary-button home-cta" to="/catalogo">
              Ver Catálogo
            </Link>
          </div>
        </div>
      </section>

      <section className="home-about" id="quienes-somos">
        <div>
          <span className="section-kicker">Somos Fun Full</span>
          <h2>Una licorería pensada para elegir con confianza</h2>
        </div>
        <p>
          En Licorería Fun Full reunimos productos para celebraciones, reuniones y momentos especiales. Nuestra aplicación web permite consultar categorías, precios y disponibilidad de forma sencilla, sin convertir la experiencia en una tienda online.
        </p>
      </section>

      <section className="home-feature-band" style={{ backgroundImage: `linear-gradient(90deg, rgba(9, 9, 10, 0.86), rgba(9, 9, 10, 0.42)), url(${fondoLicoreria})` }}>
        <div className="home-feature-copy">
          <span className="section-kicker">Selección disponible</span>
          <h2>Más que bebidas, una elección para cada ocasión</h2>
          <p>
            Cerveza, ron, whisky, tequila y otras categorías se organizan para que el cliente pueda revisar el catálogo de manera rápida y clara.
          </p>
        </div>
      </section>

      <section className="home-info-grid" aria-label="Información de la licorería">
        <article>
          <strong>Catálogo actualizado</strong>
          <p>Productos organizados por categoría para consultar disponibilidad y precio de venta.</p>
        </article>
        <article>
          <strong>Atención cercana</strong>
          <p>Una experiencia simple para conocer opciones antes de comprar en el punto de venta.</p>
        </article>
        <article>
          <strong>Variedad de marcas</strong>
          <p>Selección de bebidas para distintos gustos, presupuestos y ocasiones.</p>
        </article>
      </section>

      <section className="home-location" id="ubicacion">
        <span className="section-kicker">Visítanos</span>
        <h2>Estamos en Machala</h2>
        <p>
          Nos encuentras en Arizaga y Buenavista. Atendemos de lunes a sábado,
          de 2:00 p. m. a 2:00 a. m.
        </p>
      </section>
      <section className="home-category-strip">
        <span>Cervezas</span>
        <span>Ron</span>
        <span>Whisky</span>
        <span>Tequila</span>
        <span>Vodka</span>
      </section>
    </main>
  );
}
