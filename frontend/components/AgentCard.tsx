import { CheckCircle2, Clock, XCircle, Loader2, ChevronDown, ChevronUp, Terminal } from 'lucide-react'
import { useState } from 'react'

interface AgentCardProps {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  message: string
  data?: any
  index: number
}

export default function AgentCard({ name, status, message, data, index }: AgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'border-white/5 bg-slate-900/40 text-slate-400'
      case 'running':
        return 'border-primary/30 bg-slate-900/60 shadow-[0_0_30px_rgba(59,130,246,0.1)] text-primary'
      case 'completed':
        return 'border-emerald-500/30 bg-slate-900/60 shadow-[0_0_30px_rgba(16,185,129,0.05)] text-emerald-400'
      case 'failed':
        return 'border-red-500/30 bg-slate-900/60 shadow-[0_0_30px_rgba(239,68,68,0.05)] text-red-400'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center border border-white/5">
            <Clock className="w-5 h-5 text-slate-500" />
          </div>
        )
      case 'running':
        return (
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 relative">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <div className="absolute -inset-1 bg-primary/20 blur-md rounded-xl animate-pulse"></div>
          </div>
        )
      case 'completed':
        return (
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        )
      case 'failed':
        return (
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
        )
    }
  }

  const getStatusBadge = () => {
    const badges = {
      pending: 'bg-slate-800/50 text-slate-400 border-white/5',
      running: 'bg-primary/10 text-primary border-primary/20 animate-pulse',
      completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    }

    return (
      <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border ${badges[status]}`}>
        {status}
      </span>
    )
  }

  const renderData = () => {
    if (!data || status !== 'completed') return null

    return (
      <div className="mt-5 pt-4 border-t border-white/5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left mb-4 group"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
            <h4 className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">Analysis Output</h4>
          </div>
          <div className="p-1 rounded bg-slate-800/50 group-hover:bg-slate-800 transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="bg-slate-950/50 rounded-xl p-5 text-sm border border-white/5 space-y-4 animate-slide-down font-mono">
            {/* Triage Data */}
            {data.severity && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Severity:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                    data.severity === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    data.severity === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    data.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {data.severity.toUpperCase()}
                  </span>
                </div>
                {data.error_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Error Type:</span>
                    <span className="text-slate-300 text-xs bg-slate-800/50 px-2 py-1 rounded border border-white/5">{data.error_type}</span>
                  </div>
                )}
                {data.service && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Service:</span>
                    <span className="text-slate-300">{data.service}</span>
                  </div>
                )}
                {data.confidence && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Confidence:</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${data.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-slate-300 text-xs">{(data.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Forensics Data */}
            {data.commits_count !== undefined && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded-lg p-4 border border-white/5">
                    <div className="text-2xl font-bold text-primary mb-1">{data.commits_count}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Recent Commits</div>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4 border border-white/5">
                    <div className="text-2xl font-bold text-secondary mb-1">{data.suspect_files?.length || 0}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">Suspect Files</div>
                  </div>
                </div>
                {data.suspect_files && data.suspect_files.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">Affected Files:</p>
                    <div className="space-y-2">
                      {data.suspect_files.slice(0, 3).map((file: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 text-xs bg-slate-900/50 p-2 rounded border border-white/5">
                          <div className="w-1 h-1 bg-secondary rounded-full"></div>
                          <span className="text-slate-300 break-all">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bob Analyst Data */}
            {data.root_cause && (
              <div className="space-y-3">
                <div className="bg-slate-900/80 rounded-lg p-4 border border-white/5">
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{data.root_cause}</p>
                </div>
                {data.confidence && (
                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-slate-500">Analysis Confidence:</span>
                    <span className="text-primary">{(data.confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Fix Data */}
            {data.pr_title && (
              <div className="space-y-3">
                <div className="bg-slate-900/80 rounded-lg p-4 border border-white/5">
                  <p className="text-white text-sm font-semibold mb-3 pb-3 border-b border-white/5">{data.pr_title}</p>
                  <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Files modified:</span>
                      <span className="text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">{data.files_modified?.length || 0}</span>
                    </div>
                    {data.has_test !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Tests:</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded ${data.has_test ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                          {data.has_test ? 'Included' : 'Missing'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Postmortem Data */}
            {data.length && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-4 border border-white/5">
                  <div className="text-xl font-bold text-secondary mb-1">{data.length}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Characters</div>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 border border-white/5">
                  <div className="text-xl font-bold text-primary mb-1">{data.sections}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">Sections</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`relative border rounded-2xl p-5 md:p-6 transition-all duration-300 backdrop-blur-xl ${getStatusColor()} animate-slide-in hover:border-white/10`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-4 flex-1">
            {getStatusIcon()}
            <div className="flex-1">
              <h3 className="text-base font-bold text-white mb-1">{name}</h3>
              <p className="text-sm text-slate-400">{message}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {renderData()}

        {/* Progress indicator for running state */}
        {status === 'running' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 rounded-b-2xl overflow-hidden">
            <div className="h-full bg-primary animate-progress shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-slide-in {
          animation: slide-in 0.4s ease-out forwards;
          opacity: 0;
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
          width: 50%;
        }
      `}</style>
    </div>
  )
}