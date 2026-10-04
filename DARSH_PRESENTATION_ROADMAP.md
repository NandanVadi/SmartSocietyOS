# SmartSocietyOS — Darsh Presentation Roadmap

## 1. My Responsibility in the Project

I am responsible for approximately half of the application's end-to-end features, specifically focusing on the **Project Skeleton/Architecture**, **Visitor & Security Management**, **Complaints & Maintenance**, and **Facilities & Dashboards**. For these features, I handled everything from the MongoDB schemas and backend APIs to the React frontend UI and state management.

**My Commits in Git History:**
1. `7bf1a7d` — Initialize project skeleton, global configurations, and base utilities
2. `cbaa1ad` — Build end-to-end visitor management and gate security workflows
3. `9a819d6` — Create complaint ticketing and maintenance staff assignment system
4. `7d599b7` — Add facility booking and parking allocation modules
5. `5503eff` — Implement emergency SOS and build role-specific dashboards

**What I should know about Nandan's work:**
Nandan handled **Authentication**, **Billing**, and the **Marketplace**. If asked, I know that his authentication system issues a JWT token which my frontend stores in `localStorage` and attaches to subsequent requests. I understand his features conceptually, but I am the expert on the Project Skeleton, Visitor/Security logic, Complaints, and the Dashboards.

---

## 2. End-to-End Flow (My Module Example: Visitor Approval)

```text
Resident Submits Visitor Form (`frontend/src/pages/resident/ResidentVisitors.jsx`)
 ↓
Frontend Axios Call (`API.post('/visitors')`)
 ↓
Backend Express Route (`backend/src/routes/visitorRoutes.js`)
 ↓
Backend Controller (`backend/src/controllers/visitorController.js`)
 ↓
Database Validation & Saving (`Visitor.create`)
 ↓
Returns success + unique Entry Code
 ↓
Frontend generates and displays QR Code using the Entry Code
```

---

## 3. Feature 1: Frontend Architecture & Protected Routes

### What it does
It ensures that unauthenticated users cannot access private pages, and restricts users to only see pages meant for their specific role (e.g., Residents can't see Super Admin pages).

### Files involved
- **Frontend:** `frontend/src/App.jsx`, `frontend/src/utils/api.js`

### Important code

### File
`frontend/src/App.jsx`

### Function
`Guard Component`

### Original code

```jsx
// ACTUAL CODE FROM THE PROJECT (frontend/src/App.jsx)
function Guard({ roles, children }) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || "/login"} replace />;
  }
  
  return children;
}

// Usage in App component:
const R = (path, roles, element) => <Route key={path} path={path} element={<Guard roles={roles}>{element}</Guard>} />;
```

### Line-by-line explanation
- `const { user } = useAuth()` accesses the globally stored user session state.
- `if (!user)` checks if they are completely logged out and redirects to `/login`.
- `if (roles && !roles.includes(user.role))` checks if the page requires specific roles (like `['SOCIETY_ADMIN']`), and bounces the user to their default dashboard if they don't have permission.
- `return children` renders the page successfully if all checks pass.

### Examiner Questions

**Q: If a Resident manually types `/admin` in the URL bar, what happens?**
**A:** The React Router tries to render the `<Guard>` component wrapped around the Admin route. The Guard checks the Resident's role, sees it doesn't match the required `['SOCIETY_ADMIN']` array, and immediately triggers a `<Navigate>` redirect before the page can even render.

---

## 4. Feature 2: Visitor Management & Gate Security

### What it does
Residents can pre-approve expected visitors. The system generates an entry code, which the security guard can verify at the gate to allow entry.

### Files involved
- **Frontend:** `frontend/src/pages/resident/ResidentVisitors.jsx`, `frontend/src/pages/security/SecurityVerify.jsx`
- **Backend:** `backend/src/controllers/visitorController.js`, `backend/src/models/Visitor.js`

### Important code

### File
`backend/src/controllers/visitorController.js`

### Function
`verifyVisitor()`

### Original code

```javascript
// ACTUAL CODE FROM THE PROJECT (backend/src/controllers/visitorController.js)
const verifyVisitor = async (req, res) => {
  try {
    const { entryCode } = req.body;
    if (!entryCode) return res.status(400).json({ message: "Entry code is required" });

    const visitor = await Visitor.findOne({ entryCode, societyId: req.user.societyId })
      .populate("hostId", "name flatNumber phone");

    if (!visitor) return res.status(404).json({ message: "Invalid entry code or not found" });

    if (visitor.status !== "PENDING") {
      return res.status(400).json({ 
        message: `Visitor is already marked as ${visitor.status}`,
        visitor 
      });
    }

    visitor.status = "APPROVED";
    visitor.entryTime = new Date();
    visitor.verifiedBy = req.user.id;
    await visitor.save();

    res.json({ message: "Visitor verified successfully", visitor });
  } catch (error) {
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
};
```

### Line-by-line explanation
- `Visitor.findOne({ entryCode, societyId: req.user.societyId })` ensures the guard can only verify codes meant for their specific society.
- `.populate("hostId", ...)` fetches the resident's details (flat number, phone) so the guard knows where the visitor is going.
- `if (visitor.status !== "PENDING")` prevents a code from being used twice.
- `visitor.status = "APPROVED"` and `await visitor.save()` updates the database to log the exact entry time and which guard verified them.

### Examiner Questions

**Q: How does the system prevent someone from using an old, already-used QR code?**
**A:** When the guard scans the code, my backend `verifyVisitor` controller checks if the visitor's status is still `"PENDING"`. If it has already been changed to `"APPROVED"`, the API immediately rejects the request with an error message.

**Q: Where does `req.user.societyId` come from?**
**A:** It comes from the JWT token that the security guard received when they logged in. Our API middleware decrypts the token and attaches the user's data to the `req` object.

---

## 5. MOST IMPORTANT CODE TO MEMORIZE

### ⭐⭐⭐ MUST KNOW
- **`backend/src/controllers/visitorController.js` -> `verifyVisitor()`**: Core logic for the security workflow.
- **`frontend/src/App.jsx` -> `<Guard>`**: Core logic for frontend architecture.

### ⭐⭐ SHOULD KNOW
- **`backend/src/controllers/complaintController.js` -> `updateComplaintStatus()`**: Understand how maintenance staff updates ticket status.

### ⭐ GOOD TO KNOW
- **`frontend/src/utils/api.js`**: Understand how Axios Interceptors automatically attach the JWT token to every request.

---

## 6. Emergency Revision

### If I only have 30 minutes:
Study `frontend/src/App.jsx` (the routing and guard logic) and `backend/src/controllers/visitorController.js`. You need to be able to explain how the frontend is protected and how a core end-to-end feature (visitors) works on the backend.

### If I have 1 hour:
Study the above AND `backend/src/controllers/complaintController.js`. Be ready to explain how users raise complaints and how you restrict maintenance staff to only updating tickets assigned to them.

### If I have 2 hours:
Study the above AND review `frontend/src/utils/api.js` to explain how Axios automatically injects the Auth token into the HTTP headers, acting as the bridge between your UI and your backend.
