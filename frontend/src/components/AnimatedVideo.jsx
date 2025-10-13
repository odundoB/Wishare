import React, { useEffect, useRef } from 'react'

const AnimatedVideo = () => {
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

    // Animation variables
    let time = 0
    const users = [
      { 
        x: 0.2, y: 0.3, emoji: '👩‍💻', color: '#ff6b6b', 
        speedX: 0.015, speedY: 0.012, 
        radiusX: 40, radiusY: 30,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        baseX: 0.2, baseY: 0.3
      },
      { 
        x: 0.8, y: 0.2, emoji: '👨‍🎓', color: '#4ecdc4', 
        speedX: 0.018, speedY: 0.014, 
        radiusX: 35, radiusY: 25,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        baseX: 0.8, baseY: 0.2
      },
      { 
        x: 0.1, y: 0.7, emoji: '👩‍🏫', color: '#45b7d1', 
        speedX: 0.022, speedY: 0.016, 
        radiusX: 45, radiusY: 35,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        baseX: 0.1, baseY: 0.7
      },
      { 
        x: 0.9, y: 0.6, emoji: '👨‍💼', color: '#96ceb4', 
        speedX: 0.012, speedY: 0.020, 
        radiusX: 30, radiusY: 40,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        baseX: 0.9, baseY: 0.6
      },
      { 
        x: 0.5, y: 0.1, emoji: '👩‍🔬', color: '#feca57', 
        speedX: 0.025, speedY: 0.018, 
        radiusX: 50, radiusY: 20,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        baseX: 0.5, baseY: 0.1
      },
      { 
        x: 0.6, y: 0.8, emoji: '👨‍🎨', color: '#ff9ff3', 
        speedX: 0.020, speedY: 0.015, 
        radiusX: 38, radiusY: 32,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        baseX: 0.6, baseY: 0.8
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

    // Draw floating users with continuous random motion
    const drawUsers = () => {
      users.forEach((user, index) => {
        // Calculate random motion using multiple sine waves for more complex movement
        const motionX1 = Math.sin(time * user.speedX + user.phaseX) * user.radiusX
        const motionX2 = Math.sin(time * user.speedX * 1.7 + user.phaseX + 1) * (user.radiusX * 0.5)
        const motionX3 = Math.sin(time * user.speedX * 0.3 + user.phaseX + 2) * (user.radiusX * 0.3)
        
        const motionY1 = Math.cos(time * user.speedY + user.phaseY) * user.radiusY
        const motionY2 = Math.cos(time * user.speedY * 1.3 + user.phaseY + 1.5) * (user.radiusY * 0.6)
        const motionY3 = Math.cos(time * user.speedY * 0.7 + user.phaseY + 3) * (user.radiusY * 0.4)
        
        // Add some random drift
        const driftX = Math.sin(time * 0.005 + index) * 15
        const driftY = Math.cos(time * 0.003 + index) * 10
        
        // Calculate final position
        const x = (user.baseX * canvas.width) + motionX1 + motionX2 + motionX3 + driftX
        const y = (user.baseY * canvas.height) + motionY1 + motionY2 + motionY3 + driftY
        
        // Ensure users stay within canvas bounds
        const boundedX = Math.max(40, Math.min(canvas.width - 40, x))
        const boundedY = Math.max(40, Math.min(canvas.height - 40, y))

        // Draw user circle with pulsing effect
        const pulse = 1 + Math.sin(time * 2 + index) * 0.1
        const radius = 30 * pulse
        
        ctx.beginPath()
        ctx.arc(boundedX, boundedY, radius, 0, Math.PI * 2)
        ctx.fillStyle = user.color
        ctx.fill()
        
        // Add glow effect
        ctx.shadowColor = user.color
        ctx.shadowBlur = 10
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.shadowBlur = 0

        // Draw emoji with slight rotation
        const rotation = Math.sin(time * 0.5 + index) * 0.1
        ctx.save()
        ctx.translate(boundedX, boundedY)
        ctx.rotate(rotation)
        ctx.font = '24px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(user.emoji, 0, 0)
        ctx.restore()

        // Draw device lines with random movement
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        const deviceX = boundedX + Math.sin(time * 3 + index) * 15
        const deviceY = boundedY + 30 + Math.cos(time * 2.5 + index) * 8
        ctx.moveTo(boundedX, boundedY + radius)
        ctx.lineTo(deviceX, deviceY)
        ctx.stroke()
        
        // Add some random particles around each user
        for (let i = 0; i < 3; i++) {
          const particleX = boundedX + Math.sin(time * 4 + index + i) * 60
          const particleY = boundedY + Math.cos(time * 3.5 + index + i) * 40
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
          ctx.beginPath()
          ctx.arc(particleX, particleY, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    }

    // Draw digital elements with enhanced random motion
    const drawDigitalElements = () => {
      // Floating data particles with more complex motion
      for (let i = 0; i < 20; i++) {
        const baseX = (canvas.width / 20) * i
        const baseY = (canvas.height / 8) * (i % 4 + 1)
        
        const motionX = Math.sin(time * 0.02 + i) * 50 + Math.sin(time * 0.005 + i * 2) * 25
        const motionY = Math.cos(time * 0.015 + i) * 40 + Math.cos(time * 0.008 + i * 1.5) * 20
        
        const x = baseX + motionX
        const y = baseY + motionY
        
        // Add pulsing effect
        const pulse = 1 + Math.sin(time * 3 + i) * 0.3
        const size = 3 * pulse
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time * 2 + i) * 0.05})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Dynamic connection lines between users
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1
      
      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          const user1 = users[i]
          const user2 = users[j]
          
          // Calculate current positions using the same logic as drawUsers
          const motionX1_1 = Math.sin(time * user1.speedX + user1.phaseX) * user1.radiusX
          const motionX1_2 = Math.sin(time * user1.speedX * 1.7 + user1.phaseX + 1) * (user1.radiusX * 0.5)
          const motionX1_3 = Math.sin(time * user1.speedX * 0.3 + user1.phaseX + 2) * (user1.radiusX * 0.3)
          const driftX1 = Math.sin(time * 0.005 + i) * 15
          const x1 = (user1.baseX * canvas.width) + motionX1_1 + motionX1_2 + motionX1_3 + driftX1
          
          const motionY1_1 = Math.cos(time * user1.speedY + user1.phaseY) * user1.radiusY
          const motionY1_2 = Math.cos(time * user1.speedY * 1.3 + user1.phaseY + 1.5) * (user1.radiusY * 0.6)
          const motionY1_3 = Math.cos(time * user1.speedY * 0.7 + user1.phaseY + 3) * (user1.radiusY * 0.4)
          const driftY1 = Math.cos(time * 0.003 + i) * 10
          const y1 = (user1.baseY * canvas.height) + motionY1_1 + motionY1_2 + motionY1_3 + driftY1
          
          const motionX2_1 = Math.sin(time * user2.speedX + user2.phaseX) * user2.radiusX
          const motionX2_2 = Math.sin(time * user2.speedX * 1.7 + user2.phaseX + 1) * (user2.radiusX * 0.5)
          const motionX2_3 = Math.sin(time * user2.speedX * 0.3 + user2.phaseX + 2) * (user2.radiusX * 0.3)
          const driftX2 = Math.sin(time * 0.005 + j) * 15
          const x2 = (user2.baseX * canvas.width) + motionX2_1 + motionX2_2 + motionX2_3 + driftX2
          
          const motionY2_1 = Math.cos(time * user2.speedY + user2.phaseY) * user2.radiusY
          const motionY2_2 = Math.cos(time * user2.speedY * 1.3 + user2.phaseY + 1.5) * (user2.radiusY * 0.6)
          const motionY2_3 = Math.cos(time * user2.speedY * 0.7 + user2.phaseY + 3) * (user2.radiusY * 0.4)
          const driftY2 = Math.cos(time * 0.003 + j) * 10
          const y2 = (user2.baseY * canvas.height) + motionY2_1 + motionY2_2 + motionY2_3 + driftY2
          
          // Only draw lines between nearby users
          const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
          if (distance < 200) {
            const opacity = Math.max(0, 0.15 - (distance / 200) * 0.1)
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
            
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.stroke()
          }
        }
      }
      
      // Add some random floating text elements
      const texts = ['📚', '💻', '📱', '🎓', '🔬', '💡']
      for (let i = 0; i < 8; i++) {
        const textX = Math.sin(time * 0.01 + i * 2) * canvas.width * 0.3 + canvas.width * 0.5
        const textY = Math.cos(time * 0.008 + i * 1.5) * canvas.height * 0.2 + canvas.height * 0.5
        const text = texts[i % texts.length]
        
        ctx.font = '16px Arial'
        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(time * 2 + i) * 0.05})`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, textX, textY)
      }
    }

    // Animation loop with variable speed for more dynamic motion
    const animate = () => {
      time += 0.02 // Increased speed for more dynamic motion
      
      drawBackground()
      drawUsers()
      drawDigitalElements()
      
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
    <div className="animated-video-container">
      <canvas
        ref={canvasRef}
        className="animated-canvas"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '20px'
        }}
      />
      <div className="video-overlay">
        <div className="overlay-content">
          <h5 className="text-white mb-2">📚 Digital Learning Hub</h5>
          <p className="text-white-50 small">Connecting diverse minds through technology</p>
          <div className="video-controls mt-3">
            <button 
              className="btn btn-outline-light btn-sm"
              onClick={() => window.location.reload()}
            >
              🔄 Refresh Animation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnimatedVideo
