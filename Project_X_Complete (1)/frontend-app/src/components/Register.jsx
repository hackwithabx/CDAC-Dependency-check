// components/Register.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setMessage("Please fill in both fields.");
      return;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await axios.post("http://localhost:8000/register", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      setMessage(response.data.detail);
      if (response.data.detail === "Registration successful.") {
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response?.data?.detail) {
        setMessage(error.response.data.detail);
      } else {
        setMessage("Registration failed.");
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded shadow-md w-80 space-y-4">
        <h2 className="text-xl font-bold">Register</h2>

        <div>
          <label className="block">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 rounded text-black"
          />
        </div>

        <div>
          <label className="block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded text-black"
          />
        </div>

        <button type="submit" className="w-full bg-green-600 py-2 rounded hover:bg-green-500">
          Register
        </button>

        {message && <p className="text-sm">{message}</p>}
      </form>
    </div>
  );
}

export default Register;
