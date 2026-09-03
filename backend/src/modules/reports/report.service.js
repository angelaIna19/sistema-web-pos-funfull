const reportRepository = require("./report.repository");

const PERIODOS_ORDENES = new Set(["dia", "semana", "quincena", "mes"]);
const PERIODOS_VENTAS = new Set(["semana", "quincena", "mes", "mes-anterior", "personalizado", "todo"]);

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

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function getCurrentDateRange() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  return {
    start: `${year}-01-01`,
    today: `${year}-${month}-${day}`,
    year,
  };
}

async function salesReport(periodo = "mes", desde, hasta) {
  const periodoNormalizado = String(periodo || "mes").trim().toLowerCase();
  const periodoValido = PERIODOS_VENTAS.has(periodoNormalizado) ? periodoNormalizado : "mes";

  if (periodoValido === "personalizado") {
    if (!isValidDate(desde) || !isValidDate(hasta)) {
      throw createReportError("Seleccione fechas válidas para Desde y Hasta.", 400);
    }

    if (desde > hasta) {
      throw createReportError("La fecha Desde no puede ser posterior a la fecha Hasta.", 400);
    }

    const currentRange = getCurrentDateRange();
    if (desde < currentRange.start || hasta > currentRange.today) {
      throw createReportError(
        `El período personalizado solo permite fechas del año ${currentRange.year} hasta hoy.`,
        400,
      );
    }
  }

  return reportRepository.getSalesReport(periodoValido, desde, hasta);
}

function createReportError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
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

