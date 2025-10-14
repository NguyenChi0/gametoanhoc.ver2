// src/api.js
import axios from "axios";

// Chú ý thêm /api vào baseURL vì backend dùng /api prefix
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// attach token nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
