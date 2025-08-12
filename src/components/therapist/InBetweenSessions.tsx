import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { Baseline as Timeline, Plus, Calendar, TrendingUp, Clock, CheckCircle, AlertTriangle, BarChart3, MessageSquare, Target, Activity, Send, Eye, Filter } from 'lucide-react'

interface InBetweenSessionsProps {
  caseFile: any
  onUpdate: () => void
}

interface InBetweenTask {
  id: string
  task_type: 'mood_log' | 'thought_record' | 'assessment_checkin' | 'homework'
  title: string
  description: string
  frequency: 'daily' | 'weekly' | 'as_needed'
  status: 'active' | 'paused' | 'completed'
  created_at: string
  submissions: TaskSubmission[]
}

interface TaskSubmission {
  id: string
  task_id: string
  submitted_at: string
  data: any
  client_notes?: string
  mood_rating?: number
}

const TASK_TEMPLATES = [
  {
    type: 'mood_log',
    title: 'Daily Mood Check-in',
    description: 'Track daily mood on a 1-10 scale with notes',
    frequency: 'daily'
  },
  {
    type: 'thought_record',
    title: 'Thought Record Practice',
    description: 'Complete thought challenging exercises between sessions',
    frequency: 'as_needed'
  },
  {
    type: 'assessment_checkin',
    title: 'Weekly PHQ-9 Check-in',
    description: 'Brief depression screening to track progress',
    frequency: 'weekly'
  },
  {
    type: 'homework',
    title: 'Therapy Homework',
    description: 'Custom assignments from therapy sessions',
    frequency: 'as_needed'
  }
]

export const InBetweenSessions: React.FC<InBetweenSessionsProps> = ({ caseFile, onUpdate }) => {
  const [tasks, setTasks] = useState<InBetweenTask[]>([])
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([])
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<InBetweenTask | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    fetchInBetweenData()
  }, [caseFile])

  const fetchInBetweenData = async () => {
    try {
      // Fetch tasks (using form_assignments as proxy)
      const { data: taskData } = await supabase
        .from('form_assignments')
        .select('*')
        .eq('client_id', caseFile.client.id)
        .eq('therapist_id', profile!.id)
        .eq('form_type', 'homework')
        .order('assigned_at', { ascending: false })

      // Fetch submissions (using progress_tracking as proxy)
      const { data: submissionData } = await supabase
        .from('progress_tracking')
        .select('*')
        .eq('client_id', caseFile.client.id)
        .eq('source_type', 'manual')
        .order('recorded_at', { ascending: false })

      setTasks(taskData?.map(task => ({
        id: task.id,
        task_type: 'homework',
        title: task.title,
        description: task.instructions || '',
        frequency: 'as_needed',
        status: task.status === 'completed' ? 'completed' : 'active',
        created_at: task.assigned_at,
        submissions: []
      })) || [])

      setSubmissions(submissionData?.map(sub => ({
        id: sub.id,
        task_id: sub.source_id || '',
        submitted_at: sub.recorded_at,
        data: { value: sub.value },
        mood_rating: sub.value
      })) || [])

    } catch (error) {
      console.error('Error fetching in-between data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (taskData: any) => {
    try {
      const { error } = await supabase
        .from('form_assignments')
        .insert({
          therapist_id: profile!.id,
          client_id: caseFile.client.id,
          form_type: 'homework',
          title: taskData.title,
          instructions: taskData.description,
          reminder_frequency: taskData.frequency,
          status: 'assigned'
        })

      if (error) throw error

      // Log milestone
      await supabase
        .from('audit_logs')
        .insert({
          user_id: profile!.id,
          action: 'between_session_task_created',
          resource_type: 'task',
          client_id: caseFile.client.id,
          details: {
            milestone: 'In-Between Progress Recorded',
            task_type: taskData.type,
            frequency: taskData.frequency
          }
        })

      fetchInBetweenData()
      setShowNewTaskModal(false)
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'mood_log': return <Activity className="w-5 h-5 text-blue-600" />
      case 'thought_record': return <Brain className="w-5 h-5 text-purple-600" />
      case 'assessment_checkin': return <BarChart3 className="w-5 h-5 text-green-600" />
      case 'homework': return <Target className="w-5 h-5 text-orange-600" />
      default: return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'paused': return 'text-yellow-600 bg-yellow-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredTasks = tasks.filter(task => 
    filterStatus === 'all' || task.status === filterStatus
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Timeline className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">In-Between Sessions Progress</h3>
          </div>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Active Tasks</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === 'active').length}</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Submissions</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{submissions.length}</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">Avg Mood</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {submissions.length > 0 
                ? (submissions.reduce((sum, s) => sum + (s.mood_rating || 0), 0) / submissions.length).toFixed(1)
                : 'N/A'
              }
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-900">Compliance</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {tasks.length > 0 ? Math.round((submissions.length / (tasks.length * 7)) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Tasks</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Timeline className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No between-session tasks</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create tasks to track client progress between sessions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getTaskTypeIcon(task.task_type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Frequency: {task.frequency}</span>
                        <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                        <span>Submissions: {task.submissions.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <NewTaskModal
          onClose={() => setShowNewTaskModal(false)}
          onCreate={createTask}
        />
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          submissions={submissions.filter(s => s.task_id === selectedTask.id)}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}

// New Task Modal Component
interface NewTaskModalProps {
  onClose: () => void
  onCreate: (taskData: any) => void
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({ onClose, onCreate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [customTask, setCustomTask] = useState({
    title: '',
    description: '',
    frequency: 'daily'
  })

  const handleCreateFromTemplate = (template: any) => {
    onCreate({
      type: template.type,
      title: template.title,
      description: template.description,
      frequency: template.frequency
    })
  }

  const handleCreateCustom = () => {
    if (customTask.title && customTask.description) {
      onCreate({
        type: 'homework',
        title: customTask.title,
        description: customTask.description,
        frequency: customTask.frequency
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Create Between-Session Task</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Choose from Templates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {TASK_TEMPLATES.map((template) => (
                    <button
                      key={template.type}
                      onClick={() => handleCreateFromTemplate(template)}
                      className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <h5 className="font-medium text-gray-900">{template.title}</h5>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded mt-2">
                        {template.frequency}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Or Create Custom Task</h4>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={customTask.title}
                    onChange={(e) => setCustomTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <textarea
                    placeholder="Task description and instructions"
                    value={customTask.description}
                    onChange={(e) => setCustomTask(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  <select
                    value={customTask.frequency}
                    onChange={(e) => setCustomTask(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="as_needed">As Needed</option>
                  </select>
                  <button
                    onClick={handleCreateCustom}
                    disabled={!customTask.title || !customTask.description}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create Custom Task
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Task Details Modal Component
interface TaskDetailsModalProps {
  task: InBetweenTask
  submissions: TaskSubmission[]
  onClose: () => void
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, submissions, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Task Details</h4>
                <p className="text-gray-600">{task.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>Frequency: {task.frequency}</span>
                  <span>Status: {task.status}</span>
                  <span>Total submissions: {submissions.length}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-4">Recent Submissions</h4>
                {submissions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No submissions yet</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {submissions.slice(0, 10).map((submission) => (
                      <div key={submission.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </span>
                          {submission.mood_rating && (
                            <span className="text-sm text-blue-600">
                              Mood: {submission.mood_rating}/10
                            </span>
                          )}
                        </div>
                        {submission.client_notes && (
                          <p className="text-sm text-gray-600 mt-1">{submission.client_notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}