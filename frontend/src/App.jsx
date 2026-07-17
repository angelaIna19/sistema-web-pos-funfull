import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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

