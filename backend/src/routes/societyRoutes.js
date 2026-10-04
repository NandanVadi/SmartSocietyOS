const express = require("express");
const {
  getAllSocieties, getPublicSocieties, getAllUsers, createSociety, getSociety, updateSociety,
  getSocietyMembers, assignAdmin, getPlatformAnalytics
} = require("../controllers/societyController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/public", getPublicSocieties);
router.get("/analytics", protect, authorize("SUPER_ADMIN"), getPlatformAnalytics);
router.get("/users/all", protect, authorize("SUPER_ADMIN"), getAllUsers);
router.get("/members", protect, authorize("SUPER_ADMIN", "SOCIETY_ADMIN", "COMMITTEE_MEMBER"), getSocietyMembers);
router.get("/", protect, authorize("SUPER_ADMIN"), getAllSocieties);
router.post("/", protect, authorize("SUPER_ADMIN"), createSociety);
router.get("/:id", protect, getSociety);
router.put("/:id", protect, authorize("SUPER_ADMIN"), updateSociety);
router.get("/:id/members", protect, authorize("SUPER_ADMIN", "SOCIETY_ADMIN"), getSocietyMembers);
router.post("/:id/assign-admin", protect, authorize("SUPER_ADMIN"), assignAdmin);

module.exports = router;
