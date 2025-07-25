import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchReports(token);
  }, []);

  const fetchReports = async (token) => {
    try {
      const response = await axios.get("http://localhost:8000/scan_history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">All Reports</h2>

      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length > 0 ? (
        <table className="w-full table-auto border-collapse border border-gray-700 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-700 p-2">Scan ID</th>
              <th className="border border-gray-700 p-2">Filename</th>
              <th className="border border-gray-700 p-2">Upload Date</th>
              <th className="border border-gray-700 p-2">PCI DSS</th>
              <th className="border border-gray-700 p-2">Status</th>
              <th className="border border-gray-700 p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.scan_id}>
                <td className="border border-gray-700 p-2">{report.scan_id}</td>
                <td className="border border-gray-700 p-2">{report.filename}</td>
                <td className="border border-gray-700 p-2">
                  {new Date(report.upload_datetime + "Z").toLocaleString()}
                </td>
                <td className="border border-gray-700 p-2">{report.pci_dss ? "Yes" : "No"}</td>
                <td className="border border-gray-700 p-2 capitalize">{report.status}</td>
                <td className="border border-gray-700 p-2">
                  {report.status === "completed" ? (
                    <Link
                      to={`/reports/${report.scan_id}`}
                      className="text-blue-400 hover:underline"
                    >
                      View Report
                    </Link>
                  ) : (
                    <span className="text-gray-400 italic">Processing</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No reports available.</p>
      )}
    </div>
  );
}

export default Reports;
