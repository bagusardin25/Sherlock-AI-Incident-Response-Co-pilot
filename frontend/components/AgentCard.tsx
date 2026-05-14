import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react'

interface AgentCardProps {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  message: string
  data?: any
  index: number
}

export default function AgentCard({ name, status, message, data, index }: AgentCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'border-gray-700 bg-gray-800/30'
      case 'running':
        return 'border-blue-600 bg-blue-900/20'
      case 'completed':
        return 'border-green-600 bg-green-900/20'
      case 'failed':
        return 'border-red-600 bg-red-900/20'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-500" />
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getStatusBadge = () => {
    const badges = {
      pending: 'bg-gray-700 text-gray-300',
      running: 'bg-blue-600 text-white',
      completed: 'bg-green-600 text-white',
      failed: 'bg-red-600 text-white',
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badges[status]}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const renderData = () => {
    if (!data || status !== 'completed') return null

    return (
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">Results:</h4>
        <div className="bg-gray-900/50 rounded p-3 text-sm">
          {/* Triage Data */}
          {data.severity && (
            <div className="space-y-1">
              <p className="text-gray-400">
                <span className="font-medium">Severity:</span>{' '}
                <span className={`font-bold ${
                  data.severity === 'critical' ? 'text-red-400' :
                  data.severity === 'high' ? 'text-orange-400' :
                  data.severity === 'medium' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {data.severity.toUpperCase()}
                </span>
              </p>
              <p className="text-gray-400">
                <span className="font-medium">Error Type:</span> {data.error_type}
              </p>
              <p className="text-gray-400">
                <span className="font-medium">Service:</span> {data.service}
              </p>
              {data.confidence && (
                <p className="text-gray-400">
                  <span className="font-medium">Confidence:</span> {(data.confidence * 100).toFixed(0)}%
                </p>
              )}
            </div>
          )}

          {/* Forensics Data */}
          {data.commits_count !== undefined && (
            <div className="space-y-1">
              <p className="text-gray-400">
                <span className="font-medium">Recent Commits:</span> {data.commits_count}
              </p>
              <p className="text-gray-400">
                <span className="font-medium">Suspect Files:</span> {data.suspect_files?.length || 0}
              </p>
              {data.suspect_files && data.suspect_files.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Files:</p>
                  <ul className="list-disc list-inside text-xs text-gray-400 space-y-0.5">
                    {data.suspect_files.slice(0, 3).map((file: string, i: number) => (
                      <li key={i} className="font-mono">{file}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Bob Analyst Data */}
          {data.root_cause && (
            <div className="space-y-2">
              <p className="text-gray-300 leading-relaxed">{data.root_cause}</p>
              {data.confidence && (
                <p className="text-gray-400 text-xs">
                  <span className="font-medium">Confidence:</span> {(data.confidence * 100).toFixed(0)}%
                </p>
              )}
            </div>
          )}

          {/* Fix Data */}
          {data.pr_title && (
            <div className="space-y-1">
              <p className="text-gray-300 font-medium">{data.pr_title}</p>
              <p className="text-gray-400 text-xs">
                <span className="font-medium">Files Modified:</span> {data.files_modified?.length || 0}
              </p>
              {data.has_test !== undefined && (
                <p className="text-gray-400 text-xs">
                  <span className="font-medium">Test Included:</span> {data.has_test ? '✅ Yes' : '❌ No'}
                </p>
              )}
            </div>
          )}

          {/* Postmortem Data */}
          {data.length && (
            <div className="space-y-1">
              <p className="text-gray-400">
                <span className="font-medium">Document Length:</span> {data.length} characters
              </p>
              <p className="text-gray-400">
                <span className="font-medium">Sections:</span> {data.sections}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`border rounded-lg p-6 transition-all duration-300 animate-slide-in ${getStatusColor()}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-white">{name}</h3>
            <p className="text-sm text-gray-400 mt-1">{message}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {renderData()}

      {/* Progress indicator for running state */}
      {status === 'running' && (
        <div className="mt-4">
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </div>
  )
}
