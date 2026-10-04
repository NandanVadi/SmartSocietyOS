import { useState } from "react";
import { CalendarCheck, Clock, Users, Info } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, Field, Modal, PageHeader, Spinner, StatusBadge } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { useToast } from "../../context/ToastContext";
import { FACILITY_EMOJI, fmtDate, inr, todayISO } from "../../utils/format";

// hours between "HH:MM" strings
const hours = (a, b) => Math.max(0, (parseInt(b) * 60 + parseInt(b.slice(3)) - parseInt(a) * 60 - parseInt(a.slice(3))) / 60);

export default function ResidentFacilities() {
  const toast = useToast();
  const [fac, setFac] = useState(null);
  const [form, setForm] = useState({ date: "", startTime: "", endTime: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, loading, reload } = useLoad(async () => {
    const [f, b] = await Promise.all([API.get("/facilities"), API.get("/facilities/bookings/my")]);
    return { facilities: f.data.facilities || [], bookings: b.data.bookings || [] };
  }, { facilities: [], bookings: [] });

  const open = (f) => {
    const start = f.availableFrom || "06:00";
    const end = `${String(Math.min(23, parseInt(start) + 1)).padStart(2, "0")}:${start.slice(3)}`;
    setFac(f); setErr(""); setForm({ date: todayISO(), startTime: start, endTime: end });
  };

  const cost = fac ? hours(form.startTime, form.endTime) * (fac.pricePerHour || 0) : 0;

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      await API.post("/facilities/bookings", { facilityId: fac._id, ...form });
      toast.success("Booking requested — awaiting approval");
      setFac(null); reload();
    } catch (e2) { setErr(errMsg(e2, "Booking failed")); }
    finally { setBusy(false); }
  };


  return (
    <Layout title="Book Facility" breadcrumb="Resident · Facilities">
      <PageHeader title="Facilities" subtitle="Reserve the amenities in your society" />
      {loading ? <Spinner /> : (
        <>
          {data.facilities.length === 0 ? <Card className="mb"><EmptyState icon={CalendarCheck} title="No facilities available" text="Your society admin hasn't added any amenities yet." /></Card> : (
            <div className="grid-3 mb">
              {data.facilities.map((f) => (
                <Card key={f._id}>
                  <div className="facility-icon tone-primary" style={{ fontSize: 26 }}>{FACILITY_EMOJI[f.type] || "🏢"}</div>
                  <h3 style={{ fontSize: 16 }}>{f.name}</h3>
                  <p className="muted small" style={{ margin: "4px 0 14px", minHeight: 36 }}>{f.description || "—"}</p>
                  <div className="meta-row" style={{ marginBottom: 16 }}><span><Clock size={14} />{f.availableFrom}–{f.availableTo}</span><span><Users size={14} />Up to {f.capacity}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ fontSize: 17, color: f.pricePerHour ? "var(--text)" : "var(--success)" }}>{f.pricePerHour ? `${inr(f.pricePerHour)}/hr` : "Free"}</b>
                    <button className="btn btn-primary btn-sm" onClick={() => open(f)}>Book now</button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card title="My bookings" flush>
            {data.bookings.length === 0 ? <EmptyState icon={Clock} title="No bookings yet" /> : (
              <div className="table-wrap"><table>
                <thead><tr><th>Facility</th><th>Date</th><th>Time</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {data.bookings.map((b) => (
                    <tr key={b._id}>
                      <td><strong>{b.facilityId?.name}</strong></td>
                      <td className="muted">{fmtDate(b.date)}</td>
                      <td className="muted">{b.startTime} – {b.endTime}</td>
                      <td className="num">{b.totalAmount ? inr(b.totalAmount) : "Free"}</td>
                      <td><StatusBadge value={b.status} />{b.remarks && <div className="cell-sub">{b.remarks}</div>}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </Card>
        </>
      )}

      {fac && (
        <Modal title={`Book ${fac.name}`} onClose={() => setFac(null)}>
          {err && <div className="alert alert-error" role="alert">{err}</div>}
          <div className="alert alert-info"><Info size={16} style={{ flexShrink: 0, marginTop: 2 }} /><span>Open {fac.availableFrom}–{fac.availableTo} · {fac.pricePerHour ? `${inr(fac.pricePerHour)} per hour` : "free to use"}. Bookings need admin approval.</span></div>
          <form onSubmit={submit}>
            <Field label="Date" required><input className="form-input" type="date" min={todayISO()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></Field>
            <div className="form-row">
              <Field label="From" required><input className="form-input" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required /></Field>
              <Field label="To" required><input className="form-input" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required /></Field>
            </div>
            {fac.pricePerHour > 0 && <p className="muted" style={{ marginBottom: 16 }}>Estimated cost: <b style={{ color: "var(--text)" }}>{inr(cost)}</b></p>}
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setFac(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Requesting…" : "Request booking"}</button></div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
