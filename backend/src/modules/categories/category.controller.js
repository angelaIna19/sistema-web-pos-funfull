const categoryService = require("./category.service");

async function list(req, res) {
  try {
    const categorias = await categoryService.listCategories();
    res.json(categorias);
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo cargar la lista de categorias." });
  }
}

async function create(req, res) {
  try {
    const categoria = await categoryService.createCategory(req.body);
    res.status(201).json(categoria);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo registrar la categoria.",
    });
  }
}

async function update(req, res) {
  try {
    const categoria = await categoryService.updateCategory(req.params.id, req.body);
    res.json(categoria);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo actualizar la categoria.",
    });
  }
}

async function remove(req, res) {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo eliminar la categoria.",
    });
  }
}

module.exports = { list, create, update, remove };
