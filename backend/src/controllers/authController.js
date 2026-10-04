const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Society = require("../models/Society");

const STAFF_ROLES = ["COMMITTEE_MEMBER", "SECURITY_GUARD", "MAINTENANCE_STAFF", "RESIDENT"];

const validate = ({ name, email, password }) => {
  if (!name || !name.trim()) return "Name is required";
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return "A valid email is required";
  if (!password || password.length < 6) return "Password must be at least 6 characters";
  return null;
};

// =======================
// REGISTER (public — residents only)
// Privileged roles can no longer be self-assigned; they are created by an admin
// through POST /auth/users (see createUser) or by the seed script.
// =======================
const register = async (req, res) => {
  try {
    const { name, email, password, flatNumber, phone, societyId } = req.body;

    const problem = validate({ name, email, password });
    if (problem) return res.status(400).json({ message: problem });
    if (!societyId) return res.status(400).json({ message: "Please select your society" });

    const society = await Society.findOne({ _id: societyId, isActive: true }).catch(() => null);
    if (!society) return res.status(400).json({ message: "Selected society does not exist" });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "RESIDENT",
      flatNumber,
      phone,
      societyId: society._id,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, societyId: user.societyId },
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

// =======================
// CREATE USER (Society Admin / Super Admin)
// Society admins can add committee, security, maintenance staff and residents to
// their own society. Super admins can additionally create society admins.
// =======================
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, flatNumber, phone } = req.body;
    const problem = validate({ name, email, password });
    if (problem) return res.status(400).json({ message: problem });

    const isSuper = req.user.role === "SUPER_ADMIN";
    const allowed = isSuper ? [...STAFF_ROLES, "SOCIETY_ADMIN"] : STAFF_ROLES;
    if (!allowed.includes(role)) {
      return res.status(403).json({ message: `You cannot create users with role '${role}'` });
    }

    const societyId = isSuper ? req.body.societyId : req.user.societyId;
    if (!societyId) return res.status(400).json({ message: "Society is required" });

    if (await User.findOne({ email })) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      name, email, role, flatNumber, phone, societyId,
      password: await bcrypt.hash(password, 10),
    });

    if (role === "SOCIETY_ADMIN") await Society.findByIdAndUpdate(societyId, { adminId: user._id });

    res.status(201).json({
      message: "User created successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, societyId: user.societyId },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create user", error: error.message });
  }
};

// =======================
// LOGIN
// =======================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email }).populate("societyId", "name");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, societyId: user.societyId?._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        flatNumber: user.flatNumber,
        phone: user.phone,
        societyId: user.societyId?._id || null,
        societyName: user.societyId?.name || null,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// =======================
// GET PROFILE
// =======================
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("societyId", "name address city");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Failed to get profile", error: error.message });
  }
};

// =======================
// UPDATE PROFILE (name / phone / flat, optional password change)
// =======================
const updateProfile = async (req, res) => {
  try {
    const { name, phone, flatNumber, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (newPassword) {
      if (newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });
      if (!currentPassword || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }
    if (name !== undefined && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    if (flatNumber !== undefined) user.flatNumber = flatNumber;
    await user.save();

    const safe = user.toObject();
    delete safe.password;
    res.json({ message: "Profile updated", user: safe });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

module.exports = { register, createUser, login, getProfile, updateProfile };
