const cashRegisterService = require("./cashRegister.service");

async function current(req, res) {
  try {
    const caja = await cashRegisterService.getOpenCashRegister(req.admin);
    res.json({ abierta: Boolean(caja), caja });
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo consultar la caja registradora." });
  }
}

async function history(req, res) {
  try {
    const cajas = await cashRegisterService.listCashRegisters();
    res.json(cajas);
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo consultar el historial de cajas." });
  }
}

async function archivedHistory(req, res) {
  try {
    const cajas = await cashRegisterService.listCashRegisters(true);
    res.json(cajas);
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo consultar el historial archivado de cajas." });
  }
}

async function open(req, res) {
  try {
    const caja = await cashRegisterService.openCashRegister(req.admin, req.body);
    res.status(201).json(caja);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo abrir la caja registradora.",
    });
  }
}

async function close(req, res) {
  try {
    const resultado = await cashRegisterService.closeCashRegister(req.admin, req.body);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo cerrar la caja registradora.",
    });
  }
}

async function movement(req, res) {
  try {
    const resultado = await cashRegisterService.createCashMovement(req.admin, req.body);
    res.status(201).json(resultado);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo registrar el movimiento de caja.",
    });
  }
}

module.exports = { archivedHistory, current, history, open, close, movement };
