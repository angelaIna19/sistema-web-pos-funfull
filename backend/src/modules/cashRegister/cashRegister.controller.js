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
    const cajas = await cashRegisterService.listCashRegisters(req.admin);
    res.json(cajas);
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo consultar el historial de cajas." });
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
    const resultado = await cashRegisterService.closeCashRegister(req.admin);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo cerrar la caja registradora.",
    });
  }
}

module.exports = { current, history, open, close };