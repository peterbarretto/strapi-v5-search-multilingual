import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getCookieValue } from './cookies';

const STORAGE_KEYS = {
  TOKEN: 'jwtToken',
  USER: 'userInfo',
};

const getToken = (): string | null => {
  const fromLocalStorage = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (fromLocalStorage) {
    try {
      return JSON.parse(fromLocalStorage);
    } catch {
      return fromLocalStorage;
    }
  }
  return getCookieValue(STORAGE_KEYS.TOKEN);
};

const instance: AxiosInstance = axios.create({
  baseURL: process.env.STRAPI_ADMIN_BACKEND_URL,
});

instance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.headers.set?.('Authorization', `Bearer ${getToken()}`);
    config.headers.set?.('Accept', 'application/json');
    config.headers.set?.('Content-Type', 'application/json');
    return config;
  },
  (error) => Promise.reject(error)
);


instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.clear();
        sessionStorage.clear();
      window.location.reload();                                                                                                              
    }
    return Promise.reject(error);
  }
);

export default instance;
