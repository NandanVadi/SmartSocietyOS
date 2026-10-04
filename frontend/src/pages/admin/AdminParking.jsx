import { useState } from "react";
import { Car, Plus, Bike, Zap, Wrench, Unlock } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, Field, Modal, PageHeader, Pills, Progress, Spinner, StatCard, StatusBadge } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { useToast } from "../../context/ToastContext";
import { nice } from "../../utils/format";

const TYPE_ICON = { TWO_WHEELER: Bike, FOUR_WHEELER: Car, ELECTRIC: Zap };

export default function AdminParking() {
  const toast = useToast();
  const [filter, setFilter] = useState("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [alloc, setAlloc] = useState(null);
  const [form, setForm] = useState({ slotNumber: "", type: "FOUR_WHEELER" });
  const [af, setAf] = useState({ userId: "", vehicleNumber: "", vehicleModel: "" });
  const [busy, setBusy] = useState(false);

  const { data, loading, reload } = useLoad(async () => {
    const [s, m] = await Promise.all([API.get("/facilities/parking"), API.get("/societies/members")]);
    return { slots: s.data.slots || [], residents: (m.data.users || []).filter((u) => u.role === "RESIDENT") };
  }, { slots: [], residents: [] });

  const n = (s) => data.slots.filter((x) => x.status === s).length;
  const shown = data.slots.filter((s) => filter === "ALL" || s.status === filter);
  const pct = data.slots.length ? Math.round((n("OCCUPIED") / data.slots.length) * 100) : 0;

  const act = async (fn, ok, close) => {
    setBusy(true);
    try { await fn(); toast.success(ok); close?.(); reload(); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };

  return (
    <Layout title="Parking" breadcrumb="Society Admin · Parking">
      <PageHeader title="Parking management" subtitle="Allocate slots to residents and track occupancy">
        <button className="btn btn-primary" onClick={() => { setForm({ slotNumber: "", type: "FOUR_WHEELER" }); setAddOpen(true); }}><Plus size={16} />Add slot</button>
      </PageHeader>

      <div className="grid-4 mb">
        <StatCard icon={Car} tone="primary" label="Total slots" value={data.slots.length} loading={loading} />
        <StatCard icon={Car} tone="success" label="Available" value={n("AVAILABLE")} loading={loading} />
        <StatCard icon={Car} tone="danger" label="Occupied" value={n("OCCUPIED")} loading={loading} />
        <StatCard icon={Wrench} tone="warning" label="Under maintenance" value={n("MAINTENANCE")} loading={loading} />
      </div>
      {data.slots.length > 0 && <Card className="mb"><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><b>Occupancy</b><span className="muted">{pct}%</span></div><Progress value={pct} color="var(--teal)" /></Card>}

      <Pills options={["ALL", "AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"]} value={filter} onChange={setFilter} />

      {loading ? <Spinner /> : shown.length === 0 ? <Card><EmptyState icon={Car} title="No parking slots" text="Add slots to start allocating parking." /></Card> : (
        <div className="grid-4">
          {shown.map((s) => {
            const Icon = TYPE_ICON[s.type] || Car;
            return (
              <Card key={s._id} className="slot-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div className="stat-icon tone-neutral" style={{ width: 40, height: 40 }}><Icon size={19} /></div>
                  <StatusBadge value={s.status} />
                </div>
                <div className="slot-no">{s.slotNumber}</div>
                <div className="faint small" style={{ marginBottom: 12 }}>{nice(s.type)}</div>
                {s.allocatedTo && (
                  <div style={{ padding: "10px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
                    <strong>{s.allocatedTo.name}</strong> · Flat {s.allocatedTo.flatNumber}
                    {s.vehicleNumber && <div style={{ color: "var(--primary-text)", fontWeight: 600 }}>{s.vehicleNumber}{s.vehicleModel && ` · ${s.vehicleModel}`}</div>}
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {s.status === "AVAILABLE" && <>
                    <button className="btn btn-primary btn-sm" onClick={() => { setAf({ userId: "", vehicleNumber: "", vehicleModel: "" }); setAlloc(s); }}>Allocate</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => act(() => API.put(`/facilities/parking/${s._id}`, { status: "MAINTENANCE" }), "Marked under maintenance")}><Wrench size={13} /></button>
                  </>}
                  {s.status === "OCCUPIED" && <button className="btn btn-secondary btn-sm" onClick={() => act(() => API.put(`/facilities/parking/${s._id}`, { status: "AVAILABLE" }), "Slot released")}><Unlock size={13} />Release</button>}
                  {s.status === "MAINTENANCE" && <button className="btn btn-secondary btn-sm" onClick={() => act(() => API.put(`/facilities/parking/${s._id}`, { status: "AVAILABLE" }), "Slot is available again")}>Mark available</button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {addOpen && (
        <Modal title="Add parking slot" size="sm" onClose={() => setAddOpen(false)}>
          <form onSubmit={(e) => { e.preventDefault(); act(() => API.post("/facilities/parking", form), "Slot added", () => setAddOpen(false)); }}>
            <Field label="Slot number" required><input className="form-input" value={form.slotNumber} onChange={(e) => setForm({ ...form, slotNumber: e.target.value })} placeholder="P-101" required /></Field>
            <Field label="Type"><select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="TWO_WHEELER">Two wheeler</option><option value="FOUR_WHEELER">Four wheeler</option><option value="ELECTRIC">Electric vehicle</option></select></Field>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>Add slot</button></div>
          </form>
        </Modal>
      )}

      {alloc && (
        <Modal title={`Allocate ${alloc.slotNumber}`} size="sm" onClose={() => setAlloc(null)}>
          <form onSubmit={(e) => { e.preventDefault(); act(() => API.put(`/facilities/parking/${alloc._id}/allocate`, af), "Slot allocated", () => setAlloc(null)); }}>
            <Field label="Resident" required>
              <select className="form-select" value={af.userId} onChange={(e) => setAf({ ...af, userId: e.target.value })} required>
                <option value="">Select resident…</option>
                {data.residents.map((r) => <option key={r._id} value={r._id}>{r.name} · {r.flatNumber || "no flat"}</option>)}
              </select>
            </Field>
            <Field label="Vehicle number" required><input className="form-input" value={af.vehicleNumber} onChange={(e) => setAf({ ...af, vehicleNumber: e.target.value })} placeholder="MH 01 AB 1234" required /></Field>
            <Field label="Vehicle model"><input className="form-input" value={af.vehicleModel} onChange={(e) => setAf({ ...af, vehicleModel: e.target.value })} placeholder="Honda City" /></Field>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setAlloc(null)}>Cancel</button><button className="btn btn-primary" disabled={busy}>Allocate</button></div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
