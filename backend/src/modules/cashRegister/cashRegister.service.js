const cashRegisterRepository = require("./cashRegister.repository");

async function getOpenCashRegister() {
  return cashRegisterRepository.findOpen();
}

async function listCashRegisters(archived = false) {
  return cashRegisterRepository.findAll(archived);
}

async function openCashRegister(admin, body) {
  const existing = await cashRegisterRepository.findOpen();

  if (existing) {
    const error = new Error("Ya existe una caja registradora abierta.");
    error.status = 400;
    throw error;
  }

  const nombreTrabajador = body.nombreTrabajador ? String(body.nombreTrabajador).trim() : "";
  const montoInicialRaw = body.montoInicial;
  const montoInicialTexto = montoInicialRaw === null || montoInicialRaw === undefined ? "" : String(montoInicialRaw).trim();
  const montoInicial = Number(montoInicialTexto);
  const observacion = body.observacion ? String(body.observacion).trim() : "";

  if (!nombreTrabajador) {
    const error = new Error("El nombre del trabajador es obligatorio.");
    error.status = 400;
    throw error;
  }

  if (!montoInicialTexto || !Number.isFinite(montoInicial) || montoInicial < 0) {
    const error = new Error("El monto inicial es obligatorio y debe ser mayor o igual a 0.");
    error.status = 400;
    throw error;
  }

  return cashRegisterRepository.createOpening({
    usuarioId: admin.id,
    usuario: admin.usuario,
    nombreTrabajador,
    montoInicial,
    observacion,
  });
}

async function closeCashRegister(admin, body = {}) {
  const existing = await cashRegisterRepository.findOpen();

  if (!existing) {
    const error = new Error("No existe una caja registradora abierta.");
    error.status = 400;
    throw error;
  }

  const montoContadoRaw = body.montoContado;
  const montoContadoTexto = montoContadoRaw === null || montoContadoRaw === undefined ? "" : String(montoContadoRaw).trim();
  const montoContado = Number(montoContadoTexto);
  const observacionCierre = body.observacionCierre ? String(body.observacionCierre).trim() : "";

  if (!montoContadoTexto || !Number.isFinite(montoContado) || montoContado < 0) {
    const error = new Error("El efectivo contado es obligatorio y debe ser mayor o igual a 0.");
    error.status = 400;
    throw error;
  }

  const caja = await cashRegisterRepository.closeOpen({ montoContado, observacionCierre });
  return { caja, mensaje: "Caja cerrada correctamente." };
}

async function createCashMovement(admin, body = {}) {
  const existing = await cashRegisterRepository.findOpen();

  if (!existing) {
    const error = new Error("No existe una caja registradora abierta.");
    error.status = 400;
    throw error;
  }

  const tipo = body.tipo ? String(body.tipo).trim().toUpperCase() : "";
  const montoRaw = body.monto;
  const montoTexto = montoRaw === null || montoRaw === undefined ? "" : String(montoRaw).trim();
  const monto = Number(montoTexto);
  const descripcion = body.descripcion ? String(body.descripcion).trim() : "";

  if (!tipo || !["INGRESO", "EGRESO"].includes(tipo)) {
    const error = new Error("El tipo de movimiento debe ser INGRESO o EGRESO.");
    error.status = 400;
    throw error;
  }

  if (!montoTexto || !Number.isFinite(monto) || monto <= 0) {
    const error = new Error("El monto es obligatorio y debe ser mayor a 0.");
    error.status = 400;
    throw error;
  }

  if (!descripcion) {
    const error = new Error("La descripción del movimiento es obligatoria.");
    error.status = 400;
    throw error;
  }

  const movimiento = await cashRegisterRepository.createMovement({ tipo, monto, descripcion });
  return { movimiento, mensaje: "Movimiento de caja registrado correctamente." };
}

module.exports = {
  getOpenCashRegister,
  listCashRegisters,
  openCashRegister,
  closeCashRegister,
  createCashMovement,
};
