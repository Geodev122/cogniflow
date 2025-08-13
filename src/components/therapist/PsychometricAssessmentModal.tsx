import React, { useState } from 'react'
import { X, Brain, Calculator, FileText, CheckCircle, ClipboardList } from 'lucide-react'

interface PsychometricAssessment {
  name: string
  abbreviation: string
  description: string
  questions: Array<{
    id: string
    text: string
    type: 'scale' | 'multiple_choice'
    options?: string[]
    scale_min?: number
    scale_max?: number
    reverse_scored?: boolean
  }>
  scoring: {
    method: 'sum' | 'average' | 'weighted'
    max_score: number
    interpretation_ranges: Array<{
      min: number
      max: number
      label: string
      description: string
    }>
  }
}

const PSYCHOMETRIC_ASSESSMENTS: PsychometricAssessment[] = [
  {
    name: "Patient Health Questionnaire-9",
    abbreviation: "PHQ-9",
    description: "Measures severity of depression symptoms over the past two weeks",
    questions: [
      {
        id: "phq9_1",
        text: "Little interest or pleasure in doing things",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "phq9_2",
        text: "Feeling down, depressed, or hopeless",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "phq9_3",
        text: "Trouble falling or staying asleep, or sleeping too much",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "phq9_4",
        text: "Feeling tired or having little energy",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "phq9_5",
        text: "Poor appetite or overeating",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "phq9_6",
        text: "Feeling bad about yourself or that you are a failure",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "phq9_7",
        text: "Trouble concentrating on things",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "phq9_8",
        text: "Moving or speaking slowly, or being fidgety/restless",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "phq9_9",
        text: "Thoughts that you would be better off dead or hurting yourself",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      }
    ],
    scoring: {
      method: "sum",
      max_score: 27,
      interpretation_ranges: [
        { min: 0, max: 4, label: "Minimal Depression", description: "No or minimal depression symptoms" },
        { min: 5, max: 9, label: "Mild Depression", description: "Mild depression symptoms" },
        { min: 10, max: 14, label: "Moderate Depression", description: "Moderate depression symptoms" },
        { min: 15, max: 19, label: "Moderately Severe Depression", description: "Moderately severe depression symptoms" },
        { min: 20, max: 27, label: "Severe Depression", description: "Severe depression symptoms" }
      ]
    }
  },
  {
    name: "Generalized Anxiety Disorder-7",
    abbreviation: "GAD-7",
    description: "Measures severity of generalized anxiety disorder symptoms",
    questions: [
      {
        id: "gad7_1",
        text: "Feeling nervous, anxious, or on edge",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "gad7_2",
        text: "Not being able to stop or control worrying",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "gad7_3",
        text: "Worrying too much about different things",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "gad7_4",
        text: "Trouble relaxing",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "gad7_5",
        text: "Being so restless that it's hard to sit still",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "gad7_6",
        text: "Becoming easily annoyed or irritable",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "gad7_7",
        text: "Feeling afraid as if something awful might happen",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      }
    ],
    scoring: {
      method: "sum",
      max_score: 21,
      interpretation_ranges: [
        { min: 0, max: 4, label: "Minimal Anxiety", description: "No or minimal anxiety symptoms" },
        { min: 5, max: 9, label: "Mild Anxiety", description: "Mild anxiety symptoms" },
        { min: 10, max: 14, label: "Moderate Anxiety", description: "Moderate anxiety symptoms" },
        { min: 15, max: 21, label: "Severe Anxiety", description: "Severe anxiety symptoms" }
      ]
    }
  },
  {
    name: "Beck Depression Inventory-II",
    abbreviation: "BDI-II",
    description: "Measures severity of depression symptoms in adolescents and adults",
    questions: [
      {
        id: "bdi_1",
        text: "Sadness",
        type: "multiple_choice",
        options: [
          "I do not feel sad",
          "I feel sad much of the time",
          "I am sad all the time",
          "I am so sad or unhappy that I can't stand it"
        ]
      },
      {
        id: "bdi_2",
        text: "Pessimism",
        type: "multiple_choice",
        options: [
          "I am not discouraged about my future",
          "I feel more discouraged about my future than I used to be",
          "I do not expect things to work out for me",
          "I feel my future is hopeless and will only get worse"
        ]
      },
      {
        id: "bdi_3",
        text: "Past Failure",
        type: "multiple_choice",
        options: [
          "I do not feel like a failure",
          "I have failed more than I should have",
          "As I look back, I see a lot of failures",
          "I feel I am a total failure as a person"
        ]
      },
      {
        id: "bdi_4",
        text: "Loss of Pleasure",
        type: "multiple_choice",
        options: [
          "I get as much pleasure as I ever did from things I enjoy",
          "I don't enjoy things as much as I used to",
          "I get very little pleasure from things I used to enjoy",
          "I can't get any pleasure from things I used to enjoy"
        ]
      },
      {
        id: "bdi_5",
        text: "Guilty Feelings",
        type: "multiple_choice",
        options: [
          "I don't feel particularly guilty",
          "I feel guilty over many things I have done or should have done",
          "I feel quite guilty most of the time",
          "I feel guilty all of the time"
        ]
      }
    ],
    scoring: {
      method: "sum",
      max_score: 63,
      interpretation_ranges: [
        { min: 0, max: 13, label: "Minimal Depression", description: "These ups and downs are considered normal" },
        { min: 14, max: 19, label: "Mild Depression", description: "Mild mood disturbance" },
        { min: 20, max: 28, label: "Moderate Depression", description: "Moderate depression" },
        { min: 29, max: 63, label: "Severe Depression", description: "Severe depression" }
      ]
    }
  },
  {
    name: "Beck Anxiety Inventory",
    abbreviation: "BAI",
    description: "Measures severity of anxiety symptoms",
    questions: [
      {
        id: "bai_1",
        text: "Numbness or tingling",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "bai_2",
        text: "Feeling hot",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "bai_3",
        text: "Wobbliness in legs",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "bai_4",
        text: "Unable to relax",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      },
      {
        id: "bai_5",
        text: "Fear of worst happening",
        type: "scale",
        scale_min: 0,
        scale_max: 3
      }
    ],
    scoring: {
      method: "sum",
      max_score: 63,
      interpretation_ranges: [
        { min: 0, max: 7, label: "Minimal Anxiety", description: "Normal anxiety levels" },
        { min: 8, max: 15, label: "Mild Anxiety", description: "Mild anxiety symptoms" },
        { min: 16, max: 25, label: "Moderate Anxiety", description: "Moderate anxiety symptoms" },
        { min: 26, max: 63, label: "Severe Anxiety", description: "Severe anxiety symptoms" }
      ]
    }
  },
  {
    name: "Perceived Stress Scale",
    abbreviation: "PSS-10",
    description: "Measures the degree to which situations are appraised as stressful",
    questions: [
      {
        id: "pss_1",
        text: "How often have you been upset because of something that happened unexpectedly?",
        type: "scale",
        scale_min: 0,
        scale_max: 4
      },
      {
        id: "pss_2",
        text: "How often have you felt that you were unable to control important things in your life?",
        type: "scale",
        scale_min: 0,
        scale_max: 4
      },
      {
        id: "pss_3",
        text: "How often have you felt nervous and stressed?",
        type: "scale",
        scale_min: 0,
        scale_max: 4
      },
      {
        id: "pss_4",
        text: "How often have you felt confident about your ability to handle personal problems?",
        type: "scale",
        scale_min: 0,
        scale_max: 4,
        reverse_scored: true
      },
      {
        id: "pss_5",
        text: "How often have you felt that things were going your way?",
        type: "scale",
        scale_min: 0,
        scale_max: 4,
        reverse_scored: true
      }
    ],
    scoring: {
      method: "sum",
      max_score: 40,
      interpretation_ranges: [
        { min: 0, max: 13, label: "Low Stress", description: "Low perceived stress levels" },
        { min: 14, max: 26, label: "Moderate Stress", description: "Moderate perceived stress levels" },
        { min: 27, max: 40, label: "High Stress", description: "High perceived stress levels" }
      ]
    }
  },
  {
    name: "PTSD Checklist for DSM-5",
    abbreviation: "PCL-5",
    description: "Measures PTSD symptoms according to DSM-5 criteria",
    questions: [
      {
        id: "pcl5_1",
        text: "Repeated, disturbing, and unwanted memories of the stressful experience",
        type: "scale",
        scale_min: 0,
        scale_max: 4
      },
      {
        id: "pcl5_2",
        text: "Repeated, disturbing dreams of the stressful experience",
        type: "scale",
        scale_min: 0,
        scale_max: 4
      },
      {
        id: "pcl5_3",
        text: "Suddenly feeling or acting as if the stressful experience were actually happening again",
        type: "scale",
        scale_min: 0,
        scale_max: 4
      },
      {
        id: "pcl5_4",
        text: "Feeling very upset when something reminded you of the stressful experience",
        type: "scale",
        scale_min: 0,
        scale_max: 4
      },
      {
        id: "pcl5_5",
        text: "Having strong physical reactions when something reminded you of the stressful experience",
        type: "scale",
        scale_min: 0,
        scale_max: 4
      }
    ],
    scoring: {
      method: "sum",
      max_score: 80,
      interpretation_ranges: [
        { min: 0, max: 32, label: "No PTSD", description: "Symptoms below clinical threshold" },
        { min: 33, max: 80, label: "Probable PTSD", description: "Symptoms suggest probable PTSD diagnosis" }
      ]
    }
  },
  {
    name: "Maslach Burnout Inventory",
    abbreviation: "MBI",
    description: "Measures burnout in three dimensions: emotional exhaustion, depersonalization, and personal accomplishment",
    questions: [
      {
        id: "mbi_1",
        text: "I feel emotionally drained from my work",
        type: "scale",
        scale_min: 0,
        scale_max: 6
      },
      {
        id: "mbi_2",
        text: "I have accomplished many worthwhile things in this job",
        type: "scale",
        scale_min: 0,
        scale_max: 6,
        reverse_scored: true
      },
      {
        id: "mbi_3",
        text: "I don't really care what happens to some recipients",
        type: "scale",
        scale_min: 0,
        scale_max: 6
      },
      {
        id: "mbi_4",
        text: "Working with people all day is really a strain for me",
        type: "scale",
        scale_min: 0,
        scale_max: 6
      },
      {
        id: "mbi_5",
        text: "I deal very effectively with the problems of recipients",
        type: "scale",
        scale_min: 0,
        scale_max: 6,
        reverse_scored: true
      }
    ],
    scoring: {
      method: "sum",
      max_score: 132,
      interpretation_ranges: [
        { min: 0, max: 44, label: "Low Burnout", description: "Low levels of burnout symptoms" },
        { min: 45, max: 88, label: "Moderate Burnout", description: "Moderate levels of burnout symptoms" },
        { min: 89, max: 132, label: "High Burnout", description: "High levels of burnout symptoms" }
      ]
    }
  },
  {
    name: "Connor-Davidson Resilience Scale",
    abbreviation: "CD-RISC-10",
    description: "Measures resilience and ability to cope with adversity",
    questions: [
      {
        id: "cdrisc_1",
        text: "I am able to adapt when changes occur",
        type: "scale",
        scale_min: 0,
        scale_max: 4
      },
      {
        id: "cdrisc_2",
        text: "I have at least one close and secure relationship that helps me when I am stressed",
        type: "scale",
        scale_min: 0,
        scale_max: 4
      },
      {
        id: "cdrisc_3",
        text: "When there are no clear solutions to my problems, sometimes fate or God can help",
        type: "scale",
        scale_min: 0,
        scale_max: 4
      },
      {
        id: "cdrisc_4",
        text: "I can deal with whatever comes my way",
        type: "scale",
        scale_min: 0,
        scale_max: 4
      },
      {
        id: "cdrisc_5",
        text: "Past successes give me confidence in dealing with new challenges",
        type: "scale",
        scale_min: 0,
        scale_max: 4
      }
    ],
    scoring: {
      method: "sum",
      max_score: 40,
      interpretation_ranges: [
        { min: 0, max: 20, label: "Low Resilience", description: "Lower resilience levels" },
        { min: 21, max: 30, label: "Moderate Resilience", description: "Moderate resilience levels" },
        { min: 31, max: 40, label: "High Resilience", description: "High resilience levels" }
      ]
    }
  },
  {
    name: "Satisfaction with Life Scale",
    abbreviation: "SWLS",
    description: "Measures global cognitive judgments of satisfaction with one's life",
    questions: [
      {
        id: "swls_1",
        text: "In most ways my life is close to my ideal",
        type: "scale",
        scale_min: 1,
        scale_max: 7
      },
      {
        id: "swls_2",
        text: "The conditions of my life are excellent",
        type: "scale",
        scale_min: 1,
        scale_max: 7
      },
      {
        id: "swls_3",
        text: "I am satisfied with my life",
        type: "scale",
        scale_min: 1,
        scale_max: 7
      },
      {
        id: "swls_4",
        text: "So far I have gotten the important things I want in life",
        type: "scale",
        scale_min: 1,
        scale_max: 7
      },
      {
        id: "swls_5",
        text: "If I could live my life over, I would change almost nothing",
        type: "scale",
        scale_min: 1,
        scale_max: 7
      }
    ],
    scoring: {
      method: "sum",
      max_score: 35,
      interpretation_ranges: [
        { min: 5, max: 9, label: "Extremely Dissatisfied", description: "Extremely dissatisfied with life" },
        { min: 10, max: 14, label: "Dissatisfied", description: "Dissatisfied with life" },
        { min: 15, max: 19, label: "Slightly Dissatisfied", description: "Slightly below neutral in life satisfaction" },
        { min: 20, max: 24, label: "Neutral", description: "Neutral point on the scale" },
        { min: 25, max: 29, label: "Satisfied", description: "Satisfied with life" },
        { min: 30, max: 35, label: "Extremely Satisfied", description: "Extremely satisfied with life" }
      ]
    }
  },
  {
    name: "Mindful Attention Awareness Scale",
    abbreviation: "MAAS",
    description: "Measures dispositional mindfulness",
    questions: [
      {
        id: "maas_1",
        text: "I could be experiencing some emotion and not be conscious of it until some time later",
        type: "scale",
        scale_min: 1,
        scale_max: 6
      },
      {
        id: "maas_2",
        text: "I break or spill things because of carelessness, not paying attention, or thinking of something else",
        type: "scale",
        scale_min: 1,
        scale_max: 6
      },
      {
        id: "maas_3",
        text: "I find it difficult to stay focused on what's happening in the present",
        type: "scale",
        scale_min: 1,
        scale_max: 6
      },
      {
        id: "maas_4",
        text: "I tend to walk quickly to get where I'm going without paying attention to what I experience along the way",
        type: "scale",
        scale_min: 1,
        scale_max: 6
      },
      {
        id: "maas_5",
        text: "I tend not to notice feelings of physical tension or discomfort until they really grab my attention",
        type: "scale",
        scale_min: 1,
        scale_max: 6
      }
    ],
    scoring: {
      method: "average",
      max_score: 6,
      interpretation_ranges: [
        { min: 1, max: 3, label: "Low Mindfulness", description: "Lower levels of mindful awareness" },
        { min: 3.1, max: 4.5, label: "Moderate Mindfulness", description: "Moderate levels of mindful awareness" },
        { min: 4.6, max: 6, label: "High Mindfulness", description: "High levels of mindful awareness" }
      ]
    }
  }
]

interface PsychometricAssessmentModalProps {
  onClose: () => void
  onComplete: (assessmentData: any) => void
}

export const PsychometricAssessmentModal: React.FC<PsychometricAssessmentModalProps> = ({ onClose, onComplete }) => {
  const [selectedAssessment, setSelectedAssessment] = useState<PsychometricAssessment | null>(null)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [currentStep, setCurrentStep] = useState<'select' | 'administer' | 'results'>('select')
  const [results, setResults] = useState<any>(null)

  const handleAssessmentSelect = (assessment: PsychometricAssessment) => {
    setSelectedAssessment(assessment)
    setCurrentStep('administer')
    setResponses({})
  }

  const handleResponse = (questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }))
  }

  const calculateScore = () => {
    if (!selectedAssessment) return null

    let totalScore = 0
    
    selectedAssessment.questions.forEach(question => {
      const response = responses[question.id] || 0
      if (question.reverse_scored) {
        const maxValue = question.scale_max || 4
        totalScore += maxValue - response
      } else {
        totalScore += response
      }
    })

    if (selectedAssessment.scoring.method === 'average') {
      totalScore = totalScore / selectedAssessment.questions.length
    }

    const interpretation = selectedAssessment.scoring.interpretation_ranges.find(
      range => totalScore >= range.min && totalScore <= range.max
    )

    const narrativeReport = generateNarrativeReport(selectedAssessment, totalScore, interpretation)

    return {
      score: Math.round(totalScore * 100) / 100,
      maxScore: selectedAssessment.scoring.max_score,
      interpretation: interpretation?.label || 'Unknown',
      description: interpretation?.description || 'No interpretation available',
      narrativeReport
    }
  }

  const generateNarrativeReport = (assessment: PsychometricAssessment, score: number, interpretation: any) => {
    const date = new Date().toLocaleDateString()
    const percentile = Math.round((score / assessment.scoring.max_score) * 100)
    
    let report = `Assessment: ${assessment.name} (${assessment.abbreviation})\n`
    report += `Date: ${date}\n`
    report += `Score: ${score}/${assessment.scoring.max_score} (${percentile}%)\n`
    report += `Interpretation: ${interpretation?.label || 'Unknown'}\n\n`
    
    report += `Clinical Summary:\n`
    report += `The client completed the ${assessment.name}, which ${assessment.description.toLowerCase()}. `
    report += `The obtained score of ${score} falls within the "${interpretation?.label}" range, indicating ${interpretation?.description?.toLowerCase()}.\n\n`
    
    if (assessment.abbreviation === 'PHQ-9' && score >= 10) {
      report += `Clinical Considerations: The score suggests clinically significant depressive symptoms that may warrant further evaluation and treatment planning.\n`
    } else if (assessment.abbreviation === 'GAD-7' && score >= 10) {
      report += `Clinical Considerations: The score indicates clinically significant anxiety symptoms that may benefit from therapeutic intervention.\n`
    } else if (assessment.abbreviation === 'PCL-5' && score >= 33) {
      report += `Clinical Considerations: The score suggests probable PTSD and warrants comprehensive trauma assessment.\n`
    }
    
    report += `\nRecommendations: Continue monitoring symptoms and consider appropriate therapeutic interventions based on clinical presentation and client needs.`
    
    return report
  }

  const handleComplete = () => {
    const calculatedResults = calculateScore()
    if (calculatedResults && selectedAssessment) {
      setResults(calculatedResults)
      setCurrentStep('results')
    }
  }

  const handleSave = () => {
    if (results && selectedAssessment) {
      onComplete({
        name: selectedAssessment.name,
        abbreviation: selectedAssessment.abbreviation,
        score: results.score,
        maxScore: results.maxScore,
        interpretation: results.interpretation,
        narrativeReport: results.narrativeReport,
        responses
      })
    }
  }

  const isComplete = selectedAssessment?.questions.every(q => responses[q.id] !== undefined)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Brain className="w-6 h-6 mr-2 text-blue-600" />
                Psychometric Assessment
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {currentStep === 'select' && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <p className="text-gray-600 mb-4">Select a psychometric assessment to administer:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PSYCHOMETRIC_ASSESSMENTS.map((assessment) => (
                    <div
                      key={assessment.abbreviation}
                      onClick={() => handleAssessmentSelect(assessment)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
                    >
                      <h4 className="font-semibold text-gray-900">{assessment.name}</h4>
                      <p className="text-sm text-blue-600 font-medium">{assessment.abbreviation}</p>
                      <p className="text-sm text-gray-600 mt-2">{assessment.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">{assessment.questions.length} questions</span>
                        <span className="text-xs text-gray-500">Max: {assessment.scoring.max_score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 'administer' && selectedAssessment && (
              <div className="space-y-6 max-h-96 overflow-y-auto">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900">{selectedAssessment.name}</h4>
                  <p className="text-sm text-blue-700">{selectedAssessment.description}</p>
                </div>

                {selectedAssessment.questions.map((question, index) => (
                  <div key={question.id} className="border-b border-gray-200 pb-4">
                    <h5 className="font-medium text-gray-900 mb-3">
                      {index + 1}. {question.text}
                    </h5>
                    
                    {question.type === 'scale' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Not at all ({question.scale_min})</span>
                          <span>Extremely ({question.scale_max})</span>
                        </div>
                        <div className="flex space-x-2">
                          {Array.from({ length: (question.scale_max || 4) - (question.scale_min || 0) + 1 }, (_, i) => {
                            const value = (question.scale_min || 0) + i
                            return (
                              <button
                                key={value}
                                onClick={() => handleResponse(question.id, value)}
                                className={`w-12 h-12 rounded-full border-2 font-medium transition-all ${
                                  responses[question.id] === value
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                }`}
                              >
                                {value}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {question.type === 'multiple_choice' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <button
                            key={optionIndex}
                            onClick={() => handleResponse(question.id, optionIndex)}
                            className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                              responses[question.id] === optionIndex
                                ? 'bg-blue-50 border-blue-500 text-blue-900'
                                : 'bg-white border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                responses[question.id] === optionIndex ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                              }`}>
                                {responses[question.id] === optionIndex && (
                                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                )}
                              </div>
                              <span className="text-sm">{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {currentStep === 'results' && results && selectedAssessment && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <h4 className="text-lg font-semibold text-green-900">Assessment Complete</h4>
                      <p className="text-green-700">{selectedAssessment.name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{results.score}</div>
                      <div className="text-sm text-green-700">Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{Math.round((results.score / results.maxScore) * 100)}%</div>
                      <div className="text-sm text-blue-700">Percentile</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{results.interpretation}</div>
                      <div className="text-sm text-purple-700">Interpretation</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Narrative Report
                  </h5>
                  <div className="text-sm text-gray-700 whitespace-pre-line max-h-48 overflow-y-auto">
                    {results.narrativeReport}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
            {currentStep === 'select' && (
              <button
                onClick={onClose}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            )}
            
            {currentStep === 'administer' && (
              <>
                <button
                  onClick={handleComplete}
                  disabled={!isComplete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Score
                </button>
                <button
                  onClick={() => setCurrentStep('select')}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Back
                </button>
              </>
            )}
            
            {currentStep === 'results' && (
              <>
                <button
                  onClick={handleSave}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save to Case File
                </button>
                <button
                  onClick={() => setCurrentStep('select')}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  New Assessment
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}