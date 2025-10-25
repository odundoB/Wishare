import React from 'react'
import { Card, Row, Col, Form, Button, Dropdown } from 'react-bootstrap'

const ResourceFilters = ({
  searchQuery,
  setSearchQuery,
  selectedSubject,
  setSelectedSubject,
  selectedType,
  setSelectedType,
  selectedFormLevel,
  setSelectedFormLevel,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onSearch
}) => {
  const subjects = [
    { value: '', label: 'All Subjects' },
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

  const resourceTypes = [
    { value: '', label: 'All Types' },
    { value: 'file', label: 'File Upload' },
    { value: 'url', label: 'External Link' }
  ]

  const formLevels = [
    { value: '', label: 'All Form Levels' },
    { value: 'form1', label: 'Form 1' },
    { value: 'form2', label: 'Form 2' },
    { value: 'form3', label: 'Form 3' },
    { value: 'form4', label: 'Form 4' },
    { value: 'other', label: 'Other/General' }
  ]

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'title', label: 'Title' },
    { value: 'download_count', label: 'Downloads' },
    { value: 'subject', label: 'Subject' }
  ]

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'subject':
        setSelectedSubject(value)
        break
      case 'type':
        setSelectedType(value)
        break
      case 'form_level':
        setSelectedFormLevel(value)
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
    <div className="resource-filters">
      <Card className="mb-4" style={{ position: 'relative', zIndex: 10 }}>
        <Card.Body>
        <Row>
          <Col md={6}>
            <Form onSubmit={handleSearch}>
              <div className="input-group">
                <Form.Control
                  type="text"
                  placeholder="Search resources..."
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
            <div className="d-flex gap-2 flex-wrap" style={{ position: 'relative', zIndex: 20 }}>
              <Dropdown drop="down" align="start">
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  🔽 Subject: {selectedSubject || 'All'}
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ zIndex: 1050 }}>
                  {subjects.map(subject => (
                    <Dropdown.Item
                      key={subject.value}
                      onClick={() => handleFilterChange('subject', subject.value)}
                      active={selectedSubject === subject.value}
                    >
                      {subject.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              <Dropdown drop="down" align="start">
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  📄 Type: {selectedType || 'All'}
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ zIndex: 1050 }}>
                  {resourceTypes.map(type => (
                    <Dropdown.Item
                      key={type.value}
                      onClick={() => handleFilterChange('type', type.value)}
                      active={selectedType === type.value}
                    >
                      {type.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              <Dropdown drop="down" align="start">
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  📚 Form: {formLevels.find(level => level.value === selectedFormLevel)?.label || 'All'}
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ zIndex: 1050 }}>
                  {formLevels.map(level => (
                    <Dropdown.Item
                      key={level.value}
                      onClick={() => handleFilterChange('form_level', level.value)}
                      active={selectedFormLevel === level.value}
                    >
                      {level.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>

              <Dropdown drop="down" align="start">
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  ↕️ Sort: {sortOptions.find(opt => opt.value === sortBy)?.label}
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ zIndex: 1050 }}>
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
    </div>
  )
}

export default ResourceFilters
