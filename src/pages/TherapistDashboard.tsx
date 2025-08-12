import React, { useState, useEffect } from 'react'
import { TherapistOnboarding } from '../components/therapist/TherapistOnboarding'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Users,
  FileText,
  Calendar,
  MessageSquare,
  BarChart3,
  Brain,
  Target,
  Clock,
  CheckCircle,
  ChevronRight,
  X,
  User,
  Building,
  ChevronLeft,
  LifeBuoy,
  UserCheck
} from 'lucide-react'
import { Navigate } from 'react-router-dom'

// Lazy load components for better performance
const ClientManagement = React.lazy(() => import('../components/therapist/ClientManagement').then(m => ({ default: m.ClientManagement })))
const CaseManagement = React.lazy(() => import('../components/therapist/CaseManagement').then(m => ({ default: m.CaseManagement })))
const SessionManagement = React.lazy(() => import('../components/therapist/SessionManagement').then(m => ({ default: m.SessionManagement })))
const CommunicationTools = React.lazy(() => import('../components/therapist/CommunicationTools').then(m => ({ default: m.CommunicationTools })))
const DocumentationCompliance = React.lazy(() => import('../components/therapist/DocumentationCompliance').then(m => ({ default: m.DocumentationCompliance })))
const PracticeManagement = React.lazy(() => import('../components/therapist/PracticeManagement').then(m => ({ default: m.PracticeManagement })))

interface DashboardStats {
  totalClients: number
  pendingAssessments: number
  completedAssessments: number
  upcomingAppointments: number
}

export const TherapistDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    pendingAssessments: 0,
    completedAssessments: 0,
    upcomingAppointments: 0
  })
  const [loading, setLoading] = useState(true)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const { profile } = useAuth()

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Target, group: 'overview', color: 'blue' },
    { id: 'clients', name: 'Client Management', icon: Users, group: 'client-care', color: 'green' },
    { id: 'cases', name: 'Case Management', icon: FileText, group: 'client-care', color: 'green' },
    { id: 'sessions', name: 'Session Management', icon: Calendar, group: 'client-care', color: 'green' },
    { id: 'communication', name: 'Communication', icon: MessageSquare, group: 'communication', color: 'orange' },
    { id: 'archive', name: 'Archive', icon: FileText, group: 'communication', color: 'orange' },
    { id: 'clinic-rental', name: 'Clinic Rental', icon: Building, group: 'operations', color: 'teal' },
    { id: 'practice', name: 'Practice Management', icon: BarChart3, group: 'operations', color: 'indigo' },
    { id: 'supervision', name: 'Supervision', icon: UserCheck, group: 'operations', color: 'indigo' },
    { id: 'support', name: 'Contact Support', icon: LifeBuoy, group: 'support', color: 'red' },
  ]

  const tabColors: Record<string, { text: string; border: string; bg: string }> = {
    blue: { text: 'text-blue-600', border: 'border-blue-500', bg: 'bg-blue-50' },
    green: { text: 'text-green-600', border: 'border-green-500', bg: 'bg-green-50' },
    orange: { text: 'text-orange-600', border: 'border-orange-500', bg: 'bg-orange-50' },
    teal: { text: 'text-teal-600', border: 'border-teal-500', bg: 'bg-teal-50' },
    indigo: { text: 'text-indigo-600', border: 'border-indigo-500', bg: 'bg-indigo-50' },
    red: { text: 'text-red-600', border: 'border-red-500', bg: 'bg-red-50' }
  }

  const groupOrder = ['overview', 'client-care', 'communication', 'operations', 'support']

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardStats()
      calculateProfileCompletion()
    }
  }, [profile?.id])

  const fetchDashboardStats = async () => {
    if (!profile?.id) return

    try {
      // Simple client count query
      const { data: clientRelations, error } = await supabase
        .from('therapist_client_relations')
        .select('client_id')
        .eq('therapist_id', profile.id)

      if (error) {
        console.error('Error fetching clients:', error)
        setStats({
          totalClients: 0,
          pendingAssessments: 0,
          completedAssessments: 0,
          upcomingAppointments: 0
        })
        return
      }

      const totalClients = clientRelations?.length || 0

      setStats({
        totalClients,
        pendingAssessments: 0,
        completedAssessments: 0,
        upcomingAppointments: 0
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setStats({
        totalClients: 0,
        pendingAssessments: 0,
        completedAssessments: 0,
        upcomingAppointments: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateProfileCompletion = () => {
    if (!profile?.professional_details) {
      setProfileCompletion(0)
      return
    }

    let completed = 0
    const details = profile.professional_details

    // Step 1: Basic Info
    if (profile.first_name && profile.last_name && profile.whatsapp_number) {
      completed += 1
    }

    // Step 2: Expertise
    if (details.specializations?.length > 0 && details.languages?.length > 0 && details.qualifications) {
      completed += 1
    }

    // Step 3: Story
    if (details.bio && details.bio.length >= 150) {
      completed += 1
    }

    // Step 4: Practice Details
    if (details.practice_locations?.length > 0) {
      completed += 1
    }

    // Step 5: Verification
    if (details.licenses?.length > 0) {
      completed += 1
    }

    // Step 6: Membership
    if (profile.verification_status === 'verified') {
      completed += 1
    }

    setProfileCompletion(Math.round((completed / 6) * 100))
  }

  if (profile && profile.role !== 'therapist') {
    return <Navigate to="/client" replace />
  }

  const handleOnboardingComplete = () => {
    setShowOnboardingModal(false)
    calculateProfileCompletion()
  }

  const renderClinicRental = () => (
    <div className="space-y-6">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building className="w-12 h-12 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon</h3>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            We're building a comprehensive clinic rental network to help therapists find professional spaces for their practice.
          </p>
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

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Complete your profile to be listed on TheraWay and start attracting new clients
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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back, Dr. {profile?.first_name}!</h2>
            <p className="text-blue-100 text-lg">Managing care for {stats.totalClients} active clients</p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
            <div className="text-blue-200">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Client-Focused Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
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
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats.completedAssessments}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
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
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Assign assessments</p>
                  <p className="text-xs text-gray-500">Use evidence-based tools</p>
                </div>
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
      case 'archive':
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
        case 'supervision':
          return (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Supervision</h2>
              <p className="text-gray-600">Supervision tools are coming soon.</p>
            </div>
          )
        case 'support':
          return (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Contact Support</h2>
              <p className="text-gray-600">Need help? Reach out to our support team.</p>
            </div>
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
                <h1 className="text-xl font-semibold text-gray-900">CogniFlow</h1>
                <p className="text-sm text-gray-500">Therapist Portal</p>
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

        {/* Sidebar - Desktop */}
        <div className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
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

            <nav className="flex-1 p-4 overflow-y-auto">
              {groupOrder.map((group) => {
                const groupTabs = tabs.filter((t) => t.group === group)
                if (groupTabs.length === 0) return null

                return (
                  <div
                    key={group}
                    className={`${group !== 'overview' ? 'mt-4 pt-4 border-t border-gray-200' : ''} space-y-1`}
                  >
                    {groupTabs.map((tab) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      const colors = tabColors[tab.color]

                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all border-l-4 ${
                            colors.border
                          } ${
                            isActive
                              ? `${colors.bg} ${colors.text}`
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          title={sidebarCollapsed ? tab.name : undefined}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${colors.text}`} />
                          {!sidebarCollapsed && (
                            <span className="font-medium text-sm truncate">{tab.name}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
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
                  {groupOrder.map((group) => {
                    const groupTabs = tabs.filter((t) => t.group === group)
                    if (groupTabs.length === 0) return null

                    return (
                      <div
                        key={group}
                        className={`${group !== 'overview' ? 'mt-4 pt-4 border-t border-gray-200' : ''} space-y-1`}
                      >
                        {groupTabs.map((tab) => {
                          const Icon = tab.icon
                          const isActive = activeTab === tab.id
                          const colors = tabColors[tab.color]

                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setActiveTab(tab.id)
                                setMobileMenuOpen(false)
                              }}
                              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all border-l-4 ${
                                colors.border
                              } ${
                                isActive
                                  ? `${colors.bg} ${colors.text}`
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700'
                              }`}
                            >
                              <Icon className={`w-5 h-5 ${colors.text}`} />
                              <span className="font-medium text-sm">{tab.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </div>
    </div>
  )
}