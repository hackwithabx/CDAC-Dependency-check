import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/scan", label: "Scan Upload" },
    { path: "/history", label: "Scan History" },
    { path: "/reports", label: "Reports" },
  ];

  if (role === "admin") {
    navItems.push({ path: "/admin/reports", label: "All Users Reports" });
  }

  return (
    <div className="w-64 bg-gray-900 text-white h-screen p-4 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-6">Project X</h2>
        <ul className="space-y-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`block p-2 rounded hover:bg-gray-700 ${
                  location.pathname === item.path ? "bg-gray-700" : ""
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        {username ? (
          <div>
            <p className="text-sm mb-2">
              Logged in as: {username} ({role})
            </p>
            <button
              onClick={handleLogout}
              className="bg-red-600 p-2 rounded w-full hover:bg-red-500"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              to="/login"
              className="block bg-blue-600 p-2 rounded text-center hover:bg-blue-500"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="block bg-green-600 p-2 rounded text-center hover:bg-green-500"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
