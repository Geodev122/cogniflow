import React, { useState } from 'react'
import { CheckCircle, Clock, ArrowRight } from 'lucide-react'

interface Question {
  id: string
  text: string
  type: 'scale' | 'multiple_choice' | 'text'
  options?: string[]
  scale_min?: number
  scale_max?: number
  scale_labels?: string[]
}

interface PsychometricFormProps {
  form: {
    id: string
    form_type: string
    title: string
    questions: Question[]
    responses: any
    score: number
    status: 'assigned' | 'completed'
    created_at: string
    completed_at: string | null
  }
  onComplete: (formId: string, responses: any, score: number) => void
  onClose: () => void
}

export const PsychometricForm: React.FC<PsychometricFormProps> = ({ form, onComplete, onClose }) => {
  const [responses, setResponses] = useState(form.responses || {})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const calculateScore = () => {
    let totalScore = 0
    form.questions.forEach(question => {
      const response = responses[question.id]
      if (question.type === 'scale' && typeof response === 'number') {
        totalScore += response
      } else if (question.type === 'multiple_choice' && question.options) {
        const optionIndex = question.options.indexOf(response)
        if (optionIndex !== -1) {
          totalScore += optionIndex
        }
      }
    })
    return totalScore
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    const score = calculateScore()
    await onComplete(form.id, responses, score)
    setIsCompleting(false)
  }

  const isFormComplete = form.questions.every(q => responses[q.id] !== undefined)
  const isCompleted = form.status === 'completed'

  const renderQuestion = (question: Question) => {
    const response = responses[question.id]

    switch (question.type) {
      case 'scale':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {question.scale_labels?.[0] || question.scale_min}
              </span>
              <span className="text-sm text-gray-500">
                {question.scale_labels?.[1] || question.scale_max}
              </span>
            </div>
            <div className="flex justify-between items-center space-x-2">
              {Array.from({ length: (question.scale_max || 10) - (question.scale_min || 0) + 1 }, (_, i) => {
                const value = (question.scale_min || 0) + i
                return (
                  <button
                    key={value}
                    onClick={() => !isCompleted && handleResponse(question.id, value)}
                    disabled={isCompleted}
                    className={`w-12 h-12 rounded-full border-2 font-medium transition-all ${
                      response === value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    } ${isCompleted ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'}`}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => !isCompleted && handleResponse(question.id, option)}
                disabled={isCompleted}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  response === option
                    ? 'bg-blue-50 border-blue-500 text-blue-900'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                } ${isCompleted ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-sm'}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    response === option ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {response === option && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        )

      case 'text':
        return (
          <textarea
            value={response || ''}
            onChange={(e) => !isCompleted && handleResponse(question.id, e.target.value)}
            disabled={isCompleted}
            placeholder="Type your response here..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
            rows={4}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{form.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Question {currentQuestion + 1} of {form.questions.length}
                </p>
              </div>
              <div className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                isCompleted ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100'
              }`}>
                <div className="flex items-center space-x-1">
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  <span>{isCompleted ? 'Completed' : 'In Progress'}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / form.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Current Question */}
            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-900 mb-6">
                {form.questions[currentQuestion]?.text}
              </h4>
              {form.questions[currentQuestion] && renderQuestion(form.questions[currentQuestion])}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-2">
                {form.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentQuestion
                        ? 'bg-blue-600'
                        : responses[form.questions[index].id] !== undefined
                        ? 'bg-green-400'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {currentQuestion < form.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={!isFormComplete || isCompleted || isCompleting}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCompleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      Complete
                      <CheckCircle className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}