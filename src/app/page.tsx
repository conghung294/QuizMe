'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Target, Copy, Download, Star, BookOpen, Play, Sparkles, Settings, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { apiService, Question as ApiQuestion } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { QualityMetrics } from '@/lib/api'

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: string | string[]
  explanation?: string
  type: string
}

export default function QuizGenerator() {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [questionCount, setQuestionCount] = useState([10])
  const [subject, setSubject] = useState('')
  const [tone, setTone] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple-choice'])
  const [questions, setQuestions] = useState<Question[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    if (!uploadedFile.type.includes('text') && !uploadedFile.type.includes('pdf')) {
      toast.error("Chỉ hỗ trợ file PDF và TXT")
      return
    }

    // Check file size (10MB limit)
    if (uploadedFile.size > 10 * 1024 * 1024) {
      toast.error("File quá lớn. Kích thước tối đa là 10MB")
      return
    }

    setFile(uploadedFile)
    const fileSizeKB = (uploadedFile.size / 1024).toFixed(1)
    const fileSizeMB = (uploadedFile.size / (1024 * 1024)).toFixed(1)

    if (uploadedFile.size > 1024 * 1024) { // > 1MB
      toast.success(`${uploadedFile.name} (${fileSizeMB} MB) đã được tải lên.`)
    } else {
      toast.success(`${uploadedFile.name} (${fileSizeKB} KB) đã được tải lên`)
    }
  }

  const generateQuestions = async () => {
    if (!file || !subject) {
      toast.error("Vui lòng tải file và nhập chủ đề")
      return
    }

    if (questionTypes.length === 0) {
      toast.error('Vui lòng chọn ít nhất một loại câu hỏi')
      return
    }

    setIsGenerating(true)

    try {
      // Sử dụng API mới để tạo multiple question types
      const response = await apiService.generateMultipleQuestions(file, {
        subject,
        questionCount: questionCount[0],
        questionTypes: questionTypes.map(type => type.toUpperCase().replace('-', '_')),
        tone,
        difficulty,
      })

      if (response.success) {
        // Check if text was truncated and show warning
        if (response.data?.textProcessingInfo?.wasTruncated) {
          const { originalLength, truncatedLength } = response.data.textProcessingInfo;
          toast.warning(
            `⚠️ Văn bản đầu vào quá dài (${Math.round(originalLength / 1000)}K ký tự) đã được cắt ngắn xuống ${Math.round(truncatedLength / 1000)}K ký tự để tối ưu hóa xử lý. Câu hỏi được tạo dựa trên phần đầu của tài liệu.`,
            { autoClose: 8000 }
          );
        }

        // Convert API response to frontend format
        const convertedQuestions: Question[] = response?.data?.questions?.map((q: ApiQuestion, index: number) => ({
          id: index + 1,
          question: q.content,
          options: q.choices.map(choice => choice.content),
          correctAnswer: q.correctAnswers.map(ca =>
            q.choices.find(choice => choice.label === ca.choiceLabel)?.content
          ).filter((content): content is string => Boolean(content)),
          explanation: q.explanation,
          type: q.type.toLowerCase().replace('_', '-')
        })) || []

        setQuestions(convertedQuestions)
        setQualityMetrics({
          difficulty: difficulty || 'Trung bình',
          clarity: 'Nội dung rõ ràng',
          coverage: 'Độ phủ kiến thức tốt'
        })

        localStorage.setItem('generatedQuestions', JSON.stringify(convertedQuestions))
        localStorage.setItem('currentQuestionSet', JSON.stringify(response.data))

        toast.success(`🎉 Đã tạo thành công ${convertedQuestions.length} câu hỏi với ${questionTypes.length} loại khác nhau!`)
      } else {
        toast.error('Không thể tạo câu hỏi nào')
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo câu hỏi')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyAllQuestions = () => {
    const text = questions.map(q =>
      `${q.id}. ${q.question}\n${q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}\nĐáp án: ${q.correctAnswer}\n`
    ).join('\n')

    navigator.clipboard.writeText(text)
    toast.success("Tất cả câu hỏi đã được sao chép vào clipboard")
  }

  const downloadCSV = () => {
    const csvContent = [
      ['STT', 'Câu hỏi', 'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D', 'Đáp án đúng', 'Giải thích'],
      ...questions.map(q => [
        q.id,
        q.question,
        q.options[0] || '',
        q.options[1] || '',
        q.options[2] || '',
        q.options[3] || '',
        q.correctAnswer,
        q.explanation || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `cau-hoi-${subject}-${Date.now()}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-200 mb-6 shadow-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">AI-Powered Quiz Generator</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-4">
            Tạo Câu Hỏi Trắc Nghiệm
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
            Biến nội dung của bạn thành bộ câu hỏi trắc nghiệm thông minh với sức mạnh AI
          </p>

          {user && (
            <div className="mb-6">
              <p className="text-lg text-purple-700 font-medium">
                Chào mừng trở lại, {user.name || user.email}! 👋
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/practice">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Play className="w-5 h-5 mr-2" />
                Bắt Đầu Luyện Tập
              </Button>
            </Link>
            <Link href="/library">
              <Button variant="outline" size="lg" className="border-purple-200 hover:bg-purple-50 shadow-lg">
                <BookOpen className="w-5 h-5 mr-2" />
                Thư viện
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-purple-200 hover:bg-purple-50 shadow-lg">
              <BarChart3 className="w-5 h-5 mr-2" />
              Xem Demo
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Card */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  Tải Tệp Nội Dung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative group">
                  <div className="border-2 border-dashed border-purple-200 rounded-xl p-8 text-center hover:border-purple-400 transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50 group-hover:from-purple-100 group-hover:to-pink-100">
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="p-4 bg-white rounded-full w-fit mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <FileText className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-gray-700 font-medium mb-2">Kéo thả file hoặc click để chọn</p>
                      <p className="text-sm text-gray-500">Hỗ trợ PDF, TXT (tối đa 10MB)</p>
                    </label>
                  </div>
                </div>

                {file && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-green-800 truncate">{file.name}</p>
                        <p className="text-sm text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200">✓ Đã tải</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuration Card */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  Cấu Hình Câu Hỏi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Count */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-semibold text-gray-700">Số lượng câu hỏi</Label>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-bold">
                      {questionCount[0]}
                    </Badge>
                  </div>
                  <Slider
                    value={questionCount}
                    onValueChange={setQuestionCount}
                    max={50}
                    min={1}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 câu</span>
                    <span>50 câu</span>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">Chủ đề</Label>
                  <Input
                    id="subject"
                    placeholder="VD: Toán học, Lịch sử, Khoa học..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>

                {/* Tone & Difficulty */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Giọng văn</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="border-purple-200 focus:border-purple-400">
                        <SelectValue placeholder="Chọn giọng văn" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="academic">📚 Học thuật</SelectItem>
                        <SelectItem value="friendly">😊 Thân thiện</SelectItem>
                        <SelectItem value="serious">🎯 Nghiêm túc</SelectItem>
                        <SelectItem value="casual">😎 Thoải mái</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Mức độ</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="border-purple-200 focus:border-purple-400">
                        <SelectValue placeholder="Chọn mức độ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">🟢 Dễ</SelectItem>
                        <SelectItem value="medium">🟡 Trung bình</SelectItem>
                        <SelectItem value="hard">🔴 Khó</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Question Type */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-gray-700">Loại câu hỏi (có thể chọn nhiều)</Label>
                  <div className="space-y-3">
                    {[
                      { value: 'multiple-choice', label: '🔘 Trắc nghiệm lựa chọn đơn', desc: 'Chọn 1 đáp án đúng' },
                      { value: 'true-false', label: '✅ Đúng/Sai', desc: 'Câu hỏi đúng hoặc sai' },
                      { value: 'multiple-response', label: '☑️ Nhiều đáp án đúng', desc: 'Chọn nhiều đáp án' },
                      // { value: 'matching', label: '🔗 Ghép đôi', desc: 'Nối các cặp tương ứng' },
                      { value: 'completion', label: '📝 Điền khuyết', desc: 'Điền từ vào chỗ trống' }
                    ].map((type) => (
                      <div key={type.value} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-purple-50 transition-colors">
                        <Checkbox
                          id={type.value}
                          checked={questionTypes.includes(type.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setQuestionTypes(prev => [...prev, type.value])
                            } else {
                              setQuestionTypes(prev => prev.filter(t => t !== type.value))
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor={type.value} className="font-medium cursor-pointer">{type.label}</Label>
                          <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={generateQuestions}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  size="lg"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Đang tạo câu hỏi...
                    </>
                  ) : (
                    <>
                      <Target className="w-5 h-5 mr-2" />
                      🎯 Tạo Câu Hỏi Trắc Nghiệm
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quality Metrics */}
            {qualityMetrics && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 animate-in slide-in-from-right">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    Đánh Giá Chất Lượng
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Độ khó', value: qualityMetrics.difficulty, color: 'bg-blue-100 text-blue-800 border-blue-200' },
                      { label: 'Độ rõ ràng', value: qualityMetrics.clarity, color: 'bg-green-100 text-green-800 border-green-200' },
                      { label: 'Độ phủ', value: qualityMetrics.coverage, color: 'bg-purple-100 text-purple-800 border-purple-200' }
                    ].map((metric, index) => (
                      <div key={index} className="text-center p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-300">
                        <Badge className={`mb-3 ${metric.color} font-medium`}>{metric.value}</Badge>
                        <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Questions Display */}
            {questions.length > 0 ? (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 animate-in slide-in-from-right delay-150">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      Câu Hỏi Đã Tạo
                      <Badge className="bg-green-100 text-green-800 border-green-200 ml-2">
                        {questions.length} câu
                      </Badge>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copyAllQuestions} className="hover:bg-purple-50 border-purple-200">
                        <Copy className="w-4 h-4 mr-1" />
                        Sao chép
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadCSV} className="hover:bg-purple-50 border-purple-200">
                        <Download className="w-4 h-4 mr-1" />
                        CSV
                      </Button>
                      <Link href="/practice">
                        <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                          <Play className="w-4 h-4 mr-1" />
                          Luyện tập
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[850px] overflow-y-auto space-y-4 pr-2">
                    {questions.map((question, index) => (
                      <div key={question.id} className="group border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                        <div className="flex items-start gap-4">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-bold min-w-[2rem] h-8 flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <div className="flex-1 space-y-3">
                            <p className="font-semibold text-gray-800 leading-relaxed">{question.question}</p>
                            <div className="grid gap-2">
                              {question.options.map((option, optIndex) => {
                                const isCorrect = Array.isArray(question.correctAnswer)
                                  ? question.correctAnswer.includes(option)
                                  : question.correctAnswer === option
                                return (
                                  <div
                                    key={optIndex}
                                    className={`p-3 rounded-lg border transition-all duration-200 ${isCorrect
                                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800 font-medium shadow-sm'
                                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                      }`}
                                  >
                                    <span className="font-medium text-sm mr-2 text-gray-600">
                                      {String.fromCharCode(65 + optIndex)}.
                                    </span>
                                    {option}
                                    {isCorrect && (
                                      <Badge className="ml-2 bg-green-100 text-green-700 border-green-200 text-xs">
                                        ✓ Đúng
                                      </Badge>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                            {question.explanation && (
                              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800">
                                  <span className="font-semibold">💡 Giải thích:</span> {question.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center py-16">
                  <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full w-fit mx-auto mb-6">
                    <BookOpen className="w-12 h-12 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Sẵn sàng tạo câu hỏi?</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Tải lên file nội dung và cấu hình các tùy chọn bên trái để bắt đầu tạo câu hỏi trắc nghiệm
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
