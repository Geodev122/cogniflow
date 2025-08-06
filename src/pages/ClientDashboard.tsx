import React, { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { PsychometricForm } from '../components/PsychometricForm'
import { ProgressChart } from '../components/ProgressChart'
import { GameExercise } from '../components/GameExercise'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
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
  Target
} from 'lucide-react'

interface Worksheet {
  id: string
  type: string
  title: string
  content: any
  status: 'assigned' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
  therapist: {
    first_name: string
    last_name: string
  }
}

interface PsychometricForm {
  id: string
  form_type: string
  title: string
  questions: any[]
  responses: any
  score: number
  status: 'assigned' | 'completed'
  created_at: string
  completed_at: string | null
  therapist: {
    first_name: string
    last_name: string
  }
}

interface Exercise {
  id: string
  exercise_type: string
  title: string
  description: string
  game_config: any
  progress: any
  status: 'assigned' | 'in_progress' | 'completed'
  created_at: string
  last_played_at: string | null
  therapist: {
    first_name: string
    last_name: string
  }
}

interface ProgressData {
  date: string
  value: number
  metric_type: string
}

export const ClientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'worksheets' | 'assessments' | 'exercises' | 'progress'>('overview')
  const [worksheets, setWorksheets] = useState<Worksheet[]>([])
  const [psychometricForms, setPsychometricForms] = useState<PsychometricForm[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [selectedWorksheet, setSelectedWorksheet] = useState<Worksheet | null>(null)
  const [selectedForm, setSelectedForm] = useState<PsychometricForm | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    fetchAllData()
  }, [profile])

  const fetchAllData = async () => {
    if (!profile) return

    try {
      await Promise.all([
        fetchWorksheets(),
        fetchPsychometricForms(),
        fetchExercises(),
        fetchProgressData()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorksheets = async () => {
    if (!profile) return

    const { data, error } = await supabase
      .from('cbt_worksheets')
      .select(`
        *,
        profiles!cbt_worksheets_therapist_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const worksheetsWithTherapist = data?.map(worksheet => ({
      ...worksheet,
      therapist: worksheet.profiles
    })) || []

    setWorksheets(worksheetsWithTherapist)
  }

  const fetchPsychometricForms = async () => {
    if (!profile) return

    const { data, error } = await supabase
      .from('psychometric_forms')
      .select(`
        *,
        profiles!psychometric_forms_therapist_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const formsWithTherapist = data?.map(form => ({
      ...form,
      therapist: form.profiles
    })) || []

    setPsychometricForms(formsWithTherapist)
  }

  const fetchExercises = async () => {
    if (!profile) return

    const { data, error } = await supabase
      .from('therapeutic_exercises')
      .select(`
        *,
        profiles!therapeutic_exercises_therapist_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const exercisesWithTherapist = data?.map(exercise => ({
      ...exercise,
      therapist: exercise.profiles
    })) || []

    setExercises(exercisesWithTherapist)
  }

  const fetchProgressData = async () => {
    if (!profile) return

    const { data, error } = await supabase
      .from('progress_tracking')
      .select('*')
      .eq('client_id', profile.id)
      .order('recorded_at', { ascending: true })

    if (error) throw error

    const formattedData = data?.map(item => ({
      date: item.recorded_at,
      value: item.value,
      metric_type: item.metric_type
    })) || []

    setProgressData(formattedData)
  }

  const updateWorksheet = async (worksheetId: string, content: any, status: string) => {
    try {
      const { error } = await supabase
        .from('cbt_worksheets')
        .update({ 
          content, 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', worksheetId)

      if (error) throw error

      await fetchWorksheets()
      
      if (selectedWorksheet?.id === worksheetId) {
        setSelectedWorksheet({
          ...selectedWorksheet,
          content,
          status: status as any
        })
      }
    } catch (error) {
      console.error('Error updating worksheet:', error)
    }
  }

  const completePsychometricForm = async (formId: string, responses: any, score: number) => {
    try {
      const { error } = await supabase
        .from('psychometric_forms')
        .update({ 
          responses, 
          score,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', formId)

      if (error) throw error

      // Add to progress tracking
      const form = psychometricForms.find(f => f.id === formId)
      if (form) {
        await supabase
          .from('progress_tracking')
          .insert({
            client_id: profile!.id,
            metric_type: form.form_type,
            value: score,
            source_type: 'psychometric',
            source_id: formId
          })
      }

      await fetchPsychometricForms()
      await fetchProgressData()
      setSelectedForm(null)
    } catch (error) {
      console.error('Error completing form:', error)
    }
  }

  const updateExerciseProgress = async (exerciseId: string, progress: any, status: string) => {
    try {
      const { error } = await supabase
        .from('therapeutic_exercises')
        .update({ 
          progress, 
          status,
          last_played_at: new Date().toISOString()
        })
        .eq('id', exerciseId)

      if (error) throw error

      await fetchExercises()
      
      if (selectedExercise?.id === exerciseId) {
        setSelectedExercise({
          ...selectedExercise,
          progress,
          status: status as any
        })
      }
    } catch (error) {
      console.error('Error updating exercise:', error)
    }
  }

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

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-teal-500 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {profile?.first_name}!</h2>
        <p className="text-blue-100">Continue your therapeutic journey with your assigned activities.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Worksheets</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{worksheets.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardList className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Assessments</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{psychometricForms.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Gamepad2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Exercises</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{exercises.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {[...worksheets, ...psychometricForms, ...exercises].filter(item => item.status === 'completed').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Assignments</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[...worksheets, ...psychometricForms, ...exercises]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 3)
                .map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(item.created_at)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('worksheets')}
                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Complete Worksheets</span>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-600" />
              </button>
              
              <button
                onClick={() => setActiveTab('assessments')}
                className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Take Assessments</span>
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
          </div>
        </div>
      </div>
    </div>
  )

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
                      <p className="text-sm text-gray-500">
                        Assigned by Dr. {worksheet.therapist.first_name} {worksheet.therapist.last_name}
                      </p>
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
                        {form.form_type.toUpperCase()} • Dr. {form.therapist.first_name} {form.therapist.last_name}
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
                  <p>Assigned by Dr. {exercise.therapist.first_name} {exercise.therapist.last_name}</p>
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
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
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
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
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
          onComplete={completePsychometricForm}
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
interface ThoughtRecordModalProps {
  worksheet: Worksheet
  onClose: () => void
  onUpdate: (worksheetId: string, content: any, status: string) => void
}

const ThoughtRecordModal: React.FC<ThoughtRecordModalProps> = ({ worksheet, onClose, onUpdate }) => {
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