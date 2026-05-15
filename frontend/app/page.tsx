'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Search, Zap, GitBranch, FileText, AlertCircle, Sparkles, ArrowRight, Code2, Brain, Clock, LogOut, User as UserIcon, Terminal } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { user, token, logout, isLoading } = useAuth()
  const [rawInput, setRawInput] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check auth — redirect to login if not authenticated
    if (!token || !user) {
      router.push('/auth/login')
      return
    }
    
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
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          raw_input: rawInput,
          repo_url: repoUrl,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          logout()
          router.push('/auth/login')
          return
        }
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
    <div className="min-h-screen bg-transparent flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/60 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/40">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300">
                <Terminal className="w-5 h-5 text-primary" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full animate-ping opacity-75"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                  Sherlock
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Incident Response</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">System Online</span>
              </div>
              
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 rounded-full transition-all"
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name || user.email} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                        <UserIcon className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-300 hidden sm:inline">{user.full_name || user.email}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                      <div className="p-4 border-b border-white/5 bg-slate-800/30">
                        <p className="text-sm font-medium text-white truncate">{user.email}</p>
                        {user.full_name && <p className="text-xs text-slate-400 truncate mt-1">{user.full_name}</p>}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/docs" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
                    Docs
                  </Link>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 text-sm font-medium bg-white text-slate-950 hover:bg-slate-200 rounded-full transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-32 pb-16 flex flex-col justify-center relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center max-w-7xl mx-auto">
            
            {/* Left Column: Copy */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-medium text-primary tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Powered by IBM Bob AI</span>
              </div>
              
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight">
                Resolve incidents in <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  minutes, not hours.
                </span>
              </h2>
              
              <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl">
                Your AI on-call partner that automatically analyzes errors, reads the codebase, and generates production-ready fixes with complete postmortems.
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-white">95%</span>
                  <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Accuracy Rate</span>
                </div>
                <div className="w-px h-12 bg-white/10"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-white">&lt; 5m</span>
                  <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Avg Resolution</span>
                </div>
                <div className="w-px h-12 bg-white/10"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-white">24/7</span>
                  <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Availability</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Form */}
            <div className="relative w-full max-w-lg mx-auto lg:ml-auto lg:mr-0 animate-fade-in-up delay-200">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
              
              <div className="relative bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-white/5">
                    <Search className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Start Investigation</h3>
                    <p className="text-sm text-slate-400">Paste your error to begin analysis</p>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="alert" className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Error Log / Stack Trace
                    </label>
                    <div className="relative group">
                      <textarea
                        id="alert"
                        value={rawInput}
                        onChange={(e) => setRawInput(e.target.value)}
                        placeholder="Paste the error message here..."
                        className="w-full h-32 px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 font-mono text-sm transition-all resize-none scrollbar-thin group-hover:border-white/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={loadSampleAlert}
                        className="absolute bottom-3 right-3 text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-all border border-white/5 backdrop-blur-sm"
                      >
                        Load Example
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="repo" className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Repository URL
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <GitBranch className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        id="repo"
                        type="url"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/user/repo"
                        className="w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-mono text-sm group-hover:border-white/20"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative w-full overflow-hidden bg-white hover:bg-slate-100 text-slate-950 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed font-bold py-3.5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:shadow-none mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                        <span>Initializing Agents...</span>
                      </>
                    ) : (
                      <>
                        <span>Analyze & Fix Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-7xl mx-auto animate-fade-in-up delay-400">
            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:bg-slate-900/60 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-Agent Pipeline</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Specialized AI agents for triage, forensics, root cause analysis, and code generation working in parallel.
              </p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:bg-slate-900/60 transition-colors">
              <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 border border-secondary/20">
                <Code2 className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Context-Aware Fixes</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Generates pull requests with high confidence by understanding your entire repository structure and dependencies.
              </p>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 p-8 rounded-3xl hover:bg-slate-900/60 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Auto Postmortems</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Instantly generates comprehensive markdown documentation summarizing the incident and the applied resolution.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-auto">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-500" />
              <p className="text-sm font-medium text-slate-500">
                Sherlock v1.0.0
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
              <a href="#" className="hover:text-white transition-colors">IBM Bob Hackathon 2026</a>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <a href="https://github.com/bagusardin25/Sherlock-AI-Incident-Response-Co-pilot" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
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
        .animate-fade-in-up {
          animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-400 {
          animation-delay: 0.4s;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}