const Marketplace = require("../models/Marketplace");

// Create listing (Resident)
const createListing = async (req, res) => {
  try {
    const { title, description, category, price, contactPhone } = req.body;
    if (!title || !description) return res.status(400).json({ message: "Title and description are required" });
    const listing = await Marketplace.create({
      title, description, category, price, contactPhone,
      sellerId: req.user.id,
      societyId: req.user.societyId
    });
    res.status(201).json({ message: "Listing created", listing });
  } catch (error) {
    res.status(500).json({ message: "Failed to create listing", error: error.message });
  }
};

// Get all active listings
const getListings = async (req, res) => {
  try {
    const filter = req.user.societyId ? { societyId: req.user.societyId, status: "ACTIVE" } : { status: "ACTIVE" };
    if (req.query.category) filter.category = req.query.category;

    const listings = await Marketplace.find(filter)
      .populate("sellerId", "name flatNumber phone")
      .sort({ createdAt: -1 });
    res.json({ listings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch listings", error: error.message });
  }
};

// Get my listings
const getMyListings = async (req, res) => {
  try {
    const listings = await Marketplace.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ listings });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch listings", error: error.message });
  }
};

// Update listing
const updateListing = async (req, res) => {
  try {
    const { title, description, category, price, contactPhone, status } = req.body;
    const update = { title, description, category, price, contactPhone, status };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
    const listing = await Marketplace.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.user.id },
      update,
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: "Listing not found or unauthorized" });
    res.json({ message: "Listing updated", listing });
  } catch (error) {
    res.status(500).json({ message: "Failed to update listing", error: error.message });
  }
};

// Delete listing
const deleteListing = async (req, res) => {
  try {
    // Sellers can remove their own listings; admins can moderate any listing in their society
    const filter = { _id: req.params.id };
    if (req.user.role === "SOCIETY_ADMIN") filter.societyId = req.user.societyId;
    else filter.sellerId = req.user.id;
    const listing = await Marketplace.findOneAndUpdate(filter, { status: "INACTIVE" });
    if (!listing) return res.status(404).json({ message: "Listing not found or unauthorized" });
    res.json({ message: "Listing removed" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove listing", error: error.message });
  }
};

// Get marketplace analytics (Admin)
const getMarketplaceAnalytics = async (req, res) => {
  try {
    if (!req.user.societyId) {
      return res.json({ categoryStats: [], totalListings: 0, activeListings: 0 });
    }
    const mongoose = require("mongoose");
    const sid = new mongoose.Types.ObjectId(req.user.societyId.toString());

    const listings = await Marketplace.find({ societyId: sid }).select("category price");
    const byCat = {};
    listings.forEach((l) => {
      const c = (byCat[l.category] = byCat[l.category] || { _id: l.category, count: 0, total: 0 });
      c.count += 1;
      c.total += l.price || 0;
    });
    const categoryStats = Object.values(byCat).map((c) => ({
      _id: c._id, count: c.count, avgPrice: c.count ? Math.round(c.total / c.count) : 0,
    }));

    const totalListings = await Marketplace.countDocuments({ societyId: req.user.societyId });
    const activeListings = await Marketplace.countDocuments({ societyId: req.user.societyId, status: "ACTIVE" });

    res.json({ categoryStats, totalListings, activeListings });
  } catch (error) {
    res.status(500).json({ message: "Failed to get analytics", error: error.message });
  }
};

module.exports = {
  createListing, getListings, getMyListings, updateListing, deleteListing, getMarketplaceAnalytics
};
