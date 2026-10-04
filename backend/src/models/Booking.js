const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true },
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING"
    },
    totalAmount: { type: Number, default: 0 },
    remarks: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
