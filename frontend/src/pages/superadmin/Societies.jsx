import { useMemo, useState } from "react";
import { Building2, Plus, Pencil, UserCog, Power } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, Field, Modal, PageHeader, SearchBox, Spinner, StatusBadge, Tabs } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { useToast } from "../../context/ToastContext";
import { fmtDate } from "../../utils/format";

const EMPTY = { name: "", address: "", city: "", state: "", pincode: "", totalFlats: 0 };
const EMPTY_ADMIN = { name: "", email: "", password: "", phone: "" };

export default function Societies() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(null); // {type:'society'|'admin', society?}
  const [form, setForm] = useState(EMPTY);
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN);
  const [adminTab, setAdminTab] = useState("new");
  const [existingId, setExistingId] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, loading, reload } = useLoad(async () => {
    const [s, u] = await Promise.all([API.get("/societies"), API.get("/societies/users/all")]);
    return { societies: s.data.societies || [], users: u.data.users || [] };
  }, { societies: [], users: [] });

  const list = useMemo(() => data.societies.filter((s) => `${s.name} ${s.city} ${s.state}`.toLowerCase().includes(q.toLowerCase())), [data, q]);

  const openCreate = () => { setForm(EMPTY); setModal({ type: "society" }); };
  const openEdit = (s) => { setForm({ name: s.name, address: s.address, city: s.city, state: s.state, pincode: s.pincode, totalFlats: s.totalFlats }); setModal({ type: "society", society: s }); };
  const openAdmin = (s) => { setAdminForm(EMPTY_ADMIN); setAdminTab("new"); setExistingId(""); setModal({ type: "admin", society: s }); };

  const run = async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); toast.success(okMsg); setModal(null); reload(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  const saveSociety = (e) => {
    e.preventDefault();
    const body = { ...form, totalFlats: Number(form.totalFlats) || 0 };
    run(() => modal.society ? API.put(`/societies/${modal.society._id}`, body) : API.post("/societies", body),
      modal.society ? "Society updated" : "Society created");
  };

  const saveAdmin = (e) => {
    e.preventDefault();
    if (adminTab === "new") {
      run(() => API.post("/auth/users", { ...adminForm, role: "SOCIETY_ADMIN", societyId: modal.society._id }), "Society admin created");
    } else {
      if (!existingId) return toast.error("Choose a user");
      run(() => API.post(`/societies/${modal.society._id}/assign-admin`, { userId: existingId }), "Admin assigned");
    }
  };

  const toggleActive = async (s) => {
    const next = !s.isActive;
    const ok = await toast.confirm({
      title: next ? "Activate society?" : "Deactivate society?",
      message: next ? `${s.name} will appear on the registration page again.` : `${s.name} will no longer be selectable when new residents register.`,
      confirmText: next ? "Activate" : "Deactivate", danger: !next,
    });
    if (ok) run(() => API.put(`/societies/${s._id}`, { isActive: next }), next ? "Society activated" : "Society deactivated");
  };

  const candidates = (soc) => data.users.filter((u) => u.role !== "SUPER_ADMIN" && u.role !== "SOCIETY_ADMIN" && (u.societyId?._id === soc?._id));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setA = (k) => (e) => setAdminForm({ ...adminForm, [k]: e.target.value });

  return (
    <Layout title="Societies" breadcrumb="Super Admin · Societies">
      <PageHeader title="Societies" subtitle={`${data.societies.length} communities on the platform`}>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />Add society</button>
      </PageHeader>
      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search by name, city or state…" /></div>

      {loading ? <Spinner /> : (
        <Card flush>
          {list.length === 0 ? <EmptyState icon={Building2} title="No societies found" text="Try a different search or add a new society." /> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Society</th><th>Location</th><th>Flats</th><th>Members</th><th>Administrator</th><th>Status</th><th>Added</th><th /></tr></thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s._id}>
                    <td><strong>{s.name}</strong><div className="cell-sub">{s.address}</div></td>
                    <td className="muted">{s.city}, {s.state}<div className="cell-sub">{s.pincode}</div></td>
                    <td className="num">{s.totalFlats}</td>
                    <td className="num">{data.users.filter((u) => u.societyId?._id === s._id).length}</td>
                    <td>{s.adminId ? <><strong style={{ fontWeight: 600 }}>{s.adminId.name}</strong><div className="cell-sub">{s.adminId.email}</div></> : <span className="faint">Unassigned</span>}</td>
                    <td><StatusBadge value={s.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                    <td className="faint small">{fmtDate(s.createdAt)}</td>
                    <td><div className="row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openAdmin(s)}><UserCog size={14} />Admin</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)} aria-label="Edit"><Pencil size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(s)} aria-label="Toggle status" title={s.isActive ? "Deactivate" : "Activate"}><Power size={14} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Card>
      )}

      {modal?.type === "society" && (
        <Modal title={modal.society ? "Edit society" : "Add society"} onClose={() => setModal(null)}>
          <form onSubmit={saveSociety}>
            <Field label="Society name" required><input className="form-input" value={form.name} onChange={set("name")} placeholder="Green Valley Residences" required /></Field>
            <Field label="Address" required><input className="form-input" value={form.address} onChange={set("address")} required /></Field>
            <div className="form-row three">
              <Field label="City" required><input className="form-input" value={form.city} onChange={set("city")} required /></Field>
              <Field label="State" required><input className="form-input" value={form.state} onChange={set("state")} required /></Field>
              <Field label="Pincode" required><input className="form-input" value={form.pincode} onChange={set("pincode")} required /></Field>
            </div>
            <Field label="Total flats"><input className="form-input" type="number" min={0} value={form.totalFlats} onChange={set("totalFlats")} /></Field>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : modal.society ? "Save changes" : "Create society"}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === "admin" && (
        <Modal title={`Administrator · ${modal.society.name}`} onClose={() => setModal(null)}>
          <Tabs value={adminTab} onChange={setAdminTab} tabs={[{ id: "new", label: "Create new admin" }, { id: "existing", label: "Promote existing member" }]} />
          <form onSubmit={saveAdmin}>
            {adminTab === "new" ? (
              <>
                <div className="form-row">
                  <Field label="Full name" required><input className="form-input" value={adminForm.name} onChange={setA("name")} required /></Field>
                  <Field label="Phone"><input className="form-input" value={adminForm.phone} onChange={setA("phone")} /></Field>
                </div>
                <Field label="Email" required><input className="form-input" type="email" value={adminForm.email} onChange={setA("email")} required /></Field>
                <Field label="Temporary password" required hint="Minimum 6 characters. Ask the admin to change it after first login."><input className="form-input" type="password" minLength={6} value={adminForm.password} onChange={setA("password")} required /></Field>
              </>
            ) : (
              <Field label="Member of this society" hint="The selected member becomes the society admin.">
                <select className="form-select" value={existingId} onChange={(e) => setExistingId(e.target.value)} required>
                  <option value="">Select a member…</option>
                  {candidates(modal.society).map((u) => <option key={u._id} value={u._id}>{u.name} · {u.email}</option>)}
                </select>
              </Field>
            )}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : adminTab === "new" ? "Create admin" : "Assign admin"}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
