import React, { useState } from 'react'
import { Button, Card, Alert, Form, Row, Col, Table, Badge } from 'react-bootstrap'
import { 
  uploadResource, 
  getResources, 
  getResource, 
  updateResource, 
  deleteResource, 
  searchResources,
  downloadResource 
} from '../services/resources'

const ResourceServiceExample = () => {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resources, setResources] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    resource_type: 'document',
    grade_level: '',
    is_public: true
  })
  const [file, setFile] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const testUploadResource = async () => {
    if (!file) {
      setResult({
        type: 'warning',
        message: 'Please select a file to upload'
      })
      return
    }

    setLoading(true)
    setResult(null)
    
    try {
      const data = new FormData()
      data.append('file', file)
      data.append('title', formData.title)
      data.append('description', formData.description)
      data.append('subject', formData.subject)
      data.append('resource_type', formData.resource_type)
      data.append('grade_level', formData.grade_level)
      data.append('is_public', formData.is_public)

      const response = await uploadResource(data)
      setResult({
        type: 'success',
        message: 'Resource uploaded successfully!',
        data: response.data
      })
      
      // Refresh resources list
      testGetResources()
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Upload failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testGetResources = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await getResources({
        page: 1,
        page_size: 10,
        ordering: '-created_at'
      })
      setResources(response.data.results || response.data)
      setResult({
        type: 'success',
        message: `Retrieved ${response.data.results?.length || response.data.length} resources`,
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Get resources failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testGetResource = async (id) => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await getResource(id)
      setResult({
        type: 'success',
        message: 'Resource retrieved successfully!',
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Get resource failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testUpdateResource = async (id) => {
    setLoading(true)
    setResult(null)
    
    try {
      const data = new FormData()
      data.append('title', formData.title + ' (Updated)')
      data.append('description', formData.description)
      data.append('subject', formData.subject)
      data.append('resource_type', formData.resource_type)
      data.append('grade_level', formData.grade_level)
      data.append('is_public', formData.is_public)

      const response = await updateResource(id, data)
      setResult({
        type: 'success',
        message: 'Resource updated successfully!',
        data: response.data
      })
      
      // Refresh resources list
      testGetResources()
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Update failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testDeleteResource = async (id) => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await deleteResource(id)
      setResult({
        type: 'success',
        message: 'Resource deleted successfully!',
        data: response.data
      })
      
      // Refresh resources list
      testGetResources()
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Delete failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testSearchResources = async () => {
    if (!searchQuery.trim()) {
      setResult({
        type: 'warning',
        message: 'Please enter a search query'
      })
      return
    }

    setLoading(true)
    setResult(null)
    
    try {
      const response = await searchResources(searchQuery, {
        page: 1,
        page_size: 10
      })
      setResources(response.data.results || response.data)
      setResult({
        type: 'success',
        message: `Found ${response.data.results?.length || response.data.length} resources for "${searchQuery}"`,
        data: response.data
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Search failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  const testDownloadResource = async (id) => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await downloadResource(id)
      
      // Create blob and download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `resource_${id}.${response.headers['content-type']?.split('/')[1] || 'file'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setResult({
        type: 'success',
        message: 'Resource downloaded successfully!',
        data: { message: 'File download initiated' }
      })
    } catch (error) {
      setResult({
        type: 'danger',
        message: 'Download failed: ' + (error.response?.data?.detail || error.message),
        data: error.response?.data
      })
    }
    
    setLoading(false)
  }

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">Resource Service Functions Test</h5>
      </Card.Header>
      <Card.Body>
        <p className="text-muted mb-4">
          Test the resource service functions from <code>src/services/resources.js</code>
        </p>

        {/* Upload Form */}
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">Upload Resource</h6>
          </Card.Header>
          <Card.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>File</Form.Label>
                    <Form.Control
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Resource title"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Subject</Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Subject/category"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Resource Type</Form.Label>
                    <Form.Select
                      name="resource_type"
                      value={formData.resource_type}
                      onChange={handleChange}
                    >
                      <option value="document">Document</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="presentation">Presentation</option>
                      <option value="worksheet">Worksheet</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Resource description"
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Grade Level</Form.Label>
                    <Form.Control
                      type="text"
                      name="grade_level"
                      value={formData.grade_level}
                      onChange={handleChange}
                      placeholder="e.g., Grade 10, University"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="is_public"
                      checked={formData.is_public}
                      onChange={handleChange}
                      label="Public Resource"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Button 
                variant="primary" 
                onClick={testUploadResource}
                disabled={loading || !file}
              >
                Upload Resource
              </Button>
            </Form>
          </Card.Body>
        </Card>

        {/* Search Form */}
        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">Search Resources</h6>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={8}>
                <Form.Control
                  type="text"
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Col>
              <Col md={4}>
                <Button 
                  variant="info" 
                  onClick={testSearchResources}
                  disabled={loading}
                  className="w-100"
                >
                  Search
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          <Button 
            variant="success" 
            onClick={testGetResources}
            disabled={loading}
          >
            Get All Resources
          </Button>
        </div>

        {/* Resources List */}
        {resources.length > 0 && (
          <Card className="mb-3">
            <Card.Header>
              <h6 className="mb-0">Resources ({resources.length})</h6>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Public</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr key={resource.id}>
                      <td>{resource.id}</td>
                      <td>{resource.title}</td>
                      <td>
                        <Badge bg="secondary">{resource.resource_type}</Badge>
                      </td>
                      <td>{resource.subject}</td>
                      <td>
                        <Badge bg={resource.is_public ? 'success' : 'warning'}>
                          {resource.is_public ? 'Public' : 'Private'}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline-info"
                            onClick={() => testGetResource(resource.id)}
                            disabled={loading}
                          >
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-warning"
                            onClick={() => testUpdateResource(resource.id)}
                            disabled={loading}
                          >
                            Update
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-success"
                            onClick={() => testDownloadResource(resource.id)}
                            disabled={loading}
                          >
                            Download
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => testDeleteResource(resource.id)}
                            disabled={loading}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}

        {loading && (
          <Alert variant="info">
            Processing request...
          </Alert>
        )}

        {result && (
          <Alert variant={result.type}>
            <strong>{result.message}</strong>
            {result.data && (
              <pre className="mt-2 mb-0" style={{ fontSize: '0.8em' }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </Alert>
        )}
      </Card.Body>
    </Card>
  )
}

export default ResourceServiceExample
