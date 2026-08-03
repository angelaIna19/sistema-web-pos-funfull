const userRepository = require("./user.repository");
const { hashPassword, verifyPassword } = require("../../utils/password");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function cleanUsername(usuario) {
  return String(usuario || "").trim();
}

async function getCurrentUser(adminId) {
  const admin = await userRepository.findById(adminId);

  if (!admin) {
    throw createError("Usuario administrador no encontrado.", 404);
  }

  return {
    id: admin.id,
    usuario: admin.usuario,
    rol: admin.rol,
  };
}

async function updateCredentials(adminId, payload = {}) {
  const usuario = cleanUsername(payload.usuario);
  const passwordActual = String(payload.passwordActual || "");
  const nuevoPassword = String(payload.nuevoPassword || "");

  if (!usuario) {
    throw createError("Ingrese el nuevo usuario.", 400);
  }

  if (/\s/.test(usuario)) {
    throw createError("El usuario no debe contener espacios.", 400);
  }

  if (usuario.length > 80) {
    throw createError("El usuario no debe superar 80 caracteres.", 400);
  }

  if (!passwordActual) {
    throw createError("Ingrese la contraseña actual.", 400);
  }

  if (nuevoPassword && nuevoPassword.length < 8) {
    throw createError("La nueva contraseña debe tener mínimo 8 caracteres.", 400);
  }

  const admin = await userRepository.findById(adminId);

  if (!admin) {
    throw createError("Usuario administrador no encontrado.", 404);
  }

  if (!verifyPassword(passwordActual, admin.password_hash)) {
    throw createError("La contraseña actual no es correcta.", 401);
  }

  const existingUser = await userRepository.findByUsername(usuario);

  if (existingUser && Number(existingUser.id) !== Number(admin.id)) {
    throw createError("El usuario ingresado ya existe.", 409);
  }

  const passwordHash = nuevoPassword ? hashPassword(nuevoPassword) : null;
  const updatedAdmin = await userRepository.updateCredentials(admin.id, usuario, passwordHash);

  return {
    id: updatedAdmin.id,
    usuario: updatedAdmin.usuario,
    rol: updatedAdmin.rol,
    mensaje: "Credenciales actualizadas correctamente.",
  };
}

module.exports = {
  getCurrentUser,
  updateCredentials,
};
