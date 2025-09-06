"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Building, Award, Globe, ChevronLeft } from "lucide-react"
import Navbar from "@/components/ui/navbar"

export default function PoliceLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate authentication delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Store role in localStorage and redirect
    localStorage.setItem("userRole", "police")
    localStorage.setItem("username", username)

    router.push("/police-dashboard")
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 overflow-hidden">
      <Navbar />
      {/* Government Seal Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32">
          <Building className="w-full h-full text-blue-600" />
        </div>
        <div className="absolute top-20 right-20 w-24 h-24">
          <Award className="w-full h-full text-emerald-600" />
        </div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28">
          <Globe className="w-full h-full text-amber-600" />
        </div>
        <div className="absolute bottom-32 right-1/3 w-20 h-20">
          <Shield className="w-full h-full text-blue-600" />
        </div>
      </div>

      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-100/50 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-emerald-100/50 via-transparent to-transparent"></div>
      </div>

      {/* Floating Elements with Parallax */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/4 left-10 w-6 h-6 bg-blue-200 rounded-full opacity-40 transition-transform duration-1000"
          style={{ transform: `translateY(${scrollY * 0.1}px) rotate(${scrollY * 0.05}deg)` }}
        ></div>
        <div 
          className="absolute top-1/3 right-20 w-4 h-4 bg-emerald-200 rounded-full opacity-40 transition-transform duration-1000"
          style={{ transform: `translateY(${scrollY * -0.15}px) rotate(${scrollY * -0.08}deg)` }}
        ></div>
        <div 
          className="absolute bottom-1/4 left-1/4 w-5 h-5 bg-amber-200 rounded-full opacity-40 transition-transform duration-1000"
          style={{ transform: `translateY(${scrollY * 0.12}px) rotate(${scrollY * 0.06}deg)` }}
        ></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <Link
              href="/"
              className="group inline-flex items-center text-blue-700 hover:text-blue-800 transition-all duration-300 text-sm font-medium hover:scale-105 transform"
            >
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              Back to Home
            </Link>
            
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              <span className="block text-slate-900 mb-2">
                Police
              </span>
              <span className="block bg-gradient-to-r from-blue-700 to-emerald-700 bg-clip-text text-transparent">
                Dashboard Access
              </span>
            </h1>
            <p className="text-lg text-slate-600 font-medium">Secure access to your law enforcement dashboard</p>
          </div>

          {/* Login Form */}
          <Card className="group relative bg-gradient-to-br from-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-700 ease-out hover:transform hover:scale-105 hover:-translate-y-2">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center text-slate-900 group-hover:text-blue-700 transition-all duration-300">
                Sign In
              </CardTitle>
              <CardDescription className="text-center text-slate-600 font-medium">
                Enter your credentials to access the police dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold text-slate-700">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 hover:from-blue-700 hover:to-blue-800" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
            
            {/* Subtle Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-emerald-50/0 group-hover:from-blue-50/30 group-hover:to-emerald-50/30 rounded-xl transition-all duration-500 pointer-events-none"></div>
          </Card>

          <div className="text-center text-sm text-slate-500 font-medium px-4">
            <p>This is a secure law enforcement system. Unauthorized access is prohibited.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
