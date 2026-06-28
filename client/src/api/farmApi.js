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
// 🟢 LOGIN API: Sirf Phone Number aur Password lega
export const loginAPI = async (phoneNumber, password) => {
  try {
    const response = await apiClient.post('/auth/login', { phoneNumber, password });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// 🟢 REGISTER API: Phone + PIN compulsory, Email optional
export const registerAPI = async ({ fullName, phoneNumber, password, email }) => {
  try {
    // Basic payload jo hamesha jayega
    const payload = { fullName, phoneNumber, password };

    // Agar email user ne form mein daala hai, tabhi usko payload mein add karo
    if (email && email.trim() !== "") {
      payload.email = email.trim().toLowerCase();
    }

    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

// 🟢 updateNameorEmailAPI: User ke profile ko update karne ke liye
export const updateProfileAPI = async (profileData) => {
  try {
    // PUT request bhej rahe hain update karne ke liye
    const response = await apiClient.put('/auth/update-profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};

// 🟢 changePinAPI: User ke PIN ko update karne ke liye
export const changePinAPI = async (oldPin, newPin) => {
  try {
    const response = await apiClient.put('/auth/change-pin', { oldPin, newPin });
    return response.data;
  } catch (error) {
    console.error('Failed to change PIN:', error);
    throw error; // Taki component ko error mil sake
  }
};

// 🟢 updateProfileImageAPI: User ke profile image ko update karne ke liye
export const updateProfileImageAPI = async (formData) => {
  try {
    const response = await apiClient.put('/auth/update-profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Image files ke liye yeh zaroori hai
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to update profile image:', error);
    throw error;
  }
};

//🟢 detect disease api
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