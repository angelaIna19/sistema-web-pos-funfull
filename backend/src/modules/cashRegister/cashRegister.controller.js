const cashRegisterService = require("./cashRegister.service");

async function current(req, res) {
  try {
    const caja = await cashRegisterService.getOpenCashRegister(req.admin);
    res.json({ abierta: Boolean(caja), caja });
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo consultar la caja registradora." });
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

module.exports = { current, open };
