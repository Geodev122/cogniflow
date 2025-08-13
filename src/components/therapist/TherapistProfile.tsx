import React from 'react'
import { 
  User, 
  Award, 
  BookOpen, 
  MapPin, 
  Shield, 
  Phone,
  Mail,
  Globe,
  Calendar,
  Star,
  MessageCircle,
  Video,
  FileText,
  Edit,
  Camera,
  Languages,
  GraduationCap,
  MapPinIcon,
  CheckCircle,
  Clock
} from 'lucide-react'

interface TherapistProfileData {
  // Basic Info
  id: string
  fullName: string
  profilePicture?: string
  whatsappNumber: string
  email: string
  
  // Expertise
  specializations: string[]
  languages: string[]
  qualifications: string
  
  // Story
  bio: string
  introVideo?: string
  
  // Practice Details
  practiceLocations: Array<{
    address: string
    isPrimary: boolean
  }>
  
  // Professional Status
  verificationStatus: 'pending' | 'verified' | 'rejected'
  membershipStatus: 'active' | 'inactive' | 'pending'
  joinDate: string
  
  // Stats
  stats: {
    totalClients: number
    yearsExperience: number
    rating: number
    reviewCount: number
    responseTime: string
  }
}

interface TherapistProfileProps {
  therapist: TherapistProfileData
  isOwnProfile?: boolean
  onEdit?: () => void
}

export const TherapistProfile: React.FC<TherapistProfileProps> = ({ 
  therapist, 
  isOwnProfile = false, 
  onEdit 
}) => {
  const getVerificationBadge = () => {
    switch (therapist.verificationStatus) {
      case 'verified':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Verified Professional
          </div>
        )
      case 'pending':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            Verification Pending
          </div>
        )
      case 'rejected':
        return (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <Shield className="w-4 h-4 mr-1" />
            Verification Required
          </div>
        )
    }
  }

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-2">
          {rating.toFixed(1)} ({therapist.stats.reviewCount} reviews)
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                {therapist.profilePicture ? (
                  <img 
                    src={therapist.profilePicture} 
                    alt={therapist.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-500" />
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 shadow-lg">
                  <Camera className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{therapist.fullName}</h1>
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    {getVerificationBadge()}
                    <div className="flex items-center text-blue-100">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span className="text-sm">Joined {new Date(therapist.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {renderStarRating(therapist.stats.rating)}
                </div>
                {isOwnProfile && (
                  <button
                    onClick={onEdit}
                    className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{therapist.stats.totalClients}</div>
                  <div className="text-sm text-blue-100">Active Clients</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{therapist.stats.yearsExperience}</div>
                  <div className="text-sm text-blue-100">Years Experience</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{therapist.stats.rating.toFixed(1)}</div>
                  <div className="text-sm text-blue-100">Average Rating</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{therapist.stats.responseTime}</div>
                  <div className="text-sm text-blue-100">Response Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Contact & Quick Info */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-blue-600" />
                Contact Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">WhatsApp</div>
                    <div className="text-sm text-gray-600">{therapist.whatsappNumber}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email</div>
                    <div className="text-sm text-gray-600">{therapist.email}</div>
                  </div>
                </div>
              </div>
              
              {!isOwnProfile && (
                <div className="mt-6 space-y-3">
                  <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Message on WhatsApp
                  </button>
                  <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Book Consultation
                  </button>
                </div>
              )}
            </div>

            {/* Languages */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Languages className="w-5 h-5 mr-2 text-purple-600" />
                Languages
              </h3>
              <div className="flex flex-wrap gap-2">
                {therapist.languages.map((language, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>

            {/* Practice Locations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-red-600" />
                Practice Locations
              </h3>
              <div className="space-y-3">
                {therapist.practiceLocations.map((location, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {location.address}
                        {location.isPrimary && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Introduction Video */}
            {therapist.introVideo && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Video className="w-5 h-5 mr-2 text-indigo-600" />
                  Introduction Video
                </h3>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Video player would be here</p>
                  </div>
                </div>
              </div>
            )}

            {/* About Me */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                About Me
              </h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {therapist.bio}
                </p>
              </div>
            </div>

            {/* Specializations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-yellow-600" />
                Areas of Expertise
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {therapist.specializations.map((specialization, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">{specialization}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                Qualifications & Credentials
              </h3>
              <div className="space-y-2">
                {therapist.qualifications.split('\n').filter(qual => qual.trim()).map((qualification, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{qualification.trim()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Professional Status */}
            {isOwnProfile && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-indigo-600" />
                  Professional Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 mb-1">Verification Status</div>
                    {getVerificationBadge()}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 mb-1">Membership Status</div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      therapist.membershipStatus === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        therapist.membershipStatus === 'active' ? 'bg-green-600' : 'bg-yellow-600'
                      }`}></div>
                      {therapist.membershipStatus === 'active' ? 'Active Member' : 'Pending Payment'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}