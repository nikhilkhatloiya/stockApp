"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DebugLoginPage() {
  const [formData, setFormData] = useState({
    email: "demo@example.com",
    password: "demo123",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDebugInfo("Starting login process...");

    try {
      setDebugInfo("Making API request to: http://localhost:4000/api/users/login");
      console.log("Login attempt with:", formData);
      
      const response = await fetch("http://localhost:4000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      setDebugInfo(`Response status: ${response.status}`);
      console.log("Response status:", response.status);

      const data = await response.json();
      setDebugInfo(`Response data: ${JSON.stringify(data, null, 2)}`);
      console.log("Response data:", data);

      if (response.ok) {
        setDebugInfo("Login successful! Storing user data...");
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);
        
        setDebugInfo("Redirecting to dashboard...");
        // Redirect to dashboard
        router.push("/");
      } else {
        setError(data.message || "Login failed");
        setDebugInfo(`Login failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please try again.");
      setDebugInfo(`Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Debug Login Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🐛</div>
            <h1 className="text-3xl font-bold text-white mb-2">Debug Login</h1>
            <p className="text-gray-300">Testing login functionality</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Debug Info */}
          {debugInfo && (
            <div className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-lg mb-6">
              <pre className="text-sm whitespace-pre-wrap">{debugInfo}</pre>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/25"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Testing Login...
                </div>
              ) : (
                "Test Login"
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="text-center mt-6">
            <a
              href="/login"
              className="text-red-400 hover:text-red-300 font-medium transition-colors duration-200"
            >
              ← Back to Normal Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
