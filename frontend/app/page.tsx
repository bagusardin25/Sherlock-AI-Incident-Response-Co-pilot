'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Search, Zap, GitBranch, FileText, AlertCircle, Sparkles, ArrowRight, Code2, Brain, Clock, LogOut, User as UserIcon, Terminal, Key, ChevronDown, Loader2, Sun, Moon, Github, Book } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { user, token, logout, isLoading } = useAuth()
  const { theme, setTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const isAuthenticated = Boolean(token && user)


  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans selection:bg-primary/30">
      {/* Floating Header */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-7xl z-50">
        <div className="glass-panel rounded-2xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/30 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-all duration-300">
                <Terminal className="w-5 h-5 text-primary" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  Sherlock
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Incident AI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-slate-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
              </button>
              
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-success rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                <span className="text-[10px] font-bold text-success uppercase tracking-wider">Operational</span>
              </div>
              
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-1.5 py-1.5 bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 rounded-xl transition-all"
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name || user.email} className="w-7 h-7 rounded-lg" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/20 dark:border-primary/30">
                        <UserIcon className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline px-1">{user.full_name?.split(' ')[0] || user.email.split('@')[0]}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Account</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.email}</p>
                      </div>
                      <div className="p-1">
                        <Link
                          href="/settings/api-keys"
                          className="w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all flex items-center gap-3"
                        >
                          <Key className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span>API Keys</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-xl transition-all flex items-center gap-3"
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
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-5 py-2 text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl transition-all shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
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
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(124,58,237,0.8)]"></div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">v1.0 Early Access</span>
              </div>
              
              <h2 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tight">
                Stop debugging. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient">
                  Start resolving.
                </span>
              </h2>
              
              <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                The world&apos;s first multi-agent AI co-pilot that turns production alerts into verified pull requests in under 5 minutes.
              </p>

              <div className="flex items-center gap-8 pt-4">
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">95<span className="text-primary">%</span></div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resolution Accuracy</p>
                </div>
                <div className="w-px h-10 bg-black/10 dark:bg-white/10"></div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">4<span className="text-secondary">m</span></div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg. Triage Time</p>
                </div>
                <div className="w-px h-10 bg-black/10 dark:bg-white/10"></div>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">24<span className="text-primary">/</span>7</div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Monitoring</p>
                </div>
              </div>
            </div>

            {/* Right: Platform Mockup */}
            <div className="lg:col-span-5 relative group animate-slide-in [animation-delay:200ms]">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative glass-panel rounded-[2rem] p-1 overflow-hidden shadow-2xl">
                <div className="bg-white/40 dark:bg-slate-950/40 rounded-[1.8rem] p-6 md:p-8 space-y-6 backdrop-blur-xl">
                  {/* Mockup Header */}
                  <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">sherlock-core-v1</span>
                    </div>
                  </div>
                  
                  {/* Mockup Body */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">TypeError: Cannot read property...</div>
                        <div className="text-[10px] text-slate-500">checkout-service • Production</div>
                      </div>
                    </div>
                    
                    <div className="pl-4 border-l-2 border-black/10 dark:border-white/10 space-y-3 py-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        Analyzing stack trace...
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <Brain className="w-3 h-3 text-secondary" />
                        Generating fix proposal...
                      </div>
                      <div className="flex items-center gap-2 text-xs text-success font-mono font-bold">
                        <Code2 className="w-3 h-3" />
                        Resolution Ready
                      </div>
                    </div>

                    <div className="pt-4 border-t border-black/5 dark:border-white/5">
                      <Link 
                        href="/scanner"
                        className="group relative w-full overflow-hidden bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
                      >
                        <span className="uppercase tracking-widest text-xs">Launch Incident Scanner</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Ribbon / Ticker Tape */}
          <div className="mt-32 -mx-6 md:-mx-12 overflow-hidden border-y border-black/5 dark:border-white/5 bg-slate-100/50 dark:bg-black/20 py-4 relative flex items-center">
            {/* Gradient Fades for edges */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 dark:from-[#0f1115] to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 dark:from-[#0f1115] to-transparent z-10"></div>
            
            <div className="flex w-max animate-infinite-scroll">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center justify-around gap-16 px-8">
                  {['AI Triage Engine', 'Automated Forensics', 'Zero Downtime', 'Root Cause Analysis', 'One-Click Resolution', '24/7 Monitoring', 'Intelligent PR Generation'].map((text, j) => (
                    <div key={j} className="flex items-center gap-4">
                      <Sparkles className="w-3 h-3 text-primary/50" />
                      <span className="text-xs font-black text-slate-500/80 dark:text-slate-400/80 tracking-widest uppercase whitespace-nowrap">
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Bento Grid Features */}
          <div className="mt-32 space-y-12">
            <div className="text-center space-y-4">
              <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Engineered for Reliability</h3>
              <p className="text-slate-500 max-w-2xl mx-auto font-medium">Four specialized agents working in concert to handle the entire lifecycle of an incident.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 auto-rows-[240px]">
              {/* Triage Agent */}
              <div className="md:col-span-3 lg:col-span-4 glass-card rounded-[2rem] p-8 flex flex-col justify-between group">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Bob Triage Engine</h4>
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
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Bob Forensics Engine</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">Analyzes git history, recent commits, and dependency changes to pinpoint the exact line of failure.</p>
                  </div>
                </div>
                <div className="hidden lg:flex flex-1 bg-slate-100/60 dark:bg-black/40 rounded-2xl border border-black/5 dark:border-white/5 p-4 font-mono text-[10px] text-slate-500 dark:text-slate-600 overflow-hidden relative">
                   <div className="space-y-2">
                     <div className="flex gap-2"><span className="text-primary">$</span><span>git diff HEAD~1</span></div>
                     <div className="text-red-500 dark:text-red-400">- return state.inventory[id].quantity</div>
                     <div className="text-green-600 dark:text-green-400">+ return state.inventory[id]?.quantity || 0</div>
                     <div className="opacity-40">... analyzing impact on cart-service ...</div>
                   </div>
                   <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-slate-950"></div>
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
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {i}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Bob Fix Generator</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Generates high-confidence pull requests that follow your project&apos;s coding standards and pass existing tests.</p>
                </div>
              </div>

              {/* Postmortem Agent */}
              <div className="md:col-span-2 lg:col-span-5 glass-card rounded-[2rem] p-8 flex flex-col justify-between group">
                <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all">
                  <FileText className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Bob Postmortem Writer</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">Comprehensive markdown postmortems ready for your SRE team&apos;s review.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ROI / Business Value Section */}
          <div className="mt-32 space-y-12">
            <div className="text-center space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Enterprise ROI Built-In</h3>
              <p className="text-slate-500 max-w-2xl mx-auto font-medium">Quantifiable business impact from day one. See exactly how much time and money IBM Bob saves your engineering team.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card rounded-[2rem] p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                <div className="text-5xl font-black text-slate-900 dark:text-white mb-2 tabular-nums">142<span className="text-primary text-3xl">hrs</span></div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Developer Hours Saved</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Equivalent to adding 3 full-time senior engineers to your incident response team this month.</p>
              </div>
              
              <div className="glass-card rounded-[2rem] p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                <div className="text-5xl font-black text-slate-900 dark:text-white mb-2 tabular-nums">85<span className="text-success text-3xl">%</span></div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">MTTR Reduction</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">From an average of 45 minutes down to just under 5 minutes per critical production incident.</p>
              </div>
              
              <div className="glass-card rounded-[2rem] p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                <div className="text-5xl font-black text-slate-900 dark:text-white mb-2 tabular-nums"><span className="text-blue-500 text-3xl">$</span>12.5<span className="text-blue-500 text-3xl">k</span></div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Operational Cost Saved</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Calculated based on prevented downtime SLA penalties and engineering hour reallocation.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Massive Watermark Footer */}
      <footer className="relative border-t border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col pt-16">
        
        {/* Sitemap Grid */}
        <div className="relative z-10 border-b border-black/5 dark:border-white/5 pb-16">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-0 lg:divide-x divide-black/5 dark:divide-white/5">
              
              {/* Stay Updated */}
              <div className="space-y-6 lg:pr-12">
                <h3 className="text-2xl md:text-3xl font-medium tracking-tight text-slate-900 dark:text-white">Stay Updated</h3>
                <a href="https://discord.gg/GG65Nx96" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-400 font-medium px-4 py-3 rounded-lg transition-colors border border-primary/20">
                  <span className="text-sm font-bold">Join Discord</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <div className="pt-6 flex justify-center">
                  <div className="w-24 h-24 border border-black/10 dark:border-white/10 rounded-full flex flex-col items-center justify-center bg-transparent">
                    <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Powered By</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white mt-1">IBM BOB</span>
                  </div>
                </div>
              </div>

              {/* Solutions */}
              <div className="space-y-6 lg:pl-12">
                <h4 className="text-sm font-bold text-success/80 dark:text-success">Solutions</h4>
                <ul className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <li><Link href="/scanner" className="hover:text-primary dark:hover:text-white transition-colors">Incident Scanner</Link></li>
                  <li><Link href="/scanner" className="hover:text-primary dark:hover:text-white transition-colors">Triage Engine</Link></li>
                  <li><Link href="/scanner" className="hover:text-primary dark:hover:text-white transition-colors">Automated Forensics</Link></li>
                  <li><Link href="/scanner" className="hover:text-primary dark:hover:text-white transition-colors">PR Generation</Link></li>
                  <li><Link href="/scanner" className="hover:text-primary dark:hover:text-white transition-colors">Postmortem AI</Link></li>
                </ul>
              </div>

              {/* Resources */}
              <div className="space-y-6 lg:pl-12">
                <h4 className="text-sm font-bold text-success/80 dark:text-success">Resources</h4>
                <ul className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <li><Link href="/docs" className="hover:text-primary dark:hover:text-white transition-colors">Documentation</Link></li>
                  <li><Link href="/docs" className="hover:text-primary dark:hover:text-white transition-colors">API Reference</Link></li>
                  <li><a href="https://github.com/bagusardin25/Sherlock-AI-Incident-Response-Co-pilot/commits/main" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-white transition-colors">Changelog</a></li>
                  <li><a href="https://lablab.ai/ai-hackathons/ibm-bob-hackathon/" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-white transition-colors">IBM Hackathon</a></li>
                </ul>
              </div>

              {/* Company */}
              <div className="space-y-6 lg:pl-12">
                <h4 className="text-sm font-bold text-success/80 dark:text-success">Company</h4>
                <ul className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <li><a href="https://github.com/bagusardin25/Sherlock-AI-Incident-Response-Co-pilot" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-white transition-colors">About Us</a></li>
                  <li><a href="https://github.com/bagusardin25/Sherlock-AI-Incident-Response-Co-pilot/wiki" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-white transition-colors">Blog</a></li>
                  <li><a href="https://github.com/bagusardin25/Sherlock-AI-Incident-Response-Co-pilot" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-white transition-colors">Use Cases</a></li>
                  <li><a href="https://github.com/bagusardin25/Sherlock-AI-Incident-Response-Co-pilot/issues" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="space-y-6 lg:pl-12">
                <h4 className="text-sm font-bold text-success/80 dark:text-success">Legal</h4>
                <ul className="space-y-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <li><a href="https://github.com/bagusardin25/Sherlock-AI-Incident-Response-Co-pilot" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-white transition-colors">Terms & Conditions</a></li>
                  <li><a href="https://github.com/bagusardin25/Sherlock-AI-Incident-Response-Co-pilot/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-primary dark:hover:text-white transition-colors">Privacy Policy</a></li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Nav Line */}
        <div className="relative z-10 border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-xl">
          <div className="container mx-auto px-6 max-w-7xl py-5 flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Left: Brand Icons */}
            <div className="flex items-center gap-3">
              <Link href="/docs" className="w-9 h-9 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" title="Documentation">
                <Book className="w-4 h-4" />
              </Link>
              <Link href="/docs" className="w-9 h-9 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" title="API Reference">
                <Code2 className="w-4 h-4" />
              </Link>
              <a href="https://github.com/bagusardin25/Sherlock-AI-Incident-Response-Co-pilot" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" title="GitHub Repository">
                <Github className="w-4 h-4" />
              </a>
            </div>
            
            {/* Right Copyright */}
            <div className="flex items-center">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                Copyright © 2026 Sherlock AI
              </div>
            </div>
          </div>
        </div>

        {/* Giant Watermark Text */}
        <div className="relative flex-grow flex items-end pointer-events-none select-none w-full pt-16 pb-4 [mask-image:linear-gradient(to_bottom,white_40%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,white_40%,transparent_100%)] overflow-hidden">
          <div className="flex w-max animate-infinite-scroll-reverse">
            {[...Array(2)].map((_, i) => (
              <h2 key={i} className="text-[18vw] font-black italic leading-none tracking-tighter text-transparent [-webkit-text-stroke:1px_rgba(0,0,0,0.15)] dark:[-webkit-text-stroke:1px_rgba(255,255,255,0.15)] whitespace-nowrap pr-8 md:pr-16">
                SHERLOCK × IBM BOB
              </h2>
            ))}
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
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-infinite-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-infinite-scroll-reverse {
          animation: scroll-reverse 50s linear infinite;
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