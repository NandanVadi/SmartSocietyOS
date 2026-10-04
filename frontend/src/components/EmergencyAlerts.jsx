import { useEffect, useRef, useState } from "react";
import { Phone, Volume2, VolumeX, Siren } from "lucide-react";
import API, { errMsg } from "../utils/api";
import { usePolling } from "../utils/hooks";
import { playSiren, stopSiren } from "../utils/sirenAudio";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { EMERGENCY_EMOJI, nice, timeAgo } from "../utils/format";

// Live SOS feed for gate security and society admins. Mounted once in <Layout/>,
// so an alert is visible (and, for guards, audible) on every page.
export default function EmergencyAlerts() {
  const { user } = useAuth();
  const toast = useToast();
  const isGuard = user?.role === "SECURITY_GUARD";
  const [list, setList] = useState([]);
  const [muted, setMuted] = useState(false);
  const [busy, setBusy] = useState(null);
  const known = useRef(new Set());

  usePolling(async () => {
    try {
      const res = await API.get("/emergency/active");
      const items = res.data.emergencies || [];
      // announce brand-new alerts once
      items.forEach((e) => {
        if (!known.current.has(e._id)) {
          if (known.current.size || items.length) toast.error(`SOS from Flat ${e.flatNumber}: ${nice(e.type)}`);
          known.current.add(e._id);
        }
      });
      setList(items);
    } catch { /* keep the previous list on transient errors */ }
  }, 4000);

  useEffect(() => {
    if (isGuard && !muted && list.some((e) => e.status === "ACTIVE")) playSiren();
    else stopSiren();
    return () => stopSiren();
  }, [list, muted, isGuard]);

  const update = async (id, status) => {
    setBusy(id + status);
    try {
      await API.put(`/emergency/${id}/status`, { status });
      toast.success(status === "DISPATCHED" ? "Response team dispatched" : "Incident marked as resolved");
      setList((l) => (status === "RESOLVED" ? l.filter((e) => e._id !== id) : l.map((e) => (e._id === id ? { ...e, status } : e))));
    } catch (e) { toast.error(errMsg(e, "Could not update the incident")); }
    finally { setBusy(null); }
  };

  if (list.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      {list.map((em) => (
        <div key={em._id} className="siren-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ fontSize: 34 }}>{EMERGENCY_EMOJI[em.type] || "🚨"}</div>
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800 }}>SOS · Flat {em.flatNumber} · {nice(em.type)}</h3>
                  <span className="badge" style={{ background: "rgba(255,255,255,.2)" }}>{em.status === "DISPATCHED" ? "Dispatched" : "Awaiting response"}</span>
                </div>
                <p style={{ marginTop: 4, opacity: .92 }}>{em.description}</p>
                <div className="meta-row" style={{ marginTop: 8 }}>
                  <span>👤 {em.residentId?.name || "Resident"}</span>
                  <span><Phone size={13} /> <a href={`tel:${em.phone}`} style={{ textDecoration: "underline" }}>{em.phone}</a></span>
                  <span>⏱ {timeAgo(em.createdAt)}</span>
                  {em.handledBy?.name && <span>🛡 {em.handledBy.name}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
              {isGuard && (
                <button className="btn btn-sm" style={{ background: "rgba(255,255,255,.15)", color: "#fff" }} onClick={() => setMuted((m) => !m)}>
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}{muted ? "Unmute" : "Mute"}
                </button>
              )}
              {em.status === "ACTIVE" && (
                <button className="btn btn-sm" style={{ background: "#fff", color: "#b91c1c" }} disabled={busy} onClick={() => update(em._id, "DISPATCHED")}>
                  <Siren size={14} />Dispatch team
                </button>
              )}
              <button className="btn btn-sm" style={{ background: "#16a34a", color: "#fff" }} disabled={busy} onClick={() => update(em._id, "RESOLVED")}>
                Mark resolved
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
