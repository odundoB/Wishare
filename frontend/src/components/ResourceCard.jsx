import React from 'react'
import { Card, Badge, Button, Dropdown } from 'react-bootstrap'

const ResourceCard = ({ 
  resource, 
  onDownload, 
  onEdit, 
  onDelete, 
  canEdit, 
  canDelete 
}) => {
  const getFileIcon = (resource) => {
    if (resource.resource_type === 'url') {
      return '🔗'
    }
    
    const extension = resource.file?.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'ppt':
      case 'pptx':
        return '📊'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️'
      case 'mp4':
        return '🎥'
      case 'mp3':
      case 'wav':
        return '🎵'
      default:
        return '📄'
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center">
            <span className="text-primary me-2 fs-4">
              {getFileIcon(resource)}
            </span>
            <Badge bg="secondary" className="me-2">
              {resource.subject}
            </Badge>
            {!resource.is_public && (
              <Badge bg="warning">Private</Badge>
            )}
          </div>
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              ⋮
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => onDownload(resource)}>
                ⬇️ Download
              </Dropdown.Item>
              {canEdit && (
                <Dropdown.Item onClick={() => onEdit(resource)}>
                  ✏️ Edit
                </Dropdown.Item>
              )}
              {canDelete && (
                <Dropdown.Item 
                  className="text-danger"
                  onClick={() => onDelete(resource)}
                >
                  🗑️ Delete
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          </Dropdown>
        </div>

        <h6 className="card-title mb-2">{resource.title}</h6>
        <p className="card-text text-muted small mb-3">
          {resource.description.length > 100 
            ? `${resource.description.substring(0, 100)}...`
            : resource.description
          }
        </p>

        {resource.tags && (
          <div className="mb-3">
            {resource.tags.split(',').slice(0, 3).map((tag, index) => (
              <Badge key={index} bg="light" text="dark" className="me-1">
                🏷️ {tag.trim()}
              </Badge>
            ))}
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center text-muted small">
          <div>
            👤 {resource.uploaded_by?.username || 'Unknown'}
          </div>
          <div>
            📅 {formatDate(resource.created_at)}
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-2">
          <div className="text-muted small">
            {resource.resource_type === 'file' && resource.file_size && (
              <span>{formatFileSize(resource.file_size)}</span>
            )}
            {resource.download_count > 0 && (
              <span className="ms-2">
                ⬇️ {resource.download_count}
              </span>
            )}
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => onDownload(resource)}
          >
            {resource.resource_type === 'url' ? '🔗 Visit' : '⬇️ Download'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}

export default ResourceCard