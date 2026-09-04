-- Elimina exclusivamente el lote SEED_DEMO_2026_08.
-- El stock no se modifica porque el seed conserva el stock neto original.

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';

LOCK TABLE cajas, ventas, venta_detalles, caja_movimientos,
  inventario_movimientos IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE _rollback_sales AS
SELECT id
FROM ventas
WHERE observacion LIKE 'SEED_DEMO_2026_08|VENTA|%';

CREATE TEMP TABLE _rollback_boxes AS
SELECT id
FROM cajas
WHERE observacion LIKE 'SEED_DEMO_2026_08|CAJA|%';

DELETE FROM caja_movimientos movement
WHERE movement.venta_id IN (SELECT id FROM _rollback_sales)
   OR movement.caja_id IN (SELECT id FROM _rollback_boxes)
   OR movement.descripcion LIKE 'SEED_DEMO_2026_08%';

DELETE FROM ventas
WHERE id IN (SELECT id FROM _rollback_sales);

DELETE FROM cajas
WHERE id IN (SELECT id FROM _rollback_boxes);

DELETE FROM inventario_movimientos
WHERE motivo LIKE 'SEED_DEMO_2026_08%';

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
    RAISE EXCEPTION 'No se pudo eliminar completamente SEED_DEMO_2026_08.';
  END IF;
END;
$$;

COMMIT;
