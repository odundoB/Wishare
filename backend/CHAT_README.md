# Real-Time Chat System

A comprehensive real-time chat application built with Django REST Framework, Django Channels, and React.

## Features

### Backend Features
- **Room Management**: Create, join, leave, and manage chat rooms
- **Real-time Messaging**: WebSocket-based instant messaging
- **Message Threading**: Reply to messages and create conversation threads
- **Private Conversations**: 1:1 private messaging between users
- **Join Requests**: Request-based joining for private rooms
- **User Management**: Kick users, manage permissions
- **File Attachments**: Support for images, documents, and voice messages
- **Typing Indicators**: Real-time typing status
- **Message Editing/Deletion**: Edit and soft-delete messages
- **Role-based Permissions**: Different access levels for teachers and students

### Frontend Features
- **Modern UI**: Clean, responsive interface built with React Bootstrap
- **Real-time Updates**: Live message updates via WebSocket
- **Message Threading**: Visual thread management
- **Private Chat**: Seamless private conversation interface
- **File Upload**: Drag-and-drop file sharing
- **Emoji Support**: Built-in emoji picker
- **Voice Messages**: Voice recording capabilities
- **Typing Indicators**: See when others are typing
- **Join Request Management**: Approve/deny join requests (hosts only)

## Architecture

### Backend (Django)
```
chat/
├── models.py          # Database models
├── views.py           # API endpoints
├── serializers.py     # Data serialization
├── permissions.py     # Custom permissions
├── consumers.py       # WebSocket consumers
├── routing.py         # WebSocket routing
├── urls.py           # URL configuration
├── admin.py          # Django admin
├── signals.py        # Django signals
└── tests.py          # Comprehensive tests
```

### Frontend (React)
```
src/
├── pages/
│   └── Chat.jsx              # Main chat page
├── components/chat/
│   ├── RoomsList.jsx         # Room list sidebar
│   ├── RoomView.jsx          # Main room interface
│   ├── MessageList.jsx       # Message display
│   ├── MessageInput.jsx      # Message composition
│   ├── ThreadList.jsx        # Thread management
│   ├── CreateRoomModal.jsx   # Room creation
│   ├── JoinRequestModal.jsx  # Join request handling
│   └── JoinRequestManager.jsx # Request management
└── services/
    └── chat.js               # API and WebSocket services
```

## Database Models

### Room
- `name`: Room name
- `host`: User who created the room
- `public`: Whether room is public or private
- `is_active`: Room status
- `participants`: Many-to-many relationship with users

### Message
- `room`: Foreign key to Room
- `sender`: User who sent the message
- `content`: Message text
- `reply_to`: Optional reply to another message
- `created_at`: Timestamp
- `edited_at`: Edit timestamp
- `deleted`: Soft delete flag

### JoinRequest
- `room`: Room being requested
- `user`: User requesting to join
- `status`: pending/approved/denied
- `created_at`: Request timestamp
- `processed_at`: Processing timestamp

### PrivateThread
- `owner_message`: Original message that triggered the thread
- `user1`, `user2`: Participants in the private conversation
- `is_active`: Thread status

### PrivateMessage
- `thread`: Private thread
- `sender`: Message sender
- `content`: Message content
- `created_at`: Timestamp
- `edited_at`: Edit timestamp
- `deleted`: Soft delete flag

## API Endpoints

### Room Management
- `GET /api/chat/rooms/` - List rooms
- `POST /api/chat/rooms/` - Create room (teachers only)
- `GET /api/chat/rooms/<id>/` - Room details
- `PATCH /api/chat/rooms/<id>/` - Update room (host only)
- `DELETE /api/chat/rooms/<id>/` - Delete room (host only)

### Room Participation
- `POST /api/chat/rooms/<id>/join/` - Join public room
- `POST /api/chat/rooms/<id>/leave/` - Leave room
- `POST /api/chat/rooms/<id>/kick/<user_id>/` - Kick user (host only)

### Join Requests
- `POST /api/chat/rooms/<id>/join-request/` - Request to join private room
- `GET /api/chat/rooms/<id>/join-requests/` - List join requests (host only)
- `POST /api/chat/rooms/<id>/approve-join/<request_id>/` - Approve request
- `POST /api/chat/rooms/<id>/deny-join/<request_id>/` - Deny request

### Messages
- `GET /api/chat/rooms/<id>/messages/` - List messages
- `POST /api/chat/rooms/<id>/messages/` - Send message
- `PATCH /api/chat/messages/<id>/` - Edit message (owner only)
- `DELETE /api/chat/messages/<id>/` - Delete message (owner/host)

### Private Threads
- `GET /api/chat/private-threads/` - List user's private threads
- `POST /api/chat/private-threads/` - Create private thread
- `GET /api/chat/private-threads/<id>/` - Thread details

### Private Messages
- `GET /api/chat/private-threads/<id>/messages/` - List private messages
- `POST /api/chat/private-threads/<id>/messages/` - Send private message
- `PATCH /api/chat/private-messages/<id>/` - Edit private message
- `DELETE /api/chat/private-messages/<id>/` - Delete private message

## WebSocket Endpoints

### Room WebSocket
- `ws://localhost:8000/ws/chat/rooms/<room_id>/?token=<jwt_token>`

**Events:**
- `chat_message` - Send message
- `typing` - Typing indicator
- `stop_typing` - Stop typing indicator
- `join_request` - Join request notification
- `join_approved` - Join approval notification
- `join_denied` - Join denial notification
- `kick_user` - User kick notification

### Private Thread WebSocket
- `ws://localhost:8000/ws/chat/private/<thread_id>/?token=<jwt_token>`

**Events:**
- `private_message` - Send private message
- `typing` - Typing indicator
- `stop_typing` - Stop typing indicator

## Setup Instructions

### Backend Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Migrations**
   ```bash
   python manage.py makemigrations chat
   python manage.py migrate
   ```

3. **Create Test Data**
   ```bash
   python chat/create_test_data.py
   ```

4. **Start Development Server**
   ```bash
   # Start Django server
   python manage.py runserver
   
   # Start ASGI server for WebSocket support
   python -m daphne -b 0.0.0.0 -p 8000 core.asgi:application
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install date-fns
   ```

2. **Environment Variables**
   Create `.env` file in frontend directory:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_WS_BASE_URL=ws://localhost:8000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

## Testing

### Backend Tests
```bash
# Run all chat tests
python manage.py test chat

# Run specific test classes
python manage.py test chat.tests.ChatModelTests
python manage.py test chat.tests.ChatAPITests
python manage.py test chat.tests.ChatWebSocketTests
python manage.py test chat.tests.ChatIntegrationTests
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Security Considerations

### Rate Limiting
- Implement rate limiting for message sending
- Limit file upload sizes and types
- Prevent spam and abuse

### Authentication
- JWT token validation for WebSocket connections
- Proper permission checks for all operations
- CSRF protection for API endpoints

### File Upload Security
- Validate file types and sizes
- Scan uploaded files for malware
- Store files in secure locations

### WebSocket Security
- Validate all incoming WebSocket messages
- Implement proper error handling
- Prevent WebSocket flooding attacks

## Production Deployment

### Redis Configuration
For production, configure Redis as the channel layer:

```python
# settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

### WebRTC Configuration
For voice/video features, configure STUN/TURN servers:

```javascript
const peerConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
  ]
};
```

### Scaling Considerations
- Use Redis for channel layers
- Implement message queuing (Celery)
- Consider horizontal scaling with load balancers
- Implement database connection pooling

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if ASGI server is running
   - Verify JWT token is valid
   - Check CORS settings

2. **Messages Not Appearing**
   - Check WebSocket connection status
   - Verify user permissions
   - Check database for message records

3. **Join Requests Not Working**
   - Verify room is private
   - Check user role permissions
   - Ensure proper API endpoints

### Debug Mode
Enable debug logging:

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'chat': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
