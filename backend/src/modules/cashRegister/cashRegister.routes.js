const { Router } = require("express");
const cashRegisterController = require("./cashRegister.controller");
const { requireAuth } = require("../../middlewares/authMiddleware");

const router = Router();

router.get("/admin/caja/actual", requireAuth, cashRegisterController.current);
router.get("/admin/cajas", requireAuth, cashRegisterController.history);
router.post("/admin/caja/abrir", requireAuth, cashRegisterController.open);
router.post("/admin/caja/cerrar", requireAuth, cashRegisterController.close);
router.post("/admin/caja/movimientos", requireAuth, cashRegisterController.movement);

module.exports = router;
