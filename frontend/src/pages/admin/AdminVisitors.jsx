import { useMemo, useState } from "react";
import { Shield, Users, LogIn, LogOut, CheckCircle2 } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, PageHeader, Pills, SearchBox, Spinner, StatCard, StatusBadge } from "../../components/ui";
import API from "../../utils/api";
import { useLoad, usePolling } from "../../utils/hooks";
import { fmtTime, fmtDate } from "../../utils/format";

// Admins monitor visitors read-only — check-in/out is performed by the security guard.
export default function AdminVisitors() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const { data: visitors, loading, reload } = useLoad(async () => (await API.get("/visitors/all")).data.visitors || [], []);
  usePolling(reload, 15000);

  const n = (s) => visitors.filter((v) => v.status === s).length;
  const list = useMemo(() => visitors.filter((v) =>
    `${v.name} ${v.phone} ${v.residentId?.name || ""} ${v.residentId?.flatNumber || ""}`.toLowerCase().includes(q.toLowerCase()) && (status === "ALL" || v.status === status)), [visitors, q, status]);

  return (
    <Layout title="Visitors" breadcrumb="Society Admin · Visitors">
      <PageHeader title="Visitor management" subtitle="Live view of gate activity. Check-in and check-out are handled by security." />
      <div className="grid-4 mb">
        <StatCard icon={Users} tone="primary" label="Recent visitors" value={visitors.length} loading={loading} />
        <StatCard icon={CheckCircle2} tone="warning" label="Pre-approved, awaiting entry" value={n("APPROVED")} loading={loading} />
        <StatCard icon={LogIn} tone="teal" label="Currently inside" value={n("CHECKED_IN")} loading={loading} />
        <StatCard icon={LogOut} tone="neutral" label="Checked out" value={n("CHECKED_OUT")} loading={loading} />
      </div>
      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search visitor, phone, resident or flat…" /></div>
      <Pills options={["ALL", "APPROVED", "CHECKED_IN", "CHECKED_OUT"]} value={status} onChange={setStatus} />
      {loading ? <Spinner /> : (
        <Card flush>
          {list.length === 0 ? <EmptyState icon={Shield} title="No visitors found" /> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Visitor</th><th>Purpose</th><th>Visiting</th><th>Status</th><th>Date</th><th>In</th><th>Out</th></tr></thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v._id}>
                    <td><strong>{v.name}</strong><div className="cell-sub">{v.phone}{v.vehicleNumber && ` · 🚗 ${v.vehicleNumber}`}</div></td>
                    <td className="muted">{v.purpose}</td>
                    <td>{v.residentId?.name || "—"}<div className="cell-sub">Flat {v.residentId?.flatNumber || "—"}</div></td>
                    <td><StatusBadge value={v.status} /></td>
                    <td className="faint small">{fmtDate(v.createdAt)}</td>
                    <td className="muted small">{fmtTime(v.checkInTime)}</td>
                    <td className="muted small">{fmtTime(v.checkOutTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Card>
      )}
    </Layout>
  );
}
