import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './services/chatService.js';

// Load environment variables
dotenv.config();

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
  origin: [
    'https://jackpangalia.github.io',
    'https://jackpangalia.github.io/Philswebsitebot',
    'http://127.0.0.1:5500',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
};

// Setup Socket.IO with CORS
const io = new Server(server, { cors: corsOptions });

// Apply CORS to Express
app.use(cors(corsOptions));

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Setup Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  setupSocketHandlers(socket, openai, io);
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});