import React, { useState } from 'react'
import { 
  User, 
  Award, 
  BookOpen, 
  MapPin, 
  Shield, 
  CreditCard,
  Upload,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  Camera,
  Video,
  FileText,
  Globe,
  Phone
} from 'lucide-react'

interface OnboardingData {
  // Step 1: Basic Info
  fullName: string
  profilePicture: File | null
  whatsappNumber: string
  
  // Step 2: Expertise
  specializations: string[]
  otherSpecializations: string
  languages: string[]
  otherLanguages: string
  qualifications: string
  
  // Step 3: Story
  bio: string
  introVideo: File | null
  
  // Step 4: Practice Details
  practiceLocations: Array<{
    address: string
    isPrimary: boolean
  }>
  
  // Step 5: Verification
  licenses: Array<{
    name: string
    country: string
    document: File | null
  }>
  
  // Step 6: Membership
  paymentReceipt: File | null
  termsAccepted: boolean
}

const SPECIALIZATIONS = [
  'Anxiety Disorders',
  'Depression',
  'Trauma & PTSD',
  'Relationship Counseling',
  'Family Therapy',
  'Addiction & Substance Abuse',
  'Eating Disorders',
  'Grief & Loss',
  'Stress Management',
  'Career Counseling',
  'Child & Adolescent Therapy',
  'Couples Therapy',
  'Group Therapy',
  'Cognitive Behavioral Therapy (CBT)',
  'Dialectical Behavior Therapy (DBT)',
  'EMDR',
  'Mindfulness-Based Therapy',
  'Other'
]

const LANGUAGES = [
  'English',
  'Arabic',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese (Mandarin)',
  'Japanese',
  'Korean',
  'Hindi',
  'Turkish',
  'Other'
]

export const TherapistOnboarding: React.FC<{ onComplete: (data: OnboardingData) => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: '',
    profilePicture: null,
    whatsappNumber: '',
    specializations: [],
    otherSpecializations: '',
    languages: [],
    otherLanguages: '',
    qualifications: '',
    bio: '',
    introVideo: null,
    practiceLocations: [{ address: '', isPrimary: true }],
    licenses: [{ name: '', country: '', document: null }],
    paymentReceipt: null,
    termsAccepted: false
  })

  const steps = [
    { number: 1, title: 'Welcome', icon: User },
    { number: 2, title: 'Expertise', icon: Award },
    { number: 3, title: 'Your Story', icon: BookOpen },
    { number: 4, title: 'Practice Details', icon: MapPin },
    { number: 5, title: 'Verification', icon: Shield },
    { number: 6, title: 'Membership', icon: CreditCard }
  ]

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addPracticeLocation = () => {
    setFormData(prev => ({
      ...prev,
      practiceLocations: [...prev.practiceLocations, { address: '', isPrimary: false }]
    }))
  }

  const removePracticeLocation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      practiceLocations: prev.practiceLocations.filter((_, i) => i !== index)
    }))
  }

  const addLicense = () => {
    setFormData(prev => ({
      ...prev,
      licenses: [...prev.licenses, { name: '', country: '', document: null }]
    }))
  }

  const removeLicense = (index: number) => {
    setFormData(prev => ({
      ...prev,
      licenses: prev.licenses.filter((_, i) => i !== index)
    }))
  }

  const handleFileUpload = (field: string, file: File | null, index?: number) => {
    if (index !== undefined) {
      if (field === 'licenses') {
        setFormData(prev => ({
          ...prev,
          licenses: prev.licenses.map((license, i) => 
            i === index ? { ...license, document: file } : license
          )
        }))
      }
    } else {
      updateFormData(field, file)
    }
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.fullName && formData.profilePicture && formData.whatsappNumber)
      case 2:
        return !!(formData.specializations.length > 0 && formData.languages.length > 0 && formData.qualifications)
      case 3:
        return !!(formData.bio && formData.bio.length >= 150)
      case 4:
        return !!(formData.practiceLocations.length > 0 && formData.practiceLocations.every(loc => loc.address))
      case 5:
        return !!(formData.licenses.length > 0 && formData.licenses.every(license => license.name && license.country && license.document))
      case 6:
        return !!(formData.paymentReceipt && formData.termsAccepted)
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = () => {
    if (validateStep(6)) {
      onComplete(formData)
    }
  }

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.number
          const isCompleted = currentStep > step.number
          const isAccessible = currentStep >= step.number

          return (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isActive 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : isAccessible
                    ? 'border-gray-300 text-gray-400'
                    : 'border-gray-200 text-gray-300'
                }`}>
                  {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome! Let's Start with the Basics</h2>
        <p className="text-gray-600">This information will be the first thing potential clients see. Let's make a great first impression.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Professional Name *
        </label>
        <input
          type="text"
          value={formData.fullName}
          onChange={(e) => updateFormData('fullName', e.target.value)}
          placeholder="Enter your full professional name as you'd like it to appear to clients"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professional Profile Picture *
        </label>
        <div className="flex items-center space-x-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
            {formData.profilePicture ? (
              <img 
                src={URL.createObjectURL(formData.profilePicture)} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Camera className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload('profilePicture', e.target.files?.[0] || null)}
              className="hidden"
              id="profile-picture"
            />
            <label
              htmlFor="profile-picture"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photo
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Upload a professional, high-quality headshot. A warm, friendly photo works best. (Square, max 2MB)
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          WhatsApp Number *
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="tel"
            value={formData.whatsappNumber}
            onChange={(e) => updateFormData('whatsappNumber', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Clients will use this to contact you. It will be public. Please include your country code.
        </p>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Showcase Your Expertise</h2>
        <p className="text-gray-600">Help clients find you by detailing your skills, approach, and the languages you offer sessions in.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Specializations *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
          {SPECIALIZATIONS.map((spec) => (
            <label key={spec} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.specializations.includes(spec)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFormData('specializations', [...formData.specializations, spec])
                  } else {
                    updateFormData('specializations', formData.specializations.filter(s => s !== spec))
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{spec}</span>
            </label>
          ))}
        </div>
        {formData.specializations.includes('Other') && (
          <input
            type="text"
            value={formData.otherSpecializations}
            onChange={(e) => updateFormData('otherSpecializations', e.target.value)}
            placeholder="List other specializations, separated by commas"
            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
          {LANGUAGES.map((lang) => (
            <label key={lang} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.languages.includes(lang)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFormData('languages', [...formData.languages, lang])
                  } else {
                    updateFormData('languages', formData.languages.filter(l => l !== lang))
                  }
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{lang}</span>
            </label>
          ))}
        </div>
        {formData.languages.includes('Other') && (
          <input
            type="text"
            value={formData.otherLanguages}
            onChange={(e) => updateFormData('otherLanguages', e.target.value)}
            placeholder="List other languages, separated by commas"
            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Qualifications & Credentials *
        </label>
        <textarea
          value={formData.qualifications}
          onChange={(e) => updateFormData('qualifications', e.target.value)}
          placeholder="List your degrees, licenses, and relevant credentials. Please place each one on a new line."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell Your Story</h2>
        <p className="text-gray-600">This is your chance to connect with potential clients on a personal level.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professional Bio *
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => updateFormData('bio', e.target.value)}
          placeholder="Write a warm bio (min 150 characters). Describe your philosophy, what a session is like, and who you enjoy working with."
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formData.bio.length}/150 minimum characters</span>
          <span className={formData.bio.length >= 150 ? 'text-green-600' : 'text-red-500'}>
            {formData.bio.length >= 150 ? '✓ Minimum reached' : 'Minimum not reached'}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Introduction Video (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          {formData.introVideo ? (
            <div className="space-y-2">
              <Video className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-sm font-medium text-gray-900">{formData.introVideo.name}</p>
              <button
                onClick={() => updateFormData('introVideo', null)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove video
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Video className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload('introVideo', e.target.files?.[0] || null)}
                  className="hidden"
                  id="intro-video"
                />
                <label
                  htmlFor="intro-video"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Optional, but highly recommended! A short video (max 30s) helps build trust. (MP4/WebM, max 10MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Practice Details</h2>
        <p className="text-gray-600">Let clients know where to find you. You can add multiple office locations or an online-only practice.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Practice Locations *
        </label>
        <div className="space-y-4">
          {formData.practiceLocations.map((location, index) => (
            <div key={index} className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={location.address}
                    onChange={(e) => {
                      const newLocations = [...formData.practiceLocations]
                      newLocations[index].address = e.target.value
                      updateFormData('practiceLocations', newLocations)
                    }}
                    placeholder="Enter the full street address. For online, type 'Online Only'."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <label className="flex items-center mt-2">
                    <input
                      type="radio"
                      name="primaryLocation"
                      checked={location.isPrimary}
                      onChange={() => {
                        const newLocations = formData.practiceLocations.map((loc, i) => ({
                          ...loc,
                          isPrimary: i === index
                        }))
                        updateFormData('practiceLocations', newLocations)
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Primary location</span>
                  </label>
                </div>
                {formData.practiceLocations.length > 1 && (
                  <button
                    onClick={() => removePracticeLocation(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addPracticeLocation}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Location
        </button>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">License & Verification</h2>
        <p className="text-gray-600">To ensure the quality and safety of our platform, please upload your professional licenses. This is for internal verification only and will be kept confidential.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Professional Licenses *
        </label>
        <div className="space-y-4">
          {formData.licenses.map((license, index) => (
            <div key={index} className="border border-gray-300 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Name
                  </label>
                  <input
                    type="text"
                    value={license.name}
                    onChange={(e) => {
                      const newLicenses = [...formData.licenses]
                      newLicenses[index].name = e.target.value
                      updateFormData('licenses', newLicenses)
                    }}
                    placeholder="e.g., Licensed Professional Counselor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country of Practice
                  </label>
                  <input
                    type="text"
                    value={license.country}
                    onChange={(e) => {
                      const newLicenses = [...formData.licenses]
                      newLicenses[index].country = e.target.value
                      updateFormData('licenses', newLicenses)
                    }}
                    placeholder="e.g., USA, Egypt"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Document
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('licenses', e.target.files?.[0] || null, index)}
                    className="hidden"
                    id={`license-${index}`}
                  />
                  <label
                    htmlFor={`license-${index}`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {license.document ? 'Change Document' : 'Upload Document'}
                  </label>
                  {license.document && (
                    <span className="text-sm text-green-600">✓ {license.document.name}</span>
                  )}
                  {formData.licenses.length > 1 && (
                    <button
                      onClick={() => removeLicense(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Upload a clear scan or photo (PDF, JPG, PNG). Max 5MB.
                </p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={addLicense}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another License
        </button>
      </div>
    </div>
  )

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Final Step: Membership & Review</h2>
        <p className="text-gray-600">To be listed on CogniFlow and ensure platform quality, we require a small membership fee. Please upload your proof of payment to submit your profile for review.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <CreditCard className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Membership Information</h3>
            <p className="text-blue-800 text-sm">
              Our standard therapist membership is $29/month. This helps us maintain the platform and provide quality services. 
              Please make the payment to our secure payment portal and upload the receipt below.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Receipt *
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          {formData.paymentReceipt ? (
            <div className="space-y-2">
              <FileText className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-sm font-medium text-gray-900">{formData.paymentReceipt.name}</p>
              <button
                onClick={() => updateFormData('paymentReceipt', null)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove receipt
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <FileText className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload('paymentReceipt', e.target.files?.[0] || null)}
                  className="hidden"
                  id="payment-receipt"
                />
                <label
                  htmlFor="payment-receipt"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Receipt
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Upload a screenshot or document of your payment confirmation. Max 2MB.
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.termsAccepted}
            onChange={(e) => updateFormData('termsAccepted', e.target.checked)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            I have read and agree to the CogniFlow{' '}
            <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
              Privacy Policy
            </a>
            .
          </span>
        </label>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
      case 6: return renderStep6()
      default: return renderStep1()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {renderProgressBar()}
          
          <div className="min-h-96">
            {renderCurrentStep()}
          </div>

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            {currentStep < 6 ? (
              <button
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: {steps[currentStep]?.title}
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!validateStep(6)}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Profile for Review
                <Check className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}