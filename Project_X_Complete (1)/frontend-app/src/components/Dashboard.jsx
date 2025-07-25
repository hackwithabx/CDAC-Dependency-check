import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not logged in.");
      navigate("/login");
      return;
    }
    fetchStats(token);
  }, [navigate]);

  const fetchStats = async (token) => {
    try {
      const response = await axios.get("http://localhost:8000/dashboard-stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setError("Failed to load dashboard statistics.");
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>

      {error && <p className="text-red-400">{error}</p>}

      {!stats ? (
        <p>Loading dashboard stats...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-700 p-4 rounded shadow">
            <h3 className="text-xl mb-2">Total Scans</h3>
            <p className="text-3xl">{stats.total_scans}</p>
          </div>

          <div className="bg-gray-700 p-4 rounded shadow">
            <h3 className="text-xl mb-2">Latest Scan Date</h3>
            <p className="text-lg">
              {stats.latest_scan_date
                ? new Date(stats.latest_scan_date + "Z").toLocaleString()
                : "N/A"}
            </p>
          </div>

          {stats.risk_counts &&
            Object.entries(stats.risk_counts).map(([level, count]) => (
              <div key={level} className="bg-gray-700 p-4 rounded shadow">
                <h3 className="text-xl mb-2">{level} Risk Scans</h3>
                <p className="text-2xl">{count}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
