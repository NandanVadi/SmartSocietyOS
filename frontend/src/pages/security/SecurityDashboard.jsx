import { useMemo, useState } from "react";
import { Shield, LogIn, LogOut, CheckCircle2, QrCode, Siren } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { Card, EmptyState, SearchBox, Spinner, StatCard, StatusBadge } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useLoad, usePolling } from "../../utils/hooks";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fmtTime } from "../../utils/format";

// Live gate console: SOS banners (with siren) are rendered globally by <Layout/>.
export default function SecurityDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState("");
  const { data: visitors, loading, reload } = useLoad(async () => (await API.get("/visitors/today")).data.visitors || [], []);
  usePolling(reload, 10000);

  const n = (s) => visitors.filter((v) => v.status === s).length;
  const list = useMemo(() => visitors.filter((v) => `${v.name} ${v.residentId?.name || ""} ${v.residentId?.flatNumber || ""}`.toLowerCase().includes(q.toLowerCase())), [visitors, q]);

  const checkout = async (v) => {
    try { await API.put(`/visitors/${v._id}/checkout`); toast.success(`${v.name} checked out`); reload(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <Layout title="Security Dashboard" breadcrumb="Security guard portal">
      <div className="hero">
        <div><h2>Gate control · {user?.name?.split(" ")[0]}</h2><p>Verify visitor passes, monitor who is inside and respond to resident SOS alerts.</p></div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={() => navigate("/security/verify")}><QrCode size={16} />Verify QR</button>
          <button className="btn btn-secondary" onClick={() => navigate("/security/emergencies")}><Siren size={16} />SOS history</button>
        </div>
      </div>
      <div className="grid-4 mb">
        <StatCard icon={Shield} tone="primary" label="Visitors today" value={visitors.length} loading={loading} />
        <StatCard icon={CheckCircle2} tone="warning" label="Expected (pre-approved)" value={n("APPROVED")} loading={loading} />
        <StatCard icon={LogIn} tone="teal" label="Currently inside" value={n("CHECKED_IN")} loading={loading} />
        <StatCard icon={LogOut} tone="neutral" label="Checked out" value={n("CHECKED_OUT")} loading={loading} />
      </div>

      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search visitor, resident or flat…" /></div>
      {loading ? <Spinner /> : (
        <Card title="Today's visitors" subtitle="Refreshes automatically" flush>
          {list.length === 0 ? <EmptyState icon={Shield} title="No visitors today" /> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Visitor</th><th>Purpose</th><th>Visiting</th><th>Status</th><th>In</th><th>Out</th><th /></tr></thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v._id}>
                    <td><strong>{v.name}</strong><div className="cell-sub">{v.phone}{v.vehicleNumber && ` · 🚗 ${v.vehicleNumber}`}</div></td>
                    <td className="muted">{v.purpose}</td>
                    <td>{v.residentId?.name || "—"}<div className="cell-sub">Flat {v.residentId?.flatNumber || "—"}</div></td>
                    <td><StatusBadge value={v.status} /></td>
                    <td className="muted small">{fmtTime(v.checkInTime)}</td>
                    <td className="muted small">{fmtTime(v.checkOutTime)}</td>
                    <td><div className="row-actions">{v.status === "CHECKED_IN" && <button className="btn btn-secondary btn-sm" onClick={() => checkout(v)}><LogOut size={13} />Check out</button>}</div></td>
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
