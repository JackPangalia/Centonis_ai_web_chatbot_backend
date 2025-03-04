// services/chat/SuggestionGenerator.js

class SuggestionGenerator {
  constructor(openai) {
    this.openai = openai;
  }

  async generate(prompt, response) {
    try {
      const suggestionResponse = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        max_tokens: 150,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant designed to generate three short, relevant, and natural-sounding quick reply suggestions for a user interacting with an AI chatbot.

            **Input:** The preceding AI chatbot response.
            
            **Task:** Analyze the AI chatbot's response and generate three distinct, concise, and user-friendly quick reply suggestions. These suggestions should:
            
            * **Be short and easy to understand.** Aim for 2-10 words, or short phrases.
            * **Be relevant to the AI's response.** The suggestions should logically follow the conversation.
            * **Offer different directions for the conversation.** Avoid repetitive suggestions.
            * **Be phrased as potential user prompts.** They should sound like something a user would naturally say. Frame the quick replies as if the user is directly speaking to the chatbot.
            * **Be suitable for a casual, conversational tone.**
            * **Focus on furthering the conversation or asking for clarification.**
            
            **Output JSON Format:**
            
            {
              "quick_replies": [
                "Quick Reply 1",
                "Quick Reply 2",
                "Quick Reply 3"
              ]
            }
            
            **Example:**
            
            **Input:** "The weather in London is currently cloudy with a chance of rain."
            
            **Output:**
            
            {
              "quick_replies": [
                "Tell me more",
                "What is the temperature",
                "Show me pictures."
              ]
            }`,
          },
          {
            role: "user",
            content: response,
          },
        ],
      });

      const suggestionsString = suggestionResponse.choices[0].message.content;
      const suggestionsJson = JSON.parse(suggestionsString);
      return suggestionsJson.quick_replies;
    } catch (error) {
      console.error("Error generating suggestions:", error);
      return [];
    }
  }
}

export default SuggestionGenerator;
