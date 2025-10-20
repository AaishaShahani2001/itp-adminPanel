// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---------------- INVENTORY ----------------
export const getProducts = (params = {}) =>
  api.get('/inventory', { params }).then(res => res.data);

export const getProduct = (id) =>
  api.get(`/inventory/${id}`).then(res => res.data);

export const createProduct = (productData) =>
  api.post('/inventory', productData).then(res => res.data);

export const updateProduct = (id, productData) =>
  api.patch(`/inventory/${id}`, productData).then(res => res.data);

export const updateStock = (id, operation, quantity) =>
  api.patch(`/inventory/${id}/stock`, { operation, quantity }).then(res => res.data);

export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete product error:', error);
    throw error;
  }
};

// ---------------- ORDERS ----------------
export const createOrder = (orderData) =>
  api.post('/orders', orderData).then(res => res.data);

export const getOrders = () =>
  api.get('/orders').then(res => res.data);

export const getOrder = (id) =>
  api.get(`/orders/${id}`).then(res => res.data);

export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}`, { status }).then(res => res.data);

// ---------------- DASHBOARD ----------------
export const getDashboardStats = async () => {
  const res = await api.get('/dashboard/stats');
  return res.data;
};

// ---------------- CATEGORIES ----------------
export const getCategories = async () => {
  const res = await api.get('/categories');
  return res.data;
};

export const addCategory = async (category) => {
  const res = await api.post('/categories', category);
  return res.data;
};

export const deleteCategory = async (id) => {
  const res = await api.delete(`/categories/${id}`);
  return res.data;
};

export const updateCategory = async (id, payload) => {
  const res = await api.patch(`/categories/${id}`, payload);
  return res.data;
};

// ---------------- SUPPLIERS ----------------
export const getSuppliers = async () => {
  const res = await api.get('/suppliers');
  return res.data;
};

export const addSupplier = async (payload) => {
  const res = await api.post('/suppliers', payload);
  return res.data;
};

export const updateSupplier = async (id, payload) => {
  const res = await api.patch(`/suppliers/${id}`, payload);
  return res.data;
};

export const deleteSupplier = async (id) => {
  const res = await api.delete(`/suppliers/${id}`);
  return res.data;
};

// ---------------- SALES ----------------
export const getSales = async () => {
  const res = await api.get('/sales');   // ✅ fixed
  return res.data;
};

export const setProductDiscount = async (id, percent) => {
  const res = await api.patch(`/inventory/${id}/discount`, { discount: percent });
  return res.data;
};

// ---------------- NEAR-EXPIRY ----------------
export const getNearExpiryProducts = async () => {
  const res = await api.get('/inventory/near-expiry'); // ✅ fixed
  return res.data;
};

export const applyDiscount = async (id, discountPrice) => {
  const res = await api.patch(`/inventory/${id}/discount`, { discountPrice });
  return res.data;
};

// ---------------- STOCK MANAGEMENT ----------------
// updateStock is already defined above

// ---------------- DISCOUNT MANAGEMENT ----------------
// setProductDiscount is already defined above

export default api;
