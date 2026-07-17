const { Router } = require("express");
const cashRegisterController = require("./cashRegister.controller");
const { requireAuth } = require("../../middlewares/authMiddleware");

const router = Router();

router.get("/admin/caja/actual", requireAuth, cashRegisterController.current);
router.post("/admin/caja/abrir", requireAuth, cashRegisterController.open);

module.exports = router;
