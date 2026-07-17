const cashRegisterRepository = require("./cashRegister.repository");

async function getOpenCashRegister() {
  return cashRegisterRepository.findOpen();
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

module.exports = { getOpenCashRegister, openCashRegister };