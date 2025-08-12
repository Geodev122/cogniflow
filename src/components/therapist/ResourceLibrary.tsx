import React, { useState } from 'react'
import { AssessmentTools } from './AssessmentTools'
import { WorksheetManagement } from './WorksheetManagement'
import { 
  Library, 
  ClipboardList, 
  Brain, 
  BookOpen, 
  Search, 
  Filter, 
  Eye, 
  Send, 
  GraduationCap,
  FileText,
  Video,
  Headphones,
  Download,
  Star,
  Clock,
  Users,
  Target,
  Award,
  Lightbulb,
  Gamepad2
} from 'lucide-react'

interface Resource {
  id: string
  title: string
  type: 'assessment' | 'treatment_plan' | 'worksheet' | 'exercise' | 'article' | 'video' | 'audio'
  category: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration?: string
  rating: number
  usageCount: number
  evidenceBased: boolean
  tags: string[]
}

const MOCK_RESOURCES: Resource[] = [
  // Assessment Tools
  {
    id: 'phq9',
    title: 'Patient Health Questionnaire (PHQ-9)',
    type: 'assessment',
    category: 'Depression Screening',
    description: 'Validated 9-item depression screening tool for clinical assessment',
    difficulty: 'beginner',
    duration: '5 min',
    rating: 4.8,
    usageCount: 1250,
    evidenceBased: true,
    tags: ['depression', 'screening', 'validated', 'DSM-5']
  },
  {
    id: 'gad7',
    title: 'Generalized Anxiety Disorder Scale (GAD-7)',
    type: 'assessment',
    category: 'Anxiety Screening',
    description: 'Brief 7-item anxiety screening questionnaire',
    difficulty: 'beginner',
    duration: '3 min',
    rating: 4.7,
    usageCount: 980,
    evidenceBased: true,
    tags: ['anxiety', 'screening', 'validated']
  },
  {
    id: 'beck-depression',
    title: 'Beck Depression Inventory (BDI-II)',
    type: 'assessment',
    category: 'Depression Assessment',
    description: 'Comprehensive 21-item depression assessment tool',
    difficulty: 'intermediate',
    duration: '10 min',
    rating: 4.9,
    usageCount: 750,
    evidenceBased: true,
    tags: ['depression', 'comprehensive', 'validated']
  },

  // Treatment Plans
  {
    id: 'cbt-depression',
    title: 'CBT Protocol for Depression',
    type: 'treatment_plan',
    category: 'Depression Treatment',
    description: 'Evidence-based 12-week CBT treatment protocol for major depression',
    difficulty: 'intermediate',
    duration: '12 weeks',
    rating: 4.6,
    usageCount: 420,
    evidenceBased: true,
    tags: ['CBT', 'depression', 'protocol', 'structured']
  },
  {
    id: 'anxiety-treatment',
    title: 'Anxiety Disorders Treatment Framework',
    type: 'treatment_plan',
    category: 'Anxiety Treatment',
    description: 'Comprehensive treatment approach for various anxiety disorders',
    difficulty: 'advanced',
    duration: '16 weeks',
    rating: 4.5,
    usageCount: 320,
    evidenceBased: true,
    tags: ['anxiety', 'comprehensive', 'multi-modal']
  },

  // Worksheets
  {
    id: 'thought-record',
    title: 'CBT Thought Record Worksheet',
    type: 'worksheet',
    category: 'Cognitive Restructuring',
    description: 'Classic thought challenging worksheet for identifying and restructuring negative thoughts',
    difficulty: 'beginner',
    duration: '15 min',
    rating: 4.7,
    usageCount: 2100,
    evidenceBased: true,
    tags: ['CBT', 'thoughts', 'cognitive', 'homework']
  },
  {
    id: 'mood-tracker',
    title: 'Daily Mood Tracking Sheet',
    type: 'worksheet',
    category: 'Mood Monitoring',
    description: 'Simple daily mood tracking tool with triggers and coping strategies',
    difficulty: 'beginner',
    duration: '5 min daily',
    rating: 4.4,
    usageCount: 1800,
    evidenceBased: false,
    tags: ['mood', 'tracking', 'daily', 'self-monitoring']
  },

  // Educational Content
  {
    id: 'cbt-basics',
    title: 'Introduction to CBT Principles',
    type: 'article',
    category: 'Educational',
    description: 'Comprehensive guide to cognitive behavioral therapy fundamentals',
    difficulty: 'beginner',
    duration: '20 min read',
    rating: 4.6,
    usageCount: 890,
    evidenceBased: true,
    tags: ['CBT', 'education', 'fundamentals', 'theory']
  },
  {
    id: 'mindfulness-video',
    title: 'Mindfulness-Based Interventions',
    type: 'video',
    category: 'Mindfulness',
    description: 'Video series on implementing mindfulness techniques in therapy',
    difficulty: 'intermediate',
    duration: '45 min',
    rating: 4.8,
    usageCount: 650,
    evidenceBased: true,
    tags: ['mindfulness', 'video', 'techniques', 'meditation']
  }
]

export const ResourceLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'assessments' | 'treatments' | 'worksheets' | 'psychoeducation' | 'exercises'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [evidenceFilter, setEvidenceFilter] = useState('all')
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)

  const filteredResources = MOCK_RESOURCES.filter(resource => {
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'assessments' && resource.type === 'assessment') ||
      (activeTab === 'treatments' && resource.type === 'treatment_plan') ||
      (activeTab === 'worksheets' && resource.type === 'worksheet') ||
      (activeTab === 'psychoeducation' && ['article', 'video', 'audio'].includes(resource.type)) ||
      (activeTab === 'exercises' && resource.type === 'exercise')

    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === 'all' || resource.category === categoryFilter
    const matchesDifficulty = difficultyFilter === 'all' || resource.difficulty === difficultyFilter
    const matchesEvidence = evidenceFilter === 'all' || 
      (evidenceFilter === 'evidence-based' && resource.evidenceBased) ||
      (evidenceFilter === 'clinical' && !resource.evidenceBased)

    return matchesTab && matchesSearch && matchesCategory && matchesDifficulty && matchesEvidence
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assessment': return <ClipboardList className="w-5 h-5" />
      case 'treatment_plan': return <Brain className="w-5 h-5" />
      case 'worksheet': return <FileText className="w-5 h-5" />
      case 'article': return <BookOpen className="w-5 h-5" />
      case 'video': return <Video className="w-5 h-5" />
      case 'audio': return <Headphones className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'assessment': return 'text-blue-600 bg-blue-100'
      case 'treatment_plan': return 'text-purple-600 bg-purple-100'
      case 'worksheet': return 'text-green-600 bg-green-100'
      case 'article': return 'text-orange-600 bg-orange-100'
      case 'video': return 'text-red-600 bg-red-100'
      case 'audio': return 'text-indigo-600 bg-indigo-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resource Library</h2>
          <p className="text-gray-600">Evidence-based tools, assessments, and treatment resources</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', name: 'All Resources', icon: Library },
            { id: 'assessments', name: 'Assessments', icon: ClipboardList },
            { id: 'worksheets', name: 'Worksheets', icon: FileText },
            { id: 'exercises', name: 'Exercises', icon: Gamepad2 },
            { id: 'treatments', name: 'Treatments', icon: Brain },
            { id: 'psychoeducation', name: 'Psychoeducation', icon: GraduationCap }
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
      {activeTab === 'assessments' && (
        <AssessmentTools />
      )}
      
      {activeTab === 'worksheets' && (
        <WorksheetManagement />
      )}
      
      {activeTab === 'exercises' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12 text-gray-500">
            <Gamepad2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Therapeutic Exercises</h3>
            <p className="text-gray-600">
              Interactive therapeutic exercises and games coming soon.
            </p>
          </div>
        </div>
      )}
      
      {(activeTab === 'all' || activeTab === 'treatments' || activeTab === 'psychoeducation') && (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Depression Screening">Depression Screening</option>
                <option value="Anxiety Screening">Anxiety Screening</option>
                <option value="Cognitive Restructuring">Cognitive Restructuring</option>
                <option value="Educational">Educational</option>
                <option value="Depression Treatment">Depression Treatment</option>
                <option value="Anxiety Treatment">Anxiety Treatment</option>
                <option value="Mood Monitoring">Mood Monitoring</option>
                <option value="Mindfulness">Mindfulness</option>
              </select>
              
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              
              <select
                value={evidenceFilter}
                onChange={(e) => setEvidenceFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="evidence-based">Evidence-Based</option>
                <option value="clinical">Clinical Practice</option>
              </select>
            </div>
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${getTypeColor(resource.type)}`}>
                      {getTypeIcon(resource.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{resource.title}</h3>
                      <p className="text-xs text-gray-600">{resource.category}</p>
                    </div>
                  </div>
                  {resource.evidenceBased && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Award className="w-4 h-4" />
                      <span className="text-xs">Evidence-Based</span>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{resource.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(resource.difficulty)}`}>
                      {resource.difficulty}
                    </span>
                    {resource.duration && (
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">{resource.duration}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Users className="w-3 h-3" />
                    <span className="text-xs">{resource.usageCount}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  {renderStarRating(resource.rating)}
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {resource.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {tag}
                    </span>
                  ))}
                  {resource.tags.length > 3 && (
                    <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{resource.tags.length - 3}
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedResource(resource)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      setSelectedResource(resource)
                      setShowAssignModal(true)
                    }}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <Library className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search terms or filters.
              </p>
            </div>
          )}
        </>
      )}

      {/* Resource Preview Modal */}
      {selectedResource && !showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedResource(null)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">{selectedResource.title}</h3>
                  <button
                    onClick={() => setSelectedResource(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${getTypeColor(selectedResource.type)}`}>
                      {getTypeIcon(selectedResource.type)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{selectedResource.category}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(selectedResource.difficulty)}`}>
                          {selectedResource.difficulty}
                        </span>
                        {selectedResource.evidenceBased && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Evidence-Based
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700">{selectedResource.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Duration</p>
                      <p className="text-sm text-gray-600">{selectedResource.duration || 'Variable'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Usage</p>
                      <p className="text-sm text-gray-600">{selectedResource.usageCount} therapists</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedResource.tags.map((tag, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Assign to Client
                </button>
                <button
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedResource && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAssignModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Assign: {selectedResource.title}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Client
                    </label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Select a client...</option>
                      <option>John Doe</option>
                      <option>Jane Smith</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instructions (Optional)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add any specific instructions for the client..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedResource(null)
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Assign Resource
                </button>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}