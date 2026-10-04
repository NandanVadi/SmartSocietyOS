import { useEffect } from "react";
import { X, Search, Inbox, AlertTriangle } from "lucide-react";
import { TONE, nice, initials } from "../utils/format";

/* ---------- small atoms ---------- */
export function Badge({ tone = "neutral", children, plain }) {
  return <span className={`badge tone-${tone} ${plain ? "plain" : ""}`}>{children}</span>;
}

// Maps any status / priority / category string to a coloured badge
export function StatusBadge({ value, plain }) {
  if (!value) return <span className="faint">—</span>;
  return <Badge tone={TONE[value] || "neutral"} plain={plain}>{nice(value)}</Badge>;
}

export function Avatar({ name, size }) {
  return <div className={`avatar ${size || ""}`}>{initials(name)}</div>;
}

export function Card({ title, subtitle, action, flush, className = "", children, ...rest }) {
  return (
    <div className={`card ${flush ? "flush" : ""} ${className}`} {...rest}>
      {(title || action) && (
        <div className={`card-header ${flush ? "padded" : ""}`}>
          <div>
            <div className="card-title">{title}</div>
            {subtitle && <div className="card-sub">{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, tone = "primary", hint, loading }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon tone-${tone}`}>{Icon && <Icon size={22} />}</div>
      <div style={{ minWidth: 0 }}>
        {loading ? <div className="skeleton" style={{ width: 70, height: 28 }} /> : <div className="stat-value">{value ?? 0}</div>}
        <div className="stat-label">{label}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

export function Spinner() {
  return <div className="spinner-wrap"><div className="spinner" /></div>;
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={26} /></div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="search">
      <Search size={16} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={`tab ${value === t.id ? "active" : ""}`} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count !== undefined && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Pills({ options, value, onChange }) {
  return (
    <div className="pills">
      {options.map((o) => {
        const id = typeof o === "string" ? o : o.id;
        const label = typeof o === "string" ? (o === "ALL" ? "All" : nice(o)) : o.label;
        return (
          <button key={id} className={`pill ${value === id ? "active" : ""}`} onClick={() => onChange(id)}>{label}</button>
        );
      })}
    </div>
  );
}

export function Field({ label, required, hint, children }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}{required && <em> *</em>}</label>}
      {children}
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}

export function Select({ options, value, onChange, ...rest }) {
  return (
    <select className="form-select" value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? nice(o) : o.label;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  );
}

/* ---------- modal ---------- */
export function Modal({ title, onClose, size = "", children, icon }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>{icon}{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title = "Are you sure?", message, confirmText = "Confirm", danger, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} size="sm" icon={danger ? <AlertTriangle size={20} color="var(--danger)" /> : null}>
      <p className="muted" style={{ marginBottom: 22 }}>{message}</p>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className={`btn ${danger ? "btn-solid-danger" : "btn-primary"}`} onClick={onConfirm} autoFocus>{confirmText}</button>
      </div>
    </Modal>
  );
}

/* ---------- charts (dependency-free SVG / CSS) ---------- */
export function DonutChart({ data, size = 170, thickness = 22, centerLabel }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribution chart">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thickness} />
        {total > 0 && data.map((d, i) => {
          const len = (d.value / total) * c;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
          );
          offset += len;
          return el;
        })}
        <text x="50%" y="48%" textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--text)">{total}</text>
        <text x="50%" y="62%" textAnchor="middle" fontSize="11" fill="var(--text-3)">{centerLabel || "Total"}</text>
      </svg>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div key={i}><i style={{ background: d.color }} />{d.label}<b>{d.value}</b></div>
        ))}
      </div>
    </div>
  );
}

// Grouped vertical bars. data: [{label, values:[n,n]}], series: [{name,color}]
export function BarChart({ data, series, format = (n) => n }) {
  const max = Math.max(1, ...data.flatMap((d) => d.values));
  return (
    <div>
      <div className="bars">
        {data.map((d, i) => (
          <div className="bar-group" key={i}>
            <div className="bar-stack">
              {d.values.map((v, j) => (
                <div key={j} className="bar" data-tip={`${series[j].name}: ${format(v)}`}
                  style={{ height: `${(v / max) * 100}%`, background: series[j].color }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="bar-labels">{data.map((d, i) => <span key={i} title={d.label}>{d.label}</span>)}</div>
      <div className="legend" style={{ marginTop: 14 }}>
        {series.map((s) => <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>)}
      </div>
    </div>
  );
}

export function HBars({ data, color = "var(--primary)" }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      {data.map((d, i) => (
        <div className="hbar-row" key={i}>
          <span className="muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
          <div className="progress"><div style={{ width: `${(d.value / max) * 100}%`, background: d.color || color }} /></div>
          <b>{d.value}</b>
        </div>
      ))}
    </div>
  );
}

export function Progress({ value, color = "var(--primary)" }) {
  return <div className="progress"><div style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} /></div>;
}
