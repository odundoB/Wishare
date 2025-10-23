import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, Image, Modal } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import { updateUserProfile, changePassword, uploadProfilePhoto, deleteProfilePhoto } from '../services/users'
import ImageCropper from './ImageCropper'

const TeacherProfile = () => {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Profile form data
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    department: '',
    specialization: '',
    bio: '',
    office_hours: '',
    phone: ''
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
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        department: user.department || '',
        specialization: user.specialization || '',
        bio: user.bio || '',
        office_hours: user.office_hours || '',
        phone: user.phone || ''
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
      setShowPasswordModal(false)
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
    if (!file) {
      setError('Please select a file')
      return
    }

    // Clear previous states
    setError('')
    setSuccess('')
    setPhotoFile(null)
    setPhotoPreview(null)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, GIF, etc.)')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB')
      return
    }

    // Validate minimum file size (at least 1KB)
    if (file.size < 1024) {
      setError('Image file is too small')
      return
    }

    try {
      setOriginalImage(URL.createObjectURL(file))
      setShowCropper(true)
    } catch (err) {
      console.error('Error creating object URL:', err)
      setError('Error processing the selected file')
    }
  }

  // Handle cropped image
  const handleCroppedImage = async (croppedBlob, croppedUrl) => {
    setPhotoFile(croppedBlob)
    setPhotoPreview(croppedUrl)
    setShowCropper(false)
    setError('') // Clear any previous errors
    setSuccess('') // Clear any previous success messages
  }

  // Handle profile photo save
  const handlePhotoSave = async () => {
    if (!photoFile) {
      setError('Please select a photo to upload')
      return
    }

    setUploadingPhoto(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('photo', photoFile)

      const response = await uploadProfilePhoto(formData)
      updateProfile(response.data)
      setSuccess('Profile photo updated successfully!')
      setPhotoFile(null)
      setPhotoPreview(null)
      setShowPhotoModal(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Photo upload error:', err)
      setError('Failed to upload photo: ' + (err.response?.data?.detail || err.response?.data?.error || err.message))
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
    <Container className="py-5">
      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
      {success && <Alert variant="success" className="mb-4">{success}</Alert>}

      {/* Professional Header */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <Row className="align-items-center">
                <Col md={3} className="text-center">
                  <div className="position-relative d-inline-block">
                    {photoPreview || user.profile_photo_url ? (
                      <Image
                        src={photoPreview || user.profile_photo_url}
                        roundedCircle
                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                        className="border border-3 border-primary shadow"
                      />
                    ) : (
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow" 
                           style={{ width: '120px', height: '120px', fontSize: '3rem', fontWeight: 'bold' }}>
                        {user.first_name ? user.first_name.charAt(0).toUpperCase() : (user.username ? user.username.charAt(0).toUpperCase() : 'T')}
                      </div>
                    )}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="position-absolute bottom-0 end-0 rounded-circle"
                      style={{ width: '32px', height: '32px' }}
                      onClick={() => setShowPhotoModal(true)}
                    >
                      📷
                    </Button>
                  </div>
                </Col>
                <Col md={6}>
                  <h2 className="mb-1 text-primary">
                    Prof. {user.first_name || ''} {user.last_name || ''}
                  </h2>
                  <p className="text-muted mb-2">
                    {user.department || 'Department'} • {user.specialization || 'Specialization'}
                  </p>
                  <div className="d-flex gap-2 mb-3">
                    <Badge bg="primary" className="px-3 py-2">
                      👨‍🏫 Teacher
                    </Badge>
                    <Badge bg="info" className="px-3 py-2">
                      {user.department || 'Faculty'}
                    </Badge>
                  </div>
                  {user.bio && (
                    <p className="text-muted mb-0">{user.bio}</p>
                  )}
                </Col>
                <Col md={3} className="text-md-end">
                  <Button
                    variant={isEditing ? "outline-secondary" : "primary"}
                    onClick={() => setIsEditing(!isEditing)}
                    className="mb-2"
                  >
                    {isEditing ? '✏️ Cancel Edit' : '✏️ Edit Profile'}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Profile Information */}
      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-0">
              <h5 className="mb-0 text-primary">👨‍🏫 Professional Information</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {isEditing ? (
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
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Department</Form.Label>
                        <Form.Control
                          type="text"
                          name="department"
                          value={profileData.department}
                          onChange={handleProfileChange}
                          placeholder="e.g., Computer Science"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Specialization</Form.Label>
                        <Form.Control
                          type="text"
                          name="specialization"
                          value={profileData.specialization}
                          onChange={handleProfileChange}
                          placeholder="e.g., Machine Learning"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">Office Hours</Form.Label>
                        <Form.Control
                          type="text"
                          name="office_hours"
                          value={profileData.office_hours}
                          onChange={handleProfileChange}
                          placeholder="e.g., Mon-Fri 2-4 PM"
                        />
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
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Bio</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="bio"
                      value={profileData.bio}
                      onChange={handleProfileChange}
                      placeholder="Tell us about your teaching experience and interests..."
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-end gap-2">
                    <Button
                      variant="outline-secondary"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Updating...
                        </>
                      ) : (
                        '💾 Save Changes'
                      )}
                    </Button>
                  </div>
                </Form>
              ) : (
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <span className="text-muted">First Name:</span>
                      <span className="fw-medium">{user.first_name || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <span className="text-muted">Last Name:</span>
                      <span className="fw-medium">{user.last_name || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <span className="text-muted">Department:</span>
                      <span className="fw-medium">{user.department || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <span className="text-muted">Specialization:</span>
                      <span className="fw-medium">{user.specialization || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <span className="text-muted">Office Hours:</span>
                      <span className="fw-medium">{user.office_hours || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between py-2 border-bottom">
                      <span className="text-muted">Phone:</span>
                      <span className="fw-medium">{user.phone || 'Not set'}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="py-2">
                      <span className="text-muted d-block mb-1">Bio:</span>
                      <span className="fw-medium">{user.bio || 'No bio available'}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Quick Stats */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-light border-0">
              <h6 className="mb-0 text-primary">📊 Quick Stats</h6>
            </Card.Header>
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Resources Uploaded</span>
                <Badge bg="primary">0</Badge>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Students Taught</span>
                <Badge bg="info">0</Badge>
              </div>
              <div className="d-flex justify-content-between py-2 border-bottom">
                <span className="text-muted small">Events Hosted</span>
                <Badge bg="warning">0</Badge>
              </div>
              <div className="d-flex justify-content-between py-2">
                <span className="text-muted small">Messages Sent</span>
                <Badge bg="success">0</Badge>
              </div>
            </Card.Body>
          </Card>

          {/* Security Settings */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light border-0">
              <h6 className="mb-0 text-primary">🔒 Security</h6>
            </Card.Header>
            <Card.Body className="p-3">
              <Button
                variant="outline-warning"
                size="sm"
                className="w-100 mb-2"
                onClick={() => setShowPasswordModal(true)}
              >
                🔑 Change Password
              </Button>
              <small className="text-muted d-block">
                Last updated: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
              </small>
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
                      <small className="text-muted">Create rooms & chat with students</small>
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
                      <small className="text-muted">Manage class events</small>
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
                      <div className="text-warning mb-2" style={{ fontSize: '2rem' }}>📚</div>
                      <h6>Resources</h6>
                      <small className="text-muted">Share learning materials</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Password Change Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🔑 Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handlePasswordChange}>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordInputChange}
                placeholder="Enter your current password"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordInputChange}
                placeholder="Enter your new password"
                required
                minLength={8}
              />
              <Form.Text className="text-muted">
                Password must be at least 8 characters long
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordInputChange}
                placeholder="Confirm your new password"
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="warning"
                disabled={loading}
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
        </Modal.Body>
      </Modal>

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
                  {user.first_name ? user.first_name.charAt(0).toUpperCase() : (user.username ? user.username.charAt(0).toUpperCase() : 'T')}
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
    </Container>
  )
}

export default TeacherProfile
