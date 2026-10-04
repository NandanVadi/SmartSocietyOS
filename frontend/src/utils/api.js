import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token expired / was revoked, clear the session and go to the login page.
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const isAuthCall = err.config?.url?.startsWith("/auth/login");
    if (status === 401 && !isAuthCall) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.startsWith("/login")) window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);

// Human readable message from any axios error
export const errMsg = (e, fallback = "Something went wrong") =>
  e?.response?.data?.message || (e?.code === "ERR_NETWORK" ? "Cannot reach the server. Is the backend running?" : e?.message) || fallback;

export default API;
