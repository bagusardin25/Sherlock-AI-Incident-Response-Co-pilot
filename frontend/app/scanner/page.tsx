'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { Search, GitBranch, ArrowRight, Loader2, AlertCircle, ShieldAlert, ArrowLeft } from 'lucide-react'

export default function ScannerPage() {
  const router = useRouter()
  const { user, token, logout, isLoading } = useAuth()
  const [rawInput, setRawInput] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAuthenticated = Boolean(token && user)

  // Redirect to login if unauthenticated and finished loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    
    if (!rawInput.trim()) {
      toast.error('Please enter an alert or error message')
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
          toast.error('Session expired. Please log in again.')
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
        toast.error(error.message || 'Failed to submit incident. Please try again.')
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

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Verifying session...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans selection:bg-primary/30 pt-32 pb-24">
      {/* Background Decorative Elements */}
      <div className="fixed top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 blur-[120px] rounded-full pointer-events-none opacity-50"></div>
      <div className="fixed bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-secondary/10 blur-[120px] rounded-full pointer-events-none opacity-50"></div>

      <div className="container mx-auto px-6 max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-inner">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Incident Scanner
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Paste your error logs and specify the affected repository. Our AI engines will immediately begin triage, forensics, and resolution.
          </p>
        </div>

        {/* Scanner Form Interface */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <div className="relative glass-panel rounded-[2rem] p-1 overflow-hidden shadow-2xl">
            <div className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl rounded-[1.8rem] p-8 md:p-10 space-y-8">
              
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40 animate-pulse"></div>
                  </div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Agent Core Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Secure Environment</span>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label htmlFor="alert" className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Trace Log / Error Output
                    </label>
                    <button
                      type="button"
                      onClick={loadSampleAlert}
                      className="text-[10px] font-bold text-primary hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg"
                    >
                      Load Example
                    </button>
                  </div>
                  <div className="relative group/input overflow-hidden rounded-2xl shadow-inner">
                    <textarea
                      id="alert"
                      value={rawInput}
                      onChange={(e) => setRawInput(e.target.value)}
                      placeholder="Paste complete error logs, stack traces, or incident descriptions here..."
                      className="w-full h-64 px-6 py-5 bg-slate-100/80 dark:bg-black/60 border border-black/10 dark:border-white/10 rounded-2xl text-slate-900 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 font-mono text-sm transition-all resize-none scrollbar-none group-hover/input:border-black/20 dark:group-hover/input:border-white/20"
                      required
                    />
                    {/* Scanning Line Animation */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/50 shadow-[0_0_15px_rgba(124,58,237,1)] opacity-0 group-hover/input:opacity-100 group-hover/input:animate-scan pointer-events-none"></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label htmlFor="repo" className="px-1 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Target Repository
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <GitBranch className="h-5 w-5 text-slate-400 dark:text-slate-600 group-focus-within/input:text-primary transition-colors" />
                    </div>
                    <input
                      id="repo"
                      type="url"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/organization/repository"
                      className="w-full pl-14 pr-6 py-4 bg-slate-100/80 dark:bg-black/60 border border-black/10 dark:border-white/10 rounded-2xl text-slate-900 dark:text-slate-200 placeholder:text-slate-500 dark:placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-mono text-sm group-hover/input:border-black/20 dark:group-hover/input:border-white/20 shadow-inner"
                      required
                    />
                  </div>
                  <p className="px-2 text-xs text-slate-500">Ensure the platform has sufficient access permissions to this repository.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full overflow-hidden bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed font-black py-5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl dark:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.3)] hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="uppercase tracking-widest text-sm">Deploying Agents & Initializing Analysis...</span>
                    </>
                  ) : (
                    <>
                      <span className="uppercase tracking-widest text-sm">Launch Incident Analysis</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
