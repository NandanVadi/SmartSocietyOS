import { useMemo, useState } from "react";
import { Users as UsersIcon } from "lucide-react";
import Layout from "../../components/Layout";
import { Avatar, Badge, Card, EmptyState, PageHeader, SearchBox, Select, Spinner } from "../../components/ui";
import API from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { fmtDate, ROLE_LABELS, ROLE_TONE } from "../../utils/format";

export default function Users() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const [society, setSociety] = useState("ALL");
  const { data: users, loading } = useLoad(async () => (await API.get("/societies/users/all")).data.users || [], []);

  const societies = useMemo(() => [...new Map(users.filter((u) => u.societyId).map((u) => [u.societyId._id, u.societyId.name])).entries()], [users]);
  const list = users.filter((u) =>
    `${u.name} ${u.email} ${u.flatNumber || ""}`.toLowerCase().includes(q.toLowerCase()) &&
    (role === "ALL" || u.role === role) && (society === "ALL" || u.societyId?._id === society));

  return (
    <Layout title="All Users" breadcrumb="Super Admin · Users">
      <PageHeader title="All users" subtitle={`${users.length} accounts across the platform`} />
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email or flat…" />
        <Select value={role} onChange={setRole} options={[{ value: "ALL", label: "All roles" }, ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))]} />
        <Select value={society} onChange={setSociety} options={[{ value: "ALL", label: "All societies" }, ...societies.map(([value, label]) => ({ value, label }))]} />
      </div>
      {loading ? <Spinner /> : (
        <Card flush>
          {list.length === 0 ? <EmptyState icon={UsersIcon} title="No users match" /> : (
            <div className="table-wrap"><table>
              <thead><tr><th>User</th><th>Role</th><th>Society</th><th>Flat</th><th>Phone</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u._id}>
                    <td><div className="cell-user"><Avatar name={u.name} size="sm" /><div><strong>{u.name}</strong><div className="cell-sub">{u.email}</div></div></div></td>
                    <td><Badge tone={ROLE_TONE[u.role]} plain>{ROLE_LABELS[u.role]}</Badge></td>
                    <td className="muted">{u.societyId?.name || <span className="faint">Platform</span>}</td>
                    <td className="muted">{u.flatNumber || "—"}</td>
                    <td className="muted small">{u.phone || "—"}</td>
                    <td><Badge tone={u.isActive ? "success" : "neutral"}>{u.isActive ? "Active" : "Disabled"}</Badge></td>
                    <td className="faint small">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </Card>
      )}
    </Layout>
  );
}
