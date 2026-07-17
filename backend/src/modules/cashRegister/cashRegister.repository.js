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
  };
}

async function findOpen() {
  const result = await query(
    `SELECT c.*, u.usuario
     FROM cajas c
     JOIN usuarios_admin u ON u.id = c.usuario_id
     WHERE c.estado = 'ABIERTA'
     ORDER BY c.abierta_en DESC
     LIMIT 1`
  );

  return result.rows[0] ? mapCaja(result.rows[0]) : null;
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
  return mapCaja(caja);
}

module.exports = { findOpen, createOpening };