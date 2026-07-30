const reportRepository = require("./report.repository");

const PERIODOS_ORDENES = new Set(["dia", "semana", "quincena", "mes"]);

async function salesReport() {
  return reportRepository.getSalesReport();
}

async function ordersReport(periodo = "mes") {
  const periodoNormalizado = String(periodo || "mes").trim().toLowerCase();
  const periodoValido = PERIODOS_ORDENES.has(periodoNormalizado) ? periodoNormalizado : "mes";
  return reportRepository.getOrdersReport(periodoValido);
}

async function topProducts() {
  return reportRepository.getTopProducts();
}

async function lowStockProducts() {
  return reportRepository.getLowStockProducts();
}

module.exports = { lowStockProducts, ordersReport, salesReport, topProducts };
