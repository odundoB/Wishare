# 🌐 WIOSHARE - Educational Platform

A modern educational platform built with React frontend and Django backend, featuring event management, resource sharing, real-time chat, and comprehensive user management.

## 📁 Project Structure

```
WIOSHARE/
├── 🔧 Setup Files
│   ├── .gitignore              # Git ignore rules
│   ├── setup_postgresql.bat    # PostgreSQL setup script
│   └── setup_postgresql.sql    # Database initialization
│
├── 🎨 Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── EventCard.jsx          # Event display with dropdown menus
│   │   │   ├── EventFilters.jsx       # Search & filter interface
│   │   │   ├── ChatRoomInterface.jsx  # Real-time chat
│   │   │   └── ...
│   │   ├── contexts/           # React contexts
│   │   │   └── AuthContext.jsx        # Authentication state
│   │   ├── pages/              # Main application pages
│   │   │   ├── Events.jsx             # Event management
│   │   │   ├── Resources.jsx          # Resource sharing
│   │   │   ├── Dashboard.jsx          # User dashboard
│   │   │   └── ...
│   │   ├── services/           # API communication
│   │   ├── styles/             # Component-specific styles
│   │   ├── App.css             # Global styles
│   │   └── main.jsx            # Application entry point
│   ├── package.json            # Dependencies & scripts
│   └── vite.config.js          # Vite configuration
│
└── ⚙️ Backend (Django REST)
    ├── core/                   # Django project settings
    ├── users/                  # User management & authentication
    ├── events/                 # Event CRUD & filtering
    ├── resources/              # File sharing system
    ├── notifications/          # Real-time notifications
    ├── search/                 # Search functionality
    ├── media/                  # Uploaded files storage
    ├── requirements.txt        # Python dependencies
    └── manage.py               # Django management
```

## 🚀 Quick Start

### Frontend Development

```bash
cd frontend
npm install
npm run dev          # Development server (port 3000-3002)
npm run build        # Production build
```

### Backend Development

```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver    # Development server (port 8000)
```

## 🎯 Key Features

### ✅ **Event Management System**

- Create, edit, delete events with permissions
- Status filtering (upcoming/past/ongoing)
- Search and sort functionality
- Real-time updates

### ✅ **Resource Sharing Platform**

- File upload/download system
- Resource categorization
- User-specific resource management

### ✅ **Real-time Chat System**

- WebSocket-based messaging
- File sharing in chat
- Room-based conversations

### ✅ **User Management**

- JWT authentication
- Role-based permissions
- Profile management
- Registration system

### ✅ **Clean UI/UX**

- Bootstrap-based responsive design
- Stable dropdown menus with proper positioning
- Consistent styling and navigation

## 🔧 Technical Stack

**Frontend:**

- React 18 with Vite
- Bootstrap 5 for styling
- Axios for API calls
- React Router for navigation

**Backend:**

- Django REST Framework
- JWT Authentication
- WebSocket support (Channels)
- PostgreSQL/SQLite database

## 📋 Development Status

- ✅ Authentication & User Management
- ✅ Event CRUD Operations
- ✅ Resource Management
- ✅ Search & Filtering
- ✅ Real-time Chat
- ✅ Responsive UI Design
- ✅ Clean Code Structure

## 📝 API Endpoints

```
Authentication:
POST /api/auth/register/     # User registration
POST /api/auth/login/        # User login
POST /api/auth/logout/       # User logout

Events:
GET  /api/events/            # List events (with filters)
POST /api/events/            # Create event
PUT  /api/events/{id}/       # Update event
DELETE /api/events/{id}/     # Delete event

Resources:
GET  /api/resources/         # List resources
POST /api/resources/         # Upload resource
DELETE /api/resources/{id}/  # Delete resource

Search:
GET  /api/search/            # Global search
```

## 🛠️ Development Guidelines

### Code Style

- Use meaningful component and variable names
- Keep console.log statements to minimum (error logging only)
- Maintain consistent file organization
- Write clean, readable code with comments where necessary

### CSS Organization

- Global styles in `App.css`
- Component-specific styles in `/styles/` directory
- Use CSS classes with clear naming conventions
- Maintain responsive design principles

### Git Workflow

- Clean commit messages
- Regular commits with specific changes
- Avoid committing cache files, logs, or temporary files

---

**Last Updated:** October 29, 2025  
**Version:** 1.0.0  
**Status:** Production Ready
