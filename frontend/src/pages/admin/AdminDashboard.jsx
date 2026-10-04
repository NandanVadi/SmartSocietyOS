import { Users, MessageSquare, FileText, TrendingUp, Car, Shield, Building2, Bell, Siren } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { BarChart, Card, DonutChart, EmptyState, StatCard, StatusBadge, Progress } from "../../components/ui";
import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useLoad } from "../../utils/hooks";
import { inr, sortMonths, timeAgo } from "../../utils/format";

const MODULES = [
  { label: "Members", icon: Users, path: "/admin/residents", tone: "primary" },
  { label: "Complaints", icon: MessageSquare, path: "/admin/complaints", tone: "danger" },
  { label: "Billing", icon: FileText, path: "/admin/billing", tone: "warning" },
  { label: "Visitors", icon: Shield, path: "/admin/visitors", tone: "teal" },
  { label: "Facilities", icon: Building2, path: "/admin/facilities", tone: "info" },
  { label: "Parking", icon: Car, path: "/admin/parking", tone: "success" },
  { label: "Notices", icon: Bell, path: "/admin/notices", tone: "violet" },
  { label: "SOS Incidents", icon: Siren, path: "/admin/emergencies", tone: "danger" },
];
const COMPLAINT_COLORS = { OPEN: "#ef4444", IN_PROGRESS: "#f59e0b", RESOLVED: "#10b981", CLOSED: "#94a3b8" };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const safe = (p, fb) => p.catch(() => ({ data: fb }));

  const { data: d, loading } = useLoad(async () => {
    const [members, billStats, cStats, parking, today, complaints] = await Promise.all([
      safe(API.get("/societies/members"), { users: [] }),
      safe(API.get("/billing/bills/stats"), { stats: [], totalRevenue: 0, monthly: [] }),
      safe(API.get("/complaints/stats"), { stats: [] }),
      safe(API.get("/facilities/parking"), { slots: [] }),
      safe(API.get("/visitors/today"), { visitors: [] }),
      safe(API.get("/complaints"), { complaints: [] }),
    ]);
    return {
      members: members.data.users, billStats: billStats.data, cStats: cStats.data.stats,
      slots: parking.data.slots, today: today.data.visitors, complaints: complaints.data.complaints,
    };
  }, null);

  const bill = (s) => d?.billStats.stats.find((x) => x._id === s) || { count: 0, totalAmount: 0 };
  const outstanding = bill("PENDING").totalAmount + bill("OVERDUE").totalAmount;
  const residents = d?.members.filter((m) => m.role === "RESIDENT").length;
  const occupied = d?.slots.filter((s) => s.status === "OCCUPIED").length || 0;
  const occPct = d?.slots.length ? Math.round((occupied / d.slots.length) * 100) : 0;
  const donut = (d?.cStats || []).map((s) => ({ label: s._id.replace("_", " "), value: s.count, color: COMPLAINT_COLORS[s._id] || "#94a3b8" }));
  const monthly = sortMonths(d?.billStats.monthly).slice(-6);

  return (
    <Layout title="Admin Dashboard" breadcrumb={`Society Admin · ${user?.societyName || ""}`}>
      <div className="hero">
        <div>
          <h2>Good to see you, {user?.name?.split(" ")[0]}</h2>
          <p>Here is how {user?.societyName || "your society"} is doing today.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate("/admin/notices")}><Bell size={16} />Publish a notice</button>
      </div>

      <div className="grid-4 mb">
        <StatCard icon={Users} tone="primary" label="Residents" value={residents} hint={`${d?.members.length ?? 0} total members`} loading={loading} />
        <StatCard icon={TrendingUp} tone="success" label="Revenue collected" value={inr(d?.billStats.totalRevenue)} loading={loading} />
        <StatCard icon={FileText} tone="warning" label="Outstanding dues" value={inr(outstanding)} hint={`${bill("OVERDUE").count} overdue bills`} loading={loading} />
        <StatCard icon={MessageSquare} tone="danger" label="Open complaints" value={d?.complaints.filter((c) => c.status === "OPEN").length} hint={`${d?.today.length ?? 0} visitors today`} loading={loading} />
      </div>

      <div className="grid-main mb">
        <Card title="Billed vs collected" subtitle="By billing month">
          {monthly.length ? (
            <BarChart data={monthly.map((m) => ({ label: m._id, values: [m.billed, m.collected] }))}
              series={[{ name: "Billed", color: "#a5b4fc" }, { name: "Collected", color: "#4f46e5" }]} format={inr} />
          ) : <EmptyState icon={FileText} title="No billing data" text="Create bills to see collection trends." />}
        </Card>
        <div className="stack">
          <Card title="Complaints by status">
            {donut.length ? <DonutChart data={donut} size={150} thickness={20} centerLabel="complaints" /> : <EmptyState title="No complaints" />}
          </Card>
          <Card title="Parking occupancy" subtitle={`${occupied} of ${d?.slots.length ?? 0} slots in use`}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><b style={{ fontSize: 22 }}>{occPct}%</b><span className="faint small">occupied</span></div>
            <Progress value={occPct} color="var(--teal)" />
          </Card>
        </div>
      </div>

      <div className="grid-main">
        <Card title="Latest complaints" action={<button className="btn btn-ghost btn-sm" onClick={() => navigate("/admin/complaints")}>View all</button>}>
          {d?.complaints.length ? d.complaints.slice(0, 5).map((c) => (
            <div className="list-item" key={c._id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4>{c.title}</h4>
                <p>{c.residentId?.name} · Flat {c.residentId?.flatNumber || "—"} · {timeAgo(c.createdAt)}</p>
              </div>
              <StatusBadge value={c.priority} /><StatusBadge value={c.status} />
            </div>
          )) : <EmptyState icon={MessageSquare} title="All clear" text="No complaints have been filed." />}
        </Card>
        <Card title="Quick access">
          <div className="quick-grid">
            {MODULES.map(({ label, icon: Icon, path, tone }) => (
              <button key={path} className="quick" onClick={() => navigate(path)}>
                <div className={`stat-icon tone-${tone}`}><Icon size={20} /></div>{label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
