'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  code: string
  language?: string
}

export default function CodeBlock({ code, language = 'bash' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="relative group overflow-hidden rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#0d1117] shadow-xl mb-6">
      {/* Mac Window Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5 bg-slate-100/50 dark:bg-white/5">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400 border border-black/10 dark:border-white/10"></div>
          <div className="w-3 h-3 rounded-full bg-amber-400 border border-black/10 dark:border-white/10"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-400 border border-black/10 dark:border-white/10"></div>
        </div>
        
        {language && (
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute left-1/2 -translate-x-1/2">
            {language}
          </div>
        )}

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto scrollbar-none">
        <pre className="font-mono text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 m-0 bg-transparent border-none p-0">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
