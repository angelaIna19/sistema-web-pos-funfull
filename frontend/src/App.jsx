import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RutaProtegida from "./components/Admin/RutaProtegida";
import Inicio from "./pages/Publico/Inicio";
import Catalogo from "./pages/Publico/Catalogo";
import DetalleProducto from "./pages/Publico/DetalleProducto";
import Login from "./pages/Admin/Login";
import ProductosAdmin from "./pages/Admin/ProductosAdmin";
import CategoriasAdmin from "./pages/Admin/CategoriasAdmin";
import NuevaVentaAdmin from "./pages/Admin/NuevaVentaAdmin";
import VentasHistorialAdmin from "./pages/Admin/VentasHistorialAdmin";
import CajaAdmin from "./pages/Admin/CajaAdmin";
import InventarioAdmin from "./pages/Admin/InventarioAdmin";
import ReportesAdmin from "./pages/Admin/ReportesAdmin";
import "./App.css";

function AppLayout() {
  const { pathname } = useLocation();
  const ocultarLayout = pathname === "/login" || pathname.startsWith("/admin");

  return (
    <>
      {!ocultarLayout && <Navbar />}
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/producto/:id" element={<DetalleProducto />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin/productos"
          element={
            <RutaProtegida>
              <ProductosAdmin />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/categorias"
          element={
            <RutaProtegida>
              <CategoriasAdmin />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/caja/historial"
          element={
            <RutaProtegida>
              <CajaAdmin modo="historial" />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/caja"
          element={
            <RutaProtegida>
              <CajaAdmin />
            </RutaProtegida>
          }
        />
        <Route path="/admin/inventario" element={<Navigate to="/admin/inventario/resumen" replace />} />
        <Route path="/admin/inventario/entradas" element={<Navigate to="/admin/inventario/movimientos" replace />} />
        <Route path="/admin/inventario/salidas" element={<Navigate to="/admin/inventario/movimientos" replace />} />
        <Route path="/admin/inventario/ajustes" element={<Navigate to="/admin/inventario/movimientos" replace />} />
        <Route
          path="/admin/inventario/resumen"
          element={
            <RutaProtegida>
              <InventarioAdmin modo="resumen" />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/inventario/movimientos"
          element={
            <RutaProtegida>
              <InventarioAdmin modo="movimientos" />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/inventario/productos"
          element={
            <RutaProtegida>
              <InventarioAdmin modo="detalle-producto" />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/inventario/stock-bajo"
          element={
            <RutaProtegida>
              <InventarioAdmin modo="stock-bajo" />
            </RutaProtegida>
          }
        />
        <Route path="/admin/reportes" element={<Navigate to="/admin/reportes/ventas" replace />} />
        <Route
          path="/admin/reportes/ventas"
          element={
            <RutaProtegida>
              <ReportesAdmin modo="ventas" />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/reportes/ordenes"
          element={
            <RutaProtegida>
              <ReportesAdmin modo="ordenes" />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/reportes/productos-mas-vendidos"
          element={
            <RutaProtegida>
              <ReportesAdmin modo="productos-mas-vendidos" />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/reportes/stock-bajo"
          element={
            <RutaProtegida>
              <ReportesAdmin modo="stock-bajo" />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/ventas/historial"
          element={
            <RutaProtegida>
              <VentasHistorialAdmin />
            </RutaProtegida>
          }
        />
        <Route
          path="/admin/ventas/nueva"
          element={
            <RutaProtegida>
              <NuevaVentaAdmin />
            </RutaProtegida>
          }
        />
      </Routes>
      {!ocultarLayout && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}





