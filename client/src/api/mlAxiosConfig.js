import axios from 'axios';

const mlApiClient = axios.create({
  baseURL: import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8000',
});

export default mlApiClient;
