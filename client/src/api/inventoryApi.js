import apiClient from "./axiosConfig";
export const addItemAPI = async (data) => (await apiClient.post("/inventory", data)).data;
export const getItemsAPI = async () => (await apiClient.get("/inventory")).data;
export const updateItemAPI = async (id, data) => (await apiClient.patch(`/inventory/${id}`, data)).data;
export const deleteItemAPI = async (id) => (await apiClient.delete(`/inventory/${id}`)).data;
