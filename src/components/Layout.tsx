import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { LogOut, User, Brain, ChevronDown } from 'lucide-react'
import { TherapistProfile } from './therapist/TherapistProfile'
import { TherapistOnboarding } from './therapist/TherapistOnboarding'
import { supabase } from '../lib/supabase'

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

interface LayoutProps {
  children: React.ReactNode
  title: string
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { profile, signOut } = useAuth()
  const [showProfileModal, setShowProfileModal] = React.useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = React.useState(false)
  const [therapistProfile, setTherapistProfile] = React.useState<TherapistProfileData | null>(null)
  const [profileLoading, setProfileLoading] = React.useState(false)
  const [profileError, setProfileError] = React.useState<string | null>(null)

  const fetchTherapistProfile = React.useCallback(async () => {
    if (!profile || profile.role !== 'therapist') return

    setProfileLoading(true)
    setProfileError(null)

    try {
      const { data, error } = await supabase.rpc('get_therapist_profile', { p_user_id: profile.id })

      if (error) {
        setProfileError(error.message)
        setTherapistProfile(null)
      } else {
        const profileData = data as TherapistProfileData
        if (profileData) {
          profileData.stats = profileData.stats || {
            totalClients: 0,
            yearsExperience: 0,
            rating: 0,
            reviewCount: 0,
            responseTime: 'N/A'
          }
          profileData.specializations = profileData.specializations || []
          profileData.languages = profileData.languages || []
          profileData.practiceLocations = profileData.practiceLocations || []
          profileData.fullName = profileData.fullName || `${profile.first_name} ${profile.last_name}`
          profileData.whatsappNumber = profileData.whatsappNumber || ''
          profileData.email = profileData.email || profile.email
          profileData.qualifications = profileData.qualifications || ''
          profileData.bio = profileData.bio || ''
          profileData.joinDate = profileData.joinDate || profile.created_at || ''
          profileData.verificationStatus = profileData.verificationStatus || 'pending'
          profileData.membershipStatus = profileData.membershipStatus || 'pending'
        }
        setTherapistProfile(profileData)
      }
    } catch (error) {
      console.error('Error fetching therapist profile:', error)
      setProfileError('Failed to load profile')
    } finally {
      setProfileLoading(false)
    }
  }, [profile])

  React.useEffect(() => {
    if (profile?.role === 'therapist') {
      fetchTherapistProfile()
    }
  }, [profile, fetchTherapistProfile])

  const handleOnboardingComplete = (data: unknown) => {
    console.log('Onboarding completed:', data)
    setShowOnboardingModal(false)
    fetchTherapistProfile()
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">CogniFlow</h1>
                <p className="text-xs sm:text-sm text-gray-500 capitalize">
                  {profile?.role === 'therapist' ? 'Therapist Portal' : 'Client Portal'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {profile?.role === 'therapist' ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md px-3 py-2 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="font-medium">{profile?.first_name} {profile?.last_name}</div>
                      <div className="text-xs text-gray-500">View Profile</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <span>{profile?.first_name} {profile?.last_name}</span>
                  </div>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 hidden sm:block">{title}</h2>
        </div>
        {children}
      </main>

      {/* Profile Modal */}
      {showProfileModal && profile?.role === 'therapist' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowProfileModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-white">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Therapist Profile</h3>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-0">
                  {profileLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : profileError ? (
                    <div className="p-6 text-red-600">{profileError}</div>
                  ) : therapistProfile ? (
                    <TherapistProfile
                      therapist={therapistProfile}
                      isOwnProfile={true}
                      onEdit={() => {
                        setShowProfileModal(false)
                        setShowOnboardingModal(true)
                      }}
                    />
                  ) : (
                    <div className="p-6 text-gray-600">Profile not found</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboardingModal && (
        <TherapistOnboarding 
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboardingModal(false)}
        />
      )}
    </div>
  )
}