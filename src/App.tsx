import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './hooks/useAuth'

// Lazy load dashboard components
const TherapistDashboard = React.lazy(() => import('./pages/TherapistDashboard').then(module => ({ default: module.TherapistDashboard })))
const ClientDashboard = React.lazy(() => import('./pages/ClientDashboard').then(module => ({ default: module.ClientDashboard })))

function App() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CogniFlow...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
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
      </React.Suspense>
    </Router>
  )
}

export default App