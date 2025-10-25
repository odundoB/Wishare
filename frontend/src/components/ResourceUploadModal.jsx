import React, { useState } from 'react'
import { Modal, Form, Button, Spinner, Row, Col, ProgressBar, Alert } from 'react-bootstrap'

const ResourceUploadModal = ({ 
  show, 
  onHide, 
  onSubmit, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: 'mathematics', // Default to a valid subject
    form_level: '', // Replace tags with form level
    resource_type: 'file',
    file: null,
    url: '',
    is_public: true
  })

  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileError, setFileError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const subjects = [
    { value: '', label: 'Select subject' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'science', label: 'Science' },
    { value: 'english', label: 'English' },
    { value: 'history', label: 'History' },
    { value: 'geography', label: 'Geography' },
    { value: 'art', label: 'Art' },
    { value: 'music', label: 'Music' },
    { value: 'physical_education', label: 'Physical Education' },
    { value: 'computer_science', label: 'Computer Science' },
    { value: 'foreign_language', label: 'Foreign Language' },
    { value: 'other', label: 'Other' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate file if uploading
    if (formData.resource_type === 'file' && formData.file) {
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (formData.file.size > maxSize) {
        setFileError('File size exceeds 50MB limit. Please choose a smaller file.')
        return
      }
    }
    
    try {
      setIsUploading(true)
      setUploadProgress(0)
      setFileError('')
      
      await onSubmit(formData, (progress) => {
        setUploadProgress(Math.round(progress))
      })
      
      setUploadProgress(0)
    } catch (error) {
      console.error('Upload failed:', error)
      setFileError(error.response?.data?.error || 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    
    // Handle file selection with validation
    if (type === 'file' && files && files[0]) {
      const file = files[0]
      const maxSize = 50 * 1024 * 1024 // 50MB
      
      // File size validation
      if (file.size > maxSize) {
        setFileError('File size exceeds 50MB limit. Please choose a smaller file.')
        return
      }
      
      // File type validation
      const allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'zip', 'rar', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'wav']
      const fileExtension = file.name.split('.').pop().toLowerCase()
      
      if (!allowedTypes.includes(fileExtension)) {
        setFileError('File type not supported. Please choose a supported file format.')
        return
      }
      
      setFileError('')
      setFormData(prev => ({ ...prev, [name]: file }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: 'mathematics', // Default to a valid subject
      form_level: '', // Replace tags with form level
      resource_type: 'file',
      file: null,
      url: '',
      is_public: true
    })
  }

  const handleClose = () => {
    resetForm()
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          ⬆️ Upload New Resource
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Title *</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter resource title"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Subject *</Form.Label>
                <Form.Select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  {subjects.map(subject => (
                    <option key={subject.value} value={subject.value}>
                      {subject.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe the resource content and how it can be used"
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Resource Type *</Form.Label>
                <Form.Select
                  name="resource_type"
                  value={formData.resource_type}
                  onChange={handleChange}
                  required
                >
                  <option value="file">File Upload</option>
                  <option value="url">External Link</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Form Level *</Form.Label>
                <Form.Select
                  name="form_level"
                  value={formData.form_level}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Form Level</option>
                  <option value="form1">Form 1</option>
                  <option value="form2">Form 2</option>
                  <option value="form3">Form 3</option>
                  <option value="form4">Form 4</option>
                  <option value="other">Other/General</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  Select the appropriate form level or "Other" for general resources
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {formData.resource_type === 'file' ? (
            <Form.Group className="mb-3">
              <Form.Label>File * (Max 50MB)</Form.Label>
              <Form.Control
                type="file"
                name="file"
                onChange={handleChange}
                required
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.wav"
              />
              {fileError && (
                <Alert variant="danger" className="mt-2">
                  {fileError}
                </Alert>
              )}
              {isUploading && (
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">Uploading...</span>
                    <span className="text-muted">{uploadProgress}%</span>
                  </div>
                  <ProgressBar 
                    now={uploadProgress} 
                    variant={uploadProgress === 100 ? "success" : "primary"}
                    animated
                  />
                </div>
              )}
              <Form.Text className="text-muted">
                Supported formats: PDF, DOC, PPT, images, videos, audio, archives
              </Form.Text>
            </Form.Group>
          ) : (
            <Form.Group className="mb-3">
              <Form.Label>URL *</Form.Label>
              <Form.Control
                type="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                required
                placeholder="https://example.com/resource"
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="is_public"
              label="Make this resource public (visible to all users)"
              checked={formData.is_public}
              onChange={handleChange}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading || isUploading || !!fileError}>
            {loading || isUploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {isUploading ? `Uploading... ${uploadProgress}%` : 'Processing...'}
              </>
            ) : (
              <>
                ⬆️ Upload Resource
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

export default ResourceUploadModal
