import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CaseFormulation } from './CaseFormulation'
import { FileText, User, Calendar, TrendingUp, ClipboardList, Plus, Search, Filter, Eye, Clock, Target, BookOpen, MessageSquare, Send, PlayCircle, PlusCircle, Stethoscope, Archive } from 'lucide-react'

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
}

interface TimelineEvent {
  id: string
  event_date: string
  description: string
  event_type: string
}

interface ProgressCheckpoint {
  id: string
  checkpoint_date: string
  note: string
  status: string
}

interface CaseFile {
  client: Client
  sessionCount: number
  lastSession?: string
  nextAppointment?: string
  assessments: Assessment[]
  treatmentPlanId?: string
  treatmentPlanTitle?: string
  goals: Goal[]
  assignments: Assignment[]
  riskLevel: string
  progressSummary: string
  caseNotes: string
  timeline: TimelineEvent[]
  checkpoints: ProgressCheckpoint[]
  dischargeNotes: string
}

interface Assessment {
  id: string
  assessment_name: string
  score: number
  max_score: number
  date: string
  interpretation: string
}

  interface Goal {
    id: string
    title: string
    description: string
    target_date: string
    progress: number
    status: 'active' | 'completed' | 'achieved' | 'modified' | 'discontinued'
    interventions: Intervention[]
  }

  interface Intervention {
    id: string
    description: string
  }

interface Assignment {
  id: string
  type: 'worksheet' | 'exercise' | 'assessment' | 'homework'
  title: string
  description: string
  due_date: string
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue'
  assigned_date: string
}

export const CaseManagement: React.FC = () => {
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([])
  const [selectedCase, setSelectedCase] = useState<CaseFile | null>(null)
  type Tab = 'overview' | 'formulation' | 'goals' | 'assignments' | 'progress' | 'notes' | 'timeline' | 'discharge'
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [dischargeNote, setDischargeNote] = useState('')
  const { profile } = useAuth()

  useEffect(() => {
    if (profile) {
      fetchCaseFiles()
    }
  }, [profile])

  useEffect(() => {
    setDischargeNote(selectedCase?.dischargeNotes || '')
  }, [selectedCase])

  const fetchCaseFiles = async () => {
    if (!profile) return

    try {
      // Simplified client fetching to avoid infinite loops
      const { data: relations, error } = await supabase
        .from('therapist_client_relations')
        .select(`
          client_id,
          profiles!therapist_client_relations_client_id_fkey (
            id,
            first_name,
            last_name,
            email,
            created_at
          )
        `)
        .eq('therapist_id', profile.id)

      if (error) {
        console.error('Error fetching relations:', error)
        setCaseFiles([])
        return
      }

      // Fetch related case data for each client
      const cases = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (relations || []).map(async (relation: any) => {
          const client = relation.profiles

          const { data: timelineData } = await supabase
            .from('session_timeline')
            .select('*')
            .eq('client_id', client.id)
            .order('event_date', { ascending: true })

          const { data: checkpointData } = await supabase
            .from('progress_checkpoints')
            .select('*')
            .eq('client_id', client.id)
            .order('checkpoint_date', { ascending: true })

          const { data: dischargeData } = await supabase
            .from('discharge_notes')
            .select('notes')
            .eq('client_id', client.id)

          return {
            client,
            sessionCount: 0,
            lastSession: undefined,
            nextAppointment: undefined,
            assessments: [],
            treatmentPlanId: undefined,
            treatmentPlanTitle: undefined,
            goals: [],
            assignments: [],
            riskLevel: 'low',
            progressSummary: 'No progress notes available',
            caseNotes: '',
            timeline: timelineData || [],
            checkpoints: checkpointData || [],
            dischargeNotes: dischargeData?.[0]?.notes || ''
          }
        })
      )

      setCaseFiles(cases)
    } catch (error) {
      console.error('Error fetching case files:', error)
      setCaseFiles([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async () => {
    if (!selectedCase || !profile) return
    const title = prompt('Plan title')
    if (!title) return
    
    const { error } = await supabase
      .from('treatment_plans')
      .insert({
        client_id: selectedCase.client.id,
        therapist_id: profile.id,
        title: title,
        status: 'active'
      })
    
    if (error) {
      console.error('Error creating plan:', error)
      alert('Error creating treatment plan. Please try again.')
    } else {
      fetchCaseFiles()
    }
  }

  const handleAddGoal = async () => {
    if (!selectedCase?.treatmentPlanId) return
    const text = prompt('Goal description')
    if (!text) return
    
    const { error } = await supabase
      .from('therapy_goals')
      .insert({
        treatment_plan_id: selectedCase.treatmentPlanId,
        goal_text: text,
        progress_percentage: 0,
        status: 'active'
      })
    
    if (error) {
      console.error('Error adding goal:', error)
      alert('Error adding goal. Please try again.')
    } else {
      fetchCaseFiles()
    }
  }

  const handleCompleteGoal = async (goalId: string) => {
    const { error } = await supabase
      .from('therapy_goals')
      .update({
        progress_percentage: 100,
        status: 'achieved'
      })
      .eq('id', goalId)
    
    if (error) {
      console.error('Error updating goal:', error)
      alert('Error updating goal. Please try again.')
    } else {
      fetchCaseFiles()
    }
  }

  const handleAddIntervention = async (goalId: string) => {
    const description = prompt('Intervention description')
    if (!description) return
    // For now, we'll add interventions as notes to the goal
    // This can be expanded later with a proper interventions table
    const { data: goal } = await supabase
      .from('therapy_goals')
      .select('notes')
      .eq('id', goalId)
      .single()
    
    const existingNotes = goal?.notes || ''
    const updatedNotes = existingNotes ? `${existingNotes}\n• ${description}` : `• ${description}`
    
    const { error } = await supabase
      .from('therapy_goals')
      .update({ notes: updatedNotes })
      .eq('id', goalId)
    
    if (!error) {
      fetchCaseFiles()
    }
  }

  const handleAddTimelineEvent = async () => {
    if (!selectedCase) return
    const description = prompt('Event description')
    if (!description) return

    const { error } = await supabase
      .from('session_timeline')
      .insert({
        client_id: selectedCase.client.id,
        description,
        event_type: 'note',
        event_date: new Date().toISOString()
      })

    if (!error) {
      fetchCaseFiles()
    }
  }

  const handleAddCheckpoint = async () => {
    if (!selectedCase) return
    const note = prompt('Progress note')
    if (!note) return

    const { error } = await supabase
      .from('progress_checkpoints')
      .insert({
        client_id: selectedCase.client.id,
        note,
        status: 'pending',
        checkpoint_date: new Date().toISOString()
      })

    if (!error) {
      fetchCaseFiles()
    }
  }

  const handleSaveDischargeNotes = async () => {
    if (!selectedCase) return
    const { error } = await supabase
      .from('discharge_notes')
      .upsert({
        client_id: selectedCase.client.id,
        notes: dischargeNote
      })

    if (!error) {
      fetchCaseFiles()
    }
  }

  const filteredCases = caseFiles.filter(caseFile => {
    const matchesSearch = `${caseFile.client.first_name} ${caseFile.client.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesRisk = riskFilter === 'all' || caseFile.riskLevel === riskFilter
    return matchesSearch && matchesRisk
  })

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'crisis': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'moderate': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'text-blue-600 bg-blue-100'
      case 'in_progress': return 'text-amber-600 bg-amber-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'overdue': return 'text-red-600 bg-red-100'
      case 'active': return 'text-blue-600 bg-blue-100'
      case 'achieved': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (selectedCase) {
    return (
      <div className="space-y-6">
        {/* Case Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedCase(null)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Case Management
            </button>
            <div className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getRiskColor(selectedCase.riskLevel)}`}>
              Risk Level: {selectedCase.riskLevel}
            </div>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCase.client.first_name} {selectedCase.client.last_name}
              </h2>
              <p className="text-gray-600">{selectedCase.client.email}</p>
              <p className="text-sm text-gray-500">
                Client since {formatDate(selectedCase.client.created_at)}
              </p>
            </div>
              <div className="flex space-x-2">
                <button
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Assign Task
                </button>
              </div>
          </div>
        </div>

        {/* Case Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: FileText },
              { id: 'formulation', name: 'Case Formulation', icon: Stethoscope },
              { id: 'goals', name: 'Goals & Treatment', icon: Target },
              { id: 'assignments', name: 'Assignments', icon: ClipboardList },
              { id: 'timeline', name: 'Session Timeline', icon: Clock },
              { id: 'progress', name: 'Progress Tracking', icon: TrendingUp },
              { id: 'notes', name: 'Case Notes', icon: MessageSquare },
              { id: 'discharge', name: 'Discharge', icon: Archive }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Case Summary */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Summary</h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700">{selectedCase.progressSummary}</p>
                </div>
              </div>

              {/* Recent Assessments */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Assessments</h3>
                {selectedCase.assessments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No assessments completed yet</p>
                ) : (
                  <div className="space-y-3">
                    {selectedCase.assessments.slice(0, 3).map((assessment) => (
                      <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{assessment.assessment_name}</h4>
                          <p className="text-sm text-gray-600">{formatDate(assessment.date)}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {assessment.score}/{assessment.max_score}
                          </div>
                          <div className="text-xs text-gray-500">{assessment.interpretation}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Sessions</span>
                    <span className="font-semibold text-gray-900">{selectedCase.sessionCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Active Goals</span>
                    <span className="font-semibold text-gray-900">{selectedCase.goals.filter(g => g.status === 'active').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pending Tasks</span>
                    <span className="font-semibold text-gray-900">{selectedCase.assignments.filter(a => a.status === 'assigned').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Last Session</span>
                    <span className="font-semibold text-gray-900">{formatDate(selectedCase.lastSession)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-lg">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Assign Assessment</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-lg">
                    <BookOpen className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Assign Worksheet</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-lg">
                    <PlayCircle className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">Assign Exercise</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">Schedule Session</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'formulation' && (
          <CaseFormulation 
            caseFile={selectedCase}
            onUpdate={fetchCaseFiles}
          />
        )}

        {activeTab === 'goals' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {!selectedCase.treatmentPlanId ? (
              <div className="text-center py-8">
                <Target className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No treatment plan</h3>
                <p className="mt-1 text-sm text-gray-500">Create a plan to start setting goals.</p>
                <button
                  onClick={handleCreatePlan}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Plan
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCase.treatmentPlanTitle}</h3>
                  <button
                    onClick={handleAddGoal}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Goal
                  </button>
                </div>

                {selectedCase.goals.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No goals set</h3>
                    <p className="mt-1 text-sm text-gray-500">Start by adding treatment goals for this client.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedCase.goals.map((goal) => (
                      <div key={goal.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{goal.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                            {goal.interventions.length > 0 && (
                              <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
                                {goal.interventions.map(i => (
                                  <li key={i.id}>{i.description}</li>
                                ))}
                              </ul>
                            )}
                            <button
                              onClick={() => handleAddIntervention(goal.id)}
                              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                              Add Intervention
                            </button>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(goal.status)}`}>
                            {goal.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">Target: {formatDate(goal.target_date)}</div>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${goal.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{goal.progress}%</span>
                            </div>
                          </div>
                          {goal.progress < 100 && (
                            <button
                              onClick={() => handleCompleteGoal(goal.id)}
                              className="text-sm text-green-600 hover:text-green-800"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Client Assignments</h3>
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Assignment
              </button>
            </div>
            
            {selectedCase.assignments.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
                <p className="mt-1 text-sm text-gray-500">Assign worksheets, exercises, or assessments to this client.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedCase.assignments.map((assignment) => (
                  <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {assignment.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Assigned: {formatDate(assignment.assigned_date)}</span>
                          <span>Due: {formatDate(assignment.due_date)}</span>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                        {assignment.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Session Timeline</h3>
              <button
                onClick={handleAddTimelineEvent}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Add Event
              </button>
            </div>
            {selectedCase.timeline.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No timeline events</p>
            ) : (
              <div className="space-y-3">
                {selectedCase.timeline.map((event) => (
                  <div key={event.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{event.description}</p>
                      <p className="text-sm text-gray-600">{formatDate(event.event_date)}</p>
                    </div>
                    <span className="text-xs text-gray-500">{event.event_type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Progress Checkpoints</h3>
              <button
                onClick={handleAddCheckpoint}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                Add Checkpoint
              </button>
            </div>
            {selectedCase.checkpoints.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No checkpoints recorded</p>
            ) : (
              <div className="space-y-3">
                {selectedCase.checkpoints.map((cp) => (
                  <div key={cp.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{cp.note}</p>
                      <p className="text-sm text-gray-600">{formatDate(cp.checkpoint_date)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(cp.status)}`}>{cp.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Case Notes</h3>
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add case notes, session summaries, observations..."
              defaultValue={selectedCase.caseNotes}
            />
            <div className="mt-4 flex justify-end">
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Notes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'discharge' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Discharge Notes</h3>
            <textarea
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter discharge summary..."
              value={dischargeNote}
              onChange={(e) => setDischargeNote(e.target.value)}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveDischargeNotes}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Discharge Notes
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Case Management</h2>
          <p className="text-gray-600">Comprehensive case management with goals, assignments, and progress tracking</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="high">High Risk</option>
              <option value="crisis">Crisis</option>
            </select>
          </div>
        </div>
      </div>

      {/* Case Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.map((caseFile) => (
          <div key={caseFile.client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {caseFile.client.first_name} {caseFile.client.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{caseFile.client.email}</p>
                </div>
              </div>
              <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(caseFile.riskLevel)}`}>
                {caseFile.riskLevel}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{caseFile.sessionCount}</div>
                <div className="text-xs text-gray-600">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{caseFile.goals.filter(g => g.status === 'active').length}</div>
                <div className="text-xs text-gray-600">Goals</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">{caseFile.assignments.filter(a => a.status === 'assigned').length}</div>
                <div className="text-xs text-gray-600">Pending</div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center justify-between">
                <span>Last Session:</span>
                <span>{formatDate(caseFile.lastSession)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Next Session:</span>
                <span>{formatDate(caseFile.nextAppointment)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCase(caseFile)}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              Open Case
            </button>
          </div>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No cases found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || riskFilter !== 'all' 
              ? 'Try adjusting your search or filters.'
              : 'Add clients to your roster to create cases.'
            }
          </p>
        </div>
      )}
    </div>
  )
}