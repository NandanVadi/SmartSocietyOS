import { useState } from "react";
import { Wrench, CheckCircle2, Clock, ClipboardList, Home, Play } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, Field, Modal, PageHeader, Pills, Spinner, StatCard, StatusBadge } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useLoad } from "../../utils/hooks";
import { useToast } from "../../context/ToastContext";
import { fmtDate, nice, timeAgo } from "../../utils/format";

// view="orders" is the "Work orders" page, default is the overview dashboard (same data, different emphasis)
export default function MaintenanceDashboard({ view }) {
  const { user } = useAuth();
  const toast = useToast();
  const [filter, setFilter] = useState("ACTIVE");
  const [sel, setSel] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: items, loading, reload } = useLoad(async () => (await API.get("/complaints/assigned")).data.complaints || [], []);

  const n = (s) => items.filter((c) => c.status === s).length;
  const list = items.filter((c) => filter === "ALL" ? true : filter === "ACTIVE" ? ["OPEN", "IN_PROGRESS"].includes(c.status) : c.status === filter);

  const update = async (c, status, note) => {
    setBusy(true);
    try {
      const body = { status };
      if (note !== undefined) body.remarks = note;
      await API.put(`/complaints/${c._id}`, body);
      toast.success(status === "RESOLVED" ? "Marked as resolved" : "Work started");
      setSel(null); reload();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  const orders = (
    <div className="stack">
      {list.length === 0 ? <Card><EmptyState icon={Wrench} title="No work orders" text={filter === "ACTIVE" ? "You have nothing pending. Great job!" : "Nothing in this view."} /></Card> :
        list.map((c) => (
          <Card key={c._id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}><StatusBadge value={c.status} /><StatusBadge value={c.priority} plain /><span className="badge plain tone-neutral">{nice(c.category)}</span></div>
                <h3 style={{ fontSize: 16, marginBottom: 6 }}>{c.title}</h3>
                <p className="muted">{c.description}</p>
                <div className="meta-row" style={{ marginTop: 12 }}>
                  <span><Home size={14} />{c.residentId?.name} · Flat {c.residentId?.flatNumber || "—"}</span>
                  <span><Clock size={14} />{timeAgo(c.createdAt)}</span>
                </div>
                {c.remarks && <div className="alert alert-info" style={{ marginTop: 12, marginBottom: 0 }}>{c.remarks}</div>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 150 }}>
                {c.status === "OPEN" && <button className="btn btn-secondary" onClick={() => update(c, "IN_PROGRESS")} disabled={busy}><Play size={14} />Start work</button>}
                {(c.status === "OPEN" || c.status === "IN_PROGRESS") && <button className="btn btn-primary" onClick={() => { setSel(c); setRemarks(c.remarks || ""); }}><CheckCircle2 size={14} />Complete</button>}
                {c.status === "RESOLVED" && <span className="faint small">Resolved {fmtDate(c.resolvedAt)}</span>}
              </div>
            </div>
          </Card>
        ))}
    </div>
  );

  return (
    <Layout title={view === "orders" ? "Work Orders" : "Maintenance Dashboard"} breadcrumb="Maintenance staff">
      {view !== "orders" && (
        <div className="hero"><div><h2>Hello, {user?.name?.split(" ")[0]} 🔧</h2><p>Your assigned complaints and work orders for {user?.societyName}.</p></div></div>
      )}
      {view === "orders" && <PageHeader title="Work orders" subtitle="Complaints assigned to you" />}
      <div className="grid-4 mb">
        <StatCard icon={ClipboardList} tone="primary" label="Assigned to me" value={items.length} loading={loading} />
        <StatCard icon={Wrench} tone="danger" label="Not started" value={n("OPEN")} loading={loading} />
        <StatCard icon={Clock} tone="warning" label="In progress" value={n("IN_PROGRESS")} loading={loading} />
        <StatCard icon={CheckCircle2} tone="success" label="Resolved" value={n("RESOLVED")} loading={loading} />
      </div>
      <Pills options={[{ id: "ACTIVE", label: "Active" }, { id: "RESOLVED", label: "Resolved" }, { id: "ALL", label: "All" }]} value={filter} onChange={setFilter} />
      {loading ? <Spinner /> : orders}

      {sel && (
        <Modal title="Complete work order" onClose={() => setSel(null)} size="sm">
          <p className="muted" style={{ marginBottom: 14 }}><b style={{ color: "var(--text)" }}>{sel.title}</b></p>
          <Field label="Resolution notes" hint="Visible to the resident and management."><textarea className="form-textarea" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="What was done?" /></Field>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setSel(null)}>Cancel</button><button className="btn btn-primary" disabled={busy} onClick={() => update(sel, "RESOLVED", remarks)}>Mark resolved</button></div>
        </Modal>
      )}
    </Layout>
  );
}
