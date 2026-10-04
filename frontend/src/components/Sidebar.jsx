import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, Bell, FileText, Shield, ShoppingBag, Car, CalendarCheck,
  BarChart3, MessageSquare, QrCode, Home, Globe, ScrollText, Siren, Landmark, ClipboardList,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./ui";
import { ROLE_LABELS } from "../utils/format";

const I = 18;
const NAV = {
  SUPER_ADMIN: [
    { section: "Platform", items: [
      { label: "Overview", path: "/super-admin", icon: LayoutDashboard, end: true },
      { label: "Societies", path: "/super-admin/societies", icon: Building2 },
      { label: "All Users", path: "/super-admin/users", icon: Users },
      { label: "Analytics", path: "/super-admin/analytics", icon: BarChart3 },
    ] },
  ],
  SOCIETY_ADMIN: [
    { section: "Overview", items: [{ label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true }] },
    { section: "Community", items: [
      { label: "Members", path: "/admin/residents", icon: Users },
      { label: "Complaints", path: "/admin/complaints", icon: MessageSquare },
      { label: "Notice Board", path: "/admin/notices", icon: Bell },
      { label: "Marketplace", path: "/admin/marketplace", icon: ShoppingBag },
    ] },
    { section: "Operations", items: [
      { label: "Visitors", path: "/admin/visitors", icon: Shield },
      { label: "Facilities", path: "/admin/facilities", icon: Building2 },
      { label: "Parking", path: "/admin/parking", icon: Car },
      { label: "Billing", path: "/admin/billing", icon: FileText },
      { label: "SOS Incidents", path: "/admin/emergencies", icon: Siren },
    ] },
  ],
  COMMITTEE_MEMBER: [
    { section: "Committee", items: [
      { label: "Dashboard", path: "/committee", icon: LayoutDashboard, end: true },
      { label: "Notices", path: "/committee/notices", icon: Bell },
      { label: "Complaints", path: "/committee/complaints", icon: MessageSquare },
      { label: "Reports", path: "/committee/reports", icon: BarChart3 },
      { label: "Bookings", path: "/committee/bookings", icon: CalendarCheck },
      { label: "Marketplace", path: "/committee/marketplace", icon: ShoppingBag },
    ] },
  ],
  RESIDENT: [
    { section: "My Home", items: [
      { label: "Home", path: "/resident", icon: Home, end: true },
      { label: "My Bills", path: "/resident/bills", icon: FileText },
      { label: "Complaints", path: "/resident/complaints", icon: MessageSquare },
      { label: "Visitors", path: "/resident/visitors", icon: QrCode },
    ] },
    { section: "Community", items: [
      { label: "Book Facility", path: "/resident/facilities", icon: CalendarCheck },
      { label: "Notice Board", path: "/resident/notices", icon: Bell },
      { label: "Marketplace", path: "/resident/marketplace", icon: ShoppingBag },
    ] },
  ],
  SECURITY_GUARD: [
    { section: "Gate Control", items: [
      { label: "Dashboard", path: "/security", icon: LayoutDashboard, end: true },
      { label: "QR Verification", path: "/security/verify", icon: QrCode },
      { label: "Entry / Exit Logs", path: "/security/logs", icon: ScrollText },
      { label: "SOS Incidents", path: "/security/emergencies", icon: Siren },
    ] },
  ],
  MAINTENANCE_STAFF: [
    { section: "Work", items: [
      { label: "Dashboard", path: "/maintenance", icon: LayoutDashboard, end: true },
      { label: "Work Orders", path: "/maintenance/assignments", icon: ClipboardList },
    ] },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;
  const groups = NAV[user.role] || [];

  return (
    <>
      <div className={`sidebar-backdrop ${open ? "open" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Primary navigation">
        <div className="sidebar-logo">
          <div className="brand-mark"><Landmark size={20} /></div>
          <div>
            <div className="brand-name">SmartSocietyOS</div>
            <div className="brand-sub">Community operating system</div>
          </div>
        </div>

        {user.societyName ? (
          <div className="sidebar-society">
            <Building2 size={16} />
            <div><span>Your society</span><strong>{user.societyName}</strong></div>
          </div>
        ) : user.role === "SUPER_ADMIN" ? (
          <div className="sidebar-society"><Globe size={16} /><div><span>Scope</span><strong>All societies</strong></div></div>
        ) : null}

        <nav className="sidebar-nav">
          {groups.map((g) => (
            <div key={g.section}>
              <div className="nav-section-title">{g.section}</div>
              {g.items.map(({ label, path, icon: Icon, end }) => (
                <NavLink key={path} to={path} end={end} onClick={onClose}
                  className={({ isActive }) => `nav-item ${isActive || (!end && location.pathname.startsWith(path)) ? "active" : ""}`}>
                  <Icon size={I} /><span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" className="sidebar-user nav-item" onClick={onClose} style={{ marginBottom: 0 }}>
            <Avatar name={user.name} />
            <div>
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{ROLE_LABELS[user.role]}</div>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
