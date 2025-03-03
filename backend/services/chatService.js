// services/chatService.js
import ChatService from './chat/index.js';

// This adapter maintains backward compatibility with existing code
export function setupSocketHandlers(socket, openai, io) {
  const chatService = new ChatService(openai, io);
  chatService.setupSocketHandlers(socket);
}