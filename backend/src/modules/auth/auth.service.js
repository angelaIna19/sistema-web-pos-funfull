const crypto = require("crypto");
const { query } = require("../../config/db");
const { verifyPassword } = require("../../utils/password");
const cashRegisterService = require("../cashRegister/cashRegister.service");

const sessions = new Map();

async function login(usuario, password) {
  const cleanUser = String(usuario || "").trim();
  const cleanPassword = String(password || "");

  if (!cleanUser || !cleanPassword) {
    const error = new Error("Ingrese usuario y contraseña.");
    error.status = 400;
    throw error;
  }

  const result = await query("SELECT * FROM usuarios_admin WHERE usuario = $1", [cleanUser]);
  const admin = result.rows[0];

  if (!admin || !verifyPassword(cleanPassword, admin.password_hash)) {
    const error = new Error("Usuario o contraseña incorrectos.");
    error.status = 401;
    throw error;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const session = { id: admin.id, usuario: admin.usuario, rol: admin.rol };
  sessions.set(token, session);

  return { token, ...session };
}

async function logout(token) {
  const cajaAbierta = await cashRegisterService.getOpenCashRegister();

  if (cajaAbierta) {
    const error = new Error("No puedes cerrar sesión mientras exista una caja registradora abierta. Cierra la caja primero.");
    error.status = 409;
    throw error;
  }

  sessions.delete(token);
}

function getSession(token) {
  return sessions.get(token);
}

module.exports = { login, logout, getSession };

