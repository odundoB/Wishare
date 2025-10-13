import React, { useState, useRef, useCallback } from 'react'
import { Modal, Button, Spinner } from 'react-bootstrap'

const ImageCropper = ({ show, onHide, onCrop, imageSrc, aspectRatio = 1 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 200, height: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef(null)
  const imageRef = useRef(null)

  const onImageLoad = useCallback((img) => {
    if (!img) return
    
    imageRef.current = img
    // Set initial crop to center of image
    const imgWidth = img.width
    const imgHeight = img.height
    const cropSize = Math.min(imgWidth, imgHeight) * 0.8
    const x = (imgWidth - cropSize) / 2
    const y = (imgHeight - cropSize) / 2
    
    setCrop({
      x: x,
      y: y,
      width: cropSize,
      height: cropSize
    })
  }, [])

  const handleMouseDown = (e) => {
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setDragStart({ x: x - crop.x, y: y - crop.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !imageRef.current) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const newX = x - dragStart.x
    const newY = y - dragStart.y
    
    const imgWidth = imageRef.current.width
    const imgHeight = imageRef.current.height
    
    // Constrain crop within image bounds
    const constrainedX = Math.max(0, Math.min(newX, imgWidth - crop.width))
    const constrainedY = Math.max(0, Math.min(newY, imgHeight - crop.height))
    
    setCrop(prev => ({
      ...prev,
      x: constrainedX,
      y: constrainedY
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('No 2d context')
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const pixelRatio = window.devicePixelRatio

    canvas.width = crop.width * pixelRatio * scaleX
    canvas.height = crop.height * pixelRatio * scaleY

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    )

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas is empty')
            return
          }
          blob.name = 'cropped-image.jpg'
          resolve(blob)
        },
        'image/jpeg',
        0.95
      )
    })
  }

  const handleCrop = async () => {
    if (!imageRef.current || !crop.width || !crop.height) {
      console.error('Invalid crop parameters:', { imageRef: !!imageRef.current, crop })
      return
    }

    setLoading(true)
    try {
      const croppedImageBlob = await getCroppedImg(
        imageRef.current,
        crop
      )
      
      if (!croppedImageBlob) {
        throw new Error('Failed to create cropped image blob')
      }
      
      const croppedImageUrl = URL.createObjectURL(croppedImageBlob)
      onCrop(croppedImageBlob, croppedImageUrl)
    } catch (error) {
      console.error('Error cropping image:', error)
      // You could add error handling here if needed
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCrop({ x: 0, y: 0, width: 200, height: 200 })
    onHide()
  }

  const handleResetCrop = () => {
    if (!imageRef.current) return
    
    const imgWidth = imageRef.current.width
    const imgHeight = imageRef.current.height
    const cropSize = Math.min(imgWidth, imgHeight) * 0.8
    const x = (imgWidth - cropSize) / 2
    const y = (imgHeight - cropSize) / 2
    
    setCrop({
      x: x,
      y: y,
      width: cropSize,
      height: cropSize
    })
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>✂️ Crop Profile Photo</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        <div className="mb-3">
          <p className="text-muted">Drag the crop area to select the part of the image you want to keep</p>
        </div>
        
        <div className="crop-container mb-3 position-relative d-inline-block">
          <img
            ref={onImageLoad}
            alt="Crop me"
            src={imageSrc}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '400px',
              display: 'block'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            draggable={false}
          />
          
          {/* Crop overlay */}
          <div
            style={{
              position: 'absolute',
              left: crop.x,
              top: crop.y,
              width: crop.width,
              height: crop.height,
              border: '3px solid #007bff',
              backgroundColor: 'rgba(0, 123, 255, 0.15)',
              cursor: 'move',
              boxSizing: 'border-box',
              borderRadius: '4px',
              boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.8), 0 0 10px rgba(0, 123, 255, 0.5)'
            }}
          />
          
          {/* Corner handles */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
            <div
              key={corner}
              style={{
                position: 'absolute',
                width: '12px',
                height: '12px',
                backgroundColor: '#007bff',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'nw-resize',
                left: corner.includes('left') ? crop.x - 6 : crop.x + crop.width - 6,
                top: corner.includes('top') ? crop.y - 6 : crop.y + crop.height - 6,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            />
          ))}
          
          {/* Dark overlay outside crop area */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              pointerEvents: 'none',
              clipPath: `polygon(
                0% 0%, 
                0% 100%, 
                ${crop.x}px 100%, 
                ${crop.x}px ${crop.y}px, 
                ${crop.x + crop.width}px ${crop.y}px, 
                ${crop.x + crop.width}px ${crop.y + crop.height}px, 
                ${crop.x}px ${crop.y + crop.height}px, 
                ${crop.x}px 100%, 
                100% 100%, 
                100% 0%
              )`
            }}
          />
        </div>

        <div className="d-flex justify-content-center gap-2 flex-wrap">
          <Button
            variant="primary"
            onClick={handleCrop}
            disabled={!crop.width || !crop.height || loading}
            size="lg"
            className="px-4"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Cropping...
              </>
            ) : (
              <>
                ✂️ Crop & Save
              </>
            )}
          </Button>
          <Button 
            variant="outline-info" 
            onClick={handleResetCrop}
            disabled={!imageRef.current || loading}
            size="lg"
            className="px-4"
          >
            🔄 Reset
          </Button>
          <Button 
            variant="outline-secondary" 
            onClick={handleClose}
            size="lg"
            className="px-4"
          >
            ❌ Cancel
          </Button>
        </div>
        
        {!crop.width || !crop.height ? (
          <div className="mt-2">
            <small className="text-muted">
              Please wait for the image to load and then drag to select the crop area
            </small>
          </div>
        ) : null}
      </Modal.Body>
    </Modal>
  )
}

export default ImageCropper
