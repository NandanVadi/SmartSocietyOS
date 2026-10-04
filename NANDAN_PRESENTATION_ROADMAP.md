# SmartSocietyOS — Nandan Presentation Roadmap

## 1. My Responsibility in the Project

As the primary backend developer, you are responsible for the entire server-side architecture. This includes the database design, server initialization, authentication systems, security middleware, and RESTful API development.

**My Commits in Git History:**
1. `56397d5` — Initialize project structure and base configurations
2. `d9954e1` — Add database schemas, models, and configuration
3. `c0881ce` — Implement backend foundation and middleware
4. `e2a7922` — Create APIs, controllers, and routing logic
5. `13ffd43` — Add backend tests and database seeding scripts

**What I should know about Darsh's work (Frontend):**
Darsh handled the UI (React/Vite). He structured the frontend into contexts (global state), components (reusable UI), and pages. His routing layer (`App.jsx`) restricts users based on roles before they even make a request to my backend. His `API` utilities intercept my backend's responses and handle JWT injection on every request.

---

## 2. Big Picture: Application Architecture

```text
User (Web Browser)
 ↓ (HTTP Request over Network)
Backend Server (Express)
 ↓ (Route Matching)
Middleware (Authenticates JWT token)
 ↓ (Request passed)
Controller (Business Logic: Validate, process)
 ↓ (Mongoose ODM)
MongoDB Database
 ↓ (Returns Data)
Controller formats response
 ↓ (HTTP 200/400/500 JSON)
Frontend (Darsh's code parses and renders it)
```

---

## 3. Feature/Module 1: Server Initialization & Database

### What it does
It connects to the MongoDB database and starts listening for HTTP requests on the specified port.

### Files involved
`backend/src/server.js`

### Important code

```javascript
// ACTUAL CODE FROM THE PROJECT (backend/src/server.js)
require("dotenv").config();
const connectDB = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start accepting requests
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
```

### Line-by-line explanation
- `require("dotenv").config()` loads environment variables like the DB URI and Port.
- `connectDB().then(...)` ensures that the database is successfully connected *before* we start listening for user requests. 
- `app.listen(PORT, ...)` binds the Express app to the port so it can receive incoming HTTP requests.

### What examiner might ask

**Q: Why do you connect to the database before calling `app.listen()`?**
**A:** If we start the server without a database connection, incoming API requests will fail immediately. Waiting for the database ensures the server is completely ready to handle traffic before it opens the port.

---

## 4. Feature/Module 2: Database Schema (Mongoose)

### What it does
It defines the structure of a User document in the NoSQL MongoDB database, enforcing data types, required fields, and default values.

### Files involved
`backend/src/models/User.js`

### Important code

```javascript
// ACTUAL CODE FROM THE PROJECT (backend/src/models/User.js)
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "SOCIETY_ADMIN", "COMMITTEE_MEMBER", "RESIDENT", "SECURITY_GUARD", "MAINTENANCE_STAFF"],
      default: "RESIDENT"
    },
    societyId: { type: mongoose.Schema.Types.ObjectId, ref: "Society", default: null },
    // ...other fields
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
```

### Line-by-line explanation
- `mongoose.Schema` defines the blueprint.
- `unique: true` enforces that no two users can have the same email.
- `enum` restricts the `role` field to specific predefined string values.
- `ref: "Society"` creates a relationship (foreign key equivalent) connecting the user to a specific Society document.
- `{ timestamps: true }` automatically adds and manages `createdAt` and `updatedAt` fields.

### What examiner might ask

**Q: How does MongoDB enforce relationships if it's a NoSQL database?**
**A:** MongoDB doesn't enforce strict foreign keys like SQL. Instead, we use Mongoose's `ref` property. This allows us to use `.populate('societyId')` in our controllers to automatically fetch the related Society data when we query a User.

---

## 5. Feature/Module 3: Authentication & Business Logic

### What it does
It verifies a user's credentials against the database and issues a JSON Web Token (JWT) so the user can stay logged in.

### Files involved
`backend/src/controllers/authController.js`

### Important code

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
    // ...returns response
```

### Line-by-line explanation
- `User.findOne({ email })` queries the database for the email.
- `.populate("societyId", "name")` joins the society data so we can send the society name back to the frontend.
- `bcrypt.compare` securely hashes the incoming password and compares it against the stored hashed password without ever decrypting the stored one.
- `jwt.sign(...)` generates the secure token containing the user's ID and role, signed with a secret key.

### What examiner might ask

**Q: Why don't you return specific errors like "Password incorrect" or "Email not found"?**
**A:** For security reasons. Returning "Invalid email or password" prevents attackers from using our login endpoint to guess or enumerate which email addresses exist in our database.

**Q: Why is `await` used here?**
**A:** Database queries (`findOne`) and cryptographic operations (`bcrypt.compare`) are asynchronous. `await` pauses the function execution until the Promise resolves, preventing the code from proceeding before the data is ready.

---

## 6. MOST IMPORTANT CODE TO MEMORIZE

### ⭐⭐⭐ MUST KNOW
- **`authController.js -> login()`**: Understand JWT signing and Bcrypt comparison.
- **`User.js` model**: Understand how Mongoose schemas and relationships (`ref`) work.

### ⭐⭐ SHOULD KNOW
- **`server.js`**: Connecting to DB before listening on the port.

### ⭐ GOOD TO KNOW
- **Mongoose `populate()`**: Know how to explain that this is Mongoose's way of doing SQL-like JOINs.

---

## 7. End-to-End Flow Nandan Should Know

**Scenario:** A user logs in.
1. **Darsh's Frontend** sends a POST request with `{email, password}` to `/api/auth/login`.
2. **Express Router** (`authRoutes.js`) routes the request to the `login` function.
3. **Controller** (`authController.js`) extracts the email/password and queries the MongoDB Database using Mongoose (`User.findOne`).
4. **Bcrypt** compares the password.
5. **JWT** creates a signed token.
6. **Controller** sends a `200 OK` JSON response containing the token and user profile.
7. **Darsh's Frontend** saves the token and redirects the user.

---

## 8. Emergency Revision

### If I only have 30 minutes:
Read and fully understand the `login` function in `backend/src/controllers/authController.js`. It contains all the core backend concepts: Async/Await, Database querying, password hashing, JWTs, and error handling.

### If I have 1 hour:
Study the `login` function AND the Mongoose Schema in `backend/src/models/User.js`. Be ready to explain how `ref` and `populate` work.

### If I have 2 hours:
Study the above, plus review how `server.js` initializes the application and connects to the database. Review how controllers are connected to routes.
