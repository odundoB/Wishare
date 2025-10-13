# WIOSHARE Backend - Quick Reference Card

## 🚀 Quick Start
```bash
# Start development server
python manage.py runserver

# Create superuser
python manage.py createsuperuser

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic
```

## 🔐 Authentication
```bash
# Get JWT token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'

# Use token in requests
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/users/profile/
```

## 📋 Core Endpoints

### Users
- `POST /api/users/register/` - Register user
- `POST /api/users/login/` - Login user
- `GET /api/users/profile/` - Get profile
- `PUT /api/users/profile/` - Update profile

### Resources
- `GET /api/resources/` - List resources
- `POST /api/resources/` - Upload resource (Teacher)
- `GET /api/resources/<id>/` - Get resource
- `GET /api/resources/<id>/download/` - Download file

### Events
- `GET /api/events/` - List events
- `POST /api/events/` - Create event (Teacher)
- `GET /api/events/<id>/` - Get event
- `GET /api/events/upcoming/` - Upcoming events


### Notifications
- `GET /api/notifications/` - List notifications
- `PATCH /api/notifications/<id>/` - Mark read/unread
- `POST /api/notifications/mark-all-read/` - Mark all read
- `DELETE /api/notifications/<id>/` - Delete notification

### Search
- `GET /api/search/?q=keyword` - Global search

## 🌐 WebSocket Endpoints
- `ws://localhost:8000/ws/notifications/` - Notifications

## 👥 User Roles
- **Student**: Read resources/events
- **Teacher**: Create resources/events
- **Admin**: Full access, debugging capabilities

## 🔑 Common Permissions
- `IsAuthenticated` - Must be logged in
- `IsAdminUser` - Must be admin
- `IsOwnerOrAdmin` - Must own resource or be admin
- `IsTeacherOrAdmin` - Must be teacher or admin
- `IsNotificationRecipientOrAdmin` - Must be recipient or admin

## 📊 Response Formats

### Success
```json
{
    "data": {...},
    "message": "Success",
    "status": "success"
}
```

### Paginated
```json
{
    "count": 100,
    "next": "http://.../?page=2",
    "previous": null,
    "results": [...]
}
```

### Error
```json
{
    "error": "Error message",
    "status": "error",
    "status_code": 400
}
```

## 🔍 Common Query Parameters
- `?page=N` - Page number
- `?page_size=N` - Items per page
- `?search=keyword` - Search term
- `?ordering=field` - Sort by field
- `?is_read=true` - Filter by read status
- `?notification_type=resource` - Filter by type

## 🛠️ Development Commands
```bash
# Create app
python manage.py startapp app_name

# Make migrations
python manage.py makemigrations

# Run tests
python manage.py test

# Load fixtures
python manage.py loaddata fixture.json

# Shell access
python manage.py shell

# Check for issues
python manage.py check
```

## 📁 File Structure
```
backend/
├── core/           # Main project
├── users/          # User management
├── resources/      # File resources
├── events/         # Calendar events
├── notifications/  # Notification system
├── search/         # Global search
└── manage.py       # Django management
```

## 🔧 Environment Variables
```bash
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost:5432/wioshare
REDIS_URL=redis://localhost:6379/0
```

## 📱 WebSocket Message Types


### Notifications
```javascript
// Get unread count
{
    "type": "get_unread_count"
}

// Mark as read
{
    "type": "mark_as_read",
    "notification_id": 123
}
```

## 🚨 Common Issues

### Authentication
- **401 Unauthorized**: Check JWT token
- **403 Forbidden**: Check user permissions
- **Token expired**: Refresh token

### WebSocket
- **Connection failed**: Check JWT token in query string
- **Permission denied**: Check user is participant
- **Message not received**: Check room name and permissions

### File Upload
- **413 Payload too large**: File size limit exceeded
- **400 Bad request**: Invalid file type or missing fields
- **Permission denied**: User not authorized to upload

## 📞 Support
- **Admin Interface**: `/admin/`
- **API Documentation**: `/api/docs/`
- **Django Shell**: `python manage.py shell`
- **Logs**: Check Django console output

---
*Quick reference for WIOSHARE backend development*
