const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    type: {
      type: String,
      enum: ["GYM", "SWIMMING_POOL", "CLUBHOUSE", "TENNIS_COURT", "BADMINTON_COURT", "PARTY_HALL", "OTHER"],
      default: "OTHER"
    },
    capacity: { type: Number, default: 10 },
    pricePerHour: { type: Number, default: 0 },
    availableFrom: { type: String, default: "06:00" },
    availableTo: { type: String, default: "22:00" },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    isActive: { type: Boolean, default: true },
    images: [{ type: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Facility", facilitySchema);
