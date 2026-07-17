const { Router } = require("express");
const categoryController = require("./category.controller");
const { requireAuth } = require("../../middlewares/authMiddleware");

const router = Router();

router.get("/categorias", categoryController.list);
router.post("/admin/categorias", requireAuth, categoryController.create);
router.put("/admin/categorias/:id", requireAuth, categoryController.update);
router.delete("/admin/categorias/:id", requireAuth, categoryController.remove);

module.exports = router;
