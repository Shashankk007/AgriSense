import apiClient from './axiosConfig';

export const saveFarmBoundaryAPI = async (farmName, coordinates) => {
  try {
    const response = await apiClient.post(`/farms/save-boundary`, {
      farmName,
      coordinates
    });
    return response.data;
  } catch (error) {
    console.error("Error in API call:", error);
    throw error;
  }
};

export const getFarmsAPI = async () => {
  try {
    const response = await apiClient.get('/farms');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch farms:', error);
    throw error;
  }
};

export const getFarmByIdAPI = async (farmId) => {
  try {
    const response = await apiClient.get(`/farms/${farmId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch farm:', error);
    throw error;
  }
};

export const deleteFarmAPI = async (farmId) => {
  try {
    const response = await apiClient.delete(`/farms/${farmId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete farm:', error);
    throw error;
  }
};

export const loginAPI = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const registerAPI = async ({ username, email, password }) => {
  try {
    const response = await apiClient.post('/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

export const getCurrentUserAPI = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    throw error;
  }
};

// Google Login API Call
export const googleLoginAPI = async (credential) => {
  try {
    const response = await apiClient.post(`/auth/google-login`, { credential });
    return response.data; //This will contain the user info and success status
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

// Logout API Call
export const logoutAPI = async () => {
  try {
    const response = await apiClient.post(`/auth/logout`);
    return response.data; //This will contain the success status
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};