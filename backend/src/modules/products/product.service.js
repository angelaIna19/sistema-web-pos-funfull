const productRepository = require("./product.repository");

function validateProductPayload(body, options = {}) {
  const nombre = String(body.nombre || "").trim();
  const categoria = String(body.categoria || "").trim();
  const marca = String(body.marca || "").trim();
  const precioCompra = Number(body.precioCompra ?? body.precio_compra);
  const precioVenta = Number(body.precioVenta ?? body.precio_venta);
  const stock = Number(body.stock);
  const stockMinimo = Number(body.stockMinimo ?? body.stock_minimo);
  const imagen = String(body.imagen || "").trim();
  const estado = normalizeBoolean(body.estado);

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
    codigo: options.codigo || "",
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

async function validateCategoryExists(categoria) {
  const category = await productRepository.findCategoryByName(categoria);

  if (!category) {
    const error = new Error("La categoría seleccionada no existe. Regístrela primero.");
    error.status = 400;
    throw error;
  }

  if (!category.estado) {
    const error = new Error("La categoría seleccionada está inactiva.");
    error.status = 400;
    throw error;
  }

  return category.nombre;
}

async function generateProductCode(categoria) {
  const prefix = buildCategoryPrefix(categoria);
  const lastCode = await productRepository.findLastCodeByPrefix(prefix);
  const lastNumber = lastCode ? Number(lastCode.slice(prefix.length)) : 0;
  const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

function buildCategoryPrefix(categoria) {
  const normalized = removeAccents(categoria)
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  const words = normalized.split(" ").filter(Boolean);

  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`;
  if (words.length === 1) return words[0].slice(0, 2).padEnd(2, "X");
  return "PR";
}

function removeAccents(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
  const categoria = await validateCategoryExists(String(body.categoria || "").trim());
  const codigo = await generateProductCode(categoria);
  const producto = validateProductPayload({ ...body, categoria }, { codigo });

  try {
    return await productRepository.create(producto);
  } catch (error) {
    throw normalizeDatabaseError(error);
  }
}

async function updateProduct(id, body) {
  const actual = await getProductById(id);
  const categoria = await validateCategoryExists(String(body.categoria || "").trim());
  const sameCategory = actual.categoria.trim().toLowerCase() === categoria.trim().toLowerCase();
  const codigo = sameCategory ? actual.codigo : await generateProductCode(categoria);
  const producto = validateProductPayload({ ...body, categoria }, { codigo });

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