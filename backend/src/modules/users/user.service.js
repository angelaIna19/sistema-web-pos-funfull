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
  const usuarioSolicitado = cleanUsername(payload.usuario);
  const passwordActual = String(payload.passwordActual || "");
  const nuevoPassword = String(payload.nuevoPassword || "");
  const confirmarPassword = String(payload.confirmarPassword || "");

  if (!passwordActual) {
    throw createError("Ingrese la contraseña actual.", 400);
  }

  const admin = await userRepository.findById(adminId);

  if (!admin) {
    throw createError("Usuario administrador no encontrado.", 404);
  }

  if (!verifyPassword(passwordActual, admin.password_hash)) {
    throw createError("La contraseña actual no es correcta.", 401);
  }

  const usuario = usuarioSolicitado || admin.usuario;

  if (/\s/.test(usuario)) {
    throw createError("El usuario no debe contener espacios.", 400);
  }

  if (usuario.length > 80) {
    throw createError("El usuario no debe superar 80 caracteres.", 400);
  }

  if (nuevoPassword && !confirmarPassword) {
    throw createError("Confirme la nueva contraseña.", 400);
  }

  if (nuevoPassword !== confirmarPassword) {
    throw createError("La nueva contraseña y la confirmación no coinciden.", 400);
  }

  if (nuevoPassword && nuevoPassword.length < 8) {
    throw createError("La nueva contraseña debe tener mínimo 8 caracteres.", 400);
  }

  const cambiaUsuario = usuario !== admin.usuario;
  const cambiaPassword = Boolean(nuevoPassword) && !verifyPassword(nuevoPassword, admin.password_hash);

  if (!cambiaUsuario && !cambiaPassword) {
    throw createError("Ingrese un nuevo usuario o una nueva contraseña diferente a la actual.", 400);
  }

  const existingUser = cambiaUsuario ? await userRepository.findByUsername(usuario) : null;

  if (existingUser && Number(existingUser.id) !== Number(admin.id)) {
    throw createError("El usuario ingresado ya existe.", 409);
  }

  const passwordHash = cambiaPassword ? hashPassword(nuevoPassword) : null;
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
