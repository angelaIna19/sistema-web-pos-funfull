const { query } = require("../config/db");
const env = require("../config/env");
const { hashPassword } = require("../utils/password");

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS usuarios_admin (
      id SERIAL PRIMARY KEY,
      usuario VARCHAR(80) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      rol VARCHAR(40) NOT NULL DEFAULT 'Administrador',
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(160) NOT NULL,
      precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
      imagen TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      disponible BOOLEAN NOT NULL DEFAULT true,
      etiqueta VARCHAR(80),
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await seedAdmin();
  await seedProducts();
}

async function seedAdmin() {
  const adminCount = await query("SELECT COUNT(*)::int AS total FROM usuarios_admin");

  if (adminCount.rows[0].total === 0) {
    await query(
      "INSERT INTO usuarios_admin (usuario, password_hash) VALUES ($1, $2)",
      [env.admin.user, hashPassword(env.admin.password)]
    );
  }
}

async function seedProducts() {
  const productCount = await query("SELECT COUNT(*)::int AS total FROM productos");

  if (productCount.rows[0].total > 0) return;

  const productosIniciales = [
    ["Ron Añejo 750ML", 25.5, "/productos/ron-anejo.svg", "Ron premium de 750ml, sabor suave y añejado.", true, "Destacado"],
    ["Vodka Clásico 750ML", 18.0, "/productos/vodka-clasico.svg", "Vodka de 750ml, ideal para cócteles.", true, null],
    ["Whisky Reserva 700ML", 42.0, "/productos/whisky-reserva.svg", "Whisky de 700ml, aroma afrutado y ahumado.", false, null],
    ["Vino Tinto 750ML", 14.75, "/productos/vino-tinto.svg", "Vino tinto de 750ml, cuerpo medio y sabor equilibrado.", true, null],
  ];

  for (const producto of productosIniciales) {
    await query(
      `INSERT INTO productos (nombre, precio, imagen, descripcion, disponible, etiqueta)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      producto
    );
  }
}

module.exports = { initDb };
