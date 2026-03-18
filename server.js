const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cloudinary = require('cloudinary').v2;

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://lamunshenaniggers.vercel.app",
  "https://lamunshenanigger.vercel.app",
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// CORS middleware configuration - FIXED
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins in development - change to false in production
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Handle preflight requests for all routes - MUST BE BEFORE OTHER MIDDLEWARE
app.options('*', cors(corsOptions));

// Apply CORS middleware - MUST BE BEFORE ROUTES
app.use(cors(corsOptions));

// Additional CORS headers middleware for extra safety
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Make io accessible to routes
app.set('io', io);

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

connectDB();

// Import Models (from backend/models folder)
const { User, Message, Group, Sticker, Call } = require('./backend/models');

// Import Middleware (from backend/middleware folder)
const { authMiddleware } = require('./backend/middleware/auth');

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, displayName, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create new user
    const user = new User({
      username,
      displayName: displayName || username,
      password
    });

    await user.save();

    const { generateToken } = require('./backend/middleware/auth');
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update status
    user.status = 'online';
    await user.save();

    const { generateToken } = require('./backend/middleware/auth');
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        displayName: req.user.displayName,
        avatar: req.user.avatar,
        status: req.user.status,
        contacts: req.user.contacts,
        blockedUsers: req.user.blockedUsers,
        groups: req.user.groups
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== USER ROUTES ====================

// Search users
app.get('/api/users/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { displayName: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('-password');

    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID
app.get('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add contact
app.post('/api/users/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const contactId = req.params.id;
    
    if (req.user.contacts.includes(contactId)) {
      return res.status(400).json({ error: 'Already in contacts' });
    }

    req.user.contacts.push(contactId);
    await req.user.save();

    res.json({ message: 'Contact added successfully' });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get contacts
app.get('/api/users/contacts/list', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('contacts', '-password')
      .select('contacts');
    
    res.json(user.contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
app.put('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    const { displayName, avatar, status } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (displayName) user.displayName = displayName;
    if (avatar) user.avatar = avatar;
    if (status) user.status = status;
    
    await user.save();
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== MESSAGE ROUTES ====================

// Get messages between users
app.get('/api/messages/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user._id }
      ],
      group: null
    })
      .populate('sender', 'username displayName avatar')
      .populate('recipient', 'username displayName avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
app.post('/api/messages', authMiddleware, async (req, res) => {
  try {
    const { recipient, content, type, mediaUrl, mediaThumbnail, fileName, fileSize, duration, replyTo } = req.body;

    const message = new Message({
      sender: req.user._id,
      recipient,
      content,
      type: type || 'text',
      mediaUrl,
      mediaThumbnail,
      fileName,
      fileSize,
      duration,
      replyTo
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username displayName avatar')
      .populate('recipient', 'username displayName avatar');

    // Emit to recipient via socket
    const recipientUser = await User.findById(recipient);
    if (recipientUser && recipientUser.socketId) {
      io.to(recipientUser.socketId).emit('new_message', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark messages as read
app.put('/api/messages/read/:userId', authMiddleware, async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.userId, recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete message
app.delete('/api/messages/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== GROUP ROUTES ====================

// Create group
app.post('/api/groups', authMiddleware, async (req, res) => {
  try {
    const { name, description, avatar, members } = req.body;

    const group = new Group({
      name,
      description,
      avatar,
      creator: req.user._id,
      members: [req.user._id, ...(members || [])],
      admins: [req.user._id]
    });

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'username displayName avatar')
      .populate('creator', 'username displayName avatar');

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's groups
app.get('/api/groups', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'username displayName avatar')
      .populate('creator', 'username displayName avatar');

    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get group messages
app.get('/api/groups/:id/messages', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group || !group.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const messages = await Message.find({ group: req.params.id })
      .populate('sender', 'username displayName avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send group message
app.post('/api/groups/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { content, type, mediaUrl } = req.body;
    const groupId = req.params.id;

    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(req.user._id)) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const message = new Message({
      sender: req.user._id,
      group: groupId,
      content,
      type: type || 'text',
      mediaUrl
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username displayName avatar');

    // Emit to all group members
    group.members.forEach(async (memberId) => {
      const member = await User.findById(memberId);
      if (member && member.socketId && memberId.toString() !== req.user._id.toString()) {
        io.to(member.socketId).emit('new_group_message', populatedMessage);
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== STICKER ROUTES ====================

// Get all stickers
app.get('/api/stickers', authMiddleware, async (req, res) => {
  try {
    const stickers = await Sticker.find();
    res.json(stickers);
  } catch (error) {
    console.error('Get stickers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get stickers by category
app.get('/api/stickers/category/:category', authMiddleware, async (req, res) => {
  try {
    const stickers = await Sticker.find({ category: req.params.category });
    res.json(stickers);
  } catch (error) {
    console.error('Get stickers by category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== CALL ROUTES ====================

// Get call history
app.get('/api/calls', authMiddleware, async (req, res) => {
  try {
    const calls = await Call.find({
      $or: [
        { caller: req.user._id },
        { recipient: req.user._id }
      ]
    })
      .populate('caller', 'username displayName avatar')
      .populate('recipient', 'username displayName avatar')
      .sort({ createdAt: -1 });

    res.json(calls);
  } catch (error) {
    console.error('Get calls error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== SOCKET.IO ====================

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User comes online
  socket.on('user_online', async (userId) => {
    try {
      onlineUsers.set(userId, socket.id);
      
      await User.findByIdAndUpdate(userId, {
        status: 'online',
        socketId: socket.id
      });

      // Notify contacts
      const user = await User.findById(userId).populate('contacts');
      if (user) {
        user.contacts.forEach(contact => {
          if (contact.socketId) {
            io.to(contact.socketId).emit('user_status_change', { userId, status: 'online' });
          }
        });
      }
    } catch (error) {
      console.error('User online error:', error);
    }
  });

  // Join user room for direct messages
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
  });

  // Join group room
  socket.on('join_group', (groupId) => {
    socket.join(`group_${groupId}`);
  });

  // Leave group room
  socket.on('leave_group', (groupId) => {
    socket.leave(`group_${groupId}`);
  });

  // Typing indicator
  socket.on('typing', ({ recipientId, isTyping }) => {
    socket.to(`user_${recipientId}`).emit('user_typing', {
      userId: socket.userId,
      isTyping
    });
  });

  // Call signaling
  socket.on('call_offer', ({ recipientId, offer, type }) => {
    socket.to(`user_${recipientId}`).emit('incoming_call', {
      callerId: socket.userId,
      offer,
      type
    });
  });

  socket.on('call_answer', ({ callerId, answer }) => {
    socket.to(`user_${callerId}`).emit('call_answered', {
      answer
    });
  });

  socket.on('ice_candidate', ({ recipientId, candidate }) => {
    socket.to(`user_${recipientId}`).emit('ice_candidate', {
      candidate
    });
  });

  socket.on('end_call', ({ recipientId }) => {
    socket.to(`user_${recipientId}`).emit('call_ended');
  });

  // Disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    try {
      // Find user by socket ID
      const user = await User.findOne({ socketId: socket.id });
      if (user) {
        user.status = 'offline';
        user.lastSeen = new Date();
        user.socketId = null;
        await user.save();

        // Notify contacts
        user.contacts.forEach(contactId => {
          const contactSocketId = onlineUsers.get(contactId.toString());
          if (contactSocketId) {
            io.to(contactSocketId).emit('user_status_change', { 
              userId: user._id, 
              status: 'offline',
              lastSeen: user.lastSeen
            });
          }
        });

        onlineUsers.delete(user._id.toString());
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});