'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Zap, GitBranch, FileText, AlertCircle, Sparkles, ArrowRight, Code2, Brain, Clock } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [rawInput, setRawInput] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!rawInput.trim()) {
      alert('Please enter an alert or error message')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/incidents/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw_input: rawInput,
          repo_url: repoUrl,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Failed to submit incident')
      }

      const data = await response.json()
      
      // Navigate to incident page
      router.push(`/incidents/${data.incident_id}`)
    } catch (error) {
      console.error('Error submitting incident:', error)
      alert('Failed to submit incident. Please try again.')
      setIsSubmitting(false)
    }
  }

  const loadSampleAlert = () => {
    setRawInput(`TypeError: Cannot read property 'quantity' of undefined
    at decrementInventory (src/cart/checkout.ts:42:18)
    at processCheckout (src/cart/checkout.ts:28:5)
    at async POST /api/checkout (src/routes/checkout.ts:15:3)

Error occurred during checkout process in production environment.
Service: checkout-service
Severity: HIGH
Occurrences: 47 times in last hour`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-8 h-8 text-blue-400" />
                <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Sherlock
                </h1>
                <p className="text-sm text-gray-400">AI Incident Response Co-pilot</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">System Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          {/* Hero Text */}
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-300 mb-4 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span>Powered by IBM Bob AI</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight animate-fade-in-up">
              From Alert to Fix PR in{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                5 Minutes
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto animate-fade-in-up delay-100">
              Your AI on-call partner that actually reads the codebase and generates production-ready fixes
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 pt-8 animate-fade-in-up delay-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">5min</div>
                <div className="text-sm text-gray-500">Avg Analysis Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">95%</div>
                <div className="text-sm text-gray-500">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400">4hrs</div>
                <div className="text-sm text-gray-500">Time Saved</div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-fade-in-up delay-300">
            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
                <p className="text-sm text-gray-400">
                  Multi-agent pipeline analyzes incidents in minutes, not hours
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Code2 className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Code-Level Fixes</h3>
                <p className="text-sm text-gray-400">
                  IBM Bob generates patches with full repository context
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Auto Postmortem</h3>
                <p className="text-sm text-gray-400">
                  Comprehensive documentation generated automatically
                </p>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="relative animate-fade-in-up delay-400">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 md:p-10 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Submit Incident</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Alert Input */}
                <div className="space-y-3">
                  <label htmlFor="alert" className="block text-sm font-medium text-gray-300">
                    Alert / Error Message
                  </label>
                  <div className="relative">
                    <textarea
                      id="alert"
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                      placeholder="Paste your error message, stack trace, or alert here..."
                      className="w-full h-48 px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono text-sm transition-all resize-none"
                      required
                    />
                    <div className="absolute bottom-3 right-3">
                      <button
                        type="button"
                        onClick={loadSampleAlert}
                        className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-all border border-blue-500/20"
                      >
                        Load sample
                      </button>
                    </div>
                  </div>
                </div>

                {/* Repo URL */}
                <div className="space-y-3">
                  <label htmlFor="repo" className="block text-sm font-medium text-gray-300">
                    GitHub Repository URL
                  </label>
                  <input
                    id="repo"
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/user/repository"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    required
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    Public GitHub repository URL — Sherlock will clone and analyze it
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-blue-500/50 disabled:shadow-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analyzing Incident...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Start AI Analysis</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 relative animate-fade-in-up delay-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white mb-2">Powered by IBM Bob</p>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Sherlock uses IBM Bob for deep code analysis with full repository context.
                    The multi-agent pipeline will analyze your incident, identify root cause,
                    generate a fix, and create a comprehensive postmortem—all automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-white/10 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Built for IBM Bob Hackathon 2026 • Sherlock v1.0.0
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="/docs" className="hover:text-blue-400 transition-colors">Documentation</a>
              <a href="https://github.com/bagusardin25/Sherlock-AI-Incident-Response-Co-pilot" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">GitHub</a>
              <a href="mailto:support@sherlock.ai" className="hover:text-blue-400 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
        .delay-400 {
          animation-delay: 0.4s;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}