import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import StudentProfile from './pages/StudentProfile'
import TeacherProfile from './pages/TeacherProfile'
import Resources from './pages/Resources'
import Events from './pages/Events'
import Notifications from './pages/Notifications'
import Chat from './pages/Chat'
import ChatDebug from './pages/ChatDebug'
import ChatSimple from './pages/ChatSimple'
import ChatMinimal from './pages/ChatMinimal'
import TokenDebug from './components/TokenDebug'
import AuthTest from './components/AuthTest'
import ChatTest from './components/ChatTest'
import ChatDebugComplete from './components/ChatDebugComplete'
import ComprehensiveSystemTest from './components/ComprehensiveSystemTest'
import ChatStabilityTest from './components/ChatStabilityTest'
import RoomDebugger from './components/RoomDebugger'
import MinimalRoomTest from './components/MinimalRoomTest'
import ChatContextDebugger from './components/ChatContextDebugger'
import WorkingChatDemo from './components/WorkingChatDemo'
import DirectRoomTest from './components/DirectRoomTest'
import ErrorDebugger from './components/ErrorDebugger'
import SimpleRoomTest from './components/SimpleRoomTest'
import RoomListTest from './components/RoomListTest'
import WorkingChatPage from './components/WorkingChatPage'
import { AuthProvider } from './contexts/AuthContext'
import { ChatProvider } from './contexts/ChatContext'
import './App.css'

// Import authentication monitoring for debugging
import { authMonitor } from './utils/authMonitor'

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Navbar />
          <Container fluid className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
              <Route path="/student-dashboard" element={<StudentDashboard />} />
              <Route path="/student-profile" element={<StudentProfile />} />
              <Route path="/teacher-profile" element={<TeacherProfile />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/events" element={<Events />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat-debug" element={<ChatDebug />} />
              <Route path="/chat-simple" element={<ChatSimple />} />
              <Route path="/chat-minimal" element={<ChatMinimal />} />
              <Route path="/token-debug" element={<TokenDebug />} />
              <Route path="/auth-test" element={<AuthTest />} />
              <Route path="/chat-test" element={<ChatTest />} />
              <Route path="/chat-debug-complete" element={<ChatDebugComplete />} />
              <Route path="/system-test" element={<ComprehensiveSystemTest />} />
              <Route path="/chat-stability" element={<ChatStabilityTest />} />
              <Route path="/room-debug" element={<RoomDebugger />} />
              <Route path="/minimal-room-test" element={<MinimalRoomTest />} />
              <Route path="/chat-context-debug" element={<ChatContextDebugger />} />
              <Route path="/working-chat-demo" element={
                <ChatProvider>
                  <WorkingChatDemo />
                </ChatProvider>
              } />
              <Route path="/direct-room-test" element={<DirectRoomTest />} />
              <Route path="/error-debug" element={
                <ChatProvider>
                  <ErrorDebugger />
                </ChatProvider>
              } />
              <Route path="/simple-room-test" element={<SimpleRoomTest />} />
              <Route path="/roomlist-test" element={<RoomListTest />} />
              <Route path="/working-chat" element={<WorkingChatPage />} />
            </Routes>
          </Container>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
