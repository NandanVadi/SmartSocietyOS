const express = require("express");
const { register, createUser, login, getProfile, updateProfile } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/users", protect, authorize("SOCIETY_ADMIN", "SUPER_ADMIN"), createUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;
