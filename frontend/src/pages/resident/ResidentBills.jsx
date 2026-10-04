import { useState } from "react";
import { FileText, CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Layout from "../../components/Layout";
import { Card, EmptyState, PageHeader, Pills, Spinner, StatCard, StatusBadge } from "../../components/ui";
import API, { errMsg } from "../../utils/api";
import { useLoad } from "../../utils/hooks";
import { useToast } from "../../context/ToastContext";
import { fmtDate, inr, nice } from "../../utils/format";

export default function ResidentBills() {
  const toast = useToast();
  const [filter, setFilter] = useState("ALL");
  const [paying, setPaying] = useState(null);
  const { data: bills, loading, reload } = useLoad(async () => (await API.get("/billing/bills/my")).data.bills || [], []);

  const sum = (s) => bills.filter((b) => b.status === s).reduce((a, b) => a + b.amount, 0);
  const list = bills.filter((b) => filter === "ALL" || b.status === filter);

  const pay = async (b) => {
    if (!(await toast.confirm({ title: "Confirm payment", message: `Pay ${inr(b.amount)} for ${nice(b.type)}${b.month ? ` (${b.month})` : ""}?`, confirmText: `Pay ${inr(b.amount)}` }))) return;
    setPaying(b._id);
    try {
      const { data } = await API.put(`/billing/bills/${b._id}/pay`, {});
      toast.success(`Payment successful · ${data.bill.transactionId}`);
      reload();
    } catch (e) { toast.error(errMsg(e, "Payment failed")); }
    finally { setPaying(null); }
  };

  return (
    <Layout title="My Bills" breadcrumb="Resident · Bills">
      <PageHeader title="Bills & payments" subtitle="Maintenance charges and other dues" />
      <div className="grid-3 mb">
        <StatCard icon={Clock} tone="warning" label="Pending" value={inr(sum("PENDING"))} loading={loading} />
        <StatCard icon={AlertCircle} tone="danger" label="Overdue" value={inr(sum("OVERDUE"))} loading={loading} />
        <StatCard icon={CheckCircle2} tone="success" label="Paid" value={inr(sum("PAID"))} loading={loading} />
      </div>
      <Pills options={["ALL", "PENDING", "OVERDUE", "PAID"]} value={filter} onChange={setFilter} />
      {loading ? <Spinner /> : (
        <Card flush>
          {list.length === 0 ? <EmptyState icon={FileText} title="No bills" text="Bills raised by your society admin will show up here." /> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Bill</th><th>Month</th><th>Amount</th><th>Due date</th><th>Status</th><th>Receipt / action</th></tr></thead>
              <tbody>
                {list.map((b) => (
                  <tr key={b._id}>
                    <td><strong>{nice(b.type)}</strong><div className="cell-sub">{b.description || "—"}</div></td>
                    <td className="muted">{b.month || "—"}</td>
                    <td className="num">{inr(b.amount)}</td>
                    <td className="small" style={{ color: b.status === "OVERDUE" ? "var(--danger)" : "var(--text-2)", fontWeight: b.status === "OVERDUE" ? 600 : 400 }}>{fmtDate(b.dueDate)}</td>
                    <td><StatusBadge value={b.status} /></td>
                    <td>
                      {b.status !== "PAID" ? (
                        <button className="btn btn-primary btn-sm" disabled={paying === b._id} onClick={() => pay(b)}><CreditCard size={14} />{paying === b._id ? "Processing…" : "Pay now"}</button>
                      ) : <span className="faint small">{fmtDate(b.paidAt)}<div>{b.transactionId}</div></span>}
                    </td>
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
