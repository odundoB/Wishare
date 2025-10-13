import React, { useState } from 'react'
import { Modal, Form, Button, Spinner, Row, Col } from 'react-bootstrap'

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
    tags: '',
    resource_type: 'file',
    file: null,
    url: '',
    is_public: true
  })

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

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'file' ? files[0] : value)
    }))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject: 'mathematics', // Default to a valid subject
      tags: '',
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
                <Form.Label>Tags</Form.Label>
                <Form.Control
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="Enter tags separated by commas"
                />
                <Form.Text className="text-muted">
                  Example: mathematics, algebra, worksheet
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {formData.resource_type === 'file' ? (
            <Form.Group className="mb-3">
              <Form.Label>File *</Form.Label>
              <Form.Control
                type="file"
                name="file"
                onChange={handleChange}
                required
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.wav"
              />
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
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Uploading...
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
