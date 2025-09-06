"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, ChevronLeft } from "lucide-react"

export default function PoliceRegisterPage() {
  const [policeId, setPoliceId] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")
  const router = useRouter()

  const validatePoliceId = async () => {
    if (!policeId) return
    
    try {
      const response = await fetch('http://localhost:8000/api/validate-police-id/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ police_id: policeId })
      })
      
      const data = await response.json()
      
      if (data.valid) {
        setValidationMessage(`✓ Valid: ${data.officer.name} (${data.officer.rank})`)
      } else {
        setValidationMessage("✗ Invalid Police ID")
      }
    } catch (error) {
      setValidationMessage("Error validating ID")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          email,
          role: 'police',
          police_id: policeId
        })
      })
      
      const data = await response.json()
      
      if (data.status === 'success') {
        alert('Registration successful!')
        router.push('/police-login')
      } else {
        alert(data.message)
      }
    } catch (error) {
      alert('Registration failed')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <Link href="/police-login" className="inline-flex items-center text-blue-700 text-sm font-medium">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
          
          <Shield className="w-12 h-12 text-blue-600 mx-auto" />
          <h1 className="text-3xl font-bold">Police Registration</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Register with your Police ID</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="policeId">Police ID</Label>
                <Input
                  id="policeId"
                  placeholder="e.g., TN001"
                  value={policeId}
                  onChange={(e) => setPoliceId(e.target.value)}
                  onBlur={validatePoliceId}
                  required
                />
                {validationMessage && (
                  <p className={`text-sm mt-1 ${validationMessage.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
                    {validationMessage}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}