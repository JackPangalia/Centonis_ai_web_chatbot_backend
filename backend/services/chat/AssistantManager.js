// services/chat/AssistantManager.js

const ASSISTANT_ID = "asst_WDSPX49YUUJxDG1677RoRQMo";

class AssistantManager {
  constructor(openai) {
    this.openai = openai;
    this.assistant = null;
  }

  getAssistantId() {
    return ASSISTANT_ID;
  }

  async retrieveAssistant() {
    try {
      if (!this.assistant) {
        this.assistant = await this.openai.beta.assistants.retrieve(ASSISTANT_ID);
      }
      return this.assistant;
    } catch (error) {
      console.error("Error retrieving Assistant:", error);
      throw error;
    }
  }
}

export default AssistantManager;