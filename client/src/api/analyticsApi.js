import apiClient from "./axiosConfig";
export const getHealthAPI = async (farmId) => (await apiClient.get(`/analytics/health/${farmId}`)).data;
export const getSatelliteAPI = async (farmId) => (await apiClient.get(`/analytics/satellite/${farmId}`)).data;
export const getYieldAPI = async (farmId) => (await apiClient.get(`/analytics/yield/${farmId}`)).data;
