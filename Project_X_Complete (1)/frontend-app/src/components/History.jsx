import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchHistory(token);
  }, []);

  const fetchHistory = async (token) => {
    try {
      const response = await axios.get("http://localhost:8000/scan_history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching scan history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSource = async (scanId) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Are you sure you want to delete the source code?")) return;

    try {
      await axios.delete(`http://localhost:8000/delete_source/${scanId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Source code deleted successfully.");
    } catch (error) {
      console.error("Error deleting source code:", error);
      alert("Failed to delete source code.");
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">Scan History</h2>

      {loading ? (
        <p>Loading...</p>
      ) : history.length === 0 ? (
        <p>No scan history available.</p>
      ) : (
        <table className="w-full bg-gray-700 rounded text-sm">
          <thead>
            <tr>
              <th className="p-2 border">Scan ID</th>
              <th className="p-2 border">File</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">PCI DSS</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((scan) => (
              <tr key={scan.scan_id}>
                <td className="p-2 border">{scan.scan_id}</td>
                <td className="p-2 border">{scan.filename}</td>
                <td className="p-2 border">
                  {new Date(scan.upload_datetime + "Z").toLocaleString()}
                </td>
                <td className="p-2 border">{scan.pci_dss ? "Yes" : "No"}</td>
                <td className="p-2 border capitalize">{scan.status}</td>
                <td className="p-2 border space-x-2">
                  {scan.status === "completed" ? (
                    <>
                      <Link
                        to={`/reports/${scan.scan_id}`}
                        className="text-blue-400 hover:underline"
                      >
                        View Report
                      </Link>
                      <button
                        onClick={() => handleDeleteSource(scan.scan_id)}
                        className="text-red-400 hover:underline ml-2"
                      >
                        Delete Source
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Processing</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default History;
