import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ScanUpload() {
  const [file, setFile] = useState(null);
  const [pciDss, setPciDss] = useState(false);
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage("❌ Please select a ZIP file to scan.");
      return;
    }

    if (!username) {
      setMessage("❌ User not logged in.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("pci_dss", pciDss);
    formData.append("username", username);

    try {
      setIsScanning(true);
      const response = await axios.post("http://127.0.0.1:8000/scan", formData, {
        headers: {
          "username": username  // ✅ Include username in headers!
        }
      });

      const scanId = response.data.scan_id;
      setMessage(`✅ Scan started! Redirecting to report...`);
      setTimeout(() => {
        navigate(`/reports/${scanId}`);
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      if (error.response?.data?.detail) {
        setMessage(`❌ ${error.response.data.detail}`);
      } else {
        setMessage("❌ Scan failed.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">Source Code</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Select Source Code ZIP</label>
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-black"
          />
        </div>
        <div>
          <label className="block mb-1">Logged in as: {username || "Unknown"}</label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={pciDss}
              onChange={() => setPciDss(!pciDss)}
            />
            <span className="ml-2">Enable PCI DSS Scan</span>
          </label>
        </div>
        <button
          type="submit"
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500"
          disabled={isScanning}
        >
          {isScanning ? "Scanning..." : "Upload & Scan"}
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}

export default ScanUpload;
