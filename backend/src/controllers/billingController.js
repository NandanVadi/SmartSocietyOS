const mongoose = require("mongoose");
const Bill = require("../models/Bill");
const Notice = require("../models/Notice");
const User = require("../models/User");

const scope = (req) => (req.user.societyId ? { societyId: req.user.societyId } : {});

// Flip PENDING bills whose due date has passed to OVERDUE (keeps the status accurate
// without needing a cron job).
const markOverdue = (filter = {}) =>
  Bill.updateMany({ ...filter, status: "PENDING", dueDate: { $lt: new Date() } }, { status: "OVERDUE" });

// =====================
// BILL MANAGEMENT
// =====================

// Create bill (Admin)
const createBill = async (req, res) => {
  try {
    const { residentId, type, amount, dueDate, description, month } = req.body;
    if (!residentId || !amount || !dueDate) {
      return res.status(400).json({ message: "Resident, amount and due date are required" });
    }
    if (Number(amount) <= 0) return res.status(400).json({ message: "Amount must be greater than zero" });

    const resident = await User.findOne({ _id: residentId, ...scope(req) });
    if (!resident) return res.status(404).json({ message: "Resident not found in your society" });

    const bill = await Bill.create({
      residentId, type, amount, dueDate: new Date(dueDate),
      description, month,
      societyId: resident.societyId,
    });
    res.status(201).json({ message: "Bill created", bill });
  } catch (error) {
    res.status(500).json({ message: "Failed to create bill", error: error.message });
  }
};

// Create bulk bills for all residents (Admin)
const createBulkBills = async (req, res) => {
  try {
    const { residentIds, type, amount, dueDate, description, month } = req.body;
    if (!Array.isArray(residentIds) || residentIds.length === 0) {
      return res.status(400).json({ message: "No residents selected" });
    }
    if (!amount || Number(amount) <= 0 || !dueDate) {
      return res.status(400).json({ message: "Amount and due date are required" });
    }

    const residents = await User.find({ _id: { $in: residentIds }, role: "RESIDENT", ...scope(req) }).select("_id societyId");
    if (residents.length === 0) return res.status(404).json({ message: "No matching residents found" });

    const created = await Bill.insertMany(
      residents.map((r) => ({
        residentId: r._id, type, amount,
        dueDate: new Date(dueDate),
        description, month,
        societyId: r.societyId,
      }))
    );
    res.status(201).json({ message: `${created.length} bills created`, bills: created });
  } catch (error) {
    res.status(500).json({ message: "Failed to create bills", error: error.message });
  }
};

// Get my bills (Resident)
const getMyBills = async (req, res) => {
  try {
    await markOverdue({ residentId: req.user.id });
    const bills = await Bill.find({ residentId: req.user.id }).sort({ createdAt: -1 });
    res.json({ bills });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bills", error: error.message });
  }
};

// Get all bills (Admin)
const getAllBills = async (req, res) => {
  try {
    await markOverdue(scope(req));
    const filter = scope(req);
    if (req.query.status) filter.status = req.query.status;
    const bills = await Bill.find(filter)
      .populate("residentId", "name flatNumber email")
      .sort({ createdAt: -1 });
    res.json({ bills });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bills", error: error.message });
  }
};

// Pay bill (Resident) — can only pay own, unpaid bills
const payBill = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, residentId: req.user.id, status: { $ne: "PAID" } },
      {
        status: "PAID",
        paidAt: new Date(),
        transactionId: transactionId || `TXN-${Date.now()}`,
      },
      { new: true }
    );
    if (!bill) return res.status(404).json({ message: "Bill not found or already paid" });
    res.json({ message: "Bill paid successfully", bill });
  } catch (error) {
    res.status(500).json({ message: "Failed to pay bill", error: error.message });
  }
};

// Get billing stats (Admin / Committee)
const getBillingStats = async (req, res) => {
  try {
    const societyId = req.user.societyId;
    if (!societyId) {
      return res.json({ stats: [], totalRevenue: 0, monthly: [] });
    }
    const sid = new mongoose.Types.ObjectId(societyId.toString());
    await markOverdue({ societyId: sid });

    const stats = await Bill.aggregate([
      { $match: { societyId: sid } },
      { $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } },
    ]);

    const totalRevenue = await Bill.aggregate([
      { $match: { societyId: sid, status: "PAID" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Billed vs. collected per month label (computed in JS to stay portable across Mongo-compatible DBs)
    const monthMap = {};
    const rows = await Bill.find({ societyId: sid }).select("month amount status");
    rows.forEach((b) => {
      const key = b.month || "Unspecified";
      monthMap[key] = monthMap[key] || { _id: key, billed: 0, collected: 0 };
      monthMap[key].billed += b.amount;
      if (b.status === "PAID") monthMap[key].collected += b.amount;
    });
    const monthly = Object.values(monthMap);

    res.json({ stats, totalRevenue: totalRevenue[0]?.total || 0, monthly });
  } catch (error) {
    res.status(500).json({ message: "Failed to get stats", error: error.message });
  }
};

// =====================
// NOTICE BOARD
// =====================

const createNotice = async (req, res) => {
  try {
    const { title, content, category, priority, expiresAt } = req.body;
    if (!title || !content) return res.status(400).json({ message: "Title and content are required" });
    const notice = await Notice.create({
      title, content, category, priority,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      publishedBy: req.user.id,
      societyId: req.user.societyId,
    });
    res.status(201).json({ message: "Notice published", notice });
  } catch (error) {
    res.status(500).json({ message: "Failed to create notice", error: error.message });
  }
};

const getNotices = async (req, res) => {
  try {
    const filter = { ...scope(req), isActive: true, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] };
    const notices = await Notice.find(filter)
      .populate("publishedBy", "name role")
      .sort({ createdAt: -1 });
    res.json({ notices });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notices", error: error.message });
  }
};

const updateNotice = async (req, res) => {
  try {
    const { title, content, category, priority, expiresAt } = req.body;
    const update = { title, content, category, priority };
    if (expiresAt !== undefined) update.expiresAt = expiresAt ? new Date(expiresAt) : null;
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const notice = await Notice.findOneAndUpdate({ _id: req.params.id, ...scope(req) }, update, { new: true });
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json({ message: "Notice updated", notice });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notice", error: error.message });
  }
};

const deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findOneAndUpdate({ _id: req.params.id, ...scope(req) }, { isActive: false });
    if (!notice) return res.status(404).json({ message: "Notice not found" });
    res.json({ message: "Notice removed" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove notice", error: error.message });
  }
};

module.exports = {
  createBill, createBulkBills, getMyBills, getAllBills, payBill, getBillingStats,
  createNotice, getNotices, updateNotice, deleteNotice,
};
