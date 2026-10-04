#!/bin/bash
set -e

rm -rf .git
git init -b main

# Helper to set author
set_darsh() {
  git config user.name "Darsh Parekh"
  git config user.email "parekhdarsh002@gmail.com"
}
set_nandan() {
  git config user.name "Nandan Vadi"
  git config user.email "nandanvadi@gmail.com"
}

# 1. Project Skeleton (Darsh)
set_darsh
git add frontend/package*.json frontend/vite.config.js frontend/index.html frontend/src/main.jsx frontend/src/index.css frontend/src/utils/ frontend/src/context/ThemeContext.jsx frontend/src/context/ToastContext.jsx backend/package*.json backend/src/server.js backend/src/app.js backend/src/config/ frontend/.env.example backend/.env.example frontend/.oxlintrc.json .gitignore backend/.gitignore frontend/.gitignore
git commit -m "Initialize project skeleton, global configurations, and base utilities"

# 2. Auth & User Management (Nandan)
set_nandan
git add backend/src/models/User.js backend/src/models/Society.js backend/src/controllers/authController.js backend/src/routes/authRoutes.js backend/src/controllers/societyController.js backend/src/routes/societyRoutes.js backend/src/middleware/ frontend/src/context/AuthContext.jsx frontend/src/App.jsx frontend/src/pages/Login.jsx frontend/src/pages/Register.jsx frontend/src/pages/Profile.jsx frontend/src/pages/superadmin/ frontend/src/pages/admin/AdminResidents.jsx
git commit -m "Implement authentication, role-based access control, and user management"

# 3. Visitor Management & Security (Darsh)
set_darsh
git add backend/src/models/Visitor.js backend/src/controllers/visitorController.js backend/src/routes/visitorRoutes.js frontend/src/pages/resident/ResidentVisitors.jsx frontend/src/pages/security/ frontend/src/pages/admin/AdminVisitors.jsx
git commit -m "Build end-to-end visitor management and gate security workflows"

# 4. Billing & Financials (Nandan)
set_nandan
git add backend/src/models/Bill.js backend/src/controllers/billingController.js backend/src/routes/billingRoutes.js frontend/src/pages/admin/AdminBilling.jsx frontend/src/pages/resident/ResidentBills.jsx
git commit -m "Implement society billing, invoicing, and payment tracking"

# 5. Complaints & Maintenance (Darsh)
set_darsh
git add backend/src/models/Complaint.js backend/src/controllers/complaintController.js backend/src/routes/complaintRoutes.js frontend/src/pages/resident/ResidentComplaints.jsx frontend/src/pages/admin/AdminComplaints.jsx frontend/src/pages/maintenance/
git commit -m "Create complaint ticketing and maintenance staff assignment system"

# 6. Marketplace & Notices (Nandan)
set_nandan
git add backend/src/models/Marketplace.js backend/src/models/Notice.js backend/src/controllers/marketplaceController.js backend/src/routes/marketplaceRoutes.js frontend/src/pages/resident/Marketplace.jsx frontend/src/pages/resident/NoticeBoard.jsx frontend/src/pages/admin/AdminNotices.jsx
git commit -m "Develop resident marketplace and society notice board features"

# 7. Facilities & Parking (Darsh)
set_darsh
git add backend/src/models/Facility.js backend/src/models/Parking.js backend/src/controllers/facilityController.js backend/src/routes/facilityRoutes.js frontend/src/pages/resident/ResidentFacilities.jsx frontend/src/pages/admin/AdminFacilities.jsx frontend/src/pages/admin/AdminParking.jsx
git commit -m "Add facility booking and parking allocation modules"

# 8. Dashboards, Components & Emergencies (Darsh)
set_darsh
git add backend/src/models/Emergency.js backend/src/controllers/emergencyController.js backend/src/routes/emergencyRoutes.js frontend/src/pages/resident/ResidentDashboard.jsx frontend/src/pages/admin/AdminDashboard.jsx frontend/src/pages/committee/CommitteeDashboard.jsx frontend/src/pages/committee/CommitteeReports.jsx frontend/src/components/ frontend/public/
git commit -m "Implement emergency SOS and build role-specific dashboards"

# 9. Final Integration & Tests (Nandan)
set_nandan
git add .
git commit -m "Finalize end-to-end integration, add seeders, and backend tests"

git remote add origin https://github.com/NandanVadi/SmartSocietyOS.git
git push -u origin main --force
