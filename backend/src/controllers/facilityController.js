const Facility = require("../models/Facility");
const Booking = require("../models/Booking");
const Parking = require("../models/Parking");
const User = require("../models/User");

// =====================
// FACILITY CRUD
// =====================

const createFacility = async (req, res) => {
  try {
    const { name, description, type, capacity, pricePerHour, availableFrom, availableTo } = req.body;
    if (!name) return res.status(400).json({ message: "Facility name is required" });
    const facility = await Facility.create({
      name, description, type, capacity, pricePerHour, availableFrom, availableTo,
      societyId: req.user.societyId
    });
    res.status(201).json({ message: "Facility created", facility });
  } catch (error) {
    res.status(500).json({ message: "Failed to create facility", error: error.message });
  }
};

const getFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find({ societyId: req.user.societyId, isActive: true });
    res.json({ facilities });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch facilities", error: error.message });
  }
};

const updateFacility = async (req, res) => {
  try {
    const { name, description, type, capacity, pricePerHour, availableFrom, availableTo, isActive } = req.body;
    const update = { name, description, type, capacity, pricePerHour, availableFrom, availableTo, isActive };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
    const facility = await Facility.findOneAndUpdate({ _id: req.params.id, societyId: req.user.societyId }, update, { new: true });
    if (!facility) return res.status(404).json({ message: "Facility not found" });
    res.json({ message: "Facility updated", facility });
  } catch (error) {
    res.status(500).json({ message: "Failed to update facility", error: error.message });
  }
};

const deleteFacility = async (req, res) => {
  try {
    const facility = await Facility.findOneAndUpdate({ _id: req.params.id, societyId: req.user.societyId }, { isActive: false });
    if (!facility) return res.status(404).json({ message: "Facility not found" });
    res.json({ message: "Facility deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete facility", error: error.message });
  }
};

// =====================
// BOOKING CRUD
// =====================

const createBooking = async (req, res) => {
  try {
    const { facilityId, date, startTime, endTime } = req.body;
    if (!facilityId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "Facility, date, start time and end time are required" });
    }
    const facility = await Facility.findOne({ _id: facilityId, societyId: req.user.societyId, isActive: true });
    if (!facility) return res.status(404).json({ message: "Facility not found" });

    if (endTime <= startTime) {
      return res.status(400).json({ message: "End time must be after start time" });
    }
    if (startTime < facility.availableFrom || endTime > facility.availableTo) {
      return res.status(400).json({ message: `${facility.name} is available only ${facility.availableFrom}–${facility.availableTo}` });
    }
    const bookingDay = new Date(date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (isNaN(bookingDay) || bookingDay < today) {
      return res.status(400).json({ message: "Booking date cannot be in the past" });
    }

    // Check for conflicts
    const existing = await Booking.findOne({
      facilityId,
      date: new Date(date),
      status: { $in: ["PENDING", "APPROVED"] },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });
    if (existing) {
      return res.status(400).json({ message: "Time slot already booked" });
    }

    // Calculate cost
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const hours = (eh * 60 + em - sh * 60 - sm) / 60;
    const totalAmount = hours * facility.pricePerHour;

    const booking = await Booking.create({
      facilityId,
      date: new Date(date),
      startTime,
      endTime,
      totalAmount,
      residentId: req.user.id,
      societyId: req.user.societyId
    });

    res.status(201).json({ message: "Booking requested", booking });
  } catch (error) {
    res.status(500).json({ message: "Failed to create booking", error: error.message });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ residentId: req.user.id })
      .populate("facilityId", "name type")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ societyId: req.user.societyId })
      .populate("facilityId", "name type")
      .populate("residentId", "name flatNumber")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
};

const updateBooking = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (status && !["PENDING", "APPROVED", "REJECTED", "CANCELLED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const update = { status, remarks };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
    const booking = await Booking.findOneAndUpdate({ _id: req.params.id, societyId: req.user.societyId }, update, { new: true });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Booking updated", booking });
  } catch (error) {
    res.status(500).json({ message: "Failed to update booking", error: error.message });
  }
};

// =====================
// PARKING
// =====================

const getParkingSlots = async (req, res) => {
  try {
    const slots = await Parking.find({ societyId: req.user.societyId })
      .populate("allocatedTo", "name flatNumber");
    res.json({ slots });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch parking slots", error: error.message });
  }
};

const createParkingSlot = async (req, res) => {
  try {
    const { slotNumber, type } = req.body;
    if (!slotNumber) return res.status(400).json({ message: "Slot number is required" });
    if (await Parking.findOne({ slotNumber, societyId: req.user.societyId })) {
      return res.status(400).json({ message: "Slot number already exists" });
    }
    const slot = await Parking.create({
      slotNumber, type,
      societyId: req.user.societyId
    });
    res.status(201).json({ message: "Parking slot created", slot });
  } catch (error) {
    res.status(500).json({ message: "Failed to create slot", error: error.message });
  }
};

const allocateParkingSlot = async (req, res) => {
  try {
    const { userId, vehicleNumber, vehicleModel } = req.body;
    const resident = await User.findOne({ _id: userId, societyId: req.user.societyId });
    if (!resident) return res.status(404).json({ message: "Resident not found in your society" });

    const slot = await Parking.findOneAndUpdate(
      { _id: req.params.id, societyId: req.user.societyId, status: { $in: ["AVAILABLE", "RESERVED"] } },
      { allocatedTo: userId, vehicleNumber, vehicleModel, status: "OCCUPIED" },
      { new: true }
    ).populate("allocatedTo", "name flatNumber");
    if (!slot) return res.status(400).json({ message: "Slot not found or not available for allocation" });
    res.json({ message: "Slot allocated", slot });
  } catch (error) {
    res.status(500).json({ message: "Failed to allocate slot", error: error.message });
  }
};

const updateParkingSlot = async (req, res) => {
  try {
    const { status, type, slotNumber } = req.body;
    const update = { status, type, slotNumber };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
    // Releasing a slot clears the vehicle/owner
    if (status === "AVAILABLE") Object.assign(update, { allocatedTo: null, vehicleNumber: null, vehicleModel: null });
    const slot = await Parking.findOneAndUpdate({ _id: req.params.id, societyId: req.user.societyId }, update, { new: true });
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    res.json({ message: "Slot updated", slot });
  } catch (error) {
    res.status(500).json({ message: "Failed to update slot", error: error.message });
  }
};

module.exports = {
  createFacility, getFacilities, updateFacility, deleteFacility,
  createBooking, getMyBookings, getAllBookings, updateBooking,
  getParkingSlots, createParkingSlot, allocateParkingSlot, updateParkingSlot
};
