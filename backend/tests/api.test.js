const B = "http://localhost:5000/api";
let pass = 0, fail = 0;
const tok = {};
async function call(method, path, body, role) {
  const r = await fetch(B + path, {
    method,
    headers: { "Content-Type": "application/json", ...(role ? { Authorization: "Bearer " + tok[role] } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let d = {}; try { d = await r.json(); } catch {}
  return { s: r.status, d };
}
function t(name, cond, extra = "") {
  if (cond) { pass++; console.log("  ✔", name); } else { fail++; console.log("  ✘ FAIL:", name, extra); }
}
(async () => {
  console.log("AUTH");
  for (const [k, e] of Object.entries({ SA: "superadmin", AD: "admin", CM: "committee", RS: "resident", SG: "security", MS: "maintenance" })) {
    const r = await call("POST", "/auth/login", { email: `${e}@smartsociety.com`, password: "password123" });
    t(`login ${k}`, r.s === 200 && r.d.token); tok[k] = r.d.token; if (k === "RS") global.resUser = r.d.user; if (k==="MS") global.msUser=r.d.user;
  }
  t("bad password rejected", (await call("POST", "/auth/login", { email: "admin@smartsociety.com", password: "x" })).s === 401);
  t("no token rejected", (await call("GET", "/complaints/my")).s === 401);
  const pubs = await call("GET", "/societies/public");
  const sid = pubs.d.societies[0]._id;
  t("public societies", pubs.s === 200 && sid);
  const reg = await call("POST", "/auth/register", { name: "Hacker", email: "h@x.com", password: "secret1", role: "SUPER_ADMIN", societyId: sid, flatNumber: "Z-1" });
  t("register ignores role escalation (forced RESIDENT)", reg.s === 201 && reg.d.user.role === "RESIDENT", JSON.stringify(reg.d));
  t("duplicate register rejected", (await call("POST", "/auth/register", { name: "H", email: "h@x.com", password: "secret1", societyId: sid })).s === 400);
  t("short password rejected", (await call("POST", "/auth/register", { name: "H", email: "h2@x.com", password: "1", societyId: sid })).s === 400);
  const cu = await call("POST", "/auth/users", { name: "Guard2", email: "g2@x.com", password: "secret1", role: "SECURITY_GUARD" }, "AD");
  t("admin creates staff user", cu.s === 201, JSON.stringify(cu.d));
  t("admin cannot create SUPER_ADMIN", (await call("POST", "/auth/users", { name: "X", email: "s@x.com", password: "secret1", role: "SUPER_ADMIN" }, "AD")).s === 403);
  t("resident cannot create users", (await call("POST", "/auth/users", { name: "X", email: "s@x.com", password: "secret1", role: "RESIDENT" }, "RS")).s === 403);
  t("profile", (await call("GET", "/auth/profile", null, "RS")).s === 200);
  const up = await call("PUT", "/auth/profile", { phone: "+91 1234567890" }, "RS");
  t("update profile", up.s === 200 && up.d.user.phone === "+91 1234567890" && !up.d.user.password);
  t("password change wrong current", (await call("PUT", "/auth/profile", { currentPassword: "bad", newPassword: "abcdef" }, "RS")).s === 400);

  console.log("SOCIETIES");
  t("SA list societies", (await call("GET", "/societies", null, "SA")).s === 200);
  t("AD cannot list all societies", (await call("GET", "/societies", null, "AD")).s === 403);
  const an = await call("GET", "/societies/analytics", null, "SA");
  t("platform analytics", an.s === 200 && an.d.totalUsers >= 6);
  t("all users", (await call("GET", "/societies/users/all", null, "SA")).s === 200);
  const mem = await call("GET", "/societies/members", null, "AD");
  t("members (no id)", mem.s === 200 && mem.d.users.length >= 6);
  const mem2 = await call("GET", `/societies/${sid}/members`, null, "AD");
  t("members (with id)", mem2.s === 200 && mem2.d.users.length >= 6);
  const ns = await call("POST", "/societies", { name: "Test Soc", address: "1 St", city: "Pune", state: "MH", pincode: "411001", totalFlats: 10 }, "SA");
  t("create society", ns.s === 201);
  t("create society validation", (await call("POST", "/societies", { name: "x" }, "SA")).s === 400);
  const other = ns.d.society._id;
  t("update society", (await call("PUT", `/societies/${other}`, { totalFlats: 20 }, "SA")).d.society?.totalFlats === 20);
  t("admin cannot read other society members", (await call("GET", `/societies/${other}/members`, null, "AD")).d.users.every(u => u.societyId?._id === sid));

  console.log("COMPLAINTS");
  const c = await call("POST", "/complaints", { title: "Leak", description: "Tap leaking", category: "PLUMBING", priority: "HIGH" }, "RS");
  t("create complaint", c.s === 201); const cid = c.d.complaint._id;
  t("complaint validation", (await call("POST", "/complaints", { title: "" }, "RS")).s === 400);
  t("my complaints", (await call("GET", "/complaints/my", null, "RS")).d.complaints.length >= 4);
  t("admin all complaints", (await call("GET", "/complaints", null, "AD")).d.complaints.length >= 4);
  t("committee all complaints", (await call("GET", "/complaints", null, "CM")).s === 200);
  const as = await call("PUT", `/complaints/${cid}`, { assignedTo: global.msUser.id }, "AD");
  t("assign auto moves to IN_PROGRESS", as.s === 200 && as.d.complaint.status === "IN_PROGRESS", JSON.stringify(as.d));
  t("assign to non-staff rejected", (await call("PUT", `/complaints/${cid}`, { assignedTo: global.resUser.id }, "AD")).s === 400);
  t("maintenance assigned list", (await call("GET", "/complaints/assigned", null, "MS")).d.complaints.some(x => x._id === cid));
  const rs = await call("PUT", `/complaints/${cid}`, { status: "RESOLVED", remarks: "fixed" }, "MS");
  t("maintenance resolves", rs.s === 200 && rs.d.complaint.resolvedAt);
  t("invalid status rejected", (await call("PUT", `/complaints/${cid}`, { status: "BOGUS" }, "AD")).s === 400);
  const seeded = (await call("GET", "/complaints", null, "AD")).d.complaints.find(x => !x.assignedTo);
  t("maintenance cannot touch unassigned complaint", (await call("PUT", `/complaints/${seeded._id}`, { status: "RESOLVED" }, "MS")).s === 404);
  t("complaint stats", (await call("GET", "/complaints/stats", null, "AD")).d.stats.length > 0);

  console.log("VISITORS");
  const v = await call("POST", "/visitors", { name: "Guest", phone: "999", purpose: "Family", vehicleNumber: "MH01" }, "RS");
  t("register visitor + QR", v.s === 201 && v.d.visitor.qrCodeImage?.startsWith("data:image"));
  t("visitor validation", (await call("POST", "/visitors", { name: "x" }, "RS")).s === 400);
  const qr = v.d.visitor.qrCode, vid = v.d.visitor._id;
  t("my visitors", (await call("GET", "/visitors/my", null, "RS")).d.visitors.length >= 3);
  const vf = await call("POST", "/visitors/verify", { qrCode: qr }, "SG");
  t("verify returns CHECKED_IN status", vf.s === 200 && vf.d.valid && vf.d.visitor.status === "CHECKED_IN", JSON.stringify(vf.d.visitor?.status));
  const vf2 = await call("POST", "/visitors/verify", { qrCode: qr }, "SG");
  t("re-verify says already checked in", vf2.d.message === "Already checked in");
  t("invalid QR 404", (await call("POST", "/visitors/verify", { qrCode: "nope" }, "SG")).s === 404);
  t("today visitors", (await call("GET", "/visitors/today", null, "SG")).d.visitors.length >= 3);
  t("all visitors (admin)", (await call("GET", "/visitors/all", null, "AD")).s === 200);
  t("logs", (await call("GET", "/visitors/logs", null, "SG")).d.visitors.length >= 2);
  t("checkout", (await call("PUT", `/visitors/${vid}/checkout`, null, "SG")).d.visitor.status === "CHECKED_OUT");
  t("double checkout rejected", (await call("PUT", `/visitors/${vid}/checkout`, null, "SG")).s === 404);
  t("resident cannot verify", (await call("POST", "/visitors/verify", { qrCode: qr }, "RS")).s === 403);

  console.log("BILLING");
  const mb = await call("GET", "/billing/bills/my", null, "RS");
  const pend = mb.d.bills.find(b => b.status === "PENDING");
  t("my bills", mb.s === 200 && pend);
  t("admin cannot pay bills", (await call("PUT", `/billing/bills/${pend._id}/pay`, {}, "AD")).s === 403);
  t("pay bill", (await call("PUT", `/billing/bills/${pend._id}/pay`, {}, "RS")).d.bill.status === "PAID");
  t("cannot pay twice", (await call("PUT", `/billing/bills/${pend._id}/pay`, {}, "RS")).s === 404);
  const ob = await call("POST", "/billing/bills", { residentId: global.resUser.id, type: "MAINTENANCE", amount: 1000, dueDate: "2020-01-01", month: "2020-01" }, "AD");
  t("create bill", ob.s === 201);
  const ov = (await call("GET", "/billing/bills/my", null, "RS")).d.bills.find(b => b._id === ob.d.bill._id);
  t("past-due bill auto OVERDUE", ov.status === "OVERDUE");
  t("bill validation", (await call("POST", "/billing/bills", { residentId: global.resUser.id }, "AD")).s === 400);
  const bk = await call("POST", "/billing/bills/bulk", { residentIds: [global.resUser.id], amount: 500, dueDate: "2030-01-01", type: "OTHER" }, "AD");
  t("bulk bills", bk.s === 201 && bk.d.bills.length === 1, JSON.stringify(bk.d));
  t("all bills", (await call("GET", "/billing/bills/all", null, "AD")).d.bills.length >= 4);
  const bs = await call("GET", "/billing/bills/stats", null, "AD");
  t("billing stats", bs.s === 200 && bs.d.totalRevenue >= 3500 && Array.isArray(bs.d.monthly));
  t("committee billing stats", (await call("GET", "/billing/bills/stats", null, "CM")).s === 200);

  console.log("NOTICES");
  const n = await call("POST", "/billing/notices", { title: "Test", content: "Hello", category: "GENERAL", priority: "LOW" }, "CM");
  t("committee creates notice", n.s === 201); const nid = n.d.notice._id;
  t("notice validation", (await call("POST", "/billing/notices", { title: "x" }, "CM")).s === 400);
  const nl = await call("GET", "/billing/notices", null, "RS");
  t("resident sees notices", nl.d.notices.some(x => x._id === nid));
  t("update notice", (await call("PUT", `/billing/notices/${nid}`, { title: "Test2" }, "AD")).d.notice.title === "Test2");
  t("resident cannot create notice", (await call("POST", "/billing/notices", { title: "x", content: "y" }, "RS")).s === 403);
  t("delete notice", (await call("DELETE", `/billing/notices/${nid}`, null, "AD")).s === 200);
  t("deleted notice hidden", !(await call("GET", "/billing/notices", null, "RS")).d.notices.some(x => x._id === nid));
  const exp = await call("POST", "/billing/notices", { title: "Expired", content: "old", expiresAt: "2020-01-01" }, "AD");
  t("expired notice hidden", !(await call("GET", "/billing/notices", null, "RS")).d.notices.some(x => x._id === exp.d.notice._id));

  console.log("FACILITIES & PARKING");
  const fl = await call("GET", "/facilities", null, "RS");
  t("list facilities", fl.d.facilities.length === 3);
  const pool = fl.d.facilities.find(f => f.type === "SWIMMING_POOL");
  const nf = await call("POST", "/facilities", { name: "Tennis", type: "TENNIS_COURT", capacity: 4, pricePerHour: 200 }, "AD");
  t("create facility", nf.s === 201);
  t("update facility", (await call("PUT", `/facilities/${nf.d.facility._id}`, { pricePerHour: 250 }, "AD")).d.facility.pricePerHour === 250);
  const d = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const bkg = await call("POST", "/facilities/bookings", { facilityId: pool._id, date: d, startTime: "10:00", endTime: "12:00" }, "RS");
  t("create booking (cost=200)", bkg.s === 201 && bkg.d.booking.totalAmount === 200, JSON.stringify(bkg.d));
  t("conflict rejected", (await call("POST", "/facilities/bookings", { facilityId: pool._id, date: d, startTime: "11:00", endTime: "13:00" }, "RS")).s === 400);
  t("outside hours rejected", (await call("POST", "/facilities/bookings", { facilityId: pool._id, date: d, startTime: "05:00", endTime: "07:00" }, "RS")).s === 400);
  t("end<start rejected", (await call("POST", "/facilities/bookings", { facilityId: pool._id, date: d, startTime: "12:00", endTime: "10:00" }, "RS")).s === 400);
  t("past date rejected", (await call("POST", "/facilities/bookings", { facilityId: pool._id, date: "2020-01-01", startTime: "10:00", endTime: "11:00" }, "RS")).s === 400);
  t("my bookings", (await call("GET", "/facilities/bookings/my", null, "RS")).d.bookings.length === 1);
  t("all bookings (committee)", (await call("GET", "/facilities/bookings/all", null, "CM")).d.bookings.length === 1);
  t("approve booking", (await call("PUT", `/facilities/bookings/${bkg.d.booking._id}`, { status: "APPROVED" }, "AD")).d.booking.status === "APPROVED");
  t("delete facility", (await call("DELETE", `/facilities/${nf.d.facility._id}`, null, "AD")).s === 200);
  const pk = await call("GET", "/facilities/parking", null, "AD");
  t("parking list", pk.d.slots.length === 4);
  t("create slot", (await call("POST", "/facilities/parking", { slotNumber: "P-200", type: "FOUR_WHEELER" }, "AD")).s === 201);
  t("duplicate slot rejected", (await call("POST", "/facilities/parking", { slotNumber: "P-200" }, "AD")).s === 400);
  const free = pk.d.slots.find(s => s.status === "AVAILABLE");
  const al = await call("PUT", `/facilities/parking/${free._id}/allocate`, { userId: global.resUser.id, vehicleNumber: "MH-01", vehicleModel: "Swift" }, "AD");
  t("allocate slot", al.s === 200 && al.d.slot.status === "OCCUPIED");
  t("cannot allocate occupied slot", (await call("PUT", `/facilities/parking/${free._id}/allocate`, { userId: global.resUser.id }, "AD")).s === 400);
  const rel = await call("PUT", `/facilities/parking/${free._id}`, { status: "AVAILABLE" }, "AD");
  t("release slot clears owner", rel.d.slot.allocatedTo === null && rel.d.slot.vehicleNumber === null);

  console.log("MARKETPLACE");
  const ml = await call("POST", "/marketplace", { title: "Bike", description: "Old bike", category: "SELL", price: 1500 }, "RS");
  t("create listing", ml.s === 201);
  t("listing validation", (await call("POST", "/marketplace", { title: "x" }, "RS")).s === 400);
  t("list", (await call("GET", "/marketplace", null, "CM")).d.listings.length >= 3);
  t("category filter", (await call("GET", "/marketplace?category=BUY", null, "RS")).d.listings.every(l => l.category === "BUY"));
  t("my listings", (await call("GET", "/marketplace/my", null, "RS")).d.listings.length >= 3);
  t("update listing", (await call("PUT", `/marketplace/${ml.d.listing._id}`, { price: 1200 }, "RS")).d.listing.price === 1200);
  t("analytics", (await call("GET", "/marketplace/analytics", null, "AD")).d.totalListings >= 3);
  t("admin moderates listing", (await call("DELETE", `/marketplace/${ml.d.listing._id}`, null, "AD")).s === 200);
  t("delete missing → 404", (await call("DELETE", `/marketplace/${ml.d.listing._id}x`, null, "RS")).s >= 400);

  console.log("EMERGENCY");
  const em = await call("POST", "/emergency/trigger", { type: "FIRE", description: "smoke" }, "RS");
  t("trigger SOS", em.s === 201); const eid = em.d.emergency._id;
  t("duplicate SOS returns existing", (await call("POST", "/emergency/trigger", { type: "FIRE" }, "RS")).d.emergency._id === eid);
  t("my active", (await call("GET", "/emergency/my-active", null, "RS")).d.emergency._id === eid);
  t("guard sees active", (await call("GET", "/emergency/active", null, "SG")).d.emergencies.length === 1);
  t("invalid status rejected", (await call("PUT", `/emergency/${eid}/status`, { status: "FOO" }, "SG")).s === 400);
  t("dispatch", (await call("PUT", `/emergency/${eid}/status`, { status: "DISPATCHED" }, "SG")).d.emergency.dispatchedAt);
  t("resolve", (await call("PUT", `/emergency/${eid}/status`, { status: "RESOLVED" }, "SG")).d.emergency.resolvedAt);
  t("cannot re-update closed", (await call("PUT", `/emergency/${eid}/status`, { status: "DISPATCHED" }, "SG")).s === 404);
  t("logs", (await call("GET", "/emergency/logs", null, "AD")).d.emergencies.length >= 1);
  const e2 = await call("POST", "/emergency/trigger", { type: "MEDICAL" }, "RS");
  t("cancel false alarm", (await call("PUT", `/emergency/${e2.d.emergency._id}/cancel`, null, "RS")).d.emergency.status === "CANCELLED");

  console.log("MISC");
  t("404 route", (await call("GET", "/nope")).s === 404);
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
