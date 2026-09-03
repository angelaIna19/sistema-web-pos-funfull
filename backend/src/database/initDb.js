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
  await initSalesTables();
  await initInventoryTable();
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
    const missingColumns = requiredColumns.filter((column) => !columns.includes(column));
    throw new Error(
      `La tabla productos requiere una migracion versionada. Columnas faltantes: ${missingColumns.join(", ")}`
    );
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
    ALTER TABLE cajas
    ADD COLUMN IF NOT EXISTS monto_contado NUMERIC(10, 2) CHECK (monto_contado >= 0),
    ADD COLUMN IF NOT EXISTS monto_esperado NUMERIC(10, 2) CHECK (monto_esperado >= 0),
    ADD COLUMN IF NOT EXISTS diferencia NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS observacion_cierre TEXT;
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS cajas_abierta_unica
    ON cajas (estado)
    WHERE estado = 'ABIERTA';
  `);
}

async function initSalesTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS ventas (
      id SERIAL PRIMARY KEY,
      caja_id INTEGER NOT NULL REFERENCES cajas(id),
      usuario_id INTEGER NOT NULL REFERENCES usuarios_admin(id),
      metodo_pago VARCHAR(20) NOT NULL DEFAULT 'EFECTIVO',
      subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
      impuesto NUMERIC(10, 2) NOT NULL CHECK (impuesto >= 0),
      total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
      monto_recibido NUMERIC(10, 2) NOT NULL CHECK (monto_recibido >= 0),
      cambio NUMERIC(10, 2) NOT NULL CHECK (cambio >= 0),
      observacion TEXT,
      creada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT ventas_metodo_pago_check CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA'))
    );
  `);

  await query(`
    ALTER TABLE ventas
    DROP CONSTRAINT IF EXISTS ventas_metodo_pago_check;
  `);

  await query(`
    ALTER TABLE ventas
    ADD CONSTRAINT ventas_metodo_pago_check CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA'));
  `);

  await query(`
    ALTER TABLE ventas
    ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADA',
    ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT,
    ADD COLUMN IF NOT EXISTS anulada_en TIMESTAMP;
  `);

  await query(`
    ALTER TABLE ventas
    DROP CONSTRAINT IF EXISTS ventas_estado_check;
  `);

  await query(`
    ALTER TABLE ventas
    ADD CONSTRAINT ventas_estado_check CHECK (estado IN ('REGISTRADA', 'ANULADA'));
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS venta_detalles (
      id SERIAL PRIMARY KEY,
      venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
      producto_id INTEGER NOT NULL REFERENCES productos(id),
      cantidad INTEGER NOT NULL CHECK (cantidad > 0),
      precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
      subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS caja_movimientos (
      id SERIAL PRIMARY KEY,
      caja_id INTEGER NOT NULL REFERENCES cajas(id),
      venta_id INTEGER REFERENCES ventas(id),
      tipo VARCHAR(20) NOT NULL,
      monto NUMERIC(10, 2) NOT NULL CHECK (monto >= 0),
      descripcion TEXT,
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT caja_movimientos_tipo_check CHECK (tipo IN ('INGRESO', 'EGRESO'))
    );
  `);
}

async function initInventoryTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS inventario_movimientos (
      id SERIAL PRIMARY KEY,
      producto_id INTEGER NOT NULL REFERENCES productos(id),
      usuario_id INTEGER NOT NULL REFERENCES usuarios_admin(id),
      tipo VARCHAR(20) NOT NULL,
      cantidad_anterior INTEGER NOT NULL CHECK (cantidad_anterior >= 0),
      cantidad_movimiento INTEGER NOT NULL,
      cantidad_nueva INTEGER NOT NULL CHECK (cantidad_nueva >= 0),
      motivo TEXT NOT NULL,
      creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT inventario_movimientos_tipo_check CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE'))
    );
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

