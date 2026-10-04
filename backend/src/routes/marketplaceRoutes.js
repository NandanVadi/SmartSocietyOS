const express = require("express");
const {
  createListing, getListings, getMyListings,
  updateListing, deleteListing, getMarketplaceAnalytics
} = require("../controllers/marketplaceController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, authorize("RESIDENT", "COMMITTEE_MEMBER"), createListing);
router.get("/", protect, getListings);
router.get("/my", protect, authorize("RESIDENT", "COMMITTEE_MEMBER"), getMyListings);
router.get("/analytics", protect, authorize("SOCIETY_ADMIN", "SUPER_ADMIN"), getMarketplaceAnalytics);
router.put("/:id", protect, authorize("RESIDENT", "COMMITTEE_MEMBER"), updateListing);
router.delete("/:id", protect, authorize("RESIDENT", "COMMITTEE_MEMBER", "SOCIETY_ADMIN"), deleteListing);

module.exports = router;
