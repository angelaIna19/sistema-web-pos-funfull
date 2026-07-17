const categoryRepository = require("./category.repository");

function validateCategoryPayload(body) {
  const nombre = String(body.nombre || "").trim();
  const descripcion = body.descripcion ? String(body.descripcion).trim() : "";
  const estado = normalizeBoolean(body.estado);

  if (!nombre) return validationError("El nombre de la categoria es obligatorio.");
  if (estado === null) return validationError("El estado de la categoria debe ser activo o inactivo.");

  return { nombre, descripcion, estado };
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function normalizeDatabaseError(error) {
  if (error.code === "23505") {
    error.status = 400;
    error.message = "La categoria ya existe.";
  }
  return error;
}

async function listCategories() {
  return categoryRepository.findAll();
}

async function getCategoryById(id) {
  const categoria = await categoryRepository.findById(id);

  if (!categoria) {
    const error = new Error("Categoria no encontrada.");
    error.status = 404;
    throw error;
  }

  return categoria;
}

async function createCategory(body) {
  const categoria = validateCategoryPayload(body);

  try {
    return await categoryRepository.create(categoria);
  } catch (error) {
    throw normalizeDatabaseError(error);
  }
}

async function updateCategory(id, body) {
  const categoria = validateCategoryPayload(body);

  try {
    const updated = await categoryRepository.update(id, categoria);

    if (!updated) {
      const error = new Error("Categoria no encontrada.");
      error.status = 404;
      throw error;
    }

    return updated;
  } catch (error) {
    throw normalizeDatabaseError(error);
  }
}

async function deleteCategory(id) {
  const categoria = await getCategoryById(id);

  if (categoria.productos > 0) {
    const error = new Error("No se puede eliminar la categoria porque tiene productos asociados. Primero deben reasignarse o eliminarse esos productos.");
    error.status = 400;
    throw error;
  }

  const removed = await categoryRepository.remove(id);

  if (!removed) {
    const error = new Error("Categoria no encontrada.");
    error.status = 404;
    throw error;
  }

  return { mensaje: "Categoria eliminada." };
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
