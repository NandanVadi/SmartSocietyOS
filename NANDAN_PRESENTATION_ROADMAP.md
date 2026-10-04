# SmartSocietyOS — Nandan Presentation Roadmap

## 1. My Responsibility in the Project

I am responsible for approximately half of the application's end-to-end features, specifically focusing on **Authentication/User Management**, **Billing/Invoicing**, and the **Marketplace & Notice Board**. For these features, I handled everything from the database models and backend APIs to the React frontend integration. I also managed the final integration and test coverage.

**My Commits in Git History:**
1. `7b6eea6` — Implement authentication, role-based access control, and user management
2. `c55069f` — Implement society billing, invoicing, and payment tracking
3. `b876db1` — Develop resident marketplace and society notice board features
4. `fa3b43e` — Finalize end-to-end integration, add seeders, and backend tests

**What I should know about Darsh's work:**
Darsh handled the **Project Skeleton**, **Visitor/Security Management**, **Complaints/Maintenance**, and **Facilities/Dashboards**. If asked, I know that his visitor workflow uses QR codes (generated on the frontend and validated by his backend controller), and his complaint system allows residents to raise tickets which admins assign to maintenance staff. I understand his features conceptually, but I am the expert on Auth, Billing, and the Marketplace.

---

## 2. End-to-End Flow (My Module Example: Authentication)

```text
User Submits Login Form (`frontend/src/pages/Login.jsx`)
 ↓
Frontend Axios Call (`API.post('/auth/login')`)
 ↓
Backend Express Route (`backend/src/routes/authRoutes.js`)
 ↓
Backend Controller (`backend/src/controllers/authController.js`)
 ↓
Database Validation (`User.findOne` & Bcrypt Password Check)
 ↓
JWT Token Generated & Sent in Response
 ↓
Frontend Context updates globally (`AuthContext.jsx`)
 ↓
React Router redirects user to their specific dashboard
```

---

## 3. Feature 1: Authentication & User Management

### What it does
It provides a secure, role-based login and registration system. Users receive a JWT token upon logging in, which dictates what they can access.

### Files involved
- **Frontend:** `frontend/src/pages/Login.jsx`, `frontend/src/context/AuthContext.jsx`
- **Backend:** `backend/src/controllers/authController.js`, `backend/src/models/User.js`

### Important code

### File
`backend/src/controllers/authController.js`

### Function
`login()`

### Original code

```javascript
// ACTUAL CODE FROM THE PROJECT (backend/src/controllers/authController.js)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email }).populate("societyId", "name");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, societyId: user.societyId?._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        societyId: user.societyId?._id || null,
        societyName: user.societyId?.name || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};
```

### Line-by-line explanation
- `await User.findOne({ email })` queries MongoDB to find the user.
- `.populate("societyId", "name")` acts like a SQL JOIN, fetching the actual society name rather than just the ID.
- `bcrypt.compare` safely verifies the password hash without decrypting the stored password.
- `jwt.sign(...)` creates an encrypted token containing the user's role, meaning the frontend and future API requests know exactly who this user is.

### Examiner Questions

**Q: Why do you return "Invalid email or password" instead of telling them exactly which one is wrong?**
**A:** This prevents malicious attackers from "enumerating" emails to figure out which email addresses are registered in our database.

**Q: Why is `await` used here?**
**A:** Database lookups and bcrypt operations are asynchronous. We must pause the function and wait for them to finish before we can make decisions based on their results.

---

## 4. Feature 2: Billing, Invoicing & Payments

### What it does
Admins can generate maintenance bills for residents. Residents can view their pending bills and mark them as paid.

### Files involved
- **Frontend:** `frontend/src/pages/admin/AdminBilling.jsx`, `frontend/src/pages/resident/ResidentBills.jsx`
- **Backend:** `backend/src/controllers/billingController.js`, `backend/src/models/Bill.js`

### Important code

### File
`backend/src/controllers/billingController.js`

### Function
`createBill()`

### Original code

```javascript
// ACTUAL CODE FROM THE PROJECT (backend/src/controllers/billingController.js)
const createBill = async (req, res) => {
  try {
    const { userId, title, amount, dueDate, type, description } = req.body;
    const adminId = req.user.id;
    const societyId = req.user.societyId;

    if (!userId || !title || !amount || !dueDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const resident = await User.findOne({ _id: userId, societyId, role: "RESIDENT" });
    if (!resident) return res.status(404).json({ message: "Resident not found in your society" });

    const bill = await Bill.create({
      societyId,
      userId,
      generatedBy: adminId,
      title,
      description,
      amount,
      type: type || "MAINTENANCE",
      dueDate,
      status: "PENDING"
    });

    res.status(201).json({ message: "Bill generated successfully", bill });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate bill", error: error.message });
  }
};
```

### Line-by-line explanation
- `req.user.id` and `req.user.societyId` are extracted from the authenticated user's JWT token by the auth middleware. This ensures the admin can only create bills for their own society.
- `User.findOne(...)` verifies that the target user actually exists, belongs to the same society as the admin, and is indeed a RESIDENT.
- `Bill.create(...)` saves the new bill to the MongoDB database with a default status of "PENDING".

### Examiner Questions

**Q: How do you ensure an admin cannot bill a resident in a completely different society?**
**A:** I pull the `societyId` directly from the Admin's verified JWT token (`req.user.societyId`), and then I run a query `User.findOne({ _id: userId, societyId })`. If the resident's `societyId` doesn't match the admin's, the query fails.

---

## 5. MOST IMPORTANT CODE TO MEMORIZE

### ⭐⭐⭐ MUST KNOW
- **`backend/src/controllers/authController.js` -> `login()`**: The core of how the app handles security.
- **`backend/src/controllers/billingController.js` -> `createBill()`**: Demonstrates typical CRUD logic and ownership validation.

### ⭐⭐ SHOULD KNOW
- **`frontend/src/context/AuthContext.jsx`**: Understand how the JWT token returned by your API is saved in React `localStorage`.

### ⭐ GOOD TO KNOW
- **`backend/src/models/User.js`**: Understand how Mongoose schemas work and how `ref` relates collections.

---

## 6. Emergency Revision

### If I only have 30 minutes:
Study `authController.js` (Login and Registration). Be fully prepared to explain JWTs, Bcrypt, and how your backend validates incoming credentials.

### If I have 1 hour:
Study the above AND `billingController.js`. Understand how you validate that the admin creating a bill actually has jurisdiction over the resident they are billing (using the `societyId` from the JWT token).

### If I have 2 hours:
Study the above AND review the frontend `AuthContext.jsx` and `Login.jsx` to ensure you can explain the entire end-to-end flow of how your backend integrates with Darsh's frontend skeleton.
