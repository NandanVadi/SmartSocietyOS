const express = require("express");
const cors = require("cors");
const app = express();

// CORS: local Vite dev server (localhost / 127.0.0.1) plus an optional CLIENT_URL
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map((s) => s.trim()) : []),
];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow if no origin (e.g. server-to-server), if in allowedOrigins, or simply pass false to omit CORS headers 
      // (which allows same-origin requests to still succeed without throwing a 500 error).
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(null, false); 
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Ensure database connection before routing (Vercel Serverless requirement)
const connectDB = require("./config/db");
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// Routes
const authRoutes = require("./routes/authRoutes");
const societyRoutes = require("./routes/societyRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const visitorRoutes = require("./routes/visitorRoutes");
const facilityRoutes = require("./routes/facilityRoutes");
const billingRoutes = require("./routes/billingRoutes");
const marketplaceRoutes = require("./routes/marketplaceRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");

// Health check
app.get("/api/health", (req, res) => {
  res.json({ message: "SmartSocietyOS API is running", version: "1.0.0" });
});

app.use("/api/auth", authRoutes);
app.use("/api/societies", societyRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/emergency", emergencyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.status === 400 ? "Bad request" : "Internal server error", error: err.message });
});

module.exports = app;
