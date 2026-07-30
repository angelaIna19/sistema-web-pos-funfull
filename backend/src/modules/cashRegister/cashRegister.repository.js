const { pool, query } = require("../../config/db");

function mapCaja(row) {
  const efectivoEsperado = row.efectivo_esperado === null || row.efectivo_esperado === undefined
    ? null
    : Number(row.efectivo_esperado);
  const montoEsperado = row.monto_esperado === null || row.monto_esperado === undefined
    ? efectivoEsperado
    : Number(row.monto_esperado);

  return {
    id: row.id,
    usuarioId: row.usuario_id,
    usuario: row.usuario,
    nombreTrabajador: row.nombre_trabajador,
    montoInicial: Number(row.monto_inicial || 0),
    montoContado: row.monto_contado === null || row.monto_contado === undefined ? null : Number(row.monto_contado),
    montoEsperado,
    efectivoEsperado,
    diferencia: row.diferencia === null || row.diferencia === undefined ? null : Number(row.diferencia),
    observacion: row.observacion || "",
    observacionCierre: row.observacion_cierre || "",
    estado: row.estado,
    abiertaEn: row.abierta_en,
    cerradaEn: row.cerrada_en,
    vendido: Number(row.vendido || 0),
    totalEfectivo: Number(row.total_efectivo || 0),
    totalTransferencia: Number(row.total_transferencia || 0),
    ingresosManuales: Number(row.ingresos_manuales || 0),
    egresosManuales: Number(row.egresos_manuales || 0),
    ventas: Number(row.ventas || 0),
  };
}

function mapMovimiento(row) {
  return {
    id: row.id,
    cajaId: row.caja_id,
    ventaId: row.venta_id,
    tipo: row.tipo,
    monto: Number(row.monto || 0),
    descripcion: row.descripcion,
    creadoEn: row.creado_en,
  };
}

const cajaResumenSelect = `
  SELECT c.*,
         u.usuario,
         COALESCE(vs.vendido, 0) AS vendido,
         COALESCE(vs.total_efectivo, 0) AS total_efectivo,
         COALESCE(vs.total_transferencia, 0) AS total_transferencia,
         COALESCE(vs.ventas, 0)::int AS ventas,
         COALESCE(ms.ingresos_manuales, 0) AS ingresos_manuales,
         COALESCE(ms.egresos_manuales, 0) AS egresos_manuales,
         CASE
           WHEN c.estado = 'ABIERTA'
             THEN c.monto_inicial
                  + COALESCE(vs.total_efectivo, 0)
                  + COALESCE(ms.ingresos_manuales, 0)
                  - COALESCE(ms.egresos_manuales, 0)
           ELSE c.monto_esperado
         END AS efectivo_esperado
  FROM cajas c
  JOIN usuarios_admin u ON u.id = c.usuario_id
  LEFT JOIN (
    SELECT caja_id,
           SUM(total) AS vendido,
           SUM(CASE WHEN metodo_pago = 'EFECTIVO' THEN total ELSE 0 END) AS total_efectivo,
           SUM(CASE WHEN metodo_pago = 'TRANSFERENCIA' THEN total ELSE 0 END) AS total_transferencia,
           COUNT(*)::int AS ventas
    FROM ventas
    WHERE estado <> 'ANULADA'
    GROUP BY caja_id
  ) vs ON vs.caja_id = c.id
  LEFT JOIN (
    SELECT caja_id,
           SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END) AS ingresos_manuales,
           SUM(CASE WHEN tipo = 'EGRESO' THEN monto ELSE 0 END) AS egresos_manuales
    FROM caja_movimientos
    WHERE venta_id IS NULL
    GROUP BY caja_id
  ) ms ON ms.caja_id = c.id
`;

async function findOpen() {
  const result = await query(
    `${cajaResumenSelect}
     WHERE c.estado = 'ABIERTA'
     ORDER BY c.abierta_en DESC
     LIMIT 1`
  );

  return result.rows[0] ? mapCaja(result.rows[0]) : null;
}

async function findAll() {
  const result = await query(
    `${cajaResumenSelect}
     ORDER BY c.abierta_en DESC`
  );

  return result.rows.map(mapCaja);
}

async function createOpening(data) {
  const result = await query(
    `INSERT INTO cajas (usuario_id, nombre_trabajador, monto_inicial, observacion, estado)
     VALUES ($1, $2, $3, $4, 'ABIERTA')
     RETURNING *`,
    [data.usuarioId, data.nombreTrabajador, data.montoInicial, data.observacion]
  );

  const caja = result.rows[0];
  caja.usuario = data.usuario;
  caja.vendido = 0;
  caja.total_efectivo = 0;
  caja.total_transferencia = 0;
  caja.ingresos_manuales = 0;
  caja.egresos_manuales = 0;
  caja.efectivo_esperado = data.montoInicial;
  caja.ventas = 0;
  return mapCaja(caja);
}

async function closeOpen(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cajaResult = await client.query(
      `SELECT c.*, u.usuario
       FROM cajas c
       JOIN usuarios_admin u ON u.id = c.usuario_id
       WHERE c.estado = 'ABIERTA'
       ORDER BY c.abierta_en DESC
       LIMIT 1
       FOR UPDATE`
    );

    const caja = cajaResult.rows[0] || null;
    if (!caja) {
      await client.query("ROLLBACK");
      return null;
    }

    const resumenResult = await client.query(
      `SELECT
         COALESCE((SELECT SUM(total) FROM ventas WHERE caja_id = $1 AND estado <> 'ANULADA'), 0) AS vendido,
         COALESCE((SELECT SUM(total) FROM ventas WHERE caja_id = $1 AND metodo_pago = 'EFECTIVO' AND estado <> 'ANULADA'), 0) AS total_efectivo,
         COALESCE((SELECT SUM(total) FROM ventas WHERE caja_id = $1 AND metodo_pago = 'TRANSFERENCIA' AND estado <> 'ANULADA'), 0) AS total_transferencia,
         COALESCE((SELECT COUNT(*) FROM ventas WHERE caja_id = $1 AND estado <> 'ANULADA'), 0)::int AS ventas,
         COALESCE((SELECT SUM(monto) FROM caja_movimientos WHERE caja_id = $1 AND venta_id IS NULL AND tipo = 'INGRESO'), 0) AS ingresos_manuales,
         COALESCE((SELECT SUM(monto) FROM caja_movimientos WHERE caja_id = $1 AND venta_id IS NULL AND tipo = 'EGRESO'), 0) AS egresos_manuales`,
      [caja.id]
    );

    const resumen = resumenResult.rows[0];
    const totalEfectivo = Number(resumen.total_efectivo || 0);
    const ingresosManuales = Number(resumen.ingresos_manuales || 0);
    const egresosManuales = Number(resumen.egresos_manuales || 0);
    const montoEsperado = roundMoney(Number(caja.monto_inicial || 0) + totalEfectivo + ingresosManuales - egresosManuales);
    const diferencia = roundMoney(Number(data.montoContado) - montoEsperado);

    const updateResult = await client.query(
      `UPDATE cajas
       SET estado = 'CERRADA',
           cerrada_en = CURRENT_TIMESTAMP,
           monto_contado = $1,
           monto_esperado = $2,
           diferencia = $3,
           observacion_cierre = $4
       WHERE id = $5
       RETURNING *`,
      [data.montoContado, montoEsperado, diferencia, data.observacionCierre, caja.id]
    );

    await client.query("COMMIT");

    return mapCaja({
      ...updateResult.rows[0],
      usuario: caja.usuario,
      vendido: resumen.vendido,
      total_efectivo: resumen.total_efectivo,
      total_transferencia: resumen.total_transferencia,
      ingresos_manuales: resumen.ingresos_manuales,
      egresos_manuales: resumen.egresos_manuales,
      efectivo_esperado: montoEsperado,
      ventas: resumen.ventas,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function createMovement(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cajaResult = await client.query(
      `SELECT c.*,
              COALESCE((SELECT SUM(total) FROM ventas WHERE caja_id = c.id AND metodo_pago = 'EFECTIVO' AND estado <> 'ANULADA'), 0) AS total_efectivo,
              COALESCE((SELECT SUM(monto) FROM caja_movimientos WHERE caja_id = c.id AND venta_id IS NULL AND tipo = 'INGRESO'), 0) AS ingresos_manuales,
              COALESCE((SELECT SUM(monto) FROM caja_movimientos WHERE caja_id = c.id AND venta_id IS NULL AND tipo = 'EGRESO'), 0) AS egresos_manuales
       FROM cajas c
       WHERE c.estado = 'ABIERTA'
       ORDER BY c.abierta_en DESC
       LIMIT 1
       FOR UPDATE`
    );

    const caja = cajaResult.rows[0] || null;
    if (!caja) {
      const error = new Error("No existe una caja registradora abierta.");
      error.status = 400;
      throw error;
    }

    const efectivoEsperado = roundMoney(
      Number(caja.monto_inicial || 0)
      + Number(caja.total_efectivo || 0)
      + Number(caja.ingresos_manuales || 0)
      - Number(caja.egresos_manuales || 0)
    );

    if (data.tipo === "EGRESO" && Number(data.monto) > efectivoEsperado) {
      const error = new Error("La salida no puede superar el efectivo esperado en caja.");
      error.status = 400;
      throw error;
    }

    const result = await client.query(
      `INSERT INTO caja_movimientos (caja_id, venta_id, tipo, monto, descripcion)
       VALUES ($1, NULL, $2, $3, $4)
       RETURNING *`,
      [caja.id, data.tipo, data.monto, data.descripcion]
    );

    await client.query("COMMIT");
    return mapMovimiento(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

module.exports = { findOpen, findAll, createOpening, closeOpen, createMovement };
