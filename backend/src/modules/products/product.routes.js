const { Router } = require("express");
const productController = require("./product.controller");
const { requireAuth } = require("../../middlewares/authMiddleware");

const router = Router();

router.get("/productos", productController.list);
router.get("/productos/:id", productController.detail);
router.post("/admin/productos", requireAuth, productController.create);
router.put("/admin/productos/:id", requireAuth, productController.update);
router.delete("/admin/productos/:id", requireAuth, productController.remove);

module.exports = router;
