const { query } = require("../../config/db");

function mapProducto(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    categoria: row.categoria,
    marca: row.marca,
    precioCompra: Number(row.precio_compra),
    precioVenta: Number(row.precio_venta),
    stock: Number(row.stock),
    stockMinimo: Number(row.stock_minimo),
    imagen: row.imagen,
    estado: row.estado,
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
    `INSERT INTO productos (codigo, nombre, categoria, marca, precio_compra, precio_venta, stock, stock_minimo, imagen, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      producto.codigo,
      producto.nombre,
      producto.categoria,
      producto.marca,
      producto.precioCompra,
      producto.precioVenta,
      producto.stock,
      producto.stockMinimo,
      producto.imagen,
      producto.estado,
    ]
  );

  return mapProducto(result.rows[0]);
}

async function update(id, producto) {
  const result = await query(
    `UPDATE productos
     SET codigo = $1,
         nombre = $2,
         categoria = $3,
         marca = $4,
         precio_compra = $5,
         precio_venta = $6,
         stock = $7,
         stock_minimo = $8,
         imagen = $9,
         estado = $10,
         actualizado_en = CURRENT_TIMESTAMP
     WHERE id = $11
     RETURNING *`,
    [
      producto.codigo,
      producto.nombre,
      producto.categoria,
      producto.marca,
      producto.precioCompra,
      producto.precioVenta,
      producto.stock,
      producto.stockMinimo,
      producto.imagen,
      producto.estado,
      id,
    ]
  );

  return result.rows[0] ? mapProducto(result.rows[0]) : null;
}

async function remove(id) {
  const result = await query("DELETE FROM productos WHERE id = $1 RETURNING id", [id]);
  return result.rowCount > 0;
}

module.exports = { findAll, findById, create, update, remove };
