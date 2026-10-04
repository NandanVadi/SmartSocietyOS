import { useMemo, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import Layout from "../../components/Layout";
import { Avatar, Badge, Card, EmptyState, Field, Modal, PageHeader, SearchBox, Select, Spinner } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { fmtDate, ROLE_LABELS, ROLE_TONE } from "../../utils/format";

const CREATABLE = ["RESIDENT", "COMMITTEE_MEMBER", "SECURITY_GUARD", "MAINTENANCE_STAFF"];
const EMPTY = { name: "", email: "", password: "", phone: "", flatNumber: "", role: "RESIDENT" };

export default function AdminResidents() {
  const { user } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const canAdd = user.role === "SOCIETY_ADMIN";

  const { data: users, loading, reload } = useLoad(async () => (await API.get("/societies/members")).data.users || [], []);

  const list = useMemo(() => users.filter((u) =>
    `${u.name} ${u.email} ${u.flatNumber || ""}`.toLowerCase().includes(q.toLowerCase()) && (role === "ALL" || u.role === role)), [users, q, role]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await API.post("/auth/users", form);
      toast.success(`${ROLE_LABELS[form.role]} account created`);
      setOpen(false); setForm(EMPTY); reload();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <Layout title="Members" breadcrumb="Society Admin · Members">
      <PageHeader title="Society members" subtitle={`${users.length} people in your society`}>
        {canAdd && <button className="btn btn-primary" onClick={() => setOpen(true)}><UserPlus size={16} />Add member</button>}
      </PageHeader>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email or flat…" />
        <Select value={role} onChange={setRole} options={[{ value: "ALL", label: "All roles" }, ...Object.entries(ROLE_LABELS).filter(([r]) => r !== "SUPER_ADMIN").map(([value, label]) => ({ value, label }))]} />
      </div>

      {loading ? <Spinner /> : (
        <Card flush>
          {list.length === 0 ? <EmptyState icon={Users} title="No members found" /> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Member</th><th>Role</th><th>Flat</th><th>Phone</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u._id}>
                    <td><div className="cell-user"><Avatar name={u.name} size="sm" /><div><strong>{u.name}</strong><div className="cell-sub">{u.email}</div></div></div></td>
                    <td><Badge tone={ROLE_TONE[u.role]} plain>{ROLE_LABELS[u.role]}</Badge></td>
                    <td className="muted">{u.flatNumber || "—"}</td>
                    <td className="muted small">{u.phone || "—"}</td>
                    <td><Badge tone={u.isActive ? "success" : "neutral"}>{u.isActive ? "Active" : "Disabled"}</Badge></td>
                    <td className="faint small">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Card>
      )}

      {open && (
        <Modal title="Add society member" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <Field label="Role" required><Select value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={CREATABLE.map((value) => ({ value, label: ROLE_LABELS[value] }))} /></Field>
            <div className="form-row">
              <Field label="Full name" required><input className="form-input" value={form.name} onChange={set("name")} required /></Field>
              <Field label="Phone"><input className="form-input" value={form.phone} onChange={set("phone")} /></Field>
            </div>
            <div className="form-row">
              <Field label="Email" required><input className="form-input" type="email" value={form.email} onChange={set("email")} required /></Field>
              <Field label="Flat number"><input className="form-input" value={form.flatNumber} onChange={set("flatNumber")} placeholder="B-204" /></Field>
            </div>
            <Field label="Temporary password" required hint="They can change it from their profile after signing in.">
              <input className="form-input" type="password" minLength={6} value={form.password} onChange={set("password")} required />
            </Field>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? "Creating…" : "Create account"}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
