import { useState } from "react";
import { MessageSquare, Plus, User } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, Field, Modal, PageHeader, Pills, Select, Spinner, StatusBadge } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { useToast } from "../../context/ToastContext";
import { fmtDate, nice } from "../../utils/format";

const CATEGORIES = ["PLUMBING", "ELECTRICAL", "CLEANING", "SECURITY", "NOISE", "PARKING", "OTHER"];
const EMPTY = { title: "", description: "", category: "OTHER", priority: "MEDIUM" };

export default function ResidentComplaints() {
  const toast = useToast();
  const [status, setStatus] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState(null);
  const { data: items, loading, reload } = useLoad(async () => (await API.get("/complaints/my")).data.complaints || [], []);
  const list = items.filter((c) => status === "ALL" || c.status === status);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await API.post("/complaints", form);
      toast.success("Complaint submitted");
      setOpen(false); setForm(EMPTY); reload();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <Layout title="My Complaints" breadcrumb="Resident · Complaints">
      <PageHeader title="Complaints" subtitle="Raise an issue and follow it until it's resolved">
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} />New complaint</button>
      </PageHeader>
      <Pills options={["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]} value={status} onChange={setStatus} />
      {loading ? <Spinner /> : list.length === 0 ? (
        <Card><EmptyState icon={MessageSquare} title="No complaints" text="Something wrong in the society? Let the management know." action={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Raise a complaint</button>} /></Card>
      ) : (
        <div className="grid-2">
          {list.map((c) => (
            <Card key={c._id} className="hover" onClick={() => setDetail(c)}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><StatusBadge value={c.status} /><StatusBadge value={c.priority} plain /></div>
                <span className="faint small">{fmtDate(c.createdAt)}</span>
              </div>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>{c.title}</h3>
              <p className="muted small" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</p>
              <div className="meta-row" style={{ marginTop: 12 }}>
                <span>{nice(c.category)}</span>
                <span><User size={13} />{c.assignedTo?.name || "Not assigned yet"}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {detail && (
        <Modal title="Complaint details" onClose={() => setDetail(null)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><StatusBadge value={detail.status} /><StatusBadge value={detail.priority} plain /></div>
          <h3 style={{ marginBottom: 6 }}>{detail.title}</h3>
          <p className="muted" style={{ marginBottom: 18, whiteSpace: "pre-wrap" }}>{detail.description}</p>
          <div className="kv">
            <div><small>Category</small><span>{nice(detail.category)}</span></div>
            <div><small>Filed on</small><span>{fmtDate(detail.createdAt)}</span></div>
            <div><small>Assigned to</small><span>{detail.assignedTo?.name || "—"}</span></div>
            <div><small>Resolved on</small><span>{fmtDate(detail.resolvedAt)}</span></div>
          </div>
          {detail.remarks && <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 0 }}><span><b>Management remarks:</b> {detail.remarks}</span></div>}
        </Modal>
      )}

      {open && (
        <Modal title="New complaint" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <Field label="Title" required><input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Water leakage in corridor" required /></Field>
            <Field label="Description" required><textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue and where it is…" required /></Field>
            <div className="form-row">
              <Field label="Category"><Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES} /></Field>
              <Field label="Priority"><Select value={form.priority} onChange={(v) => setForm({ ...form, priority: v })} options={["LOW", "MEDIUM", "HIGH", "URGENT"]} /></Field>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Submitting…" : "Submit complaint"}</button></div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
