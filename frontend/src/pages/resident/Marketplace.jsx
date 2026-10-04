import { useState } from "react";
import { ShoppingBag, Plus, Phone, Trash2, CheckCircle2 } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, Field, Modal, PageHeader, Pills, Select, Spinner, StatCard, StatusBadge, Tabs, HBars } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { inr, nice } from "../../utils/format";

const CATS = ["SELL", "BUY", "RENT", "SERVICE", "FREE"];
const EMPTY = { title: "", description: "", category: "SELL", price: 0, contactPhone: "" };

// Shared by residents, committee members (can list) and society admins (moderate + analytics).
export default function Marketplace() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === "SOCIETY_ADMIN";
  const [tab, setTab] = useState("browse");
  const [cat, setCat] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  // Society admins can't call /marketplace/my (seller-only) — they get /analytics instead.
  const { data, loading, reload } = useLoad(async () => {
    const all = await API.get("/marketplace");
    if (isAdmin) {
      const an = await API.get("/marketplace/analytics");
      return { listings: all.data.listings || [], mine: [], analytics: an.data };
    }
    const mine = await API.get("/marketplace/my");
    return { listings: all.data.listings || [], mine: mine.data.listings || [], analytics: null };
  }, { listings: [], mine: [], analytics: null });

  const shown = tab === "browse" ? data.listings.filter((l) => cat === "ALL" || l.category === cat) : data.mine;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await API.post("/marketplace", { ...form, price: Number(form.price) || 0 });
      toast.success("Listing published");
      setOpen(false); setForm(EMPTY); reload();
    } catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  const remove = async (l) => {
    if (!(await toast.confirm({ title: isAdmin ? "Remove listing?" : "Remove your listing?", message: `"${l.title}" will no longer be visible to residents.`, confirmText: "Remove", danger: true }))) return;
    try { await API.delete(`/marketplace/${l._id}`); toast.success("Listing removed"); reload(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  const markSold = async (l) => {
    try { await API.put(`/marketplace/${l._id}`, { status: "SOLD" }); toast.success("Marked as sold"); reload(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <Layout title="Marketplace" breadcrumb="Community marketplace">
      <PageHeader title="Society marketplace" subtitle={isAdmin ? "Moderate listings posted by your residents" : "Buy, sell, rent and share within your community"}>
        {!isAdmin && <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Create listing</button>}
      </PageHeader>

      {isAdmin && data.analytics && (
        <div className="grid-main mb">
          <div className="grid-2" style={{ alignContent: "start" }}>
            <StatCard icon={ShoppingBag} tone="primary" label="Total listings" value={data.analytics.totalListings} />
            <StatCard icon={CheckCircle2} tone="success" label="Active listings" value={data.analytics.activeListings} />
          </div>
          <Card title="Listings by category">
            {data.analytics.categoryStats.length ? <HBars data={data.analytics.categoryStats.map((c) => ({ label: `${nice(c._id)}${c.avgPrice ? ` · avg ${inr(c.avgPrice)}` : ""}`, value: c.count }))} /> : <p className="muted">No listings yet.</p>}
          </Card>
        </div>
      )}

      {!isAdmin && <Tabs value={tab} onChange={setTab} tabs={[{ id: "browse", label: "Browse all", count: data.listings.length }, { id: "my", label: "My listings", count: data.mine.length }]} />}
      {tab === "browse" && <Pills options={["ALL", ...CATS]} value={cat} onChange={setCat} />}

      {loading ? <Spinner /> : shown.length === 0 ? (
        <Card><EmptyState icon={ShoppingBag} title="No listings" text={tab === "my" ? "You haven't listed anything yet." : "Be the first to post something!"} /></Card>
      ) : (
        <div className="grid-3">
          {shown.map((l) => {
            const mine = tab === "my";
            const canRemove = mine || isAdmin;
            return (
              <Card key={l._id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 6 }}><StatusBadge value={l.category} />{mine && l.status !== "ACTIVE" && <StatusBadge value={l.status} plain />}</div>
                  <b style={{ fontSize: 17, color: l.price ? "var(--text)" : "var(--success)" }}>{l.price ? inr(l.price) : "Free"}</b>
                </div>
                <h3 style={{ fontSize: 15, marginBottom: 6 }}>{l.title}</h3>
                <p className="muted small" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 54 }}>{l.description}</p>
                <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div className="small"><b>{l.sellerId?.name || "You"}</b><div className="faint">{l.sellerId?.flatNumber ? `Flat ${l.sellerId.flatNumber}` : ""}</div></div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {mine && l.status === "ACTIVE" && <button className="btn btn-success btn-sm" onClick={() => markSold(l)}>Mark sold</button>}
                    {canRemove && (!mine || l.status === "ACTIVE") && <button className="btn btn-danger btn-sm" onClick={() => remove(l)} aria-label="Remove"><Trash2 size={13} /></button>}
                    {!mine && !isAdmin && (l.contactPhone || l.sellerId?.phone) && <a className="btn btn-secondary btn-sm" href={`tel:${l.contactPhone || l.sellerId.phone}`}><Phone size={13} />Contact</a>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {open && (
        <Modal title="Create listing" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <Field label="Title" required><input className="form-input" value={form.title} onChange={set("title")} placeholder="What are you listing?" required /></Field>
            <Field label="Description" required><textarea className="form-textarea" value={form.description} onChange={set("description")} required /></Field>
            <div className="form-row">
              <Field label="Category"><Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATS} /></Field>
              <Field label="Price (₹)" hint="0 = free"><input className="form-input" type="number" min={0} value={form.price} onChange={set("price")} /></Field>
            </div>
            <Field label="Contact phone"><input className="form-input" type="tel" value={form.contactPhone} onChange={set("contactPhone")} /></Field>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Publishing…" : "Publish listing"}</button></div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
