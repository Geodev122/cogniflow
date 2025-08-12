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
  TrendingUp,
  MessageSquare,
  Library,
  BarChart3,
  Brain,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Menu,
  X,
  User
} from 'lucide-react'
import { Navigate } from 'react-router-dom'

// Lazy load components for better performance
const ClientManagement = React.lazy(() => import('../components/therapist/ClientManagement').then(m => ({ default: m.ClientManagement })))
const CaseManagement = React.lazy(() => import('../components/therapist/CaseManagement').then(m => ({ default: m.CaseManagement })))
const SessionManagement = React.lazy(() => import('../components/therapist/SessionManagement').then(m => ({ default: m.SessionManagement })))
const CommunicationTools = React.lazy(() => import('../components/therapist/CommunicationTools').then(m => ({ default: m.CommunicationTools })))
const DocumentationCompliance = React.lazy(() => import('../components/therapist/DocumentationCompliance').then(m => ({ default: m.DocumentationCompliance })))
const ResourceLibrary = React.lazy(() => import('../components/therapist/ResourceLibrary').then(m => ({ default: m.ResourceLibrary })))
const PracticeManagement = React.lazy(() => import('../components/therapist/PracticeManagement').then(m => ({ default: m.PracticeManagement })))
const AssessmentTools = React.lazy(() => import('../components/therapist/AssessmentTools').then(m => ({ default: m.AssessmentTools })))

interface DashboardStats {
  totalClients: number
  activeClients: number
  pendingAssessments: number
  completedAssessments: number
  upcomingAppointments: number
  overdueAssignments: number
}

interface ActivityItem {
  id: string
  client_id: string
  client_first_name: string
  client_last_name: string
  type: string
  details: string | null
  created_at: string
}

export const TherapistDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    pendingAssessments: 0,
    completedAssessments: 0,
    upcomingAppointments: 0,
    overdueAssignments: 0
  })
  const [loading, setLoading] = useState(true)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [activity, setActivity] = useState<ActivityItem[] | null>(null)
  const { profile } = useAuth()

  useEffect(() => {
    if (!profile) return

    const fetchDashboardStats = async () => {
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

    const fetchRecentActivity = async () => {
      const { data, error } = await supabase.rpc('get_recent_activity', {
        therapist_id: profile.id,
        limit_count: 5
      })

      if (error) {
        console.error('Error fetching recent activity:', error)
        setActivity([])
        return
      }

      setActivity(data ?? [])
    }

    fetchDashboardStats()
    supabase.rpc('profile_completion', { id: profile.id }).then(({ data }) => {
      setProfileCompletion(data || 0)
    })
    fetchRecentActivity()
  }, [profile])

  const tabs = useMemo(() => [
    { id: 'overview', name: 'Overview', icon: Target },
    { id: 'clients', name: 'Client Management', icon: Users },
    { id: 'cases', name: 'Case Management', icon: FileText },
    { id: 'assessments', name: 'Assessments', icon: ClipboardList },
    { id: 'sessions', name: 'Session Management', icon: Calendar },
    { id: 'resources', name: 'Resource Library', icon: Library },
    { id: 'communication', name: 'Communication', icon: MessageSquare },
    { id: 'documentation', name: 'Documentation', icon: FileText },
    { id: 'practice', name: 'Practice Management', icon: BarChart3 },
    { id: 'profile', name: 'Profile', icon: User },
  ], [])

  if (profile && profile.role !== 'therapist') {
    return <Navigate to="/client" replace />
  }

  const handleOnboardingComplete = (data: unknown) => {
    console.log('Onboarding completed:', data)
    setShowOnboardingModal(false)
    if (profile) {
      supabase.rpc('profile_completion', { id: profile.id }).then(({ data }) => {
        setProfileCompletion(data || 0)
      })
    }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Profile Completion Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">TheraWay Profile Setup</h3>
              <p className="text-sm text-gray-600">Complete your profile to be listed on TheraWay directory</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-16 h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">{profileCompletion}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${profile?.whatsapp_number ? 'bg-green-500' : 'bg-gray-300'}`}>
              {profile?.whatsapp_number && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-sm ${profile?.whatsapp_number ? 'text-gray-700' : 'text-gray-500'}`}>Basic Information</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${profile?.professional_details ? 'bg-green-500' : 'bg-gray-300'}`}>
              {profile?.professional_details && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-sm ${profile?.professional_details ? 'text-gray-700' : 'text-gray-500'}`}>Professional Details</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${profile?.verification_status ? 'bg-green-500' : 'bg-gray-300'}`}>
              {profile?.verification_status && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-sm ${profile?.verification_status ? 'text-gray-700' : 'text-gray-500'}`}>Verification</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Complete your CogniFlow profile to automatically be listed on TheraWay and start attracting new clients
          </p>
          <button
            onClick={() => setShowOnboardingModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <User className="w-4 h-4 mr-2" />
            Complete Profile
          </button>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold mb-2">Welcome back, Dr. {profile?.first_name}!</h2>
            <p className="text-blue-100 text-sm sm:text-lg">Managing care for {stats.totalClients} active clients</p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-lg sm:text-2xl font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
            <div className="text-blue-200 text-sm">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Client-Focused Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalClients}</p>
            </div>
            <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
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
                onClick={() => setActiveTab('cases')}
                className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-green-600" />
                  <span className="font-medium text-green-900">Case Management</span>
                </div>
                <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => setActiveTab('resources')}
                className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Library className="w-6 h-6 text-purple-600" />
                  <span className="font-medium text-purple-900">Resource Library</span>
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
              {activity && activity.length === 0 ? (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">No recent activity</p>
                    <p className="text-xs text-gray-500">Start by adding clients</p>
                  </div>
                </div>
              ) : (
                activity?.map(item => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{item.details}</p>
                      <p className="text-xs text-gray-500">{`${item.client_first_name} ${item.client_last_name} • ${new Date(item.created_at).toLocaleString()}`}</p>
                    </div>
                  </div>
                ))
              )}
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
      {showOnboardingModal && (
        <TherapistOnboarding 
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboardingModal(false)}
        />
      )}
    </div>
  )

  // TODO: Replace mockTherapist with actual data from the database
  const mockTherapist = {
    id: profile?.id || '',
    fullName: `${profile?.first_name} ${profile?.last_name}`,
    profilePicture: '',
    whatsappNumber: '123-456-7890',
    email: profile?.email || '',
    specializations: ['Cognitive Behavioral Therapy (CBT)', 'Mindfulness-Based Cognitive Therapy (MBCT)'],
    languages: ['English', 'Spanish'],
    qualifications: 'Licensed Professional Counselor (LPC)',
    bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    introVideo: '',
    practiceLocations: [{ address: '123 Main St, Anytown USA', isPrimary: true }],
    verificationStatus: 'verified',
    membershipStatus: 'active',
    joinDate: '2023-01-01',
    stats: {
      totalClients: 10,
      yearsExperience: 5,
      rating: 4.8,
      reviewCount: 25,
      responseTime: '24 hours',
    },
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'clients':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <ClientManagement />
          </React.Suspense>
        )
      case 'cases':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <CaseManagement />
          </React.Suspense>
        )
      case 'assessments':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <AssessmentTools />
          </React.Suspense>
        )
      case 'resources':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <ResourceLibrary />
          </React.Suspense>
        )
      case 'sessions':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <SessionManagement />
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
      case 'practice':
        return (
          <React.Suspense fallback={<div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <PracticeManagement />
          </React.Suspense>
        )
      case 'profile':
        return (
          <TherapistProfile
            therapist={mockTherapist}
            isOwnProfile={true}
            onEdit={() => setShowOnboardingModal(true)}
          />
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
    <Layout title="Therapist Dashboard">
      <div className="space-y-6">
        {/* Mobile Menu Button */}
        <div className="sm:hidden flex items-center justify-end">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Navigation Tabs - Desktop */}
        <div className="hidden sm:block border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 lg:space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
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
                {tabs.slice(0, 8).map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setMobileMenuOpen(false)
                      }}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className={`text-xs font-medium block ${
                        isActive ? 'text-blue-900' : 'text-gray-700'
                      }`}>{tab.name.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
              {tabs.length > 8 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">Swipe left to see more options on desktop</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </Layout>
  )
}