'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Key, Plus, Trash2, Copy, Check, ArrowLeft, Eye, EyeOff } from 'lucide-react'

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
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-slate-400">Loading...</p></div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Key className="w-7 h-7 text-primary" /> API Keys
          </h1>
          <p className="text-slate-400 mt-2">Manage API keys for programmatic access to Sherlock.</p>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. CI/CD Pipeline)"
            className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={isCreating || !newKeyName.trim()}
            className="px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </form>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Newly created key banner */}
        {createdKey && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-900/30 border border-emerald-700/50">
            <p className="text-sm text-emerald-300 font-medium mb-2">
              ✓ API key created. Copy it now — you won&apos;t see it again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded bg-slate-900 text-sm font-mono text-white overflow-x-auto">
                {showKey ? createdKey : '•'.repeat(40)}
              </code>
              <button onClick={() => setShowKey(!showKey)} className="p-2 rounded hover:bg-slate-700 text-slate-400" title={showKey ? 'Hide' : 'Show'}>
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={handleCopy} className="p-2 rounded hover:bg-slate-700 text-slate-400" title="Copy">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Keys list */}
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          {keys.length === 0 ? (
            <p className="p-6 text-center text-slate-500">No API keys yet. Create one above.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr className="text-left text-slate-400">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-white">{k.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{k.key_prefix}...••••</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="p-1.5 rounded hover:bg-red-900/30 text-slate-500 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
