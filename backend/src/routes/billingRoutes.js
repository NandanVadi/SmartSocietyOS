const express = require("express");
const {
  createBill, createBulkBills, getMyBills, getAllBills, payBill, getBillingStats,
  createNotice, getNotices, updateNotice, deleteNotice
} = require("../controllers/billingController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Bill routes
router.post("/bills", protect, authorize("SOCIETY_ADMIN", "SUPER_ADMIN"), createBill);
router.post("/bills/bulk", protect, authorize("SOCIETY_ADMIN", "SUPER_ADMIN"), createBulkBills);
router.get("/bills/my", protect, authorize("RESIDENT"), getMyBills);
router.get("/bills/all", protect, authorize("SOCIETY_ADMIN", "SUPER_ADMIN"), getAllBills);
router.put("/bills/:id/pay", protect, authorize("RESIDENT"), payBill);
router.get("/bills/stats", protect, authorize("SOCIETY_ADMIN", "SUPER_ADMIN", "COMMITTEE_MEMBER"), getBillingStats);

// Notice routes
router.post("/notices", protect, authorize("SOCIETY_ADMIN", "COMMITTEE_MEMBER", "SUPER_ADMIN"), createNotice);
router.get("/notices", protect, getNotices);
router.put("/notices/:id", protect, authorize("SOCIETY_ADMIN", "COMMITTEE_MEMBER", "SUPER_ADMIN"), updateNotice);
router.delete("/notices/:id", protect, authorize("SOCIETY_ADMIN", "COMMITTEE_MEMBER", "SUPER_ADMIN"), deleteNotice);

module.exports = router;
