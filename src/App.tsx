import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { TherapistDashboard } from './pages/TherapistDashboard'
import { ClientDashboard } from './pages/ClientDashboard'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, profile, loading, debugInfo } = useAuth()

  console.log('🎯 App render:', { 
    loading, 
    hasUser: !!user, 
    hasProfile: !!profile, 
    debugInfo,
    timestamp: new Date().toISOString()
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CogniFlow...</p>
          <p className="text-sm text-gray-500 mt-2">{debugInfo}</p>
          <div className="mt-4 p-4 bg-gray-100 rounded-lg max-w-md">
            <p className="text-xs text-gray-600 font-mono">Debug Info:</p>
            <p className="text-xs text-gray-700 font-mono">{debugInfo}</p>
            <p className="text-xs text-gray-500 font-mono mt-1">
              Time: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route 
          path="/therapist" 
          element={
            <ProtectedRoute role="therapist">
              <TherapistDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/client" 
          element={
            <ProtectedRoute role="client">
              <ClientDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/" 
          element={
            user && profile ? (
              <Navigate to={profile.role === 'therapist' ? '/therapist' : '/client'} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
      </Routes>
    </Router>
  )
}

export default App