import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { 
  UserPlus, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  User,
  Heart,
  Brain,
  Shield,
  MessageSquare
} from 'lucide-react'

interface IntakeFormProps {
  onClose: () => void
  onAdd: (clientData: any) => void
}

interface IntakeData {
  // Demographics
  firstName: string
  lastName: string
  email: string
  whatsappNumber: string
  dateOfBirth: string
  gender: string
  
  // Contact & Emergency
  address: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  
  // Clinical Information
  presentingConcerns: string
  medicalHistory: string
  currentMedications: string
  therapyHistory: string
  riskLevel: 'low' | 'moderate' | 'high' | 'crisis'
  
  // Consent & Legal
  consentToTreatment: boolean
  consentToContact: boolean
  privacyPolicyAccepted: boolean
  
  // Initial Assessments
  selectedAssessments: string[]
  assessmentInstructions: string
}

const INITIAL_ASSESSMENTS = [
  { id: 'phq9', name: 'PHQ-9 (Depression)', description: 'Patient Health Questionnaire for depression screening' },
  { id: 'gad7', name: 'GAD-7 (Anxiety)', description: 'Generalized Anxiety Disorder scale' },
  { id: 'pss10', name: 'PSS-10 (Stress)', description: 'Perceived Stress Scale' },
  { id: 'swls', name: 'SWLS (Life Satisfaction)', description: 'Satisfaction with Life Scale' }
]

export const IntakeForm: React.FC<IntakeFormProps> = ({ onClose, onAdd }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [patientCode, setPatientCode] = useState('')
  const { profile } = useAuth()
  
  const [formData, setFormData] = useState<IntakeData>({
    firstName: '',
    lastName: '',
    email: '',
    whatsappNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    presentingConcerns: '',
    medicalHistory: '',
    currentMedications: '',
    therapyHistory: '',
    riskLevel: 'low',
    consentToTreatment: false,
    consentToContact: false,
    privacyPolicyAccepted: false,
    selectedAssessments: ['phq9', 'gad7'],
    assessmentInstructions: ''
  })

  // Generate patient code when component mounts
  React.useEffect(() => {
    const generatePatientCode = () => {
      const prefix = 'PT'
      const randomNum = Math.floor(Math.random() * 900000) + 100000
      return `${prefix}${randomNum}`
    }
    setPatientCode(generatePatientCode())
  }, [])

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.whatsappNumber)
      case 2:
        return !!(formData.emergencyContactName && formData.emergencyContactPhone && formData.emergencyContactRelationship)
      case 3:
        return !!(formData.presentingConcerns && formData.riskLevel)
      case 4:
        return !!(formData.consentToTreatment && formData.consentToContact && formData.privacyPolicyAccepted)
      case 5:
        return formData.selectedAssessments.length > 0
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!profile || !validateStep(5)) return
    
    setLoading(true)
    try {
      // Step 1: Create client account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: Math.random().toString(36).slice(-8), // Temporary password
        email_confirm: true,
        user_metadata: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'client'
        }
      })

      if (authError) throw authError

      const clientId = authData.user.id

      // Step 2: Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: clientId,
          role: 'client',
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          whatsapp_number: formData.whatsappNumber,
          patient_code: patientCode,
          created_by_therapist: profile.id,
          password_set: false
        })

      if (profileError) throw profileError

      // Step 3: Create therapist-client relation
      const { error: relationError } = await supabase
        .from('therapist_client_relations')
        .insert({
          therapist_id: profile.id,
          client_id: clientId
        })

      if (relationError) throw relationError

      // Step 4: Create detailed client profile
      const { error: clientProfileError } = await supabase
        .from('client_profiles')
        .insert({
          client_id: clientId,
          therapist_id: profile.id,
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_phone: formData.emergencyContactPhone,
          emergency_contact_relationship: formData.emergencyContactRelationship,
          medical_history: formData.medicalHistory,
          current_medications: formData.currentMedications,
          presenting_concerns: formData.presentingConcerns,
          therapy_history: formData.therapyHistory,
          risk_level: formData.riskLevel,
          notes: `Initial intake completed on ${new Date().toLocaleDateString()}`
        })

      if (clientProfileError) throw clientProfileError

      // Step 5: Assign initial assessments
      const assessmentPromises = formData.selectedAssessments.map(async (assessmentId) => {
        const assessment = INITIAL_ASSESSMENTS.find(a => a.id === assessmentId)
        if (!assessment) return

        // Create form assignment
        await supabase
          .from('form_assignments')
          .insert({
            therapist_id: profile.id,
            client_id: clientId,
            form_type: 'psychometric',
            form_id: assessmentId,
            title: assessment.name,
            instructions: formData.assessmentInstructions || 'Please complete this assessment as part of your initial intake.',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
            status: 'assigned'
          })

        // Create psychometric form entry
        await supabase
          .from('psychometric_forms')
          .insert({
            therapist_id: profile.id,
            client_id: clientId,
            form_type: assessmentId,
            title: assessment.name,
            questions: [], // Will be populated from assessment library
            status: 'assigned'
          })
      })

      await Promise.all(assessmentPromises)

      // Step 6: Log milestone
      await supabase
        .from('audit_logs')
        .insert({
          user_id: profile.id,
          action: 'intake_completed',
          resource_type: 'client',
          resource_id: null,
          client_id: clientId,
          details: {
            milestone: 'Intake Complete',
            patient_code: patientCode,
            assessments_assigned: formData.selectedAssessments.length
          }
        })

      onAdd({ clientId, patientCode })
      onClose()
    } catch (error) {
      console.error('Error creating client:', error)
      alert('Error creating client. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Demographics', icon: User },
    { number: 2, title: 'Emergency Contact', icon: Phone },
    { number: 3, title: 'Clinical Info', icon: Heart },
    { number: 4, title: 'Consent', icon: Shield },
    { number: 5, title: 'Assessments', icon: Brain }
  ]

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
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isActive 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : isAccessible
                    ? 'border-gray-300 text-gray-400'
                    : 'border-gray-200 text-gray-300'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-1 font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
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
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Client Demographics</h3>
        <p className="text-gray-600">Basic information about the new client</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-blue-900">Patient Code:</span>
          <span className="text-sm font-mono text-blue-700 bg-white px-2 py-1 rounded">{patientCode}</span>
        </div>
        <p className="text-xs text-blue-700 mt-1">Auto-generated unique identifier for this client</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter first name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="client@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number *</label>
        <input
          type="tel"
          value={formData.whatsappNumber}
          onChange={(e) => updateFormData('whatsappNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
          <input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => updateFormData('gender', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
        <textarea
          value={formData.address}
          onChange={(e) => updateFormData('address', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="Full address"
        />
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Emergency Contact Information</h3>
        <p className="text-gray-600">Person to contact in case of emergency</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name *</label>
        <input
          type="text"
          value={formData.emergencyContactName}
          onChange={(e) => updateFormData('emergencyContactName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Full name of emergency contact"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone *</label>
        <input
          type="tel"
          value={formData.emergencyContactPhone}
          onChange={(e) => updateFormData('emergencyContactPhone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Relationship to Client *</label>
        <select
          value={formData.emergencyContactRelationship}
          onChange={(e) => updateFormData('emergencyContactRelationship', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select relationship</option>
          <option value="spouse">Spouse</option>
          <option value="parent">Parent</option>
          <option value="sibling">Sibling</option>
          <option value="child">Child</option>
          <option value="friend">Friend</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Clinical Information</h3>
        <p className="text-gray-600">Medical history and presenting concerns</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Presenting Concerns *</label>
        <textarea
          value={formData.presentingConcerns}
          onChange={(e) => updateFormData('presentingConcerns', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          placeholder="What brings the client to therapy? What are their main concerns or symptoms?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Medical History</label>
        <textarea
          value={formData.medicalHistory}
          onChange={(e) => updateFormData('medicalHistory', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Relevant medical conditions, surgeries, hospitalizations"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
        <textarea
          value={formData.currentMedications}
          onChange={(e) => updateFormData('currentMedications', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="List all current medications and dosages"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Previous Therapy History</label>
        <textarea
          value={formData.therapyHistory}
          onChange={(e) => updateFormData('therapyHistory', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Previous therapy experiences, what worked, what didn't"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Initial Risk Assessment *</label>
        <select
          value={formData.riskLevel}
          onChange={(e) => updateFormData('riskLevel', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="low">Low Risk - No immediate safety concerns</option>
          <option value="moderate">Moderate Risk - Some risk factors present</option>
          <option value="high">High Risk - Significant risk factors</option>
          <option value="crisis">Crisis - Immediate safety concerns</option>
        </select>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Consent & Legal</h3>
        <p className="text-gray-600">Required consents and agreements</p>
      </div>

      <div className="space-y-4">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consentToTreatment}
            onChange={(e) => updateFormData('consentToTreatment', e.target.checked)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Consent to Treatment *</span>
            <p className="text-xs text-gray-600">
              I consent to receive psychological/therapeutic services from this practitioner. I understand the nature of therapy and potential risks and benefits.
            </p>
          </div>
        </label>

        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.consentToContact}
            onChange={(e) => updateFormData('consentToContact', e.target.checked)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Consent to Contact *</span>
            <p className="text-xs text-gray-600">
              I consent to be contacted via email and WhatsApp for appointment reminders, assessments, and therapy-related communications.
            </p>
          </div>
        </label>

        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.privacyPolicyAccepted}
            onChange={(e) => updateFormData('privacyPolicyAccepted', e.target.checked)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">Privacy Policy Agreement *</span>
            <p className="text-xs text-gray-600">
              I have read and agree to the CogniFlow Privacy Policy and understand how my data will be used and protected.
            </p>
          </div>
        </label>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900">Important Notice</h4>
            <p className="text-sm text-amber-800 mt-1">
              All consents are required to proceed with treatment. The client will receive an email with their patient code and instructions to set up their account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Initial Assessments</h3>
        <p className="text-gray-600">Select assessments to assign for baseline measurement</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Select Initial Assessments *</label>
        <div className="space-y-3">
          {INITIAL_ASSESSMENTS.map((assessment) => (
            <label key={assessment.id} className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.selectedAssessments.includes(assessment.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFormData('selectedAssessments', [...formData.selectedAssessments, assessment.id])
                  } else {
                    updateFormData('selectedAssessments', formData.selectedAssessments.filter(id => id !== assessment.id))
                  }
                }}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">{assessment.name}</span>
                <p className="text-xs text-gray-600">{assessment.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Instructions for Client</label>
        <textarea
          value={formData.assessmentInstructions}
          onChange={(e) => updateFormData('assessmentInstructions', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Optional instructions for the client about completing these assessments..."
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Send className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900">Assessment Delivery</h4>
            <p className="text-sm text-green-800 mt-1">
              Selected assessments will be automatically assigned to the client and sent via WhatsApp with a secure link. 
              The client will have 7 days to complete them.
            </p>
          </div>
        </div>
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
      default: return renderStep1()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <UserPlus className="w-6 h-6 mr-2 text-blue-600" />
                Client Intake & Initial Assessment
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {renderProgressBar()}
            
            <div className="min-h-96 max-h-96 overflow-y-auto">
              {renderCurrentStep()}
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
                disabled={currentStep === 1}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentStep < 5 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!validateStep(currentStep)}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: {steps[currentStep]?.title}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!validateStep(5) || loading}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Client...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Intake
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}