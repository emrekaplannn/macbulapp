import axios from 'axios';
import Config from 'react-native-config';

const api = axios.create({
  baseURL: Config.API_URL, // e.g. http://10.0.2.2:8080/v1
  timeout: 10000,
});

export default api;
