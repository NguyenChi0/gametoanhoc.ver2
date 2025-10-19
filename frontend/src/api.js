// src/api.js
import axios from "axios";

// Base URL đã có prefix /api
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

// ==========================
// Auth
// ==========================
export const register = async ({ username, password, fullname }) => {
  return api.post("/register", { username, password, fullname });
};

export const login = async ({ username, password }) => {
  return api.post("/login", { username, password });
};

// ==========================
// Grades / Types / Operations
// ==========================
export const getGrades = async () => {
  const res = await api.get("/grades");
  return res.data;
};

export const getTypes = async (gradeId) => {
  const res = await api.get(`/types/${gradeId}`);
  return res.data;
};

export const getOperations = async (typeId) => {
  const res = await api.get(`/operations/${typeId}`);
  return res.data;
};

// ==========================
// Questions
// ==========================
export const getQuestions = async ({ grade_id, type_id, operation_id, limit, offset, random }) => {
  const params = { grade_id, type_id, operation_id, limit, offset, random };
  const res = await api.get("/questions", { params });
  return res.data;
};

export const getQuestionById = async (id) => {
  const res = await api.get(`/questions/${id}`);
  return res.data;
};

// ==========================
// Score
// ==========================
export const incrementScore = async ({ userId, delta }) => {
  const res = await api.post("/score/increment", { userId, delta });
  return res.data;
};


// ==========================
// Music
// ==========================
export const getMusicList = async () => {
  const res = await api.get('/music');
  return res.data;
};

export const getMusicById = async (id) => {
  const res = await api.get(`/music/${id}`);
  return res.data;
};


export default api;
