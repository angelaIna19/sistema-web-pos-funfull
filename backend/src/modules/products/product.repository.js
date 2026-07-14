const { query } = require("../../config/db");

function mapProducto(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    precio: Number(row.precio),
    imagen: row.imagen,
    descripcion: row.descripcion,
    disponible: row.disponible,
    etiqueta: row.etiqueta,
  };
}

async function findAll() {
  const result = await query("SELECT * FROM productos ORDER BY id ASC");
  return result.rows.map(mapProducto);
}

async function findById(id) {
  const result = await query("SELECT * FROM productos WHERE id = $1", [id]);
  return result.rows[0] ? mapProducto(result.rows[0]) : null;
}

async function create(producto) {
  const result = await query(
    `INSERT INTO productos (nombre, precio, imagen, descripcion, disponible, etiqueta)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [producto.nombre, producto.precio, producto.imagen, producto.descripcion, producto.disponible, producto.etiqueta]
  );

  return mapProducto(result.rows[0]);
}

async function update(id, producto) {
  const result = await query(
    `UPDATE productos
     SET nombre = $1, precio = $2, imagen = $3, descripcion = $4, disponible = $5, etiqueta = $6, actualizado_en = CURRENT_TIMESTAMP
     WHERE id = $7
     RETURNING *`,
    [producto.nombre, producto.precio, producto.imagen, producto.descripcion, producto.disponible, producto.etiqueta, id]
  );

  return result.rows[0] ? mapProducto(result.rows[0]) : null;
}

async function remove(id) {
  const result = await query("DELETE FROM productos WHERE id = $1 RETURNING id", [id]);
  return result.rowCount > 0;
}

module.exports = { findAll, findById, create, update, remove };
