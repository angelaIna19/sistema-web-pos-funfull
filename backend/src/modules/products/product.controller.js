const productService = require("./product.service");

async function list(req, res) {
  try {
    const productos = await productService.listProducts();
    res.json(productos);
  } catch (error) {
    res.status(503).json({ mensaje: "No se pudo cargar el catálogo desde PostgreSQL." });
  }
}

async function detail(req, res) {
  try {
    const producto = await productService.getProductById(req.params.id);
    res.json(producto);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo consultar el producto desde PostgreSQL.",
    });
  }
}

async function create(req, res) {
  try {
    const producto = await productService.createProduct(req.body);
    res.status(201).json(producto);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo registrar el producto.",
    });
  }
}

async function update(req, res) {
  try {
    const producto = await productService.updateProduct(req.params.id, req.body);
    res.json(producto);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo actualizar el producto.",
    });
  }
}

async function remove(req, res) {
  try {
    const result = await productService.deleteProduct(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.status || 503).json({
      mensaje: error.status ? error.message : "No se pudo eliminar el producto.",
    });
  }
}

module.exports = { list, detail, create, update, remove };
