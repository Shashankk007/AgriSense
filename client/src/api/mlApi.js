import mlApiClient from './mlAxiosConfig';

export const getFarmNdviAPI = async (farmId) => {
  try {
    const response = await mlApiClient.get(`/ndvi/${farmId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch NDVI data:', error);
    throw error;
  }
};

export const getMlHealthAPI = async () => {
  try {
    const response = await mlApiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch ML service health:', error);
    throw error;
  }
};

export const sendChatMessageAPI = async (mobile_number, message, conversation_id = null) => {
  try {
    const payload = {
      mobile_number,
      message,
    };
    if (conversation_id) {
      payload.conversation_id = conversation_id;
    }
    const response = await mlApiClient.post('/chat', payload);
    return response.data;
  } catch (error) {
    console.error('Failed to send chat message:', error);
    throw error;
  }
};

export const getChatHistoryAPI = async (mobile_number) => {
  try {
    const response = await mlApiClient.get(`/chat/history/${mobile_number}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    throw error;
  }
};

export const getConversationAPI = async (conversation_id) => {
  try {
    const response = await mlApiClient.get(`/chat/conversation/${conversation_id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch conversation:', error);
    throw error;
  }
};
