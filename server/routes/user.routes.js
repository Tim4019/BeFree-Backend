const router = require("express").Router();
const { authRequired } = require("../middleware/jwt.middleware.js");
const users = require("../controllers/userController");

router.use(authRequired);

router.get("/me", users.getMe);
router.patch("/me", users.updateMe);
router.patch("/me/password", users.changePassword);

module.exports = router;
