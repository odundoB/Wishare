import React, { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Modal, Image, Badge } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import { 
  getStudentProfile, 
  updateStudentProfile, 
  uploadProfilePicture,
  validateProfileData,
  formatProfileForDisplay,
  getGenderOptions,
  getYearOptions,
  getProfilePictureUrl
} from '../services/studentProfile'
import './StudentProfile.css'

const StudentProfile = () => {
  const { user, isAuthenticated } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editing, setEditing] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  
  // Form data
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    gender: '',
    date_of_birth: '',
    bio: '',
    year_of_study: '',
    contact: ''
  })
  
  const [formErrors, setFormErrors] = useState({})
  const fileInputRef = useRef(null)
  
  // Load profile data
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile()
    }
  }, [isAuthenticated])
  
  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getStudentProfile()
      const profileData = formatProfileForDisplay(response.data)
      setProfile(profileData)
      setFormData({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        username: profileData.username || '',
        gender: profileData.gender || '',
        date_of_birth: profileData.date_of_birth || '',
        bio: profileData.bio || '',
        year_of_study: profileData.year_of_study || '',
        contact: profileData.contact || ''
      })
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }
  
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
        setShowImageModal(true)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleImageCrop = () => {
    // For now, we'll just upload the image as is
    // In a real implementation, you'd crop the image here
    uploadImage()
  }
  
  const uploadImage = async () => {
    const file = fileInputRef.current?.files[0]
    if (!file) return
    
    try {
      setSaving(true)
      setError(null)
      const response = await uploadProfilePicture(file, profile)
      const updatedProfile = formatProfileForDisplay(response.data)
      setProfile(updatedProfile)
      setShowImageModal(false)
      setImagePreview(null)
      setSuccess('Profile picture updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error uploading image:', err)
      setError('Failed to upload profile picture. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form data
    const validation = validateProfileData(formData)
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      const response = await updateStudentProfile(formData)
      const updatedProfile = formatProfileForDisplay(response.data)
      setProfile(updatedProfile)
      setEditing(false)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error updating profile:', err)
      if (err.response?.data) {
        // Handle validation errors from server
        const serverErrors = err.response.data
        setFormErrors(serverErrors)
      } else {
        setError('Failed to update profile. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }
  
  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      username: profile?.username || '',
      gender: profile?.gender || '',
      date_of_birth: profile?.date_of_birth || '',
      bio: profile?.bio || '',
      year_of_study: profile?.year_of_study || '',
      contact: profile?.contact || ''
    })
    setFormErrors({})
    setEditing(false)
  }
  
  if (!isAuthenticated) {
    return (
      <Container className="mt-5 text-center">
        <Alert variant="warning">Please log in to view your profile.</Alert>
      </Container>
    )
  }
  
  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading profile...</span>
        </Spinner>
        <p className="mt-3">Loading your profile...</p>
      </Container>
    )
  }
  
  return (
    <Container className="mt-4">
      <Row>
        <Col lg={8} className="mx-auto">
          <Card className="profile-card">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-user me-2"></i>
                Student Profile
              </h4>
              {!editing && (
                <Button 
                  variant="outline-primary" 
                  onClick={() => setEditing(true)}
                  disabled={saving}
                >
                  <i className="fas fa-edit me-1"></i>
                  Edit Profile
                </Button>
              )}
            </Card.Header>
            
            <Card.Body>
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
                  {success}
                </Alert>
              )}
              
              {editing ? (
                <Form onSubmit={handleSubmit}>
                  <Row>
                    {/* Profile Picture Section */}
                    <Col md={4} className="text-center mb-4">
                      <div className="profile-picture-section">
                        <div className="profile-picture-container">
                          {profile?.profile_picture_url ? (
                            <Image
                              src={profile.profile_picture_url}
                              roundedCircle
                              className="profile-picture"
                              alt="Profile"
                            />
                          ) : (
                            <div className="profile-picture-placeholder">
                              <i className="fas fa-user fa-3x text-muted"></i>
                            </div>
                          )}
                        </div>
                        <div className="mt-3">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                          />
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={saving}
                          >
                            <i className="fas fa-camera me-1"></i>
                            Change Photo
                          </Button>
                        </div>
                      </div>
                    </Col>
                    
                    {/* Form Fields */}
                    <Col md={8}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Full Name *</Form.Label>
                            <Form.Control
                              type="text"
                              name="full_name"
                              value={formData.full_name}
                              onChange={handleInputChange}
                              isInvalid={!!formErrors.full_name}
                              placeholder="Enter your full name"
                            />
                            <Form.Control.Feedback type="invalid">
                              {formErrors.full_name}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email *</Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              isInvalid={!!formErrors.email}
                              placeholder="Enter your email"
                            />
                            <Form.Control.Feedback type="invalid">
                              {formErrors.email}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Username *</Form.Label>
                            <Form.Control
                              type="text"
                              name="username"
                              value={formData.username}
                              onChange={handleInputChange}
                              isInvalid={!!formErrors.username}
                              placeholder="Enter your username"
                            />
                            <Form.Control.Feedback type="invalid">
                              {formErrors.username}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Gender</Form.Label>
                            <Form.Select
                              name="gender"
                              value={formData.gender}
                              onChange={handleInputChange}
                            >
                              {getGenderOptions().map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Date of Birth</Form.Label>
                            <Form.Control
                              type="date"
                              name="date_of_birth"
                              value={formData.date_of_birth}
                              onChange={handleInputChange}
                              isInvalid={!!formErrors.date_of_birth}
                            />
                            <Form.Control.Feedback type="invalid">
                              {formErrors.date_of_birth}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Contact Number</Form.Label>
                            <Form.Control
                              type="tel"
                              name="contact"
                              value={formData.contact}
                              onChange={handleInputChange}
                              isInvalid={!!formErrors.contact}
                              placeholder="Enter your contact number"
                            />
                            <Form.Control.Feedback type="invalid">
                              {formErrors.contact}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Year of Study *</Form.Label>
                            <Form.Select
                              name="year_of_study"
                              value={formData.year_of_study}
                              onChange={handleInputChange}
                              isInvalid={!!formErrors.year_of_study}
                            >
                              {getYearOptions().map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {formErrors.year_of_study}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Bio</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          isInvalid={!!formErrors.bio}
                          placeholder="Tell us about yourself..."
                          maxLength={500}
                        />
                        <Form.Text className="text-muted">
                          {formData.bio.length}/500 characters
                        </Form.Text>
                        <Form.Control.Feedback type="invalid">
                          {formErrors.bio}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <div className="d-flex gap-2 justify-content-end">
                    <Button
                      variant="secondary"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-1"></i>
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              ) : (
                <div className="profile-display">
                  <Row>
                    {/* Profile Picture Display */}
                    <Col md={4} className="text-center mb-4">
                      <div className="profile-picture-container">
                        {profile?.profile_picture_url ? (
                          <Image
                            src={profile.profile_picture_url}
                            roundedCircle
                            className="profile-picture"
                            alt="Profile"
                          />
                        ) : (
                          <div className="profile-picture-placeholder">
                            <i className="fas fa-user fa-3x text-muted"></i>
                          </div>
                        )}
                      </div>
                    </Col>
                    
                    {/* Profile Information Display */}
                    <Col md={8}>
                      <div className="profile-info">
                        <h5 className="profile-name">{profile?.full_name}</h5>
                        <p className="text-muted mb-3">
                          <i className="fas fa-envelope me-2"></i>
                          {profile?.email}
                        </p>
                        
                        <div className="profile-details">
                          <div className="detail-item">
                            <strong>Username:</strong> {profile?.username}
                          </div>
                          
                          {profile?.gender && (
                            <div className="detail-item">
                              <strong>Gender:</strong> {profile?.gender_display}
                            </div>
                          )}
                          
                          {profile?.date_of_birth && (
                            <div className="detail-item">
                              <strong>Date of Birth:</strong> {profile?.date_of_birth_display}
                            </div>
                          )}
                          
                          
                          <div className="detail-item">
                            <strong>Year of Study:</strong> 
                            <Badge bg="primary" className="ms-2">
                              {profile?.year_display}
                            </Badge>
                          </div>
                          
                          {profile?.contact && (
                            <div className="detail-item">
                              <strong>Contact:</strong> {profile?.contact}
                            </div>
                          )}
                          
                          {profile?.bio && (
                            <div className="detail-item">
                              <strong>Bio:</strong>
                              <p className="mt-2 text-muted">{profile?.bio}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="card-title mb-3">🚀 Quick Actions</h5>
              <Row>
                <Col md={4} className="mb-3">
                  <Card className="h-100 text-center hover-shadow" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => window.location.href = '/chat'}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
                    }}
                  >
                    <Card.Body className="py-3">
                      <div className="text-success mb-2" style={{ fontSize: '2rem' }}>💬</div>
                      <h6>Chat Rooms</h6>
                      <small className="text-muted">Join class discussions</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4} className="mb-3">
                  <Card className="h-100 text-center hover-shadow" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => window.location.href = '/events'}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
                    }}
                  >
                    <Card.Body className="py-3">
                      <div className="text-primary mb-2" style={{ fontSize: '2rem' }}>📅</div>
                      <h6>Events</h6>
                      <small className="text-muted">View upcoming events</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4} className="mb-3">
                  <Card className="h-100 text-center hover-shadow" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => window.location.href = '/resources'}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
                    }}
                  >
                    <Card.Body className="py-3">
                      <div className="text-info mb-2" style={{ fontSize: '2rem' }}>📚</div>
                      <h6>Resources</h6>
                      <small className="text-muted">Browse study materials</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Image Preview Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="md">
        <Modal.Header closeButton>
          <Modal.Title>Profile Picture Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {imagePreview && (
            <Image
              src={imagePreview}
              roundedCircle
              className="profile-picture-preview"
              alt="Preview"
            />
          )}
          <p className="mt-3 text-muted">
            This will be your new profile picture. Click "Update" to confirm.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleImageCrop} disabled={saving}>
            {saving ? (
              <>
                <Spinner size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              'Update Picture'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default StudentProfile
