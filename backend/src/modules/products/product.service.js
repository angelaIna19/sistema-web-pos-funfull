const productRepository = require("./product.repository");

function validateProductPayload(body) {
  const codigo = String(body.codigo || "").trim();
  const nombre = String(body.nombre || "").trim();
  const categoria = String(body.categoria || "").trim();
  const marca = String(body.marca || "").trim();
  const precioCompra = Number(body.precioCompra ?? body.precio_compra);
  const precioVenta = Number(body.precioVenta ?? body.precio_venta);
  const stock = Number(body.stock);
  const stockMinimo = Number(body.stockMinimo ?? body.stock_minimo);
  const imagen = String(body.imagen || "").trim();
  const estado = normalizeBoolean(body.estado);

  if (!codigo) return validationError("El código del producto es obligatorio.");
  if (!nombre) return validationError("El nombre del producto es obligatorio.");
  if (!categoria) return validationError("La categoría del producto es obligatoria.");
  if (!marca) return validationError("La marca del producto es obligatoria.");
  if (!isValidMoney(precioCompra)) return validationError("El precio de compra debe ser un número mayor o igual a 0.");
  if (!isValidMoney(precioVenta)) return validationError("El precio de venta debe ser un número mayor o igual a 0.");
  if (!isValidInteger(stock)) return validationError("El stock debe ser un número entero mayor o igual a 0.");
  if (!isValidInteger(stockMinimo)) return validationError("El stock mínimo debe ser un número entero mayor o igual a 0.");
  if (!imagen) return validationError("La imagen del producto es obligatoria.");
  if (estado === null) return validationError("El estado del producto debe ser activo o inactivo.");

  return {
    codigo,
    nombre,
    categoria,
    marca,
    precioCompra,
    precioVenta,
    stock,
    stockMinimo,
    imagen,
    estado,
  };
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function isValidMoney(value) {
  return Number.isFinite(value) && value >= 0;
}

function isValidInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function normalizeDatabaseError(error) {
  if (error.code === "23505") {
    error.status = 400;
    error.message = "El código del producto ya existe.";
  }
  return error;
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

  try {
    return await productRepository.create(producto);
  } catch (error) {
    throw normalizeDatabaseError(error);
  }
}

async function updateProduct(id, body) {
  const producto = validateProductPayload(body);

  try {
    const updated = await productRepository.update(id, producto);

    if (!updated) {
      const error = new Error("Producto no encontrado.");
      error.status = 404;
      throw error;
    }

    return updated;
  } catch (error) {
    throw normalizeDatabaseError(error);
  }
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
