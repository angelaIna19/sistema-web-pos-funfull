const inventoryService = require("./inventory.service");

async function summary(req, res) {
  try {
    const resumen = await inventoryService.getSummary();
    res.json(resumen);
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo cargar el resumen de inventario." });
  }
}

async function productDetail(req, res) {
  try {
    const detalle = await inventoryService.getProductDetail(req.params.id);
    res.json(detalle);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo cargar el detalle del producto.",
    });
  }
}

async function movements(req, res) {
  try {
    const movimientos = await inventoryService.listMovements();
    res.json(movimientos);
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo cargar el historial de inventario." });
  }
}

async function lowStock(req, res) {
  try {
    const productos = await inventoryService.listLowStock();
    res.json(productos);
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo cargar el stock bajo." });
  }
}

async function entry(req, res) {
  try {
    const resultado = await inventoryService.registerEntry(req.admin, req.body);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo registrar la entrada de inventario.",
    });
  }
}

async function exit(req, res) {
  try {
    const resultado = await inventoryService.registerExit(req.admin, req.body);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo registrar la salida de inventario.",
    });
  }
}

async function adjustment(req, res) {
  try {
    const resultado = await inventoryService.registerAdjustment(req.admin, req.body);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo registrar el ajuste de inventario.",
    });
  }
}

module.exports = { adjustment, entry, exit, lowStock, movements, productDetail, summary };
