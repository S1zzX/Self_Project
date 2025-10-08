# TaskManager - Complete Setup & User Guide

## 📋 Table of Contents

- [About TaskManager](#about-taskmanager)
- [System Requirements](#system-requirements)
- [Installation Guide](#installation-guide)
- [First Time Setup](#first-time-setup)
- [User Roles & Features](#user-roles--features)
- [How to Use](#how-to-use)
- [Troubleshooting](#troubleshooting)
- [Security & Best Practices](#security--best-practices)

---

## 🎯 About TaskManager

TaskManager is a comprehensive task management application designed for teams. It features:

- **Role-Based Access Control**: Separate permissions for administrators and regular users
- **Real-Time Task Management**: Create, assign, and track tasks with progress monitoring
- **Built-in Chat System**: Communicate with team members directly in the app
- **Notification System**: Stay updated on task assignments and changes
- **User Profile Management**: Manage your account settings and profile picture
- **Secure Authentication**: JWT-based authentication with refresh tokens

---

## 💻 System Requirements

### Prerequisites

Before installing TaskManager, ensure your system has:

| Requirement | Minimum Version | Recommended | Download Link                    |
| ----------- | --------------- | ----------- | -------------------------------- |
| **Node.js** | 18.0.0          | 20.0.0+     | [nodejs.org](https://nodejs.org) |
| **npm**     | 8.0.0           | 10.0.0+     | (Included with Node.js)          |
| **RAM**     | 4GB             | 8GB+        | -                                |
| **Storage** | 500MB free      | 1GB+        | -                                |

### Supported Operating Systems

- Windows 10 or higher
- macOS 10.15 (Catalina) or higher
- Ubuntu 18.04 LTS or higher
- Any Linux distribution with Node.js support

### Supported Browsers

- Google Chrome 90+
- Mozilla Firefox 88+
- Microsoft Edge 90+
- Safari 14+ (macOS only)

---

## 📦 Installation Guide

### Step 1: Verify Node.js Installation

Open your terminal/command prompt and verify Node.js is installed:

```bash
node --version
# Should output: v18.0.0 or higher

npm --version
# Should output: v8.0.0 or higher
```

If not installed, download from [nodejs.org](https://nodejs.org) and install the LTS version.

### Step 2: Download the Project

1. Download the project files from your source
2. Extract the ZIP file to a location on your computer
3. Example path: `C:\Projects\TaskManager` (Windows) or `~/Projects/TaskManager` (macOS/Linux)

### Step 3: Open Terminal in Project Directory

**Windows:**

- Open File Explorer and navigate to the project folder
- Hold `Shift` and right-click in the folder
- Select "Open PowerShell window here" or "Open Command Prompt here"

**macOS/Linux:**

- Open Terminal
- Navigate to the project folder:

```bash
cd ~/Projects/TaskManager
```

### Step 4: Install Dependencies

Run the following command to install all required packages:

```bash
npm install
```

This will install:

- **Backend**: Express.js, SQLite3, JWT, bcrypt, CORS
- **Frontend**: React, React Router, Lucide Icons
- **Additional tools**: Multer (file uploads), dotenv (environment variables)

Installation may take 2-5 minutes depending on your internet speed.

### Step 5: Configure Environment Variables

Create a file named `.env` in the project root folder:

**Windows (using Notepad):**

```bash
notepad .env
```

**macOS/Linux:**

```bash
nano .env
```

Add the following content:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30m
REFRESH_TOKEN_EXPIRES_IN=7d
NODE_ENV=development
PORT=3001
```

**⚠️ Security Note:** Change `JWT_SECRET` to a random, secure string before deploying to production. You can generate one at [randomkeygen.com](https://randomkeygen.com/).

---

## 🚀 First Time Setup

### Starting the Application

You'll need **TWO terminal windows** open simultaneously:

#### Terminal 1: Start Backend Server

```bash
# Make sure you're in the project root directory
cd path/to/TaskManager

# Start the backend server
node server.js
```

**Expected Output:**

```
✅ Connected to SQLite database
✅ Progress column added to tasks table
✅ Profile image column added to users table
✅ Admin already exists: huskymudkipper1482004@gmail.com
🚀 Server running on port 3001
🔒 JWT Authentication enabled
📁 File upload enabled
💬 Chat system enabled
```

#### Terminal 2: Start Frontend Development Server

Open a **NEW** terminal window (keep the first one running):

```bash
# Navigate to project directory
cd path/to/TaskManager

# Start the frontend
npm run dev
```

**Expected Output:**

```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Accessing the Application

1. Open your web browser
2. Navigate to: **http://localhost:5173**
3. You should see the TaskManager landing page

---

## 🔐 Default Login Credentials

### Administrator Account (Pre-configured)

```
Email: huskymudkipper1482004@gmail.com
Password: S1zzX@
Role: Administrator
```

**⚠️ IMPORTANT:**

- Change this password immediately after first login!
- Go to "Assign Account" → Click edit on admin user → Change password
- Use a strong, unique password

### Creating Additional Users

Only administrators can create new user accounts:

1. Login as admin
2. Navigate to "Assign Account" in the sidebar
3. Fill in the new user form:
   - Full Name (required, 2-50 characters)
   - Email Address (required, valid email format)
   - Password (required, min 6 chars, 1 uppercase, 1 lowercase, 1 number)
   - User Type (User or Admin)
4. Click "Add" button

---

## 👥 User Roles & Features

### 🛡️ Administrator Role

**Full System Access:**

| Feature                | Permission Level      | Description                              |
| ---------------------- | --------------------- | ---------------------------------------- |
| **User Management**    | ✅ Full Access        | Create, edit, delete user accounts       |
| **Task Management**    | ✅ Full Access        | Create, assign, edit, delete all tasks   |
| **Dashboard**          | ✅ View All           | See all tasks across all users           |
| **Profile Management** | ✅ Via Assign Account | Edit own profile through user management |
| **Chat System**        | ✅ Full Access        | Message any user                         |
| **Notifications**      | ✅ Receive All        | Get notified of all task updates         |

**Admin-Specific Pages:**

- **Assign Account**: User management interface
- Can access all features and data

### 👤 Regular User Role

**Limited Access:**

| Feature                | Permission Level | Description                         |
| ---------------------- | ---------------- | ----------------------------------- |
| **User Management**    | ❌ No Access     | Cannot manage other users           |
| **Task Management**    | 📝 Assigned Only | View and update only assigned tasks |
| **Dashboard**          | 👁️ Personal View | See only tasks assigned to them     |
| **Profile Management** | ✅ Own Profile   | Edit own profile via Profile page   |
| **Chat System**        | ✅ Full Access   | Message any user                    |
| **Notifications**      | ✅ Personal      | Get notified of assigned tasks      |

**User-Specific Pages:**

- **Profile**: Personal account settings
- **Dashboard**: View assigned tasks only

---

## 📖 How to Use

### For First-Time Users

#### 1. Login to the System

1. Open the application at http://localhost:5173
2. Click "Get Started Today" or navigate directly to login
3. Enter your credentials
4. Click "Sign In"

#### 2. Understanding the Interface

**Sidebar Navigation (Left):**

- **Dashboard**: View and manage tasks
- **Messages**: Chat with team members
- **Assign Account** (Admin only): User management
- **Profile** (Users only): Account settings
- **Notification Bell**: View task notifications
- **User Profile Card**: Shows your name and role
- **Logout Button**: Sign out of the application

#### 3. Dashboard Overview

**For Administrators:**

- See **ALL tasks** in the system
- Use filters to find specific tasks:
  - Status (To Do, In Progress, Done)
  - Priority (High, Medium, Low)
  - Assignee
  - Deadline (Overdue, Today, This Week)
- Search tasks by title using the search bar
- Create new tasks using the form at the top

**For Regular Users:**

- See only **tasks assigned to you**
- Update task progress using the slider
- Mark tasks as complete with the checkbox
- View detailed information by clicking on tasks
- Filter and search your tasks

### Creating Tasks (Admin Only)

1. Navigate to **Dashboard**
2. Fill in the task creation form at the top:
   - **Task Title**: Clear, descriptive name (max 100 chars)
   - **Description**: Detailed task information (max 500 chars)
   - **Assign To**: Select one or more users (click dropdown to select multiple)
   - **Deadline**: Choose a future date (cannot be in the past)
   - **Priority**: Select High, Medium, or Low
   - **Status**: Choose To Do, In Progress, or Done
3. Click the **"Add"** button
4. The task will appear in the list below

### Managing Tasks

#### Viewing Task Details

- Click on any task card to open the detailed view
- Modal shows:
  - Full description
  - All assigned users
  - Deadline with overdue indication
  - Priority level
  - Current status
  - Progress percentage
  - Task ID

#### Updating Task Progress

**For All Users:**

1. Find the task card in the dashboard
2. Locate the blue progress slider below the task details
3. Click and drag the slider left/right:
   - **0%**: Automatically sets status to "To Do"
   - **1-99%**: Automatically sets status to "In Progress"
   - **100%**: Automatically sets status to "Done" and marks complete

**Note:** Users cannot modify overdue tasks. Contact an administrator if you need to update an overdue task.

**For Administrators:**

- Can edit any task at any time
- Can modify overdue tasks
- Click "Edit" button in task details for full editing

#### Completing Tasks

- Click the **circle checkbox** on the left side of the task card
- Task will be marked as complete (green checkmark)
- Progress automatically updates to 100%
- Status changes to "Done"
- Click again to mark as incomplete

### Using the Chat System

#### Starting a Conversation

1. Click **Messages** in the sidebar
2. Click the **"+" button** at the top
3. Search for a user by email
4. Click **"Add"** to add them to your contacts
5. Click on their name in the contact list to start chatting

#### Sending Messages

1. Select a contact from the list
2. Type your message in the input box at the bottom
3. Press **Enter** or click the **send button**
4. Messages appear instantly

#### Message Features

- **Edit Messages**: Click the pencil icon on your sent messages
- **Delete Messages**: Click the trash icon on your sent messages
- **Read Receipts**: Unread messages appear in a blue background
- **Message Requests**: Messages from non-contacts appear in "Requests" tab

#### Managing Contacts

- **Remove Contact**: Hover over contact, click the "X" button
- **Message Requests**:
  - Click "Requests" tab to see messages from non-contacts
  - Click "Accept" to add them to your contacts
  - Click "Delete" to remove all messages from that user

### Managing Your Profile (Regular Users)

1. Click **Profile** in the sidebar
2. Update your information:

**Account Information:**

- Change your full name
- Update email address
- Click "Save Changes"

**Profile Picture:**

- Click "Upload" to add a profile picture
- Supported formats: JPG, PNG, GIF, WEBP
- Maximum size: 5MB
- Click "Remove" to delete current picture

**Change Password:**

- Enter current password
- Create new password (requirements shown in real-time):
  - Minimum 6 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- Confirm new password
- Click "Update Password"

### Managing Users (Admin Only)

1. Click **Assign Account** in the sidebar
2. View all registered users

**Adding New Users:**

- Fill in the form at the top:
  - Full Name (required)
  - Email Address (required, must be unique)
  - Password (required, must meet requirements)
  - User Type (select User or Admin)
- Click the circular "+" button

**Editing Users:**

- Click the **Edit** button (pencil icon) on any user card
- Modify any field (leave password blank to keep current)
- Update profile picture:
  - Click "Change" to upload new picture
  - Click "Remove" to delete picture
- Click **"Save"**

**Deleting Users:**

- Click the **Delete** button (trash icon) on any user card
- Confirm the deletion
- **Note:** You cannot delete your own account

### Using Notifications

1. Click the **Bell icon** in the sidebar
2. Notification panel opens (draggable window):
   - Unread notifications appear with blue background
   - Red notification count appears on bell icon

**Notification Actions:**

- **Mark as Read/Unread**: Click the envelope icon
- **Delete Single**: Click the "X" icon
- **Mark All as Read**: Click the checkmark icon at the top
- **Drag to Move**: Click and drag the "Drag to move" bar

**Notification Types:**

- New task assignments
- Task updates
- Priority changes
- Deadline updates

---

## 🔍 Troubleshooting

### Common Issues and Solutions

#### ❌ "Cannot connect to server" Error

**Symptoms:**

- Login fails with network error
- Dashboard won't load
- "Network error: could not reach server" message

**Solutions:**

1. Check if backend server is running:

   ```bash
   # Should see server output in terminal
   # If not, run: node server.js
   ```

2. Verify server is on correct port:

   - Open browser and go to: http://localhost:3001
   - Should see: "Cannot GET /" (this is normal)

3. Check for port conflicts:

   ```bash
   # Windows
   netstat -ano | findstr :3001

   # macOS/Linux
   lsof -i :3001
   ```

4. Restart both servers:
   - Press `Ctrl+C` in both terminal windows
   - Start backend: `node server.js`
   - Start frontend: `npm run dev`

#### ❌ "Invalid email or password" (But credentials are correct)

**Solutions:**

1. Verify exact credentials:

   - Email: `huskymudkipper1482004@gmail.com`
   - Password: `S1zzX@` (case-sensitive)

2. Check if database exists:

   - Look for `users.db` file in project root
   - If missing, server will create it on first run

3. Reset database (⚠️ Deletes all data):

   ```bash
   # Stop the server (Ctrl+C)
   # Delete database file
   rm users.db  # macOS/Linux
   del users.db # Windows

   # Restart server - will recreate with default admin
   node server.js
   ```

#### ❌ "Failed to upload image" or Profile Picture Issues

**Solutions:**

1. Check file requirements:

   - Must be image format: JPG, PNG, GIF, or WEBP
   - Maximum size: 5MB
   - Use a different image if current one is corrupted

2. Verify uploads directory exists:

   ```bash
   # The server should create this automatically
   # If not, create manually:
   mkdir -p uploads/profiles  # macOS/Linux
   md uploads\profiles        # Windows
   ```

3. Check file permissions:
   - Ensure the application has write permissions to the project folder

#### ❌ Cannot See Tasks (Regular Users)

**Symptoms:**

- Dashboard shows "No tasks found"
- Other users can see tasks

**Solutions:**

1. Verify you have tasks assigned:

   - Ask admin to check your assignments
   - Admin should see your name in task assignees

2. Check filters are not too restrictive:

   - Click "Filters" button
   - Set all to "All"
   - Clear search box

3. Refresh the page:
   - Press `F5` or `Ctrl+R` (Windows)
   - Press `Cmd+R` (macOS)

#### ❌ "Task is overdue - Contact admin" Message

**Explanation:**

- Regular users cannot modify tasks past their deadline
- This prevents accidental changes to overdue work

**Solutions:**

- Contact an administrator to:
  - Extend the deadline
  - Update the task status
  - Mark it as complete

#### ❌ Notifications Not Appearing

**Solutions:**

1. Refresh notifications:

   - Click the bell icon to open/close the panel

2. Check task assignments:

   - Notifications only appear for assigned tasks
   - Verify you're listed as an assignee

3. Clear browser cache:
   ```
   Chrome: Ctrl+Shift+Delete → Clear browsing data
   Firefox: Ctrl+Shift+Delete → Clear recent history
   ```

#### ❌ Chat Messages Not Sending

**Solutions:**

1. Verify user is in contacts:

   - You can only send to accepted contacts
   - Message requests work differently

2. Check message content:

   - Cannot send empty messages
   - Ensure text is not just spaces

3. Check server connection:
   - Look for error messages in browser console (F12)
   - Ensure backend is running

#### ❌ "Port already in use" Error

**Symptoms:**

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**

1. Kill existing Node processes:

   ```bash
   # Windows
   taskkill /F /IM node.exe

   # macOS/Linux
   pkill node
   ```

2. Find and kill specific process:

   ```bash
   # Windows
   netstat -ano | findstr :3001
   taskkill /PID [PID_NUMBER] /F

   # macOS/Linux
   lsof -ti:3001 | xargs kill -9
   ```

3. Use a different port (in server.js):
   ```javascript
   app.listen(3002, () => {
     // Change from 3001
     console.log("Server running on port 3002");
   });
   ```

### Browser Developer Tools

For advanced troubleshooting, use browser developer tools:

1. Press **F12** to open DevTools
2. Check **Console** tab for JavaScript errors
3. Check **Network** tab for failed requests
4. Look for red error messages

---

## 🔒 Security & Best Practices

### Essential Security Steps

#### 1. Change Default Admin Credentials

**Immediately after first login:**

1. Login as admin
2. Go to "Assign Account"
3. Find the admin user
4. Click "Edit"
5. Enter a strong, unique password:
   - At least 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Don't reuse passwords from other sites
6. Save changes

#### 2. Secure Your JWT Secret

**Before deploying to production:**

1. Open the `.env` file
2. Change `JWT_SECRET` to a long, random string
3. Generate secure secrets at: [randomkeygen.com](https://randomkeygen.com/)
4. Use the "CodeIgniter Encryption Keys" option (256-bit)

Example:

```env
JWT_SECRET=x9Kp2mN5vQ8rT3wY6zA4bC7dE0fH1gJ9kL2mN5pQ8rS5tU8wX1yA4zB7cD0eF3
```

#### 3. Regular Database Backups

**Backup Schedule:**

- **Daily**: For active teams (automated script recommended)
- **Weekly**: For smaller teams

**Manual Backup:**

```bash
# Create backup
cp users.db users_backup_2024-01-15.db  # macOS/Linux
copy users.db users_backup_2024-01-15.db  # Windows
```

**Automated Backup Script** (save as `backup.sh`):

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d_%H-%M-%S)
cp users.db backups/users_backup_$DATE.db
echo "Backup created: users_backup_$DATE.db"
```

#### 4. Password Policy for Users

**Enforce strong passwords:**

- Minimum 8 characters (default is 6, can be changed in server.js)
- Require uppercase, lowercase, and numbers
- Recommend password managers like LastPass, 1Password, or Bitwarden

#### 5. Regular Updates

**Monthly maintenance:**

```bash
# Check for outdated packages
npm outdated

# Update all dependencies
npm update

# For major version updates:
npm install [package]@latest
```

### Production Deployment Checklist

Before deploying to a public server:

- [ ] Change default admin credentials
- [ ] Generate new JWT_SECRET
- [ ] Set `NODE_ENV=production` in .env
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Enable logging and monitoring
- [ ] Restrict database file permissions
- [ ] Review and limit CORS origins
- [ ] Change default ports if needed
- [ ] Test all functionality in production environment

### Data Privacy

**GDPR Compliance Considerations:**

- User data stored locally in SQLite
- Profile pictures stored in `uploads/profiles/`
- Users can update their own information
- Admins can delete user accounts
- Implement data export if required
- Add privacy policy for production use

---

## 📊 Technical Specifications

### Application Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)         │
│  - Port: 5173                           │
│  - SPA with React Router                │
│  - Tailwind CSS styling                 │
└─────────────────┬───────────────────────┘
                  │ HTTP/REST API
                  │ JWT Authentication
┌─────────────────▼───────────────────────┐
│       Backend (Express.js + Node)       │
│  - Port: 3001                           │
│  - JWT Authentication                   │
│  - Multer file uploads                  │
└─────────────────┬───────────────────────┘
                  │ SQL Queries
┌─────────────────▼───────────────────────┐
│         Database (SQLite3)              │
│  - File: users.db                       │
│  - Tables: users, tasks, messages,      │
│    notifications, refresh_tokens        │
└─────────────────────────────────────────┘
```

### Database Schema

**Users Table:**

```sql
- id (PRIMARY KEY)
- name (TEXT)
- email (TEXT UNIQUE)
- password (TEXT, bcrypt hashed)
- userType (TEXT: 'admin' or 'user')
- profile_image (TEXT, file path)
```

**Tasks Table:**

```sql
- id (PRIMARY KEY)
- text (TEXT)
- description (TEXT)
- assignees (TEXT, JSON array)
- deadline (TEXT, ISO date)
- priority (TEXT: 'High', 'Medium', 'Low')
- status (TEXT: 'To Do', 'In Progress', 'Done')
- completed (INTEGER, 0 or 1)
- progress (INTEGER, 0-100)
```

**Messages Table:**

```sql
- id (PRIMARY KEY)
- sender_id (INTEGER, FOREIGN KEY)
- receiver_id (INTEGER, FOREIGN KEY)
- message (TEXT)
- timestamp (DATETIME)
- read (INTEGER, 0 or 1)
- edited (INTEGER, 0 or 1)
- deleted (INTEGER, 0 or 1)
```

### API Endpoints

**Authentication:**

- `POST /login` - User login
- `POST /refresh-token` - Refresh access token
- `POST /logout` - User logout

**Users:**

- `GET /users` - Get all users (admin only)
- `POST /users` - Create user (admin only)
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (admin only)

**Profile Images:**

- `POST /users/:id/profile-image` - Upload profile image
- `DELETE /users/:id/profile-image` - Remove profile image

**Tasks:**

- `GET /tasks` - Get tasks (all for admin, assigned for users)
- `POST /tasks` - Create task (admin only)
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task (admin only)

**Messages:**

- `GET /messages` - Get all messages
- `GET /messages/conversation/:userId` - Get conversation
- `POST /messages` - Send message
- `PUT /messages/:id/read` - Mark as read
- `PUT /messages/:id` - Edit message
- `PUT /messages/:id/delete` - Delete message (soft)
- `DELETE /messages/:id` - Delete message (hard)

**Notifications:**

- `GET /notifications` - Get user notifications
- `PUT /notifications/:id/read` - Mark as read
- `PUT /notifications/:id/unread` - Mark as unread
- `PUT /notifications/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification
- `DELETE /notifications` - Clear all notifications

---

## 🆘 Getting Help

### Debug Mode

Enable verbose logging for troubleshooting:

1. Open `server.js`
2. Add at the top:

   ```javascript
   const DEBUG = true;

   // Then add console.logs throughout
   if (DEBUG) console.log("Debug info here");
   ```

### Browser Console

Check for errors:

1. Press **F12**
2. Go to **Console** tab
3. Look for red error messages
4. Copy error text for troubleshooting

### Network Issues

Check API calls:

1. Press **F12**
2. Go to **Network** tab
3. Refresh the page
4. Look for failed requests (red status codes)
5. Click on failed requests to see details

### System Information

When reporting issues, include:

- Operating System and version
- Node.js version (`node --version`)
- npm version (`npm --version`)
- Browser and version
- Error messages from console
- Steps to reproduce the issue

---

## 📝 Version Information

- **Application Version**: 1.0.0
- **Last Updated**: 2024
- **Minimum Node.js**: 18.0.0
- **Recommended Node.js**: 20.0.0+
- **Database**: SQLite3
- **Authentication**: JWT with refresh tokens
- **Frontend**: React 18 with Vite
- **Backend**: Express.js with Node.js

---

## 🎓 Learning Resources

### For Beginners

- **React Documentation**: [react.dev](https://react.dev)
- **Node.js Documentation**: [nodejs.org/docs](https://nodejs.org/docs)
- **Express.js Guide**: [expressjs.com](https://expressjs.com)
- **JWT Basics**: [jwt.io/introduction](https://jwt.io/introduction)

### For Developers

- **Project Structure**: See file structure in project root
- **Component Documentation**: Check inline comments in .jsx files
- **API Documentation**: See API endpoints section above
- **Database Schema**: See database schema section above

---

## 📞 Support

For issues, questions, or feature requests:

1. Check this README thoroughly
2. Review the Troubleshooting section
3. Check browser console for errors
4. Review server logs in terminal
5. Contact your system administrator or development team

---

**Thank you for using TaskManager! 🚀**

_This guide was last updated for TaskManager v1.0.0_
