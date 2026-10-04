import { useMemo, useState } from "react";
import { MessageSquare, Pencil } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, Field, Modal, PageHeader, Pills, SearchBox, Select, Spinner, StatCard, StatusBadge } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { useToast } from "../../context/ToastContext";
import { fmtDate, nice } from "../../utils/format";

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export default function AdminComplaints() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({ status: "", assignedTo: "", remarks: "" });
  const [busy, setBusy] = useState(false);

  // "/societies/members" is open to admins AND committee members (the per-id route is admin-only)
  const { data, loading, reload } = useLoad(async () => {
    const [c, m] = await Promise.all([API.get("/complaints"), API.get("/societies/members")]);
    return { complaints: c.data.complaints || [], staff: (m.data.users || []).filter((u) => u.role === "MAINTENANCE_STAFF") };
  }, { complaints: [], staff: [] });

  const list = useMemo(() => data.complaints.filter((c) =>
    `${c.title} ${c.residentId?.name || ""} ${c.residentId?.flatNumber || ""}`.toLowerCase().includes(q.toLowerCase()) && (status === "ALL" || c.status === status)), [data, q, status]);
  const count = (s) => data.complaints.filter((c) => c.status === s).length;

  const open = (c) => { setSel(c); setForm({ status: c.status, assignedTo: c.assignedTo?._id || "", remarks: c.remarks || "" }); };

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const body = { status: form.status, remarks: form.remarks };
      if (form.assignedTo) body.assignedTo = form.assignedTo;
      await API.put(`/complaints/${sel._id}`, body);
      toast.success("Complaint updated");
      setSel(null); reload();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <Layout title="Complaints" breadcrumb="Complaint management">
      <PageHeader title="Complaint management" subtitle="Review, assign and resolve resident complaints" />
      <div className="grid-4 mb">
        <StatCard icon={MessageSquare} tone="danger" label="Open" value={count("OPEN")} loading={loading} />
        <StatCard icon={MessageSquare} tone="warning" label="In progress" value={count("IN_PROGRESS")} loading={loading} />
        <StatCard icon={MessageSquare} tone="success" label="Resolved" value={count("RESOLVED")} loading={loading} />
        <StatCard icon={MessageSquare} tone="neutral" label="Total" value={data.complaints.length} loading={loading} />
      </div>
      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search title, resident or flat…" /></div>
      <Pills options={["ALL", ...STATUSES]} value={status} onChange={setStatus} />

      {loading ? <Spinner /> : (
        <Card flush>
          {list.length === 0 ? <EmptyState icon={MessageSquare} title="No complaints" text="Nothing matches the current filters." /> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Complaint</th><th>Resident</th><th>Category</th><th>Priority</th><th>Status</th><th>Assigned to</th><th>Filed</th><th /></tr></thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c._id}>
                    <td style={{ maxWidth: 280 }}><strong>{c.title}</strong><div className="cell-sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description}</div></td>
                    <td>{c.residentId?.name || "—"}<div className="cell-sub">Flat {c.residentId?.flatNumber || "—"}</div></td>
                    <td className="muted">{nice(c.category)}</td>
                    <td><StatusBadge value={c.priority} /></td>
                    <td><StatusBadge value={c.status} /></td>
                    <td className="muted">{c.assignedTo?.name || <span className="faint">Unassigned</span>}</td>
                    <td className="faint small">{fmtDate(c.createdAt)}</td>
                    <td><div className="row-actions"><button className="btn btn-secondary btn-sm" onClick={() => open(c)}><Pencil size={13} />Manage</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Card>
      )}

      {sel && (
        <Modal title="Manage complaint" onClose={() => setSel(null)}>
          <div className="card" style={{ background: "var(--surface-2)", marginBottom: 18, padding: 16 }}>
            <strong>{sel.title}</strong>
            <p className="muted small" style={{ marginTop: 4 }}>{sel.description}</p>
            <div className="small faint" style={{ marginTop: 8 }}>By {sel.residentId?.name} · Flat {sel.residentId?.flatNumber || "—"}</div>
          </div>
          <form onSubmit={save}>
            <Field label="Status"><Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUSES} /></Field>
            <Field label="Assign to maintenance staff" hint={data.staff.length ? "Assigning an open complaint moves it to In progress." : "No maintenance staff yet — add one from Members."}>
              <select className="form-select" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">{sel.assignedTo ? `Keep ${sel.assignedTo.name}` : "Unassigned"}</option>
                {data.staff.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Remarks"><textarea className="form-textarea" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Notes visible to the resident and staff…" /></Field>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSel(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
