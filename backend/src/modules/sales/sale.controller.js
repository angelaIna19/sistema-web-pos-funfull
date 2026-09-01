const saleService = require("./sale.service");

async function create(req, res) {
  try {
    const venta = await saleService.createSale(req.admin, req.body);
    res.status(201).json(venta);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo registrar la venta.",
    });
  }
}

async function list(req, res) {
  try {
    const ventas = await saleService.listSales();
    res.json(ventas);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo cargar el historial de ventas.",
    });
  }
}

async function archived(req, res) {
  try {
    const ventas = await saleService.listSales(true);
    res.json(ventas);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo cargar el historial archivado de ventas.",
    });
  }
}

async function detail(req, res) {
  try {
    const venta = await saleService.getSaleDetail(req.params.id);
    res.json(venta);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo cargar el detalle de la venta.",
    });
  }
}

async function cancel(req, res) {
  try {
    const venta = await saleService.cancelSale(req.params.id, req.body);
    res.json(venta);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo anular la venta.",
    });
  }
}

module.exports = { archived, cancel, create, list, detail };
