'use client'

import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { Search, Home, Key, LogOut, Code2, ShieldAlert, Moon, Sun } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useTheme } from 'next-themes'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => setOpen(false)} />
      
      <Command 
        className="relative w-full max-w-xl bg-slate-950/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass-panel"
        filter={(value, search) => {
          if (value.toLowerCase().includes(search.toLowerCase())) return 1
          return 0
        }}
      >
        <div className="flex items-center px-4 py-3 border-b border-white/5">
          <Search className="w-5 h-5 text-slate-500 mr-3" />
          <Command.Input 
            autoFocus 
            placeholder="Type a command or search..." 
            className="w-full bg-transparent border-none text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-500 text-sm font-medium"
          />
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 text-[10px] font-medium bg-white/10 rounded-md text-slate-400">ESC</kbd>
          </div>
        </div>

        <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-none">
          <Command.Empty className="py-6 text-center text-sm text-slate-500">
            No results found.
          </Command.Empty>

          <Command.Group heading={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1 block">Navigation</span>}>
            <Command.Item 
              onSelect={() => runCommand(() => router.push('/'))}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 rounded-xl cursor-pointer hover:bg-primary/20 aria-selected:bg-primary/20 aria-selected:text-white transition-colors"
            >
              <Home className="w-4 h-4 text-slate-400" />
              <span>Dashboard</span>
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => router.push('/incidents'))}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 rounded-xl cursor-pointer hover:bg-primary/20 aria-selected:bg-primary/20 aria-selected:text-white transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              <span>Incidents</span>
            </Command.Item>
          </Command.Group>

          {user && (
            <Command.Group heading={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1 block mt-2">Account</span>}>
              <Command.Item 
                onSelect={() => runCommand(() => router.push('/settings/api-keys'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 rounded-xl cursor-pointer hover:bg-primary/20 aria-selected:bg-primary/20 aria-selected:text-white transition-colors"
              >
                <Key className="w-4 h-4 text-slate-400" />
                <span>API Keys</span>
              </Command.Item>
              <Command.Item 
                onSelect={() => runCommand(() => {
                  logout()
                  router.push('/auth/login')
                })}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 rounded-xl cursor-pointer hover:bg-red-500/20 aria-selected:bg-red-500/20 aria-selected:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </Command.Item>
            </Command.Group>
          )}

          <Command.Group heading={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1 block mt-2">Appearance</span>}>
            <Command.Item 
              onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer hover:bg-primary/20 aria-selected:bg-primary/20 aria-selected:text-slate-900 dark:aria-selected:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-slate-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
              <span>Toggle Theme</span>
            </Command.Item>
          </Command.Group>

          <Command.Group heading={<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1 block mt-2">Resources</span>}>
            <Command.Item 
              onSelect={() => runCommand(() => window.open('https://github.com/bagusardin25/Sherlock-AI-Incident-Response-Co-pilot', '_blank'))}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 rounded-xl cursor-pointer hover:bg-primary/20 aria-selected:bg-primary/20 aria-selected:text-white transition-colors"
            >
              <Code2 className="w-4 h-4 text-slate-400" />
              <span>GitHub Repository</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}
