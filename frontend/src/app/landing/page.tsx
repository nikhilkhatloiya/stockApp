"use client";

import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Real-Time Stock
            <span className="block bg-gradient-to-r from-red-400 to-blue-400 bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Track live stock prices, manage your portfolio, and make informed investment decisions 
            with our powerful real-time dashboard powered by MongoDB Atlas.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 border border-white/20 text-lg"
            >
              Start Trading Now
            </Link>
            <Link
              href="/login"
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 border border-white/20 text-lg"
            >
              Sign In
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">Live Data</h3>
              <p className="text-gray-400">
                Real-time stock prices updated every second with WebSocket technology
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-xl font-semibold text-white mb-2">Portfolio</h3>
              <p className="text-gray-400">
                Track your investments and analyze performance with detailed analytics
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure</h3>
              <p className="text-gray-400">
                Your data is protected with enterprise-grade security and encryption
              </p>
            </div>
          </div>

          {/* Demo Section */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-semibold text-white mb-4">Try Demo Account</h3>
            <p className="text-gray-400 mb-6">
              Experience the full dashboard with our demo account - no registration required!
            </p>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-300 text-sm">
                <strong>Demo Credentials:</strong><br />
                Email: demo@example.com<br />
                Password: demo123
              </p>
            </div>
            <Link
              href="/login"
              className="bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-lg border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 Stock Dashboard. Built with Next.js, MongoDB Atlas, and Socket.IO</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
