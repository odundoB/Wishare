import React, { useState } from 'react'
import { Container, Card, Form, InputGroup } from 'react-bootstrap'

const PasswordTestPage = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const PasswordInput = ({ 
    value, 
    onChange, 
    placeholder, 
    name, 
    showPassword, 
    toggleShowPassword
  }) => (
    <InputGroup className="mb-3">
      <Form.Control
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
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

  return (
    <Container className="py-5">
      <Card className="mx-auto" style={{ maxWidth: '500px' }}>
        <Card.Body className="p-4">
          <h3 className="text-center mb-4">Password Field Test</h3>
          
          <Form>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              name="password"
              showPassword={showPassword}
              toggleShowPassword={() => setShowPassword(!showPassword)}
            />

            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              name="confirm_password"
              showPassword={showConfirmPassword}
              toggleShowPassword={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </Form>

          <div className="mt-3">
            <p><strong>Password:</strong> {password}</p>
            <p><strong>Confirm Password:</strong> {confirmPassword}</p>
            <p><strong>Password Length:</strong> {password.length}</p>
            <p><strong>Confirm Password Length:</strong> {confirmPassword.length}</p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default PasswordTestPage