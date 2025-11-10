import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Chat from './models/Chat.js';
import Message from './models/Message.js';

// Routes
import authRoutes from './routes/auth.js';
import riggerRoutes from './routes/riggers.js';
import listingRoutes from './routes/listings.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import uploadRoutes from './routes/upload.js';
import statsRoutes from './routes/stats.js';
import dashboardRoutes from './routes/dashboard.js';
import reviewRoutes from './routes/reviews.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/users.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
// Increase body size limit to 50MB for image uploads (base64 can be large)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://mongo:27017/skygear';
    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        connectDB();
      }, 5000);
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Start MongoDB connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/riggers', riggerRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

// Debug route to check if auth routes are loaded
app.get('/api/debug/routes', (req, res) => {
  res.json({
    message: 'Routes loaded',
    authRoutes: authRoutes ? 'loaded' : 'not loaded',
    timestamp: new Date().toISOString()
  });
});

// Debug: List all routes
app.get('/api/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes });
});

// Health check
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState;
  const mongoStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({ 
    status: mongoStatus === 1 ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    mongodb: {
      status: mongoStates[mongoStatus] || 'unknown',
      readyState: mongoStatus
    }
  });
});

const PORT = process.env.PORT || 5000;

// Create HTTP server
const httpServer = createServer(app);

// Setup Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('_id email profile');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Join user's personal room
  socket.join(`user:${socket.userId}`);

  // Join chat room
  socket.on('join-chat', (chatId) => {
    socket.join(`chat:${chatId}`);
    console.log(`User ${socket.userId} joined chat ${chatId}`);
  });

  // Leave chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(`chat:${chatId}`);
    console.log(`User ${socket.userId} left chat ${chatId}`);
  });

  // Handle new message
  socket.on('send-message', async (data) => {
    try {
      const { chatId, content, type = 'text', attachments } = data;

      // Verify user is part of the chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Create message
      const message = new Message({
        chat: chatId,
        sender: socket.userId,
        content,
        type,
        attachments
      });

      await message.save();
      await message.populate('sender', 'profile email');

      // Update chat
      chat.lastMessage = message._id;
      chat.lastMessageAt = new Date();
      await chat.save();

      // Emit to all participants in the chat
      io.to(`chat:${chatId}`).emit('new-message', message);

      // Notify other user if they're not in the chat room
      const otherUserId = chat.participants.find(id => id.toString() !== socket.userId);
      io.to(`user:${otherUserId}`).emit('message-notification', {
        chatId,
        message,
        sender: socket.user
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    socket.to(`chat:${data.chatId}`).emit('user-typing', {
      userId: socket.userId,
      chatId: data.chatId
    });
  });

  // Handle stop typing
  socket.on('stop-typing', (data) => {
    socket.to(`chat:${data.chatId}`).emit('user-stop-typing', {
      userId: socket.userId,
      chatId: data.chatId
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Socket.io server ready`);
  
  // Check MongoDB connection status
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB is connected');
  } else {
    console.log('⏳ Waiting for MongoDB connection...');
  }
});

