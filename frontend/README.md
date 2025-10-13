# WIOSHARE Frontend

A React-based frontend application for the WIOSHARE educational platform, built with Vite and Bootstrap.

## Features

- **Modern React Setup**: Built with Vite for fast development and optimized builds
- **Bootstrap UI**: Responsive design with React Bootstrap components
- **Authentication**: JWT-based authentication with automatic token refresh
- **API Integration**: Axios-based API client with interceptors
- **Routing**: React Router for client-side navigation
- **Context Management**: React Context for global state management

## Tech Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **React Router DOM**: Client-side routing
- **Axios**: HTTP client for API communication
- **Bootstrap 5**: CSS framework for styling
- **React Bootstrap**: Bootstrap components for React

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- WIOSHARE Backend running on http://localhost:8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to http://localhost:3000

### Environment Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=WIOSHARE
VITE_APP_VERSION=1.0.0
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Navbar.jsx      # Navigation component
├── contexts/           # React Context providers
│   └── AuthContext.jsx # Authentication context
├── pages/              # Page components
│   ├── Home.jsx        # Home page
│   ├── Login.jsx       # Login page
│   ├── Register.jsx    # Registration page
│   ├── Resources.jsx   # Resources page
│   ├── Events.jsx      # Events page
│   ├── Chat.jsx        # Chat page
│   └── Notifications.jsx # Notifications page
├── services/           # API services
│   └── api.js          # Axios configuration and API endpoints
├── App.jsx             # Main App component
├── App.css             # App-specific styles
├── main.jsx            # Application entry point
└── index.css           # Global styles
```

## API Integration

The frontend communicates with the Django backend through a centralized API service (`src/services/api.js`). The API service includes:

- **Base Configuration**: Axios instance with base URL from environment variables
- **Authentication**: Automatic JWT token handling and refresh
- **Interceptors**: Request/response interceptors for error handling
- **Endpoint Services**: Organized API calls for each backend app

### Available API Services

- `authAPI`: Authentication endpoints (login, refresh, verify)
- `userAPI`: User management endpoints
- `resourceAPI`: Resource management endpoints
- `eventAPI`: Event management endpoints
- `chatAPI`: Chat and messaging endpoints
- `notificationAPI`: Notification management endpoints
- `searchAPI`: Global search endpoints

## Authentication

The application uses JWT tokens for authentication:

1. **Login**: User credentials are sent to `/api/token/` endpoint
2. **Token Storage**: Access and refresh tokens are stored in localStorage
3. **Automatic Refresh**: Tokens are automatically refreshed when expired
4. **Protected Routes**: Authentication context manages user state globally

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Adding New Features

1. **New Pages**: Add components to `src/pages/`
2. **New Components**: Add reusable components to `src/components/`
3. **API Integration**: Add new endpoints to `src/services/api.js`
4. **State Management**: Use React Context or add new contexts

## Deployment

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Environment Variables for Production

Make sure to set the correct API base URL for production:

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

## Contributing

1. Follow the existing code structure and patterns
2. Use Bootstrap components for consistent UI
3. Implement proper error handling for API calls
4. Add loading states for better UX
5. Write clean, readable code with proper comments

## Troubleshooting

### Common Issues

1. **API Connection Failed**: Check if the backend is running on the correct port
2. **Authentication Issues**: Verify JWT token configuration
3. **Build Errors**: Check for missing dependencies or syntax errors
4. **CORS Issues**: Ensure backend CORS settings allow frontend origin

### Development Tips

- Use browser dev tools to inspect API requests
- Check console for error messages
- Verify environment variables are loaded correctly
- Test authentication flow thoroughly

## License

This project is part of the WIOSHARE educational platform.
