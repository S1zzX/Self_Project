// server.js - Updated with JWT Authentication, Progress Storage, Profile Image Upload, and Chat
import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

const sqlite = sqlite3.verbose();
const db = new sqlite.Database('./users.db', (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

const saltRounds = 10;

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Generate tokens
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    userType: user.userType
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

  return { accessToken, refreshToken };
};

// Create tables
db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, password TEXT, userType TEXT)');

db.run(`CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  text TEXT,
  description TEXT,
  assignees TEXT,
  deadline TEXT,
  priority TEXT,
  status TEXT,
  completed INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0
)`);

db.run(`CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  task_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  priority TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  read INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
)`);

db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER,
  message TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  read INTEGER DEFAULT 0,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
)`);

db.run(`ALTER TABLE tasks ADD COLUMN progress INTEGER DEFAULT 0`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding progress column:', err);
  } else if (!err) {
    console.log('✅ Progress column added to tasks table');
  }
});

db.run(`ALTER TABLE users ADD COLUMN profile_image TEXT`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding profile_image column:', err);
  } else if (!err) {
    console.log('✅ Profile image column added to users table');
  }
});

db.run('CREATE TABLE IF NOT EXISTS refresh_tokens (id INTEGER PRIMARY KEY, token TEXT, user_id INTEGER, expires_at DATETIME)');

// Insert default admin if not exists
const defaultAdmin = {
  name: 'Admin',
  email: 'huskymudkipper1482004@gmail.com',
  password: 'S1zzX@',
  userType: 'admin'
};

db.get('SELECT * FROM users WHERE email = ?', [defaultAdmin.email], async (err, row) => {
  if (err) {
    console.error('Error checking admin account:', err);
    return;
  }
  if (!row) {
    try {
      const hashedPassword = await bcrypt.hash(defaultAdmin.password, saltRounds);
      db.run(
        'INSERT INTO users (name, email, password, userType) VALUES (?, ?, ?, ?)',
        [defaultAdmin.name, defaultAdmin.email, hashedPassword, defaultAdmin.userType],
        function (err) {
          if (err) {
            console.error('Error inserting default admin:', err);
          } else {
            console.log('✅ Default admin created:', defaultAdmin.email);
          }
        }
      );
    } catch (hashErr) {
      console.error('Error hashing default admin password:', hashErr);
    }
  } else {
    console.log('✅ Admin already exists:', defaultAdmin.email);
  }
});

// ==================== AUTH ENDPOINTS ====================

app.post('/login', async (req, res) => {
  console.log('Login attempt for:', req.body.email);
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (row) {
      try {
        const passwordMatch = await bcrypt.compare(password, row.password);
        
        if (passwordMatch) {
          const user = {
            id: row.id,
            name: row.name,
            email: row.email,
            userType: row.userType,
            profileImage: row.profile_image
          };

          const { accessToken, refreshToken } = generateTokens(user);
          
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          db.run(
            'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
            [refreshToken, user.id, expiresAt],
            (err) => {
              if (err) console.error('Error storing refresh token:', err);
            }
          );

          console.log('✅ Login successful for:', email);
          res.json({
            message: 'Login successful',
            user: user,
            accessToken: accessToken,
            refreshToken: refreshToken
          });
        } else {
          console.log('❌ Invalid password for:', email);
          res.status(401).json({ error: 'Invalid email or password' });
        }
      } catch (error) {
        console.error('Error verifying password:', error);
        res.status(500).json({ error: 'Error verifying password' });
      }
    } else {
      console.log('❌ User not found:', email);
      res.status(401).json({ error: 'Invalid email or password' });
    }
  });
});

app.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  jwt.verify(refreshToken, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    db.get(
      'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > datetime("now")',
      [refreshToken, decoded.id],
      (err, tokenRow) => {
        if (err || !tokenRow) {
          return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, userRow) => {
          if (err || !userRow) {
            return res.status(401).json({ error: 'User not found' });
          }

          const user = {
            id: userRow.id,
            name: userRow.name,
            email: userRow.email,
            userType: userRow.userType,
            profileImage: userRow.profile_image
          };

          const { accessToken } = generateTokens(user);

          res.json({
            accessToken: accessToken,
            user: user
          });
        });
      }
    );
  });
});

app.post('/logout', (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    db.run('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken], (err) => {
      if (err) console.error('Error removing refresh token:', err);
    });
  }

  res.json({ message: 'Logged out successfully' });
});

// ==================== PROTECTED ROUTES ====================

app.get('/users', verifyToken, (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Only admin can view users' });
  }

  db.all('SELECT id, name, email, userType, profile_image FROM users', [], (err, rows) => {
    if (err) {
      console.error('Database error fetching users:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/users', verifyToken, async (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Only admin can add users' });
  }

  let { name, email, password, userType } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password required' });
  }
  if (!userType) userType = 'user';

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (row) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      db.run(
        'INSERT INTO users (name, email, password, userType) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, userType],
        function (err) {
          if (err) return res.status(500).json({ error: 'Error saving user' });
          res.json({ message: 'User added', id: this.lastID, name, email, userType });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Error hashing password' });
  }
});

app.put('/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, password, userType, currentPassword } = req.body;

  // Check if user is trying to modify themselves
  if (req.user.id !== parseInt(id) && req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Permission denied' });
  }

  // ✅ PREVENT ADMIN FROM DEMOTING THEMSELVES
  if (req.user.id === parseInt(id) && req.user.userType === 'admin' && userType === 'user') {
    return res.status(403).json({ 
      error: 'You cannot demote yourself from admin. Another admin must change your role.' 
    });
  }

  try {
    if (password && currentPassword) {
      db.get('SELECT password FROM users WHERE id = ?', [id], async (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'User not found' });
        
        const passwordMatch = await bcrypt.compare(currentPassword, row.password);
        if (!passwordMatch) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        updateUser();
      });
    } else {
      updateUser();
    }

    async function updateUser() {
      let query, params;
      if (password) {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        query = 'UPDATE users SET name = ?, email = ?, password = ?, userType = ? WHERE id = ?';
        params = [name, email, hashedPassword, userType, id];
      } else {
        query = 'UPDATE users SET name = ?, email = ?, userType = ? WHERE id = ?';
        params = [name, email, userType, id];
      }

      db.run(query, params, function (err) {
        if (err) return res.status(500).json({ error: 'Error updating user' });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User updated', id, name, email, userType });
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error processing request' });
  }
});

app.delete('/users/:id', verifyToken, (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Only admin can delete users' });
  }

  const { id } = req.params;

  // ✅ PREVENT SELF-DELETION
  if (req.user.id === parseInt(id)) {
    return res.status(403).json({ 
      error: 'You cannot delete your own account' 
    });
  }

  db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Error deleting user' });
    if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted', id });
  });
});

// ==================== PROFILE IMAGE ROUTES ====================

app.post('/users/:id/profile-image', verifyToken, upload.single('profileImage'), (req, res) => {
  const { id } = req.params;
  
  if (req.user.userType !== 'admin' && req.user.id !== parseInt(id)) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(403).json({ error: 'Permission denied' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  
  db.get('SELECT profile_image FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (row && row.profile_image) {
      const oldImagePath = path.join(__dirname, row.profile_image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    const relativePath = path.join('uploads', 'profiles', req.file.filename).replace(/\\/g, '/');
    
    db.run(
      'UPDATE users SET profile_image = ? WHERE id = ?',
      [relativePath, id],
      function(updateErr) {
        if (updateErr) {
          fs.unlinkSync(req.file.path);
          return res.status(500).json({ error: 'Error updating profile image' });
        }
        if (this.changes === 0) {
          fs.unlinkSync(req.file.path);
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ 
          message: 'Profile image uploaded successfully',
          imagePath: relativePath
        });
      }
    );
  });
});

app.delete('/users/:id/profile-image', verifyToken, (req, res) => {
  const { id } = req.params;
  
  if (req.user.userType !== 'admin' && req.user.id !== parseInt(id)) {
    return res.status(403).json({ error: 'Permission denied' });
  }
  
  db.get('SELECT profile_image FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (row.profile_image) {
      const imagePath = path.join(__dirname, row.profile_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    db.run(
      'UPDATE users SET profile_image = NULL WHERE id = ?',
      [id],
      function(updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: 'Error removing profile image' });
        }
        res.json({ message: 'Profile image removed successfully' });
      }
    );
  });
});

// ==================== TASK ROUTES ====================

app.get('/tasks', verifyToken, (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    db.all('SELECT id, name FROM users', [], (userErr, users) => {
      if (userErr) {
        console.error('Error fetching users for task mapping:', userErr);
        return res.status(500).json({ error: 'Database error' });
      }

      const userMap = {};
      users.forEach(user => {
        userMap[user.id] = user.name;
      });

      if (req.user.userType === 'admin') {
        return res.json(rows.map(row => ({ 
          ...row, 
          assignees: JSON.parse(row.assignees || '[]'),
          assigneeNames: JSON.parse(row.assignees || '[]').map(id => userMap[id] || `User ${id}`),
          completed: row.completed === 1,
          progress: row.progress || 0
        })));
      }

      const uid = parseInt(req.user.id, 10);
      const filtered = rows.filter(row => {
        try {
          const assignees = JSON.parse(row.assignees || '[]');
          return Array.isArray(assignees) && assignees.some(id => parseInt(id, 10) === uid);
        } catch {
          return false;
        }
      }).map(row => {
        const assignees = JSON.parse(row.assignees || '[]');
        return {
          ...row,
          assignees: assignees,
          assigneeNames: assignees.map(id => userMap[id] || `User ${id}`),
          completed: row.completed === 1,
          progress: row.progress || 0
        };
      });

      res.json(filtered);
    });
  });
});

app.post('/tasks', verifyToken, (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Only admin can add tasks' });
  }

  const { text, description, assignees, deadline, priority, status, progress = 0 } = req.body;

  db.run(
    'INSERT INTO tasks (text, description, assignees, deadline, priority, status, completed, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [text, description, JSON.stringify(assignees), deadline, priority, status, 0, progress],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error saving task' });
      
      const taskId = this.lastID;
      
      if (Array.isArray(assignees) && assignees.length > 0) {
        const notificationStmt = db.prepare(
          'INSERT INTO notifications (user_id, task_id, message, priority) VALUES (?, ?, ?, ?)'
        );
        
        assignees.forEach(userId => {
          notificationStmt.run(
            userId,
            taskId,
            `New task assigned: ${text}`,
            priority
          );
        });
        
        notificationStmt.finalize();
      }
      
      res.json({ message: 'Task added', id: taskId });
    }
  );
});

app.put('/tasks/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { text, description, assignees, deadline, priority, status, completed, progress = 0 } = req.body;
  
  const completedValue = completed ? 1 : 0;

  if (req.user.userType === 'user') {
    // Check if task is overdue before allowing user modifications
    db.get('SELECT deadline, completed FROM tasks WHERE id = ?', [id], (err, task) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      // Prevent modifications if task is overdue and not completed
      if (task.deadline && !task.completed) {
        const deadlineDate = new Date(task.deadline);
        const today = new Date();
        deadlineDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        
        if (deadlineDate < today) {
          return res.status(403).json({ 
            error: 'This task is overdue. Please contact an administrator to modify it.' 
          });
        }
      }
      
      // Proceed with update if not overdue
      updateUserTask();
    });
    
    function updateUserTask() {
      db.run(
        'UPDATE tasks SET completed = ?, status = ?, progress = ? WHERE id = ?',
        [completedValue, status || 'To Do', progress, id],
        function (err) {
          if (err) {
            console.error('Database error updating task completion:', err);
            return res.status(500).json({ error: 'Error updating task completion' });
          }
          if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
          
          db.get('SELECT * FROM tasks WHERE id = ?', [id], (selectErr, row) => {
            if (selectErr) {
              console.error('Error fetching updated task:', selectErr);
              return res.status(500).json({ error: 'Error fetching updated task' });
            }
            res.json({ 
              ...row,
              assignees: JSON.parse(row.assignees || '[]'),
              completed: row.completed === 1,
              progress: row.progress || 0
            });
          });
        }
      );
    }
  } else {
    const taskText = text && text.trim() ? text.trim() : 'Untitled Task';
    const taskDescription = description || '';
    const taskAssignees = Array.isArray(assignees) ? assignees : [];
    const taskDeadline = deadline || '';
    const taskPriority = priority || 'Medium';
    const taskStatus = status || 'To Do';
    
    db.run(
      'UPDATE tasks SET text = ?, description = ?, assignees = ?, deadline = ?, priority = ?, status = ?, completed = ?, progress = ? WHERE id = ?',
      [taskText, taskDescription, JSON.stringify(taskAssignees), taskDeadline, taskPriority, taskStatus, completedValue, progress, id],
      function (err) {
        if (err) {
          console.error('Database error updating task (admin):', err);
          return res.status(500).json({ error: 'Error updating task: ' + err.message });
        }
        if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
        
        db.get('SELECT * FROM tasks WHERE id = ?', [id], (selectErr, row) => {
          if (selectErr) {
            console.error('Error fetching updated task:', selectErr);
            return res.status(500).json({ error: 'Error fetching updated task' });
          }
          res.json({ 
            ...row,
            assignees: JSON.parse(row.assignees || '[]'),
            completed: row.completed === 1,
            progress: row.progress || 0
          });
        });
      }
    );
  }
});

app.delete('/tasks/:id', verifyToken, (req, res) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Only admin can delete tasks' });
  }

  const { id } = req.params;

  db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Error deleting task' });
    if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted', id });
  });
});

// ==================== NOTIFICATION ROUTES ====================

app.get('/notifications', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  db.all(
    `SELECT n.*, t.text as task_text,
     datetime(n.timestamp) as utc_timestamp
     FROM notifications n 
     LEFT JOIN tasks t ON n.task_id = t.id 
     WHERE n.user_id = ? 
     ORDER BY n.timestamp DESC 
     LIMIT 50`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const notifications = rows.map(row => ({
        id: row.id,
        taskId: row.task_id,
        message: row.message,
        priority: row.priority,
        timestamp: row.utc_timestamp + 'Z',
        read: row.read === 1
      }));
      
      res.json(notifications);
    }
  );
});

app.put('/notifications/:id/read', verifyToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  db.run(
    'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
    [id, userId],
    function(err) {
      if (err) {
        console.error('Error marking notification as read:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json({ message: 'Notification marked as read' });
    }
  );
});

app.put('/notifications/:id/unread', verifyToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  db.run(
    'UPDATE notifications SET read = 0 WHERE id = ? AND user_id = ?',
    [id, userId],
    function (err) {
      if (err) {
        console.error('Error marking notification as unread:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json({ message: 'Notification marked as unread' });
    }
  );
});

app.put('/notifications/read-all', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  db.run(
    'UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0',
    [userId],
    function(err) {
      if (err) {
        console.error('Error marking all notifications as read:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'All notifications marked as read', updated: this.changes });
    }
  );
});

app.delete('/notifications/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  db.run(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [id, userId],
    function(err) {
      if (err) {
        console.error('Error deleting notification:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json({ message: 'Notification deleted' });
    }
  );
});

app.delete('/notifications', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  db.run(
    'DELETE FROM notifications WHERE user_id = ?',
[userId],
    function(err) {
      if (err) {
        console.error('Error clearing notifications:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'All notifications cleared', deleted: this.changes });
    }
  );
});

db.run(`ALTER TABLE messages ADD COLUMN edited INTEGER DEFAULT 0`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding edited column:', err);
  }
});

db.run(`ALTER TABLE messages ADD COLUMN deleted INTEGER DEFAULT 0`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding deleted column:', err);
  }
});
// ==================== CHAT/MESSAGE ROUTES ====================

// Get all messages for a user (either sent or received)
app.get('/messages', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  db.all(
    `SELECT m.*, 
     datetime(m.timestamp) as formatted_timestamp,
     u1.name as sender_name, u1.profile_image as sender_image,
     u2.name as receiver_name, u2.profile_image as receiver_image
     FROM messages m
     LEFT JOIN users u1 ON m.sender_id = u1.id
     LEFT JOIN users u2 ON m.receiver_id = u2.id
     WHERE m.sender_id = ? OR m.receiver_id = ? OR m.receiver_id IS NULL
     ORDER BY m.timestamp DESC`,
    [userId, userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Format the timestamps properly
      const messages = rows.map(row => ({
        ...row,
        timestamp: row.formatted_timestamp ? row.formatted_timestamp + 'Z' : row.timestamp
      }));
      
      res.json(messages);
    }
  );
});

// Get conversation between two users
app.get('/messages/conversation/:otherUserId', verifyToken, (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;
  
  db.all(
    `SELECT m.*, 
     datetime(m.timestamp) as formatted_timestamp,
     u1.name as sender_name, u1.profile_image as sender_image,
     u2.name as receiver_name, u2.profile_image as receiver_image
     FROM messages m
     LEFT JOIN users u1 ON m.sender_id = u1.id
     LEFT JOIN users u2 ON m.receiver_id = u2.id
     WHERE (m.sender_id = ? AND m.receiver_id = ?) 
        OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.timestamp ASC`,
    [userId, otherUserId, otherUserId, userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching conversation:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Format the timestamps properly
      const messages = rows.map(row => ({
        ...row,
        timestamp: row.formatted_timestamp ? row.formatted_timestamp + 'Z' : row.timestamp
      }));
      
      res.json(messages);
    }
  );
});

// Send a message
app.post('/messages', verifyToken, (req, res) => {
  const { receiver_id, message } = req.body;
  const sender_id = req.user.id;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }
  
  db.run(
    'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
    [sender_id, receiver_id || null, message.trim()],
    function(err) {
      if (err) {
        console.error('Error sending message:', err);
        return res.status(500).json({ error: 'Error sending message' });
      }
      
      // Get the complete message data with user info
      db.get(
        `SELECT m.*, 
         datetime(m.timestamp) as formatted_timestamp,
         u1.name as sender_name, u1.profile_image as sender_image,
         u2.name as receiver_name, u2.profile_image as receiver_image
         FROM messages m
         LEFT JOIN users u1 ON m.sender_id = u1.id
         LEFT JOIN users u2 ON m.receiver_id = u2.id
         WHERE m.id = ?`,
        [this.lastID],
        (selectErr, row) => {
          if (selectErr) {
            console.error('Error fetching sent message:', selectErr);
            return res.status(500).json({ error: 'Message sent but error fetching data' });
          }
          
          // Format timestamp properly
          const formattedRow = {
            ...row,
            timestamp: row.formatted_timestamp ? row.formatted_timestamp + 'Z' : row.timestamp
          };
          
          res.json(formattedRow);
        }
      );
    }
  );
});;

// Mark message as read
app.put('/messages/:id/read', verifyToken, (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  
  db.run(
    'UPDATE messages SET read = 1 WHERE id = ? AND receiver_id = ?',
    [messageId, userId],
    function(err) {
      if (err) {
        console.error('Error marking message as read:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Message marked as read' });
    }
  );
});

// Mark all messages from a specific user as read
app.put('/messages/conversation/:otherUserId/read-all', verifyToken, (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;
  
  db.run(
    'UPDATE messages SET read = 1 WHERE sender_id = ? AND receiver_id = ? AND read = 0',
    [otherUserId, userId],
    function(err) {
      if (err) {
        console.error('Error marking messages as read:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Messages marked as read', updated: this.changes });
    }
  );
});

// Edit message (only sender can edit their own messages)
app.put('/messages/:id', verifyToken, (req, res) => {
  const { message } = req.body;
  const messageId = req.params.id;
  const userId = req.user.id;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }
  
  db.run(
    'UPDATE messages SET message = ?, edited = 1 WHERE id = ? AND sender_id = ?',
    [message.trim(), messageId, userId],
    function(err) {
      if (err) {
        console.error('Error editing message:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Message not found or unauthorized' });
      }
      res.json({ message: 'Message edited successfully' });
    }
  );
});

// Soft delete message (only sender can delete their own messages)
app.put('/messages/:id/delete', verifyToken, (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  
  db.run(
    'UPDATE messages SET message = ?, deleted = 1 WHERE id = ? AND sender_id = ?',
    ['[This message has been deleted]', messageId, userId],
    function(err) {
      if (err) {
        console.error('Error deleting message:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Message not found or unauthorized' });
      }
      res.json({ message: 'Message deleted successfully' });
    }
  );
});

// Hard delete message (admin only or for message requests)
app.delete('/messages/:id', verifyToken, (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  
  // Allow admin or sender to hard delete
  if (req.user.userType === 'admin') {
    db.run('DELETE FROM messages WHERE id = ?', [messageId], function(err) {
      if (err) {
        console.error('Error deleting message:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }
      res.json({ message: 'Message deleted permanently' });
    });
  } else {
    db.run(
      'DELETE FROM messages WHERE id = ? AND sender_id = ?',
      [messageId, userId],
      function(err) {
        if (err) {
          console.error('Error deleting message:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Message not found or unauthorized' });
        }
        res.json({ message: 'Message deleted permanently' });
      }
    );
  }
});

// Get unread message count
app.get('/messages/unread/count', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  db.get(
    'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND read = 0',
    [userId],
    (err, row) => {
      if (err) {
        console.error('Error fetching unread count:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ unreadCount: row.count });
    }
  );
});

// Public endpoint to search users (for chat contacts)
app.get('/users/search', verifyToken, (req, res) => {
  const currentUserId = req.user.id;
  
  db.all(
    'SELECT id, name, email, userType, profile_image FROM users WHERE id != ?',
    [currentUserId],
    (err, rows) => {
      if (err) {
        console.error('Database error fetching users for search:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});
// ==================== STATIC FILES & CATCH-ALL ROUTE ====================

// In production, serve static files from the React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Handle React routing - return all non-API requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// ==================== START SERVER ====================
app.listen(3001, () => {
  console.log('🚀 Server running on port 3001');
  console.log('🔒 JWT Authentication enabled');
  console.log('📁 File upload enabled');
  console.log('💬 Chat system enabled');
});