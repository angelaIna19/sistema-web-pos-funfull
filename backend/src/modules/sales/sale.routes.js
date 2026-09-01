const { Router } = require("express");
const saleController = require("./sale.controller");
const { requireAuth } = require("../../middlewares/authMiddleware");

const router = Router();

router.get("/admin/ventas", requireAuth, saleController.list);
router.get("/admin/ventas/archivadas", requireAuth, saleController.archived);
router.get("/admin/ventas/:id", requireAuth, saleController.detail);
router.post("/admin/ventas", requireAuth, saleController.create);
router.post("/admin/ventas/:id/anular", requireAuth, saleController.cancel);

module.exports = router;
