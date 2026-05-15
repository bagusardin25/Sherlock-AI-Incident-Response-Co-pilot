import { CheckCircle2, Clock, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
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
        return 'border-white/10 bg-slate-800/30'
      case 'running':
        return 'border-blue-500/30 bg-gradient-to-r from-blue-900/30 to-purple-900/30 shadow-lg shadow-blue-500/20'
      case 'completed':
        return 'border-green-500/30 bg-gradient-to-r from-green-900/30 to-emerald-900/30 shadow-lg shadow-green-500/20'
      case 'failed':
        return 'border-red-500/30 bg-gradient-to-r from-red-900/30 to-pink-900/30 shadow-lg shadow-red-500/20'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-10 h-10 bg-slate-700/50 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
        )
      case 'running':
        return (
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center animate-pulse">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          </div>
        )
      case 'completed':
        return (
          <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          </div>
        )
      case 'failed':
        return (
          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
        )
    }
  }

  const getStatusBadge = () => {
    const badges = {
      pending: 'bg-slate-700/50 text-gray-300 border-slate-600/50',
      running: 'bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse',
      completed: 'bg-green-500/20 text-green-300 border-green-500/30',
      failed: 'bg-red-500/20 text-red-300 border-red-500/30',
    }

    return (
      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${badges[status]}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const renderData = () => {
    if (!data || status !== 'completed') return null

    return (
      <div className="mt-4 pt-4 border-t border-white/10">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left mb-3 hover:text-blue-400 transition-colors"
        >
          <h4 className="text-sm font-semibold text-gray-300">Analysis Results</h4>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-4 text-sm border border-white/10 space-y-3 animate-slide-down">
            {/* Triage Data */}
            {data.severity && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Severity:</span>
                  <span className={`font-bold px-2 py-1 rounded ${
                    data.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    data.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    data.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {data.severity.toUpperCase()}
                  </span>
                </div>
                {data.error_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Error Type:</span>
                    <span className="text-gray-300 font-mono text-xs">{data.error_type}</span>
                  </div>
                )}
                {data.service && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Service:</span>
                    <span className="text-gray-300">{data.service}</span>
                  </div>
                )}
                {data.confidence && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Confidence:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${data.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-300 font-semibold">{(data.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Forensics Data */}
            {data.commits_count !== undefined && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-white/10">
                    <div className="text-2xl font-bold text-blue-400">{data.commits_count}</div>
                    <div className="text-xs text-gray-400">Recent Commits</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-white/10">
                    <div className="text-2xl font-bold text-purple-400">{data.suspect_files?.length || 0}</div>
                    <div className="text-xs text-gray-400">Suspect Files</div>
                  </div>
                </div>
                {data.suspect_files && data.suspect_files.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Affected Files:</p>
                    <div className="space-y-1">
                      {data.suspect_files.slice(0, 3).map((file: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span className="font-mono text-gray-400">{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bob Analyst Data */}
            {data.root_cause && (
              <div className="space-y-2">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
                  <p className="text-gray-300 leading-relaxed">{data.root_cause}</p>
                </div>
                {data.confidence && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Analysis Confidence:</span>
                    <span className="text-blue-400 font-semibold">{(data.confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Fix Data */}
            {data.pr_title && (
              <div className="space-y-2">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
                  <p className="text-gray-300 font-medium mb-2">{data.pr_title}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Files:</span>
                      <span className="text-blue-400 font-semibold">{data.files_modified?.length || 0}</span>
                    </div>
                    {data.has_test !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Tests:</span>
                        <span className={data.has_test ? 'text-green-400' : 'text-red-400'}>
                          {data.has_test ? '✓ Included' : '✗ Missing'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Postmortem Data */}
            {data.length && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-white/10">
                  <div className="text-xl font-bold text-purple-400">{data.length}</div>
                  <div className="text-xs text-gray-400">Characters</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-white/10">
                  <div className="text-xl font-bold text-pink-400">{data.sections}</div>
                  <div className="text-xs text-gray-400">Sections</div>
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
      className={`relative border rounded-2xl p-6 transition-all duration-500 backdrop-blur-xl ${getStatusColor()} animate-slide-in hover:scale-[1.02]`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Glow effect for running state */}
      {status === 'running' && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl animate-pulse"></div>
      )}

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-4 flex-1">
            {getStatusIcon()}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">{name}</h3>
              <p className="text-sm text-gray-400">{message}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {renderData()}

        {/* Progress indicator for running state */}
        {status === 'running' && (
          <div className="mt-4">
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-progress" />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
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
          animation: slide-in 0.5s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}