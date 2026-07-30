const reportRepository = require("./report.repository");

const PERIODOS_ORDENES = new Set(["dia", "semana", "quincena", "mes"]);

async function cashBoxSalesReport(cajaId) {
  const id = Number(cajaId);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("Seleccione una caja válida.");
    error.status = 400;
    throw error;
  }

  const reporte = await reportRepository.getCashBoxSalesReport(id);
  if (!reporte) {
    const error = new Error("Caja no encontrada.");
    error.status = 404;
    throw error;
  }

  return reporte;
}

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

module.exports = { cashBoxSalesReport, lowStockProducts, ordersReport, salesReport, topProducts };

