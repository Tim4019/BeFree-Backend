const router = require("express").Router();
const { authRequired } = require("../middleware/jwt.middleware.js");
const controller = require("../controllers/milestoneController.js");

router.use(authRequired);

router.get("/", controller.list);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
