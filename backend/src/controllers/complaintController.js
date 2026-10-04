const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const User = require("../models/User");

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

// Create complaint (Resident)
const createComplaint = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    if (!title || !description) return res.status(400).json({ message: "Title and description are required" });
    const complaint = await Complaint.create({
      title, description, category, priority,
      residentId: req.user.id,
      societyId: req.user.societyId,
    });
    res.status(201).json({ message: "Complaint submitted", complaint });
  } catch (error) {
    res.status(500).json({ message: "Failed to create complaint", error: error.message });
  }
};

// Get all complaints (Admin/Committee)
const getAllComplaints = async (req, res) => {
  try {
    const filter = req.user.societyId ? { societyId: req.user.societyId } : {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    const complaints = await Complaint.find(filter)
      .populate("residentId", "name flatNumber email")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    res.json({ complaints });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch complaints", error: error.message });
  }
};

// Get my complaints (Resident)
const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ residentId: req.user.id })
      .populate("assignedTo", "name role")
      .sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch complaints", error: error.message });
  }
};

// Get assigned complaints (Maintenance Staff)
const getAssignedComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ assignedTo: req.user.id })
      .populate("residentId", "name flatNumber")
      .sort({ createdAt: -1 });
    res.json({ complaints });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch assigned complaints", error: error.message });
  }
};

// Update complaint (Admin/Committee: status, assignment, remarks — Maintenance: own assignments only)
const updateComplaint = async (req, res) => {
  try {
    const { status, assignedTo, remarks } = req.body;
    if (status && !STATUSES.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const filter = { _id: req.params.id };
    if (req.user.societyId) filter.societyId = req.user.societyId;
    if (req.user.role === "MAINTENANCE_STAFF") filter.assignedTo = req.user.id;

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === "RESOLVED") updateData.resolvedAt = new Date();
    }
    if (remarks !== undefined) updateData.remarks = remarks;

    // Only admins/committee may (re)assign work, and only to staff of the same society
    if (assignedTo && req.user.role !== "MAINTENANCE_STAFF") {
      const staff = await User.findOne({ _id: assignedTo, role: "MAINTENANCE_STAFF", ...(req.user.societyId ? { societyId: req.user.societyId } : {}) });
      if (!staff) return res.status(400).json({ message: "Assignee must be a maintenance staff member of this society" });
      updateData.assignedTo = assignedTo;
      // Assigning an open complaint automatically moves it to IN_PROGRESS
      if (!status) {
        const current = await Complaint.findOne(filter).select("status");
        if (current?.status === "OPEN") updateData.status = "IN_PROGRESS";
      }
    }

    const complaint = await Complaint.findOneAndUpdate(filter, updateData, { new: true })
      .populate("residentId", "name flatNumber")
      .populate("assignedTo", "name");

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json({ message: "Complaint updated", complaint });
  } catch (error) {
    res.status(500).json({ message: "Failed to update complaint", error: error.message });
  }
};

// Get complaint stats
const getComplaintStats = async (req, res) => {
  try {
    const societyId = req.user.societyId;
    if (!societyId) {
      return res.json({ stats: [], categoryStats: [] });
    }
    const sid = new mongoose.Types.ObjectId(societyId.toString());
    const stats = await Complaint.aggregate([
      { $match: { societyId: sid } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const categoryStats = await Complaint.aggregate([
      { $match: { societyId: sid } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    res.json({ stats, categoryStats });
  } catch (error) {
    res.status(500).json({ message: "Failed to get stats", error: error.message });
  }
};

module.exports = {
  createComplaint, getAllComplaints, getMyComplaints,
  getAssignedComplaints, updateComplaint, getComplaintStats,
};
