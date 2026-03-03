const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Generates a chat completion using the Groq API.
 *
 * @param {string} userContent The user's prompt or content.
 * @returns {Promise<string>} The generated text from the model.
 */
async function generateGroqChatCompletion(userContent) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
      model: process.env.GROQ_MODEL || 'llama3-8b-8192',
    });

    return chatCompletion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating Groq chat completion:', error);
    throw new Error('Failed to generate insight from Groq API.');
  }
}

module.exports = {
  generateGroqChatCompletion,
};
