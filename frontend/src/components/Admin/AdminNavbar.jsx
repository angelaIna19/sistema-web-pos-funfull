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
  editButtonLabel = "Editar",
  deleteButtonLabel = "Eliminar",
  showEditButton = true,
  showDeleteButton = true,
  showEditDelete = true,
  showSearch = true,
  showToolbarActions = true,
  showNewButton = true,
  toolbarButtons = null,
}) {
  const location = useLocation();
  const pathname = location.pathname;
  const [mostrarProductos, setMostrarProductos] = useState(
    pathname.startsWith("/admin/productos") || pathname.startsWith("/admin/categorias") || pathname.startsWith("/admin/inventario")
  );
  const [menuAbierto, setMenuAbierto] = useState(null);

  const moduloActivo = pathname.startsWith("/admin/ventas")
    ? "ventas"
    : pathname.startsWith("/admin/caja")
      ? "caja"
      : pathname.startsWith("/admin/productos") || pathname.startsWith("/admin/categorias")
        ? "producto"
        : pathname.startsWith("/admin/inventario")
          ? "inventario"
          : pathname.startsWith("/admin/reportes")
            ? "reportes"
            : "";

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

  function triggerClass(modulo) {
    return moduloActivo === modulo ? "admin-menu-trigger is-active" : "admin-menu-trigger";
  }

  return (
    <header className="admin-topbar clean-admin-topbar" onMouseLeave={cerrarMenu}>
      <div className="admin-topbar-row primary">
        <div className="admin-app-title">
          <span className="admin-app-icon" aria-hidden="true">POS</span>
          <span>Punto de venta</span>
        </div>

        <nav className="admin-module-tabs" aria-label="Módulos administrativos">
          <div className="admin-menu-item" onMouseEnter={() => setMenuAbierto("ventas")}>
            <button className={triggerClass("ventas")} type="button">Ventas</button>
            {menuAbierto === "ventas" && (
              <div className="admin-dropdown-menu is-open" role="menu">
                <Link to="/admin/ventas/nueva" role="menuitem" onClick={cerrarMenu}>Nueva venta</Link>
                <Link to="/admin/ventas/historial" role="menuitem" onClick={cerrarMenu}>Historial de ventas</Link>
                <Link to="/admin/ventas/historial?modo=detalle" role="menuitem" onClick={cerrarMenu}>Detalle de ventas</Link>
                <Link to="/admin/ventas/historial?modo=anular" role="menuitem" onClick={cerrarMenu}>Anular venta</Link>
              </div>
            )}
          </div>

          <div className="admin-menu-item" onMouseEnter={() => setMenuAbierto("caja")}>
            <button className={triggerClass("caja")} type="button">Caja</button>
            {menuAbierto === "caja" && (
              <div className="admin-dropdown-menu is-open" role="menu">
                <Link to="/admin/caja" role="menuitem" onClick={cerrarMenu}>Caja actual</Link>
                <Link to="/admin/caja?accion=abrir" role="menuitem" onClick={cerrarMenu}>Abrir caja</Link>
                <Link to="/admin/caja?accion=cerrar" role="menuitem" onClick={cerrarMenu}>Cerrar caja</Link>
                <Link to="/admin/caja/historial" role="menuitem" onClick={cerrarMenu}>Historial de cajas</Link>
              </div>
            )}
          </div>

          <div className="admin-menu-item" onMouseEnter={() => setMenuAbierto("producto")}>
            <button className={triggerClass("producto")} type="button">Producto</button>
            {menuAbierto === "producto" && (
              <div className="admin-dropdown-menu is-open" role="menu">
                <Link to="/admin/productos" role="menuitem" onClick={abrirSeccionProductos}>Productos</Link>
                <Link to="/admin/categorias" role="menuitem" onClick={abrirSeccionProductos}>Categorías</Link>
              </div>
            )}
          </div>

          <div className="admin-menu-item" onMouseEnter={() => setMenuAbierto("inventario")}>
            <button className={triggerClass("inventario")} type="button">Inventario</button>
            {menuAbierto === "inventario" && (
              <div className="admin-dropdown-menu is-open" role="menu">
                <Link to="/admin/inventario/resumen" role="menuitem" onClick={abrirSeccionProductos}>Resumen de inventario</Link>
                <Link to="/admin/inventario/movimientos" role="menuitem" onClick={abrirSeccionProductos}>Movimientos de inventario</Link>
                <Link to="/admin/inventario/productos" role="menuitem" onClick={abrirSeccionProductos}>Detalle de producto</Link>
                <Link to="/admin/inventario/stock-bajo" role="menuitem" onClick={abrirSeccionProductos}>Stock bajo</Link>
              </div>
            )}
          </div>

          <div className="admin-menu-item" onMouseEnter={() => setMenuAbierto("reportes")}>
            <button className={triggerClass("reportes")} type="button">Reportes</button>
            {menuAbierto === "reportes" && (
              <div className="admin-dropdown-menu is-open" role="menu">
                <Link to="/admin/reportes/ventas" role="menuitem" onClick={cerrarMenu}>Reporte de ventas</Link>
                <Link to="/admin/reportes/ordenes" role="menuitem" onClick={cerrarMenu}>Órdenes</Link>
                <Link to="/admin/reportes/productos-mas-vendidos" role="menuitem" onClick={cerrarMenu}>Productos más vendidos</Link>
                <Link to="/admin/reportes/stock-bajo" role="menuitem" onClick={cerrarMenu}>Productos con stock bajo</Link>
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
          {Array.isArray(toolbarButtons) && toolbarButtons.length > 0 ? (
            toolbarButtons.map((button) => (
              <button
                key={button.label}
                className={button.className || "admin-toolbar-button"}
                type="button"
                onClick={button.onClick}
                disabled={button.disabled}
              >
                {button.label}
              </button>
            ))
          ) : showNewButton && (
            <button className="admin-new-button" type="button" onClick={abrirNuevoProducto}>{newButtonLabel}</button>
          )}

          {showEditDelete && (
            <>
              {showEditButton && (
                <button className="admin-toolbar-button" type="button" onClick={onEditProduct} disabled={!productoSeleccionado}>{editButtonLabel}</button>
              )}
              {showDeleteButton && (
                <button className="admin-toolbar-button danger" type="button" onClick={onDeleteProduct} disabled={!productoSeleccionado}>{deleteButtonLabel}</button>
              )}
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
              <button className="admin-filter-close" type="button" aria-label="Limpiar búsqueda" onClick={() => onSearchChange?.("")}>x</button>
              <input
                aria-label="Buscar"
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






