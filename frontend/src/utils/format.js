export const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
export const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—");
export const fmtDateTime = (d) => (d ? `${fmtDate(d)}, ${fmtTime(d)}` : "—");
// Sort {_id:"October 2026"|"2026-10"|...} month buckets chronologically (unparseable labels go last)
export const sortMonths = (rows = []) =>
  [...rows].sort((a, b) => (Date.parse(`1 ${a._id}`) || Date.parse(a._id) || Infinity) - (Date.parse(`1 ${b._id}`) || Date.parse(b._id) || Infinity));
export const todayISO = () => new Date().toISOString().split("T")[0];
export const initials = (name = "") => name.trim().charAt(0).toUpperCase() || "U";
export const nice = (s = "") => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
export const timeAgo = (d) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(d)) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin", SOCIETY_ADMIN: "Society Admin", COMMITTEE_MEMBER: "Committee Member",
  RESIDENT: "Resident", SECURITY_GUARD: "Security Guard", MAINTENANCE_STAFF: "Maintenance Staff",
};
export const ROLE_HOME = {
  SUPER_ADMIN: "/super-admin", SOCIETY_ADMIN: "/admin", COMMITTEE_MEMBER: "/committee",
  RESIDENT: "/resident", SECURITY_GUARD: "/security", MAINTENANCE_STAFF: "/maintenance",
};
export const ROLE_TONE = {
  SUPER_ADMIN: "danger", SOCIETY_ADMIN: "violet", COMMITTEE_MEMBER: "teal",
  RESIDENT: "info", SECURITY_GUARD: "warning", MAINTENANCE_STAFF: "success",
};

// Every status/priority/category string in the system -> colour tone
export const TONE = {
  OPEN: "danger", IN_PROGRESS: "warning", RESOLVED: "success", CLOSED: "neutral",
  LOW: "neutral", MEDIUM: "info", HIGH: "warning", URGENT: "danger",
  PENDING: "warning", PAID: "success", OVERDUE: "danger",
  APPROVED: "success", REJECTED: "danger", CANCELLED: "neutral",
  CHECKED_IN: "teal", CHECKED_OUT: "neutral", DENIED: "danger",
  AVAILABLE: "success", OCCUPIED: "danger", RESERVED: "violet", MAINTENANCE: "warning",
  ACTIVE: "success", INACTIVE: "neutral", SOLD: "neutral", DISPATCHED: "info",
  SELL: "info", BUY: "violet", RENT: "teal", SERVICE: "warning", FREE: "success",
  GENERAL: "info", EVENT: "teal", EMERGENCY: "danger", RULE_CHANGE: "violet", MEETING: "success",
};

export const CATEGORY_BORDER = { GENERAL: "info", MAINTENANCE: "warning", EVENT: "teal", EMERGENCY: "danger", RULE_CHANGE: "violet", MEETING: "success" };

export const EMERGENCY_TYPES = [
  { id: "MEDICAL", label: "Medical Emergency", emoji: "🚑", desc: "Heart attack, fainting, severe injury" },
  { id: "FIRE", label: "Fire / Gas Leak", emoji: "🔥", desc: "Smoke, kitchen fire, gas smell" },
  { id: "SECURITY_THREAT", label: "Security Threat", emoji: "🚨", desc: "Intruder, burglary, physical danger" },
  { id: "LIFT_STUCK", label: "Lift Stuck", emoji: "🛗", desc: "Trapped in the elevator" },
  { id: "OTHER", label: "Other Emergency", emoji: "⚠️", desc: "Immediate guard assistance needed" },
];
export const EMERGENCY_EMOJI = Object.fromEntries(EMERGENCY_TYPES.map((t) => [t.id, t.emoji]));

export const FACILITY_TYPES = ["GYM", "SWIMMING_POOL", "CLUBHOUSE", "TENNIS_COURT", "BADMINTON_COURT", "PARTY_HALL", "OTHER"];
export const FACILITY_EMOJI = { GYM: "🏋️", SWIMMING_POOL: "🏊", CLUBHOUSE: "🏛️", TENNIS_COURT: "🎾", BADMINTON_COURT: "🏸", PARTY_HALL: "🎉", OTHER: "🏢" };
