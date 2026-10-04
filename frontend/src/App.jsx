import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ROLE_HOME } from "./utils/format";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

import SuperAdminOverview from "./pages/superadmin/SuperAdminDashboard";
import SuperAdminSocieties from "./pages/superadmin/Societies";
import SuperAdminUsers from "./pages/superadmin/Users";
import SuperAdminAnalytics from "./pages/superadmin/Analytics";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminResidents from "./pages/admin/AdminResidents";
import AdminComplaints from "./pages/admin/AdminComplaints";
import AdminVisitors from "./pages/admin/AdminVisitors";
import AdminFacilities from "./pages/admin/AdminFacilities";
import AdminParking from "./pages/admin/AdminParking";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminNotices from "./pages/admin/AdminNotices";

import CommitteeDashboard from "./pages/committee/CommitteeDashboard";
import CommitteeReports from "./pages/committee/CommitteeReports";

import ResidentDashboard from "./pages/resident/ResidentDashboard";
import ResidentComplaints from "./pages/resident/ResidentComplaints";
import ResidentVisitors from "./pages/resident/ResidentVisitors";
import ResidentFacilities from "./pages/resident/ResidentFacilities";
import ResidentBills from "./pages/resident/ResidentBills";
import NoticeBoard from "./pages/resident/NoticeBoard";
import Marketplace from "./pages/resident/Marketplace";

import SecurityDashboard from "./pages/security/SecurityDashboard";
import SecurityVerify from "./pages/security/SecurityVerify";
import SecurityLogs from "./pages/security/SecurityLogs";
import Emergencies from "./pages/security/Emergencies";

import MaintenanceDashboard from "./pages/maintenance/MaintenanceDashboard";

function Guard({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || "/login"} replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to={ROLE_HOME[user.role] || "/"} replace /> : children;
}

const R = (path, roles, element) => <Route key={path} path={path} element={<Guard roles={roles}>{element}</Guard>} />;

export default function App() {
  const SA = ["SUPER_ADMIN"], AD = ["SOCIETY_ADMIN"], CM = ["COMMITTEE_MEMBER"], RS = ["RESIDENT"], SG = ["SECURITY_GUARD"], MS = ["MAINTENANCE_STAFF"];
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Guard><RootRedirect /></Guard>} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        {R("/profile", null, <Profile />)}

        {R("/super-admin", SA, <SuperAdminOverview />)}
        {R("/super-admin/societies", SA, <SuperAdminSocieties />)}
        {R("/super-admin/users", SA, <SuperAdminUsers />)}
        {R("/super-admin/analytics", SA, <SuperAdminAnalytics />)}

        {R("/admin", AD, <AdminDashboard />)}
        {R("/admin/residents", AD, <AdminResidents />)}
        {R("/admin/complaints", AD, <AdminComplaints />)}
        {R("/admin/visitors", AD, <AdminVisitors />)}
        {R("/admin/facilities", AD, <AdminFacilities />)}
        {R("/admin/parking", AD, <AdminParking />)}
        {R("/admin/billing", AD, <AdminBilling />)}
        {R("/admin/notices", AD, <AdminNotices />)}
        {R("/admin/marketplace", AD, <Marketplace />)}
        {R("/admin/emergencies", AD, <Emergencies />)}

        {R("/committee", CM, <CommitteeDashboard />)}
        {R("/committee/notices", CM, <AdminNotices />)}
        {R("/committee/complaints", CM, <AdminComplaints />)}
        {R("/committee/reports", CM, <CommitteeReports />)}
        {R("/committee/bookings", CM, <AdminFacilities />)}
        {R("/committee/marketplace", CM, <Marketplace />)}

        {R("/resident", RS, <ResidentDashboard />)}
        {R("/resident/complaints", RS, <ResidentComplaints />)}
        {R("/resident/visitors", RS, <ResidentVisitors />)}
        {R("/resident/facilities", RS, <ResidentFacilities />)}
        {R("/resident/bills", RS, <ResidentBills />)}
        {R("/resident/notices", RS, <NoticeBoard />)}
        {R("/resident/marketplace", RS, <Marketplace />)}

        {R("/security", SG, <SecurityDashboard />)}
        {R("/security/verify", SG, <SecurityVerify />)}
        {R("/security/logs", SG, <SecurityLogs />)}
        {R("/security/emergencies", SG, <Emergencies />)}

        {R("/maintenance", MS, <MaintenanceDashboard />)}
        {R("/maintenance/assignments", MS, <MaintenanceDashboard view="orders" />)}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={ROLE_HOME[user.role] || "/login"} replace />;
}
