import { useEffect, useState } from "react";
import { Save, KeyRound, Mail, Phone, Home, Building2 } from "lucide-react";
import Layout from "../components/Layout";
import { Avatar, Badge, Card, PageHeader, Spinner } from "../components/ui";
import API, { errMsg } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ROLE_LABELS, ROLE_TONE, fmtDate } from "../utils/format";

export default function Profile() {
  const { updateUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", flatNumber: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    API.get("/auth/profile").then(({ data }) => {
      setProfile(data.user);
      setForm({ name: data.user.name || "", phone: data.user.phone || "", flatNumber: data.user.flatNumber || "" });
    }).catch((e) => toast.error(errMsg(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await API.put("/auth/profile", form);
      setProfile((p) => ({ ...p, ...data.user }));
      updateUser({ name: data.user.name, phone: data.user.phone, flatNumber: data.user.flatNumber });
      toast.success("Profile updated");
    } catch (err) { toast.error(errMsg(err, "Update failed")); }
    finally { setSaving(false); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error("New passwords do not match");
    setSavingPw(true);
    try {
      await API.put("/auth/profile", { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed");
    } catch (err) { toast.error(errMsg(err, "Could not change password")); }
    finally { setSavingPw(false); }
  };

  return (
    <Layout title="My Profile" breadcrumb="Account">
      <PageHeader title="My profile" subtitle="Manage your personal details and password" />
      {!profile ? <Spinner /> : (
        <div className="profile-grid">
          <Card className="profile-hero">
            <Avatar name={profile.name} size="lg" />
            <h3 style={{ fontSize: 18 }}>{profile.name}</h3>
            <div style={{ margin: "8px 0 18px" }}><Badge tone={ROLE_TONE[profile.role]} plain>{ROLE_LABELS[profile.role]}</Badge></div>
            <div className="stack" style={{ textAlign: "left", gap: 12, fontSize: 13 }}>
              <span className="muted" style={{ display: "flex", gap: 10 }}><Mail size={16} />{profile.email}</span>
              {profile.phone && <span className="muted" style={{ display: "flex", gap: 10 }}><Phone size={16} />{profile.phone}</span>}
              {profile.flatNumber && <span className="muted" style={{ display: "flex", gap: 10 }}><Home size={16} />Flat {profile.flatNumber}</span>}
              {profile.societyId?.name && <span className="muted" style={{ display: "flex", gap: 10 }}><Building2 size={16} />{profile.societyId.name}</span>}
              <span className="faint small">Member since {fmtDate(profile.createdAt)}</span>
            </div>
          </Card>

          <div className="stack">
            <Card title="Personal details" subtitle="Your name and contact information">
              <form onSubmit={saveProfile}>
                <div className="form-group"><label className="form-label">Full name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Flat number</label>
                    <input className="form-input" value={form.flatNumber} onChange={(e) => setForm({ ...form, flatNumber: e.target.value })} /></div>
                </div>
                <button className="btn btn-primary" disabled={saving}><Save size={16} />{saving ? "Saving…" : "Save changes"}</button>
              </form>
            </Card>

            <Card title="Change password" subtitle="Use at least 6 characters">
              <form onSubmit={savePassword}>
                <div className="form-group"><label className="form-label">Current password</label>
                  <input className="form-input" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">New password</label>
                    <input className="form-input" type="password" autoComplete="new-password" minLength={6} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required /></div>
                  <div className="form-group"><label className="form-label">Confirm new password</label>
                    <input className="form-input" type="password" autoComplete="new-password" minLength={6} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required /></div>
                </div>
                <button className="btn btn-secondary" disabled={savingPw}><KeyRound size={16} />{savingPw ? "Updating…" : "Update password"}</button>
              </form>
            </Card>
          </div>
        </div>
      )}
    </Layout>
  );
}
