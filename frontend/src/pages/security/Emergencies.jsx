import { Siren, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, PageHeader, Spinner, StatCard, StatusBadge } from "../../components/ui";
import API from "../../utils/api";
import { useLoad, usePolling } from "../../utils/hooks";
import { EMERGENCY_EMOJI, fmtDateTime, nice } from "../../utils/format";

// Incident history. Live active alerts (with Dispatch / Resolve) are shown at the top by <Layout/>.
export default function Emergencies() {
  const { data: logs, loading, reload } = useLoad(async () => (await API.get("/emergency/logs")).data.emergencies || [], []);
  usePolling(reload, 15000);
  const n = (s) => logs.filter((e) => e.status === s).length;

  return (
    <Layout title="SOS Incidents" breadcrumb="Emergency response">
      <PageHeader title="SOS incidents" subtitle="Active alerts appear at the top of every page. This is the full incident history." />
      <div className="grid-4 mb">
        <StatCard icon={AlertTriangle} tone="danger" label="Active" value={n("ACTIVE")} loading={loading} />
        <StatCard icon={Clock} tone="info" label="Dispatched" value={n("DISPATCHED")} loading={loading} />
        <StatCard icon={CheckCircle2} tone="success" label="Resolved" value={n("RESOLVED")} loading={loading} />
        <StatCard icon={Siren} tone="neutral" label="Cancelled (false alarm)" value={n("CANCELLED")} loading={loading} />
      </div>
      {loading ? <Spinner /> : (
        <Card flush>
          {logs.length === 0 ? <EmptyState icon={Siren} title="No incidents" text="No SOS alerts have been raised." /> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Incident</th><th>Resident</th><th>Flat</th><th>Status</th><th>Raised</th><th>Handled by</th><th>Resolved</th></tr></thead>
              <tbody>
                {logs.map((e) => (
                  <tr key={e._id}>
                    <td><strong>{EMERGENCY_EMOJI[e.type]} {nice(e.type)}</strong><div className="cell-sub">{e.description}</div></td>
                    <td>{e.residentId?.name || "—"}<div className="cell-sub">{e.phone}</div></td>
                    <td className="muted">{e.flatNumber}</td>
                    <td><StatusBadge value={e.status} /></td>
                    <td className="muted small">{fmtDateTime(e.createdAt)}</td>
                    <td className="muted">{e.handledBy?.name || "—"}</td>
                    <td className="muted small">{fmtDateTime(e.resolvedAt)}</td>
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
