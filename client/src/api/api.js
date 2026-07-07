import axios from 'axios';

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
  timeout: 10000,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('mc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mc_token');
      localStorage.removeItem('mc_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const getProfile = () => API.get('/auth/profile');
export const changePassword = (data) => API.put('/auth/change-password', data);

// Sites
export const getSites = () => API.get('/sites');
export const getSite = (id) => API.get(`/sites/${id}`);
export const createSite = (data) => API.post('/sites', data);
export const updateSite = (id, data) => API.put(`/sites/${id}`, data);
export const deleteSite = (id) => API.delete(`/sites/${id}`);
export const toggleSite = (id) => API.patch(`/sites/${id}/toggle`);

// Admins
export const getAdmins = () => API.get('/admins');
export const createAdmin = (data) => API.post('/admins', data);
export const updateAdmin = (id, data) => API.put(`/admins/${id}`, data);
export const deleteAdmin = (id) => API.delete(`/admins/${id}`);
export const toggleAdmin = (id) => API.patch(`/admins/${id}/toggle`);
export const resetAdminPassword = (id, data) => API.patch(`/admins/${id}/reset-password`, data);

// Materials
export const getMaterials = (params) => API.get('/materials', { params });
export const createMaterial = (data) => API.post('/materials', data);
export const updateMaterial = (id, data) => API.put(`/materials/${id}`, data);
export const deleteMaterial = (id) => API.delete(`/materials/${id}`);

// Workers
export const getWorkers = (params) => API.get('/workers', { params });
export const createWorker = (data) => API.post('/workers', data);
export const updateWorker = (id, data) => API.put(`/workers/${id}`, data);
export const deleteWorker = (id) => API.delete(`/workers/${id}`);

// Expenses
export const getExpenses = (params) => API.get('/expenses', { params });
export const createExpense = (data) => API.post('/expenses', data);
export const updateExpense = (id, data) => API.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);
export const approveExpense = (id) => API.patch(`/expenses/${id}/approve`);
export const rejectExpense = (id) => API.patch(`/expenses/${id}/reject`);

// Reports
export const getDashboardStats = () => API.get('/reports/dashboard');
export const getSiteDashboard = (params) => API.get('/reports/site-dashboard', { params });
export const getDailyReport = (params) => API.get('/reports/daily', { params });
export const getMonthlyReport = (params) => API.get('/reports/monthly', { params });
export const getSiteWiseReport = () => API.get('/reports/sitewise');
export const getTotalExpensesReport = () => API.get('/reports/total-expenses');

export default API;
