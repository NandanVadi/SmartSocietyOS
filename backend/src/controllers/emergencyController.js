const Emergency = require("../models/Emergency");
const User = require("../models/User");

// Trigger an Emergency SOS (Resident)
const triggerEmergency = async (req, res) => {
  try {
    const { type, description } = req.body;
    const resident = await User.findById(req.user.id);

    if (!resident) {
      return res.status(404).json({ message: "Resident profile not found" });
    }

    if (!req.user.societyId) {
      return res.status(400).json({ message: "No society associated with this account" });
    }

    // Check if resident already has an ACTIVE emergency
    const existing = await Emergency.findOne({
      residentId: req.user.id,
      status: { $in: ["ACTIVE", "DISPATCHED"] }
    });

    if (existing) {
      return res.status(200).json({
        message: "Active emergency alert already ongoing",
        emergency: existing
      });
    }

    const emergency = await Emergency.create({
      type: type || "SECURITY_THREAT",
      residentId: req.user.id,
      societyId: req.user.societyId,
      flatNumber: resident.flatNumber || "N/A",
      phone: resident.phone || "N/A",
      description: description || "Immediate assistance requested by resident",
      status: "ACTIVE"
    });

    const populated = await Emergency.findById(emergency._id)
      .populate("residentId", "name email phone flatNumber");

    res.status(201).json({
      message: "🚨 SOS Alert Broadcasted to Gate Security & Management!",
      emergency: populated
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to trigger emergency SOS", error: error.message });
  }
};

// Get active emergencies (Security Guard, Society Admin, Super Admin)
const getActiveEmergencies = async (req, res) => {
  try {
    const filter = {
      status: { $in: ["ACTIVE", "DISPATCHED"] }
    };
    if (req.user.societyId) {
      filter.societyId = req.user.societyId;
    }

    const emergencies = await Emergency.find(filter)
      .populate("residentId", "name email phone flatNumber")
      .populate("handledBy", "name role")
      .sort({ createdAt: -1 });

    res.json({ emergencies });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch active emergencies", error: error.message });
  }
};

// Get resident's current active emergency (Resident)
const getMyActiveEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findOne({
      residentId: req.user.id,
      status: { $in: ["ACTIVE", "DISPATCHED"] }
    }).populate("handledBy", "name role");

    res.json({ emergency });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch status", error: error.message });
  }
};

// Get emergency logs (Security Guard, Society Admin, Super Admin)
const getEmergencyLogs = async (req, res) => {
  try {
    const filter = req.user.societyId ? { societyId: req.user.societyId } : {};
    const emergencies = await Emergency.find(filter)
      .populate("residentId", "name email phone flatNumber")
      .populate("handledBy", "name role")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ emergencies });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch emergency logs", error: error.message });
  }
};

// Update emergency status (Security Guard, Society Admin)
const updateEmergencyStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!["DISPATCHED", "RESOLVED"].includes(status)) {
      return res.status(400).json({ message: "Status must be DISPATCHED or RESOLVED" });
    }
    const updateData = { status, handledBy: req.user.id };

    if (notes) updateData.notes = notes;

    if (status === "DISPATCHED") {
      updateData.dispatchedAt = new Date();
    } else if (status === "RESOLVED") {
      updateData.resolvedAt = new Date();
    }

    // Only open incidents (of the caller's society) can be progressed
    const filter = { _id: req.params.id, status: { $in: ["ACTIVE", "DISPATCHED"] } };
    if (req.user.societyId) filter.societyId = req.user.societyId;

    const emergency = await Emergency.findOneAndUpdate(filter, updateData, { new: true })
      .populate("residentId", "name email phone flatNumber")
      .populate("handledBy", "name role");

    if (!emergency) {
      return res.status(404).json({ message: "Emergency incident not found or already closed" });
    }

    res.json({ message: `Emergency marked as ${status}`, emergency });
  } catch (error) {
    res.status(500).json({ message: "Failed to update emergency", error: error.message });
  }
};

// Cancel false alarm (Resident)
const cancelEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findOneAndUpdate(
      { _id: req.params.id, residentId: req.user.id, status: { $in: ["ACTIVE", "DISPATCHED"] } },
      { status: "CANCELLED", resolvedAt: new Date(), notes: "Cancelled by resident (False Alarm)" },
      { new: true }
    );

    if (!emergency) {
      return res.status(404).json({ message: "Active emergency not found or already closed" });
    }

    res.json({ message: "SOS Alert cancelled by resident", emergency });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel emergency", error: error.message });
  }
};

module.exports = {
  triggerEmergency,
  getActiveEmergencies,
  getMyActiveEmergency,
  getEmergencyLogs,
  updateEmergencyStatus,
  cancelEmergency
};
