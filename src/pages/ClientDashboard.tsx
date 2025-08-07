import React, { useState, useMemo } from 'react'
import { Layout } from '../components/Layout'
import { PsychometricForm } from '../components/PsychometricForm'
import { ProgressChart } from '../components/ProgressChart'
import { GameExercise } from '../components/GameExercise'
import { useClientData } from '../hooks/useClientData'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  ClipboardList, 
  TrendingUp, 
  Gamepad2,
  Play,
  Trophy,
  Target,
  Menu,
  X,
  User,
  MessageSquare,
  Calendar,
  Bell,
  AlertTriangle
} from 'lucide-react'

export default function ClientDashboard() {
  const { profile } = useAuth()
  const {
    worksheets,
    psychometricForms,
    exercises,
    progressData,
    loading,
    usingFallbackData
  } = useClientData()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedWorksheet, setSelectedWorksheet] = useState<any>(null)
  const [selectedForm, setSelectedForm] = useState<any>(null)
  const [selectedExercise, setSelectedExercise] = useState<any>(null)
  
  const {
    worksheets,
    psychometricForms,
    exercises,
    progressData,
    loading,
    updateWorksheet,
    completePsychometricForm,
    updateExerciseProgress
  } = useClientData()

  // Memoized calculations for better performance
  const stats = useMemo(() => {
    const totalItems = worksheets.length + psychometricForms.length + exercises.length
    const completedItems = [...worksheets, ...psychometricForms, ...exercises]
      .filter(item => item.status === 'completed').length
    
    return {
      worksheets: worksheets.length,
      assessments: psychometricForms.length,
      exercises: exercises.length,
      completed: completedItems
    }
  }, [worksheets, psychometricForms, exercises])

  const recentActivities = useMemo(() => {
    return [...worksheets, ...psychometricForms, ...exercises]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
  }, [worksheets, psychometricForms, exercises])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'text-blue-600 bg-blue-100'
      case 'in_progress': return 'text-amber-600 bg-amber-100'
      case 'completed': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Clock className="w-4 h-4" />
      case 'in_progress': return <FileText className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'breathing': return '🫁'
      case 'mindfulness': return '🧘‍♀️'
      case 'cognitive_restructuring': return '🧠'
      default: return '🎯'
    }
  }

  if (loading) {
    return (
      <Layout title="My Dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  const renderOverview = () => {
    return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-teal-500 text-white p-4 sm:p-6 rounded-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Welcome back!</h2>
            <p className="text-blue-100 text-sm sm:text-base">Continue your therapeutic journey with your assigned activities.</p>
          </div>
          <div className="flex items-center space-x-2 text-blue-100">
            <Bell className="w-5 h-5" />
            <span className="text-sm">3 new</span>
          </div>
        </div>
        
        {/* Quick Actions for Mobile */}
        <div className="mt-4 flex flex-wrap gap-2 sm:hidden">
          <button
            onClick={() => setActiveTab('worksheets')}
            className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium"
          >
            Worksheets
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium"
          >
            Assessments
          </button>
          <button
            onClick={() => setActiveTab('exercises')}
            className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium"
          >
            Exercises
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-3 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Worksheets</dt>
                  <dd className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.worksheets}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-3 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardList className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div className="ml-2 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Assessments</dt>
                  <dd className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.assessments}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-3 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Gamepad2 className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-2 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Exercises</dt>
                  <dd className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.exercises}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-3 sm:p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div className="ml-2 sm:ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg sm:text-2xl font-semibold text-gray-900">{stats.completed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Assignments</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.length > 0 ? recentActivities.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(item.created_at)}</p>
                    </div>
                  </div>
                )) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No assignments yet</p>
                  <p className="text-sm text-gray-500">Your therapist will assign activities for you</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3 hidden sm:block">
              <button
                onClick={() => setActiveTab('worksheets')}
                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Send Worksheets</span>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-600" />
              </button>
              
              <button
                onClick={() => setActiveTab('assessments')}
                className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Send Assessments</span>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-600" />
              </button>
              
              <button
                onClick={() => setActiveTab('exercises')}
                className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Gamepad2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Play Exercises</span>
                </div>
                <ChevronRight className="w-5 h-5 text-green-600" />
              </button>
            </div>
            
            {/* Mobile Quick Actions */}
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              <button
                onClick={() => setActiveTab('worksheets')}
                className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center"
              >
                <FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <span className="text-xs font-medium text-blue-900">Worksheets</span>
              </button>
              <button
                onClick={() => setActiveTab('assessments')}
                className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center"
              >
                <ClipboardList className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <span className="text-xs font-medium text-purple-900">Assessments</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    )
  }

  const renderWorksheets = () => (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">CBT Worksheets</h3>
      </div>
      <div className="overflow-hidden">
        {worksheets.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No worksheets yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your therapist will assign worksheets for you to complete.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {worksheets.map((worksheet) => (
              <li key={worksheet.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(worksheet.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(worksheet.status)}
                          <span className="capitalize">{worksheet.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{worksheet.title}</h4>
                      <p className="text-sm text-gray-500">Assigned by your therapist</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(worksheet.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedWorksheet(worksheet)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    {worksheet.status === 'completed' ? 'Review' : 'Open'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  const renderAssessments = () => (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Psychometric Assessments</h3>
      </div>
      <div className="overflow-hidden">
        {psychometricForms.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assessments yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your therapist will assign assessments to track your progress.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {psychometricForms.map((form) => (
              <li key={form.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(form.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(form.status)}
                          <span className="capitalize">{form.status}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{form.title}</h4>
                      <p className="text-sm text-gray-500">
                        {form.form_type.toUpperCase()} • Assigned by your therapist
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(form.created_at)}
                      </p>
                      {form.status === 'completed' && (
                        <p className="text-xs text-green-600 font-medium">
                          Score: {form.score}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedForm(form)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                  >
                    {form.status === 'completed' ? 'Review' : 'Take Assessment'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  const renderExercises = () => (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Therapeutic Exercises</h3>
      </div>
      <div className="overflow-hidden">
        {exercises.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No exercises yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your therapist will assign interactive exercises to help with your therapy.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {exercises.map((exercise) => (
              <div key={exercise.id} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">{getExerciseIcon(exercise.exercise_type)}</div>
                  <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(exercise.status)}`}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(exercise.status)}
                      <span className="capitalize">{exercise.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{exercise.title}</h4>
                <p className="text-sm text-gray-600 mb-4">{exercise.description}</p>
                
                <div className="text-xs text-gray-500 mb-4">
                  <p>Assigned by your therapist</p>
                  <p>{formatDate(exercise.created_at)}</p>
                  {exercise.last_played_at && (
                    <p>Last played: {formatDate(exercise.last_played_at)}</p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedExercise(exercise)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {exercise.status === 'completed' ? 'Play Again' : 'Start Exercise'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderProgress = () => {
    const moodData = progressData.filter(d => d.metric_type.includes('mood') || d.metric_type.includes('phq'))
    const anxietyData = progressData.filter(d => d.metric_type.includes('anxiety') || d.metric_type.includes('gad'))
    const wellbeingData = progressData.filter(d => d.metric_type.includes('wellbeing') || d.metric_type.includes('quality'))

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Your Progress Journey</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Track your therapeutic progress over time. Lower scores typically indicate improvement for depression and anxiety measures.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProgressChart
            data={moodData}
            title="Mood & Depression"
            metricType="depression"
            color="blue"
          />
          <ProgressChart
            data={anxietyData}
            title="Anxiety Levels"
            metricType="anxiety"
            color="amber"
          />
        </div>

        {wellbeingData.length > 0 && (
          <ProgressChart
            data={wellbeingData}
            title="Overall Wellbeing"
            metricType="wellbeing"
            color="green"
          />
        )}

        {progressData.length === 0 && (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Data Yet</h3>
            <p className="text-gray-600">
              Complete assessments and exercises to start tracking your therapeutic progress.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <Layout title="My Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.first_name}!</h1>
          <div className="flex items-center space-x-2">
            {usingFallbackData && (
              <div className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Demo Mode</span>
              </div>
            )}
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="sm:hidden flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">My Dashboard</h2>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Navigation Tabs - Desktop */}
        <div className="hidden sm:block border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', name: 'Overview', icon: Target },
              { id: 'worksheets', name: 'Worksheets', icon: FileText },
              { id: 'assessments', name: 'Assessments', icon: ClipboardList },
              { id: 'exercises', name: 'Exercises', icon: Gamepad2 },
              { id: 'progress', name: 'Progress', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'overview', name: 'Overview', icon: Target, color: 'blue' },
                  { id: 'worksheets', name: 'Worksheets', icon: FileText, color: 'green' },
                  { id: 'assessments', name: 'Assessments', icon: ClipboardList, color: 'purple' },
                  { id: 'exercises', name: 'Exercises', icon: Gamepad2, color: 'orange' },
                  { id: 'progress', name: 'Progress', icon: TrendingUp, color: 'teal' }
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any)
                        setMobileMenuOpen(false)
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isActive
                          ? `border-${tab.color}-500 bg-${tab.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${
                        isActive ? `text-${tab.color}-600` : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        isActive ? `text-${tab.color}-900` : 'text-gray-700'
                      }`}>{tab.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'worksheets' && renderWorksheets()}
        {activeTab === 'assessments' && renderAssessments()}
        {activeTab === 'exercises' && renderExercises()}
        {activeTab === 'progress' && renderProgress()}
      </div>

      {/* Modals */}
      {selectedWorksheet && (
        <ThoughtRecordModal
          worksheet={selectedWorksheet}
          onClose={() => setSelectedWorksheet(null)}
          onUpdate={updateWorksheet}
        />
      )}

      {selectedForm && (
        <PsychometricForm
          form={selectedForm}
          onComplete={(formId, responses, score) => {
            completePsychometricForm(formId, responses, score)
            setSelectedForm(null)
          }}
          onClose={() => setSelectedForm(null)}
        />
      )}

      {selectedExercise && (
        <GameExercise
          exercise={selectedExercise}
          onUpdateProgress={updateExerciseProgress}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </Layout>
  )
}

// Thought Record Modal Component (keeping existing implementation)
const ThoughtRecordModal: React.FC<{
  worksheet: any
  onClose: () => void
  onUpdate: (worksheetId: string, content: any, status: string) => void
}> = ({ worksheet, onClose, onUpdate }) => {
  const [content, setContent] = useState(worksheet.content)

  const handleChange = (field: string, value: any) => {
    const newContent = { ...content, [field]: value }
    setContent(newContent)
    
    const newStatus = worksheet.status === 'assigned' ? 'in_progress' : worksheet.status
    onUpdate(worksheet.id, newContent, newStatus)
  }

  const handleComplete = () => {
    onUpdate(worksheet.id, content, 'completed')
    onClose()
  }

  const isCompleted = worksheet.status === 'completed'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'text-blue-600 bg-blue-100'
      case 'in_progress': return 'text-amber-600 bg-amber-100'
      case 'completed': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Clock className="w-4 h-4" />
      case 'in_progress': return <FileText className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Thought Record</h3>
              <div className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(worksheet.status)}`}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(worksheet.status)}
                  <span className="capitalize">{worksheet.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Describe the situation
                </label>
                <textarea
                  value={content.situation || ''}
                  onChange={(e) => handleChange('situation', e.target.value)}
                  placeholder="What happened? Where were you? Who was involved?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  disabled={isCompleted}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. What automatic thought went through your mind?
                </label>
                <textarea
                  value={content.automatic_thought || ''}
                  onChange={(e) => handleChange('automatic_thought', e.target.value)}
                  placeholder="What thoughts popped into your head in that moment?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  disabled={isCompleted}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    3. What emotion did you feel?
                  </label>
                  <input
                    type="text"
                    value={content.emotion || ''}
                    onChange={(e) => handleChange('emotion', e.target.value)}
                    placeholder="e.g., anxious, sad, angry"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isCompleted}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    4. Intensity (0-10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={content.intensity || 0}
                    onChange={(e) => handleChange('intensity', parseInt(e.target.value))}
                    className="w-full"
                    disabled={isCompleted}
                  />
                  <div className="text-center text-sm text-gray-600 mt-1">
                    {content.intensity || 0}/10
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  5. Evidence that supports this thought
                </label>
                <textarea
                  value={content.evidence_for || ''}
                  onChange={(e) => handleChange('evidence_for', e.target.value)}
                  placeholder="What facts support this thought?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  disabled={isCompleted}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  6. Evidence that contradicts this thought
                </label>
                <textarea
                  value={content.evidence_against || ''}
                  onChange={(e) => handleChange('evidence_against', e.target.value)}
                  placeholder="What facts contradict this thought? What would you tell a friend?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  disabled={isCompleted}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  7. More balanced thought
                </label>
                <textarea
                  value={content.balanced_thought || ''}
                  onChange={(e) => handleChange('balanced_thought', e.target.value)}
                  placeholder="What's a more realistic, balanced way to think about this?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  disabled={isCompleted}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    8. New emotion
                  </label>
                  <input
                    type="text"
                    value={content.new_emotion || ''}
                    onChange={(e) => handleChange('new_emotion', e.target.value)}
                    placeholder="How do you feel now?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isCompleted}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    9. New intensity (0-10)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={content.new_intensity || 0}
                    onChange={(e) => handleChange('new_intensity', parseInt(e.target.value))}
                    className="w-full"
                    disabled={isCompleted}
                  />
                  <div className="text-center text-sm text-gray-600 mt-1">
                    {content.new_intensity || 0}/10
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
            {!isCompleted && (
              <button
                type="button"
                onClick={handleComplete}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
              >
                Mark Complete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}