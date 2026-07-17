import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function AdminNavbar({
  usuario = "admin",
  onNewProduct,
  onEditProduct,
  onDeleteProduct,
  productoSeleccionado = false,
  terminoBusqueda = "",
  onSearchChange,
  vistaProductos = "tabla",
  onChangeVista,
  totalProductos = 0,
  sectionTitle = "Productos",
  searchFilter = "Punto de venta",
  showViewToggle = true,
  showToolbar = true,
  forceToolbar = false,
  newButtonLabel = "Nuevo",
  showEditDelete = true,
  showSearch = true,
  showToolbarActions = true,
}) {
  const location = useLocation();
  const [mostrarProductos, setMostrarProductos] = useState(
    location.pathname.startsWith("/admin/productos") || location.pathname.startsWith("/admin/categorias")
  );
  const [menuAbierto, setMenuAbierto] = useState(null);

  function cerrarMenu() {
    setMenuAbierto(null);
  }

  function abrirSeccionProductos() {
    setMostrarProductos(true);
    cerrarMenu();
  }

  function abrirNuevoProducto() {
    setMostrarProductos(true);
    onNewProduct?.();
  }

  function cambiarVista(vista) {
    setMostrarProductos(true);
    onChangeVista?.(vista);
  }

  return (
    <header className="admin-topbar clean-admin-topbar" onMouseLeave={cerrarMenu}>
      <div className="admin-topbar-row primary">
        <div className="admin-app-title">
          <span className="admin-app-icon" aria-hidden="true">POS</span>
          <span>Punto de venta</span>
        </div>

        <nav className="admin-module-tabs" aria-label="Modulos administrativos">
          <div className="admin-menu-item" onMouseEnter={() => setMenuAbierto("ventas")}>
            <button className="admin-menu-trigger" type="button">Ventas</button>
            {menuAbierto === "ventas" && (
              <div className="admin-dropdown-menu is-open" role="menu">
                <Link to="/admin/ventas/nueva" role="menuitem" onClick={cerrarMenu}>Nueva venta</Link>
                <button type="button" role="menuitem">Historial de ventas</button>
                <span className="admin-dropdown-label">Caja</span>
                <button type="button" role="menuitem">Abrir caja</button>
                <button type="button" role="menuitem">Cerrar caja</button>
              </div>
            )}
          </div>

          <div className="admin-menu-item" onMouseEnter={() => setMenuAbierto("producto")}>
            <button className="admin-menu-trigger" type="button">Producto</button>
            {menuAbierto === "producto" && (
              <div className="admin-dropdown-menu is-open" role="menu">
                <Link to="/admin/productos" role="menuitem" onClick={abrirSeccionProductos}>
                  Productos
                </Link>
                <Link to="/admin/categorias" role="menuitem" onClick={abrirSeccionProductos}>Categorias</Link>
              </div>
            )}
          </div>

          <div className="admin-menu-item" onMouseEnter={() => setMenuAbierto("inventario")}>
            <button className="admin-menu-trigger" type="button">Inventario</button>
            {menuAbierto === "inventario" && (
              <div className="admin-dropdown-menu is-open" role="menu">
                <button type="button" role="menuitem">Entradas</button>
                <button type="button" role="menuitem">Salidas</button>
                <button type="button" role="menuitem">Ajustes de inventario</button>
                <button type="button" role="menuitem">Stock bajo</button>
              </div>
            )}
          </div>

          <div className="admin-menu-item" onMouseEnter={() => setMenuAbierto("reportes")}>
            <button className="admin-menu-trigger" type="button">Reportes</button>
            {menuAbierto === "reportes" && (
              <div className="admin-dropdown-menu is-open" role="menu">
                <button type="button" role="menuitem">Reporte de ventas</button>
                <button type="button" role="menuitem">Productos mas vendidos</button>
                <button type="button" role="menuitem">Productos con stock bajo</button>
              </div>
            )}
          </div>
        </nav>

        <div className="admin-topbar-fill" />

        <span className="admin-user-name">{usuario}</span>
        <span className="admin-user-badge" aria-hidden="true">C</span>
      </div>

      {showToolbar && (mostrarProductos || forceToolbar) && (
        <div className="admin-topbar-row secondary">
          <button className="admin-new-button" type="button" onClick={abrirNuevoProducto}>{newButtonLabel}</button>

          {showEditDelete && (
            <>
              <button className="admin-toolbar-button" type="button" onClick={onEditProduct} disabled={!productoSeleccionado}>Editar</button>
              <button className="admin-toolbar-button danger" type="button" onClick={onDeleteProduct} disabled={!productoSeleccionado}>Eliminar</button>
            </>
          )}

          {sectionTitle && (
            <div className="admin-section-title">
              <span>{sectionTitle}</span>
            </div>
          )}

          {showSearch && (
            <div className="admin-search-box">
              <span aria-hidden="true">Buscar</span>
              <span className="admin-filter-chip">{searchFilter}</span>
              <button className="admin-filter-close" type="button" aria-label="Limpiar busqueda" onClick={() => onSearchChange?.("")}>x</button>
              <input
                aria-label="Buscar producto"
                placeholder="Buscar..."
                value={terminoBusqueda}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
            </div>
          )}

          {showToolbarActions && (
            <div className="admin-toolbar-actions">
              <span>{totalProductos ? `1-${totalProductos} / ${totalProductos}` : "0-0 / 0"}</span>
              <button type="button" aria-label="Anterior">&lt;</button>
              <button type="button" aria-label="Siguiente">&gt;</button>
              {showViewToggle && (
                <button
                  className={vistaProductos === "kanban" ? "is-active" : ""}
                  type="button"
                  aria-label="Vista kanban"
                  title="Vista kanban"
                  onClick={() => cambiarVista("kanban")}
                >
                  []
                </button>
              )}
              {showViewToggle && (
                <button
                  className={vistaProductos === "tabla" ? "is-active" : ""}
                  type="button"
                  aria-label="Vista tabla"
                  title="Vista tabla"
                  onClick={() => cambiarVista("tabla")}
                >
                  =
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}