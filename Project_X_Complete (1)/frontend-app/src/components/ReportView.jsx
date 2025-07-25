import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function ReportView() {
  const { scanId } = useParams();
  const [reportUrl, setReportUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token"); // ✅ moved outside useEffect

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchReport = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/report/${scanId}`,
          {
            responseType: "blob",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const file = new Blob([response.data], { type: "application/pdf" });
        const fileURL = URL.createObjectURL(file);
        setReportUrl(fileURL);
      } catch (err) {
        console.error("Error fetching report:", err);
        setError("Could not load report.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [scanId, token, navigate]); // ✅ token added to deps

  const handleDeleteSource = async () => {
    if (!window.confirm("Are you sure you want to delete the source code?")) {
      return;
    }

    try {
      await axios.delete(`http://127.0.0.1:8000/delete_source/${scanId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDeleteStatus("✅ Source code deleted successfully.");
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleteStatus("❌ Failed to delete source code.");
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">Scan Report</h2>

      {loading ? (
        <p className="text-gray-300">Loading report...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <>
          <iframe
            src={reportUrl}
            title="PDF Report"
            width="100%"
            height="700px"
            className="rounded border border-gray-500 mb-4"
          ></iframe>

          <button
            onClick={handleDeleteSource}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded mt-2"
          >
            🗑️ Delete Source Code
          </button>

          {deleteStatus && (
            <p className="mt-2 text-sm text-yellow-300">{deleteStatus}</p>
          )}
        </>
      )}
    </div>
  );
}

export default ReportView;
