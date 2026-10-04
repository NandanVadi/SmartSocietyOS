const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ["GENERAL", "MAINTENANCE", "EVENT", "EMERGENCY", "RULE_CHANGE", "MEETING"],
      default: "GENERAL"
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM"
    },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    attachments: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notice", noticeSchema);
