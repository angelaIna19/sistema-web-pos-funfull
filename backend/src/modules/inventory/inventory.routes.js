const { Router } = require("express");
const inventoryController = require("./inventory.controller");
const { requireAuth } = require("../../middlewares/authMiddleware");

const router = Router();

router.get("/admin/inventario/resumen", requireAuth, inventoryController.summary);
router.get("/admin/inventario/movimientos", requireAuth, inventoryController.movements);
router.get("/admin/inventario/stock-bajo", requireAuth, inventoryController.lowStock);
router.get("/admin/inventario/productos/:id/detalle", requireAuth, inventoryController.productDetail);
router.post("/admin/inventario/entradas", requireAuth, inventoryController.entry);
router.post("/admin/inventario/salidas", requireAuth, inventoryController.exit);
router.post("/admin/inventario/ajustes", requireAuth, inventoryController.adjustment);

module.exports = router;
