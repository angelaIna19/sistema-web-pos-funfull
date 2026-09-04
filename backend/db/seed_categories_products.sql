-- Datos tentativos para el catalogo de Licoreria Fun Full.
-- PostgreSQL 17.
--
-- El esquema actual no relaciona productos con categorias mediante una FK:
-- productos.categoria almacena el nombre de la categoria. Por eso este seed
-- obtiene los nombres guardados por el CTE categorias_guardadas y los usa al
-- construir los productos.

BEGIN;

WITH categorias_fuente (nombre, descripcion, estado) AS (
  VALUES
    ('Whisky', 'Whiskies nacionales e importados.', true),
    ('Vodka',  'Vodkas clasicos y saborizados.', true),
    ('Vino',   'Vinos tintos, blancos y espumosos.', true),
    ('Ron',    'Rones blancos, dorados y añejos.', true),
    ('Cerveza', 'Cervezas nacionales, importadas y artesanales.', true),
    ('Tequila', 'Tequilas blancos, reposados y añejos.', true),
    ('Gin', 'Ginebras clasicas y premium.', true),
    ('Licores y aperitivos', 'Licores cremosos, herbales y aperitivos.', true),
    ('Bebidas sin alcohol', 'Agua, gaseosas y mezcladores.', true)
),
categorias_guardadas AS (
  INSERT INTO categorias (nombre, descripcion, estado)
  SELECT nombre, descripcion, estado
  FROM categorias_fuente
  ON CONFLICT (nombre) DO UPDATE
  -- El UPDATE sin cambios permite obtener tambien las categorias existentes
  -- mediante RETURNING sin sobrescribir su descripcion o estado actual.
  SET nombre = EXCLUDED.nombre
  RETURNING id, nombre
),
productos_fuente (
  codigo,
  nombre,
  categoria_nombre,
  marca,
  precio_compra,
  precio_venta,
  stock,
  stock_minimo,
  imagen,
  estado
) AS (
  VALUES
    ('WH001', 'Whisky Reserva 700 ml', 'Whisky', 'Fun Full', 18.00, 25.00, 12, 3, '/productos/whisky-reserva.svg', true),
    ('WH002', 'Johnnie Walker Red Label 750 ml', 'Whisky', 'Johnnie Walker', 20.50, 28.00, 10, 3, '/productos/whisky-reserva.svg', true),
    ('WH003', 'Chivas Regal 12 Años 750 ml', 'Whisky', 'Chivas Regal', 31.00, 42.00, 8, 2, '/productos/whisky-reserva.svg', true),
    ('WH004', 'Jack Daniels Old No. 7 750 ml', 'Whisky', 'Jack Daniels', 29.00, 39.00, 8, 2, '/productos/whisky-reserva.svg', true),
    ('VO001', 'Vodka Clasico 750 ml',  'Vodka',  'Fun Full', 10.00, 15.00, 18, 4, '/productos/vodka-clasico.svg', true),
    ('VO002', 'Absolut Vodka Original 750 ml', 'Vodka', 'Absolut', 18.00, 25.00, 12, 3, '/productos/vodka-clasico.svg', true),
    ('VO003', 'Skyy Vodka 750 ml', 'Vodka', 'Skyy', 13.00, 19.00, 12, 3, '/productos/vodka-clasico.svg', true),
    ('VI001', 'Vino Tinto 750 ml',     'Vino',   'Fun Full',  8.50, 13.00, 15, 4, '/productos/vino-tinto.svg', true),
    ('VI002', 'Casillero del Diablo Cabernet Sauvignon 750 ml', 'Vino', 'Casillero del Diablo', 10.50, 16.00, 10, 3, '/productos/vino-tinto.svg', true),
    ('VI003', 'Santa Carolina Sauvignon Blanc 750 ml', 'Vino', 'Santa Carolina', 8.50, 13.50, 10, 3, '/productos/vino-tinto.svg', true),
    ('RO001', 'Ron Añejo 750 ml',      'Ron',    'Fun Full', 12.00, 18.00, 14, 3, '/productos/ron-anejo.svg', true),
    ('RO002', 'Ron Abuelo 7 Años 750 ml', 'Ron', 'Ron Abuelo', 19.00, 27.00, 10, 3, '/productos/ron-anejo.svg', true),
    ('RO003', 'Bacardi Carta Blanca 750 ml', 'Ron', 'Bacardi', 14.00, 20.00, 14, 4, '/productos/ron-anejo.svg', true),
    ('RO004', 'Havana Club Añejo Especial 750 ml', 'Ron', 'Havana Club', 16.50, 23.00, 10, 3, '/productos/ron-anejo.svg', true),
    ('CE001', 'Pilsener Botella 330 ml', 'Cerveza', 'Pilsener', 0.75, 1.25, 48, 12, '/productos/cerveza.svg', true),
    ('CE002', 'Club Premium Botella 330 ml', 'Cerveza', 'Club', 0.90, 1.50, 36, 12, '/productos/cerveza.svg', true),
    ('CE003', 'Corona Extra Botella 355 ml', 'Cerveza', 'Corona', 1.50, 2.50, 24, 6, '/productos/cerveza.svg', true),
    ('CE004', 'Heineken Botella 330 ml', 'Cerveza', 'Heineken', 1.35, 2.25, 24, 6, '/productos/cerveza.svg', true),
    ('TE001', 'José Cuervo Especial Reposado 750 ml', 'Tequila', 'José Cuervo', 20.00, 29.00, 8, 2, '/productos/tequila.svg', true),
    ('TE002', 'Olmeca Reposado 750 ml', 'Tequila', 'Olmeca', 22.00, 31.00, 8, 2, '/productos/tequila.svg', true),
    ('TE003', 'Don Julio Blanco 750 ml', 'Tequila', 'Don Julio', 45.00, 59.00, 6, 2, '/productos/tequila.svg', true),
    ('GI001', 'Gordons London Dry Gin 750 ml', 'Gin', 'Gordons', 16.00, 23.00, 10, 3, '/productos/gin.svg', true),
    ('GI002', 'Tanqueray London Dry Gin 750 ml', 'Gin', 'Tanqueray', 24.00, 34.00, 8, 2, '/productos/gin.svg', true),
    ('GI003', 'Bombay Sapphire Gin 750 ml', 'Gin', 'Bombay Sapphire', 25.00, 35.00, 8, 2, '/productos/gin.svg', true),
    ('LA001', 'Jägermeister 700 ml', 'Licores y aperitivos', 'Jägermeister', 21.00, 30.00, 8, 2, '/productos/licor.svg', true),
    ('LA002', 'Baileys Original 750 ml', 'Licores y aperitivos', 'Baileys', 20.00, 29.00, 8, 2, '/productos/licor.svg', true),
    ('LA003', 'Disaronno Amaretto 700 ml', 'Licores y aperitivos', 'Disaronno', 23.00, 33.00, 6, 2, '/productos/licor.svg', true),
    ('BS001', 'Coca-Cola Original 1.35 l', 'Bebidas sin alcohol', 'Coca-Cola', 1.20, 2.00, 24, 6, '/productos/bebida-sin-alcohol.svg', true),
    ('BS002', 'Agua Mineral 500 ml', 'Bebidas sin alcohol', 'Güitig', 0.60, 1.00, 24, 6, '/productos/bebida-sin-alcohol.svg', true),
    ('BS003', 'Ginger Ale 1 l', 'Bebidas sin alcohol', 'Canada Dry', 1.50, 2.50, 18, 5, '/productos/bebida-sin-alcohol.svg', true)
)
INSERT INTO productos (
  codigo,
  nombre,
  categoria,
  marca,
  precio_compra,
  precio_venta,
  stock,
  stock_minimo,
  imagen,
  estado
)
SELECT
  p.codigo,
  p.nombre,
  c.nombre,
  p.marca,
  p.precio_compra,
  p.precio_venta,
  p.stock,
  p.stock_minimo,
  p.imagen,
  p.estado
FROM productos_fuente p
JOIN categorias_guardadas c
  ON c.nombre = p.categoria_nombre
-- No modifica productos existentes ni restablece su stock al repetir el seed.
ON CONFLICT (codigo) DO NOTHING;

COMMIT;

-- Comprobacion opcional del resultado.
SELECT
  c.id AS categoria_id,
  c.nombre AS categoria,
  COUNT(p.id)::int AS total_productos
FROM categorias c
LEFT JOIN productos p
  ON LOWER(TRIM(p.categoria)) = LOWER(TRIM(c.nombre))
WHERE c.nombre IN (
  'Whisky',
  'Vodka',
  'Vino',
  'Ron',
  'Cerveza',
  'Tequila',
  'Gin',
  'Licores y aperitivos',
  'Bebidas sin alcohol'
)
GROUP BY c.id, c.nombre
ORDER BY c.id;
