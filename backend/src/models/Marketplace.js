const mongoose = require("mongoose");

const marketplaceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["SELL", "BUY", "RENT", "SERVICE", "FREE"],
      default: "SELL"
    },
    price: { type: Number, default: 0 },
    images: [{ type: String }],
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "SOLD", "INACTIVE"],
      default: "ACTIVE"
    },
    contactPhone: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Marketplace", marketplaceSchema);
