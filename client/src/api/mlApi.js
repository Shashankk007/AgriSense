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
