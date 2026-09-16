import mlApiClient from './mlAxiosConfig';

/**
 * Send a message to the AgriSense AI chatbot.
 * @param {string} userId - The authenticated user's ID.
 * @param {string} message - The user's message.
 * @param {string|null} conversationId - Optional: continue an existing conversation.
 * @returns {Promise<{response: string, conversation_id: string, sources: Array}>}
 */
export const sendChatMessageAPI = async (userId, message, conversationId = null) => {
  try {
    const payload = { user_id: userId, message };
    if (conversationId) payload.conversation_id = conversationId;

    const response = await mlApiClient.post('/chat', payload);
    return response.data;
  } catch (error) {
    console.error('Chat request failed:', error);
    throw error;
  }
};
