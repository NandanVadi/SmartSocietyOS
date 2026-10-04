import { Building2, Users, MessageSquare, IndianRupee, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { Card, DonutChart, EmptyState, StatCard, StatusBadge } from "../../components/ui";
import API from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { inr, fmtDate, ROLE_LABELS } from "../../utils/format";

export const ROLE_COLORS = {
  RESIDENT: "#0ea5e9", SOCIETY_ADMIN: "#7c3aed", SUPER_ADMIN: "#ef4444",
  SECURITY_GUARD: "#f59e0b", MAINTENANCE_STAFF: "#10b981", COMMITTEE_MEMBER: "#14b8a6",
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { data, loading } = useLoad(async () => {
    const [s, a] = await Promise.all([API.get("/societies"), API.get("/societies/analytics")]);
    return { societies: s.data.societies || [], analytics: a.data || {} };
  }, { societies: [], analytics: {} });
  const { societies, analytics } = data;

  const roles = (analytics.roleBreakdown || []).map((r) => ({ label: ROLE_LABELS[r._id] || r._id, value: r.count, color: ROLE_COLORS[r._id] || "#94a3b8" }));
  const active = societies.filter((s) => s.isActive).length;

  return (
    <Layout title="Platform Overview" breadcrumb="Super Admin · Global view">
      <div className="hero">
        <div>
          <h2>Platform control center</h2>
          <p>Monitor every society on SmartSocietyOS, onboard new communities and manage their administrators.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate("/super-admin/societies")}><Building2 size={16} />Manage societies</button>
      </div>

      <div className="grid-4 mb">
        <StatCard icon={Building2} tone="primary" label="Societies" value={analytics.totalSocieties} hint={`${active} active`} loading={loading} />
        <StatCard icon={Users} tone="teal" label="Platform users" value={analytics.totalUsers} loading={loading} />
        <StatCard icon={MessageSquare} tone="warning" label="Open complaints" value={analytics.openComplaints} hint={`${analytics.totalComplaints ?? 0} total`} loading={loading} />
        <StatCard icon={IndianRupee} tone="success" label="Revenue collected" value={inr(analytics.totalRevenue)} loading={loading} />
      </div>

      <div className="grid-main">
        <Card title="Recently onboarded societies" subtitle="Newest communities on the platform" flush
          action={<button className="btn btn-ghost btn-sm" onClick={() => navigate("/super-admin/societies")}>View all</button>}>
          {societies.length === 0 ? <EmptyState icon={Globe} title="No societies yet" text="Create the first society to get started." /> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Society</th><th>City</th><th>Flats</th><th>Admin</th><th>Status</th><th>Added</th></tr></thead>
              <tbody>
                {[...societies].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6).map((s) => (
                  <tr key={s._id}>
                    <td><strong>{s.name}</strong></td>
                    <td className="muted">{s.city}, {s.state}</td>
                    <td className="num">{s.totalFlats}</td>
                    <td className="muted">{s.adminId?.name || <span className="faint">Unassigned</span>}</td>
                    <td><StatusBadge value={s.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                    <td className="faint small">{fmtDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Card>
        <Card title="Users by role" subtitle="Across all societies">
          {roles.length ? <DonutChart data={roles} centerLabel="users" /> : <EmptyState title="No users" />}
        </Card>
      </div>
    </Layout>
  );
}
