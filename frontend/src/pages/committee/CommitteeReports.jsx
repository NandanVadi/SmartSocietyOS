import { CheckCircle2, IndianRupee, MessageSquare, Percent } from "lucide-react";
import Layout from "../../components/Layout";
import { BarChart, Card, DonutChart, HBars, PageHeader, Spinner, StatCard } from "../../components/ui";
import API from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { inr, nice, sortMonths } from "../../utils/format";

const CS = { OPEN: "#ef4444", IN_PROGRESS: "#f59e0b", RESOLVED: "#10b981", CLOSED: "#94a3b8" };

export default function CommitteeReports() {
  const { data, loading } = useLoad(async () => {
    const [c, b] = await Promise.all([API.get("/complaints/stats"), API.get("/billing/bills/stats")]);
    return { c: c.data, b: b.data };
  }, null);
  if (loading || !data) return <Layout title="Performance Reports" breadcrumb="Committee · Reports"><Spinner /></Layout>;

  const { c, b } = data;
  const total = c.stats.reduce((a, s) => a + s.count, 0);
  const done = c.stats.filter((s) => s._id === "RESOLVED" || s._id === "CLOSED").reduce((a, s) => a + s.count, 0);
  const billed = b.stats.reduce((a, s) => a + s.totalAmount, 0);
  const rate = billed ? Math.round((b.totalRevenue / billed) * 100) : 0;
  const monthly = sortMonths(b.monthly).slice(-6);

  return (
    <Layout title="Performance Reports" breadcrumb="Committee · Reports">
      <PageHeader title="Society performance" subtitle="Collections and complaint handling at a glance" />
      <div className="grid-4 mb">
        <StatCard icon={IndianRupee} tone="success" label="Collected" value={inr(b.totalRevenue)} />
        <StatCard icon={Percent} tone="primary" label="Collection rate" value={`${rate}%`} hint={`of ${inr(billed)} billed`} />
        <StatCard icon={MessageSquare} tone="warning" label="Complaints filed" value={total} />
        <StatCard icon={CheckCircle2} tone="teal" label="Resolution rate" value={`${total ? Math.round((done / total) * 100) : 0}%`} hint={`${done} resolved or closed`} />
      </div>
      <div className="grid-main mb">
        <Card title="Billed vs collected" subtitle="By billing month">
          {monthly.length ? <BarChart data={monthly.map((m) => ({ label: m._id, values: [m.billed, m.collected] }))} series={[{ name: "Billed", color: "#a5b4fc" }, { name: "Collected", color: "#4f46e5" }]} format={inr} /> : <p className="muted">No billing data yet.</p>}
        </Card>
        <Card title="Complaints by status">
          <DonutChart data={c.stats.map((s) => ({ label: nice(s._id), value: s.count, color: CS[s._id] || "#94a3b8" }))} size={150} thickness={20} centerLabel="complaints" />
        </Card>
      </div>
      <Card title="Complaints by category" subtitle="What residents report most">
        {c.categoryStats.length ? <HBars data={[...c.categoryStats].sort((a, b) => b.count - a.count).map((s) => ({ label: nice(s._id), value: s.count }))} /> : <p className="muted">No complaints yet.</p>}
      </Card>
    </Layout>
  );
}
