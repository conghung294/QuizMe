'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Lock } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      router.push(redirectTo)
    }
  }, [user, isLoading, requireAuth, redirectTo, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 px-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Đang kiểm tra xác thực...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If authentication is required but user is not logged in, show access denied
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 px-8 text-center">
            <div className="p-4 bg-red-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Truy cập bị từ chối
            </h2>
            <p className="text-gray-600 mb-4">
              Bạn cần đăng nhập để truy cập trang này
            </p>
            <button
              onClick={() => router.push(redirectTo)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              Đăng nhập ngay
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If user is logged in but trying to access login page, redirect to home
  if (!requireAuth && user && redirectTo === '/login') {
    router.push('/')
    return null
  }

  return <>{children}</>
}
