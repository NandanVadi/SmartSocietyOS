import { useMemo, useState } from "react";
import { FileText, Plus, IndianRupee, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import Layout from "../../components/Layout";
import { BarChart, Card, DonutChart, EmptyState, Field, Modal, PageHeader, Pills, SearchBox, Select, Spinner, StatCard, StatusBadge } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { useToast } from "../../context/ToastContext";
import { fmtDate, inr, nice, sortMonths } from "../../utils/format";

const TYPES = ["MAINTENANCE", "PARKING", "FACILITY", "PENALTY", "OTHER"];
const blank = () => ({ target: "one", residentId: "", type: "MAINTENANCE", amount: "", dueDate: "", month: new Date().toISOString().slice(0, 7), description: "" });

export default function AdminBilling() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank());
  const [busy, setBusy] = useState(false);

  const { data, loading, reload } = useLoad(async () => {
    const [b, m, s] = await Promise.all([API.get("/billing/bills/all"), API.get("/societies/members"), API.get("/billing/bills/stats")]);
    return { bills: b.data.bills || [], residents: (m.data.users || []).filter((u) => u.role === "RESIDENT"), stats: s.data };
  }, { bills: [], residents: [], stats: { stats: [], monthly: [], totalRevenue: 0 } });

  const st = (s) => data.stats.stats.find((x) => x._id === s) || { count: 0, totalAmount: 0 };
  const list = useMemo(() => data.bills.filter((b) =>
    `${b.residentId?.name || ""} ${b.residentId?.flatNumber || ""} ${b.description || ""}`.toLowerCase().includes(q.toLowerCase()) && (status === "ALL" || b.status === status)), [data.bills, q, status]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    const { target, residentId, ...rest } = form;
    const body = { ...rest, amount: Number(rest.amount) };
    try {
      if (target === "all") {
        if (!data.residents.length) throw new Error("No residents to bill");
        const res = await API.post("/billing/bills/bulk", { ...body, residentIds: data.residents.map((r) => r._id) });
        toast.success(res.data.message);
      } else {
        await API.post("/billing/bills", { ...body, residentId });
        toast.success("Bill created");
      }
      setOpen(false); reload();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  const donut = [
    { label: "Paid", value: st("PAID").count, color: "#10b981" },
    { label: "Pending", value: st("PENDING").count, color: "#f59e0b" },
    { label: "Overdue", value: st("OVERDUE").count, color: "#ef4444" },
  ];
  const monthly = sortMonths(data.stats.monthly).slice(-6);

  return (
    <Layout title="Billing" breadcrumb="Society Admin · Billing">
      <PageHeader title="Billing & collections" subtitle="Raise maintenance bills and track payments">
        <button className="btn btn-primary" onClick={() => { setForm(blank()); setOpen(true); }}><Plus size={16} />Create bill</button>
      </PageHeader>

      <div className="grid-4 mb">
        <StatCard icon={CheckCircle2} tone="success" label="Collected" value={inr(data.stats.totalRevenue)} hint={`${st("PAID").count} paid bills`} loading={loading} />
        <StatCard icon={Clock} tone="warning" label="Pending" value={inr(st("PENDING").totalAmount)} hint={`${st("PENDING").count} bills`} loading={loading} />
        <StatCard icon={AlertCircle} tone="danger" label="Overdue" value={inr(st("OVERDUE").totalAmount)} hint={`${st("OVERDUE").count} bills`} loading={loading} />
        <StatCard icon={IndianRupee} tone="primary" label="Total billed" value={inr(st("PAID").totalAmount + st("PENDING").totalAmount + st("OVERDUE").totalAmount)} loading={loading} />
      </div>

      {data.bills.length > 0 && (
        <div className="grid-main mb">
          <Card title="Billed vs collected" subtitle="By billing month">
            <BarChart data={monthly.map((m) => ({ label: m._id, values: [m.billed, m.collected] }))} series={[{ name: "Billed", color: "#a5b4fc" }, { name: "Collected", color: "#4f46e5" }]} format={inr} />
          </Card>
          <Card title="Bill status"><DonutChart data={donut} size={150} thickness={20} centerLabel="bills" /></Card>
        </div>
      )}

      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search resident, flat or description…" /></div>
      <Pills options={["ALL", "PENDING", "OVERDUE", "PAID"]} value={status} onChange={setStatus} />

      {loading ? <Spinner /> : (
        <Card flush>
          {list.length === 0 ? <EmptyState icon={FileText} title="No bills" text="Create a bill to get started." /> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Resident</th><th>Type</th><th>Month</th><th>Amount</th><th>Due</th><th>Status</th><th>Paid on</th></tr></thead>
              <tbody>
                {list.map((b) => (
                  <tr key={b._id}>
                    <td><strong>{b.residentId?.name || "—"}</strong><div className="cell-sub">Flat {b.residentId?.flatNumber || "—"}</div></td>
                    <td>{nice(b.type)}{b.description && <div className="cell-sub">{b.description}</div>}</td>
                    <td className="muted">{b.month || "—"}</td>
                    <td className="num">{inr(b.amount)}</td>
                    <td className="small" style={{ color: b.status === "OVERDUE" ? "var(--danger)" : "var(--text-2)" }}>{fmtDate(b.dueDate)}</td>
                    <td><StatusBadge value={b.status} /></td>
                    <td className="faint small">{b.paidAt ? fmtDate(b.paidAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Card>
      )}

      {open && (
        <Modal title="Create bill" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <Field label="Bill to">
              <div className="tabs" style={{ marginBottom: 0 }}>
                <button type="button" className={`tab ${form.target === "one" ? "active" : ""}`} onClick={() => setForm({ ...form, target: "one" })}>One resident</button>
                <button type="button" className={`tab ${form.target === "all" ? "active" : ""}`} onClick={() => setForm({ ...form, target: "all" })}>All residents ({data.residents.length})</button>
              </div>
            </Field>
            {form.target === "one" && (
              <Field label="Resident" required>
                <select className="form-select" value={form.residentId} onChange={set("residentId")} required>
                  <option value="">Select resident…</option>
                  {data.residents.map((r) => <option key={r._id} value={r._id}>{r.name} · {r.flatNumber || "no flat"}</option>)}
                </select>
              </Field>
            )}
            <div className="form-row">
              <Field label="Type"><Select value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={TYPES} /></Field>
              <Field label="Amount (₹)" required><input className="form-input" type="number" min={1} value={form.amount} onChange={set("amount")} required /></Field>
            </div>
            <div className="form-row">
              <Field label="Due date" required><input className="form-input" type="date" value={form.dueDate} onChange={set("dueDate")} required /></Field>
              <Field label="Billing month"><input className="form-input" type="month" value={form.month} onChange={set("month")} /></Field>
            </div>
            <Field label="Description"><input className="form-input" value={form.description} onChange={set("description")} placeholder="Monthly maintenance charge" /></Field>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? "Creating…" : form.target === "all" ? "Bill everyone" : "Create bill"}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
