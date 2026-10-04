const express = require("express");
const {
  registerVisitor, getMyVisitors, getTodayVisitors,
  getAllVisitors, verifyVisitorQR, checkoutVisitor, getEntryExitLogs
} = require("../controllers/visitorController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, authorize("RESIDENT"), registerVisitor);
router.get("/my", protect, authorize("RESIDENT"), getMyVisitors);
router.get("/today", protect, authorize("SECURITY_GUARD", "SOCIETY_ADMIN"), getTodayVisitors);
router.get("/all", protect, authorize("SECURITY_GUARD", "SOCIETY_ADMIN", "SUPER_ADMIN"), getAllVisitors);
router.get("/logs", protect, authorize("SECURITY_GUARD", "SOCIETY_ADMIN", "SUPER_ADMIN"), getEntryExitLogs);
router.post("/verify", protect, authorize("SECURITY_GUARD"), verifyVisitorQR);
router.put("/:id/checkout", protect, authorize("SECURITY_GUARD"), checkoutVisitor);

module.exports = router;
