import Link from 'next/link'
import { Terminal, BookOpen, Layers, Zap, Shield, HelpCircle, ArrowLeft, Download, Code, Settings, Workflow } from 'lucide-react'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 w-full z-50 border-b border-slate-800 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-all duration-300">
                <Terminal className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  Sherlock
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Documentation</p>
              </div>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-foreground transition-colors px-4 py-2 bg-slate-900 rounded-full border border-slate-800">
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 flex-1 flex flex-col md:flex-row gap-8 py-8">
        <aside className="w-full md:w-64 flex-shrink-0 md:sticky md:top-24 h-fit max-h-[calc(100vh-6rem)] overflow-y-auto">
          <nav className="space-y-8 pr-4">
            <div>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Getting Started</h4>
              <ul className="space-y-1">
                <li><Link href="#introduction" className="flex items-center gap-3 text-sm text-slate-300 hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"><BookOpen className="w-4 h-4" /> Introduction</Link></li>
                <li><Link href="#installation" className="flex items-center gap-3 text-sm text-slate-300 hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"><Download className="w-4 h-4" /> Setup</Link></li>
                <li><Link href="#quickstart" className="flex items-center gap-3 text-sm text-slate-300 hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"><Zap className="w-4 h-4" /> Web Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">CLI</h4>
              <ul className="space-y-1">
                <li><Link href="#cli-commands" className="flex items-center gap-3 text-sm text-slate-300 hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"><Code className="w-4 h-4" /> Commands</Link></li>
                <li><Link href="#configuration" className="flex items-center gap-3 text-sm text-slate-300 hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"><Settings className="w-4 h-4" /> Configuration</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Platform</h4>
              <ul className="space-y-1">
                <li><Link href="#how-it-works" className="flex items-center gap-3 text-sm text-slate-300 hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"><Workflow className="w-4 h-4" /> How it Works</Link></li>
                <li><Link href="#agents" className="flex items-center gap-3 text-sm text-slate-300 hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"><Shield className="w-4 h-4" /> AI Agents</Link></li>
                <li><Link href="#faq" className="flex items-center gap-3 text-sm text-slate-300 hover:text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"><HelpCircle className="w-4 h-4" /> FAQ</Link></li>
              </ul>
            </div>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 bg-slate-900/30 border border-slate-800 rounded-3xl p-6 md:p-12 mb-16 shadow-lg">
          {children}
        </main>
      </div>
    </div>
  )
}
