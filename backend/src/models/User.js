const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "SOCIETY_ADMIN", "COMMITTEE_MEMBER", "RESIDENT", "SECURITY_GUARD", "MAINTENANCE_STAFF"],
      default: "RESIDENT"
    },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", default: null },
    flatNumber: { type: String, default: null },
    phone: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    profileImage: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);