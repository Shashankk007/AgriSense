import apiClient from "./axiosConfig";
export const uploadDiseaseImageAPI = async (file) => {
    const formData = new FormData(); formData.append("image", file);
    return (await apiClient.post("/detection/disease/upload", formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
};
export const uploadPestImageAPI = async (file) => {
    const formData = new FormData(); formData.append("image", file);
    return (await apiClient.post("/detection/pest/upload", formData, { headers: { "Content-Type": "multipart/form-data" } })).data;
};
export const getUserDiseaseImagesAPI = async (userId) => (await apiClient.get(`/detection/user/${userId}/disease`)).data;
export const getUserPestImagesAPI = async (userId) => (await apiClient.get(`/detection/user/${userId}/pest`)).data;
export const deleteDiseaseImageAPI = async (id) => (await apiClient.delete(`/detection/disease/${id}`)).data;
export const deletePestImageAPI = async (id) => (await apiClient.delete(`/detection/pest/${id}`)).data;
