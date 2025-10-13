# WIOSHARE Backend - Technical API Reference

## Project Structure
```
backend/
├── core/                    # Main Django project
│   ├── settings.py         # Configuration
│   ├── urls.py            # Main URL routing
│   ├── asgi.py            # ASGI configuration
│   └── wsgi.py            # WSGI configuration
├── users/                  # User management app
├── resources/              # Resource management app
├── events/                 # Event management app
├── notifications/          # Notification system app
├── search/                 # Global search app
└── manage.py              # Django management script
```

---

## 🔐 Authentication System

### JWT Token Endpoints
**Base URL**: `http://localhost:8000/api/token/`

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/` | `POST` | Obtain JWT tokens | `{"username": "user", "password": "pass"}` | `{"access": "token", "refresh": "token"}` |
| `/refresh/` | `POST` | Refresh access token | `{"refresh": "refresh_token"}` | `{"access": "new_token"}` |
| `/verify/` | `POST` | Verify token validity | `{"token": "access_token"}` | `{"valid": true}` |

---

## 👥 Users App

### Models
- **User**: Custom user model with role field (student/teacher)

### Endpoints
**Base URL**: `http://localhost:8000/api/users/`

| Endpoint | Method | View Class | Permissions | Description |
|----------|--------|------------|-------------|-------------|
| `/register/` | `POST` | `UserRegisterView` | None | Register new user |
| `/login/` | `POST` | `UserLoginView` | None | User login |
| `/logout/` | `POST` | `UserLogoutView` | Authenticated | Logout user |
| `/profile/` | `GET` | `UserProfileView` | Owner | Get user profile |
| `/profile/` | `PUT/PATCH` | `UserProfileView` | Owner | Update profile |
| `/` | `GET` | `UserListView` | Admin | List all users |
| `/<id>/` | `GET` | `UserDetailView` | Admin/Owner | Get user details |
| `/<id>/` | `PUT/PATCH` | `UserDetailView` | Admin/Owner | Update user |
| `/<id>/` | `DELETE` | `UserDetailView` | Admin | Delete user |

### Serializers
- `UserRegistrationSerializer`: User registration data
- `UserLoginSerializer`: Login credentials
- `UserSerializer`: Full user data
- `UserProfileSerializer`: Profile update data

### Permissions
- `IsAdminUserOrReadOnly`: Admin can modify, others read-only
- `IsTeacher`: Restrict to teachers only
- `IsStudent`: Restrict to students only

---

## 📚 Resources App

### Models
- **Resource**: File uploads with metadata
  - `title`, `description`, `subject`, `resource_type`
  - `file`, `uploaded_by`, `created_at`, `updated_at`
  - `is_public`, `download_count`, `file_size`

### Endpoints
**Base URL**: `http://localhost:8000/api/resources/`

| Endpoint | Method | View Class | Permissions | Description |
|----------|--------|------------|-------------|-------------|
| `/` | `GET` | `ResourceListView` | Authenticated | List resources |
| `/` | `POST` | `ResourceCreateView` | Teacher | Upload resource |
| `/<id>/` | `GET` | `ResourceDetailView` | Authenticated | Get resource details |
| `/<id>/` | `PUT/PATCH` | `ResourceUpdateView` | Owner/Admin | Update resource |
| `/<id>/` | `DELETE` | `ResourceDeleteView` | Owner/Admin | Delete resource |
| `/search/` | `GET` | `ResourceSearchView` | Authenticated | Search resources |
| `/<id>/download/` | `GET` | `ResourceDownloadView` | Can Download | Download file |

### Serializers
- `ResourceSerializer`: Full resource data
- `ResourceCreateSerializer`: Resource upload data
- `ResourceListSerializer`: Optimized list view data

### Permissions
- `IsTeacherOrReadOnly`: Teachers can upload, others read-only
- `IsOwnerOrAdmin`: Only owner or admin can modify
- `CanDownloadResource`: Check download permissions

### Features
- File upload with validation
- Download tracking
- Search and filtering
- Subject categorization
- Grade level support

---

## 📅 Events App

### Models
- **Event**: Calendar events with scheduling
  - `title`, `description`, `location`
  - `start_time`, `end_time`, `created_by`
  - `event_type`, `is_public`, `max_participants`

### Endpoints
**Base URL**: `http://localhost:8000/api/events/`

| Endpoint | Method | View Class | Permissions | Description |
|----------|--------|------------|-------------|-------------|
| `/` | `GET` | `EventListView` | Authenticated | List events |
| `/` | `POST` | `EventCreateView` | Teacher/Admin | Create event |
| `/<id>/` | `GET` | `EventDetailView` | Authenticated | Get event details |
| `/<id>/` | `PUT/PATCH` | `EventUpdateView` | Creator/Admin | Update event |
| `/<id>/` | `DELETE` | `EventDeleteView` | Creator/Admin | Delete event |
| `/upcoming/` | `GET` | `UpcomingEventsView` | Authenticated | Upcoming events |
| `/past/` | `GET` | `PastEventsView` | Authenticated | Past events |

### Serializers
- `EventSerializer`: Full event data
- `EventCreateSerializer`: Event creation data
- `EventListSerializer`: Optimized list view data

### Permissions
- `IsTeacherOrAdmin`: Only teachers/admins can create
- `IsOwnerOrAdmin`: Only creator or admin can modify

### Features
- Date/time management
- Location support
- Event categorization
- RSVP system
- Recurring events

---


---

## 🔔 Notifications App

### Models
- **Notification**: Flexible notification system
  - `recipient`, `actor`, `verb`, `target` (GenericFK)
  - `is_read`, `created_at`, `notification_type`, `data`

### Endpoints
**Base URL**: `http://localhost:8000/api/notifications/`

| Endpoint | Method | View Class | Permissions | Description |
|----------|--------|------------|-------------|-------------|
| `/` | `GET` | `NotificationListView` | Recipient/Admin | List notifications |
| `/<id>/` | `GET` | `NotificationDetailView` | Recipient/Admin | Get notification |
| `/<id>/` | `PATCH` | `NotificationUpdateView` | Recipient/Admin | Mark read/unread |
| `/<id>/` | `DELETE` | `NotificationDeleteView` | Recipient/Admin | Delete notification |
| `/mark-all-read/` | `POST` | `NotificationMarkAllReadView` | Recipient/Admin | Mark all as read |
| `/bulk-update/` | `POST` | `NotificationBulkUpdateView` | Recipient/Admin | Bulk update |
| `/bulk-delete/` | `POST` | `NotificationBulkDeleteView` | Recipient/Admin | Bulk delete |
| `/stats/` | `GET` | `NotificationStatsView` | Recipient/Admin | Get statistics |
| `/search/` | `GET` | `NotificationSearchView` | Recipient/Admin | Search notifications |
| `/unread-count/` | `GET` | `notification_unread_count` | Recipient/Admin | Get unread count |

### WebSocket Endpoints
| Endpoint | Description | Authentication |
|----------|-------------|----------------|
| `ws://localhost:8000/ws/notifications/` | User notifications | JWT Token |
| `ws://localhost:8000/ws/notifications/broadcast/` | Admin broadcasts | JWT Token |

### Serializers
- `NotificationSerializer`: Full notification data
- `NotificationUpdateSerializer`: Read/unread status
- `NotificationListSerializer`: Optimized list view data
- `NotificationBulkUpdateSerializer`: Bulk operations

### Permissions
- `IsNotificationRecipientOrAdmin`: Only recipient or admin can access
- `CanModifyNotificationStatus`: Can modify notification status
- `CanBulkModifyNotifications`: Can perform bulk operations

### Features
- Real-time delivery via WebSocket
- Flexible target linking (any model)
- Multiple notification types
- Read status tracking
- Bulk operations
- Advanced search and filtering
- Delivery confirmation

---

## 🔍 Search App

### Endpoints
**Base URL**: `http://localhost:8000/api/search/`

| Endpoint | Method | View Class | Permissions | Description |
|----------|--------|------------|-------------|-------------|
| `/` | `GET` | `GlobalSearchView` | Authenticated | Global search |

### Features
- Multi-app search (resources, events, users)
- Relevance scoring
- Type filtering
- Pagination
- Snippet generation
- Search suggestions

---

## 🛠️ Technical Implementation Details

### Database Configuration
```python
# PostgreSQL with optimized indexes
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'wioshare',
        'USER': 'postgres',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### Redis Configuration
```python
# Redis for caching and WebSocket channels
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

### JWT Configuration
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

### File Upload Configuration
```python
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
```

### Pagination Configuration
```python
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'MAX_PAGE_SIZE': 100,
}
```

---

## 🔒 Security Implementation

### Authentication Middleware
- JWT token validation
- Token blacklisting for logout
- Automatic token refresh

### Permission System
- Role-based access control (RBAC)
- Object-level permissions
- Custom permission classes
- User isolation (users see only their data)

### WebSocket Security
- JWT authentication for WebSocket connections
- User-specific channels
- Permission-based message routing

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection for forms

---

## 📊 Performance Optimizations

### Database Optimizations
- Select_related and prefetch_related
- Database indexes on frequently queried fields
- Query optimization and caching

### API Optimizations
- Pagination for large datasets
- Serializer optimization
- Response caching
- Lazy loading for related objects

### WebSocket Optimizations
- Channel layer optimization
- Message batching
- Connection pooling
- Automatic reconnection

---

## 🧪 Testing

### Test Structure
```
tests/
├── test_authentication.py
├── test_users.py
├── test_resources.py
├── test_events.py
├── test_notifications.py
└── test_search.py
```

### Test Coverage
- Unit tests for all models
- API endpoint tests
- Permission tests
- WebSocket tests
- Integration tests

---

## 🚀 Deployment

### Production Settings
- Environment variable configuration
- Static file serving
- Database connection pooling
- Redis clustering
- WebSocket load balancing

### Monitoring
- Application performance monitoring
- Database query monitoring
- WebSocket connection monitoring
- Error tracking and logging

---

*This technical reference provides comprehensive details about the WIOSHARE backend API implementation, including all endpoints, models, serializers, permissions, and technical configurations.*
