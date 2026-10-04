import { useState } from "react";
import { Building2, CalendarCheck, Plus, Pencil, Trash2, Clock, Users, IndianRupee } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, Field, Modal, PageHeader, Select, Spinner, StatusBadge, Tabs } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { FACILITY_EMOJI, FACILITY_TYPES, fmtDate, inr } from "../../utils/format";

const EMPTY = { name: "", description: "", type: "OTHER", capacity: 10, pricePerHour: 0, availableFrom: "06:00", availableTo: "22:00" };

// Admins manage facilities & approve bookings. Committee members get the same screen read-only (backend enforces this too).
export default function AdminFacilities() {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user.role === "SOCIETY_ADMIN";
  const [tab, setTab] = useState(canManage ? "facilities" : "bookings");
  const [modal, setModal] = useState(null); // null | {facility?}
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const { data, loading, reload } = useLoad(async () => {
    const [f, b] = await Promise.all([API.get("/facilities"), API.get("/facilities/bookings/all")]);
    return { facilities: f.data.facilities || [], bookings: b.data.bookings || [] };
  }, { facilities: [], bookings: [] });

  const pending = data.bookings.filter((b) => b.status === "PENDING").length;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const openForm = (f) => {
    setForm(f ? { name: f.name, description: f.description || "", type: f.type, capacity: f.capacity, pricePerHour: f.pricePerHour, availableFrom: f.availableFrom, availableTo: f.availableTo } : EMPTY);
    setModal({ facility: f });
  };

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    const body = { ...form, capacity: Number(form.capacity), pricePerHour: Number(form.pricePerHour) };
    try {
      if (modal.facility) await API.put(`/facilities/${modal.facility._id}`, body); else await API.post("/facilities", body);
      toast.success(modal.facility ? "Facility updated" : "Facility added");
      setModal(null); reload();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  const remove = async (f) => {
    if (!(await toast.confirm({ title: "Deactivate facility?", message: `${f.name} will no longer be bookable. Existing bookings are kept.`, confirmText: "Deactivate", danger: true }))) return;
    try { await API.delete(`/facilities/${f._id}`); toast.success("Facility deactivated"); reload(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  const decide = async (id, status) => {
    try { await API.put(`/facilities/bookings/${id}`, { status }); toast.success(`Booking ${status.toLowerCase()}`); reload(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <Layout title={canManage ? "Facilities" : "Bookings"} breadcrumb={canManage ? "Society Admin · Facilities" : "Committee · Bookings"}>
      <PageHeader title={canManage ? "Facilities & bookings" : "Facility bookings"} subtitle={canManage ? "Manage amenities and approve resident booking requests" : "Read-only overview of facilities and bookings"}>
        {canManage && <button className="btn btn-primary" onClick={() => openForm(null)}><Plus size={16} />Add facility</button>}
      </PageHeader>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "facilities", label: "Facilities", count: data.facilities.length },
        { id: "bookings", label: "Bookings", count: pending ? `${pending} pending` : data.bookings.length },
      ]} />

      {loading ? <Spinner /> : tab === "facilities" ? (
        data.facilities.length === 0 ? <Card><EmptyState icon={Building2} title="No facilities yet" text={canManage ? "Add a gym, pool or clubhouse to let residents book it." : "The admin hasn't added any facilities."} /></Card> : (
          <div className="grid-3">
            {data.facilities.map((f) => (
              <Card key={f._id}>
                <div className="facility-icon tone-primary" style={{ fontSize: 26 }}>{FACILITY_EMOJI[f.type] || "🏢"}</div>
                <h3 style={{ fontSize: 16 }}>{f.name}</h3>
                <p className="muted small" style={{ margin: "4px 0 14px", minHeight: 36 }}>{f.description || "—"}</p>
                <div className="meta-row" style={{ marginBottom: 16 }}>
                  <span><Clock size={14} />{f.availableFrom}–{f.availableTo}</span>
                  <span><Users size={14} />{f.capacity}</span>
                  <span><IndianRupee size={14} />{f.pricePerHour ? `${f.pricePerHour}/hr` : "Free"}</span>
                </div>
                {canManage && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openForm(f)}><Pencil size={13} />Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(f)}><Trash2 size={13} />Deactivate</button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card flush>
          {data.bookings.length === 0 ? <EmptyState icon={CalendarCheck} title="No bookings yet" /> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Resident</th><th>Facility</th><th>Date</th><th>Time</th><th>Amount</th><th>Status</th>{canManage && <th />}</tr></thead>
              <tbody>
                {data.bookings.map((b) => (
                  <tr key={b._id}>
                    <td><strong>{b.residentId?.name}</strong><div className="cell-sub">Flat {b.residentId?.flatNumber || "—"}</div></td>
                    <td className="muted">{b.facilityId?.name}</td>
                    <td className="muted">{fmtDate(b.date)}</td>
                    <td className="muted">{b.startTime} – {b.endTime}</td>
                    <td className="num">{b.totalAmount ? inr(b.totalAmount) : "Free"}</td>
                    <td><StatusBadge value={b.status} /></td>
                    {canManage && <td><div className="row-actions">
                      {b.status === "PENDING" && <>
                        <button className="btn btn-success btn-sm" onClick={() => decide(b._id, "APPROVED")}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => decide(b._id, "REJECTED")}>Reject</button>
                      </>}
                    </div></td>}
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Card>
      )}

      {modal && (
        <Modal title={modal.facility ? "Edit facility" : "Add facility"} onClose={() => setModal(null)}>
          <form onSubmit={save}>
            <Field label="Name" required><input className="form-input" value={form.name} onChange={set("name")} placeholder="Swimming pool" required /></Field>
            <Field label="Description"><input className="form-input" value={form.description} onChange={set("description")} placeholder="Short description" /></Field>
            <div className="form-row">
              <Field label="Type"><Select value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={FACILITY_TYPES} /></Field>
              <Field label="Capacity"><input className="form-input" type="number" min={1} value={form.capacity} onChange={set("capacity")} /></Field>
            </div>
            <div className="form-row three">
              <Field label="Price / hour (₹)"><input className="form-input" type="number" min={0} value={form.pricePerHour} onChange={set("pricePerHour")} /></Field>
              <Field label="Opens"><input className="form-input" type="time" value={form.availableFrom} onChange={set("availableFrom")} /></Field>
              <Field label="Closes"><input className="form-input" type="time" value={form.availableTo} onChange={set("availableTo")} /></Field>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : modal.facility ? "Save changes" : "Add facility"}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
