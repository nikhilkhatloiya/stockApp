"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/landing");
  };

  // Show loading only for auth-related content, not the entire layout
  const showAuthContent = mounted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and App Name */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="text-3xl">📈</div>
                <h1 className="text-2xl font-bold text-white">StockApp</h1>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6">
              {!showAuthContent ? (
                <>
                  <Link
                    href="/"
                    className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/portfolio"
                    className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                  >
                    Portfolio
                  </Link>
                </>
              ) : showAuthContent && isAuthenticated ? (
                <>
                  <Link
                    href="/"
                    className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/portfolio"
                    className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                  >
                    Portfolio
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/landing"
                    className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                  >
                    Home
                  </Link>
                  <Link
                    href="/login"
                    className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              {showAuthContent && isAuthenticated && user ? (
                <>
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-medium text-white">{user.name}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 border border-red-500/30"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/login"
                    className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 border border-purple-500/30"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 border border-blue-500/30"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button className="md:hidden text-gray-300 hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-lg border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* App Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">📈</div>
                <h3 className="text-xl font-bold text-white">StockApp</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Real-time stock market data and portfolio management. 
                Track your investments with live updates and comprehensive analytics.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Quick Links</h4>
              <div className="space-y-2">
                <Link 
                  href="/" 
                  className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/portfolio" 
                  className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Portfolio
                </Link>
                <Link 
                  href="/login" 
                  className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Sign Up
                </Link>
              </div>
            </div>

            {/* Contact & Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">About</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Built with Next.js & MongoDB</p>
                <p>Real-time WebSocket updates</p>
                <p>Secure authentication</p>
                <p>Responsive design</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-gray-400 text-sm">
                © 2024 StockApp. All rights reserved.
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Made with ❤️ for traders</span>
                <span>•</span>
                <span>Version 1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
