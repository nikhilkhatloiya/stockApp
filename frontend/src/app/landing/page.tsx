"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Lock, LineChart } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-6xl md:text-7xl font-extrabold leading-tight max-w-3xl"
        >
          Real-Time <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Stock Dashboard</span>
        </motion.h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl">
          Track live stock prices, manage portfolios, and make smarter decisions — beautifully designed for clarity.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link href="/signup" className="px-8 py-4 rounded-xl text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg hover:opacity-90 transition">
            Get Started
          </Link>
          <Link href="/login" className="px-8 py-4 rounded-xl text-lg font-semibold border border-gray-300 hover:bg-gray-50 transition">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gray-50">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            { icon: <LineChart className="w-10 h-10 text-orange-500" />, title: "Live Data", desc: "Stocks update every second with WebSocket-powered real-time data." },
            { icon: <Zap className="w-10 h-10 text-pink-500" />, title: "Portfolio Tools", desc: "Track and analyze your investments with modern insights." },
            { icon: <Lock className="w-10 h-10 text-green-500" />, title: "Secure & Private", desc: "We use enterprise-grade encryption to keep your data safe." },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition"
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 text-center bg-gradient-to-r from-orange-500 to-pink-500 text-white">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
        <Link href="/signup" className="px-8 py-4 bg-white text-orange-600 font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition">
          Create Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-10 text-center text-gray-500 border-t border-gray-200">
        <p>© 2025 Stock Dashboard. All rights reserved.</p>
      </footer>
    </div>
  );
}
