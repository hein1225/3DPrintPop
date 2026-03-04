const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { verifyToken } = require('../middleware/auth');

// 获取所有材料
router.get('/', materialController.getAllMaterials);

// 添加材料（需要认证）
router.post('/', verifyToken, materialController.addMaterial);

// 更新材料（需要认证）
router.put('/:id', verifyToken, materialController.updateMaterial);

// 删除材料（需要认证）
router.delete('/:id', verifyToken, materialController.deleteMaterial);

// 获取材料使用总量（需要认证）
router.get('/usage', verifyToken, materialController.getMaterialUsageTotal);

module.exports = router;
