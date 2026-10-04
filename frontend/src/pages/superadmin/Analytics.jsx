import { Building2, Users, MessageSquare, IndianRupee } from "lucide-react";
import Layout from "../../components/Layout";
import { BarChart, Card, DonutChart, HBars, PageHeader, Spinner, StatCard } from "../../components/ui";
import API from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { inr, ROLE_LABELS } from "../../utils/format";
import { ROLE_COLORS } from "./SuperAdminDashboard";

export default function Analytics() {
  const { data, loading } = useLoad(async () => {
    const [a, s, u] = await Promise.all([API.get("/societies/analytics"), API.get("/societies"), API.get("/societies/users/all")]);
    return { a: a.data, societies: s.data.societies || [], users: u.data.users || [] };
  }, null);

  if (loading || !data) return <Layout title="Global Analytics" breadcrumb="Super Admin · Analytics"><Spinner /></Layout>;
  const { a, societies, users } = data;

  const roles = (a.roleBreakdown || []).map((r) => ({ label: ROLE_LABELS[r._id] || r._id, value: r.count, color: ROLE_COLORS[r._id] || "#94a3b8" }));
  const perSociety = societies.map((s) => ({
    label: s.name.length > 14 ? s.name.slice(0, 13) + "…" : s.name,
    residents: users.filter((u) => u.societyId?._id === s._id && u.role === "RESIDENT").length,
    staff: users.filter((u) => u.societyId?._id === s._id && u.role !== "RESIDENT").length,
  }));
  const cities = Object.entries(societies.reduce((m, s) => ({ ...m, [s.city]: (m[s.city] || 0) + 1 }), {})).map(([label, value]) => ({ label, value }));
  const resolvedPct = a.totalComplaints ? Math.round(((a.totalComplaints - a.openComplaints) / a.totalComplaints) * 100) : 0;

  return (
    <Layout title="Global Analytics" breadcrumb="Super Admin · Analytics">
      <PageHeader title="Global analytics" subtitle="Platform-wide usage, people and revenue" />
      <div className="grid-4 mb">
        <StatCard icon={Building2} tone="primary" label="Societies" value={a.totalSocieties} hint={`${a.activeSocieties ?? 0} active`} />
        <StatCard icon={Users} tone="teal" label="Users" value={a.totalUsers} />
        <StatCard icon={MessageSquare} tone="success" label="Complaint resolution" value={`${resolvedPct}%`} hint={`${a.openComplaints ?? 0} still open`} />
        <StatCard icon={IndianRupee} tone="warning" label="Revenue collected" value={inr(a.totalRevenue)} />
      </div>
      <div className="grid-2 mb">
        <Card title="Users by role"><DonutChart data={roles} centerLabel="users" /></Card>
        <Card title="Societies by city"><HBars data={cities} color="var(--violet)" /></Card>
      </div>
      <Card title="People per society" subtitle="Residents vs. staff & committee">
        {perSociety.length ? <BarChart data={perSociety.map((p) => ({ label: p.label, values: [p.residents, p.staff] }))}
          series={[{ name: "Residents", color: "#6366f1" }, { name: "Staff & committee", color: "#14b8a6" }]} /> : <p className="muted">No data yet.</p>}
      </Card>
    </Layout>
  );
}
