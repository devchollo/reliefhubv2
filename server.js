// ============================================
// server.js - Relief Hub Backend with Socket.IO
// ============================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ============================================
// SOCKET.IO SETUP
// ============================================
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'https://reliefhubv2.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // User joins their personal room (for notifications)
  socket.on('user:join', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined their room`);
    
    // Notify others that user is online
    socket.broadcast.emit('user:online', { userId });
  });

  // User joins a chat room
  socket.on('chat:join', (chatId) => {
    socket.join(`chat:${chatId}`);
    console.log(`💬 User joined chat: ${chatId}`);
  });

  // User leaves a chat room
  socket.on('chat:leave', (chatId) => {
    socket.leave(`chat:${chatId}`);
    console.log(`👋 User left chat: ${chatId}`);
  });

  // Handle chat message
  socket.on('chat:message', async (data) => {
    try {
      const { chatId, content, senderId, senderName } = data;
      
      // Broadcast to all users in the chat room
      io.to(`chat:${chatId}`).emit('chat:message', {
        chatId,
        message: {
          sender: { _id: senderId, name: senderName },
          content,
          createdAt: new Date(),
          isRead: false
        }
      });
      
      console.log(`📨 Message sent in chat ${chatId}`);
    } catch (error) {
      console.error('Socket message error:', error);
    }
  });

  // Handle typing indicator
  socket.on('chat:typing', (data) => {
    const { chatId, userId, isTyping } = data;
    socket.to(`chat:${chatId}`).emit('chat:typing', { userId, isTyping });
  });

  // Handle messages read
  socket.on('chat:read', (data) => {
    const { chatId, readBy } = data;
    io.to(`chat:${chatId}`).emit('chat:messagesRead', { chatId, readBy });
  });

  // Handle new request notification
  socket.on('request:new', (data) => {
    // Broadcast to all connected users except sender
    socket.broadcast.emit('request:new', data);
  });

  // Handle request update
  socket.on('request:update', (data) => {
    const { requestId, status, userId } = data;
    // Notify specific user
    if (userId) {
      io.to(`user:${userId}`).emit('request:update', data);
    }
    // Also broadcast to all
    socket.broadcast.emit('request:update', data);
  });

  // Handle new notification
  socket.on('notification:send', (data) => {
    const { userId, notification } = data;
    io.to(`user:${userId}`).emit('notification:new', notification);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// ============================================
// MIDDLEWARE
// ============================================

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

if (process.env.NODE_ENV === 'production') {
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',') 
    : ['*'];
  
  corsOptions.origin = (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  };
}

app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/' || req.path === '/api'
});
app.use('/api', limiter);

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/relief-hub');
    console.log('✅ MongoDB Connected:', conn.connection.host);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

connectDB();

// ============================================
// ROUTES
// ============================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Relief Hub API v2.0 with Socket.IO',
    version: '2.0.0',
    status: 'running',
    websocket: 'enabled',
    endpoints: {
      auth: '/api/auth',
      requests: '/api/requests',
      transactions: '/api/transactions',
      notifications: '/api/notifications',
      users: '/api/users',
      chats: '/api/chats',
      profile: '/api/profile'
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');
const transactionRoutes = require('./routes/transactions');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const profileRoutes = require('./routes/profile');

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/profile', profileRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('============================================');
  console.log(`🚀 Relief Hub Server Running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`⚡ WebSocket: enabled`);
  console.log('============================================');
  setInterval(() => {
    fetch("https://reliefhubv2.onrender.com")
      .then(() => console.log("Pinged self to stay awake 🟢"))
      .catch((err) => console.error("Ping failed:", err));
  }, 30 * 1000);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = { app, io };