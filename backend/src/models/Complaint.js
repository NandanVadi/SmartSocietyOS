const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["PLUMBING", "ELECTRICAL", "CLEANING", "SECURITY", "NOISE", "PARKING", "OTHER"],
      default: "OTHER"
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN"
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM"
    },
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    images: [{ type: String }],
    resolvedAt: { type: Date, default: null },
    remarks: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
