const authService = require("../modules/auth/auth.service");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const session = authService.getSession(token);

  if (!session) {
    return res.status(401).json({ mensaje: "Debe iniciar sesión como administrador." });
  }

  req.admin = session;
  return next();
}

module.exports = { requireAuth };
