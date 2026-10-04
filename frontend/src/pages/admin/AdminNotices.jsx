import { useState } from "react";
import { Bell, Plus, Pencil, Trash2 } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, Field, Modal, PageHeader, Pills, Select, Spinner, StatusBadge } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { useToast } from "../../context/ToastContext";
import { CATEGORY_BORDER, fmtDate } from "../../utils/format";

const CATS = ["GENERAL", "MAINTENANCE", "EVENT", "EMERGENCY", "RULE_CHANGE", "MEETING"];
const EMPTY = { title: "", content: "", category: "GENERAL", priority: "MEDIUM", expiresAt: "" };

// Used by Society Admin and Committee members
export default function AdminNotices() {
  const toast = useToast();
  const [cat, setCat] = useState("ALL");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const { data: notices, loading, reload } = useLoad(async () => (await API.get("/billing/notices")).data.notices || [], []);
  const list = notices.filter((n) => cat === "ALL" || n.category === cat);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openForm = (n) => {
    setForm(n ? { title: n.title, content: n.content, category: n.category, priority: n.priority, expiresAt: n.expiresAt ? n.expiresAt.slice(0, 10) : "" } : EMPTY);
    setModal({ notice: n });
  };

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (modal.notice) await API.put(`/billing/notices/${modal.notice._id}`, { ...form, expiresAt: form.expiresAt || null });
      else await API.post("/billing/notices", { ...form, expiresAt: form.expiresAt || undefined });
      toast.success(modal.notice ? "Notice updated" : "Notice published");
      setModal(null); reload();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  const remove = async (n) => {
    if (!(await toast.confirm({ title: "Remove notice?", message: `"${n.title}" will disappear from every resident's notice board.`, confirmText: "Remove", danger: true }))) return;
    try { await API.delete(`/billing/notices/${n._id}`); toast.success("Notice removed"); reload(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <Layout title="Notice Board" breadcrumb="Announcements">
      <PageHeader title="Notice board" subtitle="Publish and manage society announcements">
        <button className="btn btn-primary" onClick={() => openForm(null)}><Plus size={16} />Publish notice</button>
      </PageHeader>
      <Pills options={["ALL", ...CATS]} value={cat} onChange={setCat} />

      {loading ? <Spinner /> : list.length === 0 ? <Card><EmptyState icon={Bell} title="No notices" text="Published notices will appear here." /></Card> : (
        <div className="stack">
          {list.map((n) => (
            <Card key={n._id} className={`notice-card tone-border-${CATEGORY_BORDER[n.category] || "info"}`}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}><StatusBadge value={n.priority} /><StatusBadge value={n.category} plain /></div>
                  <h3 style={{ fontSize: 16, marginBottom: 6 }}>{n.title}</h3>
                  <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{n.content}</p>
                  <div className="faint small" style={{ marginTop: 12 }}>
                    Published {fmtDate(n.createdAt)} by {n.publishedBy?.name || "—"}{n.expiresAt && ` · Expires ${fmtDate(n.expiresAt)}`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openForm(n)}><Pencil size={13} />Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(n)}><Trash2 size={13} />Remove</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal.notice ? "Edit notice" : "Publish notice"} onClose={() => setModal(null)}>
          <form onSubmit={save}>
            <Field label="Title" required><input className="form-input" value={form.title} onChange={set("title")} required /></Field>
            <Field label="Content" required><textarea className="form-textarea" style={{ minHeight: 130 }} value={form.content} onChange={set("content")} required /></Field>
            <div className="form-row">
              <Field label="Category"><Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATS} /></Field>
              <Field label="Priority"><Select value={form.priority} onChange={(v) => setForm({ ...form, priority: v })} options={["LOW", "MEDIUM", "HIGH", "URGENT"]} /></Field>
            </div>
            <Field label="Expiry date (optional)" hint="The notice is hidden automatically after this date."><input className="form-input" type="date" value={form.expiresAt} onChange={set("expiresAt")} /></Field>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : modal.notice ? "Save changes" : "Publish"}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
