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
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Users
} from 'lucide-react'

interface Assessment {
  id: number
  name: string
  abbreviation: string
  category: string
  description: string | null
  questions: any
  scoring_method: any
  interpretation_guide: any
}

interface AssignedAssessment {
  id: string
  client_id: string
  title: string
  status: string
  due_date: string | null
  assigned_at: string | null
  completed_at: string | null
  client: {
    first_name: string
    last_name: string
    email: string
  }
}

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
}

export const AssessmentTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'library' | 'assigned' | 'reports'>('library')
  const [assessmentLibrary, setAssessmentLibrary] = useState<Assessment[]>([])
  const [assignedAssessments, setAssignedAssessments] = useState<AssignedAssessment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile?.id) {
      fetchData()
    }
  }, [profile?.id])

  const fetchData = async () => {
    if (!profile?.id) return

    setLoading(true)
    setError(null)

    try {
      // Fetch assessment library
      const { data: assessments, error: assessmentError } = await supabase
        .from('assessment_library')
        .select('*')
        .order('category', { ascending: true })

      if (assessmentError) {
        console.error('Error fetching assessments:', assessmentError)
        setAssessmentLibrary([])
      } else {
        setAssessmentLibrary(assessments || [])
      }

      // Fetch assigned assessments
      const { data: assigned, error: assignedError } = await supabase
        .from('form_assignments')
        .select(`
          id,
          client_id,
          title,
          status,
          due_date,
          assigned_at,
          completed_at,
          profiles!form_assignments_client_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .eq('therapist_id', profile.id)
        .eq('form_type', 'psychometric')
        .order('assigned_at', { ascending: false })

      if (assignedError) {
        console.error('Error fetching assigned assessments:', assignedError)
        setAssignedAssessments([])
      } else {
        const assignmentsWithClient = (assigned || []).map(assignment => ({
          ...assignment,
          client: assignment.profiles
        }))
        setAssignedAssessments(assignmentsWithClient)
      }

      // Fetch clients
      const { data: clientRelations, error: clientError } = await supabase
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

      if (clientError) {
        console.error('Error fetching clients:', clientError)
        setClients([])
      } else {
        const clientList = (clientRelations || [])
          .map(relation => relation.profiles)
          .filter(Boolean)
        setClients(clientList)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load assessment data')
    } finally {
      setLoading(false)
    }
  }

  const assignAssessment = async (assessmentId: string, clientIds: string[], dueDate: string, instructions: string) => {
    try {
      const assessment = assessmentLibrary.find(a => a.id.toString() === assessmentId)
      if (!assessment) return

      const assignments = clientIds.map(clientId => ({
        therapist_id: profile!.id,
        client_id: clientId,
        form_type: 'psychometric',
        form_id: assessment.id.toString(),
        title: assessment.name,
        instructions,
        due_date: dueDate,
        status: 'assigned'
      }))

      const { error } = await supabase
        .from('form_assignments')
        .insert(assignments)

      if (error) throw error

      await fetchData()
      setShowAssignModal(false)
      setSelectedAssessment(null)
    } catch (error) {
      console.error('Error assigning assessment:', error)
      alert('Error assigning assessment')
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredAssessments = assessmentLibrary.filter(assessment => {
    const matchesSearch = assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (assessment.description || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
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
              <option value="Depression">Depression</option>
              <option value="Anxiety">Anxiety</option>
              <option value="Trauma">Trauma</option>
              <option value="General">General</option>
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
                <h3 className="font-semibold text-gray-900 line-clamp-2">{assessment.name}</h3>
                <p className="text-sm text-blue-600 font-medium">{assessment.abbreviation}</p>
              </div>
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {assessment.category}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{assessment.description}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{assessment.questions?.length || 0} questions</span>
              <span>Max: {assessment.scoring_method?.max_score || 'N/A'}</span>
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

      {filteredAssessments.length === 0 && (
        <div className="text-center py-12">
          <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assessments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
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

      {/* Assigned Assessments List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        {filteredAssigned.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assigned assessments</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by assigning assessments from the library.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAssigned.map((assignment) => (
              <div key={assignment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(assignment.status)}
                          <span className="capitalize">{assignment.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{assignment.title}</h4>
                      <p className="text-sm text-gray-500">
                        {assignment.client.first_name} {assignment.client.last_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Assigned: {formatDate(assignment.assigned_at)} • Due: {formatDate(assignment.due_date)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-900">Completion Rate</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {assignedAssessments.length > 0 
              ? Math.round((assignedAssessments.filter(a => a.status === 'completed').length / assignedAssessments.length) * 100)
              : 0
            }%
          </div>
          <div className="text-sm text-blue-700">Overall</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Active Clients</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{clients.length}</div>
          <div className="text-sm text-green-700">In roster</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-900">Assessments</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{assessmentLibrary.length}</div>
          <div className="text-sm text-purple-700">Available tools</div>
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
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'library', name: 'Assessment Library', icon: ClipboardList },
            { id: 'assigned', name: 'Assigned Assessments', icon: Send },
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
  clients: Client[]
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
      onAssign(assessment.id.toString(), selectedClients, dueDate, instructions)
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
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Assign: {assessment.name}
                </h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Clients</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={3}
                    placeholder="Optional instructions for the client..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={selectedClients.length === 0 || !dueDate}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Assign Assessment
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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