'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import AgentCard from '@/components/AgentCard'
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'

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
    triage: { name: 'Triage', status: 'pending', message: 'Waiting to start...' },
    forensics: { name: 'Forensics', status: 'pending', message: 'Waiting to start...' },
    bob_analyst: { name: 'Bob Analyst', status: 'pending', message: 'Waiting to start...' },
    fix: { name: 'Fix Generator', status: 'pending', message: 'Waiting to start...' },
    postmortem: { name: 'Postmortem', status: 'pending', message: 'Waiting to start...' },
  })

  const [pipelineStatus, setPipelineStatus] = useState<'connecting' | 'processing' | 'completed' | 'failed'>('connecting')
  const [error, setError] = useState<string | null>(null)

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
        return <Clock className="w-6 h-6 text-yellow-500 animate-pulse" />
      case 'processing':
        return <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (pipelineStatus) {
      case 'connecting':
        return 'Connecting to analysis pipeline...'
      case 'processing':
        return 'Analysis in progress...'
      case 'completed':
        return 'Analysis completed successfully!'
      case 'failed':
        return 'Analysis failed'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Incident Analysis</h1>
              <p className="text-sm text-gray-400">ID: {incidentId}</p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <span className="text-sm font-medium text-gray-300">{getStatusText()}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800/50 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-400">Error</p>
                <p className="text-sm text-gray-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Agent Timeline */}
        <div className="max-w-4xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-white mb-6">Agent Pipeline</h2>

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

        {/* Completion Actions */}
        {pipelineStatus === 'completed' && (
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Next Steps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => window.open(`/api/incidents/${incidentId}/postmortem`, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  📄 View Postmortem
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  🔍 Analyze Another Incident
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Time Saved Banner */}
        {pipelineStatus === 'completed' && (
          <div className="max-w-4xl mx-auto mt-6 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-800/50 rounded-lg p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-2">
                ⚡ Estimated Time Saved: ~4 hours
              </p>
              <p className="text-gray-400">
                Traditional debugging vs. Sherlock AI-powered analysis
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
