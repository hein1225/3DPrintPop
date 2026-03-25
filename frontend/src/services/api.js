import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加认证令牌
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  response => response,
  error => {
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  checkPasswordStatus: () => api.get('/admin/password-status'),
  setInitialPassword: (password, confirmPassword) => api.post('/admin/set-password', { password, confirmPassword }),
  login: password => api.post('/admin/login', { password }),
  changePassword: (currentPassword, newPassword) => api.post('/admin/change-password', { currentPassword, newPassword })
};

// 商品相关API
export const productAPI = {
  getAllProducts: () => api.get('/products'),
  getProductDetails: id => api.get(`/products/${id}`),
  addProduct: (formData) => api.post('/products', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  updateProduct: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  deleteProduct: id => api.delete(`/products/${id}`),
  updateProductPrice: (id, sellingPrice) => api.patch(`/products/${id}/price`, { sellingPrice }),
  sellOneProduct: (id, sellingPrice) => api.post(`/products/${id}/sell`, { sellingPrice }),
  updateProductShowStatus: (id, showOnHome) => api.patch(`/products/${id}/show-status`, { showOnHome })
};

// 销售相关API
export const salesAPI = {
  addSale: (productId, quantity, totalAmount) => api.post('/sales', { productId, quantity, totalAmount }),
  getSalesStatistics: () => api.get('/sales/statistics'),
  getAllSales: () => api.get('/sales/all'),
  deleteSale: (id) => api.delete(`/sales/${id}`),
  deleteSales: (ids) => api.delete('/sales/batch', { data: { ids } })
};

// 耗材相关API
export const materialAPI = {
  getAllMaterials: () => api.get('/materials'),
  addMaterial: (color, type, pricePerGram) => api.post('/materials', { color, type, pricePerGram }),
  updateMaterial: (id, color, type, pricePerGram) => api.put(`/materials/${id}`, { color, type, pricePerGram }),
  deleteMaterial: id => api.delete(`/materials/${id}`),
  getMaterialUsageTotal: () => api.get('/materials/usage')
};

// 设置相关API
export const settingsAPI = {
  getAllSettings: () => api.get('/settings'),
  updateSettings: settings => api.put('/settings', settings),
  getRecommendations: () => api.get('/settings/recommendations'),
  setRecommended: (productIds) => api.post('/settings/recommended', { productIds }),
  setSpecial: (productIds) => api.post('/settings/special', { productIds }),
  backupDatabase: () => api.post('/settings/backup'),
  restoreDatabase: backupFile => api.post('/settings/restore', { backupFile }),
  restoreDatabaseFromFile: formData => api.post('/settings/restore-file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  getBackupFiles: () => api.get('/settings/backups'),
  deleteBackup: timestamp => api.delete(`/settings/backups/${timestamp}`),
  downloadBackup: timestamp => api.get(`/settings/backups/${timestamp}/download`, { responseType: 'blob' }),
  resetDatabase: () => api.post('/settings/reset'),
  // 主页密码相关API
  setHomePassword: password => api.post('/settings/home-password', { password }),
  verifyHomePassword: password => api.post('/settings/verify-home-password', { password }),
  checkHomePasswordStatus: () => api.get('/settings/home-password-status')
};

export default api;
