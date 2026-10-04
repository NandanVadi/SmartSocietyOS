const express = require("express");
const {
  createComplaint, getAllComplaints, getMyComplaints,
  getAssignedComplaints, updateComplaint, getComplaintStats
} = require("../controllers/complaintController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, authorize("RESIDENT"), createComplaint);
router.get("/", protect, authorize("SOCIETY_ADMIN", "COMMITTEE_MEMBER", "SUPER_ADMIN"), getAllComplaints);
router.get("/my", protect, authorize("RESIDENT"), getMyComplaints);
router.get("/assigned", protect, authorize("MAINTENANCE_STAFF"), getAssignedComplaints);
router.get("/stats", protect, authorize("SOCIETY_ADMIN", "COMMITTEE_MEMBER", "SUPER_ADMIN"), getComplaintStats);
router.put("/:id", protect, authorize("SOCIETY_ADMIN", "COMMITTEE_MEMBER", "MAINTENANCE_STAFF"), updateComplaint);

module.exports = router;
