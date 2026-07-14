const authService = require("./auth.service");

async function login(req, res) {
  try {
    const session = await authService.login(req.body.usuario, req.body.password);
    res.json(session);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo iniciar sesión. Revise la conexión con PostgreSQL.",
    });
  }
}

function logout(req, res) {
  const token = req.headers.authorization.slice(7);
  authService.logout(token);
  res.json({ mensaje: "Sesión cerrada." });
}

module.exports = { login, logout };
