const { query } = require("../../config/db");

function mapCategoria(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion || "",
    estado: row.estado,
    productos: Number(row.productos || 0),
  };
}

async function syncCategoriesFromProducts() {
  await query(`
    INSERT INTO categorias (nombre, estado)
    SELECT DISTINCT TRIM(categoria), true
    FROM productos
    WHERE categoria IS NOT NULL
      AND TRIM(categoria) <> ''
    ON CONFLICT (nombre) DO NOTHING
  `);
}

async function findAll() {
  await syncCategoriesFromProducts();
  const result = await query(`
    SELECT c.id,
           c.nombre,
           c.descripcion,
           c.estado,
           COUNT(p.id)::int AS productos
    FROM categorias c
    LEFT JOIN productos p ON LOWER(TRIM(p.categoria)) = LOWER(TRIM(c.nombre))
    GROUP BY c.id
    ORDER BY c.id ASC
  `);

  return result.rows.map(mapCategoria);
}

async function findById(id) {
  await syncCategoriesFromProducts();
  const result = await query(
    `SELECT c.id,
            c.nombre,
            c.descripcion,
            c.estado,
            COUNT(p.id)::int AS productos
     FROM categorias c
     LEFT JOIN productos p ON LOWER(TRIM(p.categoria)) = LOWER(TRIM(c.nombre))
     WHERE c.id = $1
     GROUP BY c.id`,
    [id]
  );

  return result.rows[0] ? mapCategoria(result.rows[0]) : null;
}

async function create(categoria) {
  const result = await query(
    `INSERT INTO categorias (nombre, descripcion, estado)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [categoria.nombre, categoria.descripcion, categoria.estado]
  );

  return findById(result.rows[0].id);
}

async function update(id, categoria) {
  const result = await query(
    `UPDATE categorias
     SET nombre = $1,
         descripcion = $2,
         estado = $3,
         actualizado_en = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING id`,
    [categoria.nombre, categoria.descripcion, categoria.estado, id]
  );

  return result.rows[0] ? findById(result.rows[0].id) : null;
}

async function remove(id) {
  const result = await query("DELETE FROM categorias WHERE id = $1 RETURNING id", [id]);
  return result.rowCount > 0;
}

module.exports = { findAll, findById, create, update, remove, syncCategoriesFromProducts };
