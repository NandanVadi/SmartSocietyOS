import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Landmark, QrCode, Siren, BarChart3, ShieldCheck, LogIn } from "lucide-react";
import API, { errMsg } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { ROLE_HOME, ROLE_LABELS } from "../utils/format";

const DEMO = [
  ["resident", "RESIDENT"], ["admin", "SOCIETY_ADMIN"], ["committee", "COMMITTEE_MEMBER"],
  ["security", "SECURITY_GUARD"], ["maintenance", "MAINTENANCE_STAFF"], ["superadmin", "SUPER_ADMIN"],
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await API.post("/auth/login", { email: form.email.trim(), password: form.password });
      login(data.token, data.user);
      navigate(ROLE_HOME[data.user.role] || "/", { replace: true });
    } catch (err) {
      setError(errMsg(err, "Login failed. Please try again."));
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-split">
      <div className="auth-left">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="brand-mark"><Landmark size={20} /></div>
          <div className="brand-name" style={{ fontSize: 18 }}>SmartSocietyOS</div>
        </div>
        <div>
          <h1>Run your society<br />like a smart city.</h1>
          <p className="lead">Visitors, billing, complaints, facilities and emergencies — one secure platform for residents, guards, committees and admins.</p>
          <div className="auth-features">
            {[
              [ShieldCheck, "Six role-based portals with strict tenant isolation"],
              [QrCode, "QR-based visitor pre-approval and gate verification"],
              [Siren, "One-touch SOS with live siren alerts at the gate"],
              [BarChart3, "Live billing, complaint and occupancy analytics"],
            ].map(([Icon, text]) => (
              <div className="auth-feature" key={text}><div className="stat-icon"><Icon size={18} /></div>{text}</div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}>© {new Date().getFullYear()} SmartSocietyOS</div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p>Sign in to your society account</p>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input id="email" className="form-input" type="email" autoComplete="username" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-wrap">
                <input id="password" className="form-input" type={show ? "text" : "password"} autoComplete="current-password" placeholder="••••••••"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" className="addon" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
              <LogIn size={18} />{loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 22, marginBottom: 0 }}>
            New resident? <Link className="link" to="/register">Create an account</Link>
          </p>

          <div className="demo-box">
            <h4>Demo accounts · password123</h4>
            <div className="demo-grid">
              {DEMO.map(([name, role]) => (
                <button key={name} type="button" className="demo-chip" onClick={() => setForm({ email: `${name}@smartsociety.com`, password: "password123" })}>
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
