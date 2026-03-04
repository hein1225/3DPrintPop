const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middleware/auth');

// 获取所有商品
router.get('/', productController.getAllProducts);

// 获取单个商品详情
router.get('/:id', productController.getProductDetails);

// 添加商品（需要认证）
router.post('/', verifyToken, productController.upload.single('image'), productController.addProduct);

// 更新商品（需要认证）
router.put('/:id', verifyToken, productController.upload.single('image'), productController.updateProduct);

// 删除商品（需要认证）
router.delete('/:id', verifyToken, productController.deleteProduct);

// 更新商品售价（需要认证）
router.patch('/:id/price', verifyToken, productController.updateProductPrice);

// 售出一件商品
router.post('/:id/sell', productController.sellOneProduct);

// 补货商品（需要认证）
router.patch('/:id/restock', verifyToken, productController.restockProduct);

module.exports = router;
