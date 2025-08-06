import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  AlertTriangle,
  User,
  Calendar,
  FileText,
  TrendingUp
} from 'lucide-react'

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
  profile?: {
    emergency_contact_name?: string
    emergency_contact_phone?: string
    emergency_contact_relationship?: string
    medical_history?: string
    current_medications?: string
    presenting_concerns?: string
    therapy_history?: string
    risk_level?: string
    notes?: string
  }
  stats?: {
    totalAssessments: number
    completedAssessments: number
    lastSession?: string
    nextAppointment?: string
  }
}

export const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showAddClient, setShowAddClient] = useState(false)
  const [showClientDetails, setShowClientDetails] = useState(false)
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()

  useEffect(() => {
    if (profile) {
      fetchClients()
    }
  }, [profile])

  useEffect(() => {
    filterClients()
  }, [clients, searchTerm, riskFilter])

  const fetchClients = async () => {
    if (!profile) return

    try {
      // Get clients for this therapist
      const { data: relations, error: relationsError } = await supabase
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

      if (relationsError) throw relationsError

      // Get extended client profiles
      const clientsWithProfiles = await Promise.all(
        (relations || []).map(async (relation: any) => {
          const client = relation.profiles

          // Get extended profile
          const { data: clientProfile } = await supabase
            .from('client_profiles')
            .select('*')
            .eq('client_id', client.id)
            .eq('therapist_id', profile.id)
            .single()

          // Get client stats
          const { data: assessments } = await supabase
            .from('form_assignments')
            .select('status')
            .eq('client_id', client.id)
            .eq('therapist_id', profile.id)

          const { data: lastSession } = await supabase
            .from('appointments')
            .select('appointment_date')
            .eq('client_id', client.id)
            .eq('therapist_id', profile.id)
            .eq('status', 'completed')
            .order('appointment_date', { ascending: false })
            .limit(1)

          const { data: nextAppointment } = await supabase
            .from('appointments')
            .select('appointment_date')
            .eq('client_id', client.id)
            .eq('therapist_id', profile.id)
            .eq('status', 'scheduled')
            .gte('appointment_date', new Date().toISOString())
            .order('appointment_date', { ascending: true })
            .limit(1)

          return {
            ...client,
            profile: clientProfile,
            stats: {
              totalAssessments: assessments?.length || 0,
              completedAssessments: assessments?.filter(a => a.status === 'completed').length || 0,
              lastSession: lastSession?.[0]?.appointment_date,
              nextAppointment: nextAppointment?.[0]?.appointment_date
            }
          }
        })
      )

      setClients(clientsWithProfiles)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterClients = () => {
    let filtered = clients

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Risk level filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(client => client.profile?.risk_level === riskFilter)
    }

    setFilteredClients(filtered)
  }

  const getRiskColor = (riskLevel?: string) => {
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

  const addClientToRoster = async (clientEmail: string) => {
    try {
      // Find client by email
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', clientEmail)
        .eq('role', 'client')
        .single()

      if (clientError || !clientData) {
        alert('Client not found. Please ensure the email is correct and the user has a client account.')
        return
      }

      // Check if relationship already exists
      const { data: existingRelation } = await supabase
        .from('therapist_client_relations')
        .select('*')
        .eq('therapist_id', profile!.id)
        .eq('client_id', clientData.id)
        .single()

      if (existingRelation) {
        alert('This client is already in your roster.')
        return
      }

      // Create relationship
      const { error: relationError } = await supabase
        .from('therapist_client_relations')
        .insert({
          therapist_id: profile!.id,
          client_id: clientData.id
        })

      if (relationError) throw relationError

      // Create client profile
      await supabase
        .from('client_profiles')
        .insert({
          client_id: clientData.id,
          therapist_id: profile!.id,
          risk_level: 'low'
        })

      await fetchClients()
      setShowAddClient(false)
    } catch (error) {
      console.error('Error adding client:', error)
      alert('Error adding client to roster.')
    }
  }

  const updateClientProfile = async (clientId: string, updates: any) => {
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

      await fetchClients()
      setShowClientDetails(false)
    } catch (error) {
      console.error('Error updating client profile:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-hidden">
          {filteredClients.length === 0 ? (
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
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assessments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Appointment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {client.first_name[0]}{client.last_name[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {client.first_name} {client.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{client.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(client.profile?.risk_level)}`}>
                          {client.profile?.risk_level || 'low'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client.stats?.completedAssessments}/{client.stats?.totalAssessments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(client.stats?.lastSession)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(client.stats?.nextAppointment)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedClient(client)
                              setShowClientDetails(true)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Phone className="w-4 h-4" />
                          </button>
                          <button className="text-purple-600 hover:text-purple-900">
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
  onAdd: (email: string) => void
}

const AddClientModal: React.FC<AddClientModalProps> = ({ onClose, onAdd }) => {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      onAdd(email.trim())
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Add Client to Roster
                  </h3>
                  <div className="mt-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Client Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter client's email address"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      The client must already have a CogniFlow account with this email address.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Add Client
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
  onClose: () => void
  onUpdate: (clientId: string, updates: any) => void
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ client, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    emergency_contact_name: client.profile?.emergency_contact_name || '',
    emergency_contact_phone: client.profile?.emergency_contact_phone || '',
    emergency_contact_relationship: client.profile?.emergency_contact_relationship || '',
    medical_history: client.profile?.medical_history || '',
    current_medications: client.profile?.current_medications || '',
    presenting_concerns: client.profile?.presenting_concerns || '',
    therapy_history: client.profile?.therapy_history || '',
    risk_level: client.profile?.risk_level || 'low',
    notes: client.profile?.notes || ''
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
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Client Profile: {client.first_name} {client.last_name}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-96 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => handleChange('emergency_contact_relationship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Level
                  </label>
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presenting Concerns
                  </label>
                  <textarea
                    value={formData.presenting_concerns}
                    onChange={(e) => handleChange('presenting_concerns', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical History
                  </label>
                  <textarea
                    value={formData.medical_history}
                    onChange={(e) => handleChange('medical_history', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Medications
                  </label>
                  <textarea
                    value={formData.current_medications}
                    onChange={(e) => handleChange('current_medications', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Therapy History
                  </label>
                  <textarea
                    value={formData.therapy_history}
                    onChange={(e) => handleChange('therapy_history', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinical Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Update Profile
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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