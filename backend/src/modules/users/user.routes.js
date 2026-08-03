const { Router } = require("express");
const userController = require("./user.controller");
const { requireAuth } = require("../../middlewares/authMiddleware");

const router = Router();

router.get("/admin/usuarios/me", requireAuth, userController.me);
router.put("/admin/usuarios/me/credenciales", requireAuth, userController.updateCredentials);

module.exports = router;
