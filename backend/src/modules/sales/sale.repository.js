const { pool } = require("../../config/db");

function mapVenta(row) {
  return {
    id: row.id,
    cajaId: row.caja_id,
    usuarioId: row.usuario_id,
    usuario: row.usuario || "",
    trabajador: row.nombre_trabajador || "",
    metodoPago: row.metodo_pago,
    subtotal: Number(row.subtotal),
    impuesto: Number(row.impuesto),
    total: Number(row.total),
    montoRecibido: Number(row.monto_recibido),
    cambio: Number(row.cambio),
    observacion: row.observacion || "",
    creadaEn: row.creada_en,
  };
}

function mapDetalle(row) {
  return {
    id: row.id,
    ventaId: row.venta_id,
    productoId: row.producto_id,
    codigo: row.codigo,
    nombre: row.nombre,
    categoria: row.categoria,
    marca: row.marca,
    cantidad: Number(row.cantidad),
    precioUnitario: Number(row.precio_unitario),
    subtotal: Number(row.subtotal),
  };
}

async function findAllSales() {
  const result = await pool.query(
    `SELECT v.*, u.usuario, c.nombre_trabajador
     FROM ventas v
     JOIN usuarios_admin u ON u.id = v.usuario_id
     JOIN cajas c ON c.id = v.caja_id
     ORDER BY v.creada_en DESC, v.id DESC`
  );

  return result.rows.map(mapVenta);
}

async function findSaleById(id) {
  const result = await pool.query(
    `SELECT v.*, u.usuario, c.nombre_trabajador
     FROM ventas v
     JOIN usuarios_admin u ON u.id = v.usuario_id
     JOIN cajas c ON c.id = v.caja_id
     WHERE v.id = $1`,
    [id]
  );

  return result.rows[0] ? mapVenta(result.rows[0]) : null;
}

async function findSaleDetails(id) {
  const result = await pool.query(
    `SELECT vd.*, p.codigo, p.nombre, p.categoria, p.marca
     FROM venta_detalles vd
     JOIN productos p ON p.id = vd.producto_id
     WHERE vd.venta_id = $1
     ORDER BY vd.id ASC`,
    [id]
  );

  return result.rows.map(mapDetalle);
}

async function createSaleTransaction(data) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cajaResult = await client.query(
      `SELECT id, usuario_id
       FROM cajas
       WHERE estado = 'ABIERTA'
       ORDER BY abierta_en DESC
       LIMIT 1
       FOR UPDATE`
    );
    const caja = cajaResult.rows[0] || null;

    if (!caja) {
      const error = new Error("No existe una caja registradora abierta.");
      error.status = 400;
      throw error;
    }

    const productIds = data.items.map((item) => item.productoId);
    const productsResult = await client.query(
      `SELECT id, nombre, precio_venta, stock, estado
       FROM productos
       WHERE id = ANY($1::int[])
       FOR UPDATE`,
      [productIds]
    );
    const productsById = new Map(productsResult.rows.map((product) => [Number(product.id), product]));

    const detalles = data.items.map((item) => {
      const producto = productsById.get(item.productoId);

      if (!producto) {
        const error = new Error("Uno de los productos seleccionados no existe.");
        error.status = 400;
        throw error;
      }

      if (!producto.estado) {
        const error = new Error(`El producto ${producto.nombre} no está activo.`);
        error.status = 400;
        throw error;
      }

      if (item.cantidad > Number(producto.stock)) {
        const error = new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}.`);
        error.status = 400;
        throw error;
      }

      const precioUnitario = Number(producto.precio_venta);
      const subtotal = roundMoney(precioUnitario * item.cantidad);

      return {
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario,
        subtotal,
      };
    });

    const subtotal = roundMoney(detalles.reduce((total, item) => total + item.subtotal, 0));
    const impuesto = roundMoney(subtotal * data.taxRate);
    const total = roundMoney(subtotal + impuesto);
    const cambio = data.metodoPago === "EFECTIVO" ? roundMoney(data.montoRecibido - total) : 0;

    if (data.montoRecibido < total) {
      const error = new Error("El monto recibido es insuficiente.");
      error.status = 400;
      throw error;
    }

    const ventaResult = await client.query(
      `INSERT INTO ventas (caja_id, usuario_id, metodo_pago, subtotal, impuesto, total, monto_recibido, cambio, observacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [caja.id, data.usuarioId, data.metodoPago, subtotal, impuesto, total, data.montoRecibido, cambio, data.observacion]
    );
    const venta = ventaResult.rows[0];

    for (const detalle of detalles) {
      await client.query(
        `INSERT INTO venta_detalles (venta_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [venta.id, detalle.productoId, detalle.cantidad, detalle.precioUnitario, detalle.subtotal]
      );

      await client.query(
        `UPDATE productos
         SET stock = stock - $1,
             actualizado_en = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [detalle.cantidad, detalle.productoId]
      );
    }

    await client.query(
      `INSERT INTO caja_movimientos (caja_id, venta_id, tipo, monto, descripcion)
       VALUES ($1, $2, 'INGRESO', $3, $4)`,
      [caja.id, venta.id, total, `Ingreso por venta #${venta.id} - ${data.metodoPago}`]
    );

    await client.query("COMMIT");

    return mapVenta(venta);
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

module.exports = {
  createSaleTransaction,
  findAllSales,
  findSaleById,
  findSaleDetails,
};
