import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear(); // Clear all saved data on login screen
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

      const response = await axios.post("http://localhost:8000/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (response.data.username) {
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("role", response.data.role);
        if (response.data.access_token) {
          localStorage.setItem("token", response.data.access_token); // ✅ Save token
        }
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.data?.detail) {
        setMessage(error.response.data.detail);
      } else {
        setMessage("Login failed.");
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded shadow-md w-80 space-y-4">
        <h2 className="text-xl font-bold">Login</h2>

        <div>
          <label className="block">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 rounded text-black"
            required
          />
        </div>

        <div>
          <label className="block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded text-black"
            required
          />
        </div>

        <button type="submit" className="w-full bg-blue-600 py-2 rounded hover:bg-blue-500">
          Login
        </button>

        <div className="text-sm text-right">
          <Link to="/forgot-password" className="text-blue-400 hover:underline">
            Forgot Password?
          </Link>
        </div>

        {message && <p className="text-sm text-red-400">{message}</p>}
      </form>
    </div>
  );
}

export default Login;
