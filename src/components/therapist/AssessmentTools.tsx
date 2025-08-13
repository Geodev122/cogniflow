import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Send, 
  Calendar,
  BarChart3,
  FileText,
  Brain,
  Target,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Assessment {
  id: string
  name: string
  abbreviation: string
  category: string
  description: string
  questions: any[]
  scoring_method: any
  interpretation_guide: any
}

interface AssignedAssessment {
  id: string
  client_id: string
  title: string
  status: string
  due_date: string
  assigned_at: string
  completed_at?: string
  client: {
    first_name: string
    last_name: string
    email: string
  }
  responses?: any
  score?: number
}

export const AssessmentTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'library' | 'assigned' | 'create' | 'reports'>('library')
  const [assessmentLibrary, setAssessmentLibrary] = useState<Assessment[]>([])
  const [assignedAssessments, setAssignedAssessments] = useState<AssignedAssessment[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    fetchData()
  }, [profile])

  const fetchData = async () => {
    if (!profile) return

    try {
      await Promise.all([
        fetchAssessmentLibrary(),
        fetchAssignedAssessments(),
        fetchClients()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssessmentLibrary = async () => {
    const { data, error } = await supabase
      .from('assessment_library')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })

    if (error) throw error
    setAssessmentLibrary(data || [])
  }

  const fetchAssignedAssessments = async () => {
    if (!profile) return

    const { data, error } = await supabase
      .from('form_assignments')
      .select(`
        *,
        profiles!form_assignments_client_id_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq('therapist_id', profile.id)
      .eq('form_type', 'psychometric')
      .order('assigned_at', { ascending: false })

    if (error) throw error

    const assignmentsWithClient = data?.map(assignment => ({
      ...assignment,
      client: assignment.profiles
    })) || []

    setAssignedAssessments(assignmentsWithClient)
  }

  const fetchClients = async () => {
    if (!profile?.id) return

    const { data, error } = await supabase
      .from('therapist_client_relations')
      .select(`
        client_id,
        profiles!therapist_client_relations_client_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('therapist_id', profile.id)

    if (error) throw error

    const clientList = data?.map(relation => relation.profiles).filter(Boolean) || []
    setClients(clientList)
  }

  const assignAssessment = async (assessmentId: string, clientIds: string[], dueDate: string, instructions: string) => {
    try {
      const assessment = assessmentLibrary.find(a => a.id === assessmentId)
      if (!assessment) return

      const assignments = clientIds.map(clientId => ({
        therapist_id: profile!.id,
        client_id: clientId,
        form_type: 'psychometric',
        form_id: assessmentId,
        title: assessment.name,
        instructions,
        due_date: dueDate,
        status: 'assigned'
      }))

      const { error } = await supabase
        .from('form_assignments')
        .insert(assignments)

      if (error) throw error

      // Also create entries in psychometric_forms table
      const psychometricForms = clientIds.map(clientId => ({
        therapist_id: profile!.id,
        client_id: clientId,
        form_type: assessment.abbreviation?.toLowerCase() || 'custom',
        title: assessment.name,
        questions: assessment.questions,
        status: 'assigned'
      }))

      await supabase
        .from('psychometric_forms')
        .insert(psychometricForms)

      await fetchAssignedAssessments()
      setShowAssignModal(false)
      setSelectedAssessment(null)
    } catch (error) {
      console.error('Error assigning assessment:', error)
    }
  }

  const createCustomAssessment = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('custom_forms')
        .insert({
          therapist_id: profile!.id,
          title: formData.title,
          description: formData.description,
          questions: formData.questions
        })

      if (error) throw error

      setShowCreateForm(false)
      // Refresh data if needed
    } catch (error) {
      console.error('Error creating custom assessment:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'text-blue-600 bg-blue-100'
      case 'in_progress': return 'text-amber-600 bg-amber-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'overdue': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <Clock className="w-4 h-4" />
      case 'in_progress': return <ClipboardList className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'overdue': return <AlertCircle className="w-4 h-4" />
      default: return <ClipboardList className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredAssessments = assessmentLibrary.filter(assessment => {
    const matchesSearch = assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || assessment.category.toLowerCase() === categoryFilter.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const filteredAssigned = assignedAssessments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${assignment.client.first_name} ${assignment.client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const renderLibrary = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="depression">Depression</option>
              <option value="anxiety">Anxiety</option>
              <option value="trauma">Trauma</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assessment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssessments.map((assessment) => (
          <div key={assessment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{assessment.name}</h3>
                <p className="text-sm text-blue-600 font-medium">{assessment.abbreviation}</p>
              </div>
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {assessment.category}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{assessment.description}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{assessment.questions.length} questions</span>
              <span>Max score: {assessment.scoring_method.max_score}</span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setSelectedAssessment(assessment)
                  setShowAssignModal(true)
                }}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-1" />
                Assign
              </button>
              <button className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderAssigned = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search assigned assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assigned Assessments Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-hidden">
          {filteredAssigned.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assigned assessments</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by assigning assessments from the library.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assessment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssigned.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                        <div className="text-sm text-gray-500">Assigned {formatDate(assignment.assigned_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.client.first_name} {assignment.client.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{assignment.client.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(assignment.status)}
                            <span className="capitalize">{assignment.status.replace('_', ' ')}</span>
                          </div>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(assignment.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {assignment.score !== undefined ? assignment.score : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderCreateForm = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Brain className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Create Custom Assessment</h3>
      </div>
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-purple-900">AI-Assisted Form Builder</span>
        </div>
        <p className="text-purple-700 text-sm mt-2">
          Our AI can help you create evidence-based assessments tailored to your practice needs.
        </p>
        <button className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200">
          <Brain className="w-4 h-4 mr-1" />
          Generate with AI
        </button>
      </div>

      <div className="text-center py-12 text-gray-500">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Custom Form Builder</h3>
        <p className="text-gray-600">
          Advanced form builder with drag-and-drop interface coming soon.
        </p>
      </div>
    </div>
  )

  const renderReports = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="w-6 h-6 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-900">Assessment Reports & Analytics</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Completion Rate</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">87%</div>
          <div className="text-sm text-blue-700">This month</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Avg Response Time</span>
          </div>
          <div className="text-2xl font-bold text-green-600">2.3 days</div>
          <div className="text-sm text-green-700">Per assessment</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900">AI Insights</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">12</div>
          <div className="text-sm text-purple-700">Generated reports</div>
        </div>
      </div>

      <div className="text-center py-12 text-gray-500">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics Dashboard</h3>
        <p className="text-gray-600">
          Comprehensive reporting and analytics features coming soon.
        </p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assessment & Screening Tools</h2>
          <p className="text-gray-600">Manage psychometric assessments and screening tools</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Custom
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'library', name: 'Assessment Library', icon: ClipboardList },
            { id: 'assigned', name: 'Assigned Assessments', icon: Send },
            { id: 'create', name: 'Create Custom', icon: Plus },
            { id: 'reports', name: 'Reports & Analytics', icon: BarChart3 }
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
      {activeTab === 'library' && renderLibrary()}
      {activeTab === 'assigned' && renderAssigned()}
      {activeTab === 'create' && renderCreateForm()}
      {activeTab === 'reports' && renderReports()}

      {/* Assign Assessment Modal */}
      {showAssignModal && selectedAssessment && (
        <AssignAssessmentModal
          assessment={selectedAssessment}
          clients={clients}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedAssessment(null)
          }}
          onAssign={assignAssessment}
        />
      )}
    </div>
  )
}

// Assign Assessment Modal Component
interface AssignAssessmentModalProps {
  assessment: Assessment
  clients: any[]
  onClose: () => void
  onAssign: (assessmentId: string, clientIds: string[], dueDate: string, instructions: string) => void
}

const AssignAssessmentModal: React.FC<AssignAssessmentModalProps> = ({ 
  assessment, 
  clients, 
  onClose, 
  onAssign 
}) => {
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [instructions, setInstructions] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedClients.length > 0 && dueDate) {
      onAssign(assessment.id, selectedClients, dueDate, instructions)
    }
  }

  const toggleClient = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Assign Assessment: {assessment.name}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Clients
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                    {clients.map((client) => (
                      <label key={client.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(client.id)}
                          onChange={() => toggleClient(client.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {client.first_name} {client.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                    Instructions for Client
                  </label>
                  <textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={3}
                    placeholder="Optional instructions or context for the client..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={selectedClients.length === 0 || !dueDate}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign Assessment
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}