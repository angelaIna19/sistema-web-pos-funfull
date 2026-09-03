const { query } = require("../../config/db");

function mapMoney(value) {
  return Number(value || 0);
}

function getSalesPeriodCondition(periodo) {
  const conditions = {
    semana: "creada_en BETWEEN date_trunc('week', CURRENT_DATE) AND CURRENT_TIMESTAMP",
    quincena: `creada_en >= CASE
      WHEN EXTRACT(DAY FROM CURRENT_DATE) <= 15 THEN date_trunc('month', CURRENT_DATE)
      ELSE date_trunc('month', CURRENT_DATE) + INTERVAL '15 days'
    END AND creada_en <= CURRENT_TIMESTAMP`,
    mes: "creada_en BETWEEN date_trunc('month', CURRENT_DATE) AND CURRENT_TIMESTAMP",
    "mes-anterior": "creada_en >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' AND creada_en < date_trunc('month', CURRENT_DATE)",
    personalizado: "creada_en >= $1::date AND creada_en < $2::date + INTERVAL '1 day'",
    todo: "TRUE",
  };

  return conditions[periodo] || conditions.mes;
}

async function getSalesReport(periodo, desde, hasta) {
  const periodCondition = getSalesPeriodCondition(periodo);
  const params = periodo === "personalizado" ? [desde, hasta] : [];
  const summaryResult = await query(
    `SELECT
       COUNT(*) FILTER (WHERE estado = 'REGISTRADA')::int AS ventas_registradas,
       COUNT(*) FILTER (WHERE estado = 'ANULADA')::int AS ventas_anuladas,
       COALESCE(SUM(subtotal) FILTER (WHERE estado = 'REGISTRADA'), 0)::numeric AS subtotal,
       COALESCE(SUM(impuesto) FILTER (WHERE estado = 'REGISTRADA'), 0)::numeric AS impuesto,
       COALESCE(SUM(total) FILTER (WHERE estado = 'REGISTRADA'), 0)::numeric AS total
     FROM ventas
     WHERE ${periodCondition}`,
    params
  );

  const methodsResult = await query(
    `SELECT metodo_pago,
            COUNT(*)::int AS ventas,
            COALESCE(SUM(subtotal), 0)::numeric AS subtotal,
            COALESCE(SUM(impuesto), 0)::numeric AS impuesto,
            COALESCE(SUM(total), 0)::numeric AS total
     FROM ventas
     WHERE estado = 'REGISTRADA'
       AND ${periodCondition}
     GROUP BY metodo_pago
     ORDER BY metodo_pago ASC`,
    params
  );

  const row = summaryResult.rows[0] || {};
  return {
    resumen: {
      ventasRegistradas: Number(row.ventas_registradas || 0),
      ventasAnuladas: Number(row.ventas_anuladas || 0),
      subtotal: mapMoney(row.subtotal),
      impuesto: mapMoney(row.impuesto),
      total: mapMoney(row.total),
    },
    metodosPago: methodsResult.rows.map((item) => ({
      metodoPago: item.metodo_pago,
      ventas: Number(item.ventas || 0),
      subtotal: mapMoney(item.subtotal),
      impuesto: mapMoney(item.impuesto),
      total: mapMoney(item.total),
    })),
  };
}

function getOrderPeriodExpressions(periodo) {
  const expressions = {
    dia: {
      label: "to_char(date_trunc('day', v.creada_en), 'YYYY-MM-DD')",
      sort: "date_trunc('day', v.creada_en)",
    },
    semana: {
      label: "to_char(date_trunc('week', v.creada_en), 'IYYY') || ' - Semana ' || to_char(v.creada_en, 'IW')",
      sort: "date_trunc('week', v.creada_en)",
    },
    quincena: {
      label: "to_char(date_trunc('month', v.creada_en), 'YYYY-MM') || ' - Quincena ' || CASE WHEN EXTRACT(DAY FROM v.creada_en) <= 15 THEN '1' ELSE '2' END",
      sort: "date_trunc('month', v.creada_en) + CASE WHEN EXTRACT(DAY FROM v.creada_en) <= 15 THEN INTERVAL '0 days' ELSE INTERVAL '15 days' END",
    },
    mes: {
      label: "to_char(date_trunc('month', v.creada_en), 'YYYY-MM')",
      sort: "date_trunc('month', v.creada_en)",
    },
  };

  return expressions[periodo] || expressions.mes;
}

async function getOrdersReport(periodo) {
  const period = getOrderPeriodExpressions(periodo);
  const result = await query(
    `SELECT ${period.label} AS periodo,
            ${period.sort} AS orden_periodo,
            COUNT(DISTINCT v.id)::int AS ordenes,
            COALESCE(SUM(vd.cantidad), 0)::int AS productos_vendidos,
            COALESCE(SUM(vd.subtotal), 0)::numeric AS subtotal,
            COALESCE(SUM(vd.subtotal * 0.15), 0)::numeric AS impuesto,
            COALESCE(SUM(vd.subtotal * 1.15), 0)::numeric AS total
     FROM ventas v
     JOIN venta_detalles vd ON vd.venta_id = v.id
     WHERE v.estado = 'REGISTRADA'
     GROUP BY periodo, orden_periodo
     ORDER BY orden_periodo DESC`
  );

  return result.rows.map((item) => ({
    periodo: item.periodo,
    ordenes: Number(item.ordenes || 0),
    productosVendidos: Number(item.productos_vendidos || 0),
    subtotal: mapMoney(item.subtotal),
    impuesto: mapMoney(item.impuesto),
    total: mapMoney(item.total),
  }));
}

async function getTopProducts() {
  const result = await query(
    `SELECT p.id,
            p.codigo,
            p.nombre,
            p.categoria,
            p.marca,
            SUM(vd.cantidad)::int AS cantidad_vendida,
            COALESCE(SUM(vd.subtotal), 0)::numeric AS total_vendido
     FROM venta_detalles vd
     JOIN ventas v ON v.id = vd.venta_id
     JOIN productos p ON p.id = vd.producto_id
     WHERE v.estado = 'REGISTRADA'
     GROUP BY p.id, p.codigo, p.nombre, p.categoria, p.marca
     ORDER BY cantidad_vendida DESC, total_vendido DESC, p.nombre ASC
     LIMIT 20`
  );

  return result.rows.map((item) => ({
    id: item.id,
    codigo: item.codigo,
    nombre: item.nombre,
    categoria: item.categoria,
    marca: item.marca,
    cantidadVendida: Number(item.cantidad_vendida || 0),
    totalVendido: mapMoney(item.total_vendido),
  }));
}

async function getLowStockProducts() {
  const result = await query(
    `SELECT id, codigo, nombre, categoria, marca, stock, stock_minimo, estado
     FROM productos
     WHERE stock <= stock_minimo
     ORDER BY stock ASC, nombre ASC`
  );

  return result.rows.map((item) => ({
    id: item.id,
    codigo: item.codigo,
    nombre: item.nombre,
    categoria: item.categoria,
    marca: item.marca,
    stock: Number(item.stock || 0),
    stockMinimo: Number(item.stock_minimo || 0),
    estado: item.estado,
  }));
}

async function getCashBoxSalesReport(cajaId) {
  const cajaResult = await query(
    `SELECT c.*,
            u.usuario,
            COALESCE(vs.vendido, 0) AS vendido,
            COALESCE(vs.total_efectivo, 0) AS total_efectivo,
            COALESCE(vs.total_transferencia, 0) AS total_transferencia,
            COALESCE(vs.ventas_registradas, 0)::int AS ventas_registradas,
            COALESCE(vs.ventas_anuladas, 0)::int AS ventas_anuladas,
            COALESCE(ps.unidades_vendidas, 0)::int AS unidades_vendidas,
            COALESCE(ps.total_productos, 0) AS total_productos,
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
              SUM(total) FILTER (WHERE estado = 'REGISTRADA') AS vendido,
              SUM(total) FILTER (WHERE estado = 'REGISTRADA' AND metodo_pago = 'EFECTIVO') AS total_efectivo,
              SUM(total) FILTER (WHERE estado = 'REGISTRADA' AND metodo_pago = 'TRANSFERENCIA') AS total_transferencia,
              COUNT(*) FILTER (WHERE estado = 'REGISTRADA')::int AS ventas_registradas,
              COUNT(*) FILTER (WHERE estado = 'ANULADA')::int AS ventas_anuladas
       FROM ventas
       WHERE caja_id = $1
       GROUP BY caja_id
     ) vs ON vs.caja_id = c.id
     LEFT JOIN (
       SELECT v.caja_id,
              SUM(vd.cantidad)::int AS unidades_vendidas,
              SUM(vd.subtotal) AS total_productos
       FROM ventas v
       JOIN venta_detalles vd ON vd.venta_id = v.id
       WHERE v.caja_id = $1 AND v.estado = 'REGISTRADA'
       GROUP BY v.caja_id
     ) ps ON ps.caja_id = c.id
     LEFT JOIN (
       SELECT caja_id,
              SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END) AS ingresos_manuales,
              SUM(CASE WHEN tipo = 'EGRESO' THEN monto ELSE 0 END) AS egresos_manuales
       FROM caja_movimientos
       WHERE venta_id IS NULL AND caja_id = $1
       GROUP BY caja_id
     ) ms ON ms.caja_id = c.id
     WHERE c.id = $1`,
    [cajaId]
  );

  const caja = cajaResult.rows[0] || null;
  if (!caja) return null;

  const ventasResult = await query(
    `SELECT v.id,
            v.metodo_pago,
            v.subtotal,
            v.impuesto,
            v.total,
            v.estado,
            v.creada_en,
            c.nombre_trabajador
     FROM ventas v
     JOIN cajas c ON c.id = v.caja_id
     WHERE v.caja_id = $1
     ORDER BY v.creada_en DESC, v.id DESC`,
    [cajaId]
  );

  const metodosResult = await query(
    `SELECT metodo_pago,
            COUNT(*)::int AS ventas,
            COALESCE(SUM(total), 0)::numeric AS total
     FROM ventas
     WHERE caja_id = $1 AND estado = 'REGISTRADA'
     GROUP BY metodo_pago
     ORDER BY metodo_pago ASC`,
    [cajaId]
  );

  const productosResult = await query(
    `SELECT p.id,
            p.nombre,
            SUM(vd.cantidad)::int AS cantidad_vendida,
            CASE
              WHEN SUM(vd.cantidad) = 0 THEN 0
              ELSE SUM(vd.subtotal) / SUM(vd.cantidad)
            END AS precio_unitario,
            SUM(vd.subtotal) AS total_vendido
     FROM ventas v
     JOIN venta_detalles vd ON vd.venta_id = v.id
     JOIN productos p ON p.id = vd.producto_id
     WHERE v.caja_id = $1 AND v.estado = 'REGISTRADA'
     GROUP BY p.id, p.nombre
     ORDER BY p.nombre ASC`,
    [cajaId]
  );

  return {
    caja: {
      id: caja.id,
      usuario: caja.usuario,
      nombreTrabajador: caja.nombre_trabajador,
      estado: caja.estado,
      montoInicial: mapMoney(caja.monto_inicial),
      montoContado: caja.monto_contado === null ? null : mapMoney(caja.monto_contado),
      montoEsperado: caja.efectivo_esperado === null ? null : mapMoney(caja.efectivo_esperado),
      diferencia: caja.diferencia === null ? null : mapMoney(caja.diferencia),
      vendido: mapMoney(caja.vendido),
      totalEfectivo: mapMoney(caja.total_efectivo),
      totalTransferencia: mapMoney(caja.total_transferencia),
      ingresosManuales: mapMoney(caja.ingresos_manuales),
      egresosManuales: mapMoney(caja.egresos_manuales),
      abiertaEn: caja.abierta_en,
      cerradaEn: caja.cerrada_en,
    },
    resumen: {
      ventasRegistradas: Number(caja.ventas_registradas || 0),
      ventasAnuladas: Number(caja.ventas_anuladas || 0),
      unidadesVendidas: Number(caja.unidades_vendidas || 0),
      totalEfectivo: mapMoney(caja.total_efectivo),
      totalTransferencia: mapMoney(caja.total_transferencia),
      totalVendido: mapMoney(caja.vendido),
      totalProductos: mapMoney(caja.total_productos),
    },
    metodosPago: metodosResult.rows.map((item) => ({
      metodoPago: item.metodo_pago,
      ventas: Number(item.ventas || 0),
      total: mapMoney(item.total),
    })),
    productos: productosResult.rows.map((producto) => ({
      id: producto.id,
      nombre: producto.nombre,
      cantidadVendida: Number(producto.cantidad_vendida || 0),
      precioUnitario: mapMoney(producto.precio_unitario),
      totalVendido: mapMoney(producto.total_vendido),
    })),
    ventas: ventasResult.rows.map((venta) => ({
      id: venta.id,
      trabajador: venta.nombre_trabajador,
      metodoPago: venta.metodo_pago,
      subtotal: mapMoney(venta.subtotal),
      impuesto: mapMoney(venta.impuesto),
      total: mapMoney(venta.total),
      estado: venta.estado,
      creadaEn: venta.creada_en,
    })),
  };
}
module.exports = { getCashBoxSalesReport, getLowStockProducts, getOrdersReport, getSalesReport, getTopProducts };

