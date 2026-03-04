const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const adminModel = require('../models/adminModel');
const logger = require('../utils/logger');

// 检查是否需要设置密码
router.get('/password-status', adminController.checkPasswordStatus);

// 设置初始密码
router.post('/set-password', adminController.setInitialPassword);

// 管理员登录
router.post('/login', adminController.login);

// 修改管理员密码
router.post('/change-password', verifyToken, adminController.changePassword);



module.exports = router;
