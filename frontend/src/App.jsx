import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import ApiTestPage from './pages/ApiTestPage'
import PasswordTestPage from './pages/PasswordTestPage'
import Dashboard from './pages/Dashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import StudentProfile from './pages/StudentProfile'
import TeacherProfile from './pages/TeacherProfile'
import Resources from './pages/Resources'
import Events from './pages/Events'
import Notifications from './pages/Notifications'
import Chat from './pages/Chat'
import ChatRoom from './pages/ChatRoom'
import WorkingChatPage from './components/WorkingChatPage'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Navbar />
          <Container fluid className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />
              <Route path="/api-test" element={<ApiTestPage />} />
              <Route path="/password-test" element={<PasswordTestPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              <Route path="/student-profile" element={<StudentProfile />} />
              <Route path="/teacher-profile" element={<TeacherProfile />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/events" element={<Events />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat-room/:roomId" element={<ChatRoom />} />
              <Route path="/working-chat" element={<WorkingChatPage />} />
            </Routes>
          </Container>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
