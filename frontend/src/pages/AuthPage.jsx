import React, { useState, useCallback } from 'react'
import { Container, Row, Col, Card, Button, Form, Alert, InputGroup } from 'react-bootstrap'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Password Input Component with Eye Toggle (defined outside to prevent recreation)
const PasswordInput = ({ 
  value, 
  onChange, 
  placeholder, 
  name, 
  showPassword, 
  toggleShowPassword,
  required = true 
}) => (
  <InputGroup className="mb-3">
    <Form.Control
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      required={required}
      style={{ borderRadius: '10px 0 0 10px' }}
    />
    <InputGroup.Text
      style={{ 
        cursor: 'pointer', 
        borderRadius: '0 10px 10px 0',
        border: '1px solid #ced4da'
      }}
      onClick={toggleShowPassword}
    >
      {showPassword ? '🙈' : '👁️'}
    </InputGroup.Text>
  </InputGroup>
)

const AuthPage = () => {
  const [authMode, setAuthMode] = useState(null) // null, 'login', 'register'
  const [userRole, setUserRole] = useState(null) // null, 'student', 'teacher'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Password visibility states for each form
  const [studentRegisterPasswordShow, setStudentRegisterPasswordShow] = useState(false)
  const [studentRegisterConfirmPasswordShow, setStudentRegisterConfirmPasswordShow] = useState(false)
  const [studentLoginPasswordShow, setStudentLoginPasswordShow] = useState(false)
  const [teacherRegisterPasswordShow, setTeacherRegisterPasswordShow] = useState(false)
  const [teacherRegisterConfirmPasswordShow, setTeacherRegisterConfirmPasswordShow] = useState(false)
  const [teacherLoginPasswordShow, setTeacherLoginPasswordShow] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Student Registration Form State
  const [studentRegisterData, setStudentRegisterData] = useState({
    first_name: '',
    middle_name: '',
    surname: '',
    admission_number: '',
    email: '',
    password: '',
    confirm_password: ''
  })

  // Student Login Form State
  const [studentLoginData, setStudentLoginData] = useState({
    admission_number: '',
    password: ''
  })

  // Teacher Registration Form State
  const [teacherRegisterData, setTeacherRegisterData] = useState({
    first_name: '',
    surname: '',
    department: '',
    department_secondary: '',
    email: '',
    password: '',
    confirm_password: ''
  })

  // Teacher Login Form State
  const [teacherLoginData, setTeacherLoginData] = useState({
    first_name: '',
    password: ''
  })

  const departmentOptions = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Engineering',
    'Business Administration',
    'Economics',
    'Psychology',
    'Education',
    'Literature',
    'History',
    'Art',
    'Music'
  ]

  // Memoized onChange handlers to prevent recreation on each render
  const handleStudentRegisterPasswordChange = useCallback((e) => {
    setStudentRegisterData(prev => ({...prev, password: e.target.value}))
  }, [])

  const handleStudentRegisterConfirmPasswordChange = useCallback((e) => {
    setStudentRegisterData(prev => ({...prev, confirm_password: e.target.value}))
  }, [])

  const handleStudentLoginPasswordChange = useCallback((e) => {
    setStudentLoginData(prev => ({...prev, password: e.target.value}))
  }, [])

  const handleTeacherRegisterPasswordChange = useCallback((e) => {
    setTeacherRegisterData(prev => ({...prev, password: e.target.value}))
  }, [])

  const handleTeacherRegisterConfirmPasswordChange = useCallback((e) => {
    setTeacherRegisterData(prev => ({...prev, confirm_password: e.target.value}))
  }, [])

  const handleTeacherLoginPasswordChange = useCallback((e) => {
    setTeacherLoginData(prev => ({...prev, password: e.target.value}))
  }, [])



  const handleStudentRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (studentRegisterData.password !== studentRegisterData.confirm_password) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const userData = {
        ...studentRegisterData,
        username: studentRegisterData.admission_number,
        role: 'student'
      }
      const result = await register(userData)
      
      if (result.success) {
        // Auto login after successful registration
        const loginResult = await login({
          username: studentRegisterData.admission_number,
          password: studentRegisterData.password
        })
        if (loginResult.success) {
          navigate('/dashboard')
        } else {
          navigate('/auth')
        }
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleStudentLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login({
        username: studentLoginData.admission_number,
        password: studentLoginData.password
      })
      
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleTeacherRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (teacherRegisterData.password !== teacherRegisterData.confirm_password) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const userData = {
        ...teacherRegisterData,
        username: teacherRegisterData.first_name,
        role: 'teacher'
      }
      const result = await register(userData)
      
      if (result.success) {
        // Auto login after successful registration
        const loginResult = await login({
          username: teacherRegisterData.first_name,
          password: teacherRegisterData.password
        })
        if (loginResult.success) {
          navigate('/dashboard')
        } else {
          navigate('/auth')
        }
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleTeacherLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login({
        username: teacherLoginData.first_name,
        password: teacherLoginData.password
      })
      
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Role Selection Screen
  if (!authMode) {
    return (
      <Container className="py-5" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row className="justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-5 text-center">
                <div className="mb-4">
                  <h1 className="fw-bold text-primary mb-2">Welcome to WIOSHARE</h1>
                  <p className="text-muted">Choose how you'd like to access the platform</p>
                </div>
                
                <Row className="g-4">
                  <Col md={6}>
                    <Card 
                      className="h-100 border-0 shadow-sm"
                      style={{ 
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white',
                        borderRadius: '15px',
                        transition: 'transform 0.3s ease'
                      }}
                      onClick={() => setAuthMode('login')}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Card.Body className="p-4 text-center">
                        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👤</div>
                        <h4 className="fw-bold mb-2">Login</h4>
                        <p className="mb-0 opacity-75">Already have an account?</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6}>
                    <Card 
                      className="h-100 border-0 shadow-sm"
                      style={{ 
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        color: 'white',
                        borderRadius: '15px',
                        transition: 'transform 0.3s ease'
                      }}
                      onClick={() => setAuthMode('register')}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Card.Body className="p-4 text-center">
                        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>👥</div>
                        <h4 className="fw-bold mb-2">Register</h4>
                        <p className="mb-0 opacity-75">Create a new account</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <div className="mt-4 pt-3 border-top">
                  <p className="small text-muted mb-0">
                    Secure • Professional • Easy to Use
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  // Role Selection Screen (after choosing login/register)
  if (!userRole) {
    return (
      <Container className="py-5" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row className="justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-5 text-center">
                <Button 
                  variant="link" 
                  className="position-absolute top-0 start-0 m-3 text-primary text-decoration-none"
                  onClick={() => setAuthMode(null)}
                  style={{ fontSize: '1.2rem' }}
                >
                  ← Back
                </Button>
                
                <div className="mb-4">
                  <h2 className="fw-bold text-primary mb-2">
                    {authMode === 'login' ? 'Login as...' : 'Register as...'}
                  </h2>
                  <p className="text-muted">Select your role to continue</p>
                </div>
                
                <Row className="g-4">
                  <Col md={6}>
                    <Card 
                      className="h-100 border-0 shadow-sm"
                      style={{ 
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        borderRadius: '15px',
                        transition: 'transform 0.3s ease'
                      }}
                      onClick={() => setUserRole('student')}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Card.Body className="p-4 text-center">
                        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎓</div>
                        <h4 className="fw-bold mb-2">Student</h4>
                        <p className="mb-0 opacity-75">Access learning resources</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6}>
                    <Card 
                      className="h-100 border-0 shadow-sm"
                      style={{ 
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        borderRadius: '15px',
                        transition: 'transform 0.3s ease'
                      }}
                      onClick={() => setUserRole('teacher')}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Card.Body className="p-4 text-center">
                        <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📚</div>
                        <h4 className="fw-bold mb-2">Teacher</h4>
                        <p className="mb-0 opacity-75">Manage and share resources</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <div className="mt-4 pt-3 border-top">
                  <p className="small text-muted mb-0">
                    Choose the role that matches your account type
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  // Student Registration Form
  if (authMode === 'register' && userRole === 'student') {
    return (
      <Container className="py-5" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-5">
                <Button 
                  variant="link" 
                  className="position-absolute top-0 start-0 m-3 text-primary text-decoration-none"
                  onClick={() => setUserRole(null)}
                  style={{ fontSize: '1.2rem' }}
                >
                  ← Back
                </Button>
                
                <div className="text-center mb-4">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>🎓</div>
                  <h2 className="fw-bold text-primary mb-2">Student Registration</h2>
                  <p className="text-muted">Create your student account</p>
                </div>

                {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                <Form onSubmit={handleStudentRegister}>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Control
                        type="text"
                        placeholder="First Name"
                        value={studentRegisterData.first_name}
                        onChange={(e) => setStudentRegisterData({...studentRegisterData, first_name: e.target.value})}
                        required
                        style={{ borderRadius: '10px' }}
                      />
                    </Col>
                    <Col md={6} className="mt-3 mt-md-0">
                      <Form.Control
                        type="text"
                        placeholder="Middle Name"
                        value={studentRegisterData.middle_name}
                        onChange={(e) => setStudentRegisterData({...studentRegisterData, middle_name: e.target.value})}
                        style={{ borderRadius: '10px' }}
                      />
                    </Col>
                  </Row>

                  <Form.Control
                    type="text"
                    placeholder="Surname"
                    value={studentRegisterData.surname}
                    onChange={(e) => setStudentRegisterData({...studentRegisterData, surname: e.target.value})}
                    required
                    className="mb-3"
                    style={{ borderRadius: '10px' }}
                  />

                  <Form.Control
                    type="text"
                    placeholder="Admission Number"
                    value={studentRegisterData.admission_number}
                    onChange={(e) => setStudentRegisterData({...studentRegisterData, admission_number: e.target.value})}
                    required
                    className="mb-3"
                    style={{ borderRadius: '10px' }}
                  />

                  <Form.Control
                    type="email"
                    placeholder="Email Address"
                    value={studentRegisterData.email}
                    onChange={(e) => setStudentRegisterData({...studentRegisterData, email: e.target.value})}
                    required
                    className="mb-3"
                    style={{ borderRadius: '10px' }}
                  />

                  <PasswordInput
                    value={studentRegisterData.password}
                    onChange={handleStudentRegisterPasswordChange}
                    placeholder="Password"
                    name="password"
                    showPassword={studentRegisterPasswordShow}
                    toggleShowPassword={() => setStudentRegisterPasswordShow(!studentRegisterPasswordShow)}
                  />

                  <PasswordInput
                    value={studentRegisterData.confirm_password}
                    onChange={handleStudentRegisterConfirmPasswordChange}
                    placeholder="Confirm Password"
                    name="confirm_password"
                    showPassword={studentRegisterConfirmPasswordShow}
                    toggleShowPassword={() => setStudentRegisterConfirmPasswordShow(!studentRegisterConfirmPasswordShow)}
                  />

                  <Button
                    type="submit"
                    className="w-100 fw-bold"
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px'
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Create Student Account'}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="text-muted">
                    Already have a student account? 
                    <Button 
                      variant="link" 
                      className="text-primary fw-bold text-decoration-none p-1"
                      onClick={() => setAuthMode('login')}
                    >
                      Login here
                    </Button>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  // Student Login Form
  if (authMode === 'login' && userRole === 'student') {
    return (
      <Container className="py-5" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row className="justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-5">
                <Button 
                  variant="link" 
                  className="position-absolute top-0 start-0 m-3 text-primary text-decoration-none"
                  onClick={() => setUserRole(null)}
                  style={{ fontSize: '1.2rem' }}
                >
                  ← Back
                </Button>
                
                <div className="text-center mb-4">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>🎓</div>
                  <h2 className="fw-bold text-primary mb-2">Student Login</h2>
                  <p className="text-muted">Welcome back! Please sign in to your account</p>
                </div>

                {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                <Form onSubmit={handleStudentLogin}>
                  <Form.Control
                    type="text"
                    placeholder="Admission Number"
                    value={studentLoginData.admission_number}
                    onChange={(e) => setStudentLoginData({...studentLoginData, admission_number: e.target.value})}
                    required
                    className="mb-3"
                    style={{ borderRadius: '10px' }}
                  />

                  <PasswordInput
                    value={studentLoginData.password}
                    onChange={handleStudentLoginPasswordChange}
                    placeholder="Password"
                    name="password"
                    showPassword={studentLoginPasswordShow}
                    toggleShowPassword={() => setStudentLoginPasswordShow(!studentLoginPasswordShow)}
                  />

                  <Button
                    type="submit"
                    className="w-100 fw-bold"
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px'
                    }}
                  >
                    {loading ? 'Signing In...' : 'Sign In as Student'}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="text-muted">
                    Don't have a student account? 
                    <Button 
                      variant="link" 
                      className="text-primary fw-bold text-decoration-none p-1"
                      onClick={() => setAuthMode('register')}
                    >
                      Register here
                    </Button>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  // Teacher Registration Form
  if (authMode === 'register' && userRole === 'teacher') {
    return (
      <Container className="py-5" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-5">
                <Button 
                  variant="link" 
                  className="position-absolute top-0 start-0 m-3 text-primary text-decoration-none"
                  onClick={() => setUserRole(null)}
                  style={{ fontSize: '1.2rem' }}
                >
                  ← Back
                </Button>
                
                <div className="text-center mb-4">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>📚</div>
                  <h2 className="fw-bold text-primary mb-2">Teacher Registration</h2>
                  <p className="text-muted">Create your teacher account</p>
                </div>

                {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                <Form onSubmit={handleTeacherRegister}>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Control
                        type="text"
                        placeholder="First Name"
                        value={teacherRegisterData.first_name}
                        onChange={(e) => setTeacherRegisterData({...teacherRegisterData, first_name: e.target.value})}
                        required
                        style={{ borderRadius: '10px' }}
                      />
                    </Col>
                    <Col md={6} className="mt-3 mt-md-0">
                      <Form.Control
                        type="text"
                        placeholder="Surname"
                        value={teacherRegisterData.surname}
                        onChange={(e) => setTeacherRegisterData({...teacherRegisterData, surname: e.target.value})}
                        required
                        style={{ borderRadius: '10px' }}
                      />
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Select
                        value={teacherRegisterData.department}
                        onChange={(e) => setTeacherRegisterData({...teacherRegisterData, department: e.target.value})}
                        required
                        style={{ borderRadius: '10px' }}
                      >
                        <option value="">Primary Department</option>
                        {departmentOptions.map((dept, index) => (
                          <option key={index} value={dept}>{dept}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={6} className="mt-3 mt-md-0">
                      <Form.Select
                        value={teacherRegisterData.department_secondary}
                        onChange={(e) => setTeacherRegisterData({...teacherRegisterData, department_secondary: e.target.value})}
                        style={{ borderRadius: '10px' }}
                      >
                        <option value="">Secondary Department (Optional)</option>
                        {departmentOptions.map((dept, index) => (
                          <option key={index} value={dept}>{dept}</option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>

                  <Form.Control
                    type="email"
                    placeholder="Email Address"
                    value={teacherRegisterData.email}
                    onChange={(e) => setTeacherRegisterData({...teacherRegisterData, email: e.target.value})}
                    required
                    className="mb-3"
                    style={{ borderRadius: '10px' }}
                  />

                  <PasswordInput
                    value={teacherRegisterData.password}
                    onChange={handleTeacherRegisterPasswordChange}
                    placeholder="Password"
                    name="password"
                    showPassword={teacherRegisterPasswordShow}
                    toggleShowPassword={() => setTeacherRegisterPasswordShow(!teacherRegisterPasswordShow)}
                  />

                  <PasswordInput
                    value={teacherRegisterData.confirm_password}
                    onChange={handleTeacherRegisterConfirmPasswordChange}
                    placeholder="Confirm Password"
                    name="confirm_password"
                    showPassword={teacherRegisterConfirmPasswordShow}
                    toggleShowPassword={() => setTeacherRegisterConfirmPasswordShow(!teacherRegisterConfirmPasswordShow)}
                  />

                  <Button
                    type="submit"
                    className="w-100 fw-bold"
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px'
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Create Teacher Account'}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="text-muted">
                    Already have a teacher account? 
                    <Button 
                      variant="link" 
                      className="text-primary fw-bold text-decoration-none p-1"
                      onClick={() => setAuthMode('login')}
                    >
                      Login here
                    </Button>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  // Teacher Login Form
  if (authMode === 'login' && userRole === 'teacher') {
    return (
      <Container className="py-5" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Row className="justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <Col md={8} lg={6}>
            <Card className="shadow-lg border-0" style={{ borderRadius: '20px' }}>
              <Card.Body className="p-5">
                <Button 
                  variant="link" 
                  className="position-absolute top-0 start-0 m-3 text-primary text-decoration-none"
                  onClick={() => setUserRole(null)}
                  style={{ fontSize: '1.2rem' }}
                >
                  ← Back
                </Button>
                
                <div className="text-center mb-4">
                  <div className="mb-3" style={{ fontSize: '3rem' }}>📚</div>
                  <h2 className="fw-bold text-primary mb-2">Teacher Login</h2>
                  <p className="text-muted">Welcome back! Please sign in to your account</p>
                </div>

                {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                <Form onSubmit={handleTeacherLogin}>
                  <Form.Control
                    type="text"
                    placeholder="First Name"
                    value={teacherLoginData.first_name}
                    onChange={(e) => setTeacherLoginData({...teacherLoginData, first_name: e.target.value})}
                    required
                    className="mb-3"
                    style={{ borderRadius: '10px' }}
                  />

                  <PasswordInput
                    value={teacherLoginData.password}
                    onChange={handleTeacherLoginPasswordChange}
                    placeholder="Password"
                    name="password"
                    showPassword={teacherLoginPasswordShow}
                    toggleShowPassword={() => setTeacherLoginPasswordShow(!teacherLoginPasswordShow)}
                  />

                  <Button
                    type="submit"
                    className="w-100 fw-bold"
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px'
                    }}
                  >
                    {loading ? 'Signing In...' : 'Sign In as Teacher'}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <p className="text-muted">
                    Don't have a teacher account? 
                    <Button 
                      variant="link" 
                      className="text-primary fw-bold text-decoration-none p-1"
                      onClick={() => setAuthMode('register')}
                    >
                      Register here
                    </Button>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    )
  }

  return null
}

export default AuthPage
