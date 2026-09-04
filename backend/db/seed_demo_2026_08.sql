-- Datos demostrativos de cajas y ventas: 2026-08-05 a 2026-09-02.
-- Ejecutar con psql y ON_ERROR_STOP para que cualquier validacion detenga el lote:
--   psql -v ON_ERROR_STOP=1 -f backend/db/seed_demo_2026_08.sql

BEGIN;

SET LOCAL TIME ZONE 'America/Guayaquil';
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';

LOCK TABLE cajas, ventas, venta_detalles, caja_movimientos,
  inventario_movimientos, productos IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE _seed_open_box_before AS
SELECT id, usuario_id, nombre_trabajador, monto_inicial, observacion, estado,
       abierta_en, cerrada_en, monto_contado, monto_esperado, diferencia,
       observacion_cierre
FROM cajas
WHERE estado = 'ABIERTA';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cajas WHERE observacion LIKE 'SEED_DEMO_2026_08%'
    UNION ALL
    SELECT 1 FROM ventas WHERE observacion LIKE 'SEED_DEMO_2026_08%'
    UNION ALL
    SELECT 1 FROM caja_movimientos WHERE descripcion LIKE 'SEED_DEMO_2026_08%'
    UNION ALL
    SELECT 1 FROM inventario_movimientos WHERE motivo LIKE 'SEED_DEMO_2026_08%'
  ) THEN
    RAISE EXCEPTION 'El lote SEED_DEMO_2026_08 ya existe; no se aplicaron cambios.';
  END IF;

  IF (SELECT count(*) FROM usuarios_admin WHERE usuario = 'administrador') <> 1 THEN
    RAISE EXCEPTION 'Debe existir exactamente un usuario administrador.';
  END IF;

  IF (SELECT count(*) FROM _seed_open_box_before) <> 1
     OR NOT EXISTS (
       SELECT 1
       FROM _seed_open_box_before
       WHERE id = 1 AND nombre_trabajador = 'Raul'
     ) THEN
    RAISE EXCEPTION 'La caja abierta id=1 de Raul no coincide con el estado esperado.';
  END IF;
END;
$$;

CREATE TEMP TABLE _seed_required_products (codigo varchar(30) PRIMARY KEY);

INSERT INTO _seed_required_products (codigo)
SELECT unnest(ARRAY[
  'CE001', 'CE002', 'CE003', 'CE004',
  'BS001', 'BS002', 'BS003', 'GA001',
  'WH001', 'WH002', 'WH003', 'WH004', 'WH005',
  'VO002', 'VO003',
  'RO002', 'RO003', 'RO004',
  'TE001', 'TE002', 'TE003',
  'GI001', 'GI002', 'GI003',
  'VI001', 'VI002', 'VI003',
  'LA001', 'LA002', 'LA003'
]);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM _seed_required_products required
    LEFT JOIN productos product ON product.codigo = required.codigo
    WHERE product.id IS NULL OR NOT product.estado
  ) THEN
    RAISE EXCEPTION 'Falta al menos un producto requerido o se encuentra inactivo.';
  END IF;
END;
$$;

CREATE TEMP TABLE _seed_sessions (
  dia date PRIMARY KEY,
  ventas integer NOT NULL,
  monto_inicial numeric(10, 2) NOT NULL,
  apertura time NOT NULL,
  cierre time NOT NULL,
  diferencia numeric(10, 2) NOT NULL DEFAULT 0
);

INSERT INTO _seed_sessions
  (dia, ventas, monto_inicial, apertura, cierre, diferencia)
VALUES
  ('2026-08-05', 3, 100.00, '14:05', '22:45',  0.00),
  ('2026-08-06', 3, 100.00, '14:00', '22:55',  0.00),
  ('2026-08-07', 6, 120.00, '14:10', '23:25',  0.00),
  ('2026-08-08', 7, 150.00, '14:00', '23:30',  1.50),
  ('2026-08-09', 4, 100.00, '14:15', '22:40',  0.00),
  ('2026-08-11', 3,  80.00, '14:05', '22:35',  0.00),
  ('2026-08-12', 3, 100.00, '14:10', '22:45', -1.00),
  ('2026-08-13', 4, 100.00, '14:00', '22:50',  0.00),
  ('2026-08-14', 6, 120.00, '14:05', '23:20',  0.00),
  ('2026-08-15', 7, 150.00, '14:00', '23:30',  0.00),
  ('2026-08-16', 4, 100.00, '14:20', '22:40',  0.00),
  ('2026-08-18', 3,  80.00, '14:10', '22:35',  0.00),
  ('2026-08-19', 3, 100.00, '14:05', '22:45',  0.00),
  ('2026-08-20', 4, 100.00, '14:00', '22:55',  0.50),
  ('2026-08-21', 6, 120.00, '14:10', '23:20',  0.00),
  ('2026-08-22', 7, 150.00, '14:00', '23:30',  0.00),
  ('2026-08-23', 4, 100.00, '14:15', '22:45',  0.00),
  ('2026-08-25', 3,  80.00, '14:05', '22:35',  0.00),
  ('2026-08-26', 3, 100.00, '14:10', '22:50',  0.00),
  ('2026-08-27', 4, 100.00, '14:00', '22:55',  0.00),
  ('2026-08-28', 6, 120.00, '14:05', '23:20', -2.00),
  ('2026-08-29', 7, 150.00, '14:00', '23:30',  0.00),
  ('2026-08-30', 4, 100.00, '14:20', '22:40',  0.00),
  ('2026-09-01', 3,  80.00, '14:05', '22:35',  0.00),
  ('2026-09-02', 3, 100.00, '14:10', '22:45',  0.00);

CREATE TEMP TABLE _seed_sales_plan AS
WITH generated AS (
  SELECT
    session.dia,
    session.apertura,
    session.cierre,
    sale.ordinal,
    row_number() OVER (ORDER BY session.dia, sale.ordinal)::integer AS sale_key
  FROM _seed_sessions session
  CROSS JOIN LATERAL generate_series(1, session.ventas) AS sale(ordinal)
)
SELECT
  sale_key,
  dia,
  ordinal,
  dia + apertura + interval '30 minutes'
    + (cierre - apertura - interval '60 minutes')
      * ((ordinal - 1)::double precision / greatest((SELECT ventas - 1 FROM _seed_sessions WHERE dia = generated.dia), 1))
      AS creada_en,
  CASE WHEN sale_key % 10 IN (0, 3, 7) THEN 'TRANSFERENCIA' ELSE 'EFECTIVO' END
    AS metodo_pago,
  sale_key IN (17, 44, 78, 103) AS anulada
FROM generated;

CREATE TEMP TABLE _seed_item_occurrences AS
WITH raw_items AS (
  SELECT
    sale.sale_key,
    item.ordinal AS item_ordinal,
    row_number() OVER (ORDER BY sale.sale_key, item.ordinal)::integer AS item_index
  FROM _seed_sales_plan sale
  CROSS JOIN LATERAL generate_series(1, 1 + sale.sale_key % 3) AS item(ordinal)
), classified AS (
  SELECT *,
    CASE
      -- 73 es coprimo con 100: mezcla las categorias entre ventas y conserva
      -- la proporcion objetivo a lo largo del lote completo.
      WHEN 1 + (item_index * 73) % 100 <= 40 THEN 'CERVEZA'
      WHEN 1 + (item_index * 73) % 100 <= 65 THEN 'BEBIDA'
      WHEN 1 + (item_index * 73) % 100 <= 80 THEN 'WHISKY'
      WHEN 1 + (item_index * 73) % 100 <= 88 THEN 'VODKA'
      WHEN 1 + (item_index * 73) % 100 <= 93 THEN 'RON'
      ELSE 'VARIOS'
    END AS grupo
  FROM raw_items
), numbered AS (
  SELECT *, row_number() OVER (PARTITION BY grupo ORDER BY item_index)::integer AS grupo_index
  FROM classified
)
SELECT
  sale_key,
  item_ordinal,
  grupo,
  CASE grupo
    WHEN 'CERVEZA' THEN (ARRAY['CE001','CE002','CE003','CE004'])[1 + (grupo_index - 1) % 4]
    WHEN 'BEBIDA'  THEN (ARRAY['BS001','BS002','BS003','GA001'])[1 + (grupo_index - 1) % 4]
    WHEN 'WHISKY'  THEN (ARRAY['WH001','WH002','WH003','WH004','WH005'])[1 + (grupo_index - 1) % 5]
    WHEN 'VODKA'   THEN (ARRAY['VO002','VO003'])[1 + (grupo_index - 1) % 2]
    WHEN 'RON'     THEN (ARRAY['RO002','RO003','RO004'])[1 + (grupo_index - 1) % 3]
    ELSE (ARRAY[
      'TE001','TE002','TE003','GI001','GI002','GI003',
      'VI001','VI002','VI003','LA001','LA002','LA003'
    ])[1 + (grupo_index - 1) % 12]
  END AS codigo,
  CASE
    WHEN grupo = 'CERVEZA' THEN 1 + (sale_key * 3 + item_ordinal) % 6
    WHEN grupo = 'BEBIDA' THEN 1 + (sale_key * 5 + item_ordinal) % 4
    ELSE 1
  END::integer AS cantidad
FROM numbered;

CREATE TEMP TABLE _seed_details_plan AS
SELECT
  item.sale_key,
  product.id AS producto_id,
  item.codigo,
  sum(item.cantidad)::integer AS cantidad,
  product.precio_venta AS precio_unitario,
  round(product.precio_venta * sum(item.cantidad), 2) AS subtotal
FROM _seed_item_occurrences item
JOIN productos product ON product.codigo = item.codigo
GROUP BY item.sale_key, product.id, item.codigo, product.precio_venta;

CREATE TEMP TABLE _seed_sale_amounts AS
SELECT
  plan.*,
  amount.subtotal,
  round(amount.subtotal * 0.15, 2) AS impuesto,
  round(amount.subtotal + round(amount.subtotal * 0.15, 2), 2) AS total
FROM _seed_sales_plan plan
JOIN (
  SELECT sale_key, round(sum(subtotal), 2) AS subtotal
  FROM _seed_details_plan
  GROUP BY sale_key
) amount USING (sale_key);

-- Previsualizacion del lote. Estas consultas ocurren antes de insertar datos permanentes.
SELECT
  (SELECT count(*) FROM _seed_sessions) AS cajas,
  count(*) AS ventas,
  count(*) FILTER (WHERE metodo_pago = 'EFECTIVO') AS efectivo,
  count(*) FILTER (WHERE metodo_pago = 'TRANSFERENCIA') AS transferencia,
  count(*) FILTER (WHERE anulada) AS anuladas,
  round(sum(total), 2) AS total_bruto
FROM _seed_sale_amounts;

SELECT
  item.grupo,
  count(*) AS lineas_de_producto,
  round(count(*) * 100.0 / sum(count(*)) OVER (), 1) AS porcentaje
FROM _seed_item_occurrences item
GROUP BY item.grupo
ORDER BY item.grupo;

CREATE TEMP TABLE _seed_stock_before AS
SELECT id AS producto_id, stock
FROM productos;

CREATE TEMP TABLE _seed_net_units AS
SELECT detail.producto_id, sum(detail.cantidad)::integer AS cantidad
FROM _seed_details_plan detail
JOIN _seed_sales_plan sale USING (sale_key)
WHERE NOT sale.anulada
GROUP BY detail.producto_id;

INSERT INTO inventario_movimientos (
  producto_id, usuario_id, tipo, cantidad_anterior, cantidad_movimiento,
  cantidad_nueva, motivo, creado_en
)
SELECT
  net.producto_id,
  admin.id,
  'ENTRADA',
  stock.stock,
  net.cantidad,
  stock.stock + net.cantidad,
  'SEED_DEMO_2026_08|REPOSICION_PREVIA',
  timestamp '2026-08-04 09:00:00'
FROM _seed_net_units net
JOIN _seed_stock_before stock USING (producto_id)
CROSS JOIN (SELECT id FROM usuarios_admin WHERE usuario = 'administrador') admin;

UPDATE productos product
SET stock = product.stock + net.cantidad
FROM _seed_net_units net
WHERE product.id = net.producto_id;

INSERT INTO cajas (
  usuario_id, nombre_trabajador, monto_inicial, observacion, estado,
  abierta_en, cerrada_en
)
SELECT
  admin.id,
  'Raul',
  session.monto_inicial,
  'SEED_DEMO_2026_08|CAJA|' || to_char(session.dia, 'YYYY-MM-DD'),
  'CERRADA',
  session.dia + session.apertura,
  session.dia + session.cierre
FROM _seed_sessions session
CROSS JOIN (SELECT id FROM usuarios_admin WHERE usuario = 'administrador') admin
ORDER BY session.dia;

CREATE TEMP TABLE _seed_boxes AS
SELECT
  session.dia,
  box.id AS caja_id
FROM _seed_sessions session
JOIN cajas box
  ON box.observacion = 'SEED_DEMO_2026_08|CAJA|' || to_char(session.dia, 'YYYY-MM-DD');

INSERT INTO ventas (
  caja_id, usuario_id, metodo_pago, subtotal, impuesto, total,
  monto_recibido, cambio, observacion, creada_en, estado,
  motivo_anulacion, anulada_en
)
SELECT
  box.caja_id,
  admin.id,
  sale.metodo_pago,
  sale.subtotal,
  sale.impuesto,
  sale.total,
  CASE
    WHEN sale.metodo_pago = 'EFECTIVO' THEN ceil(sale.total / 5.0) * 5
    ELSE sale.total
  END,
  CASE
    WHEN sale.metodo_pago = 'EFECTIVO' THEN round(ceil(sale.total / 5.0) * 5 - sale.total, 2)
    ELSE 0
  END,
  'SEED_DEMO_2026_08|VENTA|' || lpad(sale.sale_key::text, 4, '0'),
  sale.creada_en,
  CASE WHEN sale.anulada THEN 'ANULADA' ELSE 'REGISTRADA' END,
  CASE WHEN sale.anulada THEN 'Anulacion demostrativa: cliente cambio de pedido' END,
  CASE WHEN sale.anulada THEN sale.creada_en + interval '20 minutes' END
FROM _seed_sale_amounts sale
JOIN _seed_boxes box USING (dia)
CROSS JOIN (SELECT id FROM usuarios_admin WHERE usuario = 'administrador') admin
ORDER BY sale.sale_key;

CREATE TEMP TABLE _seed_sales_inserted AS
SELECT
  plan.sale_key,
  sale.id AS venta_id,
  plan.anulada
FROM _seed_sales_plan plan
JOIN ventas sale
  ON sale.observacion = 'SEED_DEMO_2026_08|VENTA|' || lpad(plan.sale_key::text, 4, '0');

INSERT INTO venta_detalles (
  venta_id, producto_id, cantidad, precio_unitario, subtotal
)
SELECT
  inserted.venta_id,
  detail.producto_id,
  detail.cantidad,
  detail.precio_unitario,
  detail.subtotal
FROM _seed_details_plan detail
JOIN _seed_sales_inserted inserted USING (sale_key)
ORDER BY detail.sale_key, detail.producto_id;

-- Simula el descuento de todas las ventas y la restitucion de las anuladas.
UPDATE productos product
SET stock = product.stock - sold.cantidad
FROM (
  SELECT producto_id, sum(cantidad)::integer AS cantidad
  FROM _seed_details_plan
  GROUP BY producto_id
) sold
WHERE product.id = sold.producto_id;

UPDATE productos product
SET stock = product.stock + cancelled.cantidad
FROM (
  SELECT detail.producto_id, sum(detail.cantidad)::integer AS cantidad
  FROM _seed_details_plan detail
  JOIN _seed_sales_plan sale USING (sale_key)
  WHERE sale.anulada
  GROUP BY detail.producto_id
) cancelled
WHERE product.id = cancelled.producto_id;

INSERT INTO caja_movimientos (
  caja_id, venta_id, tipo, monto, descripcion, creado_en
)
SELECT
  sale.caja_id,
  sale.id,
  'INGRESO',
  sale.total,
  'SEED_DEMO_2026_08|INGRESO_VENTA|' || sale.id,
  sale.creada_en
FROM ventas sale
WHERE sale.observacion LIKE 'SEED_DEMO_2026_08|VENTA|%';

INSERT INTO caja_movimientos (
  caja_id, venta_id, tipo, monto, descripcion, creado_en
)
SELECT
  sale.caja_id,
  sale.id,
  'EGRESO',
  sale.total,
  'SEED_DEMO_2026_08|ANULACION_VENTA|' || sale.id,
  sale.anulada_en
FROM ventas sale
WHERE sale.observacion LIKE 'SEED_DEMO_2026_08|VENTA|%'
  AND sale.estado = 'ANULADA';

CREATE TEMP TABLE _seed_manual_movements (
  dia date,
  hora time,
  tipo varchar(20),
  monto numeric(10, 2),
  detalle text
);

INSERT INTO _seed_manual_movements (dia, hora, tipo, monto, detalle)
VALUES
  ('2026-08-07', '16:00', 'INGRESO', 20.00, 'Fondo adicional de cambio'),
  ('2026-08-15', '18:30', 'EGRESO',  12.00, 'Compra de hielo'),
  ('2026-08-22', '20:15', 'EGRESO',   8.00, 'Transporte local'),
  ('2026-08-27', '16:30', 'INGRESO', 15.00, 'Fondo adicional de cambio'),
  ('2026-08-29', '19:00', 'EGRESO',  18.50, 'Compra de hielo e insumos');

INSERT INTO caja_movimientos (
  caja_id, venta_id, tipo, monto, descripcion, creado_en
)
SELECT
  box.caja_id,
  NULL,
  movement.tipo,
  movement.monto,
  'SEED_DEMO_2026_08|MOVIMIENTO_MANUAL|' || movement.detalle,
  movement.dia + movement.hora
FROM _seed_manual_movements movement
JOIN _seed_boxes box USING (dia);

WITH totals AS (
  SELECT
    box.caja_id,
    session.monto_inicial,
    session.diferencia,
    coalesce(sum(sale.total) FILTER (
      WHERE sale.estado = 'REGISTRADA' AND sale.metodo_pago = 'EFECTIVO'
    ), 0) AS efectivo,
    coalesce(sum(movement.monto) FILTER (
      WHERE movement.venta_id IS NULL AND movement.tipo = 'INGRESO'
    ), 0) AS ingresos_manuales,
    coalesce(sum(movement.monto) FILTER (
      WHERE movement.venta_id IS NULL AND movement.tipo = 'EGRESO'
    ), 0) AS egresos_manuales
  FROM _seed_boxes box
  JOIN _seed_sessions session USING (dia)
  LEFT JOIN ventas sale ON sale.caja_id = box.caja_id
  LEFT JOIN caja_movimientos movement ON movement.caja_id = box.caja_id
    AND movement.venta_id IS NULL
  GROUP BY box.caja_id, session.monto_inicial, session.diferencia
), calculated AS (
  SELECT
    caja_id,
    round(monto_inicial + efectivo + ingresos_manuales - egresos_manuales, 2) AS esperado,
    diferencia
  FROM totals
)
UPDATE cajas box
SET monto_esperado = calculated.esperado,
    monto_contado = calculated.esperado + calculated.diferencia,
    diferencia = calculated.diferencia,
    observacion_cierre = 'SEED_DEMO_2026_08|CIERRE_CALCULADO'
FROM calculated
WHERE box.id = calculated.caja_id;

DO $$
DECLARE
  invalid_count integer;
BEGIN
  IF (SELECT count(*) FROM cajas WHERE observacion LIKE 'SEED_DEMO_2026_08|CAJA|%') <> 25 THEN
    RAISE EXCEPTION 'Validacion fallida: se esperaban 25 cajas.';
  END IF;

  IF (SELECT count(*) FROM ventas WHERE observacion LIKE 'SEED_DEMO_2026_08|VENTA|%') <> 110 THEN
    RAISE EXCEPTION 'Validacion fallida: se esperaban 110 ventas.';
  END IF;

  IF (SELECT count(*) FROM ventas WHERE observacion LIKE 'SEED_DEMO_2026_08|VENTA|%' AND metodo_pago = 'EFECTIVO') <> 77
     OR (SELECT count(*) FROM ventas WHERE observacion LIKE 'SEED_DEMO_2026_08|VENTA|%' AND metodo_pago = 'TRANSFERENCIA') <> 33 THEN
    RAISE EXCEPTION 'Validacion fallida: distribucion de metodos de pago incorrecta.';
  END IF;

  IF (SELECT count(*) FROM ventas WHERE observacion LIKE 'SEED_DEMO_2026_08|VENTA|%' AND estado = 'ANULADA') <> 4 THEN
    RAISE EXCEPTION 'Validacion fallida: se esperaban 4 ventas anuladas.';
  END IF;

  IF (SELECT count(*) FROM caja_movimientos WHERE descripcion LIKE 'SEED_DEMO_2026_08|MOVIMIENTO_MANUAL|%') <> 5 THEN
    RAISE EXCEPTION 'Validacion fallida: se esperaban 5 movimientos manuales.';
  END IF;

  SELECT count(*) INTO invalid_count
  FROM ventas sale
  WHERE sale.observacion LIKE 'SEED_DEMO_2026_08|VENTA|%'
    AND (
      NOT EXISTS (SELECT 1 FROM venta_detalles detail WHERE detail.venta_id = sale.id)
      OR (SELECT count(*) FROM caja_movimientos movement
          WHERE movement.venta_id = sale.id AND movement.tipo = 'INGRESO') <> 1
      OR (sale.estado = 'ANULADA' AND
          (SELECT count(*) FROM caja_movimientos movement
           WHERE movement.venta_id = sale.id AND movement.tipo = 'EGRESO') <> 1)
    );
  IF invalid_count <> 0 THEN
    RAISE EXCEPTION 'Validacion fallida: % ventas tienen detalles o movimientos incompletos.', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM ventas sale
  JOIN cajas box ON box.id = sale.caja_id
  WHERE sale.observacion LIKE 'SEED_DEMO_2026_08|VENTA|%'
    AND (sale.creada_en < box.abierta_en OR sale.creada_en > box.cerrada_en);
  IF invalid_count <> 0 THEN
    RAISE EXCEPTION 'Validacion fallida: % ventas quedaron fuera del horario de caja.', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM ventas sale
  JOIN (
    SELECT venta_id, round(sum(subtotal), 2) AS subtotal
    FROM venta_detalles
    GROUP BY venta_id
  ) detail ON detail.venta_id = sale.id
  WHERE sale.observacion LIKE 'SEED_DEMO_2026_08|VENTA|%'
    AND (
      sale.subtotal <> detail.subtotal
      OR sale.impuesto <> round(detail.subtotal * 0.15, 2)
      OR sale.total <> round(detail.subtotal + round(detail.subtotal * 0.15, 2), 2)
      OR sale.monto_recibido - sale.total <> sale.cambio
    );
  IF invalid_count <> 0 THEN
    RAISE EXCEPTION 'Validacion fallida: % ventas tienen importes incorrectos.', invalid_count;
  END IF;

  IF EXISTS (SELECT 1 FROM productos WHERE stock < 0) THEN
    RAISE EXCEPTION 'Validacion fallida: existe stock negativo.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM productos product
    JOIN _seed_stock_before before_stock ON before_stock.producto_id = product.id
    WHERE product.stock <> before_stock.stock
  ) THEN
    RAISE EXCEPTION 'Validacion fallida: el stock final no coincide con el stock inicial.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM (
      (SELECT id, usuario_id, nombre_trabajador, monto_inicial, observacion, estado,
              abierta_en, cerrada_en, monto_contado, monto_esperado, diferencia,
              observacion_cierre
       FROM cajas WHERE estado = 'ABIERTA')
      EXCEPT
      (SELECT * FROM _seed_open_box_before)
    ) changed_open_box
  ) OR EXISTS (
    SELECT 1 FROM (
      (SELECT * FROM _seed_open_box_before)
      EXCEPT
      (SELECT id, usuario_id, nombre_trabajador, monto_inicial, observacion, estado,
              abierta_en, cerrada_en, monto_contado, monto_esperado, diferencia,
              observacion_cierre
       FROM cajas WHERE estado = 'ABIERTA')
    ) missing_open_box
  ) THEN
    RAISE EXCEPTION 'Validacion fallida: la caja abierta original fue modificada.';
  END IF;
END;
$$;

-- Resumen final previo al COMMIT.
SELECT
  (SELECT count(*) FROM cajas
   WHERE observacion LIKE 'SEED_DEMO_2026_08|CAJA|%') AS cajas,
  count(*) AS ventas,
  count(*) FILTER (WHERE estado = 'ANULADA') AS anuladas,
  round(sum(total) FILTER (WHERE estado = 'REGISTRADA'), 2) AS total_registrado
FROM ventas
WHERE observacion LIKE 'SEED_DEMO_2026_08|VENTA|%';

SELECT id, nombre_trabajador, estado, monto_inicial, monto_esperado,
       monto_contado, diferencia, abierta_en, cerrada_en
FROM cajas
WHERE observacion LIKE 'SEED_DEMO_2026_08|CAJA|%'
ORDER BY abierta_en;

COMMIT;
