const { Router } = require("express");
const reportController = require("./report.controller");
const { requireAuth } = require("../../middlewares/authMiddleware");

const router = Router();

router.get("/admin/reportes/ventas", requireAuth, reportController.sales);
router.get("/admin/reportes/ordenes", requireAuth, reportController.orders);
router.get("/admin/reportes/productos-mas-vendidos", requireAuth, reportController.topProducts);
router.get("/admin/reportes/stock-bajo", requireAuth, reportController.lowStock);

module.exports = router;
