// server.js - Updated with JWT Authentication, Progress Storage, Profile Image Upload, and Chat
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
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
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Store online users (userId -> socketId mapping) for real-time features
const onlineUsers = new Map();

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

db.run(`CREATE TABLE IF NOT EXISTS contact_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'removed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id),
  UNIQUE(sender_id, receiver_id)
)`,(err) => {
  if (err && !err.message.includes('already exists')) {
    console.error('Error creating contact_requests table:', err);
  }
}); 

// Migrate contact_requests table to add 'removed' status to CHECK constraint
db.serialize(() => {
  db.run(`INSERT INTO contact_requests (sender_id, receiver_id, status) VALUES (0, 0, 'removed')`, (err) => {
    if (err && err.code === 'SQLITE_CONSTRAINT') {
      console.log('🔄 Migrating contact_requests table to support "removed" status...');
      
      db.run(`CREATE TABLE contact_requests_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'removed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (receiver_id) REFERENCES users(id),
        UNIQUE(sender_id, receiver_id)
      )`, (createErr) => {
        if (createErr) {
          console.error('Error creating new contact_requests table:', createErr);
          return;
        }
        
        db.run(`INSERT INTO contact_requests_new (id, sender_id, receiver_id, status, created_at)
                SELECT id, sender_id, receiver_id, status, created_at FROM contact_requests`, (copyErr) => {
          if (copyErr) {
            console.error('Error copying data to new table:', copyErr);
            return;
          }
          
          db.run(`DROP TABLE contact_requests`, (dropErr) => {
            if (dropErr) {
              console.error('Error dropping old table:', dropErr);
              return;
            }
            
            db.run(`ALTER TABLE contact_requests_new RENAME TO contact_requests`, (renameErr) => {
              if (renameErr) {
                console.error('Error renaming table:', renameErr);
                return;
              }
              
              console.log('✅ Successfully migrated contact_requests table');
            });
          });
        });
      });
    } else {
      db.run(`DELETE FROM contact_requests WHERE sender_id = 0 AND receiver_id = 0`);
    }
  });
});

db.run(`CREATE TABLE IF NOT EXISTS blocked_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  blocked_user_id INTEGER NOT NULL,
  blocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, blocked_user_id)
)`,(err) => {
  if (err && !err.message.includes('already exists')) {
    console.error('Error creating blocked_users table:', err);
  } else if (!err) {
    console.log('✅ blocked_users table created');
  }
});

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

db.run(`ALTER TABLE messages ADD COLUMN edited INTEGER DEFAULT 0`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding edited column:', err);
  } else if (!err) {
    console.log('✅ Edited column added to messages table');
  }
});

db.run(`ALTER TABLE messages ADD COLUMN deleted INTEGER DEFAULT 0`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding deleted column:', err);
  } else if (!err) {
    console.log('✅ Deleted column added to messages table');
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

  if (req.user.id !== parseInt(id) && req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Permission denied' });
  }

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

  if (req.user.id === parseInt(id)) {
    return res.status(403).json({ 
      error: 'You cannot delete your own account' 
    });
  }

  db.get('SELECT profile_image FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Error fetching user data' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.profile_image) {
      const imagePath = path.join(__dirname, 'uploads', 'profiles', path.basename(user.profile_image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('✅ Deleted profile image:', imagePath);
      }
    }

    db.serialize(() => {
      db.run('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [id, id], (err) => {
        if (err) console.error('Error deleting messages:', err);
        else console.log('✅ Deleted all messages for user:', id);
      });

      db.run('DELETE FROM contact_requests WHERE sender_id = ? OR receiver_id = ?', [id, id], (err) => {
        if (err) console.error('Error deleting contact requests:', err);
        else console.log('✅ Deleted all contact requests for user:', id);
      });

      db.run('DELETE FROM notifications WHERE user_id = ?', [id], (err) => {
        if (err) console.error('Error deleting notifications:', err);
        else console.log('✅ Deleted all notifications for user:', id);
      });

      db.run('DELETE FROM refresh_tokens WHERE user_id = ?', [id], (err) => {
        if (err) console.error('Error deleting refresh tokens:', err);
        else console.log('✅ Deleted all refresh tokens for user:', id);
      });

      db.all('SELECT id, assignees FROM tasks', [], (err, tasks) => {
        if (err) {
          console.error('Error fetching tasks:', err);
        } else {
          tasks.forEach(task => {
            if (task.assignees) {
              try {
                const assignees = JSON.parse(task.assignees);
                const updatedAssignees = assignees.filter(assigneeId => assigneeId !== parseInt(id));
                
                if (assignees.length !== updatedAssignees.length) {
                  db.run(
                    'UPDATE tasks SET assignees = ? WHERE id = ?',
                    [JSON.stringify(updatedAssignees), task.id],
                    (err) => {
                      if (err) console.error('Error updating task assignees:', err);
                      else console.log(`✅ Removed user ${id} from task ${task.id}`);
                    }
                  );
                }
              } catch (e) {
                console.error('Error parsing task assignees:', e);
              }
            }
          });
        }
      });

      db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: 'Error deleting user' });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        
        console.log('✅ User deleted successfully:', id);
        res.json({ 
          message: 'User and all related data deleted permanently', 
          id,
          deletedData: {
            user: true,
            profileImage: !!user.profile_image,
            messages: true,
            contactRequests: true,
            notifications: true,
            refreshTokens: true,
            taskAssignments: true
          }
        });
      });
    });
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
  db.all('SELECT * FROM tasks ORDER BY id DESC', [], (err, rows) => {
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
    db.get('SELECT deadline, completed FROM tasks WHERE id = ?', [id], (err, task) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
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

// ==================== CHAT/MESSAGE ROUTES ====================

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
      
      const messages = rows.map(row => ({
        ...row,
        timestamp: row.formatted_timestamp ? row.formatted_timestamp + 'Z' : row.timestamp
      }));
      
      res.json(messages);
    }
  );
});

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
      
      const messages = rows.map(row => ({
        ...row,
        timestamp: row.formatted_timestamp ? row.formatted_timestamp + 'Z' : row.timestamp
      }));
      
      res.json(messages);
    }
  );
});

app.delete('/messages/:id', verifyToken, (req, res) => {
  const messageId = req.params.id;
  const userId = req.user.id;
  
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

// ==================== CONTACT REQUESTS API ====================

app.post('/contact-requests', verifyToken, (req, res) => {
  const senderId = req.user.id;
  const { receiver_id } = req.body;

  if (!receiver_id) {
    return res.status(400).json({ error: 'Receiver ID is required' });
  }

  if (senderId === receiver_id) {
    return res.status(400).json({ error: 'Cannot send request to yourself' });
  }

  db.get('SELECT id FROM users WHERE id = ?', [receiver_id], (err, user) => {
    if (err) {
      console.error('Error checking receiver:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    db.get(
      'SELECT * FROM contact_requests WHERE sender_id = ? AND receiver_id = ?',
      [senderId, receiver_id],
      (err, existingRequest) => {
        if (err) {
          console.error('Error checking existing request:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (existingRequest) {
          if (existingRequest.status === 'pending') {
            return res.status(409).json({ error: 'Contact request already sent' });
          } else if (existingRequest.status === 'accepted') {
            return res.status(409).json({ error: 'Already contacts' });
          } else {
            db.run(
              'UPDATE contact_requests SET status = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?',
              ['pending', existingRequest.id],
              function(err) {
                if (err) {
                  console.error('Error updating contact request:', err);
                  return res.status(500).json({ error: 'Database error' });
                }
                return res.status(201).json({ 
                  message: 'Contact request resent successfully',
                  id: existingRequest.id,
                  sender_id: senderId,
                  receiver_id: receiver_id,
                  status: 'pending'
                });
              }
            );
          }
        } else {
          db.run(
            'INSERT INTO contact_requests (sender_id, receiver_id, status) VALUES (?, ?, ?)',
            [senderId, receiver_id, 'pending'],
            function(err) {
              if (err) {
                console.error('Error creating contact request:', err);
                return res.status(500).json({ error: 'Database error' });
              }
              res.status(201).json({ 
                message: 'Contact request sent successfully',
                id: this.lastID,
                sender_id: senderId,
                receiver_id: receiver_id,
                status: 'pending'
              });
            }
          );
        }
      }
    );
  });
});

app.get('/contact-requests', verifyToken, (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  let query = `
    SELECT cr.*, 
           u.name as sender_name, 
           u.email as sender_email, 
           u.profile_image as sender_image,
           datetime(cr.created_at) as formatted_created_at
    FROM contact_requests cr
    JOIN users u ON cr.sender_id = u.id
    WHERE cr.receiver_id = ?
  `;
  const params = [userId];

  if (status) {
    query += ' AND cr.status = ?';
    params.push(status);
  }

  query += ' ORDER BY cr.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching contact requests:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const requests = rows.map(row => ({
      ...row,
      created_at: row.formatted_created_at ? row.formatted_created_at + 'Z' : row.created_at
    }));

    res.json(requests);
  });
});

app.get('/contact-requests/sent', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT cr.*, 
            u.name as receiver_name, 
            u.email as receiver_email, 
            u.profile_image as receiver_image,
            datetime(cr.created_at) as formatted_created_at
     FROM contact_requests cr
     JOIN users u ON cr.receiver_id = u.id
     WHERE cr.sender_id = ?
     ORDER BY cr.created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching sent contact requests:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const requests = rows.map(row => ({
        ...row,
        created_at: row.formatted_created_at ? row.formatted_created_at + 'Z' : row.created_at
      }));

      res.json(requests);
    }
  );
});

app.get('/contact-requests/removed', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT DISTINCT 
       CASE 
         WHEN sender_id = ? THEN receiver_id 
         ELSE sender_id 
       END as user_id
     FROM contact_requests
     WHERE status = 'removed'
     AND (sender_id = ? OR receiver_id = ?)`,
    [userId, userId, userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching removed contacts:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const removedUserIds = rows.map(row => row.user_id);
      res.json(removedUserIds);
    }
  );
});

app.patch('/contact-requests/:id', verifyToken, (req, res) => {
  const requestId = req.params.id;
  const userId = req.user.id;
  const { status } = req.body;

  if (!status || !['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Status must be "accepted" or "declined"' });
  }

  db.get(
    'SELECT * FROM contact_requests WHERE id = ? AND receiver_id = ?',
    [requestId, userId],
    (err, request) => {
      if (err) {
        console.error('Error fetching contact request:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!request) {
        return res.status(404).json({ error: 'Contact request not found or unauthorized' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Request already processed' });
      }

      db.run(
        'UPDATE contact_requests SET status = ? WHERE id = ?',
        [status, requestId],
        function(err) {
          if (err) {
            console.error('Error updating contact request:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          if (status === 'accepted') {
            console.log(`📬 Contact request accepted: User ${userId} accepted request from User ${request.sender_id}`);
            
            // Notify BOTH users via Socket.IO
            const senderSocketId = onlineUsers.get(request.sender_id);
            const accepterSocketId = onlineUsers.get(userId);
            
            console.log(`🔍 Sender (User ${request.sender_id}) socket ID:`, senderSocketId);
            console.log(`🔍 Accepter (User ${userId}) socket ID:`, accepterSocketId);
            
            // Notify the sender (who sent the request)
            if (senderSocketId) {
              io.to(senderSocketId).emit('contact_request_approved', {
                approvedBy: userId,
                receiverId: request.sender_id,
                timestamp: new Date().toISOString()
              });
              console.log(`✅ Emitted contact_request_approved to sender (User ${request.sender_id})`);
            } else {
              console.log(`⚠️ Sender (User ${request.sender_id}) is offline`);
            }
            
            // Notify the accepter (who accepted the request)
            if (accepterSocketId) {
              io.to(accepterSocketId).emit('contact_request_approved', {
                approvedBy: userId,
                receiverId: request.sender_id,
                timestamp: new Date().toISOString()
              });
              console.log(`✅ Emitted contact_request_approved to accepter (User ${userId})`);
            } else {
              console.log(`⚠️ Accepter (User ${userId}) is offline`);
            }
          } else if (status === 'declined') {
            console.log(`📪 Contact request declined: User ${userId} declined request from User ${request.sender_id}`);
            
            const senderSocketId = onlineUsers.get(request.sender_id);
            console.log(`🔍 Sender (User ${request.sender_id}) socket ID:`, senderSocketId);
            if (senderSocketId) {
              io.to(senderSocketId).emit('contact_request_declined_confirmed', {
                requestId: requestId,
                declinedBy: userId,
                senderId: request.sender_id,
                timestamp: new Date().toISOString()
              });
              console.log(`✅ Emitted contact_request_declined_confirmed to sender (User ${request.sender_id})`);
            } else {
              console.log(`⚠️ Sender (User ${request.sender_id}) is offline`);
            }
          }

          res.json({ 
            message: `Contact request ${status} successfully`,
            id: requestId,
            status: status,
            sender_id: request.sender_id
          });
        }
      );
    }
  );
});

app.delete('/contact-requests/:id', verifyToken, (req, res) => {
  const requestId = req.params.id;
  const userId = req.user.id;

  db.run(
    'DELETE FROM contact_requests WHERE id = ? AND (sender_id = ? OR receiver_id = ?)',
    [requestId, userId, userId],
    function(err) {
      if (err) {
        console.error('Error deleting contact request:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Contact request not found or unauthorized' });
      }

      res.json({ message: 'Contact request deleted successfully' });
    }
  );
});

app.get('/contacts', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT DISTINCT u.id, u.name, u.email, u.profile_image, u.userType
     FROM users u
     WHERE u.id IN (
       SELECT sender_id FROM contact_requests 
       WHERE receiver_id = ? AND status = 'accepted'
       UNION
       SELECT receiver_id FROM contact_requests 
       WHERE sender_id = ? AND status = 'accepted'
     )
     ORDER BY u.name`,
    [userId, userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching contacts:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

app.delete('/contacts/:contactId', verifyToken, (req, res) => {
  const userId = req.user.id;
  const contactId = parseInt(req.params.contactId);

  db.run(
    `UPDATE contact_requests 
     SET status = 'removed'
     WHERE status = 'accepted' 
     AND ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))`,
    [userId, contactId, contactId, userId],
    function(err) {
      if (err) {
        console.error('Error removing contact:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      console.log(`👋 Contact removed: User ${userId} removed User ${contactId}`);

      const contactSocketId = onlineUsers.get(contactId);
      console.log(`🔍 Removed user (User ${contactId}) socket ID:`, contactSocketId);
      if (contactSocketId) {
        io.to(contactSocketId).emit('contact_removed', {
          removedBy: userId,
          timestamp: new Date().toISOString()
        });
        console.log(`✅ Emitted contact_removed to User ${contactId}`);
      } else {
        console.log(`⚠️ Removed user (User ${contactId}) is offline`);
      }

      res.json({ 
        message: 'Contact removed successfully',
        removed_contact_id: contactId
      });
    }
  );
});

app.get('/blocked-users', verifyToken, (req, res) => {
  const userId = req.user.id;
  db.all(
    `SELECT u.id, u.name, u.email, u.profile_image, u.userType, b.blocked_at
     FROM blocked_users b
     JOIN users u ON b.blocked_user_id = u.id
     WHERE b.user_id = ?
     ORDER BY b.blocked_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching blocked users:', err);
        return res.status(500).json({ error: 'Failed to fetch blocked users' });
      }
      res.json(rows || []);
    }
  );
});

app.get('/blocked-by-others', verifyToken, (req, res) => {
  const userId = req.user.id;
  db.all(
    `SELECT u.id, u.name, u.email, u.profile_image, u.userType, b.blocked_at
     FROM blocked_users b
     JOIN users u ON b.user_id = u.id
     WHERE b.blocked_user_id = ?
     ORDER BY b.blocked_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching users who blocked current user:', err);
        return res.status(500).json({ error: 'Failed to fetch users who blocked you' });
      }
      res.json(rows || []);
    }
  );
});

app.get('/is-blocked/:userId', verifyToken, (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = parseInt(req.params.userId);
  
  db.get(
    `SELECT 1 FROM blocked_users 
     WHERE (user_id = ? AND blocked_user_id = ?) 
        OR (user_id = ? AND blocked_user_id = ?)`,
    [currentUserId, targetUserId, targetUserId, currentUserId],
    (err, row) => {
      if (err) {
        console.error('Error checking block status:', err);
        return res.status(500).json({ error: 'Failed to check block status' });
      }
      res.json({ isBlocked: !!row });
    }
  );
});

// ==================== SOCKET.IO REAL-TIME MESSAGING ====================

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: Token required' ));
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.userId = decoded.id;
    socket.userEmail = decoded.email;
    next();
  });
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`✅ User connected: ${userId} (Socket ID: ${socket.id})`);
  
  onlineUsers.set(userId, socket.id);
  console.log(`📊 Online users: ${Array.from(onlineUsers.keys()).join(', ')}`);
  
  io.emit('user_online', { userId, socketId: socket.id });
  
  socket.emit('online_users', Array.from(onlineUsers.keys()));

  socket.join(`user_${userId}`);

  // Handle get_all_users (Socket.IO version of /users/search)
  socket.on('get_all_users', () => {
    db.all(
      'SELECT id, name, email, userType, profile_image FROM users WHERE id != ?',
      [userId],
      (err, rows) => {
        if (err) {
          console.error('Database error fetching users for get_all_users:', err);
          socket.emit('all_users', { error: 'Database error', users: [] });
        } else {
          socket.emit('all_users', { users: rows });
        }
      }
    );
  });

  // Handle get_contacts (Socket.IO version of /contacts)
  socket.on('get_contacts', () => {
    db.all(
      `SELECT DISTINCT u.id, u.name, u.email, u.profile_image, u.userType
       FROM users u
       WHERE u.id IN (
         SELECT sender_id FROM contact_requests 
         WHERE receiver_id = ? AND status = 'accepted'
         UNION
         SELECT receiver_id FROM contact_requests 
         WHERE sender_id = ? AND status = 'accepted'
       )
       ORDER BY u.name`,
      [userId, userId],
      (err, rows) => {
        if (err) {
          console.error('Database error fetching contacts for get_contacts:', err);
          socket.emit('contacts', { error: 'Database error', contacts: [] });
        } else {
          socket.emit('contacts', { contacts: rows });
        }
      }
    );
  });

  // Handle get_waiting_messages (Socket.IO version of waiting tab logic)
  socket.on('get_waiting_messages', async () => {
    try {
      // Fetch contacts
      const contacts = await new Promise((resolve, reject) => {
        db.all(
          `SELECT DISTINCT u.id FROM users u
           WHERE u.id IN (
             SELECT sender_id FROM contact_requests 
             WHERE receiver_id = ? AND status = 'accepted'
             UNION
             SELECT receiver_id FROM contact_requests 
             WHERE sender_id = ? AND status = 'accepted'
           )`,
          [userId, userId],
          (err, rows) => err ? reject(err) : resolve(rows.map(r => r.id))
        );
      });

      // Sent requests
      const sentRequests = await new Promise((resolve, reject) => {
        db.all(
          `SELECT receiver_id FROM contact_requests WHERE sender_id = ? AND status = 'pending'`,
          [userId],
          (err, rows) => err ? reject(err) : resolve(rows.map(r => r.receiver_id))
        );
      });

      // Received requests
      const receivedRequests = await new Promise((resolve, reject) => {
        db.all(
          `SELECT sender_id FROM contact_requests WHERE receiver_id = ? AND status = 'pending'`,
          [userId],
          (err, rows) => err ? reject(err) : resolve(rows.map(r => r.sender_id))
        );
      });

      // Blocked users
      const blockedUsers = await new Promise((resolve, reject) => {
        db.all(
          `SELECT blocked_user_id FROM blocked_users WHERE user_id = ?`,
          [userId],
          (err, rows) => err ? reject(err) : resolve(rows.map(r => r.blocked_user_id))
        );
      });

      // All messages
      const allMessages = await new Promise((resolve, reject) => {
        db.all(
          `SELECT m.*, u.name as sender_name, u.profile_image as sender_image
           FROM messages m
           LEFT JOIN users u ON m.sender_id = u.id
           WHERE m.sender_id = ? OR m.receiver_id = ? OR m.receiver_id IS NULL`,
          [userId, userId],
          (err, rows) => err ? reject(err) : resolve(rows)
        );
      });

      // Build waiting messages
      const waitingMap = new Map();
      const lastMessageByUser = new Map();
      allMessages.forEach(msg => {
        if ((msg.sender_id === userId && msg.receiver_id !== userId) ||
            (msg.receiver_id === userId && msg.sender_id !== userId)) {
          const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
          if (!lastMessageByUser.has(otherUserId) ||
              new Date(msg.timestamp) > new Date(lastMessageByUser.get(otherUserId).timestamp)) {
            lastMessageByUser.set(otherUserId, msg);
          }
        }
      });
      allMessages.forEach(msg => {
        if (msg.receiver_id === userId &&
            msg.sender_id !== userId &&
            !contacts.includes(msg.sender_id) &&
            !receivedRequests.includes(msg.sender_id) &&
            !sentRequests.includes(msg.sender_id) &&
            !blockedUsers.includes(msg.sender_id)) {
          const lastMsg = lastMessageByUser.get(msg.sender_id);
          if (lastMsg && lastMsg.sender_id === msg.sender_id && !waitingMap.has(msg.sender_id)) {
            waitingMap.set(msg.sender_id, {
              userId: msg.sender_id,
              userName: msg.sender_name,
              userImage: msg.sender_image,
              lastMessage: lastMsg.message,
              timestamp: lastMsg.timestamp,
              unreadCount: allMessages.filter(m =>
                m.sender_id === msg.sender_id &&
                m.receiver_id === userId &&
                m.read === 0
              ).length
            });
          }
        }
      });
      const validWaitingMessages = Array.from(waitingMap.values()).filter(
        msg => msg.userName !== null && msg.userName !== undefined
      );
      socket.emit('waiting_messages', { waitingMessages: validWaitingMessages });
    } catch (error) {
      console.error('Error fetching waiting messages (Socket.IO):', error);
      socket.emit('waiting_messages', { waitingMessages: [] });
    }
  });

  // Handle get_messages (Socket.IO version of /messages/conversation/:otherUserId)
  socket.on('get_messages', (otherUserId) => {
    if (!otherUserId) {
      socket.emit('messages', { messages: [] });
      return;
    }
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
          console.error('Database error fetching messages for get_messages:', err);
          socket.emit('messages', { error: 'Database error', messages: [] });
        } else {
          const messages = rows.map(row => ({
            ...row,
            timestamp: row.formatted_timestamp ? row.formatted_timestamp + 'Z' : row.timestamp
          }));
          socket.emit('messages', { messages });
        }
      }
    );
  });

  // Handle get_sent_requests (Socket.IO version of /contact-requests/sent)
  socket.on('get_sent_requests', () => {
    db.all(
      `SELECT cr.*, 
              u.name as receiver_name, 
              u.email as receiver_email, 
              u.profile_image as receiver_image,
              datetime(cr.created_at) as formatted_created_at
       FROM contact_requests cr
       JOIN users u ON cr.receiver_id = u.id
       WHERE cr.sender_id = ?
       ORDER BY cr.created_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('Database error fetching sent contact requests for get_sent_requests:', err);
          socket.emit('sent_requests', { error: 'Database error', sentRequests: [] });
        } else {
          socket.emit('sent_requests', { sentRequests: rows });
        }
      }
    );
  });
  // Handle get_contact_requests (Socket.IO version of /contact-requests)
  socket.on('get_contact_requests', () => {
    const status = 'pending';
    
    db.all(
      `SELECT cr.*, 
              u.name as sender_name, 
              u.email as sender_email, 
              u.profile_image as sender_image,
              datetime(cr.created_at) as formatted_created_at
       FROM contact_requests cr
       JOIN users u ON cr.sender_id = u.id
       WHERE cr.receiver_id = ? AND cr.status = ?
       ORDER BY cr.created_at DESC`,
      [userId, status],
      (err, rows) => {
        if (err) {
          console.error('Database error fetching contact requests for get_contact_requests:', err);
          socket.emit('contact_requests', { error: 'Database error', contactRequests: [] });
        } else {
          const requests = rows.map(row => ({
            ...row,
            created_at: row.formatted_created_at ? row.formatted_created_at + 'Z' : row.created_at
          }));
          socket.emit('contact_requests', { contactRequests: requests });
        }
      }
    );
  });

  // Handle get_blocked_users (Socket.IO version of /blocked-users)
  socket.on('get_blocked_users', () => {
    db.all(
      `SELECT u.id, u.name, u.email, u.profile_image, u.userType, b.blocked_at
       FROM blocked_users b
       JOIN users u ON b.blocked_user_id = u.id
       WHERE b.user_id = ?
       ORDER BY b.blocked_at DESC`,
      [userId],
      (err, rows) => {
        if (err) {
          console.error('Error fetching blocked users:', err);
          socket.emit('blocked_users', { error: 'Database error', blockedUsers: [] });
        } else {
          socket.emit('blocked_users', { blockedUsers: rows || [] });
        }
      }
    );
  });

  // Handle get_last_messages
  socket.on('get_last_messages', (contactIds) => {
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      socket.emit('last_messages', { lastMessages: {}, unreadCounts: {} });
      return;
    }

    const placeholders = contactIds.map(() => '?').join(',');
    
    db.all(
      `SELECT DISTINCT 
         CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as contact_id,
         message, timestamp, sender_id, receiver_id
       FROM messages
       WHERE (sender_id = ? OR receiver_id = ?)
         AND (sender_id IN (${placeholders}) OR receiver_id IN (${placeholders}))
         AND deleted = 0
       ORDER BY timestamp DESC`,
      [userId, userId, userId, ...contactIds, ...contactIds],
      (err, rows) => {
        if (err) {
          console.error('Error fetching last messages:', err);
          socket.emit('last_messages', { lastMessages: {}, unreadCounts: {} });
          return;
        }

        const lastMessages = {};
        const seen = new Set();
        
        rows.forEach(row => {
          const contactId = row.contact_id;
          if (!seen.has(contactId)) {
            lastMessages[contactId] = row;
            seen.add(contactId);
          }
        });

        db.all(
          `SELECT sender_id, COUNT(*) as count
           FROM messages
           WHERE receiver_id = ? AND read = 0 AND sender_id IN (${placeholders}) AND deleted = 0
           GROUP BY sender_id`,
          [userId, ...contactIds],
          (err, unreadRows) => {
            if (err) {
              console.error('Error fetching unread counts:', err);
              socket.emit('last_messages', { lastMessages, unreadCounts: {} });
              return;
            }

            const unreadCounts = {};
            unreadRows.forEach(row => {
              unreadCounts[row.sender_id] = row.count;
            });

            socket.emit('last_messages', { lastMessages, unreadCounts });
          }
        );
      }
    );
  });

  // Handle new message
  socket.on('send_message', async (data) => {
    const { receiver_id, message } = data;
    
    // Check if either user has blocked the other
    db.get(
      `SELECT 1 FROM blocked_users 
       WHERE (user_id = ? AND blocked_user_id = ?) 
          OR (user_id = ? AND blocked_user_id = ?)`,
      [userId, receiver_id, receiver_id, userId],
      (err, blockedRow) => {
        if (err) {
          console.error('Error checking block status:', err);
          socket.emit('message_error', { error: 'Failed to send message' });
          return;
        }
        
        if (blockedRow) {
          socket.emit('message_error', { error: 'Cannot send message to this user' });
          return;
        }
        
        // Save message to database
        db.run(
          `INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)`,
          [userId, receiver_id, message],
          function(err) {
            if (err) {
              console.error('Error saving message:', err);
              socket.emit('message_error', { error: 'Failed to send message' });
              return;
            }

            const messageId = this.lastID;
        
            // Get sender info
            db.get('SELECT name, profile_image FROM users WHERE id = ?', [userId], (err, sender) => {
              if (err) {
                console.error('Error fetching sender:', err);
                return;
              }

              const messageData = {
                id: messageId,
                sender_id: userId,
                receiver_id,
                message,
                timestamp: new Date().toISOString(),
                read: 0,
                sender_name: sender.name,
                sender_image: sender.profile_image
              };

              // Send to sender for confirmation
              socket.emit('message_sent', messageData);

              // Send to receiver if online
              const receiverSocketId = onlineUsers.get(receiver_id);
              if (receiverSocketId) {
                io.to(receiverSocketId).emit('new_message', messageData);
              }

              // Notify about new message in contacts list
              io.to(`user_${receiver_id}`).emit('message_notification', {
                senderId: userId,
                message: message,
                timestamp: messageData.timestamp
              });
            });
          }
        );
      }
    );
  });

  // Handle message edit
  socket.on('edit_message', async (data) => {
    const { messageId, newMessage } = data;
    
    db.run(
      `UPDATE messages SET message = ?, edited = 1 WHERE id = ? AND sender_id = ?`,
      [newMessage, messageId, userId],
      function(err) {
        if (err) {
          console.error('Error editing message:', err);
          socket.emit('edit_error', { error: 'Failed to edit message' });
          return;
        }

        // Get the message receiver to notify them
        db.get('SELECT receiver_id FROM messages WHERE id = ?', [messageId], (err, row) => {
          if (err || !row) return;

          const updateData = {
            messageId,
            message: newMessage,
            edited: 1
          };

          // Notify both sender and receiver
          socket.emit('message_edited', updateData);
          const receiverSocketId = onlineUsers.get(row.receiver_id);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('message_edited', updateData);
          }
        });
      }
    );
  });

  // Handle message delete
  socket.on('delete_message', async (data) => {
    const { messageId } = data;
    
    db.run(
      `UPDATE messages SET deleted = 1 WHERE id = ? AND sender_id = ?`,
      [messageId, userId],
      function(err) {
        if (err) {
          console.error('Error deleting message:', err);
          socket.emit('delete_error', { error: 'Failed to delete message' });
          return;
        }

        // Get the message receiver to notify them
        db.get('SELECT receiver_id FROM messages WHERE id = ?', [messageId], (err, row) => {
          if (err || !row) return;

          const deleteData = { messageId };

          // Notify both sender and receiver
          socket.emit('message_deleted', deleteData);
          const receiverSocketId = onlineUsers.get(row.receiver_id);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('message_deleted', deleteData);
          }
        });
      }
    );
  });

  // Handle mark as read
  socket.on('mark_read', async (data) => {
    const { senderId } = data;
    
    db.run(
      `UPDATE messages SET read = 1 WHERE sender_id = ? AND receiver_id = ? AND read = 0`,
      [senderId, userId],
      function(err) {
        if (err) {
          console.error('Error marking messages as read:', err);
          return;
        }

        // Notify sender that their messages were read
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read', { readBy: userId });
        }
      }
    );
  });

  // Handle typing indicator
  socket.on('typing_start', (data) => {
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { userId });
    }
  });

  socket.on('typing_stop', (data) => {
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stopped_typing', { userId });
    }
  });

  // Handle contact request
  socket.on('contact_request_sent', (data) => {
    const { receiverId, requestId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('new_contact_request', {
        senderId: userId,
        requestId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle contact request accepted
  socket.on('contact_request_accepted', (data) => {
    const { senderId } = data;
    const senderSocketId = onlineUsers.get(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit('contact_request_approved', {
        approvedBy: userId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle contact request declined
  socket.on('contact_request_declined', (data) => {
    const { requestId } = data;
    socket.emit('contact_request_declined_confirmed', { requestId });
  });

  // Handle waiting message removal
  socket.on('remove_waiting_message', (data) => {
    const { userId: targetUserId } = data;
    socket.emit('waiting_message_removed', { userId: targetUserId });
  });

  // Handle block user
socket.on('block_user', async (data) => {
  const { blockedUserId } = data;
  
  try {
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO blocked_users (user_id, blocked_user_id) VALUES (?, ?)',
        [userId, blockedUserId],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    const blockedUser = await new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, profile_image FROM users WHERE id = ?', [blockedUserId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Notify the blocker (current user)
    socket.emit('user_blocked', { 
      blockedUser,
      message: 'User blocked successfully'
    });

    // Notify the blocked user that they were blocked
    const blockedUserSocketId = onlineUsers.get(blockedUserId);
    if (blockedUserSocketId) {
      io.to(blockedUserSocketId).emit('you_were_blocked', {
        blockedBy: userId,
        timestamp: new Date().toISOString()
      });
      console.log(`✅ Notified User ${blockedUserId} that they were blocked by User ${userId}`);
    }

    console.log(`🚫 User ${userId} blocked user ${blockedUserId}`);
  } catch (error) {
    console.error('Error blocking user:', error);
    socket.emit('block_error', { error: 'Failed to block user' });
  }
});

  // Handle unblock user
  socket.on('unblock_user', async (data) => {
    const { blockedUserId } = data;
    
    try {
      await new Promise((resolve, reject) => {
        db.run(
          'DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?',
          [userId, blockedUserId],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      socket.emit('user_unblocked', { 
        blockedUserId,
        message: 'User unblocked successfully'
      });

      console.log(`✅ User ${userId} unblocked user ${blockedUserId}`);
    } catch (error) {
      console.error('Error unblocking user:', error);
      socket.emit('unblock_error', { error: 'Failed to unblock user' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${userId} (Socket ID: ${socket.id})`);
    onlineUsers.delete(userId);
    
    // Broadcast offline status to all users
    io.emit('user_offline', { userId });
  });
});

// ==================== STATIC FILES & CATCH-ALL ROUTE ====================

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// ==================== START SERVER ====================
httpServer.listen(3001, () => {
  console.log('🚀 Server running on port 3001');
  console.log('🔒 JWT Authentication enabled');
  console.log('📁 File upload enabled');
  console.log('💬 Chat system enabled');
  console.log('⚡ Socket.IO real-time messaging enabled');
});