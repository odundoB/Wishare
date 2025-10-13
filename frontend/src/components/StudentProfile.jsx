import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Tab, Tabs, Badge, Image, ProgressBar, Modal } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import { updateUserProfile, changePassword, uploadProfilePhoto, deleteProfilePhoto } from '../services/users'
import ImageCropper from './ImageCropper'

const StudentProfile = () => {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('profile')

  // Profile form data
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    role: '',
    student_id: '',
    major: '',
    year_of_study: '',
    bio: '',
    phone: '',
    interests: ''
  })

  // Password change form data
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })

  // Profile photo state
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [originalImage, setOriginalImage] = useState(null)

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        role: user.role || '',
        student_id: user.student_id || '',
        major: user.major || '',
        year_of_study: user.year_of_study || '',
        bio: user.bio || '',
        phone: user.phone || '',
        interests: user.interests || ''
      })
    }
  }, [user])

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const updatedUser = await updateUserProfile(profileData)
      updateProfile(updatedUser.data)
      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError('Failed to update profile: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    if (passwordData.new_password.length < 8) {
      setError('New password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      await changePassword({
        old_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirm: passwordData.confirm_password
      })
      setSuccess('Password changed successfully!')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (err) {
      setError('Failed to change password: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  // Handle input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle profile photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB')
      return
    }

    setOriginalImage(URL.createObjectURL(file))
    setShowCropper(true)
    setError('')
  }

  // Handle cropped image
  const handleCroppedImage = async (croppedBlob, croppedUrl) => {
    setPhotoFile(croppedBlob)
    setPhotoPreview(croppedUrl)
    setShowCropper(false)
  }

  // Handle profile photo save
  const handlePhotoSave = async () => {
    if (!photoFile) return

    setUploadingPhoto(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('photo', photoFile)

      const response = await uploadProfilePhoto(formData)
      updateProfile(response.data)
      setSuccess('Profile photo updated successfully!')
      setPhotoFile(null)
      setPhotoPreview(null)
      setShowPhotoModal(false)
    } catch (err) {
      setError('Failed to upload photo: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Handle profile photo delete
  const handlePhotoDelete = async () => {
    setUploadingPhoto(true)
    setError('')

    try {
      await deleteProfilePhoto()
      const updatedUser = { ...user, profile_photo: null }
      updateProfile(updatedUser)
      setSuccess('Profile photo deleted successfully!')
      setPhotoFile(null)
      setPhotoPreview(null)
      setShowPhotoModal(false)
    } catch (err) {
      setError('Failed to delete photo: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Cancel photo upload
  const handlePhotoCancel = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setError('')
    setShowPhotoModal(false)
  }

  // Get profile completion percentage
  const getProfileCompletion = () => {
    let completed = 0
    const total = 8
    
    if (user?.first_name) completed++
    if (user?.last_name) completed++
    if (user?.email) completed++
    if (user?.profile_photo_url) completed++
    if (user?.student_id) completed++
    if (user?.major) completed++
    if (user?.year_of_study) completed++
    if (user?.bio) completed++
    
    return Math.round((completed / total) * 100)
  }

  if (!user) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="text-muted">Loading profile...</p>
        </div>
      </Container>
    )
  }

  return (
    <div className="student-profile-page">
      {/* Header Section */}
      <div className="profile-header bg-gradient-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center">
                <div className="profile-avatar-large me-4">
                  {photoPreview || user.profile_photo_url ? (
                    <Image
                      src={photoPreview || user.profile_photo_url}
                      roundedCircle
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      className="border border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow-lg" 
                         style={{ width: '100px', height: '100px', fontSize: '2.5rem', fontWeight: 'bold' }}>
                      {user.first_name ? user.first_name.charAt(0).toUpperCase() : (user.username ? user.username.charAt(0).toUpperCase() : 'S')}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="mb-1 fw-bold">
                    {user.first_name || ''} {user.last_name || ''}
                  </h2>
                  <p className="mb-2 opacity-75">
                    {user.major || 'Major'} • Year {user.year_of_study || 'N/A'}
                  </p>
                  <div className="d-flex gap-2">
                    <Badge bg="light" text="dark" className="px-3 py-2">
                      👨‍🎓 Student
                    </Badge>
                    <Badge bg="info" className="px-3 py-2">
                      {user.student_id || 'ID: N/A'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Col>
            <Col md={4} className="text-md-end">
              <Button 
                variant="light" 
                onClick={() => setShowPhotoModal(true)}
                className="me-2"
              >
                📷 Change Photo
              </Button>
              <Button 
                variant="outline-light"
                onClick={() => setActiveTab('preferences')}
              >
                ⚙️ Settings
              </Button>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-4">
        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
        {success && <Alert variant="success" className="mb-4">{success}</Alert>}

        <Row>
          <Col lg={4} className="mb-4">
            {/* Student Stats Card */}
            <Card className="h-100 shadow-sm border-primary">
              <Card.Header className="bg-primary text-white border-0 pb-0">
                <h5 className="mb-0 fw-bold">👨‍🎓 Student Dashboard</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small">Profile Completion</span>
                    <span className="fw-bold text-primary">{getProfileCompletion()}%</span>
                  </div>
                  <ProgressBar 
                    now={getProfileCompletion()} 
                    variant="primary" 
                    className="mb-3"
                    style={{ height: '8px' }}
                  />
                </div>

                <div className="student-stats">
                  <div className="stat-item d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted">Student ID</span>
                    <span className="fw-medium">{user.student_id || 'Not Set'}</span>
                  </div>
                  <div className="stat-item d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted">Major</span>
                    <span className="fw-medium">{user.major || 'Not Set'}</span>
                  </div>
                  <div className="stat-item d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted">Year of Study</span>
                    <span className="fw-medium">{user.year_of_study || 'Not Set'}</span>
                  </div>
                  <div className="stat-item d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted">Resources Downloaded</span>
                    <Badge bg="success">0</Badge>
                  </div>
                  <div className="stat-item d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted">Events Attended</span>
                    <Badge bg="info">0</Badge>
                  </div>
                  <div className="stat-item d-flex justify-content-between align-items-center py-2">
                    <span className="text-muted">Messages Sent</span>
                    <Badge bg="warning">0</Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

          </Col>

          <Col lg={8}>
            {/* Main Content Tabs */}
            <Card className="shadow-sm">
              <Card.Body className="p-0">
                <Tabs
                  id="student-profile-tabs"
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="border-bottom px-4 pt-3"
                >

                  <Tab eventKey="profile" title="✏️ Profile">
                    <div className="p-4">
                      <Form onSubmit={handleProfileUpdate}>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold">First Name</Form.Label>
                              <Form.Control
                                type="text"
                                name="first_name"
                                value={profileData.first_name}
                                onChange={handleProfileChange}
                                placeholder="Enter your first name"
                                className="border-0 bg-light"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold">Last Name</Form.Label>
                              <Form.Control
                                type="text"
                                name="last_name"
                                value={profileData.last_name}
                                onChange={handleProfileChange}
                                placeholder="Enter your last name"
                                className="border-0 bg-light"
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold">Student ID</Form.Label>
                              <Form.Control
                                type="text"
                                name="student_id"
                                value={profileData.student_id}
                                onChange={handleProfileChange}
                                placeholder="e.g., 2024001"
                                className="border-0 bg-light"
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold">Major</Form.Label>
                              <Form.Control
                                type="text"
                                name="major"
                                value={profileData.major}
                                onChange={handleProfileChange}
                                placeholder="e.g., Computer Science"
                                className="border-0 bg-light"
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold">Year of Study</Form.Label>
                              <Form.Select
                                name="year_of_study"
                                value={profileData.year_of_study}
                                onChange={handleProfileChange}
                                className="border-0 bg-light"
                              >
                                <option value="">Select Year</option>
                                <option value="1">Year 1</option>
                                <option value="2">Year 2</option>
                                <option value="3">Year 3</option>
                                <option value="4">Year 4</option>
                                <option value="5">Year 5+</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-bold">Phone</Form.Label>
                              <Form.Control
                                type="tel"
                                name="phone"
                                value={profileData.phone}
                                onChange={handleProfileChange}
                                placeholder="+1 (555) 123-4567"
                                className="border-0 bg-light"
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Bio</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={4}
                            name="bio"
                            value={profileData.bio}
                            onChange={handleProfileChange}
                            placeholder="Tell us about yourself, your interests, and academic goals..."
                            className="border-0 bg-light"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Interests</Form.Label>
                          <Form.Control
                            type="text"
                            name="interests"
                            value={profileData.interests}
                            onChange={handleProfileChange}
                            placeholder="e.g., Machine Learning, Web Development, Data Science"
                            className="border-0 bg-light"
                          />
                          <Form.Text className="text-muted">
                            Separate multiple interests with commas
                          </Form.Text>
                        </Form.Group>

                        <div className="d-flex justify-content-end">
                          <Button 
                            type="submit" 
                            variant="primary" 
                            disabled={loading}
                            className="px-4"
                          >
                            {loading ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Updating...
                              </>
                            ) : (
                              '💾 Update Profile'
                            )}
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </Tab>

                  <Tab eventKey="password" title="🔒 Security">
                    <div className="p-4">
                      <Form onSubmit={handlePasswordChange}>
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Current Password</Form.Label>
                          <Form.Control
                            type="password"
                            name="current_password"
                            value={passwordData.current_password}
                            onChange={handlePasswordInputChange}
                            placeholder="Enter your current password"
                            required
                            className="border-0 bg-light"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">New Password</Form.Label>
                          <Form.Control
                            type="password"
                            name="new_password"
                            value={passwordData.new_password}
                            onChange={handlePasswordInputChange}
                            placeholder="Enter your new password"
                            required
                            minLength={8}
                            className="border-0 bg-light"
                          />
                          <Form.Text className="text-muted">
                            Password must be at least 8 characters long
                          </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Confirm New Password</Form.Label>
                          <Form.Control
                            type="password"
                            name="confirm_password"
                            value={passwordData.confirm_password}
                            onChange={handlePasswordInputChange}
                            placeholder="Confirm your new password"
                            required
                            className="border-0 bg-light"
                          />
                        </Form.Group>

                        <div className="d-flex justify-content-end">
                          <Button 
                            type="submit" 
                            variant="warning" 
                            disabled={loading}
                            className="px-4"
                          >
                            {loading ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Changing...
                              </>
                            ) : (
                              '🔒 Change Password'
                            )}
                          </Button>
                        </div>
                      </Form>
                    </div>
                  </Tab>

                  <Tab eventKey="preferences" title="⚙️ Preferences">
                    <div className="p-4">
                      <h5 className="mb-4">Notification Preferences</h5>
                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Check
                            type="checkbox"
                            id="email-notifications"
                            label="Email notifications for new resources"
                            defaultChecked
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Check
                            type="checkbox"
                            id="event-notifications"
                            label="Event notifications and reminders"
                            defaultChecked
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Check
                            type="checkbox"
                            id="message-notifications"
                            label="Message notifications"
                            defaultChecked
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Check
                            type="checkbox"
                            id="system-notifications"
                            label="System updates and announcements"
                            defaultChecked
                          />
                        </Form.Group>
                      </Form>
                      
                      <div className="mt-4">
                        <h5 className="mb-3">Display Preferences</h5>
                        <Form.Group className="mb-3">
                          <Form.Label>Default Dashboard View</Form.Label>
                          <Form.Select className="border-0 bg-light">
                            <option value="overview">Overview</option>
                            <option value="resources">Resources</option>
                            <option value="events">Events</option>
                          </Form.Select>
                        </Form.Group>
                      </div>
                    </div>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Photo Upload Modal */}
      <Modal show={showPhotoModal} onHide={() => setShowPhotoModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>📷 Change Profile Photo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="mb-3">
            <div className="profile-photo-preview d-inline-block">
              {photoPreview || user.profile_photo_url ? (
                <Image
                  src={photoPreview || user.profile_photo_url}
                  roundedCircle
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                  className="border border-3 border-primary"
                />
              ) : (
                <div className="profile-avatar bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" 
                     style={{ width: '150px', height: '150px', fontSize: '4rem' }}>
                  {user.first_name ? user.first_name.charAt(0).toUpperCase() : (user.username ? user.username.charAt(0).toUpperCase() : 'S')}
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-3">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="form-control"
              id="photo-upload"
            />
            <div className="form-text">
              Supported formats: JPG, PNG, GIF. Max size: 10MB
            </div>
          </div>
          
          {photoFile && (
            <div className="mb-3">
              <Button
                variant="primary"
                onClick={handlePhotoSave}
                disabled={uploadingPhoto}
                className="me-2"
              >
                {uploadingPhoto ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Saving...
                  </>
                ) : (
                  '💾 Save Photo'
                )}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={handlePhotoCancel}
                disabled={uploadingPhoto}
              >
                ❌ Cancel
              </Button>
            </div>
          )}
          
          {user.profile_photo_url && !photoFile && (
            <div>
              <Button
                variant="outline-danger"
                onClick={handlePhotoDelete}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-1" />
                    Deleting...
                  </>
                ) : (
                  '🗑️ Delete Current Photo'
                )}
              </Button>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Image Cropper Modal */}
      <ImageCropper
        show={showCropper}
        onHide={() => setShowCropper(false)}
        onCrop={handleCroppedImage}
        imageSrc={originalImage}
        aspectRatio={1}
      />
    </div>
  )
}

export default StudentProfile
