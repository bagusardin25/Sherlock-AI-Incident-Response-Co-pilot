'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import AgentCard from '@/components/AgentCard'
import { AlertCircle, CheckCircle2, Clock, XCircle, Home, Download, RefreshCw, Sparkles, TrendingUp, Terminal, Activity, FileText, Rocket } from 'lucide-react'
import confetti from 'canvas-confetti'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

type AgentMap = Record<string, AgentState>

interface IncidentSnapshot {
  status?: string
  triage?: any
  forensics?: any
  root_cause?: any
  fix?: any
  postmortem?: string
}

const initialAgents: AgentMap = {
  triage: { name: 'Bob Triage Engine', status: 'pending', message: 'Waiting in queue...' },
  forensics: { name: 'Bob Forensics Engine', status: 'pending', message: 'Waiting in queue...' },
  bob_analyst: { name: 'IBM Bob Analyst', status: 'pending', message: 'Waiting in queue...' },
  fix: { name: 'Bob Fix Generator', status: 'pending', message: 'Waiting in queue...' },
  postmortem: { name: 'Bob Postmortem Writer', status: 'pending', message: 'Waiting in queue...' },
}

const terminalStatuses = new Set(['completed', 'partial', 'failed'])

function applySnapshotToAgents(snapshot: IncidentSnapshot, previous: AgentMap): AgentMap {
  const now = new Date()
  const updated: AgentMap = {
    ...previous,
    triage: {
      ...previous.triage,
      status: snapshot.triage ? 'completed' : previous.triage.status,
      message: snapshot.triage
        ? `Triage completed: ${snapshot.triage.severity?.toUpperCase?.() ?? 'UNKNOWN'} severity, ${snapshot.triage.error_type ?? 'unknown'}`
        : previous.triage.message,
      data: snapshot.triage
        ? {
            severity: snapshot.triage.severity,
            error_type: snapshot.triage.error_type,
            service: snapshot.triage.service,
            confidence: snapshot.triage.confidence,
          }
        : previous.triage.data,
      endTime: snapshot.triage ? previous.triage.endTime ?? now : previous.triage.endTime,
    },
    forensics: {
      ...previous.forensics,
      status: snapshot.forensics ? 'completed' : previous.forensics.status,
      message: snapshot.forensics
        ? `Forensics completed: ${snapshot.forensics.recent_commits?.length ?? 0} commits, ${snapshot.forensics.suspect_files?.length ?? 0} suspect files`
        : previous.forensics.message,
      data: snapshot.forensics
        ? {
            commits_count: snapshot.forensics.recent_commits?.length ?? 0,
            suspect_files: snapshot.forensics.suspect_files ?? [],
            blame_entries: snapshot.forensics.blame_info?.length ?? 0,
          }
        : previous.forensics.data,
      endTime: snapshot.forensics ? previous.forensics.endTime ?? now : previous.forensics.endTime,
    },
    bob_analyst: {
      ...previous.bob_analyst,
      status: snapshot.root_cause ? 'completed' : previous.bob_analyst.status,
      message: snapshot.root_cause
        ? `Root cause identified: ${String(snapshot.root_cause.root_cause ?? '').slice(0, 100)}...`
        : previous.bob_analyst.message,
      data: snapshot.root_cause
        ? {
            root_cause: snapshot.root_cause.root_cause,
            suspect_files_count: snapshot.root_cause.suspect_files?.length ?? 0,
            confidence: snapshot.root_cause.confidence,
          }
        : previous.bob_analyst.data,
      endTime: snapshot.root_cause ? previous.bob_analyst.endTime ?? now : previous.bob_analyst.endTime,
    },
    fix: {
      ...previous.fix,
      status: snapshot.fix ? 'completed' : previous.fix.status,
      message: snapshot.fix ? `Fix generated: ${snapshot.fix.pr_title ?? 'Proposed patch'}` : previous.fix.message,
      data: snapshot.fix
        ? {
            pr_title: snapshot.fix.pr_title,
            files_modified: snapshot.fix.files_modified ?? [],
            has_test: Boolean(snapshot.fix.test_code),
          }
        : previous.fix.data,
      endTime: snapshot.fix ? previous.fix.endTime ?? now : previous.fix.endTime,
    },
    postmortem: {
      ...previous.postmortem,
      status: snapshot.postmortem ? 'completed' : previous.postmortem.status,
      message: snapshot.postmortem ? 'Postmortem document generated' : previous.postmortem.message,
      data: snapshot.postmortem
        ? {
            length: snapshot.postmortem.length,
            sections: (snapshot.postmortem.match(/##/g) ?? []).length,
          }
        : previous.postmortem.data,
      endTime: snapshot.postmortem ? previous.postmortem.endTime ?? now : previous.postmortem.endTime,
    },
  }

  if (snapshot.status === 'failed') {
    for (const key of Object.keys(updated)) {
      if (updated[key].status === 'pending' || updated[key].status === 'running') {
        updated[key] = { ...updated[key], status: 'failed', message: 'No completed result was saved for this step' }
      }
    }
  }

  return updated
}

export default function IncidentPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isLoading: authLoading } = useAuth()
  const incidentId = params.id as string

  const [agents, setAgents] = useState<AgentMap>(initialAgents)

  const [pipelineStatus, setPipelineStatus] = useState<'connecting' | 'processing' | 'completed' | 'failed'>('connecting')
  const [error, setError] = useState<string | null>(null)
  const [postmortem, setPostmortem] = useState<string | null>(null)
  const [startTime] = useState(new Date())
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isMerged, setIsMerged] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [mergeError, setMergeError] = useState<string | null>(null)
  const [commitUrl, setCommitUrl] = useState<string | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  const loadSnapshot = useCallback(async (): Promise<IncidentSnapshot | null> => {
    const res = await fetch(`/api/incidents/${incidentId}/state`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) return null

    const snapshot = await res.json()
    setAgents((prev) => applySnapshotToAgents(snapshot, prev))
    if (snapshot.postmortem) setPostmortem(snapshot.postmortem)

    return snapshot
  }, [incidentId, token])

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      if (pipelineStatus === 'connecting' || pipelineStatus === 'processing') {
        setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime, pipelineStatus])

  useEffect(() => {
    if (authLoading) return
    if (!token) {
      router.push('/auth/login')
      return
    }

    let eventSource: EventSource | null = null
    let cancelled = false

    const connect = async () => {
      const snapshot = await loadSnapshot().catch((err) => {
        console.warn('Unable to load incident snapshot:', err)
        return null
      })

      if (cancelled) return

      if (snapshot && terminalStatuses.has(snapshot.status ?? '')) {
        setPipelineStatus(snapshot.status === 'failed' ? 'failed' : 'completed')
        if (snapshot.status === 'failed') setError('Incident analysis failed before all results were saved')
        return
      }

      // Connect to SSE stream with token for active investigations.
      eventSource = new EventSource(
        `/api/incidents/${incidentId}/stream?token=${encodeURIComponent(token)}`
      )

      eventSource.onopen = () => {
        console.log('SSE connection opened')
        setPipelineStatus('processing')
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'complete') {
            setPipelineStatus('completed')
            eventSource?.close()
            return
          }

          if (data.type === 'error') {
            setError(data.message)
            setPipelineStatus('failed')
            eventSource?.close()
            return
          }

          const agentEvent: AgentEvent = data
          
          setAgents((prev) => {
            const updated = { ...prev }
            const agentKey = agentEvent.agent_name

            if (agentKey === 'pipeline') {
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

              if ((agentEvent.status === 'completed' || agentEvent.status === 'failed') && !updated[agentKey].endTime) {
                updated[agentKey].endTime = new Date()
              }
            }

            return updated
          })
        } catch (err) {
          console.error('Error parsing SSE event:', err)
        }
      }

      eventSource.onerror = async (err) => {
        console.error('SSE error:', err)
        eventSource?.close()

        const fallbackSnapshot = await loadSnapshot().catch(() => null)
        if (fallbackSnapshot && terminalStatuses.has(fallbackSnapshot.status ?? '')) {
          setPipelineStatus(fallbackSnapshot.status === 'failed' ? 'failed' : 'completed')
          if (fallbackSnapshot.status !== 'failed') setError(null)
          return
        }

        setError('Connection to analysis server lost')
        setPipelineStatus('failed')
      }
    }

    connect()

    return () => {
      cancelled = true
      eventSource?.close()
    }
  }, [incidentId, token, authLoading, loadSnapshot])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const completedAgents = Object.values(agents).filter(a => a.status === 'completed').length
  const totalAgents = Object.keys(agents).length
  const progress = (completedAgents / totalAgents) * 100

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
        <div className="container mx-auto px-4 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <button onClick={() => router.push('/')} className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <Home className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-0.5">
                  <Activity className="w-4 h-4 text-primary" />
                  <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Active Investigation</h1>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-600 dark:text-slate-500">ID: <span className="text-slate-900 dark:text-slate-300 font-mono">{incidentId}</span></span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  <span className="text-slate-600 dark:text-slate-500">Time elapsed: <span className="text-primary font-mono font-medium">{formatTime(elapsedTime)}</span></span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-5 w-full md:w-auto">
              {/* Progress Bar */}
              {pipelineStatus === 'processing' && (
                <div className="flex-1 md:w-48">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pipeline Progress</span>
                    <span className="text-[10px] font-bold text-primary">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider ${
                pipelineStatus === 'connecting' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                pipelineStatus === 'processing' ? 'bg-primary/10 border-primary/20 text-primary' :
                pipelineStatus === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                {pipelineStatus === 'connecting' && <Clock className="w-3.5 h-3.5 animate-pulse" />}
                {pipelineStatus === 'processing' && <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                {pipelineStatus === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {pipelineStatus === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{pipelineStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-24 md:py-32">
        {/* Error Display */}
        {error && (
          <div className="mb-8 animate-fade-in-up">
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-5 backdrop-blur-xl">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-800 dark:text-red-400 mb-1">Pipeline Interrupted</h3>
                  <p className="text-sm text-red-600 dark:text-red-200/80">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agent Pipeline */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">IBM Bob Execution Logs</h2>
            </div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-3 py-1.5 rounded-full">
              {completedAgents} / {totalAgents} Modules
            </div>
          </div>

          <div className="space-y-4">
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
        </div>

        {/* Completion Section */}
        {pipelineStatus === 'completed' && (
          <div className="max-w-4xl mx-auto mt-12 space-y-8 animate-fade-in-up">
            <div className="relative overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-8 shadow-sm dark:shadow-[0_0_50px_rgba(16,185,129,0.05)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0"></div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Resolution Ready</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Pull request generated and postmortem finalized.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatTime(elapsedTime)}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Resolution Time</div>
                  </div>
                  <div className="w-px h-10 bg-slate-200 dark:bg-white/10"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">~4h</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">Time Saved</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mergeError && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  <span className="text-red-700 dark:text-red-300">{mergeError}</span>
                </div>
              )}

              <button
                onClick={async () => {
                  if (isMerged || isMerging) return;
                  setIsMerging(true);
                  setMergeError(null);
                  try {
                    const res = await fetch(`/api/incidents/${incidentId}/merge`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.detail || 'Merge failed');
                    }
                    confetti({
                      particleCount: 150,
                      spread: 80,
                      origin: { y: 0.6 },
                      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                      zIndex: 9999
                    });
                    setIsMerged(true);
                    if (data.commit_url) setCommitUrl(data.commit_url);
                    if (data.file_url) setFileUrl(data.file_url);
                  } catch (e: any) {
                    setMergeError(e.message);
                  } finally {
                    setIsMerging(false);
                  }
                }}
                disabled={isMerged || isMerging}
                className={`col-span-1 sm:col-span-2 lg:col-span-3 ${isMerged ? 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : isMerging ? 'bg-primary/70 cursor-wait' : 'bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:shadow-[0_0_40px_rgba(59,130,246,0.6)]'} text-white font-bold py-5 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg group disabled:opacity-80`}
              >
                {isMerging ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isMerged ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Rocket className="w-6 h-6 group-hover:translate-y-[-2px] transition-transform" />
                )}
                <span>{isMerging ? 'Pushing to GitHub...' : isMerged ? 'Fix Merged to Production!' : '🚀 Merge Fix & Close Incident'}</span>
              </button>

              {isMerged && (commitUrl || fileUrl) && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <span className="text-emerald-800 dark:text-emerald-300 font-medium">Postmortem report pushed to GitHub!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {fileUrl && (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">View File</a>
                    )}
                    {commitUrl && (
                      <a href={commitUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-xs font-bold transition-colors">View Commit</a>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/incidents/${incidentId}/postmortem`, {
                      headers: { 'Authorization': `Bearer ${token}` }
                    })
                    if (!res.ok) throw new Error('Postmortem not ready yet')
                    const data = await res.json()
                    setPostmortem(data.postmortem)
                  } catch (e: any) {
                    alert(e.message)
                  }
                }}
                className="bg-slate-100 dark:bg-white hover:bg-slate-200 dark:hover:bg-slate-100 text-slate-900 dark:text-slate-950 font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                <FileText className="w-5 h-5" />
                <span>Read Postmortem</span>
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                <RefreshCw className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <span>Rerun Analysis</span>
              </button>
              
              <button
                onClick={() => router.push('/')}
                className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 sm:col-span-2 lg:col-span-1"
              >
                <Home className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <span>New Incident</span>
              </button>
            </div>
          </div>
        )}

        {/* Postmortem Display */}
        {postmortem && (
          <div className="max-w-4xl mx-auto mt-12 animate-fade-in-up">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-6 md:p-8 shadow-xl dark:shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center border border-secondary/20">
                    <Download className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Incident Postmortem</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Generated automatically by IBM Bob via Sherlock</p>
                  </div>
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
                  className="shrink-0 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-200 dark:border-white/5"
                >
                  <Download className="w-4 h-4" />
                  Download .MD
                </button>
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-primary prose-pre:bg-slate-50 dark:prose-pre:bg-slate-950 prose-pre:border-slate-200 dark:prose-pre:border-white/5">
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="markdown-content">
                  {postmortem}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </main>

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
        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}
