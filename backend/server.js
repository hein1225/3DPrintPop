const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const db = require('./src/models/db');
const logger = require('./src/utils/logger');
const app = express();

// 加载环境变量（从根目录加载）
dotenv.config({ path: path.join(__dirname, '.env') });

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志记录
app.use((req, res, next) => {
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    body: req.body
  });
  next();
});

// 静态文件服务
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'public/uploads');
app.use('/uploads', express.static(uploadDir));

// 路由
const adminRoutes = require('./src/routes/adminRoutes');
const productRoutes = require('./src/routes/productRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');
const materialRoutes = require('./src/routes/materialRoutes');

app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/materials', materialRoutes);

// 前端静态文件服务
app.use(express.static(path.join(__dirname, 'public')));



app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  logger.error('Server error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url
  });
  
  res.status(500).json({
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
