const mongoose = require("mongoose");

const parkingSchema = new mongoose.Schema(
  {
    slotNumber: { type: String, required: true },
    type: {
      type: String,
      enum: ["TWO_WHEELER", "FOUR_WHEELER", "ELECTRIC"],
      default: "FOUR_WHEELER"
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"],
      default: "AVAILABLE"
    },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    allocatedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    vehicleNumber: { type: String, default: null },
    vehicleModel: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Parking", parkingSchema);
