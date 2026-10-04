import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import API, { errMsg } from "../utils/api";
import { usePolling } from "../utils/hooks";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Modal, Field } from "./ui";
import { EMERGENCY_TYPES, nice } from "../utils/format";

// One-touch SOS for residents / committee members: floating button, status banner and trigger dialog.
export default function SosPanel() {
  const { user } = useAuth();
  const toast = useToast();
  const [active, setActive] = useState(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("MEDICAL");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  usePolling(async () => {
    try { setActive((await API.get("/emergency/my-active")).data.emergency || null); } catch { /* ignore */ }
  }, 5000);

  const trigger = async () => {
    setBusy(true);
    try {
      const label = EMERGENCY_TYPES.find((t) => t.id === type)?.label;
      const res = await API.post("/emergency/trigger", { type, description: note.trim() || `${label} at Flat ${user?.flatNumber || "N/A"}` });
      setActive(res.data.emergency);
      setOpen(false); setNote("");
      toast.success("SOS broadcast to gate security and management");
    } catch (e) { toast.error(errMsg(e, "Failed to send SOS")); }
    finally { setBusy(false); }
  };

  const cancel = async () => {
    if (!(await toast.confirm({ title: "Cancel SOS?", message: "Only cancel if this was a false alarm. Security will be told the alert was withdrawn.", confirmText: "Yes, cancel alert", danger: true }))) return;
    try {
      await API.put(`/emergency/${active._id}/cancel`);
      setActive(null);
      toast.info("SOS cancelled");
    } catch (e) { toast.error(errMsg(e, "Could not cancel the alert")); }
  };

  return (
    <>
      {active && (
        <div className="sos-banner">
          <div>
            <h3>🚨 SOS active · {nice(active.type)}</h3>
            <p>{active.status === "DISPATCHED"
              ? `${active.handledBy?.name || "Security"} is on the way to Flat ${active.flatNumber}.`
              : "Gate security has been alerted and is responding…"}</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="badge">{active.status === "DISPATCHED" ? "Help dispatched" : "Awaiting response"}</span>
            <button className="btn btn-sm" style={{ background: "#fff", color: "#b91c1c" }} onClick={cancel}>False alarm</button>
          </div>
        </div>
      )}

      {!active && (
        <button className="sos-fab" onClick={() => setOpen(true)} aria-label="Emergency SOS" title="Emergency SOS">
          <ShieldAlert size={24} />SOS
        </button>
      )}

      {open && (
        <Modal title="Emergency SOS" onClose={() => setOpen(false)} icon={<ShieldAlert size={22} color="var(--danger)" />}>
          <div className="alert alert-error">
            Gate security and the society admin will be alerted instantly with your flat ({user?.flatNumber || "N/A"}) and phone number.
          </div>
          <Field label="What is the emergency?">
            {EMERGENCY_TYPES.map((t) => (
              <button key={t.id} type="button" className={`sos-type ${type === t.id ? "sel" : ""}`} onClick={() => setType(t.id)}>
                <span className="emoji">{t.emoji}</span>
                <span><b>{t.label}</b><small>{t.desc}</small></span>
              </button>
            ))}
          </Field>
          <Field label="Details (optional)">
            <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Gas smell in the kitchen" />
          </Field>
          <button className="btn btn-solid-danger btn-lg btn-full" onClick={trigger} disabled={busy}>
            <ShieldAlert size={20} />{busy ? "Sending…" : "Send SOS alert"}
          </button>
        </Modal>
      )}
    </>
  );
}
