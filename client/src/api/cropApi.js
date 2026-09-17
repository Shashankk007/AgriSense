import apiClient from "./axiosConfig";
export const addCropAPI = async (data) => (await apiClient.post("/crops", data)).data;
export const getCropsAPI = async (farmId) => (await apiClient.get(`/crops/${farmId}`)).data;
export const updateCropAPI = async (id, data) => (await apiClient.patch(`/crops/${id}`, data)).data;
export const deleteCropAPI = async (id) => (await apiClient.delete(`/crops/${id}`)).data;
