import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  User,
  TrendingUp
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
const WorksheetManagement = React.lazy(() => import('../components/therapist/WorksheetManagement').then(m => ({ default: m.WorksheetManagement })))

interface DashboardStats {
  totalClients: number
  activeClients: number
  pendingAssessments: number
  completedAssessments: number
  upcomingAppointments: number
  overdueAssignments: number
}

interface Insight {
  title: string
  message: string
  severity: 'success' | 'warning' | 'info' | 'danger'
  icon: string
  count: number
}

interface TherapistProfileData {
  id: string
  fullName: string
  profilePicture?: string
  whatsappNumber: string
  email: string
  specializations: string[]
  languages: string[]
  qualifications: string
  bio: string
  introVideo?: string
  practiceLocations: Array<{
    address: string
    isPrimary: boolean
  }>
  verificationStatus: 'pending' | 'verified' | 'rejected'
  membershipStatus: 'active' | 'inactive' | 'pending'
  joinDate: string
  stats: {
    totalClients: number
    yearsExperience: number
    rating: number
    reviewCount: number
    responseTime: string
  }
}

export const TherapistDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
  const [insights, setInsights] = useState<Insight[]>([])
  const { profile } = useAuth()
  const [therapistProfile, setTherapistProfile] = useState<TherapistProfileData | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const iconMap = { ClipboardList, Clock }
  const severityStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-900',
      text: 'text-green-800',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      title: 'text-amber-900',
      text: 'text-amber-800',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      text: 'text-blue-800',
    },
    danger: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
      text: 'text-red-800',
    },
  }

  const fetchDashboardStats = useCallback(async () => {
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
  }, [profile])

  const fetchInsights = useCallback(async () => {
    if (!profile) return

    try {
      // Get insights from therapist_insights_metrics view
      const { data } = await supabase
        .from('therapist_insights_metrics')
        .select('*')
        .eq('therapist_id', profile.id)
        .single()
      
      const insights: Insight[] = []
      
      if (data?.overdue_assessments > 0) {
        insights.push({
          title: 'Overdue Assessments',
          message: `${data.overdue_assessments} assessments are overdue and need attention`,
          severity: 'warning',
          icon: 'ClipboardList',
          count: data.overdue_assessments
        })
      }
      
      if (data?.idle_clients > 0) {
        insights.push({
          title: 'Idle Clients',
          message: `${data.idle_clients} clients haven't had recent activity`,
          severity: 'info',
          icon: 'Clock',
          count: data.idle_clients
        })
      }
      
      setInsights(insights)
    } catch (error) {
      console.error('Error fetching insights:', error)
      setInsights([])
    }
  }, [profile])

  const fetchTherapistProfile = useCallback(async () => {
    if (!profile) return

    setProfileLoading(true)
    setProfileError(null)

    const { data, error } = await supabase.rpc('get_therapist_profile', { p_user_id: profile.id })

    if (error) {
      setProfileError(error.message)
      setTherapistProfile(null)
    } else {
      // Ensure stats object exists with default values
      const profileData = data as TherapistProfileData
      if (profileData) {
        // Ensure all required properties have default values
        profileData.stats = profileData.stats || {
          totalClients: 0,
          yearsExperience: 0,
          rating: 0,
          reviewCount: 0,
          responseTime: 'N/A'
        }
        
        // Ensure array properties are initialized
        profileData.specializations = profileData.specializations || []
        profileData.languages = profileData.languages || []
        profileData.practiceLocations = profileData.practiceLocations || []
        
        // Ensure string properties are initialized
        profileData.fullName = profileData.fullName || ''
        profileData.whatsappNumber = profileData.whatsappNumber || ''
        profileData.email = profileData.email || ''
        profileData.qualifications = profileData.qualifications || ''
        profileData.bio = profileData.bio || ''
        profileData.joinDate = profileData.joinDate || ''
        profileData.verificationStatus = profileData.verificationStatus || 'pending'
        profileData.membershipStatus = profileData.membershipStatus || 'pending'
      }
      setTherapistProfile(profileData)
    }

    setProfileLoading(false)
  }, [profile])

  useEffect(() => {
    if (profile) {
      fetchDashboardStats()
      // Calculate profile completion based on available data
      let completion = 0
      if (profile.whatsapp_number) completion += 33
      if (profile.professional_details) completion += 33
      if (profile.verification_status) completion += 34
      setProfileCompletion(completion)
      fetchInsights()
      fetchTherapistProfile()
    }
  }, [profile, fetchDashboardStats, fetchInsights, fetchTherapistProfile])

  const tabs = useMemo(() => [
    { id: 'overview', name: 'Overview', icon: Target },
    { id: 'clients', name: 'Client Management', icon: Users },
    { id: 'cases', name: 'Case Management', icon: FileText },
    { id: 'resources', name: 'Resource Library', icon: Library },
    { id: 'sessions', name: 'Session Management', icon: Calendar },
    { id: 'communication', name: 'Communication', icon: MessageSquare },
    { id: 'documentation', name: 'Documentation', icon: FileText },
    { id: 'practice', name: 'Practice Management', icon: BarChart3 },
  ], [])

  if (profile && profile.role !== 'therapist') {
    return <Navigate to="/client" replace />
  }

  const handleOnboardingComplete = (data: unknown) => {
    console.log('Onboarding completed:', data)
    setShowOnboardingModal(false)
    if (profile) {
      // Calculate profile completion based on available data
      let completion = 0
      if (profile.whatsapp_number) completion += 33
      if (profile.professional_details) completion += 33
      if (profile.verification_status) completion += 34
      setProfileCompletion(completion)
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
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight, idx) => {
                  const Icon = iconMap[insight.icon as keyof typeof iconMap] || Target
                  const styles = severityStyles[insight.severity] || severityStyles.info
                  return (
                    <div key={idx} className={`${styles.bg} border ${styles.border} rounded-lg p-4`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Icon className={`w-4 h-4 ${styles.icon}`} />
                        <span className={`text-sm font-medium ${styles.title}`}>{insight.title}</span>
                      </div>
                      <p className={`text-sm ${styles.text}`}>{insight.message}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No insights available</p>
            )}
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
      default:
        return renderOverview()
    }
  }

  return (
    <Layout>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar - Desktop */}
        <div className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!sidebarCollapsed && (
              <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              ) : (
                <Menu className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={sidebarCollapsed ? tab.name : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  {!sidebarCollapsed && (
                    <span className="font-medium text-sm">{tab.name}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <nav className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setMobileMenuOpen(false)
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className="font-medium text-sm">{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </Layout>
  )
}