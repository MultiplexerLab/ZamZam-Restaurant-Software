import axios from 'axios';

const API = axios.create({
    baseURL: 'https://api.zamzam.jp/api',
    // baseURL: 'http://127.0.0.1:8000/api',
    withCredentials: true,
});

// Add token to requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;