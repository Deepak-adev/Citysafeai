"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { Shield, Menu, X, Building } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrollY > 50 ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-blue-100' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-blue-900">
                CitySafeAI
              </span>
              <span className="text-xs text-slate-600 font-medium">
                Government Technology Initiative
              </span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-slate-600 hover:text-blue-700 font-medium transition-colors duration-300">
              Home
            </Link>
            <Link href="/public-login" className="text-slate-600 hover:text-blue-700 font-medium transition-colors duration-300">
              Public Portal
            </Link>
            <Link href="/police-login" className="text-slate-600 hover:text-blue-700 font-medium transition-colors duration-300">
              Police Portal
            </Link>
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 font-medium">
              Request Demo
            </button>
          </div>

          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-80 bg-white/95 backdrop-blur-lg border-b border-blue-100' : 'max-h-0'}`}>
        <div className="px-6 py-4 space-y-4">
          <Link href="/" className="block text-slate-600 hover:text-blue-700 font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link href="/public-login" className="block text-slate-600 hover:text-blue-700 font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
            Public Portal
          </Link>
          <Link href="/police-login" className="block text-slate-600 hover:text-blue-700 font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>
            Police Portal
          </Link>
          <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-medium">
            Request Demo
          </button>
        </div>
      </div>
    </nav>
  );
}