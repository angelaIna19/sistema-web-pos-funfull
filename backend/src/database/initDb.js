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

  await initProductsTable();
  await initCategoriesTable();
  await initCashRegisterTable();
  await seedAdmin();
}

async function initProductsTable() {
  const columnsResult = await query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'productos'
  `);

  const columns = columnsResult.rows.map((row) => row.column_name);
  const tableExists = columns.length > 0;
  const requiredColumns = [
    "codigo",
    "nombre",
    "categoria",
    "marca",
    "precio_compra",
    "precio_venta",
    "stock",
    "stock_minimo",
    "imagen",
    "estado",
  ];
  const hasCurrentSchema = requiredColumns.every((column) => columns.includes(column));

  if (tableExists && !hasCurrentSchema) {
    await query("DROP TABLE productos");
  }

  await query(`
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      codigo VARCHAR(50) UNIQUE NOT NULL,
      nombre VARCHAR(160) NOT NULL,
      categoria VARCHAR(100) NOT NULL,
      marca VARCHAR(100) NOT NULL,
      precio_compra NUMERIC(10, 2) NOT NULL CHECK (precio_compra >= 0),
      precio_venta NUMERIC(10, 2) NOT NULL CHECK (precio_venta >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      stock_minimo INTEGER NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
      imagen TEXT NOT NULL,
      estado BOOLEAN NOT NULL DEFAULT true,
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function initCategoriesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) UNIQUE NOT NULL,
      descripcion TEXT,
      estado BOOLEAN NOT NULL DEFAULT true,
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function initCashRegisterTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS cajas (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios_admin(id),
      nombre_trabajador VARCHAR(120) NOT NULL DEFAULT 'Administrador',
      monto_inicial NUMERIC(10, 2) NOT NULL CHECK (monto_inicial >= 0),
      observacion TEXT,
      estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA',
      abierta_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      cerrada_en TIMESTAMP,
      CONSTRAINT cajas_estado_check CHECK (estado IN ('ABIERTA', 'CERRADA'))
    );
  `);

  await query(`
    ALTER TABLE cajas
    ADD COLUMN IF NOT EXISTS nombre_trabajador VARCHAR(120) NOT NULL DEFAULT 'Administrador';
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS cajas_abierta_unica
    ON cajas (estado)
    WHERE estado = 'ABIERTA';
  `);
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

module.exports = { initDb };