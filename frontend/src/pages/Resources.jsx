import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Alert, Spinner, Modal, Pagination } from 'react-bootstrap'
import { 
  getResources, uploadResource, deleteResource, downloadResource, searchResources 
} from '../services/resources'
import { useAuth } from '../contexts/AuthContext'
import ResourceCard from '../components/ResourceCard'
import ResourceUploadModal from '../components/ResourceUploadModal'
import ResourceFilters from '../components/ResourceFilters'
import ResourceStats from '../components/ResourceStats'

const Resources = () => {
  const { user } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [uploading, setUploading] = useState(false)


  useEffect(() => {
    fetchResources()
  }, [currentPage, selectedSubject, selectedType, sortBy, sortOrder, searchQuery])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        subject: selectedSubject,
        resource_type: selectedType,
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

  const handleUpload = async (formData) => {
    try {
      setUploading(true)
      setError('')

      const uploadFormData = new FormData()
      uploadFormData.append('title', formData.title)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('subject', formData.subject)
      uploadFormData.append('tags', formData.tags)
      // uploadFormData.append('resource_type', formData.resource_type) // Not needed by backend
      uploadFormData.append('is_public', formData.is_public.toString())

      if (formData.resource_type === 'file' && formData.file) {
        uploadFormData.append('file', formData.file)
      } else if (formData.resource_type === 'url' && formData.url) {
        uploadFormData.append('url', formData.url)
      }

      console.log('Uploading with FormData:', Object.fromEntries(uploadFormData.entries()))
      await uploadResource(uploadFormData)
      setShowUploadModal(false)
      fetchResources()
    } catch (err) {
      console.error('Upload error:', err)
      console.error('Error response:', err.response?.data)
      setError('Upload failed: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    try {
      console.log('Attempting to delete resource:', selectedResource)
      console.log('Current user:', user)
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
    
    console.log('Delete permission check:', {
      user: user,
      userRole: user?.role,
      userIsStaff: user?.is_staff,
      resourceUploadedById: resource.uploaded_by_id,
      canDelete: canDelete
    })
    
    return canDelete
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                📚 Knowledge Resources
              </h2>
              <p className="text-muted mb-0">
                Share and discover educational materials with the community
              </p>
            </div>
            {user && (user.role === 'teacher' || user.role === 'admin') && (
              <Button
                variant="primary"
                onClick={() => setShowUploadModal(true)}
                className="d-flex align-items-center"
              >
                ➕ Upload Resource
              </Button>
            )}
          </div>
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
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onSearch={handleSearch}
      />

      {/* Stats */}
      <ResourceStats
        totalCount={totalCount}
        fileCount={resources.filter(r => r.resource_type === 'file').length}
        urlCount={resources.filter(r => r.resource_type === 'url').length}
        totalDownloads={resources.reduce((sum, r) => sum + (r.download_count || 0), 0)}
      />

      {/* Resources List */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading resources...</p>
        </div>
      ) : resources.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <div className="text-muted mb-3" style={{ fontSize: '3rem' }}>📚</div>
            <h5>No resources found</h5>
            <p className="text-muted">
              {searchQuery || selectedSubject || selectedType 
                ? 'Try adjusting your search criteria'
                : 'Be the first to share a resource!'
              }
            </p>
            {user && (user.role === 'teacher' || user.role === 'admin') && (
              <Button variant="primary" onClick={() => setShowUploadModal(true)}>
                ⬆️ Upload First Resource
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
                    console.log('Edit resource:', resource)
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
    </Container>
  )
}

export default Resources