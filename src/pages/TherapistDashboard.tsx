import React, { useState, useEffect, useMemo } from 'react'
import { Layout } from '../components/Layout'
import { TherapistOnboarding } from '../components/therapist/TherapistOnboarding'
import { TherapistProfile } from '../components/therapist/TherapistProfile'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { 
  Users, 
  ClipboardList, 
  FileText, 
  Calendar, 
  BookOpen, 
  TrendingUp, 
  MessageSquare, 
  Shield, 
  Library, 
  BarChart3,
  Brain,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight
} from 'lucide-react'

// Lazy load components for better performance
const ClientManagement = React.lazy(() => import('../components/therapist/ClientManagement').then(m => ({ default: m.ClientManagement })))
const AssessmentTools = React.lazy(() => import('../components/therapist/AssessmentTools').then(m => ({ default: m.AssessmentTools })))
const TreatmentPlanning = React.lazy(() => import('../components/therapist/TreatmentPlanning').then(m => ({ default: m.TreatmentPlanning })))
const SessionManagement = React.lazy(() => import('../components/therapist/SessionManagement').then(m => ({ default: m.SessionManagement })))
const WorksheetManagement = React.lazy(() => import('../components/therapist/WorksheetManagement').then(m => ({ default: m.WorksheetManagement })))
const ProgressMonitoring = React.lazy(() => import('../components/therapist/ProgressMonitoring').then(m => ({ default: m.ProgressMonitoring })))
const CommunicationTools = React.lazy(() => import('../components/therapist/CommunicationTools').then(m => ({ default: m.CommunicationTools })))
const DocumentationCompliance = React.lazy(() => import('../components/therapist/DocumentationCompliance').then(m => ({ default: m.DocumentationCompliance })))
const ResourceLibrary = React.lazy(() => import('../components/therapist/ResourceLibrary').then(m => ({ default: m.ResourceLibrary })))
const PracticeManagement = React.lazy(() => import('../components/therapist/PracticeManagement').then(m => ({ default: m.PracticeManagement })))
const CaseFiles = React.lazy(() => import('../components/therapist/CaseFiles').then(m => ({ default: m.CaseFiles })))

interface DashboardStats {
  totalClients: number
  activeClients: number
  pendingAssessments: number
  completedAssessments: number
  upcomingAppointments: number
  overdueAssignments: number
}

export const TherapistDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    pendingAssessments: 0,
    completedAssessments: 0,
    upcomingAppointments: 0,
    overdueAssignments: 0
  })
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile && activeTab === 'overview') {
      fetchDashboardStats()
    }
  }, [profile])

  const fetchDashboardStats = async () => {
    if (!profile) return

    try {
      // Fetch all stats in parallel for better performance
      const [
        { data: clientRelations },
        { data: assessments },
        { data: appointments },
        { data: overdueAssignments }
      ] = await Promise.all([
        supabase
          .from('therapist_client_relations')
          .select('client_id')
          .eq('therapist_id', profile.id),
        supabase
          .from('form_assignments')
          .select('status')
          .eq('therapist_id', profile.id),
        supabase
          .from('appointments')
          .select('id')
          .eq('therapist_id', profile.id)
          .eq('status', 'scheduled')
          .gte('appointment_date', new Date().toISOString())
          .lte('appointment_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('form_assignments')
          .select('id')
          .eq('therapist_id', profile.id)
          .eq('status', 'assigned')
          .lt('due_date', new Date().toISOString().split('T')[0])
      ])

      const totalClients = clientRelations?.length || 0
      const pendingAssessments = assessments?.filter(a => a.status === 'assigned' || a.status === 'in_progress').length || 0
      const completedAssessments = assessments?.filter(a => a.status === 'completed').length || 0
      const upcomingAppointments = appointments?.length || 0

      setStats({
        totalClients,
        activeClients: totalClients, // For now, assume all clients are active
        pendingAssessments,
        completedAssessments,
        upcomingAppointments,
        overdueAssignments: overdueAssignments?.length || 0
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = useMemo(() => [
    { id: 'overview', name: 'Overview', icon: Target },
    { id: 'profile', name: 'My Profile', icon: User },
    { id: 'clients', name: 'Client Management', icon: Users },
    { id: 'cases', name: 'Case Files', icon: FileText },
    { id: 'assessments', name: 'Assessment Tools', icon: ClipboardList },
    { id: 'treatment', name: 'Treatment Planning', icon: Brain },
    { id: 'sessions', name: 'Session Management', icon: Calendar },
    { id: 'worksheets', name: 'Worksheets & Exercises', icon: BookOpen },
    { id: 'progress', name: 'Progress Monitoring', icon: TrendingUp },
    { id: 'communication', name: 'Communication', icon: MessageSquare },
    { id: 'documentation', name: 'Documentation', icon: FileText },
    { id: 'resources', name: 'Resource Library', icon: Library },
    { id: 'practice', name: 'Practice Management', icon: BarChart3 }
  ], [])

  const handleOnboardingComplete = (data: any) => {
    console.log('Onboarding completed:', data)
    setShowOnboarding(false)
    // Here you would typically save the data to your backend
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back, Dr. {profile?.first_name}!</h2>
            <p className="text-blue-100 text-lg">Managing care for {stats.totalClients} active clients</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
            <div className="text-blue-200">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Client-Focused Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalClients}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-3xl font-bold text-amber-600">{stats.pendingAssessments}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-3xl font-bold text-purple-600">{stats.upcomingAppointments}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Needs Attention</p>
              <p className="text-3xl font-bold text-red-600">{stats.overdueAssignments}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Priority Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Today's Priorities</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Updated just now</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="font-medium text-red-900">Urgent</h4>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-red-800">
                • {stats.overdueAssignments} overdue assessments
              </div>
              <div className="text-sm text-red-800">
                • Review high-risk client status
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="w-5 h-5 text-amber-600" />
              <h4 className="font-medium text-amber-900">Today's Schedule</h4>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-amber-800">
                • {stats.upcomingAppointments} appointments this week
              </div>
              <div className="text-sm text-amber-800">
                • Session notes to complete
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">Client Progress</h4>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-blue-800">
                • {stats.completedAssessments} assessments completed
              </div>
              <div className="text-sm text-blue-800">
                • Review progress reports
              </div>
            </div>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Grid */}
        {/* Quick Actions */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('clients')}
                className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  <span className="font-medium text-blue-900">Manage Clients</span>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => setShowOnboarding(true)}
                className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <User className="w-6 h-6 text-green-600" />
                  <span className="font-medium text-green-900">Complete Profile Setup</span>
                </div>
                <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => setActiveTab('assessments')}
                className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <ClipboardList className="w-6 h-6 text-purple-600" />
                  <span className="font-medium text-purple-900">Assign Assessment</span>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => setActiveTab('sessions')}
                className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="w-6 h-6 text-green-600" />
                  <span className="font-medium text-green-900">Schedule Session</span>
                </div>
                <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => setActiveTab('progress')}
                className="w-full flex items-center justify-between p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                  <span className="font-medium text-teal-900">View Progress</span>
                </div>
                <ChevronRight className="w-5 h-5 text-teal-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Client Activity */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Client Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">No recent activity</p>
                  <p className="text-xs text-gray-500">Start by adding clients</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Build your client roster</p>
                  <p className="text-xs text-gray-500">Add clients to get started</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Create session notes</p>
                  <p className="text-xs text-gray-500">Document your sessions</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Assign therapeutic exercises</p>
                  <p className="text-xs text-gray-500">Help clients with CBT tools</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Insights */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Client Insights</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Getting Started</span>
                </div>
                <p className="text-sm text-green-800">Complete your profile setup to start accepting clients</p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">Next Steps</span>
                </div>
                <p className="text-sm text-amber-800">Add your first client and begin your therapeutic practice</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Tools Available</span>
                </div>
                <p className="text-sm text-blue-800">CBT worksheets, assessments, and progress tracking ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowOnboarding(false)} />
            <div className="relative w-full max-w-6xl mx-4">
              <TherapistOnboarding onComplete={handleOnboardingComplete} />
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'profile':
        return <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Profile</h3>
          <p className="text-gray-600 mb-6">Set up your professional profile to start accepting clients.</p>
          <button
            onClick={() => setShowOnboarding(true)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <User className="w-5 h-5 mr-2" />
            Start Profile Setup
          </button>
        </div>
      case 'clients':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <ClientManagement />
          </React.Suspense>
        )
      case 'cases':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <CaseFiles />
          </React.Suspense>
        )
      case 'assessments':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <AssessmentTools />
          </React.Suspense>
        )
      case 'treatment':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <TreatmentPlanning />
          </React.Suspense>
        )
      case 'sessions':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <SessionManagement />
          </React.Suspense>
        )
      case 'worksheets':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <WorksheetManagement />
          </React.Suspense>
        )
      case 'progress':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <ProgressMonitoring />
          </React.Suspense>
        )
      case 'communication':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <CommunicationTools />
          </React.Suspense>
        )
      case 'documentation':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <DocumentationCompliance />
          </React.Suspense>
        )
      case 'resources':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <ResourceLibrary />
          </React.Suspense>
        )
      case 'practice':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <PracticeManagement />
          </React.Suspense>
        )
      default:
        return renderOverview()
    }
  }

  if (loading) {
    return (
      <Layout title="Therapist Dashboard">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Practice Management Dashboard">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </Layout>
  )
}