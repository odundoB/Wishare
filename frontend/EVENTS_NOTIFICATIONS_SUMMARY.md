# WIOSHARE Events & Notifications System

## Overview
A comprehensive event management and notification system that enables users to create, manage, and participate in educational events while staying informed through real-time notifications.

## 🎯 Events System

### **Features Implemented**

#### **1. Event Management**
- **Event Creation**: Teachers/admins can create events with detailed information
- **Event Registration**: Students can register/unregister for events
- **Event Status Tracking**: Upcoming, Ongoing, Past status with visual indicators
- **Event Privacy**: Public and private event options
- **Event Duration**: Automatic duration calculation and display
- **Attendee Tracking**: Real-time attendee count and registration status

#### **2. User Interface Components**

##### **Main Events Page** (`src/pages/Events.jsx`)
- Comprehensive event listing with pagination
- Real-time search and filtering
- Statistics dashboard
- Event creation for teachers/admins
- Event management (view, edit, delete, register)

##### **EventCard Component** (`src/components/EventCard.jsx`)
- Individual event display with status indicators
- Registration/unregistration functionality
- Event metadata display (date, time, location, duration)
- User permissions (edit/delete based on ownership)
- Visual status indicators (upcoming, ongoing, past)

##### **EventCreateModal Component** (`src/components/EventCreateModal.jsx`)
- Complete event creation form with validation
- Date/time picker with smart defaults
- Location and description fields
- Privacy settings
- Form validation and error handling

##### **EventFilters Component** (`src/components/EventFilters.jsx`)
- Search functionality across event details
- Status filtering (upcoming, ongoing, past)
- Sorting options (date, title, attendees, created date)
- Real-time filter updates

##### **EventStats Component** (`src/components/EventStats.jsx`)
- Total event count
- Status-based counts (upcoming, ongoing, past)
- Total attendees count
- Visual statistics dashboard

#### **3. Event Data Model**
- `title`: Event title
- `description`: Detailed event description
- `location`: Event location (optional)
- `start_time`: Event start date and time
- `end_time`: Event end date and time
- `created_by`: User who created the event
- `is_private`: Privacy setting
- `attendees_count`: Number of registered attendees
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

#### **4. Event Functionality**
- **Smart Status Detection**: Automatic status calculation based on current time
- **Duration Calculation**: Automatic event duration display
- **Registration Management**: Real-time registration status tracking
- **Permission Controls**: Role-based access (teachers create, students register)
- **Search & Filtering**: Advanced search across all event fields
- **Pagination**: Efficient handling of large event lists

## 🔔 Notifications System

### **Features Implemented**

#### **1. Notification Management**
- **Real-time Notifications**: Live notification updates
- **Read/Unread Status**: Visual indicators for notification status
- **Bulk Operations**: Mark all as read/unread, delete all
- **Notification Types**: Various notification types with appropriate icons
- **Time-based Display**: Smart time formatting (just now, 5m ago, 2h ago, etc.)

#### **2. User Interface Components**

##### **Main Notifications Page** (`src/pages/Notifications.jsx`)
- Comprehensive notification listing with pagination
- Real-time search and filtering
- Statistics dashboard
- Bulk notification management
- Individual notification actions

##### **NotificationCard Component** (`src/components/NotificationCard.jsx`)
- Individual notification display with status indicators
- Read/unread toggle functionality
- Smart time formatting
- Notification type icons
- Action buttons (view, mark read/unread, delete)

##### **NotificationFilters Component** (`src/components/NotificationFilters.jsx`)
- Search functionality across notification content
- Status filtering (all, unread, read)
- Sorting options (date, read status, type)
- Bulk action buttons (mark all read, mark all unread, delete all)

##### **NotificationStats Component** (`src/components/NotificationStats.jsx`)
- Total notification count
- Unread notification count
- Read notification count
- Recent notifications count (24h)

#### **3. Notification Data Model**
- `recipient`: User receiving the notification
- `actor`: User who triggered the notification
- `verb`: Action that triggered the notification
- `target`: Object the notification is about (GenericForeignKey)
- `is_read`: Read/unread status
- `description`: Additional notification details
- `created_at`: Creation timestamp

#### **4. Notification Types & Icons**
- **Created/Uploaded**: 📄 (Resource creation)
- **Registered/Joined**: ✅ (Event registration)
- **Commented/Replied**: 💬 (Comments and replies)
- **Liked/Favorited**: ❤️ (Likes and favorites)
- **Shared**: 🔗 (Resource sharing)
- **Updated**: ✏️ (Content updates)
- **Deleted**: 🗑️ (Content deletion)
- **Invited**: 📧 (Invitations)
- **Mentioned**: 👤 (User mentions)
- **Default**: 🔔 (General notifications)

## 🚀 Technical Implementation

### **Frontend Architecture**
- **Modular Components**: Separated concerns for maintainability
- **React Hooks**: Modern functional component patterns
- **State Management**: Local state with Context API integration
- **Error Handling**: Comprehensive error handling throughout
- **Loading States**: User-friendly loading indicators
- **Responsive Design**: Mobile-first Bootstrap-based UI

### **Backend Integration**
- **REST API**: Full CRUD operations for events and notifications
- **Authentication**: JWT-based authentication
- **Permissions**: Role-based access control
- **Real-time Updates**: WebSocket integration for live notifications
- **Pagination**: Efficient data loading with pagination

### **Key Features**
- **Smart Time Formatting**: Context-aware time display
- **Visual Status Indicators**: Clear visual feedback for all states
- **Bulk Operations**: Efficient management of multiple items
- **Search & Filtering**: Advanced search capabilities
- **Permission Controls**: Granular access control
- **Real-time Updates**: Live data synchronization

## 📊 System Status

### **Events System**
✅ **Completed Features**
- Event creation and management
- Registration system
- Status tracking and display
- Search and filtering
- Statistics dashboard
- Permission controls

### **Notifications System**
✅ **Completed Features**
- Notification display and management
- Read/unread status tracking
- Bulk operations
- Search and filtering
- Statistics dashboard
- Real-time updates

## 🎯 Usage Instructions

### **For Events**

#### **Creating Events (Teachers/Admins)**
1. Click "Create Event" button
2. Fill in event details:
   - Title and description
   - Start and end times
   - Location (optional)
   - Privacy setting
3. Submit form to create event

#### **Managing Events**
1. View all events with status indicators
2. Use search and filters to find specific events
3. Register/unregister for events
4. Edit or delete events (if you're the creator)

#### **Event Discovery**
1. Browse events by status (upcoming, ongoing, past)
2. Search events by title, description, or location
3. Sort events by various criteria
4. View event statistics and attendee counts

### **For Notifications**

#### **Viewing Notifications**
1. Access notifications page to see all alerts
2. Use search to find specific notifications
3. Filter by read/unread status
4. Sort notifications by date, type, or status

#### **Managing Notifications**
1. Mark individual notifications as read/unread
2. Delete unwanted notifications
3. Use bulk operations for multiple notifications
4. View notification statistics

#### **Notification Types**
- **Resource Notifications**: When resources are created, updated, or deleted
- **Event Notifications**: When events are created or you register/unregister
- **Social Notifications**: When someone likes, shares, or comments
- **System Notifications**: Important system announcements

## 🔧 API Endpoints

### **Events API**
- `GET /api/events/` - List all events
- `POST /api/events/` - Create new event
- `GET /api/events/<id>/` - Get event details
- `PUT /api/events/<id>/` - Update event
- `DELETE /api/events/<id>/` - Delete event
- `POST /api/events/<id>/register/` - Register for event
- `POST /api/events/<id>/unregister/` - Unregister from event
- `GET /api/events/<id>/attendees/` - Get event attendees

### **Notifications API**
- `GET /api/notifications/` - List user notifications
- `PATCH /api/notifications/<id>/` - Mark notification as read/unread
- `DELETE /api/notifications/<id>/` - Delete notification
- `POST /api/notifications/mark-all-read/` - Mark all as read
- `POST /api/notifications/mark-all-unread/` - Mark all as unread
- `GET /api/notifications/unread-count/` - Get unread count

## 🎉 Conclusion

The WIOSHARE Events & Notifications System provides a comprehensive platform for event management and user engagement through notifications. The system features:

- **Intuitive User Interface**: Clean, modern design with clear visual indicators
- **Comprehensive Functionality**: Full CRUD operations with advanced features
- **Real-time Updates**: Live data synchronization and status updates
- **Role-based Access**: Appropriate permissions for different user types
- **Advanced Search & Filtering**: Powerful discovery and management tools
- **Mobile Responsive**: Works seamlessly across all devices

Both systems are production-ready and provide a solid foundation for educational event management and user engagement in the WIOSHARE platform.
