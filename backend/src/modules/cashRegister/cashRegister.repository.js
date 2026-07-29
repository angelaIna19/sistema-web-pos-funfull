const { query } = require("../../config/db");

function mapCaja(row) {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    usuario: row.usuario,
    nombreTrabajador: row.nombre_trabajador,
    montoInicial: Number(row.monto_inicial),
    observacion: row.observacion || "",
    estado: row.estado,
    abiertaEn: row.abierta_en,
    cerradaEn: row.cerrada_en,
    vendido: Number(row.vendido || 0),
    ventas: Number(row.ventas || 0),
  };
}

const cajaResumenSelect = `
  SELECT c.*,
         u.usuario,
         COALESCE(SUM(v.total), 0) AS vendido,
         COUNT(v.id)::int AS ventas
  FROM cajas c
  JOIN usuarios_admin u ON u.id = c.usuario_id
  LEFT JOIN ventas v ON v.caja_id = c.id
`;

async function findOpen() {
  const result = await query(
    `${cajaResumenSelect}
     WHERE c.estado = 'ABIERTA'
     GROUP BY c.id, u.usuario
     ORDER BY c.abierta_en DESC
     LIMIT 1`
  );

  return result.rows[0] ? mapCaja(result.rows[0]) : null;
}

async function findAll() {
  const result = await query(
    `${cajaResumenSelect}
     GROUP BY c.id, u.usuario
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
  caja.ventas = 0;
  return mapCaja(caja);
}

async function closeOpen() {
  const result = await query(
    `UPDATE cajas
     SET estado = 'CERRADA',
         cerrada_en = CURRENT_TIMESTAMP
     WHERE id = (
       SELECT id
       FROM cajas
       WHERE estado = 'ABIERTA'
       ORDER BY abierta_en DESC
       LIMIT 1
     )
     RETURNING *`
  );

  return result.rows[0] ? mapCaja({ ...result.rows[0], usuario: null, vendido: 0, ventas: 0 }) : null;
}

module.exports = { findOpen, findAll, createOpening, closeOpen };