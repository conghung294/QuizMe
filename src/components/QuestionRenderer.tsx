'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

interface Question {
    id: number
    question: string
    options: string[]
    correctAnswer: string | string[]
    explanation?: string
    type: string
}

interface QuestionRendererProps {
    question: Question
    selectedAnswers: string[]
    onAnswerSelect: (answer: string) => void
    showAnswer: boolean
    isCorrect?: boolean
}

export default function QuestionRenderer({
    question,
    selectedAnswers,
    onAnswerSelect,
    showAnswer,
    isCorrect
}: QuestionRendererProps) {
    const formatQuestionType = (type: string) => {
        switch (type.toLowerCase().replace('_', '-')) {
            case 'multiple-choice': return 'Trắc nghiệm'
            case 'true-false': return 'Đúng/Sai'
            case 'multiple-response': return 'Nhiều lựa chọn'
            case 'matching': return 'Ghép đôi'
            case 'completion': return 'Điền khuyết'
            default: return type
        }
    }

    const renderMultipleChoice = () => (
        <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
                💡 Chọn một đáp án đúng nhất.
            </p>
            {question.options.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index) // A, B, C, D
                const isSelected = selectedAnswers.includes(option)
                const isCorrect = Array.isArray(question.correctAnswer)
                    ? question.correctAnswer.includes(option)
                    : question.correctAnswer === option

                return (
                    <Button
                        key={index}
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full p-4 h-auto text-left justify-start transition-all duration-200 ${showAnswer
                            ? isCorrect
                                ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-100'
                                : isSelected
                                    ? 'bg-red-100 border-red-300 text-red-800 hover:bg-red-100'
                                    : 'bg-gray-50 border-gray-200 text-gray-600'
                            : isSelected
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'hover:bg-purple-50 hover:border-purple-300'
                            }`}
                        onClick={() => !showAnswer && onAnswerSelect(option)}
                        disabled={showAnswer}
                    >
                        <div className="flex items-start gap-3 w-full">
                            <span className="font-semibold text-sm bg-white/20 px-2 py-1 rounded">
                                {optionLabel}
                            </span>
                            <span className="flex-1 text-sm leading-relaxed">{option}</span>
                            {showAnswer && isCorrect && (
                                <span className="text-green-600">✓</span>
                            )}
                            {showAnswer && isSelected && !isCorrect && (
                                <span className="text-red-600">✗</span>
                            )}
                        </div>
                    </Button>
                )
            })}
        </div>
    )

    const renderTrueFalse = () => (
        <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
                💡 Chọn Đúng hoặc Sai.
            </p>
            {question.options.map((option, index) => {
                const isSelected = selectedAnswers.includes(option)
                const isCorrect = Array.isArray(question.correctAnswer)
                    ? question.correctAnswer.includes(option)
                    : question.correctAnswer === option

                return (
                    <Button
                        key={index}
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full p-4 h-auto text-left justify-start transition-all duration-200 ${showAnswer
                            ? isCorrect
                                ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-100'
                                : isSelected
                                    ? 'bg-red-100 border-red-300 text-red-800 hover:bg-red-100'
                                    : 'bg-gray-50 border-gray-200 text-gray-600'
                            : isSelected
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'hover:bg-purple-50 hover:border-purple-300'
                            }`}
                        onClick={() => !showAnswer && onAnswerSelect(option)}
                        disabled={showAnswer}
                    >
                        <div className="flex items-center gap-3 w-full">
                            <span className="text-lg">
                                {option.toLowerCase().includes('đúng') || option.toLowerCase().includes('true') ? '✓' : '✗'}
                            </span>
                            <span className="flex-1 text-sm font-medium">{option}</span>
                            {showAnswer && isCorrect && (
                                <span className="text-green-600">✓</span>
                            )}
                            {showAnswer && isSelected && !isCorrect && (
                                <span className="text-red-600">✗</span>
                            )}
                        </div>
                    </Button>
                )
            })}
        </div>
    )

    const renderMultipleResponse = () => (
        <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
                💡 Câu hỏi này có thể có nhiều đáp án đúng. Hãy chọn tất cả đáp án bạn cho là đúng.
            </p>
            {question.options.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index) // A, B, C, D
                const isSelected = selectedAnswers.includes(option)
                const isCorrect = Array.isArray(question.correctAnswer)
                    ? question.correctAnswer.includes(option)
                    : question.correctAnswer === option

                return (
                    <div
                        key={index}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${showAnswer
                            ? isCorrect
                                ? 'bg-green-50 border-green-300'
                                : isSelected
                                    ? 'bg-red-50 border-red-300'
                                    : 'bg-gray-50 border-gray-200'
                            : isSelected
                                ? 'bg-purple-50 border-purple-300'
                                : 'bg-white border-gray-200 hover:border-purple-300'
                            }`}
                        onClick={() => !showAnswer && onAnswerSelect(option)}
                    >
                        <Checkbox
                            checked={isSelected}
                            disabled={showAnswer}
                            className="mt-1"
                        />
                        <div className="flex-1">
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-sm bg-gray-100 px-2 py-1 rounded">
                                    {optionLabel}
                                </span>
                                <span className="flex-1 text-sm leading-relaxed">{option}</span>
                                {showAnswer && isCorrect && (
                                    <span className="text-green-600">✓</span>
                                )}
                                {showAnswer && isSelected && !isCorrect && (
                                    <span className="text-red-600">✗</span>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )

    const renderMatching = () => (
        <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
                💡 Các cặp ghép đôi đã được sắp xếp đúng. Hãy xác nhận tất cả các cặp.
            </p>
            {question.options.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index) // A, B, C, D
                const isSelected = selectedAnswers.includes(option)
                const isCorrect = true // For matching, all pairs should be correct

                return (
                    <div
                        key={index}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${showAnswer
                            ? 'bg-green-50 border-green-300'
                            : isSelected
                                ? 'bg-purple-50 border-purple-300'
                                : 'bg-white border-gray-200 hover:border-purple-300'
                            }`}
                        onClick={() => !showAnswer && onAnswerSelect(option)}
                    >
                        <Checkbox
                            checked={isSelected}
                            disabled={showAnswer}
                            className="mt-1"
                        />
                        <div className="flex-1">
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-sm bg-gray-100 px-2 py-1 rounded">
                                    {optionLabel}
                                </span>
                                <span className="flex-1 text-sm leading-relaxed">{option}</span>
                                {showAnswer && (
                                    <span className="text-green-600">✓</span>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )

    const renderCompletion = () => (
        <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
                💡 Chọn từ/cụm từ phù hợp để điền vào chỗ trống được đánh dấu.
            </p>
            {question.options.map((option, index) => {
                const optionLabel = String.fromCharCode(65 + index) // A, B, C, D
                const isSelected = selectedAnswers.includes(option)
                const isCorrect = Array.isArray(question.correctAnswer)
                    ? question.correctAnswer.includes(option)
                    : question.correctAnswer === option

                return (
                    <Button
                        key={index}
                        variant={isSelected ? "default" : "outline"}
                        className={`w-full p-4 h-auto text-left justify-start transition-all duration-200 ${showAnswer
                            ? isCorrect
                                ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-100'
                                : isSelected
                                    ? 'bg-red-100 border-red-300 text-red-800 hover:bg-red-100'
                                    : 'bg-gray-50 border-gray-200 text-gray-600'
                            : isSelected
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'hover:bg-purple-50 hover:border-purple-300'
                            }`}
                        onClick={() => !showAnswer && onAnswerSelect(option)}
                        disabled={showAnswer}
                    >
                        <div className="flex items-start gap-3 w-full">
                            <span className="font-semibold text-sm bg-white/20 px-2 py-1 rounded">
                                {optionLabel}
                            </span>
                            <span className="flex-1 text-sm leading-relaxed font-medium">{option}</span>
                            {showAnswer && isCorrect && (
                                <span className="text-green-600">✓</span>
                            )}
                            {showAnswer && isSelected && !isCorrect && (
                                <span className="text-red-600">✗</span>
                            )}
                        </div>
                    </Button>
                )
            })}
        </div>
    )

    const renderQuestion = () => {
        const questionType = question.type.toLowerCase().replace('_', '-')

        switch (questionType) {
            case 'multiple-choice':
                return renderMultipleChoice()
            case 'true-false':
                return renderTrueFalse()
            case 'multiple-response':
                return renderMultipleResponse()
            case 'matching':
                return renderMatching()
            case 'completion':
                return renderCompletion()
            default:
                return renderMultipleChoice() // fallback
        }
    }

    return (
        <div className="space-y-6">
            {/* Question Header */}
            <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="border-purple-200 text-purple-700">
                    {formatQuestionType(question.type)}
                </Badge>
                {showAnswer && (
                    <Badge className={isCorrect ? 'bg-green-600' : 'bg-red-600'}>
                        {isCorrect ? '✓ Đúng' : '✗ Sai'}
                    </Badge>
                )}
            </div>

            {/* Question Content */}
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <p className="text-lg font-medium text-gray-800 leading-relaxed">
                    {question.type.toLowerCase().replace('_', '-') === 'completion' ? (
                        // Highlight blank spaces for completion questions
                        question.question.split('_____').map((part, index, array) => (
                            <span key={index}>
                                {part}
                                {index < array.length - 1 && (
                                    <span className="inline-block bg-yellow-200 border-2 border-yellow-400 rounded px-3 py-1 mx-1 text-yellow-800 font-bold">
                                        _____
                                    </span>
                                )}
                            </span>
                        ))
                    ) : (
                        question.question
                    )}
                </p>
            </div>

            {/* Answer Options */}
            {renderQuestion()}
        </div>
    )
}
