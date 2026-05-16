'use client'

import { CheckCircle2, Clock, XCircle, Loader2, ChevronDown, Terminal } from 'lucide-react'
import { useState, MouseEvent, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AgentCardProps {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  message: string
  data?: any
  index: number
}

export default function AgentCard({ name, status, message, data, index }: AgentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'border-slate-200 dark:border-white/5 bg-slate-100/40 dark:bg-slate-900/40 text-slate-500'
      case 'running':
        return 'border-primary/40 bg-white/60 dark:bg-slate-900/60 shadow-[0_0_30px_rgba(124,58,237,0.1)] text-primary'
      case 'completed':
        return 'border-success/30 bg-white/60 dark:bg-slate-900/60 shadow-[0_0_30px_rgba(34,197,94,0.05)] text-success'
      case 'failed':
        return 'border-red-500/30 bg-white/60 dark:bg-slate-900/60 shadow-[0_0_30px_rgba(239,68,68,0.05)] text-red-400'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center border border-black/10 dark:border-white/10">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
        )
      case 'running':
        return (
          <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 relative overflow-hidden">
            <Loader2 className="w-5 h-5 text-primary animate-spin relative z-10" />
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-xl animate-pulse"></div>
          </div>
        )
      case 'completed':
        return (
          <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center border border-success/20">
            <CheckCircle2 className="w-5 h-5 text-success" />
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
      pending: 'bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 border-slate-300 dark:border-white/5',
      running: 'bg-primary/10 text-primary border-primary/20',
      completed: 'bg-success/10 text-success border-success/20',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    }

    return (
      <div className="flex items-center gap-2">
        {status === 'running' && (
          <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
        )}
        <span className={`px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-widest font-black border ${badges[status]}`}>
          {status}
        </span>
      </div>
    )
  }

  const renderData = () => {
    if (!data || status !== 'completed') return null

    return (
      <div className="mt-5 pt-5 border-t border-slate-200 dark:border-white/5 space-y-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all">
              <Terminal className="w-3.5 h-3.5 text-slate-500 group-hover:text-primary" />
            </div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors uppercase tracking-widest">Metadata</h4>
          </div>
          <motion.div 
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className={`p-1 rounded-lg bg-slate-200/50 dark:bg-slate-800/50 group-hover:bg-slate-300 dark:group-hover:bg-slate-800 transition-all`}
          >
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="bg-slate-100/80 dark:bg-black/40 rounded-2xl p-4 text-[13px] border border-slate-200 dark:border-white/5 space-y-4 font-mono mt-2">
                {/* Triage Data */}
                {data.severity && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-600 text-[11px] uppercase tracking-widest font-bold">Priority</span>
                      <span className={`font-black px-2 py-0.5 rounded text-[10px] tracking-widest ${
                        data.severity === 'critical' ? 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20' :
                        data.severity === 'high' ? 'bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-500/20' :
                        data.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20' :
                        'bg-success/10 text-success border border-success/20'
                      }`}>
                        {data.severity.toUpperCase()}
                      </span>
                    </div>
                    {data.error_type && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-600 text-[11px] uppercase tracking-widest font-bold">Category</span>
                        <span className="text-slate-700 dark:text-slate-300 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded border border-black/10 dark:border-white/10">{data.error_type}</span>
                      </div>
                    )}
                    {data.confidence && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-600 text-[11px] uppercase tracking-widest font-bold">Accuracy</span>
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1 bg-slate-300 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${data.confidence * 100}%` }}
                              transition={{ duration: 1, delay: 0.2 }}
                              className="h-full bg-primary"
                            />
                          </div>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{(data.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Forensics Data */}
                {data.commits_count !== undefined && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 border border-black/5 dark:border-white/5">
                        <div className="text-xl font-black text-primary mb-0.5 tabular-nums">{data.commits_count}</div>
                        <div className="text-[9px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-600">Commits</div>
                      </div>
                      <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 border border-black/5 dark:border-white/5">
                        <div className="text-xl font-black text-secondary mb-0.5 tabular-nums">{data.suspect_files?.length || 0}</div>
                        <div className="text-[9px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-600">Impacted</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bob Analyst Data */}
                {data.root_cause && (
                  <div className="space-y-3">
                    <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 border border-black/5 dark:border-white/5 leading-relaxed text-slate-600 dark:text-slate-400">
                      {data.root_cause}
                    </div>
                  </div>
                )}

                {/* Fix Data */}
                {data.pr_title && (
                  <div className="space-y-3">
                    <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4 border border-black/5 dark:border-white/5">
                      <p className="text-slate-900 dark:text-white font-bold mb-3 pb-3 border-b border-black/5 dark:border-white/5 leading-tight">{data.pr_title}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-600">Files:</span>
                          <span className="text-primary font-black">{data.files_modified?.length || 0}</span>
                        </div>
                        {data.has_test !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-600">Tests:</span>
                            <span className={`font-black ${data.has_test ? 'text-success' : 'text-red-500 dark:text-red-400'}`}>
                              {data.has_test ? 'YES' : 'NO'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      whileHover={{ scale: 1.01 }}
      className={`relative glass-card rounded-2xl p-6 overflow-hidden ${getStatusColor()}`}
    >
      {/* Spotlight Hover Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300"
        animate={{
          opacity: isHovering ? 1 : 0,
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(124, 58, 237, 0.08), transparent 40%)`
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-4 flex-1">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">{name}</h3>
                {name.includes('Bob') && (
                  <span className="px-1.5 py-0.5 rounded-[4px] bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[8px] font-black uppercase tracking-widest">
                    IBM Bob
                  </span>
                )}
              </div>
              <p className="text-[13px] text-slate-500 font-medium mt-1">{message}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {renderData()}

        {/* Improved Progress indicator */}
        {status === 'running' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 dark:bg-white/5 rounded-b-2xl overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-progress shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-progress {
          animation: progress 3s linear infinite;
        }
      `}</style>
    </motion.div>
  )
}