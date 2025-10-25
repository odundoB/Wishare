import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Alert, Spinner, Modal, Pagination, Badge, Nav } from 'react-bootstrap'
import { 
  getResources, uploadResource, deleteResource, downloadResource, searchResources 
} from '../services/resources'
import { useAuth } from '../contexts/AuthContext'
import ResourceCard from '../components/ResourceCard'
import ResourceUploadModal from '../components/ResourceUploadModal'
import ResourceFilters from '../components/ResourceFilters'
import ResourceStats from '../components/ResourceStats'
import '../styles/ResourceDashboard.css'

// Animated Counter Component
const AnimatedCounter = ({ targetValue, duration = 2000 }) => {
  const [currentValue, setCurrentValue] = useState(0)
  
  useEffect(() => {
    const startValue = 0
    const increment = targetValue / (duration / 16) // 60 FPS
    let current = startValue
    
    const timer = setInterval(() => {
      current += increment
      if (current >= targetValue) {
        setCurrentValue(targetValue)
        clearInterval(timer)
      } else {
        setCurrentValue(Math.floor(current))
      }
    }, 16)
    
    return () => clearInterval(timer)
  }, [targetValue, duration])
  
  return <span>{currentValue.toLocaleString()}</span>
}

// Dynamic Greeting Component
const DynamicGreeting = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  
  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours()
    const day = currentTime.toLocaleDateString('en-US', { weekday: 'long' })
    
    if (hour < 12) {
      return { emoji: '🌅', message: `Good Morning! Ready to start this ${day} with some learning?` }
    } else if (hour < 17) {
      return { emoji: '☀️', message: `Good Afternoon! Perfect time to explore new resources this ${day}!` }
    } else {
      return { emoji: '🌙', message: `Good Evening! Wind down this ${day} with some knowledge!` }
    }
  }
  
  const { emoji, message } = getTimeBasedGreeting()
  
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '15px',
      padding: '20px',
      color: 'white',
      textAlign: 'center',
      margin: '20px 0'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{emoji}</div>
      <h5 style={{ fontWeight: '600', marginBottom: '10px' }}>{message}</h5>
      <div style={{ opacity: '0.9', fontSize: '0.9rem' }}>
        {currentTime.toLocaleTimeString()} • {currentTime.toLocaleDateString()}
      </div>
    </div>
  )
}

const Resources = () => {
  const { user } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedFormLevel, setSelectedFormLevel] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [uploading, setUploading] = useState(false)

  // New state for dashboard view
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard' or 'form-resources'
  const [activeFormLevel, setActiveFormLevel] = useState('')
  const [formCounts, setFormCounts] = useState({
    form1: 0,
    form2: 0,
    form3: 0,
    form4: 0,
    other: 0
  })

  // Form level configurations
  const formLevels = [
    {
      key: 'form1',
      label: 'Form 1 Resources',
      shortLabel: 'Form 1',
      icon: '1️⃣',
      color: 'success',
      gradient: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
      description: 'Educational resources for Form 1 students'
    },
    {
      key: 'form2',
      label: 'Form 2 Resources',
      shortLabel: 'Form 2',
      icon: '2️⃣',
      color: 'info',
      gradient: 'linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%)',
      description: 'Educational resources for Form 2 students'
    },
    {
      key: 'form3',
      label: 'Form 3 Resources',
      shortLabel: 'Form 3',
      icon: '3️⃣',
      color: 'warning',
      gradient: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
      description: 'Educational resources for Form 3 students'
    },
    {
      key: 'form4',
      label: 'Form 4 Resources',
      shortLabel: 'Form 4',
      icon: '4️⃣',
      color: 'danger',
      gradient: 'linear-gradient(135deg, #dc3545 0%, #e83e8c 100%)',
      description: 'Educational resources for Form 4 students'
    },
    {
      key: 'other',
      label: 'Other Resources',
      shortLabel: 'General',
      icon: '📁',
      color: 'secondary',
      gradient: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
      description: 'General educational resources and materials'
    }
  ]


  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchFormCounts()
    } else {
      fetchResources()
    }
  }, [currentView, currentPage, selectedSubject, selectedType, selectedFormLevel, sortBy, sortOrder, searchQuery])

  const fetchFormCounts = async () => {
    try {
      setLoading(true)
      const counts = {}
      
      // Fetch count for each form level
      for (const form of formLevels) {
        const params = {
          form_level: form.key,
          page_size: 1 // We only need the count, not the actual resources
        }
        const response = await getResources(params)
        counts[form.key] = response.data.count || (response.data.results ? response.data.results.length : 0)
      }
      
      setFormCounts(counts)
    } catch (err) {
      console.error('Error fetching form counts:', err)
      setError('Failed to load resource counts')
    } finally {
      setLoading(false)
    }
  }

  const handleFormLevelClick = (formLevel) => {
    setActiveFormLevel(formLevel)
    setSelectedFormLevel(formLevel)
    setCurrentView('form-resources')
    setCurrentPage(1) // Reset to first page
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setActiveFormLevel('')
    setSelectedFormLevel('')
    setSearchQuery('')
    setSelectedSubject('')
    setSelectedType('')
  }

  const fetchResources = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        subject: selectedSubject,
        resource_type: selectedType,
        form_level: selectedFormLevel,
        ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
        search: searchQuery
      }
      
      const response = await getResources(params)
      setResources(response.data.results || response.data)
      setTotalPages(response.data.total_pages || 1)
      setTotalCount(response.data.count || response.data.length)
    } catch (err) {
      setError('Failed to load resources: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchResources()
  }

  const handleUpload = async (formData, onProgress) => {
    try {
      setUploading(true)
      setError('')

      const uploadFormData = new FormData()
      uploadFormData.append('title', formData.title)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('subject', formData.subject)
      uploadFormData.append('form_level', formData.form_level)
      // uploadFormData.append('resource_type', formData.resource_type) // Not needed by backend
      uploadFormData.append('is_public', formData.is_public.toString())

      if (formData.resource_type === 'file' && formData.file) {
        uploadFormData.append('file', formData.file)
      } else if (formData.resource_type === 'url' && formData.url) {
        uploadFormData.append('url', formData.url)
      }

      // Upload resource with form data and progress callback
      await uploadResource(uploadFormData, onProgress)
      setShowUploadModal(false)
      fetchResources()
    } catch (err) {
      console.error('Upload error:', err)
      console.error('Error response:', err.response?.data)
      setError('Upload failed: ' + (err.response?.data?.detail || err.message))
      throw err // Re-throw to let modal handle error display
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteResource(selectedResource.id)
      setShowDeleteModal(false)
      setSelectedResource(null)
      fetchResources()
    } catch (err) {
      console.error('Delete error:', err)
      console.error('Error response:', err.response?.data)
      setError('Delete failed: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleDownload = async (resource) => {
    try {
      if (resource.resource_type === 'file') {
        // Show loading state
        setError('')
        
        await downloadResource(resource.id)
        
        // Increment download count locally
        setResources(prev => prev.map(r => 
          r.id === resource.id ? { ...r, download_count: r.download_count + 1 } : r
        ))
        
        // Show success message
        setError('Download started successfully!')
        setTimeout(() => setError(''), 3000)
        
      } else if (resource.resource_type === 'url') {
        window.open(resource.url, '_blank')
      }
    } catch (err) {
      console.error('Download error:', err)
      setError('Download failed: ' + (err.response?.data?.detail || err.message))
    }
  }


  const canEditResource = (resource) => {
    return user && (user.id === resource.uploaded_by_id || user.is_staff)
  }

  const canDeleteResource = (resource) => {
    // Teachers can delete any resource, admins can delete any resource, users can only delete their own
    const canDelete = user && (
      user.is_staff || 
      (user.role === 'teacher') || 
      (user.id === resource.uploaded_by_id)
    )
    
    // Check delete permissions
    
    return canDelete
  }

  // Dashboard view - Form Level Cards
  const renderDashboard = () => (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center dashboard-header">
            <div>
              <h1 className="mb-1" style={{ fontWeight: '700', color: '#2c3e50' }}>
                📚 Wishare Resources
              </h1>
              <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>
                Access organized learning materials by form level
              </p>
            </div>
            {user && (user.role === 'teacher' || user.role === 'admin') && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowUploadModal(true)}
                className="shadow-sm"
                style={{
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontWeight: '600'
                }}
              >
                ➕ Upload New Resource
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="shadow-sm">
          ⚠️ {error}
        </Alert>
      )}

      {/* Form Level Cards */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" size="lg">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3" style={{ fontSize: '1.1rem' }}>Loading resource categories...</p>
        </div>
      ) : (
        <Row className="g-4">
          {formLevels.map((form, index) => (
            <Col key={form.key} xs={12} sm={6} md={4} lg={index === 4 ? 12 : 3} xl={index === 4 ? 6 : 3}>
              <Card 
                className="h-100 shadow-sm border-0 resource-form-card"
                style={{
                  background: form.gradient,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  color: 'white'
                }}
                onClick={() => handleFormLevelClick(form.key)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'
                }}
              >
                <Card.Body className="text-center p-4">
                  <div 
                    className="mb-3"
                    style={{ 
                      fontSize: '4rem',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {form.icon}
                  </div>
                  <h3 className="mb-2" style={{ fontWeight: '700', fontSize: '1.4rem' }}>
                    {form.shortLabel}
                  </h3>
                  <p className="mb-3" style={{ opacity: 0.9, fontSize: '0.95rem' }}>
                    {form.description}
                  </p>
                  <div className="d-flex justify-content-center align-items-center mb-3">
                    <Badge 
                      bg="light" 
                      text="dark" 
                      className="px-3 py-2"
                      style={{ 
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        borderRadius: '20px'
                      }}
                    >
                      {formCounts[form.key] || 0} Resources
                    </Badge>
                  </div>
                  <Button 
                    variant="light" 
                    className="w-100 fw-bold"
                    style={{
                      borderRadius: '25px',
                      padding: '10px',
                      border: 'none',
                      color: '#2c3e50'
                    }}
                  >
                    📖 Explore Resources →
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Educational Inspiration Section */}
      <Row className="mt-5 mb-4">
        <Col xs={12} lg={6}>
          <Card className="border-0 shadow-sm h-100 inspiration-card" style={{ 
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <Card.Body className="p-4 d-flex flex-column justify-content-center text-center">
              <div className="floating-emoji" style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                🎨
              </div>
              <h4 style={{ fontWeight: '700', marginBottom: '1rem' }}>
                "Education is the most powerful weapon which you can use to change the world."
              </h4>
              <p style={{ opacity: 0.9, fontSize: '1rem', fontStyle: 'italic' }}>
                - Nelson Mandela
              </p>
              <div className="mt-3">
                <div style={{ 
                  width: '60px', 
                  height: '3px', 
                  background: 'rgba(255,255,255,0.5)', 
                  margin: '0 auto',
                  borderRadius: '2px'
                }}></div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} lg={6} className="mt-3 mt-lg-0">
          <Card className="border-0 shadow-sm h-100 inspiration-card" style={{ 
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <Card.Body className="p-4 d-flex flex-column justify-content-center">
              <Row className="align-items-center h-100">
                <Col xs={4} className="text-center">
                  <div className="floating-emoji" style={{ fontSize: '5rem' }}>
                    📚
                  </div>
                </Col>
                <Col xs={8}>
                  <h5 style={{ fontWeight: '700', marginBottom: '1rem' }}>
                    Learning Never Stops
                  </h5>
                  <p style={{ opacity: 0.9, fontSize: '0.95rem', marginBottom: '1rem' }}>
                    Explore our curated collection of educational resources designed to inspire and empower learners at every level.
                  </p>
                  <div className="d-flex align-items-center">
                    <div style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>✨</div>
                    <small style={{ opacity: 0.8 }}>Discover • Learn • Grow</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Interactive Learning Tools */}
      <Row className="mb-4">
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm text-center h-100 learning-tool-card" style={{ 
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white'
          }}>
            <Card.Body className="p-4">
              <div className="floating-emoji" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                🔬
              </div>
              <h6 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                Interactive Learning
              </h6>
              <small style={{ opacity: 0.9 }}>
                Hands-on experiments and activities
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4} className="mt-3 mt-md-0">
          <Card className="border-0 shadow-sm text-center h-100 learning-tool-card" style={{ 
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white'
          }}>
            <Card.Body className="p-4">
              <div className="floating-emoji" style={{ fontSize: '3rem', marginBottom: '1rem', animationDelay: '0.5s' }}>
                🎯
              </div>
              <h6 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                Goal-Oriented
              </h6>
              <small style={{ opacity: 0.9 }}>
                Structured learning paths for success
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4} className="mt-3 mt-md-0">
          <Card className="border-0 shadow-sm text-center h-100 learning-tool-card" style={{ 
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            color: '#2c3e50'
          }}>
            <Card.Body className="p-4">
              <div className="floating-emoji" style={{ fontSize: '3rem', marginBottom: '1rem', animationDelay: '1s' }}>
                🌟
              </div>
              <h6 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                Excellence
              </h6>
              <small style={{ opacity: 0.8 }}>
                Quality resources for outstanding results
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Learning Journey Visualization */}
      <Row className="mb-4">
        <Col xs={12}>
          <Card className="border-0 shadow-sm" style={{ 
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              opacity: 0.3
            }}></div>
            <Card.Body className="p-4 position-relative">
              <Row className="align-items-center">
                <Col xs={12} md={8}>
                  <h4 className="mb-3" style={{ fontWeight: '700' }}>
                    🚀 Your Learning Journey Starts Here
                  </h4>
                  <p className="mb-4" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                    From Form 1 basics to Form 4 mastery - every step counts towards your success.
                  </p>
                  <div className="d-flex flex-wrap gap-3 mb-3">
                    <div className="d-flex align-items-center">
                      <div className="pulse-glow" style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: '#28a745',
                        marginRight: '8px'
                      }}></div>
                      <small>Start Learning</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: '#ffc107',
                        marginRight: '8px'
                      }}></div>
                      <small>Practice & Improve</small>
                    </div>
                    <div className="d-flex align-items-center">
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: '#dc3545',
                        marginRight: '8px'
                      }}></div>
                      <small>Master & Excel</small>
                    </div>
                  </div>
                </Col>
                <Col xs={12} md={4} className="text-center mt-3 mt-md-0">
                  <div className="position-relative">
                    <div className="floating-emoji" style={{ 
                      fontSize: '6rem', 
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                    }}>
                      🎓
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '120px',
                      height: '120px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderRadius: '50%',
                      animation: 'pulse-glow 3s infinite'
                    }}></div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Inspirational Artwork Section */}
      <Row className="mt-4">
        <Col lg={8}>
          <Card className="inspiration-card h-100">
            <Card.Body className="p-4 text-center">
              <div className="inspiration-icon">🎨</div>
              <h4 className="mb-3" style={{ fontWeight: '700' }}>
                Educational Inspiration
              </h4>
              <div className="art-quote">
                "Education is the most powerful weapon which you can use to change the world."
              </div>
              <div className="art-author">- Nelson Mandela</div>
              <hr style={{ border: '1px solid rgba(255,255,255,0.3)', margin: '20px 0' }} />
              <Row>
                <Col md={4} className="mb-3">
                  <span className="artwork-emoji">📚</span>
                  <div>Knowledge</div>
                </Col>
                <Col md={4} className="mb-3">
                  <span className="artwork-emoji">💡</span>
                  <div>Innovation</div>
                </Col>
                <Col md={4} className="mb-3">
                  <span className="artwork-emoji">🚀</span>
                  <div>Growth</div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="learning-journey h-100">
            <Card.Body className="p-4">
              <div className="journey-content text-center">
                <h5 className="mb-3" style={{ fontWeight: '600' }}>
                  🌟 Learning Journey
                </h5>
                <div className="progress-steps">
                  <div className="step">
                    <div className="step-icon">📖</div>
                    <div className="step-text">Discover</div>
                  </div>
                  <div className="step">
                    <div className="step-icon">🧠</div>
                    <div className="step-text">Learn</div>
                  </div>
                  <div className="step">
                    <div className="step-icon">⭐</div>
                    <div className="step-text">Excel</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', opacity: '0.9', margin: '0' }}>
                  Every resource is a step towards your academic success
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Educational Art Gallery */}
      <Row className="mt-4">
        <Col>
          <div className="artwork-gallery" style={{ position: 'relative' }}>
            <div className="floating-particles">
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
              <div className="particle"></div>
            </div>
            <h4 className="text-center mb-4 gradient-text" style={{ fontWeight: '600' }}>
              🎭 Creative Learning Space
            </h4>
            <Row>
              <Col md={4} className="mb-3">
                <div className="artwork-item text-center">
                  <span className="artwork-emoji">🌍</span>
                  <h6>Explore the World</h6>
                  <p style={{ fontSize: '0.9rem', margin: '0' }}>
                    Geography and culture resources to broaden your horizons
                  </p>
                </div>
              </Col>
              <Col md={4} className="mb-3">
                <div className="artwork-item text-center">
                  <span className="artwork-emoji">🔬</span>
                  <h6>Scientific Discovery</h6>
                  <p style={{ fontSize: '0.9rem', margin: '0' }}>
                    Experiments and theories that shape our understanding
                  </p>
                </div>
              </Col>
              <Col md={4} className="mb-3">
                <div className="artwork-item text-center">
                  <span className="artwork-emoji">📝</span>
                  <h6>Express Yourself</h6>
                  <p style={{ fontSize: '0.9rem', margin: '0' }}>
                    Language and literature to communicate your ideas
                  </p>
                </div>
              </Col>
            </Row>
            <div className="motivational-section mt-4">
              <div className="motivational-text">
                "The beautiful thing about learning is that nobody can take it away from you."
              </div>
              <div className="motivational-subtext">
                - B.B. King
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Dynamic Greeting & Study Tips */}
      <Row className="mt-4">
        <Col lg={8}>
          <DynamicGreeting />
        </Col>
        <Col lg={4}>
          <div style={{
            background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
            borderRadius: '15px',
            padding: '20px',
            color: '#333',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💡</div>
            <h6 style={{ fontWeight: '600', marginBottom: '10px' }}>Study Tip of the Day</h6>
            <p style={{ fontSize: '0.9rem', margin: '0' }}>
              {[
                "Take breaks every 25 minutes to improve focus!",
                "Create mind maps to visualize connections between topics.",
                "Teach someone else - it's the best way to learn!",
                "Use the Pomodoro Technique for better time management.",
                "Review your notes within 24 hours to boost retention!",
                "Find your peak learning hours and schedule accordingly.",
                "Use active recall instead of just re-reading notes."
              ][Math.floor(Math.random() * 7)]}
            </p>
          </div>
        </Col>
      </Row>

      {/* Quick Stats Section */}
      <Row className="mt-4">
        <Col>
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body className="p-4">
              <h4 className="mb-4 text-center" style={{ fontWeight: '600', color: '#2c3e50' }}>
                📊 Platform Overview
              </h4>
              <Row className="text-center">
                <Col md={3} className="mb-3">
                  <div className="p-3">
                    <h3 className="text-primary mb-1" style={{ fontWeight: '700' }}>
                      <AnimatedCounter targetValue={Object.values(formCounts).reduce((sum, count) => sum + count, 0)} />
                    </h3>
                    <p className="text-muted mb-0">Total Resources</p>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="p-3">
                    <h3 className="text-success mb-1" style={{ fontWeight: '700' }}>
                      <AnimatedCounter targetValue={5} duration={1500} />
                    </h3>
                    <p className="text-muted mb-0">Categories</p>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="p-3">
                    <h3 className="text-info mb-1" style={{ fontWeight: '700' }}>
                      {user ? '∞' : '0'}
                    </h3>
                    <p className="text-muted mb-0">Downloads Available</p>
                  </div>
                </Col>
                <Col md={3} className="mb-3">
                  <div className="p-3">
                    <h3 className="text-warning mb-1" style={{ fontWeight: '700' }}>
                      24/7
                    </h3>
                    <p className="text-muted mb-0">Access</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )

  // Form-specific resources view
  const renderFormResources = () => {
    const currentForm = formLevels.find(f => f.key === activeFormLevel)
    
    return (
      <Container className="py-4">
        {/* Header with Back Button */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex align-items-center mb-3">
              <Button
                variant="outline-secondary"
                onClick={handleBackToDashboard}
                className="me-3"
                style={{ borderRadius: '12px' }}
              >
                ← Back to Dashboard
              </Button>
              <div>
                <h2 className="mb-1" style={{ fontWeight: '700', color: '#2c3e50' }}>
                  {currentForm?.icon} {currentForm?.label}
                </h2>
                <p className="text-muted mb-0">
                  {currentForm?.description}
                </p>
              </div>
            </div>
            
            {user && (user.role === 'teacher' || user.role === 'admin') && (
              <div className="text-end">
                <Button
                  variant="primary"
                  onClick={() => setShowUploadModal(true)}
                  className="shadow-sm"
                  style={{ borderRadius: '12px' }}
                >
                  ➕ Upload to {currentForm?.shortLabel}
                </Button>
              </div>
            )}
          </Col>
        </Row>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            ⚠️ {error}
          </Alert>
        )}

        {/* Search and Filters */}
        <ResourceFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedFormLevel={selectedFormLevel}
          setSelectedFormLevel={setSelectedFormLevel}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onSearch={handleSearch}
        />

        {/* Resources List */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-2">Loading {currentForm?.shortLabel} resources...</p>
          </div>
        ) : resources.length === 0 ? (
          <Card className="border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body className="text-center py-5">
              <div className="text-muted mb-3" style={{ fontSize: '4rem' }}>
                {currentForm?.icon}
              </div>
              <h5>No {currentForm?.shortLabel} resources found</h5>
              <p className="text-muted">
                {searchQuery || selectedSubject || selectedType
                  ? 'Try adjusting your search criteria'
                  : `Be the first to share a ${currentForm?.shortLabel} resource!`
                }
              </p>
              {user && (user.role === 'teacher' || user.role === 'admin') && (
                <Button 
                  variant="primary" 
                  onClick={() => setShowUploadModal(true)}
                  style={{ borderRadius: '12px' }}
                >
                  ⬆️ Upload First {currentForm?.shortLabel} Resource
                </Button>
              )}
            </Card.Body>
          </Card>
        ) : (
          <>
            <Row>
              {resources.map((resource) => (
                <Col key={resource.id} md={6} lg={4} className="mb-4">
                  <ResourceCard
                    resource={resource}
                    onDownload={handleDownload}
                    onEdit={(resource) => {
                      // TODO: Implement edit functionality
                    }}
                    onDelete={(resource) => {
                      setSelectedResource(resource)
                      setShowDeleteModal(true)
                    }}
                    canEdit={canEditResource(resource)}
                    canDelete={canDeleteResource(resource)}
                  />
                </Col>
              ))}
            </Row>

            {/* Pagination */}
            {totalPages > 1 && (
              <Row className="mt-4">
                <Col>
                  <div className="d-flex justify-content-center">
                    <Pagination>
                      <Pagination.Prev 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      />
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Pagination.Item
                          key={page}
                          active={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      />
                    </Pagination>
                  </div>
                </Col>
              </Row>
            )}
          </>
        )}
      </Container>
    )
  }

  return (
    <>
      {currentView === 'dashboard' ? renderDashboard() : renderFormResources()}
      
      {/* Upload Modal */}
      <ResourceUploadModal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        onSubmit={handleUpload}
        loading={uploading}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete "{selectedResource?.title}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            🗑️ Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Custom Styles */}
      <style jsx>{`
        .resource-form-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }
      `}</style>
    </>
  )
}

export default Resources