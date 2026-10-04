const Visitor = require("../models/Visitor");
const qrcode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

// Pre-register visitor (Resident)
const registerVisitor = async (req, res) => {
  try {
    const { name, phone, purpose, vehicleNumber } = req.body;
    if (!name || !phone || !purpose) {
      return res.status(400).json({ message: "Name, phone and purpose are required" });
    }
    const qrToken = uuidv4();

    const visitor = await Visitor.create({
      name,
      phone,
      purpose,
      vehicleNumber,
      residentId: req.user.id,
      societyId: req.user.societyId,
      qrCode: qrToken,
      status: "APPROVED"
    });

    // Generate QR code as base64 data URL
    const qrCodeImage = await qrcode.toDataURL(qrToken, { width: 300 });

    await Visitor.findByIdAndUpdate(visitor._id, { qrCodeImage });

    res.status(201).json({
      message: "Visitor registered successfully",
      visitor: { ...visitor.toObject(), qrCodeImage }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to register visitor", error: error.message });
  }
};

// Get my visitors (Resident)
const getMyVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({ residentId: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ visitors });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch visitors", error: error.message });
  }
};

// Get today's visitors (Security)
const getTodayVisitors = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter = {
      createdAt: { $gte: today, $lt: tomorrow }
    };
    if (req.user.societyId) filter.societyId = req.user.societyId;

    const visitors = await Visitor.find(filter)
      .populate("residentId", "name flatNumber phone")
      .sort({ createdAt: -1 });

    res.json({ visitors });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch visitors", error: error.message });
  }
};

// All visitors (Security / Admin)
const getAllVisitors = async (req, res) => {
  try {
    const filter = req.user.societyId ? { societyId: req.user.societyId } : {};
    if (req.query.status) filter.status = req.query.status;
    const visitors = await Visitor.find(filter)
      .populate("residentId", "name flatNumber phone")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ visitors });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch visitors", error: error.message });
  }
};

// Verify visitor by QR (Security)
const verifyVisitorQR = async (req, res) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode) return res.status(400).json({ message: "QR code is required", valid: false });

    const filter = { qrCode };
    if (req.user.societyId) filter.societyId = req.user.societyId;
    const visitor = await Visitor.findOne(filter)
      .populate("residentId", "name flatNumber phone");

    if (!visitor) {
      return res.status(404).json({ message: "Invalid QR code", valid: false });
    }

    if (visitor.status === "CHECKED_IN") {
      return res.json({ message: "Already checked in", visitor, valid: true });
    }

    if (visitor.status !== "APPROVED") {
      return res.json({ message: `Visitor status: ${visitor.status}`, visitor, valid: false });
    }

    visitor.status = "CHECKED_IN";
    visitor.checkInTime = new Date();
    visitor.approvedBy = req.user.id;
    await visitor.save();

    res.json({ message: "Visitor checked in successfully", visitor, valid: true });
  } catch (error) {
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
};

// Check out visitor (Security)
const checkoutVisitor = async (req, res) => {
  try {
    const filter = { _id: req.params.id, status: "CHECKED_IN" };
    if (req.user.societyId) filter.societyId = req.user.societyId;
    const visitor = await Visitor.findOneAndUpdate(
      filter,
      { status: "CHECKED_OUT", checkOutTime: new Date() },
      { new: true }
    );
    if (!visitor) return res.status(404).json({ message: "Visitor not found or not currently checked in" });
    res.json({ message: "Visitor checked out", visitor });
  } catch (error) {
    res.status(500).json({ message: "Failed to check out visitor", error: error.message });
  }
};

// Get visitor entry/exit logs
const getEntryExitLogs = async (req, res) => {
  try {
    const filter = {
      status: { $in: ["CHECKED_IN", "CHECKED_OUT"] }
    };
    if (req.user.societyId) filter.societyId = req.user.societyId;

    const visitors = await Visitor.find(filter)
      .populate("residentId", "name flatNumber")
      .sort({ updatedAt: -1 })
      .limit(200);
    res.json({ visitors });
  } catch (error) {
    res.status(500).json({ message: "Failed to get logs", error: error.message });
  }
};

module.exports = {
  registerVisitor,
  getMyVisitors,
  getTodayVisitors,
  getAllVisitors,
  verifyVisitorQR,
  checkoutVisitor,
  getEntryExitLogs
};
