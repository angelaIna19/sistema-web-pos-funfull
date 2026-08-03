const { query } = require("../../config/db");

async function findById(id) {
  const result = await query(
    "SELECT id, usuario, password_hash, rol FROM usuarios_admin WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

async function findByUsername(usuario) {
  const result = await query(
    "SELECT id, usuario FROM usuarios_admin WHERE usuario = $1",
    [usuario]
  );
  return result.rows[0] || null;
}

async function updateCredentials(id, usuario, passwordHash = null) {
  const result = await query(
    `UPDATE usuarios_admin
     SET usuario = $1,
         password_hash = COALESCE($2, password_hash)
     WHERE id = $3
     RETURNING id, usuario, rol`,
    [usuario, passwordHash, id]
  );
  return result.rows[0] || null;
}

module.exports = {
  findById,
  findByUsername,
  updateCredentials,
};
