// services/chat/index.js
import { v4 as uuidv4 } from "uuid";
import SessionManager from "./SessionManager.js";
import AssistantManager from "./AssistantManager.js";
import SuggestionGenerator from "./SuggestionGenerator.js";

class ChatService {
  constructor(openai, io) {
    this.openai = openai;
    this.io = io;
    this.sessionManager = new SessionManager(this.cleanupSession.bind(this));
    this.assistantManager = new AssistantManager(openai);
    this.suggestionGenerator = new SuggestionGenerator(openai);
  }

  setupSocketHandlers(socket) {
    let sessionId = null;

    socket.on("init_session", () => {
      sessionId = this.sessionManager.createSession();
      socket.emit("session_created", { sessionId });
    });

    socket.on("resume_session", (data) => {
      if (data.sessionId && this.sessionManager.hasSession(data.sessionId)) {
        sessionId = data.sessionId;
        this.sessionManager.refreshSession(sessionId);
      } else {
        sessionId = this.sessionManager.createSession();
        socket.emit("session_created", { sessionId });
      }
    });

    socket.on("send_prompt", async (data) => {
      if (!sessionId || !this.sessionManager.hasSession(sessionId)) {
        socket.emit("error", { message: "Invalid session" });
        return;
      }

      this.sessionManager.refreshSession(sessionId);

      try {
        await this.handlePrompt(sessionId, data.prompt, socket);
      } catch (error) {
        console.error("Error processing prompt:", error);
        socket.emit("error", { message: "Error processing your request" });
      }
    });

    socket.on("disconnect", () => {
      if (sessionId && this.sessionManager.hasSession(sessionId)) {
        this.sessionManager.scheduleCleanup(sessionId);
      }
    });
  }

  async handlePrompt(sessionId, prompt, socket) {
    let fullResponse = "";
    const session = this.sessionManager.getSession(sessionId);

    // Ensure assistant is retrieved
    await this.assistantManager.retrieveAssistant();

    // Create thread if it doesn't exist
    if (!session.threadId) {
      const thread = await this.openai.beta.threads.create();
      session.threadId = thread.id;
    }

    // Add user message to thread
    await this.openai.beta.threads.messages.create(session.threadId, {
      role: "user",
      content: prompt,
    });

    // Stream the response
    this.openai.beta.threads.runs
      .stream(session.threadId, {
        assistant_id: this.assistantManager.getAssistantId(),
      })
      .on("textCreated", (text) => {
        socket.emit("textCreated", text);
      })
      .on("textDelta", (textDelta, snapshot) => {
        fullResponse += textDelta.value;
        socket.emit("textDelta", { textDelta, snapshot });
      })
      .on("end", async () => {
        socket.emit("responseComplete");
        try {
          const suggestions = await this.suggestionGenerator.generate(
            prompt,
            fullResponse
          );
          socket.emit("suggestions", { suggestions });
        } catch (suggestionError) {
          console.error("Error generating suggestions:", suggestionError);
        }
        this.sessionManager.scheduleCleanup(sessionId);
      });
  }

  async cleanupSession(sessionId) {
    const session = this.sessionManager.getSession(sessionId);
    if (session?.threadId) {
      try {
        await this.openai.beta.threads.del(session.threadId);
        this.io.emit("clear_chat", { sessionId });
      } catch (error) {
        console.error(`Error deleting thread for session ${sessionId}:`, error);
      }
    }
    this.sessionManager.deleteSession(sessionId);
  }
}

export default ChatService;