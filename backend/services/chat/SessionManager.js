// services/chat/SessionManager.js
import { v4 as uuidv4 } from "uuid";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

class SessionManager {
  constructor(cleanupCallback) {
    this.sessions = new Map();
    this.cleanupCallback = cleanupCallback;
  }

  createSession() {
    const sessionId = uuidv4();
    const session = {
      threadId: null,
      lastActive: Date.now(),
      timeoutId: null,
    };
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  hasSession(sessionId) {
    return this.sessions.has(sessionId);
  }

  refreshSession(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.lastActive = Date.now();
    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
      session.timeoutId = null;
    }
    
    return session;
  }

  scheduleCleanup(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) return;

    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
    }
    
    session.timeoutId = setTimeout(
      () => this.cleanupCallback(sessionId),
      SESSION_TIMEOUT
    );
  }

  deleteSession(sessionId) {
    this.sessions.delete(sessionId);
  }
}

export default SessionManager;