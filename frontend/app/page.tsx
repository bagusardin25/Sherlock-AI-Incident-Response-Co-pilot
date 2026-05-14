'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Zap, GitBranch, FileText, AlertCircle } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [rawInput, setRawInput] = useState('')
  const [repoPath, setRepoPath] = useState('../fixtures/flaky-shop')
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
          repo_path: repoPath,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit incident')
      }

      const data = await response.json()
      
      // Navigate to incident page with query params
      router.push(
        `/incidents/${data.incident_id}?raw_input=${encodeURIComponent(rawInput)}&repo_path=${encodeURIComponent(repoPath)}`
      )
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Search className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Sherlock</h1>
              <p className="text-sm text-gray-400">AI Incident Response Co-pilot</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            From Alert to Fix PR in <span className="text-blue-500">5 Minutes</span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Your AI on-call partner that actually reads the codebase
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Fast Analysis</h3>
              <p className="text-sm text-gray-400">
                Multi-agent pipeline analyzes incidents in minutes
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <GitBranch className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Code-Level Fixes</h3>
              <p className="text-sm text-gray-400">
                IBM Bob generates patches with full repo context
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <FileText className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Auto Postmortem</h3>
              <p className="text-sm text-gray-400">
                Comprehensive documentation generated automatically
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-8">
            <h3 className="text-xl font-semibold text-white mb-6">Submit Incident</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Alert Input */}
              <div>
                <label htmlFor="alert" className="block text-sm font-medium text-gray-300 mb-2">
                  Alert / Error Message
                </label>
                <textarea
                  id="alert"
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="Paste your error message, stack trace, or alert here..."
                  className="w-full h-48 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={loadSampleAlert}
                  className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  Load sample alert
                </button>
              </div>

              {/* Repo Path */}
              <div>
                <label htmlFor="repo" className="block text-sm font-medium text-gray-300 mb-2">
                  Repository Path
                </label>
                <input
                  id="repo"
                  type="text"
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  placeholder="/path/to/repository"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  Path to the repository for analysis (relative or absolute)
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Start Analysis
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info Box */}
          <div className="mt-8 bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                <p className="font-semibold text-white mb-1">Powered by IBM Bob</p>
                <p>
                  Sherlock uses IBM Bob for deep code analysis with full repository context.
                  The multi-agent pipeline will analyze your incident, identify root cause,
                  generate a fix, and create a comprehensive postmortem.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Built for IBM Bob Hackathon 2026 • Sherlock v1.0.0</p>
        </div>
      </footer>
    </div>
  )
}
