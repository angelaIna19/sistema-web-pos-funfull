const { Router } = require("express");
const authController = require("./auth.controller");
const { requireAuth } = require("../../middlewares/authMiddleware");

const router = Router();

router.post("/login", authController.login);
router.post("/logout", requireAuth, authController.logout);

module.exports = router;
