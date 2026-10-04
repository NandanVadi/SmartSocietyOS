import { useState } from "react";
import { Bell } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, PageHeader, Pills, Spinner, StatusBadge } from "../../components/ui";
import API from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { CATEGORY_BORDER, fmtDate } from "../../utils/format";

export default function NoticeBoard() {
  const [cat, setCat] = useState("ALL");
  const { data: notices, loading } = useLoad(async () => (await API.get("/billing/notices")).data.notices || [], []);
  const list = notices.filter((n) => cat === "ALL" || n.category === cat);

  return (
    <Layout title="Notice Board" breadcrumb="Resident · Notices">
      <PageHeader title="Notice board" subtitle="Announcements from your society management" />
      <Pills options={["ALL", "GENERAL", "MAINTENANCE", "EVENT", "EMERGENCY", "RULE_CHANGE", "MEETING"]} value={cat} onChange={setCat} />
      {loading ? <Spinner /> : list.length === 0 ? <Card><EmptyState icon={Bell} title="No notices" text="Nothing posted in this category." /></Card> : (
        <div className="stack">
          {list.map((n) => (
            <Card key={n._id} className={`notice-card tone-border-${CATEGORY_BORDER[n.category] || "info"}`}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 8 }}><StatusBadge value={n.priority} /><StatusBadge value={n.category} plain /></div>
                <span className="faint small">{fmtDate(n.createdAt)} · {n.publishedBy?.name}</span>
              </div>
              <h3 style={{ fontSize: 16, marginBottom: 6 }}>{n.title}</h3>
              <p className="muted" style={{ whiteSpace: "pre-wrap" }}>{n.content}</p>
              {n.expiresAt && <div className="small" style={{ marginTop: 12, color: "var(--warning)" }}>⏰ Valid until {fmtDate(n.expiresAt)}</div>}
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
