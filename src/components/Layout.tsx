import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { LogOut, Brain } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  title: string
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { profile, signOut } = useAuth()

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
    </div>
  )
}