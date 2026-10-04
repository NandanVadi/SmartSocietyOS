require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const qrcode = require("qrcode");
const { v4: uuidv4 } = require("uuid");

const User = require("./models/User");
const Society = require("./models/Society");
const Complaint = require("./models/Complaint");
const Bill = require("./models/Bill");
const Notice = require("./models/Notice");
const Facility = require("./models/Facility");
const Parking = require("./models/Parking");
const Visitor = require("./models/Visitor");
const Marketplace = require("./models/Marketplace");
const Booking = require("./models/Booking");

async function seed() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas!");

    // Clear existing data
    console.log("Cleaning database collections...");
    await Promise.all([
      User.deleteMany({}),
      Society.deleteMany({}),
      Complaint.deleteMany({}),
      Bill.deleteMany({}),
      Notice.deleteMany({}),
      Facility.deleteMany({}),
      Parking.deleteMany({}),
      Visitor.deleteMany({}),
      Marketplace.deleteMany({}),
      Booking.deleteMany({})
    ]);

    const hashedPassword = await bcrypt.hash("password123", 10);

    // 1. Create Society
    console.log("Creating Sample Society...");
    const society = await Society.create({
      name: "Grand Horizon Residencies",
      address: "42 Palm Avenue, Powai",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400076",
      totalFlats: 120,
      isActive: true
    });

    // 2. Create Users for all 6 Roles
    console.log("Creating Users for all 6 roles...");
    const superAdmin = await User.create({
      name: "Alexander Vance",
      email: "superadmin@smartsociety.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      phone: "+91 9900112233",
      isActive: true
    });

    const societyAdmin = await User.create({
      name: "Rajesh Sharma",
      email: "admin@smartsociety.com",
      password: hashedPassword,
      role: "SOCIETY_ADMIN",
      societyId: society._id,
      flatNumber: "A-501",
      phone: "+91 9820011223",
      isActive: true
    });

    // Link admin to society
    society.adminId = societyAdmin._id;
    await society.save();

    const committeeMember = await User.create({
      name: "Sunita Deshmukh",
      email: "committee@smartsociety.com",
      password: hashedPassword,
      role: "COMMITTEE_MEMBER",
      societyId: society._id,
      flatNumber: "B-302",
      phone: "+91 9820044556",
      isActive: true
    });

    const resident = await User.create({
      name: "Darsh Parekh",
      email: "resident@smartsociety.com",
      password: hashedPassword,
      role: "RESIDENT",
      societyId: society._id,
      flatNumber: "C-204",
      phone: "+91 9819922334",
      isActive: true
    });

    const securityGuard = await User.create({
      name: "Ramesh Yadav",
      email: "security@smartsociety.com",
      password: hashedPassword,
      role: "SECURITY_GUARD",
      societyId: society._id,
      phone: "+91 9769011223",
      isActive: true
    });

    const maintenanceStaff = await User.create({
      name: "Mohan Kumar",
      email: "maintenance@smartsociety.com",
      password: hashedPassword,
      role: "MAINTENANCE_STAFF",
      societyId: society._id,
      phone: "+91 9811233445",
      isActive: true
    });

    // 3. Create Facilities
    console.log("Creating Facilities...");
    const gym = await Facility.create({
      name: "Horizon Elite Gym",
      description: "Fully equipped gym with cardio and weight machines",
      type: "GYM",
      capacity: 25,
      pricePerHour: 0,
      availableFrom: "06:00",
      availableTo: "22:00",
      societyId: society._id,
      isActive: true
    });

    const pool = await Facility.create({
      name: "Olympic Swimming Pool",
      description: "Temperature controlled swimming pool with lifeguard on duty",
      type: "SWIMMING_POOL",
      capacity: 30,
      pricePerHour: 100,
      availableFrom: "06:00",
      availableTo: "20:00",
      societyId: society._id,
      isActive: true
    });

    const clubhouse = await Facility.create({
      name: "Community Banquet Hall",
      description: "Air-conditioned banquet and party hall for private events",
      type: "PARTY_HALL",
      capacity: 100,
      pricePerHour: 500,
      availableFrom: "10:00",
      availableTo: "23:00",
      societyId: society._id,
      isActive: true
    });

    // 4. Create Parking Slots
    console.log("Creating Parking slots...");
    await Parking.create([
      { slotNumber: "P-101", type: "FOUR_WHEELER", status: "OCCUPIED", societyId: society._id, allocatedTo: resident._id, vehicleNumber: "MH-02-CD-4512", vehicleModel: "Honda City" },
      { slotNumber: "P-102", type: "FOUR_WHEELER", status: "AVAILABLE", societyId: society._id },
      { slotNumber: "P-103", type: "TWO_WHEELER", status: "AVAILABLE", societyId: society._id },
      { slotNumber: "P-EV-01", type: "ELECTRIC", status: "AVAILABLE", societyId: society._id }
    ]);

    // 5. Create Notices
    console.log("Creating Notices...");
    await Notice.create([
      {
        title: "Annual General Body Meeting (AGM) 2026",
        content: "The Annual General Meeting of Grand Horizon Residencies is scheduled for this Sunday at 10:00 AM in the Community Banquet Hall. All members are requested to attend.",
        category: "MEETING",
        priority: "HIGH",
        publishedBy: societyAdmin._id,
        societyId: society._id,
        isActive: true
      },
      {
        title: "Water Tank Cleaning Scheduled",
        content: "Overhead water tank cleaning will take place on Thursday from 9 AM to 2 PM. Water supply will remain paused during this window.",
        category: "MAINTENANCE",
        priority: "MEDIUM",
        publishedBy: committeeMember._id,
        societyId: society._id,
        isActive: true
      },
      {
        title: "Diwali Celebration & Cultural Night",
        content: "Join us for Diwali festivities, food stalls, and music at the Club Lawn on Saturday evening 6 PM onwards.",
        category: "EVENT",
        priority: "LOW",
        publishedBy: committeeMember._id,
        societyId: society._id,
        isActive: true
      }
    ]);

    // 6. Create Complaints
    console.log("Creating Sample Complaints...");
    await Complaint.create([
      {
        title: "Water seepage in bathroom ceiling",
        description: "Noticed heavy dampness and water drop seepage on the master bathroom ceiling from the upper flat.",
        category: "PLUMBING",
        status: "IN_PROGRESS",
        priority: "HIGH",
        residentId: resident._id,
        assignedTo: maintenanceStaff._id,
        societyId: society._id,
        remarks: "Inspection scheduled for today 2 PM"
      },
      {
        title: "Corridor light fixture flickering",
        description: "The 2nd floor C-wing corridor LED light has been flickering incessantly since yesterday.",
        category: "ELECTRICAL",
        status: "OPEN",
        priority: "MEDIUM",
        residentId: resident._id,
        societyId: society._id
      },
      {
        title: "Gym treadmill belt slippage",
        description: "Treadmill #2 belt slips when running at speeds above 8 km/h. Please calibrate.",
        category: "OTHER",
        status: "RESOLVED",
        priority: "LOW",
        residentId: resident._id,
        assignedTo: maintenanceStaff._id,
        societyId: society._id,
        resolvedAt: new Date(),
        remarks: "Belt replaced and tension calibrated."
      }
    ]);

    // 7. Create Bills
    console.log("Creating Sample Bills...");
    await Bill.create([
      {
        residentId: resident._id,
        societyId: society._id,
        type: "MAINTENANCE",
        amount: 3500,
        dueDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
        status: "PENDING",
        description: "Monthly maintenance charge for October 2026",
        month: "October 2026"
      },
      {
        residentId: resident._id,
        societyId: society._id,
        type: "MAINTENANCE",
        amount: 3500,
        dueDate: new Date(Date.now() - 20 * 24 * 3600 * 1000),
        status: "PAID",
        description: "Monthly maintenance charge for September 2026",
        month: "September 2026",
        paidAt: new Date(Date.now() - 15 * 24 * 3600 * 1000),
        transactionId: "TXN-9842104"
      }
    ]);

    // 8. Create Visitors & QR
    console.log("Creating Sample Visitors...");
    const qrToken1 = uuidv4();
    const qrImage1 = await qrcode.toDataURL(qrToken1, { width: 300 });

    const qrToken2 = uuidv4();
    const qrImage2 = await qrcode.toDataURL(qrToken2, { width: 300 });

    await Visitor.create([
      {
        name: "Vikram Malhotra",
        phone: "+91 9821100998",
        purpose: "Guest / Family Visit",
        vehicleNumber: "MH-01-AB-1234",
        residentId: resident._id,
        societyId: society._id,
        qrCode: qrToken1,
        qrCodeImage: qrImage1,
        status: "APPROVED"
      },
      {
        name: "Amazon Delivery Agent",
        phone: "+91 9833445566",
        purpose: "Package Delivery",
        vehicleNumber: "MH-03-ZZ-9900",
        residentId: resident._id,
        societyId: society._id,
        qrCode: qrToken2,
        qrCodeImage: qrImage2,
        status: "CHECKED_IN",
        checkInTime: new Date(Date.now() - 30 * 60 * 1000),
        approvedBy: securityGuard._id
      }
    ]);

    // 9. Create Marketplace Listings
    console.log("Creating Sample Marketplace Listings...");
    await Marketplace.create([
      {
        title: "Solid Teakwood Coffee Table",
        description: "Gently used 3x2 ft solid teakwood coffee table with glass top. Excellent condition.",
        category: "SELL",
        price: 2800,
        sellerId: resident._id,
        societyId: society._id,
        status: "ACTIVE",
        contactPhone: "+91 9819922334"
      },
      {
        title: "Looking for Home Math Tutor for Grade 8",
        description: "Seeking experienced CBSE math tutor for weekend classes at Flat C-204.",
        category: "BUY",
        price: 800,
        sellerId: resident._id,
        societyId: society._id,
        status: "ACTIVE",
        contactPhone: "+91 9819922334"
      }
    ]);

    console.log("\n==========================================");
    console.log("✅ SEEDING COMPLETE SUCCESSFULLY!");
    console.log("==========================================");
    console.log("You can log in with any of the following accounts (Password: password123):");
    console.log("1. Super Admin:      superadmin@smartsociety.com");
    console.log("2. Society Admin:    admin@smartsociety.com");
    console.log("3. Committee Member: committee@smartsociety.com");
    console.log("4. Resident:         resident@smartsociety.com");
    console.log("5. Security Guard:   security@smartsociety.com");
    console.log("6. Maintenance:      maintenance@smartsociety.com");
    console.log("==========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed with error:", error);
    process.exit(1);
  }
}

seed();
