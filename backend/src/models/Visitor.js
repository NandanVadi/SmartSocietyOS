const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const visitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    purpose: { type: String, required: true },
    vehicleNumber: { type: String, default: null },
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    qrCode: { type: String, default: () => uuidv4() },
    qrCodeImage: { type: String, default: null },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "CHECKED_IN", "CHECKED_OUT", "DENIED"],
      default: "PENDING"
    },
    checkInTime: { type: Date, default: null },
    checkOutTime: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    photo: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Visitor", visitorSchema);
