const express = require("express");
const {
  createFacility, getFacilities, updateFacility, deleteFacility,
  createBooking, getMyBookings, getAllBookings, updateBooking,
  getParkingSlots, createParkingSlot, allocateParkingSlot, updateParkingSlot
} = require("../controllers/facilityController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Booking routes
router.post("/bookings", protect, authorize("RESIDENT"), createBooking);
router.get("/bookings/my", protect, authorize("RESIDENT"), getMyBookings);
router.get("/bookings/all", protect, authorize("SOCIETY_ADMIN", "COMMITTEE_MEMBER", "SUPER_ADMIN"), getAllBookings);
router.put("/bookings/:id", protect, authorize("SOCIETY_ADMIN", "SUPER_ADMIN"), updateBooking);

// Parking routes
router.get("/parking", protect, getParkingSlots);
router.post("/parking", protect, authorize("SOCIETY_ADMIN", "SUPER_ADMIN"), createParkingSlot);
router.put("/parking/:id/allocate", protect, authorize("SOCIETY_ADMIN"), allocateParkingSlot);
router.put("/parking/:id", protect, authorize("SOCIETY_ADMIN"), updateParkingSlot);

// Facility CRUD routes
router.post("/", protect, authorize("SOCIETY_ADMIN", "SUPER_ADMIN"), createFacility);
router.get("/", protect, getFacilities);
router.put("/:id", protect, authorize("SOCIETY_ADMIN", "SUPER_ADMIN"), updateFacility);
router.delete("/:id", protect, authorize("SOCIETY_ADMIN", "SUPER_ADMIN"), deleteFacility);

module.exports = router;
