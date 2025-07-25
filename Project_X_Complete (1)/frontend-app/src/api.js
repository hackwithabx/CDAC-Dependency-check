import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000"; // Adjust if backend runs on a different port

export const api = axios.create({
  baseURL: BASE_URL,
});

// Example: Login request
export function loginUser(username, password) {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  return api.post("/login", formData);
}

// Example: Register request
export function registerUser(username, password) {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  return api.post("/register", formData);
}

// Example: Fetch scan history
export function fetchScanHistory(username) {
  return api.get(`/scan_history/${username}`);
}

// Example: Fetch dashboard stats
export function fetchDashboardStats() {
  return api.get(`/dashboard-stats`);
}
