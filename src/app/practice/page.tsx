'use client'

import { useState, useEffect, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Home, RotateCcw, Trophy, Target, Clock, Play, Pause, Brain, ThumbsUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import QuestionRenderer from '@/components/QuestionRenderer'

interface Question {
    id: number
    question: string
    options: string[]
    correctAnswer: string | string[]
    explanation?: string
    type: string
}

export default function PracticePage() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
    const [showAnswer, setShowAnswer] = useState(false)
    const [userAnswers, setUserAnswers] = useState<{ [key: number]: string[] }>({})
    const [score, setScore] = useState(0)
    const [startTime, setStartTime] = useState<number>(Date.now())
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [isCompleted, setIsCompleted] = useState(false)
    const [memoryRatings, setMemoryRatings] = useState<{ [key: number]: 'good' | 'okay' | 'review' }>({})
    const [showMemoryRating, setShowMemoryRating] = useState(false)
    const [showResults, setShowResults] = useState(false)

    useEffect(() => {
        const savedQuestions = localStorage.getItem('generatedQuestions')
        if (savedQuestions) {
            setQuestions(JSON.parse(savedQuestions))
            setStartTime(Date.now())
        }
    }, [])

    // Timer effect
    useEffect(() => {
        if (!isPaused && !isCompleted) {
            const interval = setInterval(() => {
                setTimeElapsed(Math.floor((Date.now() - startTime) / 1000))
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [startTime, isPaused, isCompleted])

    const currentQuestion = questions[currentQuestionIndex]
    const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0

    const handleAnswerSelect = (answer: string) => {
        const questionType = currentQuestion.type.toLowerCase().replace('_', '-')

        if (questionType === 'multiple-response' || questionType === 'matching') {
            // Multiple selection for multiple-response and matching questions
            setSelectedAnswers(prev =>
                prev.includes(answer)
                    ? prev.filter(a => a !== answer)
                    : [...prev, answer]
            )
        } else {
            // Single selection for other question types (multiple-choice, true-false, completion)
            setSelectedAnswers([answer])
        }
    }

    const checkAnswer = () => {
        if (selectedAnswers.length === 0) {
            toast.warning("Vui lòng chọn ít nhất một đáp án trước khi kiểm tra")
            return
        }

        setShowAnswer(true)
        const newUserAnswers = { ...userAnswers, [currentQuestionIndex]: selectedAnswers }
        setUserAnswers(newUserAnswers)

        // Check if answer is correct based on question type
        const correctAnswers = Array.isArray(currentQuestion.correctAnswer)
            ? currentQuestion.correctAnswer
            : [currentQuestion.correctAnswer]

        const questionType = currentQuestion.type.toLowerCase().replace('_', '-')
        let isCorrect = false

        switch (questionType) {
            case 'multiple-choice':
            case 'true-false':
            case 'completion':
                // Single correct answer
                isCorrect = selectedAnswers.length === 1 && correctAnswers.includes(selectedAnswers[0])
                break

            case 'multiple-response':
                // Multiple correct answers - must select all and only correct answers
                isCorrect = selectedAnswers.length === correctAnswers.length &&
                    selectedAnswers.every(answer => correctAnswers.includes(answer))
                break

            case 'matching':
                // For matching, all pairs should be selected (all options are correct)
                isCorrect = selectedAnswers.length === currentQuestion.options.length
                break

            default:
                // Fallback to original logic
                isCorrect = selectedAnswers.length === correctAnswers.length &&
                    selectedAnswers.every(answer => correctAnswers.includes(answer))
        }

        if (isCorrect) {
            setScore(prev => prev + 1)
            toast.success("Chính xác! Bạn đã chọn đúng đáp án")
        } else {
            const correctAnswerText = questionType === 'matching'
                ? 'Tất cả các cặp ghép đôi'
                : Array.isArray(currentQuestion.correctAnswer)
                    ? currentQuestion.correctAnswer.join(', ')
                    : currentQuestion.correctAnswer
            toast.error(`Chưa chính xác. Đáp án đúng là: ${correctAnswerText}`)
        }

        // Show memory rating after showing answer
        setShowMemoryRating(true)
    }

    const handleMemoryRating = (rating: 'good' | 'okay' | 'review') => {
        setMemoryRatings(prev => ({
            ...prev,
            [currentQuestionIndex]: rating
        }))
        setShowMemoryRating(false)

        // Auto move to next question or show results
        if (currentQuestionIndex < questions.length - 1) {
            nextQuestion()
        } else {
            setShowResults(true)
        }
    }

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
            setSelectedAnswers([])
            setShowAnswer(false)
            setShowMemoryRating(false)
        } else {
            // Mark as completed when reaching the last question
            setIsCompleted(true)
        }
    }

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1)
            setSelectedAnswers(userAnswers[currentQuestionIndex - 1] || [])
            setShowAnswer(!!userAnswers[currentQuestionIndex - 1])
        }
    }

    const resetPractice = () => {
        setCurrentQuestionIndex(0)
        setSelectedAnswers([])
        setShowAnswer(false)
        setUserAnswers({})
        setScore(0)
        setStartTime(Date.now())
        setTimeElapsed(0)
        setIsCompleted(false)
        setIsPaused(false)
        toast.info("Đã reset. Bắt đầu lại từ đầu")
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
                </div>

                <Card className="max-w-md w-full border-0 shadow-2xl bg-white/90 backdrop-blur-sm relative z-10">
                    <CardContent className="text-center py-12">
                        <div className="p-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-full w-fit mx-auto mb-6">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-3">Chưa có câu hỏi</h2>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Vui lòng tạo câu hỏi trước khi bắt đầu luyện tập
                        </p>
                        <Link href="/">
                            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300">
                                <Home className="w-5 h-5 mr-2" />
                                Về Trang Chủ
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const completedQuestions = Object.keys(userAnswers).length
    const accuracy = completedQuestions > 0 ? ((score / completedQuestions) * 100).toFixed(1) : '0'

    // Calculate memory rating statistics
    const memoryStats = {
        good: Object.values(memoryRatings).filter(rating => rating === 'good').length,
        okay: Object.values(memoryRatings).filter(rating => rating === 'okay').length,
        review: Object.values(memoryRatings).filter(rating => rating === 'review').length
    }

    const reviewQuestions = questions.filter((_, index) => memoryRatings[index] === 'review')

    // Show results page
    if (showResults) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
                    <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4">
                                Kết Quả Luyện Tập
                            </h1>
                        </div>

                        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-8">
                                {/* Overall Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                        <Trophy className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                        <div className="text-3xl font-bold text-green-700">{score}/{questions.length}</div>
                                        <div className="text-sm text-green-600">Câu đúng</div>
                                    </div>
                                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                                        <Target className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                                        <div className="text-3xl font-bold text-blue-700">{accuracy}%</div>
                                        <div className="text-sm text-blue-600">Độ chính xác</div>
                                    </div>
                                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                        <Clock className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                                        <div className="text-3xl font-bold text-purple-700">{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</div>
                                        <div className="text-sm text-purple-600">Thời gian</div>
                                    </div>
                                </div>

                                {/* Memory Rating Chart */}
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Brain className="w-6 h-6 text-purple-600" />
                                        Đánh Giá Mức Độ Nhớ
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                            <ThumbsUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                            <div className="text-2xl font-bold text-green-700">{memoryStats.good}</div>
                                            <div className="text-sm text-green-600">Nhớ tốt</div>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                                            <CheckCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                                            <div className="text-2xl font-bold text-yellow-700">{memoryStats.okay}</div>
                                            <div className="text-sm text-yellow-600">Tạm ổn</div>
                                        </div>
                                        <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg border border-red-200">
                                            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                                            <div className="text-2xl font-bold text-red-700">{memoryStats.review}</div>
                                            <div className="text-sm text-red-600">Cần xem lại</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Review Questions */}
                                {reviewQuestions.length > 0 && (
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <AlertCircle className="w-6 h-6 text-red-600" />
                                            Câu Hỏi Cần Xem Lại ({reviewQuestions.length})
                                        </h3>
                                        <div className="space-y-4">
                                            {reviewQuestions.map((question, index) => (
                                                <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                                    <div className="font-medium text-gray-800 mb-2">
                                                        Câu {questions.indexOf(question) + 1}: {question.question}
                                                    </div>
                                                    <div className="text-sm text-green-700">
                                                        <strong>Đáp án đúng:</strong> {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
                                                    </div>
                                                    {question.explanation && (
                                                        <div className="text-sm text-gray-600 mt-2">
                                                            <strong>Giải thích:</strong> {question.explanation}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-wrap justify-center gap-4">
                                    <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                                        <RotateCcw className="w-4 h-4 mr-2" />
                                        Luyện Tập Lại
                                    </Button>
                                    <Link href="/">
                                        <Button variant="outline" className="border-purple-200 hover:bg-purple-50">
                                            <Home className="w-4 h-4 mr-2" />
                                            Trang Chủ
                                        </Button>
                                    </Link>
                                    <Link href="/library">
                                        <Button variant="outline" className="border-purple-200 hover:bg-purple-50">
                                            Thư Viện
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-200 mb-6 shadow-lg">
                            <Target className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700">Practice Mode</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4 h-[60px]">
                            Luyện Tập Trắc Nghiệm
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">Kiểm tra và nâng cao kiến thức của bạn</p>

                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/">
                                <Button variant="outline" className="border-purple-200 hover:bg-purple-50 shadow-lg">
                                    <Home className="w-4 h-4 mr-2" />
                                    Trang chủ
                                </Button>
                            </Link>
                            <Button variant="outline" onClick={resetPractice} className="border-purple-200 hover:bg-purple-50 shadow-lg">
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Làm lại
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsPaused(!isPaused)}
                                className="border-purple-200 hover:bg-purple-50 shadow-lg"
                                disabled={isCompleted}
                            >
                                {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                                {isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                            </Button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-purple-600">{currentQuestionIndex + 1}/{questions.length}</div>
                                <div className="text-sm text-gray-600">Câu hỏi</div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-green-600">{score}</div>
                                <div className="text-sm text-gray-600">Đúng</div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-orange-600">{accuracy}%</div>
                                <div className="text-sm text-gray-600">Độ chính xác</div>
                            </CardContent>
                        </Card>
                        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-4 text-center">
                                <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-2">
                                    <Clock className="w-6 h-6" />
                                    {formatTime(timeElapsed)}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {isPaused ? 'Đã tạm dừng' : 'Thời gian'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Progress Bar */}
                    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-semibold text-gray-700">Tiến độ hoàn thành</span>
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                    {progress.toFixed(0)}%
                                </Badge>
                            </div>
                            <Progress value={progress} className="h-3 mb-2" />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Bắt đầu</span>
                                <span>Hoàn thành</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Question Card */}
                    <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm mb-8 hover:shadow-3xl transition-all duration-300">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">
                                    Câu hỏi {currentQuestionIndex + 1}
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="border-purple-200 text-purple-700">
                                        {currentQuestion.type}
                                    </Badge>
                                    {showAnswer && (
                                        <Badge className={(() => {
                                            const correctAnswers = Array.isArray(currentQuestion.correctAnswer)
                                                ? currentQuestion.correctAnswer
                                                : [currentQuestion.correctAnswer]
                                            const isCorrect = selectedAnswers.length === correctAnswers.length &&
                                                selectedAnswers.every(answer => correctAnswers.includes(answer))
                                            return isCorrect ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                                        })()}>
                                            {(() => {
                                                const correctAnswers = Array.isArray(currentQuestion.correctAnswer)
                                                    ? currentQuestion.correctAnswer
                                                    : [currentQuestion.correctAnswer]
                                                const isCorrect = selectedAnswers.length === correctAnswers.length &&
                                                    selectedAnswers.every(answer => correctAnswers.includes(answer))
                                                return isCorrect ? '✅ Đúng' : '❌ Sai'
                                            })()}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <QuestionRenderer
                                question={currentQuestion}
                                selectedAnswers={selectedAnswers}
                                onAnswerSelect={handleAnswerSelect}
                                showAnswer={showAnswer}
                                isCorrect={(() => {
                                    const correctAnswers = Array.isArray(currentQuestion.correctAnswer)
                                        ? currentQuestion.correctAnswer
                                        : [currentQuestion.correctAnswer]

                                    const questionType = currentQuestion.type.toLowerCase().replace('_', '-')

                                    if (questionType === 'multiple-response' || questionType === 'matching') {
                                        // For multiple selection, check if all selected answers are correct and all correct answers are selected
                                        return selectedAnswers.length === correctAnswers.length &&
                                            selectedAnswers.every(answer => correctAnswers.includes(answer))
                                    } else {
                                        // For single selection, check if the selected answer is correct
                                        return selectedAnswers.length === 1 && correctAnswers.includes(selectedAnswers[0])
                                    }
                                })()}
                            />

                            {showAnswer && currentQuestion.explanation && (
                                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 animate-in slide-in-from-top duration-300">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <span className="text-blue-600 text-lg">💡</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-blue-900 mb-2">Giải thích chi tiết:</h4>
                                            <p className="text-blue-800 leading-relaxed">{currentQuestion.explanation}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Memory Rating Section */}
                            {showAnswer && showMemoryRating && (
                                <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 animate-in slide-in-from-top duration-300">
                                    <div className="text-center">
                                        <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                                            <Brain className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <h4 className="font-semibold text-purple-900 mb-3">Đánh giá mức độ bạn nhớ câu này:</h4>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <Button
                                                onClick={() => handleMemoryRating('good')}
                                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                            >
                                                <ThumbsUp className="w-4 h-4 mr-2" />
                                                Nhớ tốt
                                            </Button>
                                            <Button
                                                onClick={() => handleMemoryRating('okay')}
                                                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Tạm ổn
                                            </Button>
                                            <Button
                                                onClick={() => handleMemoryRating('review')}
                                                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                                            >
                                                <AlertCircle className="w-4 h-4 mr-2" />
                                                Cần xem lại
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={prevQuestion}
                                    disabled={currentQuestionIndex === 0}
                                    className="border-purple-200 hover:bg-purple-50"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Câu trước
                                </Button>

                                {!showAnswer ? (
                                    <Button
                                        onClick={checkAnswer}
                                        disabled={selectedAnswers.length === 0}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Kiểm tra đáp án
                                    </Button>
                                ) : (
                                    <div className="text-center">
                                        <Badge variant="secondary" className="px-6 py-3 text-base">
                                            {(() => {
                                                const correctAnswers = Array.isArray(currentQuestion.correctAnswer)
                                                    ? currentQuestion.correctAnswer
                                                    : [currentQuestion.correctAnswer]
                                                const isCorrect = selectedAnswers.length === correctAnswers.length &&
                                                    selectedAnswers.every(answer => correctAnswers.includes(answer))
                                                return isCorrect ? '🎉 Chính xác!' : '💪 Cố gắng lần sau!'
                                            })()}
                                        </Badge>
                                    </div>
                                )}

                                {!showMemoryRating && (
                                    currentQuestionIndex === questions.length - 1 ? (
                                        <Button
                                            onClick={() => setShowResults(true)}
                                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                            disabled={!showAnswer}
                                        >
                                            <Trophy className="w-4 h-4 mr-2" />
                                            Hoàn thành
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={nextQuestion}
                                            disabled={!showAnswer}
                                            className="border-purple-200 hover:bg-purple-50"
                                        >
                                            Câu sau
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    )
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Completion Summary */}
                    {isCompleted && (
                        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-purple-50 animate-in slide-in-from-bottom duration-500">
                            <CardHeader className="text-center pb-4">
                                <div className="p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full w-fit mx-auto mb-4">
                                    <Trophy className="w-12 h-12 text-yellow-600" />
                                </div>
                                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    🎉 Hoàn thành xuất sắc!
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-center space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                        <div className="text-3xl font-bold text-green-600 mb-2">{score}/{questions.length}</div>
                                        <div className="text-sm text-green-700 font-medium">Câu trả lời đúng</div>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                        <div className="text-3xl font-bold text-blue-600 mb-2">{accuracy}%</div>
                                        <div className="text-sm text-blue-700 font-medium">Độ chính xác</div>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                        <div className="text-3xl font-bold text-purple-600 mb-2">{formatTime(timeElapsed)}</div>
                                        <div className="text-sm text-purple-700 font-medium">Thời gian hoàn thành</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap justify-center gap-4 pt-4">
                                    <Button onClick={resetPractice} size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300">
                                        <RotateCcw className="w-5 h-5 mr-2" />
                                        Làm lại
                                    </Button>
                                    <Link href="/">
                                        <Button variant="outline" size="lg" className="border-purple-200 hover:bg-purple-50 shadow-lg">
                                            <Home className="w-5 h-5 mr-2" />
                                            Trang chủ
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    )
}
