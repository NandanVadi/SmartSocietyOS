const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["MEDICAL", "FIRE", "SECURITY_THREAT", "LIFT_STUCK", "OTHER"],
      default: "SECURITY_THREAT"
    },
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    societyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true
    },
    flatNumber: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["ACTIVE", "DISPATCHED", "RESOLVED", "CANCELLED"],
      default: "ACTIVE"
    },
    dispatchedAt: {
      type: Date,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Emergency", emergencySchema);
