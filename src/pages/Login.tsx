import React, { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Brain, Eye, EyeOff } from 'lucide-react'

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { user, profile, signIn } = useAuth()

  // Redirect if already logged in
  if (user && profile) {
    return <Navigate to={profile.role === 'therapist' ? '/therapist' : '/client'} />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome to CogniFlow</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your digital bridge in Cognitive Behavioral Therapy
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign in'
            )}
          </button>

        {/* Demo Access Section */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="text-center mb-4">
            <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
              Quick Demo Access
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-2 font-medium">👨‍⚕️ Therapist Accounts</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('dr.sarah.johnson@cogniflow.com')
                    setPassword('therapist123')
                  }}
                  className="w-full text-left px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                >
                  Dr. Sarah Johnson
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('dr.michael.chen@cogniflow.com')
                    setPassword('therapist123')
                  }}
                  className="w-full text-left px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                >
                  Dr. Michael Chen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('dr.emily.rodriguez@cogniflow.com')
                    setPassword('therapist123')
                  }}
                  className="w-full text-left px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                >
                  Dr. Emily Rodriguez
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-gray-600 mb-2 font-medium">👤 Client Accounts</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('alex.thompson@email.com')
                    setPassword('client123')
                  }}
                  className="w-full text-left px-3 py-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors"
                >
                  Alex Thompson
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('maria.garcia@email.com')
                    setPassword('client123')
                  }}
                  className="w-full text-left px-3 py-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors"
                >
                  Maria Garcia
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('james.wilson@email.com')
                    setPassword('client123')
                  }}
                  className="w-full text-left px-3 py-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors"
                >
                  James Wilson
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('lisa.brown@email.com')
                    setPassword('client123')
                  }}
                  className="w-full text-left px-3 py-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors"
                >
                  Lisa Brown
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('david.lee@email.com')
                    setPassword('client123')
                  }}
                  className="w-full text-left px-3 py-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors"
                >
                  David Lee
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('jennifer.davis@email.com')
                    setPassword('client123')
                  }}
                  className="w-full text-left px-3 py-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-md transition-colors"
                >
                  Jennifer Davis
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Click any account above to auto-fill login credentials
            </p>
          </div>
        </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}