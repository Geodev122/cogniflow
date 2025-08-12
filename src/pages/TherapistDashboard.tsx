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
  TrendingUp,
  Building,
  ChevronLeft
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

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.id)
        .single()

      if (error) {
        setProfileError(error.message)
        setTherapistProfile(null)
      } else {
        // Build therapist profile from database data
        const profileData: TherapistProfileData = {
          id: data.id,
          fullName: `${data.first_name} ${data.last_name}`,
          email: data.email,
          whatsappNumber: data.whatsapp_number || '',
          specializations: data.professional_details?.specializations || [],
          languages: data.professional_details?.languages || [],
          qualifications: data.professional_details?.qualifications || '',
          bio: data.professional_details?.bio || '',
          practiceLocations: data.professional_details?.practice_locations || [],
          verificationStatus: data.verification_status || 'pending',
          membershipStatus: 'pending', // This would come from a separate membership table
          joinDate: data.created_at,
          stats: {
            totalClients: stats.totalClients,
            yearsExperience: 0, // This would be calculated from professional_details
            rating: 0, // This would come from reviews
            reviewCount: 0,
            responseTime: 'N/A'
          }
        }
        setTherapistProfile(profileData)
      }
    } catch (error) {
      console.error('Error fetching therapist profile:', error)
      setProfileError('Failed to load profile')
    } finally {
      setProfileLoading(false)
    }
  }, [profile, stats.totalClients])

  // Calculate TheraWay profile completion based on onboarding steps
  const calculateProfileCompletion = useCallback(() => {
    if (!profile?.professional_details) {
      setProfileCompletion(0)
      return
    }

    let completed = 0
    const details = profile.professional_details

    // Step 1: Basic Info (name, profile picture, whatsapp)
    if (profile.first_name && profile.last_name && profile.whatsapp_number) {
      completed += 1
    }

    // Step 2: Expertise (specializations, languages, qualifications)
    if (details.specializations?.length > 0 && details.languages?.length > 0 && details.qualifications) {
      completed += 1
    }

    // Step 3: Story (bio with minimum length)
    if (details.bio && details.bio.length >= 150) {
      completed += 1
    }

    // Step 4: Practice Details (locations)
    if (details.practice_locations?.length > 0 && details.practice_locations.every((loc: any) => loc.address)) {
      completed += 1
    }

    // Step 5: Verification (licenses)
    if (details.licenses?.length > 0 && details.licenses.every((license: any) => license.name && license.country)) {
      completed += 1
    }

    // Step 6: Membership (verification status)
    if (profile.verification_status === 'verified') {
      completed += 1
    }

    const percentage = Math.round((completed / 6) * 100)
    setProfileCompletion(percentage)
  }, [profile])

  useEffect(() => {
    if (profile) {
      fetchDashboardStats()
      calculateProfileCompletion()
      fetchInsights()
      fetchTherapistProfile()
    }
  }, [profile, fetchDashboardStats, calculateProfileCompletion, fetchInsights, fetchTherapistProfile])

  const tabs = useMemo(() => [
    { id: 'overview', name: 'Overview', icon: Target },
    { id: 'clients', name: 'Client Management', icon: Users },
    { id: 'cases', name: 'Case Management', icon: FileText },
    { id: 'resources', name: 'Resource Library', icon: Library },
    { id: 'clinic-rental', name: 'Clinic Rental', icon: Building },
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
    calculateProfileCompletion()
  }

  const renderClinicRental = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Building className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2">Clinic Rental Network</h2>
            <p className="text-purple-100 text-lg">Find and book professional therapy spaces</p>
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building className="w-12 h-12 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h3>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            We're building a comprehensive clinic rental network to help therapists find professional spaces for their practice.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Flexible Booking</h4>
              <p className="text-gray-600 text-sm">Book therapy rooms by the hour, day, or month</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Verified Spaces</h4>
              <p className="text-gray-600 text-sm">All locations are professionally verified and equipped</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Prime Locations</h4>
              <p className="text-gray-600 text-sm">Convenient locations in major cities</p>
            </div>
          </div>

          {/* Waitlist Signup */}
          <div className="bg-gray-50 p-6 rounded-lg max-w-md mx-auto">
            <h4 className="font-semibold text-gray-900 mb-4">Join the Waitlist</h4>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                Notify Me When Available
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Be the first to know when clinic rental becomes available in your area
            </p>
          </div>
        </div>
      </div>
    </div>
  )

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
                className={`h-2 rounded-full transition-all duration-300 ${
                  profileCompletion === 100 ? 'bg-green-500' : 
                  profileCompletion >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">{profileCompletion}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              profile?.first_name && profile?.last_name && profile?.whatsapp_number ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {profile?.first_name && profile?.last_name && profile?.whatsapp_number && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-xs sm:text-sm ${
              profile?.first_name && profile?.last_name && profile?.whatsapp_number ? 'text-gray-700' : 'text-gray-500'
            }`}>Basic Info</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              profile?.professional_details?.specializations?.length > 0 && 
              profile?.professional_details?.languages?.length > 0 && 
              profile?.professional_details?.qualifications ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {profile?.professional_details?.specializations?.length > 0 && 
               profile?.professional_details?.languages?.length > 0 && 
               profile?.professional_details?.qualifications && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-xs sm:text-sm ${
              profile?.professional_details?.specializations?.length > 0 ? 'text-gray-700' : 'text-gray-500'
            }`}>Expertise</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              profile?.professional_details?.bio && profile?.professional_details.bio.length >= 150 ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {profile?.professional_details?.bio && profile?.professional_details.bio.length >= 150 && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-xs sm:text-sm ${
              profile?.professional_details?.bio && profile?.professional_details.bio.length >= 150 ? 'text-gray-700' : 'text-gray-500'
            }`}>Story</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              profile?.professional_details?.practice_locations?.length > 0 ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {profile?.professional_details?.practice_locations?.length > 0 && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-xs sm:text-sm ${
              profile?.professional_details?.practice_locations?.length > 0 ? 'text-gray-700' : 'text-gray-500'
            }`}>Practice</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              profile?.professional_details?.licenses?.length > 0 ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {profile?.professional_details?.licenses?.length > 0 && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-xs sm:text-sm ${
              profile?.professional_details?.licenses?.length > 0 ? 'text-gray-700' : 'text-gray-500'
            }`}>Verification</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
              profile?.verification_status === 'verified' ? 'bg-green-500' : 'bg-gray-300'
            }`}>
              {profile?.verification_status === 'verified' && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-xs sm:text-sm ${
              profile?.verification_status === 'verified' ? 'text-gray-700' : 'text-gray-500'
            }`}>Membership</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Complete your CogniFlow profile to automatically be listed on TheraWay and start attracting new clients
          </p>
          <button
            onClick={() => setShowOnboardingModal(true)}
            className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
              profileCompletion === 100 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <User className="w-4 h-4 mr-2" />
            {profileCompletion === 100 ? 'View Profile' : 'Complete Profile'}
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
      case 'clinic-rental':
        return renderClinicRental()
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">CogniFlow</h1>
                <p className="text-xs sm:text-sm text-gray-500">Therapist Portal</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">
                    {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <span>{profile?.first_name} {profile?.last_name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden fixed top-1/2 left-2 transform -translate-y-1/2 z-50 w-8 h-12 bg-white shadow-lg border border-gray-200 rounded-r-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
        >
          {mobileMenuOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Sidebar - Desktop & Tablet */}
        <div className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 h-16">
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
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
                    <span className="font-medium text-sm truncate">{tab.name}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Mobile Navigation Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 h-16">
                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}