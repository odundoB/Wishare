import React, { useState, useEffect, useRef } from 'react'
import PhysicsAnimation from './PhysicsAnimation'

const VideoPlayer = () => {
  const videoRef = useRef(null)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false) // Start with false to show animation immediately
  const [error, setError] = useState(true) // Start with true to show animation immediately

  // Multiple video sources for random playback
  const videoSources = [
    {
      src: '/videos/library-diverse-users.mp4',
      type: 'video/mp4',
      fallback: true
    },
    {
      src: '/videos/library-diverse-users.webm',
      type: 'video/webm',
      fallback: true
    },
    // Placeholder videos that will work immediately
    {
      src: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      type: 'video/mp4',
      fallback: false
    },
    {
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'video/mp4',
      fallback: false
    }
  ]

  // Random video selection
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * videoSources.length)
    setCurrentVideoIndex(randomIndex)
  }, [])

  // Handle video loading
  const handleVideoLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleVideoError = () => {
    setIsLoading(false)
    setError('Video failed to load')
    
    // Try next video source
    const nextIndex = (currentVideoIndex + 1) % videoSources.length
    if (nextIndex !== currentVideoIndex) {
      setCurrentVideoIndex(nextIndex)
    }
  }

  // Play video when it loads
  useEffect(() => {
    if (videoRef.current && !isLoading && !error) {
      videoRef.current.play().catch(err => {
        console.log('Autoplay prevented:', err)
      })
    }
  }, [currentVideoIndex, isLoading, error])

  const currentVideo = videoSources[currentVideoIndex]

  return (
    <div className="video-player-container">
      {isLoading && (
        <div className="video-loading">
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading video...</span>
          </div>
          <p className="text-white mt-2">Loading video...</p>
        </div>
      )}
      
      {error && (
        <div className="video-error">
          <PhysicsAnimation />
        </div>
      )}

      <video
        ref={videoRef}
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={handleVideoLoad}
        onError={handleVideoError}
        style={{ display: error ? 'none' : 'block' }}
      >
        <source src={currentVideo.src} type={currentVideo.type} />
        Your browser does not support the video tag.
      </video>

      <div className="video-overlay">
        <div className="overlay-content">
          <h5 className="text-white mb-2">📚 Digital Learning Hub</h5>
          <p className="text-white-50 small">Connecting diverse minds through technology</p>
          <div className="video-controls mt-3">
            <button 
              className="btn btn-outline-light btn-sm me-2"
              onClick={() => {
                const nextIndex = (currentVideoIndex + 1) % videoSources.length
                setCurrentVideoIndex(nextIndex)
                setIsLoading(true)
                setError(null)
              }}
            >
              🔄 Next Video
            </button>
            <button 
              className="btn btn-outline-light btn-sm"
              onClick={() => {
                if (videoRef.current) {
                  if (videoRef.current.paused) {
                    videoRef.current.play()
                  } else {
                    videoRef.current.pause()
                  }
                }
              }}
            >
              ⏯️ Play/Pause
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPlayer
