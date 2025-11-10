import express from 'express';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get or create chat between two users
router.get('/:userId', authenticate, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    if (currentUserId.toString() === otherUserId) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    // Find existing chat
    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, otherUserId] }
    }).populate('participants', 'profile email')
      .populate('lastMessage');

    // Create new chat if doesn't exist
    if (!chat) {
      chat = new Chat({
        participants: [currentUserId, otherUserId]
      });
      await chat.save();
      await chat.populate('participants', 'profile email');
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all chats for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
      .populate('participants', 'profile email')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'profile email'
        }
      })
      .sort({ lastMessageAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or get a chat with another user
router.post('/', authenticate, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === recipientId) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    let chat = await Chat.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (!chat) {
      chat = new Chat({
        participants: [senderId, recipientId]
      });
      await chat.save();
    }

    await chat.populate('participants', 'profile email');
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const chat = await Chat.findById(req.params.chatId);
    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'profile email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Mark messages as read
    await Message.updateMany(
      { chat: req.params.chatId, sender: { $ne: req.user._id }, read: false },
      { read: true, readAt: new Date() }
    );

    res.json(messages.reverse()); // Reverse to show oldest first
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a message (also handled by socket.io, but keeping REST endpoint)
router.post('/:chatId/messages', authenticate, async (req, res) => {
  try {
    const { content, type = 'text', attachments } = req.body;

    const chat = await Chat.findById(req.params.chatId);
    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = new Message({
      chat: req.params.chatId,
      sender: req.user._id,
      content,
      type,
      attachments
    });

    await message.save();
    await message.populate('sender', 'profile email');

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.lastMessageAt = new Date();
    await chat.save();

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

