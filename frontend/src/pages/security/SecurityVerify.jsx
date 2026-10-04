import { useState } from "react";
import { QrCode, CheckCircle2, XCircle, User, Phone, Target, Home, RotateCcw, ScanLine } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, StatusBadge } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useToast } from "../../context/ToastContext";

export default function SecurityVerify() {
  const toast = useToast();
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null); // {valid, message, visitor}
  const [loading, setLoading] = useState(false);

  const verify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true); setResult(null);
    try {
      const { data } = await API.post("/visitors/verify", { qrCode: code.trim() });
      setResult(data);
      if (data.valid) toast.success(data.message);
    } catch (err) {
      // 4xx responses still carry {valid:false, message}
      setResult({ valid: false, message: errMsg(err, "Verification failed"), visitor: err.response?.data?.visitor });
    } finally { setLoading(false); }
  };

  const reset = () => { setCode(""); setResult(null); };
  const v = result?.visitor;
  const ok = result?.valid;

  return (
    <Layout title="QR Verification" breadcrumb="Security · Verify visitor">
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <div style={{ textAlign: "center", margin: "12px 0 28px" }}>
          <div className="stat-icon tone-primary" style={{ width: 72, height: 72, borderRadius: 22, margin: "0 auto 16px" }}><ScanLine size={34} /></div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Verify visitor pass</h1>
          <p className="muted" style={{ marginTop: 6 }}>Scan the visitor's QR code (or paste its token) to validate entry and check them in.</p>
        </div>
        <Card>
          <form onSubmit={verify}>
            <div className="form-group">
              <label className="form-label" htmlFor="qr">QR token</label>
              <input id="qr" className="form-input" style={{ textAlign: "center", fontSize: 15, letterSpacing: ".02em" }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Scan or paste the visitor token…" autoFocus autoComplete="off" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading || !code.trim()}><QrCode size={18} />{loading ? "Verifying…" : "Verify & check in"}</button>
              {result && <button type="button" className="btn btn-secondary btn-lg" onClick={reset}><RotateCcw size={16} />Next</button>}
            </div>
          </form>
        </Card>

        {result && (
          <Card className="" style={{ marginTop: 18, borderColor: ok ? "var(--success)" : "var(--danger)", borderWidth: 2 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: v ? 20 : 0 }}>
              {ok ? <CheckCircle2 size={44} color="var(--success)" /> : <XCircle size={44} color="var(--danger)" />}
              <div>
                <h3 style={{ fontSize: 19, color: ok ? "var(--success)" : "var(--danger)" }}>{ok ? "Access granted" : "Access denied"}</h3>
                <p className="muted">{result.message}</p>
              </div>
            </div>
            {v && (
              <>
                <div className="kv">
                  <div><small><User size={11} /> Visitor</small><span>{v.name}</span></div>
                  <div><small><Phone size={11} /> Phone</small><span>{v.phone}</span></div>
                  <div><small><Target size={11} /> Purpose</small><span>{v.purpose}</span></div>
                  <div><small><Home size={11} /> Visiting</small><span>{v.residentId?.name}{v.residentId?.flatNumber && ` · Flat ${v.residentId.flatNumber}`}</span></div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}><StatusBadge value={v.status} />{v.vehicleNumber && <span className="badge plain tone-neutral">🚗 {v.vehicleNumber}</span>}</div>
              </>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
}
