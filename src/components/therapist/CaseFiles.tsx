import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { 
  FileText, 
  User, 
  Calendar, 
  TrendingUp, 
  ClipboardList, 
  Plus,
  Search,
  Filter,
  Eye,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Brain,
  Target,
  Activity,
  BookOpen,
  Award,
  MessageSquare
} from 'lucide-react'
import { PsychometricAssessmentModal } from './PsychometricAssessmentModal'

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
}

interface CaseFile {
  client: Client
  sessionCount: number
  lastSession?: string
  nextAppointment?: string
  assessments: Assessment[]
  riskLevel: string
  progressSummary: string
}

interface Assessment {
  id: string
  assessment_name: string
  score: number
  max_score: number
  date: string
  interpretation: string
  narrative_report: string
}

export const CaseFiles: React.FC = () => {
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([])
  const [selectedCase, setSelectedCase] = useState<CaseFile | null>(null)
  const [showAssessmentModal, setShowAssessmentModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile) {
      fetchCaseFiles()
    }
  }, [profile])

  const fetchCaseFiles = async () => {
    if (!profile) return

    try {
      // Simplified case files fetching
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
        console.error('Error fetching case files:', error)
        setCaseFiles([])
        return
      }

      // Basic case files without complex nested queries
      const cases = (relations || []).map((relation: any) => ({
        client: relation.profiles,
        sessionCount: 0,
        lastSession: undefined,
        nextAppointment: undefined,
        assessments: [],
        riskLevel: 'low',
        progressSummary: 'No progress notes available'
      }))

      setCaseFiles(cases)
    } catch (error) {
      console.error('Error fetching case files:', error)
      setCaseFiles([])
    } finally {
      setLoading(false)
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleAssessmentComplete = async (assessmentData: any) => {
    try {
      const { error } = await supabase
        .from('assessment_reports')
        .insert({
          client_id: selectedCase!.client.id,
          therapist_id: profile!.id,
          report_type: 'psychometric',
          title: assessmentData.name,
          content: {
            score: assessmentData.score,
            max_score: assessmentData.maxScore,
            interpretation: assessmentData.interpretation,
            narrative_report: assessmentData.narrativeReport,
            responses: assessmentData.responses
          },
          generated_by: 'therapist'
        })

      if (error) throw error

      await fetchCaseFiles()
      setShowAssessmentModal(false)
    } catch (error) {
      console.error('Error saving assessment:', error)
    }
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
              ← Back to Case Files
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
            <button
              onClick={() => setShowAssessmentModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Assessment
            </button>
          </div>
        </div>

        {/* Case Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{selectedCase.sessionCount}</p>
                <p className="text-sm text-gray-600">Total Sessions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <ClipboardList className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{selectedCase.assessments.length}</p>
                <p className="text-sm text-gray-600">Assessments</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-bold text-gray-900">{formatDate(selectedCase.lastSession)}</p>
                <p className="text-sm text-gray-600">Last Session</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm font-bold text-gray-900">{formatDate(selectedCase.nextAppointment)}</p>
                <p className="text-sm text-gray-600">Next Session</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
            Progress Summary
          </h3>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700">{selectedCase.progressSummary}</p>
          </div>
        </div>

        {/* Assessment History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
              Assessment History
            </h3>
          </div>
          <div className="p-6">
            {selectedCase.assessments.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No assessments yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start by adding a psychometric assessment for this client.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedCase.assessments.map((assessment) => (
                  <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{assessment.assessment_name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Score: {assessment.score}/{assessment.max_score} • {formatDate(assessment.date)}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">{assessment.interpretation}</p>
                        {assessment.narrative_report && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">{assessment.narrative_report}</p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {Math.round((assessment.score / assessment.max_score) * 100)}%
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assessment Modal */}
        {showAssessmentModal && (
          <PsychometricAssessmentModal
            onClose={() => setShowAssessmentModal(false)}
            onComplete={handleAssessmentComplete}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Case Files</h2>
          <p className="text-gray-600">Comprehensive case management and assessment tracking</p>
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

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{caseFile.sessionCount}</div>
                <div className="text-xs text-gray-600">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{caseFile.assessments.length}</div>
                <div className="text-xs text-gray-600">Assessments</div>
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
              View Case File
            </button>
          </div>
        ))}
      </div>

      {filteredCases.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No case files found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || riskFilter !== 'all' 
              ? 'Try adjusting your search or filters.'
              : 'Add clients to your roster to create case files.'
            }
          </p>
        </div>
      )}
    </div>
  )
}