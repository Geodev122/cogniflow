import React, { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { ClientManagement } from '../components/therapist/ClientManagement'
import { AssessmentTools } from '../components/therapist/AssessmentTools'
import { TreatmentPlanning } from '../components/therapist/TreatmentPlanning'
import { SessionManagement } from '../components/therapist/SessionManagement'
import { WorksheetManagement } from '../components/therapist/WorksheetManagement'
import { ProgressMonitoring } from '../components/therapist/ProgressMonitoring'
import { CommunicationTools } from '../components/therapist/CommunicationTools'
import { DocumentationCompliance } from '../components/therapist/DocumentationCompliance'
import { ResourceLibrary } from '../components/therapist/ResourceLibrary'
import { PracticeManagement } from '../components/therapist/PracticeManagement'
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
  CheckCircle
} from 'lucide-react'

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
    fetchDashboardStats()
  }, [profile])

  const fetchDashboardStats = async () => {
    if (!profile) return

    try {
      // Get total clients
      const { data: clientRelations } = await supabase
        .from('therapist_client_relations')
        .select('client_id')
        .eq('therapist_id', profile.id)

      const totalClients = clientRelations?.length || 0

      // Get pending and completed assessments
      const { data: assessments } = await supabase
        .from('form_assignments')
        .select('status')
        .eq('therapist_id', profile.id)

      const pendingAssessments = assessments?.filter(a => a.status === 'assigned' || a.status === 'in_progress').length || 0
      const completedAssessments = assessments?.filter(a => a.status === 'completed').length || 0

      // Get upcoming appointments (next 7 days)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('therapist_id', profile.id)
        .eq('status', 'scheduled')
        .gte('appointment_date', new Date().toISOString())
        .lte('appointment_date', nextWeek.toISOString())

      const upcomingAppointments = appointments?.length || 0

      // Get overdue assignments
      const { data: overdueAssignments } = await supabase
        .from('form_assignments')
        .select('*')
        .eq('therapist_id', profile.id)
        .eq('status', 'assigned')
        .lt('due_date', new Date().toISOString().split('T')[0])

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

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Target },
    { id: 'clients', name: 'Client Management', icon: Users },
    { id: 'assessments', name: 'Assessment Tools', icon: ClipboardList },
    { id: 'treatment', name: 'Treatment Planning', icon: Brain },
    { id: 'sessions', name: 'Session Management', icon: Calendar },
    { id: 'worksheets', name: 'Worksheets & Exercises', icon: BookOpen },
    { id: 'progress', name: 'Progress Monitoring', icon: TrendingUp },
    { id: 'communication', name: 'Communication', icon: MessageSquare },
    { id: 'documentation', name: 'Documentation', icon: FileText },
    { id: 'resources', name: 'Resource Library', icon: Library },
    { id: 'practice', name: 'Practice Management', icon: BarChart3 }
  ]

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
                  <p className="text-sm text-gray-900">Assessment completed by Maria Garcia</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">New client Alex Thompson added</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">Session notes updated for James Wilson</p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">CBT worksheet assigned to Lisa Brown</p>
                  <p className="text-xs text-gray-500">3 days ago</p>
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
                  <span className="text-sm font-medium text-green-900">Positive Progress</span>
                </div>
                <p className="text-sm text-green-800">3 clients showing consistent improvement in mood scores</p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">Attention Needed</span>
                </div>
                <p className="text-sm text-amber-800">1 client showing elevated anxiety scores - consider intervention</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Engagement</span>
                </div>
                <p className="text-sm text-blue-800">87% average completion rate for assigned worksheets</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'clients':
        return <ClientManagement />
      case 'assessments':
        return <AssessmentTools />
      case 'treatment':
        return <TreatmentPlanning />
      case 'sessions':
        return <SessionManagement />
      case 'worksheets':
        return <WorksheetManagement />
      case 'progress':
        return <ProgressMonitoring />
      case 'communication':
        return <CommunicationTools />
      case 'documentation':
        return <DocumentationCompliance />
      case 'resources':
        return <ResourceLibrary />
      case 'practice':
        return <PracticeManagement />
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