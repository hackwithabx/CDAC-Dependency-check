import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation
} from "react-router-dom";

import Dashboard from "./components/Dashboard";
import ScanUpload from "./components/ScanUpload";
import History from "./components/History";
import Reports from "./components/Reports";
import ReportView from "./components/ReportView";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import Sidebar from "./components/Sidebar";

function Layout() {
  const location = useLocation();

  // ❌ Sidebar hidden on login/register/forgot-password
  const hideSidebar = ["/login", "/register", "/forgot-password"].includes(
    location.pathname
  );

  return (
    <div className="flex h-screen">
      {!hideSidebar && <Sidebar />}
      <div className="flex-1 overflow-auto bg-gray-900 text-white">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scan" element={<ScanUpload />} />
          <Route path="/history" element={<History />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:scanId" element={<ReportView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
