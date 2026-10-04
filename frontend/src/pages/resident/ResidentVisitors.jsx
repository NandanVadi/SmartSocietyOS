import { useState } from "react";
import { QrCode, Plus, Download, UserPlus } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, Field, Modal, PageHeader, Spinner, StatusBadge } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { useToast } from "../../context/ToastContext";
import { fmtDate, fmtTime } from "../../utils/format";

const EMPTY = { name: "", phone: "", purpose: "", vehicleNumber: "" };

export default function ResidentVisitors() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const { data: visitors, loading, reload } = useLoad(async () => (await API.get("/visitors/my")).data.visitors || [], []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const { data } = await API.post("/visitors", form);
      toast.success("Visitor registered — share the QR code at the gate");
      setOpen(false); setForm(EMPTY); setQr(data.visitor); reload();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <Layout title="My Visitors" breadcrumb="Resident · Visitors">
      <PageHeader title="Visitor pass" subtitle="Pre-register guests so they can enter quickly with a QR code">
        <button className="btn btn-primary" onClick={() => setOpen(true)}><UserPlus size={16} />Invite visitor</button>
      </PageHeader>

      {loading ? <Spinner /> : (
        <Card flush>
          {visitors.length === 0 ? <EmptyState icon={QrCode} title="No visitors yet" text="Invite a guest to generate their entry QR code." action={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Invite visitor</button>} /> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Visitor</th><th>Purpose</th><th>Vehicle</th><th>Status</th><th>Invited</th><th>Entry</th><th /></tr></thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v._id}>
                    <td><strong>{v.name}</strong><div className="cell-sub">{v.phone}</div></td>
                    <td className="muted">{v.purpose}</td>
                    <td className="muted">{v.vehicleNumber || "—"}</td>
                    <td><StatusBadge value={v.status} /></td>
                    <td className="faint small">{fmtDate(v.createdAt)}</td>
                    <td className="muted small">{v.checkInTime ? fmtTime(v.checkInTime) : "—"}</td>
                    <td><div className="row-actions">{v.qrCodeImage && v.status === "APPROVED" && <button className="btn btn-secondary btn-sm" onClick={() => setQr(v)}><QrCode size={14} />Show QR</button>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Card>
      )}

      {open && (
        <Modal title="Invite a visitor" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="form-row">
              <Field label="Visitor name" required><input className="form-input" value={form.name} onChange={set("name")} required /></Field>
              <Field label="Phone" required><input className="form-input" type="tel" value={form.phone} onChange={set("phone")} placeholder="+91…" required /></Field>
            </div>
            <Field label="Purpose of visit" required><input className="form-input" value={form.purpose} onChange={set("purpose")} placeholder="Family visit, delivery, repair…" required /></Field>
            <Field label="Vehicle number (optional)"><input className="form-input" value={form.vehicleNumber} onChange={set("vehicleNumber")} placeholder="MH 01 AB 1234" /></Field>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Generating…" : "Generate QR pass"}</button></div>
          </form>
        </Modal>
      )}

      {qr && (
        <Modal title="Visitor QR pass" size="sm" onClose={() => setQr(null)}>
          <div style={{ textAlign: "center" }}>
            <p className="muted" style={{ marginBottom: 16 }}>Share this code with <b style={{ color: "var(--text)" }}>{qr.name}</b>. The guard scans it at the gate.</p>
            <div className="qr-box"><img src={qr.qrCodeImage} alt={`QR code for ${qr.name}`} /></div>
            <div className="kv" style={{ margin: "18px 0", textAlign: "left" }}>
              <div><small>Purpose</small><span>{qr.purpose}</span></div>
              <div><small>Phone</small><span>{qr.phone}</span></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <a className="btn btn-secondary btn-full" href={qr.qrCodeImage} download={`visitor-${qr.name.replace(/\s+/g, "-")}.png`}><Download size={15} />Save image</a>
              <button className="btn btn-primary btn-full" onClick={() => setQr(null)}>Done</button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
