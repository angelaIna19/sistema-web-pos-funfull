const express = require("express");
const cors = require("cors");
const { query } = require("./config/db");
const authRoutes = require("./modules/auth/auth.routes");
const productRoutes = require("./modules/products/product.routes");
const categoryRoutes = require("./modules/categories/category.routes");
const cashRegisterRoutes = require("./modules/cashRegister/cashRegister.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({ mensaje: "API de Licorería Fun Full" });
});

app.get("/api/health", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({ estado: "ok", baseDatos: "PostgreSQL conectada" });
  } catch (error) {
    res.status(503).json({ estado: "error", mensaje: "No se pudo conectar con PostgreSQL." });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api", productRoutes);
app.use("/api", categoryRoutes);
app.use("/api", cashRegisterRoutes);

module.exports = app;

