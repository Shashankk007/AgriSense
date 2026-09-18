import apiClient from './axiosConfig';

// Chat goes through the Express backend, which authenticates the user and forwards to the ML service.

export const sendChatMessageAPI = async (message, conversation_id = null) => {
  const payload = { message };
  if (conversation_id) {
    payload.conversation_id = conversation_id;
  }
  const response = await apiClient.post('/chat', payload);
  return response.data;
};

export const getChatHistoryAPI = async () => {
  const response = await apiClient.get('/chat/history');
  return response.data;
};

export const getConversationAPI = async (conversation_id) => {
  const response = await apiClient.get(`/chat/conversations/${conversation_id}`);
  return response.data;
};
