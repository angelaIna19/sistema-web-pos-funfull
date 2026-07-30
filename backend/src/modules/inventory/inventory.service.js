const inventoryRepository = require("./inventory.repository");

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function normalizeProductId(value) {
  const productoId = Number(value);
  if (!Number.isInteger(productoId) || productoId <= 0) {
    validationError("Debe seleccionar un producto válido.");
  }
  return productoId;
}

function normalizeQuantity(value, label = "La cantidad") {
  const cantidad = Number(value);
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    validationError(`${label} debe ser un número entero mayor a 0.`);
  }
  return cantidad;
}

function normalizeStockFinal(value) {
  const stockFinal = Number(value);
  if (!Number.isInteger(stockFinal) || stockFinal < 0) {
    validationError("El stock final debe ser un número entero mayor o igual a 0.");
  }
  return stockFinal;
}

function normalizeMotivo(value) {
  const motivo = String(value || "").trim();
  if (!motivo) {
    validationError("El motivo del movimiento es obligatorio.");
  }
  return motivo;
}

async function getSummary() {
  return inventoryRepository.getSummary();
}

async function getProductDetail(id) {
  const detalle = await inventoryRepository.findProductDetail(normalizeProductId(id));
  if (!detalle) {
    const error = new Error("Producto no encontrado.");
    error.status = 404;
    throw error;
  }
  return detalle;
}

async function listMovements() {
  return inventoryRepository.findMovements();
}

async function listLowStock() {
  return inventoryRepository.findLowStock();
}

async function registerEntry(admin, body = {}) {
  const movimiento = await inventoryRepository.createMovement({
    usuarioId: admin.id,
    usuario: admin.usuario,
    productoId: normalizeProductId(body.productoId),
    tipo: "ENTRADA",
    cantidad: normalizeQuantity(body.cantidad),
    motivo: normalizeMotivo(body.motivo),
  });

  return { movimiento, mensaje: "Entrada de inventario registrada correctamente." };
}

async function registerExit(admin, body = {}) {
  const movimiento = await inventoryRepository.createMovement({
    usuarioId: admin.id,
    usuario: admin.usuario,
    productoId: normalizeProductId(body.productoId),
    tipo: "SALIDA",
    cantidad: normalizeQuantity(body.cantidad),
    motivo: normalizeMotivo(body.motivo),
  });

  return { movimiento, mensaje: "Salida de inventario registrada correctamente." };
}

async function registerAdjustment(admin, body = {}) {
  const movimiento = await inventoryRepository.createMovement({
    usuarioId: admin.id,
    usuario: admin.usuario,
    productoId: normalizeProductId(body.productoId),
    tipo: "AJUSTE",
    stockFinal: normalizeStockFinal(body.stockFinal),
    motivo: normalizeMotivo(body.motivo),
  });

  return { movimiento, mensaje: "Ajuste de inventario registrado correctamente." };
}

module.exports = {
  getProductDetail,
  getSummary,
  listLowStock,
  listMovements,
  registerAdjustment,
  registerEntry,
  registerExit,
};
