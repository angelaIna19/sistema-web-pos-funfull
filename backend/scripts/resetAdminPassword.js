const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { pool, query } = require("../src/config/db");
const { hashPassword } = require("../src/utils/password");

function getArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : "";
}

async function main() {
  const usuario = String(getArg("usuario") || "").trim();
  const password = String(getArg("password") || "");

  if (!usuario) {
    throw new Error("Debe ingresar --usuario.");
  }

  if (/\s/.test(usuario)) {
    throw new Error("El usuario no debe contener espacios.");
  }

  if (!password || password.length < 8) {
    throw new Error("Debe ingresar --password con minimo 8 caracteres.");
  }

  const firstAdmin = await query("SELECT id FROM usuarios_admin ORDER BY id ASC LIMIT 1");
  const passwordHash = hashPassword(password);

  if (!firstAdmin.rows[0]) {
    const inserted = await query(
      "INSERT INTO usuarios_admin (usuario, password_hash) VALUES ($1, $2) RETURNING id, usuario",
      [usuario, passwordHash]
    );
    console.log(`Administrador creado: ${inserted.rows[0].usuario}`);
    return;
  }

  const adminId = firstAdmin.rows[0].id;
  const duplicate = await query("SELECT id FROM usuarios_admin WHERE usuario = $1 AND id <> $2", [usuario, adminId]);

  if (duplicate.rows[0]) {
    throw new Error("Ya existe otro administrador con ese usuario.");
  }

  const updated = await query(
    "UPDATE usuarios_admin SET usuario = $1, password_hash = $2 WHERE id = $3 RETURNING id, usuario",
    [usuario, passwordHash, adminId]
  );

  console.log(`Credenciales restablecidas para el usuario administrador: ${updated.rows[0].usuario}`);
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
