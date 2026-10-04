const express = require("express");
const {
  triggerEmergency,
  getActiveEmergencies,
  getMyActiveEmergency,
  getEmergencyLogs,
  updateEmergencyStatus,
  cancelEmergency
} = require("../controllers/emergencyController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Resident routes
router.post("/trigger", protect, authorize("RESIDENT", "COMMITTEE_MEMBER"), triggerEmergency);
router.get("/my-active", protect, authorize("RESIDENT", "COMMITTEE_MEMBER"), getMyActiveEmergency);
router.put("/:id/cancel", protect, authorize("RESIDENT", "COMMITTEE_MEMBER"), cancelEmergency);

// Guard & Admin routes
router.get("/active", protect, authorize("SECURITY_GUARD", "SOCIETY_ADMIN", "SUPER_ADMIN"), getActiveEmergencies);
router.get("/logs", protect, authorize("SECURITY_GUARD", "SOCIETY_ADMIN", "SUPER_ADMIN"), getEmergencyLogs);
router.put("/:id/status", protect, authorize("SECURITY_GUARD", "SOCIETY_ADMIN", "SUPER_ADMIN"), updateEmergencyStatus);

module.exports = router;
