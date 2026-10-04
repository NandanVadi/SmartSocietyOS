import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, Moon, Sun, Menu, UserCircle } from "lucide-react";
import Sidebar from "./Sidebar";
import EmergencyAlerts from "./EmergencyAlerts";
import SosPanel from "./SosPanel";
import { Avatar, Badge } from "./ui";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ROLE_LABELS, ROLE_TONE } from "../utils/format";

export default function Layout({ children, title, breadcrumb }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [now, setNow] = useState(new Date());
  const ref = useRef(null);

  useEffect(() => { document.title = `${title || "Dashboard"} · SmartSocietyOS`; }, [title]);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setMenu(false);
    document.addEventListener("mousedown", onDown);
    return () => { clearInterval(t); document.removeEventListener("mousedown", onDown); };
  }, []);

  const doLogout = () => { logout(); navigate("/login", { replace: true }); };
  const canSos = user?.role === "RESIDENT" || user?.role === "COMMITTEE_MEMBER";
  const sees = user?.role === "SECURITY_GUARD" || user?.role === "SOCIETY_ADMIN";

  return (
    <div className="app-layout">
      <Sidebar open={drawer} onClose={() => setDrawer(false)} />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn menu-toggle" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu size={18} /></button>
            <div style={{ minWidth: 0 }}>
              <div className="topbar-title">{title || "Dashboard"}</div>
              {breadcrumb && <div className="topbar-breadcrumb">{breadcrumb}</div>}
            </div>
          </div>
          <div className="topbar-right">
            <div className="clock">
              <b>{now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</b>
              <span>{now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
            </div>
            <button className="icon-btn" onClick={toggle} aria-label="Toggle theme" title={theme === "dark" ? "Light mode" : "Dark mode"}>
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <div style={{ position: "relative" }} ref={ref}>
              <button className="profile-btn" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu}>
                <Avatar name={user?.name} /><ChevronDown size={14} />
              </button>
              {menu && (
                <div className="dropdown" role="menu">
                  <div className="dropdown-head">
                    <strong>{user?.name}</strong>
                    <span>{user?.email}</span>
                    <div style={{ marginTop: 9 }}><Badge tone={ROLE_TONE[user?.role]} plain>{ROLE_LABELS[user?.role]}</Badge></div>
                  </div>
                  <div style={{ padding: 6 }}>
                    <button className="dropdown-item" onClick={() => { setMenu(false); navigate("/profile"); }}><UserCircle size={16} />My profile</button>
                    <button className="dropdown-item danger" onClick={doLogout}><LogOut size={16} />Sign out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="page-content">
          {sees && <EmergencyAlerts />}
          {canSos && <SosPanel />}
          {children}
        </main>
      </div>
    </div>
  );
}
