const router = require("express").Router();
const auth = require("../controllers/authController");
const { authRequired } = require("../middleware/jwt.middleware.js");

router.post("/signup", auth.signup);
router.post("/login", auth.login);
router.get("/verify", authRequired, auth.verify);
router.post("/logout", auth.logout);

module.exports = router;
