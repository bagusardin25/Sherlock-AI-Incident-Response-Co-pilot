'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Search, Zap, GitBranch, FileText, AlertCircle, Sparkles, ArrowRight, Code2, Brain, Clock, LogOut, User as UserIcon, Terminal, Key, ChevronDown, Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { user, token, logout, isLoading } = useAuth()
  const [rawInput, setRawInput] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const isAuthenticated = Boolean(token && user)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Block unauthenticated users
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    
    if (!rawInput.trim()) {
      alert('Please enter an alert or error message')
      return
    }

    setIsSubmitting(true)

    try {
      console.log('[Sherlock] Submitting incident with token:', token ? `${token.slice(0, 20)}...` : 'NO TOKEN')
      
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
        const errBody = await response.text()
        console.error(`[Sherlock] Incident submit failed: ${response.status} ${response.statusText}`, errBody)
        
        if (response.status === 401) {
          // Token is invalid or expired — force re-login
          alert('Session expired. Please log in again.')
          logout()
          router.push('/auth/login')
          return
        }
        
        try {
          const errJson = JSON.parse(errBody)
          throw new Error(errJson.detail || 'Failed to submit incident')
        } catch {
          throw new Error(`Server error: ${response.status}`)
        }
      }

      const data = await response.json()
      
      // Navigate to incident page
      router.push(`/incidents/${data.incident_id}`)
    } catch (error: any) {
      console.error('Error submitting incident:', error)
      if (!error.message?.includes('Session expired')) {
        alert(error.message || 'Failed to submit incident. Please try again.')
      }
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
    <div className="min-h-screen bg-transparent flex flex-col font-sans selection:bg-primary/30">
      {/* Floating Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-7xl z-50">
        <div className="glass-panel rounded-2xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 group-hover:bg-primary/30 transition-all duration-300">
                <Terminal className="w-5 h-5 text-primary" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                  Sherlock
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Incident AI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-success rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                <span className="text-[10px] font-bold text-success uppercase tracking-wider">Operational</span>
              </div>
              
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-1.5 py-1.5 bg-slate-800/50 border border-white/5 hover:border-white/10 rounded-xl transition-all"
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name || user.email} className="w-7 h-7 rounded-lg" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                        <UserIcon className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-300 hidden sm:inline px-1">{user.full_name?.split(' ')[0] || user.email.split('@')[0]}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 border-b border-white/5 bg-white/5">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Account</p>
                        <p className="text-sm font-medium text-white truncate">{user.email}</p>
                      </div>
                      <div className="p-1">
                        <Link
                          href="/settings/api-keys"
                          className="w-full px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-xl transition-all flex items-center gap-3"
                        >
                          <Key className="w-4 h-4 text-slate-400" />
                          <span>API Keys</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-all flex items-center gap-3"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-5 py-2 text-sm font-bold bg-white text-slate-950 hover:bg-slate-200 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-48 pb-24 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-secondary/10 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8 animate-slide-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(124,58,237,0.8)]"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v1.0 Early Access</span>
              </div>
              
              <h2 className="text-6xl md:text-7xl font-black text-white leading-[1.05] tracking-tight">
                Stop debugging. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient">
                  Start resolving.
                </span>
              </h2>
              
              <p className="text-xl text-slate-400 leading-relaxed max-w-xl">
                The world's first multi-agent AI co-pilot that turns production alerts into verified pull requests in under 5 minutes.
              </p>

              <div className="flex items-center gap-8 pt-4">
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white tabular-nums">95<span className="text-primary">%</span></div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resolution Accuracy</p>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white tabular-nums">4<span className="text-secondary">m</span></div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg. Triage Time</p>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white tabular-nums">24<span className="text-primary">/</span>7</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Monitoring</p>
                </div>
              </div>
            </div>

            {/* Right: Scanner Interface */}
            <div className="lg:col-span-5 relative group animate-slide-in [animation-delay:200ms]">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative glass-panel rounded-[2rem] p-1 overflow-hidden">
                <div className="bg-slate-950/40 rounded-[1.8rem] p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                        <Search className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-none">Incident Scanner</h3>
                        <p className="text-xs text-slate-500 mt-1">Ready for input</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40"></div>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-5 relative">
                    {/* Auth Guard Overlay */}
                    {!isLoading && !isAuthenticated && (
                      <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 p-6">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                          <AlertCircle className="w-7 h-7 text-primary" />
                        </div>
                        <div className="text-center space-y-2">
                          <h4 className="text-lg font-bold text-white">Authentication Required</h4>
                          <p className="text-sm text-slate-400 max-w-xs">Sign in to your account to start analyzing incidents.</p>
                        </div>
                        <div className="flex gap-3">
                          <Link
                            href="/auth/login"
                            className="px-6 py-2.5 text-sm font-bold bg-white text-slate-950 hover:bg-slate-200 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                          >
                            Sign In
                          </Link>
                          <Link
                            href="/auth/register"
                            className="px-6 py-2.5 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl transition-all"
                          >
                            Register
                          </Link>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <label htmlFor="alert" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Trace Log
                        </label>
                        <button
                          type="button"
                          onClick={loadSampleAlert}
                          disabled={!isAuthenticated}
                          className="text-[10px] font-bold text-primary hover:text-white transition-colors uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Load Example
                        </button>
                      </div>
                      <div className="relative group/input overflow-hidden rounded-2xl">
                        <textarea
                          id="alert"
                          value={rawInput}
                          onChange={(e) => setRawInput(e.target.value)}
                          placeholder={isAuthenticated ? "Paste error logs or stack trace..." : "Sign in to paste error logs..."}
                          className="w-full h-40 px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 font-mono text-sm transition-all resize-none scrollbar-none group-hover/input:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!isAuthenticated}
                          required
                        />
                        {/* Scanning Line Animation */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/40 shadow-[0_0_15px_rgba(124,58,237,0.8)] opacity-0 group-hover/input:opacity-100 group-hover/input:animate-scan pointer-events-none"></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="repo" className="px-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Source Repository
                      </label>
                      <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                          <GitBranch className="h-4 w-4 text-slate-600 group-focus-within/input:text-primary transition-colors" />
                        </div>
                        <input
                          id="repo"
                          type="url"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          placeholder={isAuthenticated ? "https://github.com/org/repo" : "Sign in to enter repository URL..."}
                          className="w-full pl-12 pr-5 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all font-mono text-sm group-hover/input:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!isAuthenticated}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !isAuthenticated}
                      className="group relative w-full overflow-hidden bg-white hover:bg-slate-100 text-slate-950 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed font-black py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)] active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="uppercase tracking-widest text-xs">Deploying Agents...</span>
                        </>
                      ) : (
                        <>
                          <span className="uppercase tracking-widest text-xs">{isAuthenticated ? 'Initialize Analysis' : 'Sign In to Analyze'}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Grid Features */}
          <div className="mt-48 space-y-12">
            <div className="text-center space-y-4">
              <h3 className="text-4xl font-black text-white tracking-tight">Engineered for Reliability</h3>
              <p className="text-slate-500 max-w-2xl mx-auto font-medium">Four specialized agents working in concert to handle the entire lifecycle of an incident.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 auto-rows-[240px]">
              {/* Triage Agent */}
              <div className="md:col-span-3 lg:col-span-4 glass-card rounded-[2rem] p-8 flex flex-col justify-between group">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Instant Triage</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Categorizes errors by severity and service impact within seconds of ingestion.</p>
                </div>
              </div>

              {/* Forensics Agent */}
              <div className="md:col-span-3 lg:col-span-8 glass-card rounded-[2rem] p-8 flex flex-col lg:flex-row gap-8 group">
                <div className="flex flex-col justify-between lg:w-1/2">
                  <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/20 group-hover:rotate-12 transition-transform">
                    <Brain className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2">Deep Forensics</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">Analyzes git history, recent commits, and dependency changes to pinpoint the exact line of failure.</p>
                  </div>
                </div>
                <div className="hidden lg:flex flex-1 bg-black/40 rounded-2xl border border-white/5 p-4 font-mono text-[10px] text-slate-600 overflow-hidden relative">
                   <div className="space-y-2">
                     <div className="flex gap-2"><span className="text-primary">$</span><span>git diff HEAD~1</span></div>
                     <div className="text-red-400">- return state.inventory[id].quantity</div>
                     <div className="text-green-400">+ return state.inventory[id]?.quantity || 0</div>
                     <div className="opacity-40">... analyzing impact on cart-service ...</div>
                   </div>
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                </div>
              </div>

              {/* Fix Agent */}
              <div className="md:col-span-4 lg:col-span-7 glass-card rounded-[2rem] p-8 flex flex-col justify-between group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center border border-success/20 group-hover:scale-110 transition-transform">
                    <Code2 className="w-6 h-6 text-success" />
                  </div>
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {i}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Context-Aware Fixes</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Generates high-confidence pull requests that follow your project's coding standards and pass existing tests.</p>
                </div>
              </div>

              {/* Postmortem Agent */}
              <div className="md:col-span-2 lg:col-span-5 glass-card rounded-[2rem] p-8 flex flex-col justify-between group">
                <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all">
                  <FileText className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Automated Reports</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Comprehensive markdown postmortems ready for your SRE team's review.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-white/5 py-12 bg-black/20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                <Terminal className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-sm font-bold text-slate-600 tracking-tight">
                SHERLOCK <span className="text-[10px] font-medium ml-2 opacity-50">v1.0.0-PROD</span>
              </p>
            </div>
            <div className="flex items-center gap-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
              <a href="#" className="hover:text-white transition-colors">API Reference</a>
              <a href="https://github.com/bagusardin25/Sherlock-AI-Incident-Response-Co-pilot" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            </div>
            <p className="text-[10px] font-medium text-slate-600">
              © 2026 IBM Bob Hackathon. Built with Precision.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 4s linear infinite;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}