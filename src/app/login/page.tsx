'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, User, Lock, Sparkles, BookOpen } from 'lucide-react'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [isLogin, setIsLogin] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: ''
    })
    const [errors, setErrors] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: ''
    })

    const router = useRouter()
    const { login, register } = useAuth()

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const validateForm = () => {
        const newErrors = {
            email: '',
            password: '',
            confirmPassword: '',
            fullName: ''
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email là bắt buộc'
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Email không hợp lệ'
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Mật khẩu là bắt buộc'
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
        }

        // Register-specific validation
        if (!isLogin) {
            if (!formData.fullName) {
                newErrors.fullName = 'Họ và tên là bắt buộc'
            }

            if (!formData.confirmPassword) {
                newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc'
            } else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
            }
        }

        setErrors(newErrors)
        return Object.values(newErrors).every(error => error === '')
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })

        // Clear error when user starts typing
        if (errors[name as keyof typeof errors]) {
            setErrors({
                ...errors,
                [name]: ''
            })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            if (isLogin) {
                const success = await login(formData.email, formData.password)
                if (success) {
                    router.push('/')
                }
            } else {
                const success = await register(formData.email, formData.password, formData.fullName)
                if (success) {
                    router.push('/')
                }
            }
        } catch (error) {
            console.error('Auth error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <ProtectedRoute requireAuth={false} redirectTo="/">
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
                </div>

                <div className="relative z-10 w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-200 mb-6 shadow-lg">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700">Quiz Generator</span>
                        </div>

                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-2">
                            {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
                        </h1>
                        <p className="text-gray-600">
                            {isLogin ? 'Chào mừng bạn quay trở lại!' : 'Tạo tài khoản để bắt đầu'}
                        </p>
                    </div>

                    {/* Login/Register Card */}
                    <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                {isLogin ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {!isLogin && (
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">
                                            Họ và tên
                                        </Label>
                                        <Input
                                            id="fullName"
                                            name="fullName"
                                            type="text"
                                            placeholder="Nhập họ và tên của bạn"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className={`border-purple-200 focus:border-purple-400 focus:ring-purple-400 ${errors.fullName ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''
                                                }`}
                                            required={!isLogin}
                                        />
                                        {errors.fullName && (
                                            <p className="text-sm text-red-600">{errors.fullName}</p>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="example@email.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`border-purple-200 focus:border-purple-400 focus:ring-purple-400 ${errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''
                                            }`}
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                        Mật khẩu
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Nhập mật khẩu"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className={`border-purple-200 focus:border-purple-400 focus:ring-purple-400 pr-10 ${errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''
                                                }`}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                {!isLogin && (
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                                            Xác nhận mật khẩu
                                        </Label>
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="Nhập lại mật khẩu"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className={`border-purple-200 focus:border-purple-400 focus:ring-purple-400 ${errors.confirmPassword ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''
                                                }`}
                                            required={!isLogin}
                                        />
                                        {errors.confirmPassword && (
                                            <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                                        )}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                    size="lg"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            {isLogin ? 'Đang đăng nhập...' : 'Đang tạo tài khoản...'}
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-5 h-5 mr-2" />
                                            {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-gray-600">
                                    {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                                    <button
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="ml-2 text-purple-600 hover:text-purple-700 font-semibold hover:underline"
                                    >
                                        {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                                    </button>
                                </p>
                            </div>

                            {/* Demo Account */}
                            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-blue-900 mb-1">Tài khoản demo</h4>
                                        <p className="text-sm text-blue-800 mb-2">
                                            Email: demo@quizgen.com<br />
                                            Mật khẩu: demo123
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    email: 'demo@quizgen.com',
                                                    password: 'demo123'
                                                })
                                            }}
                                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                        >
                                            Sử dụng tài khoản demo
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    )
}
