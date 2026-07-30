const { pool, query } = require("../../config/db");

function mapProduct(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    categoria: row.categoria,
    marca: row.marca,
    precioCompra: Number(row.precio_compra || 0),
    precioVenta: Number(row.precio_venta || 0),
    stock: Number(row.stock || 0),
    stockMinimo: Number(row.stock_minimo || 0),
    imagen: row.imagen,
    estado: row.estado,
  };
}

function mapMovement(row) {
  return {
    id: row.id,
    productoId: row.producto_id,
    usuarioId: row.usuario_id,
    usuario: row.usuario || "",
    codigo: row.codigo,
    nombre: row.nombre,
    categoria: row.categoria,
    marca: row.marca,
    tipo: row.tipo,
    cantidadAnterior: Number(row.cantidad_anterior || 0),
    cantidadMovimiento: Number(row.cantidad_movimiento || 0),
    cantidadNueva: Number(row.cantidad_nueva || 0),
    motivo: row.motivo || "",
    creadoEn: row.creado_en,
  };
}

async function findMovements() {
  const result = await query(
    `SELECT im.*, p.codigo, p.nombre, p.categoria, p.marca, u.usuario
     FROM inventario_movimientos im
     JOIN productos p ON p.id = im.producto_id
     JOIN usuarios_admin u ON u.id = im.usuario_id
     ORDER BY im.creado_en DESC, im.id DESC`
  );

  return result.rows.map(mapMovement);
}

async function findLowStock() {
  const result = await query(
    `SELECT *
     FROM productos
     WHERE stock <= stock_minimo
     ORDER BY stock ASC, nombre ASC`
  );

  return result.rows.map(mapProduct);
}

async function findProductDetail(id) {
  const productResult = await query("SELECT * FROM productos WHERE id = $1", [id]);
  const product = productResult.rows[0] ? mapProduct(productResult.rows[0]) : null;

  if (!product) return null;

  const movementsResult = await query(
    `SELECT im.*, p.codigo, p.nombre, p.categoria, p.marca, u.usuario
     FROM inventario_movimientos im
     JOIN productos p ON p.id = im.producto_id
     JOIN usuarios_admin u ON u.id = im.usuario_id
     WHERE im.producto_id = $1
     ORDER BY im.creado_en DESC, im.id DESC
     LIMIT 20`,
    [id]
  );

  return {
    producto: product,
    movimientos: movementsResult.rows.map(mapMovement),
  };
}

async function getSummary() {
  const result = await query(
    `SELECT
       COUNT(*)::int AS total_productos,
       COALESCE(SUM(stock), 0)::int AS total_unidades,
       COALESCE(SUM(precio_compra * stock), 0)::numeric AS valor_total,
       COUNT(*) FILTER (WHERE stock <= stock_minimo)::int AS productos_stock_bajo,
       COUNT(*) FILTER (WHERE stock = 0)::int AS productos_agotados
     FROM productos`
  );

  const row = result.rows[0] || {};
  return {
    totalProductos: Number(row.total_productos || 0),
    totalUnidades: Number(row.total_unidades || 0),
    valorTotal: Number(row.valor_total || 0),
    productosStockBajo: Number(row.productos_stock_bajo || 0),
    productosAgotados: Number(row.productos_agotados || 0),
  };
}

async function createMovement(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const productResult = await client.query(
      `SELECT id, codigo, nombre, categoria, marca, stock
       FROM productos
       WHERE id = $1
       FOR UPDATE`,
      [data.productoId]
    );

    const product = productResult.rows[0] || null;
    if (!product) {
      const error = new Error("Producto no encontrado.");
      error.status = 404;
      throw error;
    }

    const cantidadAnterior = Number(product.stock || 0);
    let cantidadMovimiento = 0;
    let cantidadNueva = cantidadAnterior;

    if (data.tipo === "ENTRADA") {
      cantidadMovimiento = data.cantidad;
      cantidadNueva = cantidadAnterior + data.cantidad;
    }

    if (data.tipo === "SALIDA") {
      if (data.cantidad > cantidadAnterior) {
        const error = new Error(`Stock insuficiente para ${product.nombre}. Disponible: ${cantidadAnterior}.`);
        error.status = 400;
        throw error;
      }

      cantidadMovimiento = data.cantidad * -1;
      cantidadNueva = cantidadAnterior - data.cantidad;
    }

    if (data.tipo === "AJUSTE") {
      cantidadNueva = data.stockFinal;
      cantidadMovimiento = cantidadNueva - cantidadAnterior;
    }

    await client.query(
      `UPDATE productos
       SET stock = $1,
           actualizado_en = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [cantidadNueva, data.productoId]
    );

    const movementResult = await client.query(
      `INSERT INTO inventario_movimientos (
         producto_id, usuario_id, tipo, cantidad_anterior, cantidad_movimiento, cantidad_nueva, motivo
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.productoId, data.usuarioId, data.tipo, cantidadAnterior, cantidadMovimiento, cantidadNueva, data.motivo]
    );

    await client.query("COMMIT");

    return mapMovement({
      ...movementResult.rows[0],
      usuario: data.usuario,
      codigo: product.codigo,
      nombre: product.nombre,
      categoria: product.categoria,
      marca: product.marca,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { createMovement, findLowStock, findMovements, findProductDetail, getSummary };
