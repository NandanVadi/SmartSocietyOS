# SmartSocietyOS — Darsh Presentation Roadmap

## 1. My Responsibility in the Project

As the primary frontend developer, you are responsible for the entire user interface, state management, client-side routing, and connecting the application to the backend API.

**My Commits in Git History:**
1. `250f327` — Initialize frontend structure and configurations
2. `d34d93c` — Implement frontend entry points and global styling
3. `4a704c3` — Add frontend state management and utility functions
4. `7e71790` — Build reusable UI components and assets
5. `3a54086` — Implement main pages and integrate frontend with backend
6. `b04383a` — Finalize project integration and cleanup

**What I should know about Nandan's work (Backend):**
Nandan built the Express.js API and MongoDB database. His server handles the actual business logic, password hashing, and token generation. Whenever the frontend needs to save or fetch data, it must make an HTTP request to Nandan's API routes. Nandan's server enforces security on the backend by validating the JWT token we send in the headers.

---

## 2. Big Picture: Application Architecture

```text
User Interaction (Clicks Login)
 ↓
React Component (`Login.jsx` state updates)
 ↓
Axios API Call (`API.post('/auth/login')`)
 ↓ (Wait for network)
Backend processes request (Nandan's code)
 ↓
Response Data Received (JWT Token & User Data)
 ↓
React Context (`AuthContext.jsx` saves token & triggers re-render)
 ↓
React Router (`App.jsx` dynamically changes view based on role)
```

---

## 3. Feature/Module 1: Protected Routing

### What it does
It ensures that unauthenticated users cannot access private pages, and restricts users to only see pages meant for their specific role (e.g., Residents can't see Super Admin pages).

### Files involved
`frontend/src/App.jsx`

### Important code

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
- `const { user } = useAuth()` consumes the global authentication state from our React Context.
- `if (!user)` checks if the user is logged out. If they are, it redirects them to the login page immediately.
- `if (roles && !roles.includes(user.role))` checks if the page requires specific roles, and whether the logged-in user possesses one of those roles. If not, it kicks them to their default dashboard.
- `return children` renders the requested page if all security checks pass.

### What examiner might ask

**Q: How do you prevent a resident from accessing the admin dashboard?**
**A:** We use the `<Guard>` component in React Router. We pass an array of allowed roles to it. Before rendering the requested route, the Guard checks the current user's role from the global context against the allowed roles. If it doesn't match, they are redirected via `<Navigate>`.

---

## 4. Feature/Module 2: Global State Management

### What it does
It stores the user's session (JWT Token and Profile Data) globally so that any component in the app can access it without having to pass props down multiple levels.

### Files involved
`frontend/src/context/AuthContext.jsx`

### Important code

```jsx
// ACTUAL CODE FROM THE PROJECT (frontend/src/context/AuthContext.jsx)
  const login = useCallback((token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setSession({ token, user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSession({ token: null, user: null });
  }, []);
```

### Line-by-line explanation
- `localStorage.setItem` saves the authentication token and user data directly to the browser. This ensures the user stays logged in even if they refresh the page or close the tab.
- `JSON.stringify(user)` is necessary because `localStorage` can only store strings, not JavaScript objects.
- `setSession({ token, user })` updates the React State. Because this is provided via Context, updating this state automatically triggers a re-render for any component using `useAuth()`.

### What examiner might ask

**Q: Why do you store the token in both React state and localStorage?**
**A:** React state (`setSession`) is required so our UI updates immediately when the user logs in or out. However, React state clears when the page refreshes. We use `localStorage` for persistence, so we can rehydrate the state when the user comes back to the site.

---

## 5. Feature/Module 3: API Integration & Component Logic

### What it does
This is how the frontend actually talks to the backend. It takes user input from a form, sends it to the server, and handles the loading and error states.

### Files involved
`frontend/src/pages/Login.jsx`

### Important code

```jsx
// ACTUAL CODE FROM THE PROJECT (frontend/src/pages/Login.jsx)
  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await API.post("/auth/login", { email: form.email.trim(), password: form.password });
      login(data.token, data.user);
      navigate(ROLE_HOME[data.user.role] || "/", { replace: true });
    } catch (err) {
      setError(errMsg(err, "Login failed. Please try again."));
    } finally { 
      setLoading(false); 
    }
  };
```

### Line-by-line explanation
- `e.preventDefault()` stops the browser from doing a traditional page reload when the form is submitted.
- `setLoading(true)` updates the UI to show a loading spinner or disable the button to prevent double-clicks.
- `await API.post(...)` uses Axios to send a POST request containing the email and password to Nandan's backend.
- `login(...)` is called from our AuthContext to save the newly received token globally.
- `navigate(...)` programmatically redirects the user to their specific dashboard based on their role.

### What examiner might ask

**Q: What happens if the backend server is down or returns a 500 error?**
**A:** The `try...catch` block handles it. The `await API.post` will throw an error, execution will jump to the `catch (err)` block, and `setError()` will update the UI to display a user-friendly error message without crashing the application.

---

## 6. MOST IMPORTANT CODE TO MEMORIZE

### ⭐⭐⭐ MUST KNOW
- **`App.jsx -> Guard component`**: Understand how Protected Routes work in React.
- **`Login.jsx -> submit()`**: Understand how forms are handled, how API calls are made, and how `try/catch` is used.

### ⭐⭐ SHOULD KNOW
- **`AuthContext.jsx`**: Understand how Context provides global state and how `localStorage` persists data.

### ⭐ GOOD TO KNOW
- **Component State**: Know how `useState` hooks are used to bind input fields to React variables (`onChange={(e) => setForm(...)}`).

---

## 7. End-to-End Flow Darsh Should Know

**Scenario:** A user logs in.
1. User types in the input fields. React's `onChange` updates the local `form` state.
2. User clicks "Sign in". The `submit` function fires and calls `e.preventDefault()`.
3. The frontend makes an HTTP POST request via Axios (`API.post`) to the backend.
4. We wait for the backend to respond.
5. Once data is returned, we call `login(data.token, data.user)` to save it in `AuthContext` and `localStorage`.
6. Finally, we use React Router's `navigate()` to redirect the user to their specific dashboard based on their role (e.g. `/resident`).

---

## 8. Emergency Revision

### If I only have 30 minutes:
Study the `submit` function inside `frontend/src/pages/Login.jsx`. It shows everything about how React handles forms, state, async API calls, error handling, and routing.

### If I have 1 hour:
Study `Login.jsx` AND the `Guard` component inside `frontend/src/App.jsx`. You need to be able to explain how you prevent unauthorized users from accessing certain pages.

### If I have 2 hours:
Study the above, plus review `frontend/src/context/AuthContext.jsx` to explain how global state and `localStorage` work together to keep the user logged in.
