import React from 'react'
import { Card, Row, Col, Form, Button, Dropdown, ButtonGroup } from 'react-bootstrap'

const NotificationFilters = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onSearch,
  onMarkAllRead,
  onMarkAllUnread,
  onDeleteAll
}) => {
  const statusOptions = [
    { value: '', label: 'All Notifications' },
    { value: 'unread', label: 'Unread Only' },
    { value: 'read', label: 'Read Only' }
  ]

  const sortOptions = [
    { value: 'created_at', label: 'Date' },
    { value: 'is_read', label: 'Read Status' },
    { value: 'verb', label: 'Type' }
  ]

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'status':
        setSelectedStatus(value)
        break
      case 'sort':
        const [field, order] = value.split('_')
        setSortBy(field)
        setSortOrder(order)
        break
      default:
        break
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch()
  }

  return (
    <Card className="mb-4">
      <Card.Body>
        <Row>
          <Col md={6}>
            <Form onSubmit={handleSearch}>
              <div className="input-group">
                <Form.Control
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" variant="outline-secondary">
                  🔍
                </Button>
              </div>
            </Form>
          </Col>
          <Col md={6}>
            <div className="d-flex gap-2 flex-wrap justify-content-end">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  🔽 Status: {selectedStatus || 'All'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {statusOptions.map(status => (
                    <Dropdown.Item
                      key={status.value}
                      onClick={() => handleFilterChange('status', status.value)}
                      active={selectedStatus === status.value}
                    >
                      {status.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  ↕️ Sort: {sortOptions.find(opt => opt.value === sortBy)?.label}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {sortOptions.map(option => (
                    <Dropdown.Item
                      key={`${option.value}_asc`}
                      onClick={() => handleFilterChange('sort', `${option.value}_asc`)}
                      active={sortBy === option.value && sortOrder === 'asc'}
                    >
                      {option.label} (A-Z)
                    </Dropdown.Item>
                  ))}
                  {sortOptions.map(option => (
                    <Dropdown.Item
                      key={`${option.value}_desc`}
                      onClick={() => handleFilterChange('sort', `${option.value}_desc`)}
                      active={sortBy === option.value && sortOrder === 'desc'}
                    >
                      {option.label} (Z-A)
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              <ButtonGroup size="sm">
                <Button variant="outline-success" onClick={onMarkAllRead}>
                  📭 Mark All Read
                </Button>
                <Button variant="outline-warning" onClick={onMarkAllUnread}>
                  📬 Mark All Unread
                </Button>
                <Button variant="outline-danger" onClick={onDeleteAll}>
                  🗑️ Delete All
                </Button>
              </ButtonGroup>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}

export default NotificationFilters
