# TaskFlow Solutions - Setup Requirements & User Guide

## System Requirements

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Operating System**: Windows 10+, macOS 10.15+, or Ubuntu 18.04+
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: At least 500MB free space

### Required Dependencies

The application uses the following key technologies:

- **Frontend**: React 18, Vite, React Router, Tailwind CSS
- **Backend**: Express.js, SQLite3, JWT Authentication
- **Security**: bcrypt for password hashing, CORS for cross-origin requests

## Installation & Setup Guide

### Step 1: Download and Extract

1. Download the project files
2. Extract to your desired directory (e.g., `C:\Projects\taskmanagement`)

### Step 2: Install Dependencies

#### Backend Setup

```bash
# Navigate to project root
cd taskflow-solutions

# Install backend dependencies
npm install express sqlite3 cors bcrypt jsonwebtoken

# Alternative: Install all at once
npm install express sqlite3 cors bcrypt jsonwebtoken
```

#### Frontend Setup

```bash
# Navigate to frontend directory (if separate) or stay in root
# Install frontend dependencies (if using separate package.json)
npm install react react-dom react-router-dom lucide-react
```

### Step 3: Environment Configuration

1. Create a `.env` file in the project root:

```
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

2. Update the JWT_SECRET with a secure random string for production use.

### Step 4: Database Setup

The application uses SQLite and will automatically create the database file (`users.db`) on first run. No manual database setup required.

### Step 5: Start the Application

#### Terminal 1 - Backend Server:

```bash
cd taskflow-solutions
node server.js
```

You should see: "🚀 Server running on port 3001"

#### Terminal 2 - Frontend Development Server:

```bash
cd taskflow-solutions
npm run dev
```

You should see: "Local: http://localhost:5173"

## Default Login Credentials

### Administrator Account

- **Email**: `huskymudkipper1482004@gmail.com`
- **Password**: `S1zzX@`
- **Role**: Admin (can manage users and tasks)

## User Roles & Permissions

### Administrator

- **Full Access**: Can create, edit, and delete users
- **Task Management**: Can create, assign, edit, and delete all tasks
- **User Management**: Access to "Assign Account" page
- **Dashboard**: Can view and manage all tasks in the system
- **Home Page**: Company information and statistics

### Regular User

- **Limited Access**: Can only view assigned tasks
- **Task Interaction**: Can mark tasks as complete/incomplete
- **No User Management**: Cannot access user management features
- **Dashboard**: Can only see tasks assigned to them
- **Home Page**: Company information (no logout button in intro)

## Application Features

### Authentication System

- **Secure Login**: JWT-based authentication with access and refresh tokens
- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: Automatic token refresh and secure logout
- **Route Protection**: Protected routes based on user roles

### Task Management

- **Task Creation**: Admins can create tasks with title, description, assignees, deadline, priority
- **Task Assignment**: Multi-user assignment capability
- **Status Tracking**: To Do, In Progress, Done status system
- **Priority Levels**: High, Medium, Low priority classification
- **Progress Monitoring**: Visual progress bars and completion statistics

### User Management (Admin Only)

- **User Creation**: Add new users with role assignment
- **User Editing**: Modify user details and permissions
- **User Deletion**: Remove users from the system (with safety checks)
- **Role Management**: Assign admin or user roles

## Troubleshooting Guide

### Common Issues

#### Login Problems

- **Symptom**: Cannot log in with correct credentials
- **Solution**:
  1. Check if server is running on port 3001
  2. Verify exact email/password (case-sensitive)
  3. Clear browser cache and localStorage
  4. Check browser console for errors

#### Server Won't Start

- **Symptom**: "Port already in use" or connection errors
- **Solution**:
  1. Kill any existing Node processes: `pkill node`
  2. Check if port 3001 is free: `netstat -an | grep 3001`
  3. Change port in server.js if needed

#### Database Issues

- **Symptom**: User/task data not persisting
- **Solution**:
  1. Check if `users.db` file is created in project root
  2. Verify file permissions (read/write access)
  3. Delete `users.db` to reset database if corrupted

#### CORS Errors

- **Symptom**: Network errors in browser console
- **Solution**:
  1. Ensure backend server is running
  2. Verify frontend URL matches CORS configuration
  3. Check if ports match (frontend: 5173, backend: 3001)

### Performance Optimization

- **Database**: SQLite is suitable for small-medium teams (50-100 users)
- **Scaling**: For larger teams, consider migrating to PostgreSQL/MySQL
- **Caching**: Browser caches JWT tokens for improved performance

## Security Considerations

### Production Deployment

1. **Change Default Credentials**: Update admin email/password immediately
2. **Secure JWT Secret**: Use a strong, random JWT secret key
3. **HTTPS**: Deploy with SSL/TLS certificates
4. **Environment Variables**: Store secrets in environment variables
5. **Database Security**: Implement proper backup and access controls

### Best Practices

- **Password Policy**: Encourage strong passwords for all users
- **Regular Updates**: Keep dependencies updated for security patches
- **Access Control**: Regularly review user permissions and roles
- **Monitoring**: Implement logging for security events

## Support & Maintenance

### Regular Tasks

- **Backup Database**: Regular backups of `users.db`
- **Monitor Logs**: Check server logs for errors
- **Update Dependencies**: Monthly dependency updates
- **User Management**: Regular user access reviews

### Getting Help

1. **Check Logs**: Server console provides detailed error information
2. **Browser DevTools**: Use F12 to inspect network requests and console errors
3. **Database Tools**: Use SQLite browser tools to inspect database directly

## File Structure Overview

```
taskflow-solutions/
├── server.js              # Backend server
├── users.db               # SQLite database (auto-generated)
├── App.jsx                # Main React application
├── AuthContext.jsx        # Authentication context
├── Page/
│   ├── Login.jsx          # Login page component
│   ├── MainPage.jsx       # Main application layout
│   ├── DashBoard.jsx      # Task dashboard
│   └── AssignUsers.jsx    # User management (admin)
├── Components/
│   ├── Sidebar.jsx        # Navigation sidebar
│   └── ProtectedRoute.jsx # Route protection
└── CSS files              # Styling for components
```

## Version Information

- **Application Version**: 1.0.0
- **Node.js Compatibility**: 18.0.0+
- **Database**: SQLite3
- **Authentication**: JWT with refresh tokens
- **Frontend Framework**: React 18 with Vite
