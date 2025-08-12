'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Play, Trash2, Search, Filter, Calendar, Plus, BarChart3, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { apiService, QuestionSet } from '@/lib/api'

export default function LibraryPage() {
    const [quizSets, setQuizSets] = useState<QuestionSet[]>([])
    const [filteredQuizSets, setFilteredQuizSets] = useState<QuestionSet[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [filterDifficulty, setFilterDifficulty] = useState('all')
    const [filterSubject, setFilterSubject] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(6)
    const [isLoading, setIsLoading] = useState(true)
    const [practiceLoading, setPracticeLoading] = useState<string | null>(null) // Track which quiz is being loaded for practice
    const router = useRouter()
    const loadQuizSets = async () => {
        try {
            setIsLoading(true)
            const response = await apiService.getQuestionSets()
            if (response.success) {
                setQuizSets(response.data)
                setFilteredQuizSets(response.data)
            } else {
                toast.error('Không thể tải danh sách bộ câu hỏi')
            }
        } catch (error) {
            console.error('Error loading quiz sets:', error)
            toast.error('Có lỗi xảy ra khi tải dữ liệu')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        // Load quiz sets from API
        loadQuizSets()
    }, [])

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
        setCurrentPage(1) // Reset to first page when filters change
    }, [searchTerm, filterDifficulty, filterSubject, quizSets])

    // Pagination logic
    const totalPages = Math.ceil(filteredQuizSets.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentQuizSets = filteredQuizSets.slice(startIndex, endIndex)

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    }



    const handleDeleteQuizSet = async (id: string) => {
        try {
            const response = await apiService.deleteQuestionSet(id)
            if (response.success) {
                // Remove from local state
                const updatedSets = quizSets.filter(set => set.id !== id)
                setQuizSets(updatedSets)
                setFilteredQuizSets(filteredQuizSets.filter(set => set.id !== id))
                toast.success("Đã xóa bộ câu hỏi")
            } else {
                toast.error("Không thể xóa bộ câu hỏi")
            }
        } catch (error) {
            console.error('Error deleting quiz set:', error)
            toast.error("Có lỗi xảy ra khi xóa bộ câu hỏi")
        }
    }

    const handlePractice = async (quizSet: QuestionSet) => {
        try {
            setPracticeLoading(quizSet.id)

            // Fetch detailed question set with questions
            const response = await apiService.getQuestionSet(quizSet.id)
            if (!response.success || !response.data) {
                toast.error('Không thể tải chi tiết bộ câu hỏi')
                return
            }

            const detailedQuizSet = response.data

            // Check if questions exist
            if (!detailedQuizSet.questions || detailedQuizSet.questions.length === 0) {
                toast.error('Bộ câu hỏi không có câu hỏi nào')
                return
            }

            // Convert to practice format and save
            const practiceQuestions = detailedQuizSet.questions.map((q, index) => ({
                id: index + 1,
                question: q.content,
                options: q.choices.map((choice) => choice.content),
                correctAnswer: q.correctAnswers.map((ca) =>
                    q.choices.find((choice) => choice.label === ca.choiceLabel)?.content
                ).filter((content): content is string => Boolean(content)),
                explanation: q.explanation,
                type: q.type.toLowerCase().replace('_', '-')
            }))

            localStorage.setItem('generatedQuestions', JSON.stringify(practiceQuestions))
            toast.success(`Bắt đầu luyện tập: ${quizSet.title}`)
            router.push('/practice')
        } catch (error) {
            console.error('Error loading question set details:', error)
            toast.error('Có lỗi xảy ra khi tải chi tiết bộ câu hỏi')
        } finally {
            setPracticeLoading(null)
        }
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

    const formatQuestionType = (type: string) => {
        switch (type) {
            case 'MULTIPLE_CHOICE': return 'Trắc nghiệm'
            case 'TRUE_FALSE': return 'Đúng/Sai'
            case 'MULTIPLE_RESPONSE': return 'Nhiều lựa chọn'
            case 'MATCHING': return 'Ghép đôi'
            case 'COMPLETION': return 'Điền khuyết'
            case 'FILL_IN_BLANK': return 'Điền từ' // Legacy support
            case 'ESSAY': return 'Tự luận' // Legacy support
            default: return type
        }
    }

    const uniqueSubjects = [...new Set(quizSets.map(set => set.subject))].filter(Boolean)

    return (
        <ProtectedRoute>
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
                            <Link href="/">
                                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Tạo mới
                                </Button>
                            </Link>
                        </div>
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
                                        <SelectTrigger className="w-50 border-purple-200">
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
                                        <SelectTrigger className="w-50 border-purple-200">
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
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    ) : currentQuizSets.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentQuizSets.map((quizSet) => (
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
                                                <Badge className={getDifficultyColor(quizSet.difficulty || 'medium')}>
                                                    {getDifficultyIcon(quizSet.difficulty || 'medium')} {quizSet.difficulty || 'Trung bình'}
                                                </Badge>
                                                <Badge variant="outline" className="border-purple-200 text-purple-700">
                                                    {quizSet.subject}
                                                </Badge>
                                                <Badge variant="outline" className="border-gray-200">
                                                    {formatQuestionType(quizSet.type)}
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            <div className="space-y-2 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>Tạo: {formatDate(quizSet.createdAt)}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handlePractice(quizSet)}
                                                    disabled={practiceLoading === quizSet.id}
                                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg disabled:opacity-50"
                                                >
                                                    {practiceLoading === quizSet.id ? (
                                                        <>
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                            Đang tải...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play className="w-4 h-4 mr-2" />
                                                            Luyện tập
                                                        </>
                                                    )}
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

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-8">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="border-purple-200 hover:bg-purple-50"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>

                                    <div className="flex gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => goToPage(page)}
                                                className={currentPage === page
                                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                                    : "border-purple-200 hover:bg-purple-50"
                                                }
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="border-purple-200 hover:bg-purple-50"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm text-center py-12">
                            <CardContent>
                                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
        </ProtectedRoute>
    )
}
