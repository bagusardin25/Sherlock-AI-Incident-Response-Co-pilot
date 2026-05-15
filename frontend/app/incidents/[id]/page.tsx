'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import AgentCard from '@/components/AgentCard'
import { AlertCircle, CheckCircle2, Clock, XCircle, Home, Download, RefreshCw, Sparkles, TrendingUp } from 'lucide-react'

interface AgentEvent {
  agent_name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  message: string
  data?: any
  timestamp: string
}

interface AgentState {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  message: string
  data?: any
  startTime?: Date
  endTime?: Date
}

export default function IncidentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const incidentId = params.id as string
  const rawInput = searchParams.get('raw_input') || ''
  const repoPath = searchParams.get('repo_path') || ''

  const [agents, setAgents] = useState<Record<string, AgentState>>({
    triage: { name: 'Triage Agent', status: 'pending', message: 'Waiting to start...' },
    forensics: { name: 'Forensics Agent', status: 'pending', message: 'Waiting to start...' },
    bob_analyst: { name: 'Bob Analyst', status: 'pending', message: 'Waiting to start...' },
    fix: { name: 'Fix Generator', status: 'pending', message: 'Waiting to start...' },
    postmortem: { name: 'Postmortem Writer', status: 'pending', message: 'Waiting to start...' },
  })

  const [pipelineStatus, setPipelineStatus] = useState<'connecting' | 'processing' | 'completed' | 'failed'>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [postmortem, setPostmortem] = useState<string | null>(null)
  const [startTime] = useState(new Date())
  const [elapsedTime, setElapsedTime] = useState(0)

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  useEffect(() => {
    if (!rawInput || !repoPath) {
      setError('Missing required parameters')
      return
    }

    // Connect to SSE stream
    const eventSource = new EventSource(
      `/api/incidents/${incidentId}/stream?raw_input=${encodeURIComponent(rawInput)}&repo_path=${encodeURIComponent(repoPath)}`
    )

    eventSource.onopen = () => {
      console.log('SSE connection opened')
      setPipelineStatus('processing')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Check for completion or error
        if (data.type === 'complete') {
          setPipelineStatus('completed')
          eventSource.close()
          return
        }

        if (data.type === 'error') {
          setError(data.message)
          setPipelineStatus('failed')
          eventSource.close()
          return
        }

        // Handle agent event
        const agentEvent: AgentEvent = data
        
        setAgents((prev) => {
          const updated = { ...prev }
          const agentKey = agentEvent.agent_name

          if (agentKey === 'pipeline') {
            // Pipeline-level events
            if (agentEvent.status === 'completed') {
              setPipelineStatus('completed')
            } else if (agentEvent.status === 'failed') {
              setPipelineStatus('failed')
              setError(agentEvent.message)
            }
            return updated
          }

          if (updated[agentKey]) {
            updated[agentKey] = {
              ...updated[agentKey],
              status: agentEvent.status,
              message: agentEvent.message,
              data: agentEvent.data,
            }

            if (agentEvent.status === 'running' && !updated[agentKey].startTime) {
              updated[agentKey].startTime = new Date()
            }

            if (agentEvent.status === 'completed' || agentEvent.status === 'failed') {
              updated[agentKey].endTime = new Date()
            }
          }

          return updated
        })
      } catch (err) {
        console.error('Error parsing SSE event:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE error:', err)
      setError('Connection to server lost')
      setPipelineStatus('failed')
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [incidentId, rawInput, repoPath])

  const getStatusIcon = () => {
    switch (pipelineStatus) {
      case 'connecting':
        return <Clock className="w-6 h-6 text-yellow-400 animate-pulse" />
      case 'processing':
        return <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-400" />
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-400" />
    }
  }

  const getStatusText = () => {
    switch (pipelineStatus) {
      case 'connecting':
        return 'Connecting to analysis pipeline...'
      case 'processing':
        return 'AI agents analyzing incident...'
      case 'completed':
        return 'Analysis completed successfully!'
      case 'failed':
        return 'Analysis failed'
    }
  }

  const getStatusColor = () => {
    switch (pipelineStatus) {
      case 'connecting':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
      case 'processing':
        return 'from-blue-500/20 to-purple-500/20 border-blue-500/30'
      case 'completed':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30'
      case 'failed':
        return 'from-red-500/20 to-pink-500/20 border-red-500/30'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const completedAgents = Object.values(agents).filter(a => a.status === 'completed').length
  const totalAgents = Object.keys(agents).length
  const progress = (completedAgents / totalAgents) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-white/10 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h1 className="text-xl font-bold text-white">Incident Analysis</h1>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">ID: <span className="text-gray-300 font-mono">{incidentId}</span></span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400">Time: <span className="text-gray-300 font-mono">{formatTime(elapsedTime)}</span></span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Progress Bar */}
              {pipelineStatus === 'processing' && (
                <div className="hidden md:block w-48">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">Progress</span>
                    <span className="text-xs text-blue-400 font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className={`flex items-center gap-3 px-4 py-2 bg-gradient-to-r ${getStatusColor()} backdrop-blur-xl rounded-full border`}>
                {getStatusIcon()}
                <span className="text-sm font-medium text-white hidden md:block">{getStatusText()}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative container mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 animate-shake">
            <div className="bg-gradient-to-r from-red-900/30 to-pink-900/30 border border-red-500/30 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-red-400 mb-1">Analysis Error</p>
                  <p className="text-sm text-gray-300">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agent Pipeline */}
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              AI Agent Pipeline
            </h2>
            <div className="text-sm text-gray-400">
              {completedAgents} of {totalAgents} agents completed
            </div>
          </div>

          {Object.entries(agents).map(([key, agent], index) => (
            <AgentCard
              key={key}
              name={agent.name}
              status={agent.status}
              message={agent.message}
              data={agent.data}
              index={index}
            />
          ))}
        </div>

        {/* Completion Section */}
        {pipelineStatus === 'completed' && (
          <div className="max-w-5xl mx-auto mt-12 space-y-6 animate-fade-in-up">
            {/* Success Banner */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-3xl p-8 backdrop-blur-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Analysis Complete!</h3>
                    <p className="text-green-400">All agents finished successfully</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
                    <div className="text-2xl font-bold text-blue-400">{formatTime(elapsedTime)}</div>
                    <div className="text-sm text-gray-400">Total Time</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
                    <div className="text-2xl font-bold text-purple-400">~4 hours</div>
                    <div className="text-sm text-gray-400">Time Saved</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10">
                    <div className="text-2xl font-bold text-green-400">{totalAgents}</div>
                    <div className="text-sm text-gray-400">Agents Used</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/incidents/${incidentId}/postmortem`)
                    if (!res.ok) throw new Error('Postmortem not ready yet')
                    const data = await res.json()
                    setPostmortem(data.postmortem)
                  } catch (e: any) {
                    alert(e.message)
                  }
                }}
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-2xl hover:shadow-blue-500/50"
              >
                <Download className="w-5 h-5" />
                <span>View Postmortem</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Retry Analysis</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                <Home className="w-5 h-5" />
                <span>New Incident</span>
              </button>
            </div>
          </div>
        )}

        {/* Postmortem Display */}
        {postmortem && (
          <div className="max-w-5xl mx-auto mt-8 animate-fade-in-up">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl"></div>
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <Download className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Postmortem Report</h3>
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob([postmortem], { type: 'text/markdown' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `postmortem-${incidentId}.md`
                      a.click()
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-all border border-blue-500/20"
                  >
                    Download MD
                  </button>
                </div>
                <div className="prose prose-invert max-w-none">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-slate-900/50 rounded-xl p-6 border border-white/10 overflow-x-auto">
                    {postmortem}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}