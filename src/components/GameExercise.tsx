import React, { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Trophy, Target, Timer } from 'lucide-react'

interface GameExerciseProps {
  exercise: {
    id: string
    exercise_type: string
    title: string
    description: string
    game_config: any
    progress: any
    status: 'assigned' | 'in_progress' | 'completed'
  }
  onUpdateProgress: (exerciseId: string, progress: any, status: string) => void
  onClose: () => void
}

export const GameExercise: React.FC<GameExerciseProps> = ({ exercise, onUpdateProgress, onClose }) => {
  const [gameState, setGameState] = useState<any>({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const saveProgress = (newProgress: any, newStatus: string = 'in_progress') => {
    const updatedProgress = {
      ...exercise.progress,
      ...newProgress,
      lastPlayed: new Date().toISOString(),
      totalTime: (exercise.progress?.totalTime || 0) + timer
    }
    onUpdateProgress(exercise.id, updatedProgress, newStatus)
  }

  const renderBreathingExercise = () => {
    const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale')
    const [cycleCount, setCycleCount] = useState(exercise.progress?.cycles || 0)
    const [phaseTimer, setPhaseTimer] = useState(0)

    const phases = {
      inhale: { duration: 4, next: 'hold', instruction: 'Breathe In' },
      hold: { duration: 4, next: 'exhale', instruction: 'Hold' },
      exhale: { duration: 6, next: 'pause', instruction: 'Breathe Out' },
      pause: { duration: 2, next: 'inhale', instruction: 'Pause' }
    }

    useEffect(() => {
      let interval: NodeJS.Timeout
      if (isPlaying) {
        interval = setInterval(() => {
          setPhaseTimer(prev => {
            const newTime = prev + 1
            if (newTime >= phases[phase].duration) {
              const nextPhase = phases[phase].next as typeof phase
              setPhase(nextPhase)
              if (nextPhase === 'inhale') {
                setCycleCount(prev => {
                  const newCount = prev + 1
                  saveProgress({ cycles: newCount })
                  return newCount
                })
              }
              return 0
            }
            return newTime
          })
        }, 1000)
      }
      return () => clearInterval(interval)
    }, [isPlaying, phase])

    const getCircleScale = () => {
      const progress = phaseTimer / phases[phase].duration
      switch (phase) {
        case 'inhale': return 0.5 + (progress * 0.5)
        case 'hold': return 1
        case 'exhale': return 1 - (progress * 0.5)
        case 'pause': return 0.5
        default: return 0.5
      }
    }

    return (
      <div className="text-center space-y-8">
        <div className="relative w-64 h-64 mx-auto">
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 transition-transform duration-1000 ease-in-out"
            style={{ transform: `scale(${getCircleScale()})` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-2xl font-bold">{phases[phase].instruction}</div>
              <div className="text-lg">{phases[phase].duration - phaseTimer}s</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{cycleCount}</div>
            <div className="text-sm text-gray-600">Cycles</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatTime(timer)}</div>
            <div className="text-sm text-gray-600">Duration</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{Math.round((cycleCount / 10) * 100)}%</div>
            <div className="text-sm text-gray-600">Progress</div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center px-6 py-3 rounded-lg font-medium ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
            {isPlaying ? 'Pause' : 'Start'}
          </button>
          
          <button
            onClick={() => {
              setIsPlaying(false)
              setPhase('inhale')
              setPhaseTimer(0)
              setTimer(0)
            }}
            className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </button>
        </div>

        {cycleCount >= 10 && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-green-800">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Great job! You've completed the breathing exercise!</span>
            </div>
            <button
              onClick={() => saveProgress({ cycles: cycleCount, completed: true }, 'completed')}
              className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium"
            >
              Mark as Complete
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderMindfulnessExercise = () => {
    const [currentStep, setCurrentStep] = useState(0)
    const [isGuided, setIsGuided] = useState(false)
    
    const steps = [
      "Find a comfortable position and close your eyes",
      "Notice your breathing without changing it",
      "Feel the sensation of air entering your nostrils",
      "Notice any thoughts that arise, then gently return to your breath",
      "Expand your awareness to sounds around you",
      "Notice any physical sensations in your body",
      "Bring your attention back to your breath",
      "Slowly open your eyes when ready"
    ]

    useEffect(() => {
      let interval: NodeJS.Timeout
      if (isGuided && isPlaying) {
        interval = setInterval(() => {
          setCurrentStep(prev => {
            if (prev < steps.length - 1) {
              return prev + 1
            } else {
              setIsPlaying(false)
              saveProgress({ 
                sessionsCompleted: (exercise.progress?.sessionsCompleted || 0) + 1,
                totalMindfulTime: (exercise.progress?.totalMindfulTime || 0) + timer
              }, 'completed')
              return prev
            }
          })
        }, 30000) // 30 seconds per step
      }
      return () => clearInterval(interval)
    }, [isGuided, isPlaying, currentStep])

    return (
      <div className="text-center space-y-8">
        <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-8 rounded-xl">
          <div className="text-6xl mb-4">🧘‍♀️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Mindfulness Session</h3>
          <p className="text-gray-600">Take a moment to center yourself</p>
        </div>

        {isGuided && (
          <div className="bg-white p-6 rounded-lg border-2 border-purple-200">
            <div className="text-lg font-medium text-gray-800 mb-4">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="text-gray-700 mb-4">{steps[currentStep]}</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {exercise.progress?.sessionsCompleted || 0}
            </div>
            <div className="text-sm text-gray-600">Sessions</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formatTime(timer)}</div>
            <div className="text-sm text-gray-600">Duration</div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              setIsGuided(true)
              setIsPlaying(!isPlaying)
              if (!isPlaying) {
                setCurrentStep(0)
                setTimer(0)
              }
            }}
            className={`flex items-center px-6 py-3 rounded-lg font-medium ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
            {isPlaying ? 'Pause' : 'Start Guided Session'}
          </button>
          
          <button
            onClick={() => {
              setIsGuided(false)
              setIsPlaying(!isPlaying)
            }}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Timer className="w-5 h-5 mr-2" />
            Free Practice
          </button>
        </div>
      </div>
    )
  }

  const renderCognitiveRestructuring = () => {
    const [scenario, setScenario] = useState(0)
    const [userChoice, setUserChoice] = useState<string | null>(null)
    const [score, setScore] = useState(exercise.progress?.score || 0)

    const scenarios = [
      {
        situation: "You didn't get invited to a friend's party",
        thoughts: [
          { text: "They must not like me anymore", helpful: false, points: 0 },
          { text: "Maybe they forgot or thought I was busy", helpful: true, points: 10 },
          { text: "I'm not good enough to be their friend", helpful: false, points: 0 },
          { text: "I should ask them about it directly", helpful: true, points: 10 }
        ]
      },
      {
        situation: "You made a mistake at work",
        thoughts: [
          { text: "I'm terrible at my job", helpful: false, points: 0 },
          { text: "Everyone makes mistakes, I can learn from this", helpful: true, points: 10 },
          { text: "I'm going to get fired", helpful: false, points: 0 },
          { text: "I should talk to my supervisor about how to improve", helpful: true, points: 10 }
        ]
      },
      {
        situation: "Someone didn't respond to your text message",
        thoughts: [
          { text: "They're ignoring me on purpose", helpful: false, points: 0 },
          { text: "They might be busy or didn't see it", helpful: true, points: 10 },
          { text: "I must have said something wrong", helpful: false, points: 0 },
          { text: "I'll give them some time and follow up later", helpful: true, points: 10 }
        ]
      }
    ]

    const currentScenario = scenarios[scenario]

    const handleChoice = (choice: any) => {
      setUserChoice(choice.text)
      const newScore = score + choice.points
      setScore(newScore)
      
      setTimeout(() => {
        if (scenario < scenarios.length - 1) {
          setScenario(scenario + 1)
          setUserChoice(null)
        } else {
          saveProgress({ 
            score: newScore,
            scenariosCompleted: scenarios.length,
            accuracy: (newScore / (scenarios.length * 10)) * 100
          }, 'completed')
        }
      }, 2000)
    }

    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🧠</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Cognitive Restructuring</h3>
          <p className="text-gray-600">Choose the most helpful way of thinking</p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-4">Scenario {scenario + 1} of {scenarios.length}</h4>
          <p className="text-gray-700 text-lg">{currentScenario.situation}</p>
        </div>

        <div className="space-y-3">
          <h5 className="font-medium text-gray-800">How might you think about this situation?</h5>
          {currentScenario.thoughts.map((thought, index) => (
            <button
              key={index}
              onClick={() => !userChoice && handleChoice(thought)}
              disabled={!!userChoice}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                userChoice === thought.text
                  ? thought.helpful
                    ? 'bg-green-50 border-green-500 text-green-900'
                    : 'bg-red-50 border-red-500 text-red-900'
                  : userChoice
                  ? 'opacity-50 cursor-not-allowed border-gray-200'
                  : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{thought.text}</span>
                {userChoice === thought.text && (
                  <span className={`text-sm font-medium ${
                    thought.helpful ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {thought.helpful ? '✓ Helpful' : '✗ Unhelpful'}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{score}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{scenario + 1}</div>
            <div className="text-sm text-gray-600">Scenario</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((score / ((scenario + 1) * 10)) * 100) || 0}%
            </div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
        </div>

        {scenario === scenarios.length - 1 && userChoice && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
            <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-green-800 font-medium">Exercise Complete!</div>
            <div className="text-green-700 text-sm">
              Final Score: {score}/{scenarios.length * 10} ({Math.round((score / (scenarios.length * 10)) * 100)}%)
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderExercise = () => {
    switch (exercise.exercise_type) {
      case 'breathing':
        return renderBreathingExercise()
      case 'mindfulness':
        return renderMindfulnessExercise()
      case 'cognitive_restructuring':
        return renderCognitiveRestructuring()
      default:
        return <div>Exercise type not supported</div>
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{exercise.title}</h3>
                <p className="text-gray-600 mt-1">{exercise.description}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="min-h-96">
              {renderExercise()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}