const router = require("express").Router();
const logs = require("../controllers/logController");
const { authRequired } = require("../middleware/jwt.middleware.js");

router.use(authRequired);

// list with filter / pagination
router.get("/", logs.listLogs);

// create
router.post("/", logs.createLog);

// read one
router.get("/:id", logs.getLog);

// update one
router.patch("/:id", logs.updateLog);

// delete
router.delete("/:id", logs.deleteLogs);

module.exports = router;
