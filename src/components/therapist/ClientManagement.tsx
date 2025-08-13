import React, { useState, useEffect } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Phone,
  Mail,
  AlertTriangle
} from 'lucide-react'

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
  whatsapp_number?: string | null
  patient_code?: string | null
}

interface ClientProfile {
  risk_level?: string
  presenting_concerns?: string
  notes?: string
  intake_status?: string
  treatment_stage?: string
}

export const ClientManagement: React.FC = () => {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [intakeFilter, setIntakeFilter] = useState<string>('all')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showAddClient, setShowAddClient] = useState(false)
  const [showClientDetails, setShowClientDetails] = useState(false)
  const PAGE_SIZE = 12

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  const fetchClients = async ({ pageParam = 0 }: { pageParam?: number }) => {
    if (!profile?.id) {
      return { clients: [], profilesMap: {}, hasMore: false, page: pageParam }
    }

    let query = supabase
      .from('therapist_client_relations')
      .select(`
        client_id,
        profiles!therapist_client_relations_client_id_fkey (
          id,
          first_name,
          last_name,
          email,
          created_at,
          whatsapp_number,
          patient_code
        )
      `, { count: 'exact' })
      .eq('therapist_id', profile.id)
      .range(pageParam * PAGE_SIZE, pageParam * PAGE_SIZE + PAGE_SIZE - 1)

    if (debouncedSearch) {
      query = query.or(
        `profiles.first_name.ilike.%${debouncedSearch}%,profiles.last_name.ilike.%${debouncedSearch}%,profiles.email.ilike.%${debouncedSearch}%`
      )
    }

    const { data: relations, error, count } = await query

    if (error) {
      throw error
    }

    const clientList = (relations || [])
      .map((relation: { profiles: Client }) => relation.profiles)
      .filter(Boolean)

    let profilesMap: Record<string, ClientProfile> = {}
    if (clientList.length > 0) {
      const clientIds = clientList.map(c => c.id)
      const { data: profiles } = await supabase
        .from('client_profiles')
        .select('client_id, risk_level, presenting_concerns, notes, intake_status, treatment_stage')
        .in('client_id', clientIds)
        .eq('therapist_id', profile.id)

      if (profiles) {
        profilesMap = profiles.reduce((acc, p) => {
          acc[p.client_id] = {
            risk_level: p.risk_level,
            presenting_concerns: p.presenting_concerns,
            notes: p.notes,
            intake_status: p.intake_status,
            treatment_stage: p.treatment_stage
          }
          return acc
        }, {} as Record<string, ClientProfile>)
      }
    }

    const totalCount = typeof count === 'number' ? count : clientList.length
    const hasMore = (pageParam + 1) * PAGE_SIZE < totalCount

    return { clients: clientList, profilesMap, hasMore, page: pageParam }
  }

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['clients', profile?.id, debouncedSearch],
    queryFn: fetchClients,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: !!profile?.id,
    initialPageParam: 0
  })

  const clients = data?.pages.flatMap(page => page.clients) ?? []
  const clientProfiles = Object.assign({}, ...(data?.pages.map(p => p.profilesMap) ?? [])) as Record<string, ClientProfile>

  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('therapist-client-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'therapist_client_relations', filter: `therapist_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['clients', profile.id] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_profiles', filter: `therapist_id=eq.${profile.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['clients', profile.id] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, queryClient])

  const filteredClients = clients
    .filter(client => {
      const clientProfile = clientProfiles[client.id]
      const matchesRisk = riskFilter === 'all' || clientProfile?.risk_level === riskFilter
      const matchesIntake = intakeFilter === 'all' || clientProfile?.intake_status === intakeFilter
      const matchesStage = stageFilter === 'all' || clientProfile?.treatment_stage === stageFilter
      return matchesRisk && matchesIntake && matchesStage
    })
    .sort((a, b) => {
      const profileA = clientProfiles[a.id]
      const profileB = clientProfiles[b.id]
      switch (sortBy) {
        case 'intake_status':
          return (profileA?.intake_status || '').localeCompare(profileB?.intake_status || '')
        case 'treatment_stage':
          return (profileA?.treatment_stage || '').localeCompare(profileB?.treatment_stage || '')
        case 'created_at':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return (a.last_name + a.first_name).localeCompare(b.last_name + b.first_name)
      }
    })

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'crisis': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'moderate': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const addClientToRoster = async (clientData: { firstName: string; lastName: string; email: string; whatsappNumber: string }) => {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', clientData.email)
        .maybeSingle()
      
      if (existingUser) {
        // Check if relationship already exists
        const { data: existingRelation } = await supabase
          .from('therapist_client_relations')
          .select('id')
          .eq('therapist_id', profile!.id)
          .eq('client_id', existingUser.id)
          .maybeSingle()
        
        if (existingRelation) {
          alert('This client is already in your roster.')
          return
        }

        // Create therapist-client relation
        const { error: relationError } = await supabase
          .from('therapist_client_relations')
          .insert({
            therapist_id: profile!.id,
            client_id: existingUser.id
          })

        if (relationError) throw relationError
      } else {
        alert('Client must register first. Please ask them to create an account with this email: ' + clientData.email)
        return
      }

      await queryClient.invalidateQueries({ queryKey: ['clients', profile!.id] })
      setShowAddClient(false)
    } catch (error) {
      console.error('Error adding client:', error)
      alert('Error adding client to roster. Please try again.')
    }
  }

  const updateClientProfile = async (clientId: string, updates: Record<string, unknown>) => {
    try {
      const { error } = await supabase
        .from('client_profiles')
        .upsert({
          client_id: clientId,
          therapist_id: profile!.id,
          ...updates,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['clients', profile!.id] })
      setShowClientDetails(false)
    } catch (error) {
      console.error('Error updating client profile:', error)
      alert('Error updating client profile')
    }
  }

  const handleLoadMore = () => {
    if (hasNextPage) fetchNextPage()
  }

  if (isLoading) {
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
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error instanceof Error ? error.message : 'Failed to load clients'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
          <p className="text-gray-600">Manage your client roster and profiles</p>
        </div>
        <button
          onClick={() => setShowAddClient(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </button>
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
            <select
              value={intakeFilter}
              onChange={(e) => setIntakeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Intake Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Treatment Stages</option>
              <option value="assessment">Assessment</option>
              <option value="treatment">Treatment</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="created_at">Sort by Join Date</option>
              <option value="intake_status">Sort by Intake Status</option>
              <option value="treatment_stage">Sort by Treatment Stage</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const clientProfile = clientProfiles[client.id]
          return (
            <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {client.first_name[0]}{client.last_name[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {client.first_name} {client.last_name}
                    </h3>
                    <p className="text-sm text-gray-600">{client.email}</p>
                    {client.patient_code && (
                      <p className="text-xs text-gray-500">Code: {client.patient_code}</p>
                    )}
                  </div>
                </div>
                <div className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(clientProfile?.risk_level)}`}>
                  {clientProfile?.risk_level || 'low'}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">Joined:</span> {formatDate(client.created_at)}
                </div>
                <div>
                  <span className="font-medium">Intake:</span> {clientProfile?.intake_status || 'not_started'}
                </div>
                <div>
                  <span className="font-medium">Stage:</span> {clientProfile?.treatment_stage || 'assessment'}
                </div>
                {clientProfile?.presenting_concerns && (
                  <div>
                    <span className="font-medium">Concerns:</span>
                    <p className="text-xs mt-1 line-clamp-2">{clientProfile.presenting_concerns}</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedClient(client)
                    setShowClientDetails(true)
                  }}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
                {client.whatsapp_number && (
                  <button className="inline-flex items-center justify-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100">
                    <Phone className="w-4 h-4" />
                  </button>
                )}
                <button className="inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || riskFilter !== 'all' 
              ? 'Try adjusting your search or filters.'
              : 'Add clients to your roster to get started.'
            }
          </p>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onAdd={addClientToRoster}
        />
      )}

      {/* Client Details Modal */}
      {showClientDetails && selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          profile={clientProfiles[selectedClient.id]}
          onClose={() => setShowClientDetails(false)}
          onUpdate={updateClientProfile}
        />
      )}
    </div>
  )
}

// Add Client Modal Component
interface AddClientModalProps {
  onClose: () => void
  onAdd: (clientData: { firstName: string; lastName: string; email: string; whatsappNumber: string }) => void
}

const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    whatsappNumber: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.firstName && formData.lastName && formData.email && formData.whatsappNumber) {
      onAdd(formData)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Add Client to Roster</h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="client@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number *</label>
                  <input
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> The client must already have an account. If they don't, ask them to register first.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.whatsappNumber}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Add to Roster
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

// Client Details Modal Component
interface ClientDetailsModalProps {
  client: Client
  profile?: ClientProfile
  onClose: () => void
  onUpdate: (clientId: string, updates: Record<string, unknown>) => void
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ client, profile: clientProfile, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    emergency_contact_name: clientProfile?.notes || '',
    risk_level: clientProfile?.risk_level || 'low',
    presenting_concerns: clientProfile?.presenting_concerns || '',
    notes: clientProfile?.notes || '',
    intake_status: clientProfile?.intake_status || 'not_started',
    treatment_stage: clientProfile?.treatment_stage || 'assessment'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(client.id, formData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
                  Client Profile: {client.first_name} {client.last_name}
                </h3>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                  <select
                    value={formData.risk_level}
                    onChange={(e) => handleChange('risk_level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low Risk</option>
                    <option value="moderate">Moderate Risk</option>
                    <option value="high">High Risk</option>
                    <option value="crisis">Crisis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Intake Status</label>
                  <select
                    value={formData.intake_status}
                    onChange={(e) => handleChange('intake_status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Stage</label>
                  <select
                    value={formData.treatment_stage}
                    onChange={(e) => handleChange('treatment_stage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="assessment">Assessment</option>
                    <option value="treatment">Treatment</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Presenting Concerns</label>
                  <textarea
                    value={formData.presenting_concerns}
                    onChange={(e) => handleChange('presenting_concerns', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What brings the client to therapy?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Clinical observations and notes..."
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Update Profile
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