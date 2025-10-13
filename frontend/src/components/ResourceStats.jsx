import React from 'react'
import { Row, Col, Card } from 'react-bootstrap'

const ResourceStats = ({ 
  totalCount, 
  fileCount, 
  urlCount, 
  totalDownloads 
}) => {
  return (
    <Row className="mb-4">
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="text-primary">{totalCount}</h4>
            <small className="text-muted">Total Resources</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="text-success">{fileCount}</h4>
            <small className="text-muted">File Uploads</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="text-info">{urlCount}</h4>
            <small className="text-muted">External Links</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={3}>
        <Card className="text-center">
          <Card.Body>
            <h4 className="text-warning">{totalDownloads}</h4>
            <small className="text-muted">Total Downloads</small>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  )
}

export default ResourceStats
