import { useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, PageHeader, Pills, SearchBox, Spinner, StatusBadge } from "../../components/ui";
import API from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { fmtDateTime } from "../../utils/format";

export default function SecurityLogs() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const { data: logs, loading } = useLoad(async () => (await API.get("/visitors/logs")).data.visitors || [], []);
  const list = useMemo(() => logs.filter((v) => `${v.name} ${v.phone} ${v.residentId?.name || ""} ${v.residentId?.flatNumber || ""}`.toLowerCase().includes(q.toLowerCase()) && (status === "ALL" || v.status === status)), [logs, q, status]);

  const duration = (v) => {
    if (v.checkInTime && v.checkOutTime) { const m = Math.round((new Date(v.checkOutTime) - new Date(v.checkInTime)) / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`; }
    return v.checkInTime ? "Inside" : "—";
  };

  return (
    <Layout title="Entry / Exit Logs" breadcrumb="Security · Logs">
      <PageHeader title="Entry & exit log" subtitle="Every visitor movement recorded at the gate" />
      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search visitor, phone, resident or flat…" /></div>
      <Pills options={["ALL", "CHECKED_IN", "CHECKED_OUT"]} value={status} onChange={setStatus} />
      {loading ? <Spinner /> : (
        <Card flush>
          {list.length === 0 ? <EmptyState icon={ScrollText} title="No log entries" text="Checked-in visitors appear here." /> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Visitor</th><th>Purpose</th><th>Resident</th><th>Status</th><th>Check-in</th><th>Check-out</th><th>Duration</th></tr></thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v._id}>
                    <td><strong>{v.name}</strong><div className="cell-sub">{v.phone}</div></td>
                    <td className="muted">{v.purpose}</td>
                    <td>{v.residentId?.name || "—"}<div className="cell-sub">Flat {v.residentId?.flatNumber || "—"}</div></td>
                    <td><StatusBadge value={v.status} /></td>
                    <td className="muted small">{fmtDateTime(v.checkInTime)}</td>
                    <td className="muted small">{fmtDateTime(v.checkOutTime)}</td>
                    <td className="small" style={{ color: "var(--teal)", fontWeight: 600 }}>{duration(v)}</td>
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
