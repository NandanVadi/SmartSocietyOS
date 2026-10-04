# SmartSocietyOS

A role-based society management platform — **React (Vite) frontend + Node/Express/MongoDB backend**.
Six portals (Super Admin, Society Admin, Committee, Resident, Security Guard, Maintenance) sharing one API.

## Quick start

```bash
# 1. Backend
cd backend
cp .env.example .env        # then fill in MONGO_URI and JWT_SECRET (or reuse your existing .env)
npm install
npm run seed                # creates demo society + 6 demo accounts + sample data
npm start                   # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

The frontend talks to `http://localhost:5000/api` by default. To change it, copy `frontend/.env.example` to `frontend/.env` and edit `VITE_API_URL`.

Backend API tests (server must be running): `cd backend && npm test`

## Demo accounts — password `password123`

| Role | Email |
|---|---|
| Resident | resident@smartsociety.com |
| Society Admin | admin@smartsociety.com |
| Committee Member | committee@smartsociety.com |
| Security Guard | security@smartsociety.com |
| Maintenance Staff | maintenance@smartsociety.com |
| Super Admin | superadmin@smartsociety.com |

The login page has one-click buttons for each of these.

## Suggested demo script (≈5 min)

1. **Resident** → press the red **SOS** button, pick *Fire*, send.
2. **Security Guard** (second browser/incognito) → siren card appears live → *Dispatch team*. Resident's banner flips to *Help dispatched*.
3. **Resident** → *Visitors → Invite visitor* → QR pass is generated.
4. **Guard** → *QR Verification* → paste token → *Access granted*; later *Check out* from the dashboard.
5. **Admin** → *Billing → Create bill* (use a past due date → shows **Overdue**), *Complaints → Manage → assign to staff*, *Facilities → approve booking*.
6. **Maintenance** → *Work Orders → Complete* with notes → Resident sees remarks on the complaint.
7. **Super Admin** → *Societies → Add society → Admin → create administrator*.
8. Toggle **dark mode** (moon icon, top bar).

## Frontend ↔ backend map

| Screen | Endpoints used |
|---|---|
| Login / Register | `POST /auth/login`, `GET /societies/public`, `POST /auth/register` (residents only) |
| Profile (all roles) | `GET/PUT /auth/profile` (incl. password change) |
| Super Admin – Overview / Analytics | `GET /societies`, `/societies/analytics`, `/societies/users/all` |
| Super Admin – Societies | `POST/PUT /societies`, `POST /societies/:id/assign-admin`, `POST /auth/users` |
| Super Admin – Users | `GET /societies/users/all` |
| Admin – Dashboard | `/societies/members`, `/billing/bills/stats`, `/complaints/stats`, `/facilities/parking`, `/visitors/today`, `/complaints` |
| Admin – Members | `GET /societies/members`, `POST /auth/users` (add resident/committee/guard/staff) |
| Admin / Committee – Complaints | `GET /complaints`, `PUT /complaints/:id`, `GET /societies/members` |
| Admin – Billing | `/billing/bills/all`, `/billing/bills/stats`, `POST /billing/bills`, `POST /billing/bills/bulk` |
| Admin / Committee – Notices | `GET/POST/PUT/DELETE /billing/notices` |
| Admin – Facilities & bookings | `/facilities` CRUD, `/facilities/bookings/all`, `PUT /facilities/bookings/:id` (Committee: read-only) |
| Admin – Parking | `/facilities/parking`, `PUT …/allocate`, `PUT …/:id` (release / maintenance) |
| Admin – Visitors | `GET /visitors/all` (read-only; guards do check-in/out) |
| Admin / Guard – SOS | `GET /emergency/active`, `/emergency/logs`, `PUT /emergency/:id/status` |
| Admin – Marketplace | `GET /marketplace`, `/marketplace/analytics`, `DELETE /marketplace/:id` |
| Committee – Reports | `/complaints/stats`, `/billing/bills/stats` |
| Resident – Dashboard | `/billing/bills/my`, `/complaints/my`, `/visitors/my`, `/billing/notices` |
| Resident – Bills | `GET /billing/bills/my`, `PUT /billing/bills/:id/pay` (pending **and** overdue) |
| Resident – Complaints | `GET /complaints/my`, `POST /complaints` |
| Resident – Visitors | `GET /visitors/my`, `POST /visitors` (QR returned as image) |
| Resident – Facilities | `GET /facilities`, `GET/POST /facilities/bookings(/my)` |
| Resident / Committee – Marketplace | `/marketplace`, `/marketplace/my`, `POST/PUT/DELETE` (mark sold) |
| Resident / Committee – SOS | `POST /emergency/trigger`, `GET /emergency/my-active`, `PUT /emergency/:id/cancel` |
| Guard – Dashboard | `GET /visitors/today`, `PUT /visitors/:id/checkout` |
| Guard – QR Verification | `POST /visitors/verify` |
| Guard – Logs | `GET /visitors/logs` |
| Maintenance – Dashboard / Work orders | `GET /complaints/assigned`, `PUT /complaints/:id` |

## Project layout

```
backend/   Express API (routes → controllers → Mongoose models), seed script, API tests
frontend/  React app: src/pages/<role>/*, shared UI in src/components, API client in src/utils/api.js
```
