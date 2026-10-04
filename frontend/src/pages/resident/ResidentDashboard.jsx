import { MessageSquare, FileText, Bell, ShoppingBag, QrCode, CalendarCheck, Clock, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { Card, EmptyState, StatCard, StatusBadge } from "../../components/ui";
import API from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useLoad } from "../../utils/hooks";
import { fmtDate, inr, timeAgo } from "../../utils/format";

const QUICK = [
  { label: "File complaint", icon: MessageSquare, path: "/resident/complaints", tone: "danger" },
  { label: "Invite visitor", icon: QrCode, path: "/resident/visitors", tone: "teal" },
  { label: "Book facility", icon: CalendarCheck, path: "/resident/facilities", tone: "warning" },
  { label: "Pay bills", icon: FileText, path: "/resident/bills", tone: "success" },
  { label: "Notice board", icon: Bell, path: "/resident/notices", tone: "violet" },
  { label: "Marketplace", icon: ShoppingBag, path: "/resident/marketplace", tone: "info" },
];

export default function ResidentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: d, loading } = useLoad(async () => {
    const [b, c, v, n] = await Promise.all([API.get("/billing/bills/my"), API.get("/complaints/my"), API.get("/visitors/my"), API.get("/billing/notices")]);
    return { bills: b.data.bills || [], complaints: c.data.complaints || [], visitors: v.data.visitors || [], notices: n.data.notices || [] };
  }, null);

  // OVERDUE bills are unpaid too, so they count towards "due"
  const unpaid = (d?.bills || []).filter((b) => b.status !== "PAID");
  const due = unpaid.reduce((a, b) => a + b.amount, 0);
  const nextDue = [...unpaid].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <Layout title="My Dashboard" breadcrumb={`Resident${user?.flatNumber ? ` · Flat ${user.flatNumber}` : ""}`}>
      <div className="hero">
        <div>
          <h2>{greet}, {user?.name?.split(" ")[0]} 👋</h2>
          <p>{user?.societyName}{user?.flatNumber && ` · Flat ${user.flatNumber}`}. {unpaid.length ? `You have ${unpaid.length} unpaid bill${unpaid.length > 1 ? "s" : ""}.` : "You're all caught up."}</p>
        </div>
        {unpaid.length > 0 && <button className="btn btn-secondary" onClick={() => navigate("/resident/bills")}>Pay {inr(due)}</button>}
      </div>

      <div className="grid-4 mb">
        <StatCard icon={Clock} tone="warning" label="Amount due" value={inr(due)} hint={nextDue ? `Next due ${fmtDate(nextDue.dueDate)}` : "Nothing due"} loading={loading} />
        <StatCard icon={FileText} tone="primary" label="Bills" value={d?.bills.length} loading={loading} />
        <StatCard icon={MessageSquare} tone="danger" label="Open complaints" value={d?.complaints.filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS").length} loading={loading} />
        <StatCard icon={Shield} tone="teal" label="Visitors invited" value={d?.visitors.length} loading={loading} />
      </div>

      <div className="grid-2">
        <Card title="Quick actions" subtitle="Everything you do most often">
          <div className="quick-grid">
            {QUICK.map(({ label, icon: Icon, path, tone }) => (
              <button key={path} className="quick" onClick={() => navigate(path)}><div className={`stat-icon tone-${tone}`}><Icon size={20} /></div>{label}</button>
            ))}
          </div>
        </Card>
        <Card title="Latest notices" action={<button className="btn btn-ghost btn-sm" onClick={() => navigate("/resident/notices")}>View all</button>}>
          {d?.notices.length ? d.notices.slice(0, 3).map((n) => (
            <div className="list-item" key={n._id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4>{n.title}</h4>
                <p style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.content}</p>
                <div className="faint small" style={{ marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
              </div>
              <StatusBadge value={n.priority} />
            </div>
          )) : <EmptyState icon={Bell} title="No notices" text="You're up to date." />}
        </Card>
      </div>
    </Layout>
  );
}
