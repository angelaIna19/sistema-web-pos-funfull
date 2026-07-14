const productRepository = require("./product.repository");

function validateProductPayload(body) {
  const nombre = String(body.nombre || "").trim();
  const precio = Number(body.precio);
  const imagen = String(body.imagen || "").trim();
  const descripcion = String(body.descripcion || "").trim();
  const disponible = Boolean(body.disponible);
  const etiqueta = body.etiqueta ? String(body.etiqueta).trim() : null;

  if (!nombre) return validationError("El nombre del producto es obligatorio.");
  if (Number.isNaN(precio) || precio < 0) return validationError("El precio debe ser un número mayor o igual a 0.");
  if (!imagen) return validationError("La imagen del producto es obligatoria.");
  if (!descripcion) return validationError("La descripción del producto es obligatoria.");

  return { nombre, precio, imagen, descripcion, disponible, etiqueta };
}

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

async function listProducts() {
  return productRepository.findAll();
}

async function getProductById(id) {
  const producto = await productRepository.findById(id);

  if (!producto) {
    const error = new Error("Producto no encontrado.");
    error.status = 404;
    throw error;
  }

  return producto;
}

async function createProduct(body) {
  const producto = validateProductPayload(body);
  return productRepository.create(producto);
}

async function updateProduct(id, body) {
  const producto = validateProductPayload(body);
  const updated = await productRepository.update(id, producto);

  if (!updated) {
    const error = new Error("Producto no encontrado.");
    error.status = 404;
    throw error;
  }

  return updated;
}

async function deleteProduct(id) {
  const removed = await productRepository.remove(id);

  if (!removed) {
    const error = new Error("Producto no encontrado.");
    error.status = 404;
    throw error;
  }

  return { mensaje: "Producto eliminado." };
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
