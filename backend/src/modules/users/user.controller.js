const userService = require("./user.service");

async function me(req, res) {
  try {
    const usuario = await userService.getCurrentUser(req.admin.id);
    res.json(usuario);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo consultar la cuenta del administrador.",
    });
  }
}

async function updateCredentials(req, res) {
  try {
    const usuario = await userService.updateCredentials(req.admin.id, req.body);
    res.json(usuario);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudieron actualizar las credenciales.",
    });
  }
}

module.exports = {
  me,
  updateCredentials,
};
