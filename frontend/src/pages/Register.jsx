import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Landmark, UserPlus } from "lucide-react";
import API, { errMsg } from "../utils/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", flatNumber: "", societyId: "" });
  const [societies, setSocieties] = useState([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    API.get("/societies/public")
      .then((r) => {
        const list = r.data.societies || [];
        setSocieties(list);
        if (list[0]) setForm((f) => ({ ...f, societyId: list[0]._id }));
      })
      .catch((e) => setError(errMsg(e, "Could not load societies")));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await API.post("/auth/register", { ...form, email: form.email.trim() });
      setOk("Account created! Redirecting to sign in…");
      setTimeout(() => navigate("/login"), 1400);
    } catch (err) {
      setError(errMsg(err, "Registration failed"));
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-single">
      <div className="panel">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div className="brand-mark"><Landmark size={20} /></div>
          <div><div className="brand-name" style={{ color: "var(--text)" }}>SmartSocietyOS</div><div className="brand-sub">Resident registration</div></div>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em" }}>Create your account</h2>
        <p className="muted" style={{ margin: "6px 0 22px" }}>Join your society's portal. Staff and committee accounts are created by your society admin.</p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {ok && <div className="alert alert-success">{ok}</div>}

        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Full name <em>*</em></label>
              <input className="form-input" value={form.name} onChange={set("name")} placeholder="Priya Sharma" required /></div>
            <div className="form-group"><label className="form-label">Phone</label>
              <input className="form-input" type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" /></div>
          </div>
          <div className="form-group"><label className="form-label">Email address <em>*</em></label>
            <input className="form-input" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required /></div>
          <div className="form-group"><label className="form-label">Password <em>*</em></label>
            <div className="input-wrap">
              <input className="form-input" type={show ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Minimum 6 characters" minLength={6} required />
              <button type="button" className="addon" onClick={() => setShow(!show)} aria-label="Toggle password">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Flat number</label>
              <input className="form-input" value={form.flatNumber} onChange={set("flatNumber")} placeholder="A-101" /></div>
            <div className="form-group"><label className="form-label">Society <em>*</em></label>
              <select className="form-select" value={form.societyId} onChange={set("societyId")} required>
                {societies.length === 0 && <option value="">No societies available</option>}
                {societies.map((s) => <option key={s._id} value={s._id}>{s.name} · {s.city}</option>)}
              </select></div>
          </div>
          <button className="btn btn-primary btn-lg btn-full" disabled={loading || !form.societyId}>
            <UserPlus size={18} />{loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: 20 }} className="muted">Already registered? <Link className="link" to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
