const reportService = require("./report.service");

async function cashBoxSales(req, res) {
  try {
    const reporte = await reportService.cashBoxSalesReport(req.query.cajaId);
    res.json(reporte);
  } catch (error) {
    res.status(error.status || 503).json({ mensaje: error.status ? error.message : "No se pudo cargar el reporte de ventas por caja." });
  }
}

async function sales(req, res) {
  try {
    const reporte = await reportService.salesReport();
    res.json(reporte);
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo cargar el reporte de ventas." });
  }
}

async function orders(req, res) {
  try {
    const reporte = await reportService.ordersReport(req.query.periodo);
    res.json(reporte);
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo cargar el reporte de órdenes." });
  }
}

async function topProducts(req, res) {
  try {
    const productos = await reportService.topProducts();
    res.json(productos);
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo cargar el reporte de productos más vendidos." });
  }
}

async function lowStock(req, res) {
  try {
    const productos = await reportService.lowStockProducts();
    res.json(productos);
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo cargar el reporte de productos con stock bajo." });
  }
}

module.exports = { cashBoxSales, lowStock, orders, sales, topProducts };

