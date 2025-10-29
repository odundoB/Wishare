import React from 'react'
import { Card, Row, Col, Form, Button, Dropdown } from 'react-bootstrap'

const EventFilters = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onSearch,
  onClearSearch
}) => {
  const statusOptions = [
    { value: '', label: 'All Events' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'past', label: 'Past' }
  ]

  const sortOptions = [
    { value: 'start_time', label: 'Start Time' },
    { value: 'title', label: 'Title' },
    { value: 'created_at', label: 'Created Date' }
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
    <Card className="mb-4" style={{ position: 'relative', zIndex: 1000 }}>
      <Card.Body>
        <Row>
          <Col md={6}>
            <Form onSubmit={handleSearch}>
              <div className="input-group">
                <Form.Control
                  type="text"
                  placeholder="Search events by title, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" variant="outline-secondary">
                  🔍
                </Button>
                {searchQuery && (
                  <Button 
                    type="button" 
                    variant="outline-danger"
                    onClick={onClearSearch}
                    title="Clear search"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </Form>
          </Col>
          <Col md={6}>
            <div className="d-flex gap-2 flex-wrap">
              <Dropdown className="stable-dropdown">
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

              <Dropdown className="stable-dropdown">
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
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}

export default EventFilters
