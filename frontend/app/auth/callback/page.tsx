'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing authentication...')

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setMessage(error)
      setTimeout(() => router.push('/auth/login'), 3000)
      return
    }

    if (accessToken && refreshToken) {
      try {
        // Store tokens
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)

        // Fetch user info
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
          .then(res => res.json())
          .then(user => {
            localStorage.setItem('user', JSON.stringify(user))
            setStatus('success')
            setMessage('Authentication successful! Redirecting...')
            setTimeout(() => router.push('/'), 1500)
          })
          .catch(() => {
            setStatus('success')
            setMessage('Authentication successful! Redirecting...')
            setTimeout(() => router.push('/'), 1500)
          })
      } catch (err) {
        setStatus('error')
        setMessage('Failed to process authentication')
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    } else {
      setStatus('error')
      setMessage('Invalid authentication response')
      setTimeout(() => router.push('/auth/login'), 3000)
    }
  }, [searchParams, router])

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-xl"></div>
      <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-12 shadow-2xl text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Processing</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-12 shadow-2xl text-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Loading</h2>
            <p className="text-gray-400">Please wait...</p>
          </div>
        </div>
      }>
        <AuthCallbackContent />
      </Suspense>
    </div>
  )
}