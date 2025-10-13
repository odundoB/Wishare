# Video Assets for Landing Page

## Required Video Files

To complete the landing page video section, please add the following video files to this directory:

### Main Video File
- **File**: `library-diverse-users.mp4`
- **Description**: Video showing diverse individuals (different ethnicities - black, white, and other backgrounds) using digital gadgets (laptops, tablets, phones) in a library setting
- **Duration**: 30-60 seconds (looping)
- **Resolution**: 1920x1080 (Full HD) or higher
- **Format**: MP4 (H.264 codec)
- **Content**: People of various ethnicities accessing information through digital devices in a modern library environment

### Alternative Format
- **File**: `library-diverse-users.webm`
- **Description**: Same content as MP4 but in WebM format for better browser compatibility
- **Format**: WebM (VP9 codec)

## Video Content Guidelines

The video should showcase:
1. **Diverse Representation**: Include people of different ethnicities (black, white, Asian, Hispanic, etc.)
2. **Digital Learning**: People using laptops, tablets, smartphones, and other digital devices
3. **Library Setting**: Modern library environment with books, computers, study areas
4. **Educational Context**: People reading, researching, collaborating, and learning
5. **Professional Quality**: Good lighting, clear audio (if any), smooth camera work

## Fallback Content

If video files are not available, the page will display an animated grid of diverse user avatars as a fallback.

## File Structure
```
frontend/public/videos/
├── README.md
├── library-diverse-users.mp4 (to be added)
└── library-diverse-users.webm (to be added)
```

## Usage

The video will automatically play on the landing page hero section with:
- Autoplay (muted)
- Loop
- Responsive design
- Hover effects
- Overlay text

## Performance Notes

- Keep video file size under 10MB for optimal loading
- Consider using video compression tools
- Test on different devices and browsers
- Ensure video works on mobile devices (playsInline attribute)
