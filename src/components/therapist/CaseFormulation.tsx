import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { 
  Stethoscope, 
  Brain, 
  FileText, 
  Save, 
  Search,
  Plus,
  Target,
  CheckCircle,
  AlertTriangle,
  Book,
  Globe
} from 'lucide-react'

interface CaseFormulationProps {
  caseFile: any
  onUpdate: () => void
}

interface DiagnosticCode {
  code: string
  name: string
  criteria: string[]
  system: 'DSM-5-TR' | 'ICD-11'
}

const DSM5_CODES: DiagnosticCode[] = [
  {
    code: '300.02',
    name: 'Generalized Anxiety Disorder',
    system: 'DSM-5-TR',
    criteria: [
      'Excessive anxiety/worry more days than not for 6+ months',
      'Difficulty controlling worry',
      '≥3 associated symptoms (restlessness, fatigue, irritability, concentration problems, muscle tension, sleep disturbance)'
    ]
  },
  {
    code: '296.23',
    name: 'Major Depressive Disorder, Single Episode, Severe',
    system: 'DSM-5-TR',
    criteria: [
      '≥5 symptoms during 2-week period',
      'Depressed mood or loss of interest/pleasure',
      'Significant impairment in functioning',
      'Not attributable to substance use or medical condition'
    ]
  },
  {
    code: '309.81',
    name: 'Posttraumatic Stress Disorder',
    system: 'DSM-5-TR',
    criteria: [
      'Exposure to actual or threatened death, serious injury, or sexual violence',
      'Intrusion symptoms (memories, dreams, flashbacks)',
      'Avoidance of trauma-related stimuli',
      'Negative alterations in cognitions and mood',
      'Alterations in arousal and reactivity'
    ]
  }
]

const ICD11_CODES: DiagnosticCode[] = [
  {
    code: '6B00',
    name: 'Generalized Anxiety Disorder',
    system: 'ICD-11',
    criteria: [
      'Persistent worry/unease most days for several months',
      'Associated with tension, sleep disturbance, concentration difficulties',
      'Significant distress or impairment in functioning'
    ]
  },
  {
    code: '6A70',
    name: 'Single Episode Depressive Disorder',
    system: 'ICD-11',
    criteria: [
      'Depressed mood or diminished interest in activities',
      'Duration of at least 2 weeks',
      'Associated symptoms (appetite changes, sleep disturbance, fatigue, concentration problems)',
      'Significant distress or impairment'
    ]
  },
  {
    code: '6B40',
    name: 'Post Traumatic Stress Disorder',
    system: 'ICD-11',
    criteria: [
      'Exposure to extremely threatening or horrific event',
      'Re-experiencing the event in the present',
      'Deliberate avoidance of reminders',
      'Persistent perceptions of heightened current threat'
    ]
  }
]

export const CaseFormulation: React.FC<CaseFormulationProps> = ({ caseFile, onUpdate }) => {
  const [formulation, setFormulation] = useState({
    dsmCode: '',
    icdCode: '',
    diagnosticImpression: '',
    caseFormulation: '',
    maintainingFactors: '',
    treatmentRecommendations: ''
  })
  const [selectedDsmCode, setSelectedDsmCode] = useState<DiagnosticCode | null>(null)
  const [selectedIcdCode, setSelectedIcdCode] = useState<DiagnosticCode | null>(null)
  const [searchDsm, setSearchDsm] = useState('')
  const [searchIcd, setSearchIcd] = useState('')
  const [loading, setLoading] = useState(false)
  const { profile } = useAuth()

  useEffect(() => {
    fetchFormulation()
  }, [caseFile])

  const fetchFormulation = async () => {
    try {
      const { data } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('client_id', caseFile.client.id)
        .eq('therapist_id', profile!.id)
        .single()

      if (data?.notes) {
        // Parse existing formulation data if available
        try {
          const parsed = JSON.parse(data.notes)
          if (parsed.formulation) {
            setFormulation(parsed.formulation)
          }
        } catch {
          // If not JSON, treat as regular notes
        }
      }
    } catch (error) {
      console.error('Error fetching formulation:', error)
    }
  }

  const saveFormulation = async () => {
    setLoading(true)
    try {
      const formulationData = {
        formulation,
        lastUpdated: new Date().toISOString(),
        milestone: 'Goals Defined'
      }

      const { error } = await supabase
        .from('client_profiles')
        .upsert({
          client_id: caseFile.client.id,
          therapist_id: profile!.id,
          notes: JSON.stringify(formulationData),
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Log milestone
      await supabase
        .from('audit_logs')
        .insert({
          user_id: profile!.id,
          action: 'case_formulation_updated',
          resource_type: 'case',
          resource_id: caseFile.client.id,
          client_id: caseFile.client.id,
          details: {
            milestone: 'Goals Defined',
            dsm_code: formulation.dsmCode,
            icd_code: formulation.icdCode
          }
        })

      onUpdate()
      alert('Case formulation saved successfully!')
    } catch (error) {
      console.error('Error saving formulation:', error)
      alert('Error saving formulation')
    } finally {
      setLoading(false)
    }
  }

  const filteredDsmCodes = DSM5_CODES.filter(code =>
    code.name.toLowerCase().includes(searchDsm.toLowerCase()) ||
    code.code.includes(searchDsm)
  )

  const filteredIcdCodes = ICD11_CODES.filter(code =>
    code.name.toLowerCase().includes(searchIcd.toLowerCase()) ||
    code.code.includes(searchIcd)
  )

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Stethoscope className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Case Formulation & Diagnostic Impression</h3>
        </div>

        {/* Diagnostic Codes Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* DSM-5-TR */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Book className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">DSM-5-TR Diagnosis</h4>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search DSM-5-TR codes..."
                  value={searchDsm}
                  onChange={(e) => setSearchDsm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredDsmCodes.map((code) => (
                <button
                  key={code.code}
                  onClick={() => {
                    setSelectedDsmCode(code)
                    setFormulation(prev => ({ ...prev, dsmCode: `${code.code} - ${code.name}` }))
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedDsmCode?.code === code.code
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{code.code}</div>
                  <div className="text-xs text-gray-600">{code.name}</div>
                </button>
              ))}
            </div>

            {selectedDsmCode && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <h5 className="font-medium text-purple-900 mb-2">Key Criteria:</h5>
                <ul className="text-sm text-purple-800 space-y-1">
                  {selectedDsmCode.criteria.map((criterion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-purple-600">•</span>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ICD-11 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Globe className="w-5 h-5 text-teal-600" />
              <h4 className="font-semibold text-gray-900">ICD-11 Diagnosis</h4>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search ICD-11 codes..."
                  value={searchIcd}
                  onChange={(e) => setSearchIcd(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredIcdCodes.map((code) => (
                <button
                  key={code.code}
                  onClick={() => {
                    setSelectedIcdCode(code)
                    setFormulation(prev => ({ ...prev, icdCode: `${code.code} - ${code.name}` }))
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedIcdCode?.code === code.code
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{code.code}</div>
                  <div className="text-xs text-gray-600">{code.name}</div>
                </button>
              ))}
            </div>

            {selectedIcdCode && (
              <div className="mt-4 p-3 bg-teal-50 rounded-lg">
                <h5 className="font-medium text-teal-900 mb-2">Key Features:</h5>
                <ul className="text-sm text-teal-800 space-y-1">
                  {selectedIcdCode.criteria.map((criterion, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-teal-600">•</span>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Criteria Comparison Table */}
        {selectedDsmCode && selectedIcdCode && (
          <div className="mb-8">
            <h4 className="font-semibold text-gray-900 mb-4">Diagnostic Criteria Comparison</h4>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Criteria Set</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Core Requirements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-purple-900">DSM-5-TR</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{selectedDsmCode.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {selectedDsmCode.criteria.join('; ')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-teal-900">ICD-11</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{selectedIcdCode.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {selectedIcdCode.criteria.join('; ')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Formulation Fields */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnostic Impression
            </label>
            <textarea
              value={formulation.diagnosticImpression}
              onChange={(e) => setFormulation(prev => ({ ...prev, diagnosticImpression: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Summarize your diagnostic impression based on the selected criteria..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case Formulation
            </label>
            <textarea
              value={formulation.caseFormulation}
              onChange={(e) => setFormulation(prev => ({ ...prev, caseFormulation: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Link thoughts, emotions, behaviors, and maintaining factors. Describe the client's presentation in the context of their history and current circumstances..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maintaining Factors
            </label>
            <textarea
              value={formulation.maintainingFactors}
              onChange={(e) => setFormulation(prev => ({ ...prev, maintainingFactors: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="What factors are maintaining the client's difficulties? (cognitive patterns, behaviors, environmental factors, etc.)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treatment Recommendations
            </label>
            <textarea
              value={formulation.treatmentRecommendations}
              onChange={(e) => setFormulation(prev => ({ ...prev, treatmentRecommendations: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Recommended treatment approach, interventions, and therapeutic modalities..."
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={saveFormulation}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Formulation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}