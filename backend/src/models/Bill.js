const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    type: {
      type: String,
      enum: ["MAINTENANCE", "PARKING", "FACILITY", "PENALTY", "OTHER"],
      default: "MAINTENANCE"
    },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "OVERDUE"],
      default: "PENDING"
    },
    description: { type: String, default: null },
    month: { type: String, default: null },
    paidAt: { type: Date, default: null },
    transactionId: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);
