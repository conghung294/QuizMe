'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Play, Trash2, Search, Filter, Calendar, Clock, Plus, User, LogOut, BarChart3, Share2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'

interface QuizSet {
    id: string
    title: string
    subject: string
    questionCount: number
    difficulty: string
    type: string
    createdAt: string
    lastPracticed?: string
    questions: any[]
    stats?: {
        totalAttempts: number
        bestScore: number
        averageScore: number
    }
}

export default function LibraryPage() {
    const [user, setUser] = useState<any>(null)
    const [quizSets, setQuizSets] = useState<QuizSet[]>([])
    const [filteredQuizSets, setFilteredQuizSets] = useState<QuizSet[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [filterDifficulty, setFilterDifficulty] = useState('all')
    const [filterSubject, setFilterSubject] = useState('all')
    const router = useRouter()

    useEffect(() => {
        // Check authentication
        const isLoggedIn = localStorage.getItem('isLoggedIn')
        const userData = localStorage.getItem('user')

        if (!isLoggedIn || !userData) {
            router.push('/login')
            return
        }

        setUser(JSON.parse(userData))

        // Load quiz sets
        const savedQuizSets = localStorage.getItem('quizSets')
        if (savedQuizSets) {
            const sets = JSON.parse(savedQuizSets)
            setQuizSets(sets)
            setFilteredQuizSets(sets)
        }
    }, [router])

    useEffect(() => {
        let filtered = quizSets

        if (searchTerm) {
            filtered = filtered.filter(set =>
                set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                set.subject.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (filterDifficulty !== 'all') {
            filtered = filtered.filter(set => set.difficulty === filterDifficulty)
        }

        if (filterSubject !== 'all') {
            filtered = filtered.filter(set => set.subject === filterSubject)
        }

        setFilteredQuizSets(filtered)
    }, [searchTerm, filterDifficulty, filterSubject, quizSets])

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('user')
        toast.info("Đã đăng xuất thành công")
        router.push('/login')
    }

    const handleDeleteQuizSet = (id: string) => {
        const updatedSets = quizSets.filter(set => set.id !== id)
        setQuizSets(updatedSets)
        localStorage.setItem('quizSets', JSON.stringify(updatedSets))
        toast.success("Đã xóa bộ câu hỏi")
    }

    const handlePractice = (quizSet: QuizSet) => {
        // Update last practiced time
        const updatedSets = quizSets.map(set =>
            set.id === quizSet.id
                ? { ...set, lastPracticed: new Date().toISOString() }
                : set
        )
        setQuizSets(updatedSets)
        localStorage.setItem('quizSets', JSON.stringify(updatedSets))

        // Set current questions for practice
        localStorage.setItem('generatedQuestions', JSON.stringify(quizSet.questions))

        toast.success(`Bắt đầu luyện tập: ${quizSet.title}`)
        router.push('/practice')
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-800 border-green-200'
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'hard': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getDifficultyIcon = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return '🟢'
            case 'medium': return '🟡'
            case 'hard': return '🔴'
            default: return '⚪'
        }
    }

    const uniqueSubjects = [...new Set(quizSets.map(set => set.subject))].filter(Boolean)

    if (!user) {
        return <div>Loading...</div>
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-2">
                            Thư Viện Câu Hỏi
                        </h1>
                        <p className="text-gray-600">Quản lý và luyện tập các bộ câu hỏi của bạn</p>
                    </div>

                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-200 shadow-lg">
                            <User className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700">{user.fullName}</span>
                        </div>

                        <Link href="/">
                            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg">
                                <Plus className="w-4 h-4 mr-2" />
                                Tạo mới
                            </Button>
                        </Link>

                        <Button variant="outline" onClick={handleLogout} className="border-red-200 text-red-600 hover:bg-red-50">
                            <LogOut className="w-4 h-4 mr-2" />
                            Đăng xuất
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">{quizSets.length}</div>
                            <div className="text-sm text-gray-600">Tổng bộ câu hỏi</div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {quizSets.reduce((sum, set) => sum + set.questionCount, 0)}
                            </div>
                            <div className="text-sm text-gray-600">Tổng câu hỏi</div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-orange-600">{uniqueSubjects.length}</div>
                            <div className="text-sm text-gray-600">Chủ đề</div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {quizSets.filter(set => set.lastPracticed).length}
                            </div>
                            <div className="text-sm text-gray-600">Đã luyện tập</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Tìm kiếm theo tên hoặc chủ đề..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border-purple-200 focus:border-purple-400"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                                    <SelectTrigger className="w-40 border-purple-200">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Độ khó" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả độ khó</SelectItem>
                                        <SelectItem value="easy">🟢 Dễ</SelectItem>
                                        <SelectItem value="medium">🟡 Trung bình</SelectItem>
                                        <SelectItem value="hard">🔴 Khó</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={filterSubject} onValueChange={setFilterSubject}>
                                    <SelectTrigger className="w-40 border-purple-200">
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Chủ đề" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tất cả chủ đề</SelectItem>
                                        {uniqueSubjects.map(subject => (
                                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quiz Sets Grid */}
                {filteredQuizSets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredQuizSets.map((quizSet) => (
                            <Card key={quizSet.id} className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-bold text-gray-800 line-clamp-2">
                                            {quizSet.title}
                                        </CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteQuizSet(quizSet.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Badge className={getDifficultyColor(quizSet.difficulty)}>
                                            {getDifficultyIcon(quizSet.difficulty)} {quizSet.difficulty}
                                        </Badge>
                                        <Badge variant="outline" className="border-purple-200 text-purple-700">
                                            {quizSet.subject}
                                        </Badge>
                                        <Badge variant="outline" className="border-gray-200">
                                            {quizSet.questionCount} câu
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>Tạo: {formatDate(quizSet.createdAt)}</span>
                                        </div>

                                        {quizSet.lastPracticed && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                <span>Luyện tập: {formatDate(quizSet.lastPracticed)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {quizSet.stats && (
                                        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div className="text-center">
                                                    <div className="font-bold text-blue-600">{quizSet.stats.totalAttempts}</div>
                                                    <div className="text-blue-700">Lần làm</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-green-600">{quizSet.stats.bestScore}%</div>
                                                    <div className="text-green-700">Điểm cao nhất</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="font-bold text-orange-600">{quizSet.stats.averageScore}%</div>
                                                    <div className="text-orange-700">Điểm TB</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handlePractice(quizSet)}
                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                                        >
                                            <Play className="w-4 h-4 mr-2" />
                                            Luyện tập
                                        </Button>

                                        <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50">
                                            <BarChart3 className="w-4 h-4" />
                                        </Button>

                                        <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50">
                                            <Share2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardContent className="text-center py-16">
                            <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-fit mx-auto mb-6">
                                <BookOpen className="w-12 h-12 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                {searchTerm || filterDifficulty !== 'all' || filterSubject !== 'all'
                                    ? 'Không tìm thấy bộ câu hỏi nào'
                                    : 'Chưa có bộ câu hỏi nào'
                                }
                            </h3>
                            <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                {searchTerm || filterDifficulty !== 'all' || filterSubject !== 'all'
                                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                                    : 'Tạo bộ câu hỏi đầu tiên để bắt đầu hành trình học tập'
                                }
                            </p>
                            <Link href="/">
                                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Tạo bộ câu hỏi mới
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
