import React, { useState } from "react";
import axios from "axios";

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = ask username, 2 = ask new password
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);

  const extractError = (err) => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((e) => e.msg).join(" ");
    return "An error occurred.";
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage("");
    try {
      const res = await axios.post("http://localhost:8000/forgot-password", { username });
      setStep(2);
      setMessage(res.data.detail);
    } catch (err) {
      setError(extractError(err));
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage("");
    try {
      const res = await axios.post("http://localhost:8000/reset-password", {
        username,
        new_password: newPassword,
      });
      setMessage(res.data.detail);
      setStep(1);
      setUsername("");
      setNewPassword("");
    } catch (err) {
      setError(extractError(err));
    }
  };

  return (
    <div className="p-6 text-white max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Forgot Password</h2>

      {message && <p className="mb-2 text-blue-400">{message}</p>}
      {error && <p className="mb-2 text-red-400">{error}</p>}

      {step === 1 ? (
        <form onSubmit={handleUsernameSubmit}>
          <label className="block mb-2">Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 text-black rounded mb-4"
            required
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
            Verify Username
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordReset}>
          <label className="block mb-2">New Password:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full p-2 text-black rounded mb-4"
            required
          />
          <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
            Reset Password
          </button>
        </form>
      )}
    </div>
  );
}

export default ForgotPassword;
