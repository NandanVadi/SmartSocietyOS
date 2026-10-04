import { Bell, MessageSquare, BarChart3, CalendarCheck, ShoppingBag, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { Card, EmptyState, StatCard, StatusBadge } from "../../components/ui";
import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useLoad } from "../../utils/hooks";
import { inr, timeAgo } from "../../utils/format";

export default function CommitteeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: d, loading } = useLoad(async () => {
    const ok = (p, fb) => p.catch(() => ({ data: fb }));
    const [c, n, b, bk] = await Promise.all([
      ok(API.get("/complaints"), { complaints: [] }), ok(API.get("/billing/notices"), { notices: [] }),
      ok(API.get("/billing/bills/stats"), { stats: [], totalRevenue: 0 }), ok(API.get("/facilities/bookings/all"), { bookings: [] }),
    ]);
    return { complaints: c.data.complaints, notices: n.data.notices, bills: b.data, bookings: bk.data.bookings };
  }, null);

  const open = d?.complaints.filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS").length;
  const dues = (d?.bills.stats || []).filter((s) => s._id !== "PAID").reduce((a, s) => a + s.totalAmount, 0);

  const links = [
    { label: "Publish notices", desc: "Announcements for residents", icon: Bell, path: "/committee/notices", tone: "violet" },
    { label: "Review complaints", desc: "Track and update issues", icon: MessageSquare, path: "/committee/complaints", tone: "danger" },
    { label: "Performance reports", desc: "Collections & resolution rates", icon: BarChart3, path: "/committee/reports", tone: "teal" },
    { label: "Facility bookings", desc: "See who booked what", icon: CalendarCheck, path: "/committee/bookings", tone: "warning" },
    { label: "Marketplace", desc: "Buy, sell and rent locally", icon: ShoppingBag, path: "/committee/marketplace", tone: "info" },
  ];

  return (
    <Layout title="Committee Dashboard" breadcrumb={`Committee · ${user?.societyName || ""}`}>
      <div className="hero">
        <div><h2>Welcome, {user?.name?.split(" ")[0]}</h2><p>Keep residents informed, follow up on complaints and monitor how the society is performing.</p></div>
      </div>
      <div className="grid-4 mb">
        <StatCard icon={MessageSquare} tone="danger" label="Unresolved complaints" value={open} loading={loading} />
        <StatCard icon={Bell} tone="violet" label="Active notices" value={d?.notices.length} loading={loading} />
        <StatCard icon={FileText} tone="warning" label="Outstanding dues" value={inr(dues)} loading={loading} />
        <StatCard icon={CalendarCheck} tone="teal" label="Pending bookings" value={d?.bookings.filter((b) => b.status === "PENDING").length} loading={loading} />
      </div>
      <div className="grid-main">
        <Card title="Latest complaints" action={<button className="btn btn-ghost btn-sm" onClick={() => navigate("/committee/complaints")}>View all</button>}>
          {d?.complaints.length ? d.complaints.slice(0, 5).map((c) => (
            <div className="list-item" key={c._id}>
              <div style={{ flex: 1, minWidth: 0 }}><h4>{c.title}</h4><p>{c.residentId?.name} · Flat {c.residentId?.flatNumber || "—"} · {timeAgo(c.createdAt)}</p></div>
              <StatusBadge value={c.status} />
            </div>
          )) : <EmptyState icon={MessageSquare} title="No complaints" />}
        </Card>
        <Card title="Quick access">
          <div className="stack" style={{ gap: 10 }}>
            {links.map(({ label, desc, icon: Icon, path, tone }) => (
              <button key={path} className="quick" style={{ flexDirection: "row", justifyContent: "flex-start", padding: 14, textAlign: "left" }} onClick={() => navigate(path)}>
                <div className={`stat-icon tone-${tone}`} style={{ width: 40, height: 40 }}><Icon size={18} /></div>
                <span><span style={{ display: "block", color: "var(--text)" }}>{label}</span><span className="faint small" style={{ fontWeight: 500 }}>{desc}</span></span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
