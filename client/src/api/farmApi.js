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

// Password reset APIs
export const forgotPasswordAPI = async (email) => {
  try {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Error sending reset link', error);
    throw error;
  }
};

export const resetPasswordAPI = async (token, password) => {
  try {
    const response = await apiClient.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  } catch (error) {
    console.error('Error resetting password', error);
    throw error;
  }
};

export const registerAPI = async ({ username, email, password, phone, address }) => {
  try {
    const response = await apiClient.post('/auth/register', {
      username,
      email,
      password,
      phone,
      address,
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

// Update profile (username, phone, address)
export const updateProfileAPI = async ({ username, phone, address }) => {
  try {
    const response = await apiClient.patch('/auth/me', { username, phone, address });
    return response.data;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};

// Change password
export const changePasswordAPI = async ({ oldPassword, newPassword }) => {
  try {
    const response = await apiClient.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  } catch (error) {
    console.error('Failed to change password:', error);
    throw error;
  }
};

// Change profile image (multipart/form-data)
export const changeProfileImageAPI = async (file) => {
  try {
    const formData = new FormData();
    formData.append('profileImage', file);
    const response = await apiClient.patch('/auth/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to update profile image:', error);
    throw error;
  }
};

// ---- Disease / pest detection (ML-backed) ----
export const scanCropImagesAPI = async (formData) => {
  const response = await apiClient.post("/detections/scan", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

//🟢 detect pest api
export const scanPestImagesAPI = async (formData) => {
  const response = await apiClient.post("/detections/scan-pest", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

//🟢 get detectionHistory
export const getDetectionHistoryAPI = async () => {
  try {
    const response = await apiClient.get('/detections/history');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch detection history:', error);
    throw error;
  }
};

//🟢 get pestHistory
export const getPestHistoryAPI = async () => {
  try {
    const response = await apiClient.get('/detections/history/pest');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch pest history:', error);
    throw error;
  }
};

//🟢 delete detection record
export const deleteDetectionAPI = async (id) => {
    const response = await apiClient.delete(`/detections/records/${id}`);
    return response.data;
};

//🟢 get current user api

export const getFarmNdviAPI = async (farmId) => {
  const response = await apiClient.get(`/farms/${farmId}/ndvi`);
  return response.data;
};
