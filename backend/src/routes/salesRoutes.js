const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { verifyToken } = require('../middleware/auth');

// 添加销售记录（需要认证）
router.post('/', verifyToken, salesController.addSale);

// 获取销售统计（需要认证）
router.get('/statistics', verifyToken, salesController.getSalesStatistics);

// 获取商品销售记录（需要认证）
router.get('/product/:productId', verifyToken, salesController.getProductSales);

// 获取所有销售记录（需要认证）
router.get('/all', verifyToken, salesController.getAllSales);

module.exports = router;
