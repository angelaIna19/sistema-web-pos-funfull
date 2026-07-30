const saleRepository = require("./sale.repository");

const TAX_RATE = 0.15;

async function createSale(admin, body) {
  const metodoPago = String(body.metodoPago || "EFECTIVO").trim().toUpperCase();
  const observacion = body.observacion ? String(body.observacion).trim() : "";
  const montoRecibido = Number(body.montoRecibido);
  const items = normalizeItems(body.items);

  if (!["EFECTIVO", "TRANSFERENCIA"].includes(metodoPago)) {
    const error = new Error("El método de pago seleccionado no es válido.");
    error.status = 400;
    throw error;
  }

  if (!Number.isFinite(montoRecibido) || montoRecibido < 0) {
    const error = new Error("El monto recibido es obligatorio y debe ser mayor o igual a 0.");
    error.status = 400;
    throw error;
  }

  const venta = await saleRepository.createSaleTransaction({
    usuarioId: admin.id,
    items,
    metodoPago,
    montoRecibido,
    observacion,
    taxRate: TAX_RATE,
  });

  return {
    ...venta,
    mensaje: "Venta registrada correctamente.",
  };
}

async function listSales() {
  return saleRepository.findAllSales();
}

async function getSaleDetail(id) {
  const ventaId = normalizeSaleId(id);
  const venta = await saleRepository.findSaleById(ventaId);

  if (!venta) {
    const error = new Error("Venta no encontrada.");
    error.status = 404;
    throw error;
  }

  const detalles = await saleRepository.findSaleDetails(ventaId);
  return { ...venta, detalles };
}

async function cancelSale(id, body = {}) {
  const ventaId = normalizeSaleId(id);
  const motivoAnulacion = body.motivoAnulacion ? String(body.motivoAnulacion).trim() : "";

  if (!motivoAnulacion) {
    const error = new Error("El motivo de anulación es obligatorio.");
    error.status = 400;
    throw error;
  }

  const venta = await saleRepository.cancelSaleTransaction(ventaId, { motivoAnulacion });

  return {
    ...venta,
    mensaje: "Venta anulada correctamente.",
  };
}

function normalizeSaleId(id) {
  const ventaId = Number(id);

  if (!Number.isInteger(ventaId) || ventaId <= 0) {
    const error = new Error("La venta solicitada no es válida.");
    error.status = 400;
    throw error;
  }

  return ventaId;
}

function normalizeItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    const error = new Error("La venta debe tener al menos un producto.");
    error.status = 400;
    throw error;
  }

  const grouped = new Map();

  for (const rawItem of rawItems) {
    const productoId = Number(rawItem.productoId ?? rawItem.id);
    const cantidad = Number(rawItem.cantidad);

    if (!Number.isInteger(productoId) || productoId <= 0) {
      const error = new Error("El producto de la venta no es válido.");
      error.status = 400;
      throw error;
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      const error = new Error("La cantidad debe ser un número entero mayor a 0.");
      error.status = 400;
      throw error;
    }

    grouped.set(productoId, (grouped.get(productoId) || 0) + cantidad);
  }

  return Array.from(grouped, ([productoId, cantidad]) => ({ productoId, cantidad }));
}

module.exports = { cancelSale, createSale, listSales, getSaleDetail };