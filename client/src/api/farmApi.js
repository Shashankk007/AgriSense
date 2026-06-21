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