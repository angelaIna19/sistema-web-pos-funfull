import { Navigate } from "react-router-dom";

export default function RutaProtegida({ children }) {
  const token = localStorage.getItem("adminToken");
  return token ? children : <Navigate to="/login" replace />;
}
