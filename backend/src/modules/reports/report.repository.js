const { query } = require("../../config/db");

function mapMoney(value) {
  return Number(value || 0);
}

async function getSalesReport() {
  const summaryResult = await query(
    `SELECT
       COUNT(*) FILTER (WHERE estado = 'REGISTRADA')::int AS ventas_registradas,
       COUNT(*) FILTER (WHERE estado = 'ANULADA')::int AS ventas_anuladas,
       COALESCE(SUM(subtotal) FILTER (WHERE estado = 'REGISTRADA'), 0)::numeric AS subtotal,
       COALESCE(SUM(impuesto) FILTER (WHERE estado = 'REGISTRADA'), 0)::numeric AS impuesto,
       COALESCE(SUM(total) FILTER (WHERE estado = 'REGISTRADA'), 0)::numeric AS total
     FROM ventas`
  );

  const methodsResult = await query(
    `SELECT metodo_pago,
            COUNT(*)::int AS ventas,
            COALESCE(SUM(subtotal), 0)::numeric AS subtotal,
            COALESCE(SUM(impuesto), 0)::numeric AS impuesto,
            COALESCE(SUM(total), 0)::numeric AS total
     FROM ventas
     WHERE estado = 'REGISTRADA'
     GROUP BY metodo_pago
     ORDER BY metodo_pago ASC`
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

module.exports = { getLowStockProducts, getOrdersReport, getSalesReport, getTopProducts };
