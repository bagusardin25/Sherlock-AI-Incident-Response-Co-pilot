'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Key, Plus, Trash2, Copy, Check, ArrowLeft, Eye, EyeOff, ShieldAlert, Loader2 } from 'lucide-react'

interface APIKeyItem {
  id: string
  name: string
  key_prefix: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export default function APIKeysPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [keys, setKeys] = useState<APIKeyItem[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/auth/login')
    }
  }, [isLoading, token, router])

  useEffect(() => {
    if (token) fetchKeys()
  }, [token])

  async function fetchKeys() {
    const res = await fetch('/api/api-keys', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setKeys(await res.json())
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newKeyName.trim()) return
    setIsCreating(true)
    setError('')
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newKeyName }),
      })
      if (!res.ok) {
        setError('Failed to create API key')
        return
      }
      const data = await res.json()
      setCreatedKey(data.key)
      setNewKeyName('')
      fetchKeys()
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this API key?')) return
    await fetch(`/api/api-keys/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    fetchKeys()
  }

  function handleCopy() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f1115]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-500">Loading API Keys...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1115] pb-24">
      {/* Top Navbar Area */}
      <div className="border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-[#0f1115]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/scanner" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
              <Key className="w-3.5 h-3.5 text-primary" />
            </div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">API Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 md:py-12">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">API Keys</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl">
            Manage your API keys for programmatic access to the Sherlock Incident Response Engine. These keys allow you to integrate Sherlock directly into your CI/CD pipelines or custom workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (Left 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Create Key Card */}
            <div className="bg-white dark:bg-[#1a1d24] rounded-2xl border border-black/5 dark:border-white/5 shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Create New Secret Key</h3>
              <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. Production Pipeline)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0f1115] border border-black/10 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                />
                <button
                  type="submit"
                  disabled={isCreating || !newKeyName.trim()}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Key
                </button>
              </form>
              {error && <p className="text-red-500 text-xs font-medium mt-3">{error}</p>}
            </div>

            {/* Newly created key banner */}
            {createdKey && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                      Save your secret key!
                    </h4>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mb-4">
                      Please copy this API key and store it somewhere safe. For security reasons, you won't be able to see it again.
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-2.5 rounded-lg bg-white dark:bg-[#0f1115] border border-emerald-200/50 dark:border-emerald-500/20 text-sm font-mono text-slate-900 dark:text-emerald-100 overflow-hidden text-ellipsis whitespace-nowrap shadow-sm">
                        {showKey ? createdKey : '•'.repeat(40)}
                      </div>
                      <button 
                        onClick={() => setShowKey(!showKey)} 
                        className="p-2.5 rounded-lg bg-white dark:bg-[#0f1115] border border-emerald-200/50 dark:border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors shadow-sm" 
                        title={showKey ? 'Hide key' : 'Show key'}
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={handleCopy} 
                        className="p-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm" 
                        title="Copy to clipboard"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Keys list */}
            <div className="bg-white dark:bg-[#1a1d24] rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Keys</h3>
                <span className="text-xs font-medium text-slate-500 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-full">
                  {keys.length} keys
                </span>
              </div>
              
              {keys.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
                    <Key className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">No API keys generated</p>
                  <p className="text-xs text-slate-500">Create your first key above to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-[#0f1115]/50 border-b border-black/5 dark:border-white/5">
                      <tr className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Secret Key</th>
                        <th className="px-6 py-4">Created</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {keys.map((k) => (
                        <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-[#0f1115]/30 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-slate-900 dark:text-white">{k.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-mono text-slate-500 dark:text-slate-400 text-xs bg-slate-100 dark:bg-[#0f1115] px-2 py-1 rounded inline-block border border-black/5 dark:border-white/5">
                              {k.key_prefix}...••••
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs font-medium">
                            {new Date(k.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleDelete(k.id)}
                              className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Revoke Key"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (Right 1/3) */}
          <div className="space-y-6">
            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 rounded-2xl p-6">
              <h4 className="flex items-center gap-2 text-sm font-bold text-primary dark:text-primary-400 mb-3">
                <ShieldAlert className="w-4 h-4" /> Security Best Practices
              </h4>
              <ul className="space-y-3">
                <li className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">Do not share your API key</strong> in publicly accessible areas such as GitHub, client-side code, and so forth.
                </li>
                <li className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">Rotate keys regularly</strong> to minimize the risk of unauthorized access. Delete keys you are no longer using.
                </li>
                <li className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white">Use environment variables</strong> to securely store your API keys in your application backend.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
