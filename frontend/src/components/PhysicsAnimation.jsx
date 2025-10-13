import React, { useEffect, useRef } from 'react'

const PhysicsAnimation = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Physics-based user objects
    const users = [
      { 
        x: 100, y: 100, vx: 2, vy: 1.5, 
        emoji: '👩‍💻', color: '#ff6b6b', 
        radius: 30, mass: 1
      },
      { 
        x: 300, y: 150, vx: -1.8, vy: 2.2, 
        emoji: '👨‍🎓', color: '#4ecdc4', 
        radius: 30, mass: 1
      },
      { 
        x: 200, y: 300, vx: 1.2, vy: -1.8, 
        emoji: '👩‍🏫', color: '#45b7d1', 
        radius: 30, mass: 1
      },
      { 
        x: 400, y: 200, vx: -2.5, vy: 1.0, 
        emoji: '👨‍💼', color: '#96ceb4', 
        radius: 30, mass: 1
      },
      { 
        x: 150, y: 400, vx: 1.8, vy: -2.3, 
        emoji: '👩‍🔬', color: '#feca57', 
        radius: 30, mass: 1
      },
      { 
        x: 350, y: 350, vx: -1.5, vy: -1.7, 
        emoji: '👨‍🎨', color: '#ff9ff3', 
        radius: 30, mass: 1
      }
    ]

    // Draw library background
    const drawBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#667eea')
      gradient.addColorStop(1, '#764ba2')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw library shelves
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 2
      for (let i = 0; i < 5; i++) {
        const y = (canvas.height / 6) * (i + 1)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw books
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      for (let i = 0; i < 20; i++) {
        const x = (canvas.width / 20) * i
        const y = (canvas.height / 6) * (Math.floor(i / 4) + 1) - 10
        ctx.fillRect(x, y, 20, 15)
      }
    }

    // Collision detection between two users
    const checkCollision = (user1, user2) => {
      const dx = user2.x - user1.x
      const dy = user2.y - user1.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < (user1.radius + user2.radius)
    }

    // Handle collision between two users
    const handleCollision = (user1, user2) => {
      const dx = user2.x - user1.x
      const dy = user2.y - user1.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Normalize collision vector
      const nx = dx / distance
      const ny = dy / distance
      
      // Relative velocity
      const dvx = user2.vx - user1.vx
      const dvy = user2.vy - user1.vy
      
      // Relative velocity in collision normal direction
      const dvn = dvx * nx + dvy * ny
      
      // Do not resolve if velocities are separating
      if (dvn > 0) return
      
      // Collision impulse
      const impulse = 2 * dvn / (user1.mass + user2.mass)
      
      // Update velocities
      user1.vx += impulse * user2.mass * nx
      user1.vy += impulse * user2.mass * ny
      user2.vx -= impulse * user1.mass * nx
      user2.vy -= impulse * user1.mass * ny
      
      // Separate users to prevent overlap
      const overlap = (user1.radius + user2.radius) - distance
      const separationX = overlap * nx * 0.5
      const separationY = overlap * ny * 0.5
      
      user1.x -= separationX
      user1.y -= separationY
      user2.x += separationX
      user2.y += separationY
    }

    // Update physics for all users
    const updatePhysics = () => {
      // Update positions
      users.forEach(user => {
        user.x += user.vx
        user.y += user.vy
        
        // Bounce off walls
        if (user.x - user.radius <= 0 || user.x + user.radius >= canvas.width) {
          user.vx = -user.vx
          user.x = Math.max(user.radius, Math.min(canvas.width - user.radius, user.x))
        }
        if (user.y - user.radius <= 0 || user.y + user.radius >= canvas.height) {
          user.vy = -user.vy
          user.y = Math.max(user.radius, Math.min(canvas.height - user.radius, user.y))
        }
      })
      
      // Check for collisions between all users
      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          if (checkCollision(users[i], users[j])) {
            handleCollision(users[i], users[j])
          }
        }
      }
    }

    // Draw users with physics-based movement
    const drawUsers = () => {
      users.forEach((user, index) => {
        // Draw user circle with glow effect
        ctx.shadowColor = user.color
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.arc(user.x, user.y, user.radius, 0, Math.PI * 2)
        ctx.fillStyle = user.color
        ctx.fill()
        ctx.shadowBlur = 0
        
        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 2
        ctx.stroke()
        
        // Draw emoji
        ctx.font = '24px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'white'
        ctx.fillText(user.emoji, user.x, user.y)
        
        // Draw velocity indicator
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(user.x, user.y)
        ctx.lineTo(user.x + user.vx * 10, user.y + user.vy * 10)
        ctx.stroke()
      })
    }

    // Draw connection lines between nearby users
    const drawConnections = () => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      
      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          const user1 = users[i]
          const user2 = users[j]
          const distance = Math.sqrt(
            Math.pow(user2.x - user1.x, 2) + Math.pow(user2.y - user1.y, 2)
          )
          
          if (distance < 150) {
            const opacity = Math.max(0, 0.2 - (distance / 150) * 0.1)
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
            ctx.beginPath()
            ctx.moveTo(user1.x, user1.y)
            ctx.lineTo(user2.x, user2.y)
            ctx.stroke()
          }
        }
      }
    }

    // Draw floating particles
    const drawParticles = () => {
      for (let i = 0; i < 15; i++) {
        const x = Math.sin(Date.now() * 0.001 + i) * canvas.width * 0.3 + canvas.width * 0.5
        const y = Math.cos(Date.now() * 0.0008 + i) * canvas.height * 0.2 + canvas.height * 0.5
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      drawBackground()
      updatePhysics()
      drawUsers()
      drawConnections()
      drawParticles()
      
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return (
    <div className="physics-animation-container">
      <canvas
        ref={canvasRef}
        className="physics-canvas"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '20px'
        }}
      />
      <div className="video-overlay">
        <div className="overlay-content">
          <h5 className="text-white mb-2">📚 Digital Learning Hub</h5>
          <p className="text-white-50 small">Diverse minds collaborating in real-time</p>
        </div>
      </div>
    </div>
  )
}

export default PhysicsAnimation
