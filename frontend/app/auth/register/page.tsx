'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Mail, Lock, User, AlertCircle, Loader2, Chrome, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Registration failed')
      }

      const data = await response.json()
      
      // Store tokens and update auth context state
      login(data.access_token, data.refresh_token, data.user)

      // Redirect to home with a hard reload to ensure AuthContext syncs perfectly
      window.location.href = '/scanner'
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = () => {
    window.location.href = '/api/auth/google/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-[#0f1115] dark:via-[#1a1d24] dark:to-[#0f1115] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent mb-2 tracking-tight">
            Sherlock
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Create your account</p>
        </div>

        {/* Register Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-black/5 dark:border-white/10 p-8 shadow-2xl">
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 pb-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    required
                    minLength={8}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Minimum 8 characters</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg shadow-primary/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="h-px bg-black/10 dark:bg-white/10 flex-1"></div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Or sign up with</span>
              <div className="h-px bg-black/10 dark:bg-white/10 flex-1"></div>
            </div>

            {/* Google Signup */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="mt-6 w-full bg-white dark:bg-[#0f1115] hover:bg-slate-50 dark:hover:bg-slate-900 border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-sm"
            >
              <Chrome className="w-5 h-5" />
              <span>Sign up with Google</span>
            </button>

            {/* Footer link */}
            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
