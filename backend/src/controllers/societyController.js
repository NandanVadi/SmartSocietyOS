const Society = require("../models/Society");
const User = require("../models/User");

// Get all societies (Super Admin)
const getAllSocieties = async (req, res) => {
  try {
    const societies = await Society.find().populate("adminId", "name email");
    res.json({ societies });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch societies", error: error.message });
  }
};

// Get public societies list for registration
const getPublicSocieties = async (req, res) => {
  try {
    const societies = await Society.find({ isActive: true }).select("name city state totalFlats");
    res.json({ societies });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch public societies", error: error.message });
  }
};

// Get all users platform-wide (Super Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").populate("societyId", "name city");
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

// Create society (Super Admin)
const createSociety = async (req, res) => {
  try {
    const { name, address, city, state, pincode, totalFlats } = req.body;
    if (!name || !address || !city || !state || !pincode) {
      return res.status(400).json({ message: "Name, address, city, state and pincode are required" });
    }
    const society = await Society.create({ name, address, city, state, pincode, totalFlats });
    res.status(201).json({ message: "Society created", society });
  } catch (error) {
    res.status(500).json({ message: "Failed to create society", error: error.message });
  }
};

// Get society details
const getSociety = async (req, res) => {
  try {
    const society = await Society.findById(req.params.id).populate("adminId", "name email");
    if (!society) return res.status(404).json({ message: "Society not found" });
    res.json({ society });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch society", error: error.message });
  }
};

// Update society
const updateSociety = async (req, res) => {
  try {
    const { name, address, city, state, pincode, totalFlats, isActive } = req.body;
    const update = { name, address, city, state, pincode, totalFlats, isActive };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
    const society = await Society.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!society) return res.status(404).json({ message: "Society not found" });
    res.json({ message: "Society updated", society });
  } catch (error) {
    res.status(500).json({ message: "Failed to update society", error: error.message });
  }
};

// Get all users of a society
const getSocietyMembers = async (req, res) => {
  try {
    let societyId = req.params.id;
    if (!societyId || societyId === "undefined" || societyId === "null" || societyId === "members") {
      societyId = req.user?.societyId;
    }
    // Only super admins may read another society's members
    if (req.user.role !== "SUPER_ADMIN" && req.user.societyId) societyId = req.user.societyId;
    const filter = societyId ? { societyId } : {};
    const users = await User.find(filter).select("-password").populate("societyId", "name").sort({ role: 1, name: 1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch members", error: error.message });
  }
};

// Assign admin to society
const assignAdmin = async (req, res) => {
  try {
    const { userId } = req.body;
    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: "User not found" });
    const society = await Society.findByIdAndUpdate(
      req.params.id,
      { adminId: userId },
      { new: true }
    );
    await User.findByIdAndUpdate(userId, {
      role: "SOCIETY_ADMIN",
      societyId: req.params.id
    });
    res.json({ message: "Admin assigned", society });
  } catch (error) {
    res.status(500).json({ message: "Failed to assign admin", error: error.message });
  }
};

// Get platform analytics (Super Admin)
const getPlatformAnalytics = async (req, res) => {
  try {
    const totalSocieties = await Society.countDocuments();
    const totalUsers = await User.countDocuments();
    const roleBreakdown = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    res.json({ totalSocieties, totalUsers, roleBreakdown });
  } catch (error) {
    res.status(500).json({ message: "Failed to get analytics", error: error.message });
  }
};

module.exports = {
  getAllSocieties,
  getPublicSocieties,
  getAllUsers,
  createSociety,
  getSociety,
  updateSociety,
  getSocietyMembers,
  assignAdmin,
  getPlatformAnalytics
};
