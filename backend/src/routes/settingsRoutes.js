const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const settingsController = require('../controllers/settingsController');
const { verifyToken } = require('../middleware/auth');

// 配置multer用于文件上传
const upload = multer({
  dest: path.join(__dirname, '../../uploads/'),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  }
});

// 获取所有设置
router.get('/', settingsController.getAllSettings);

// 更新设置（需要认证）
router.put('/', verifyToken, settingsController.updateSettings);

// 获取今日推荐和特价
router.get('/recommendations', settingsController.getRecommendations);

// 设置今日推荐（需要认证）
router.post('/recommended', verifyToken, settingsController.setRecommended);

// 设置今日特价（需要认证）
router.post('/special', verifyToken, settingsController.setSpecial);

// 备份数据库（需要认证）
router.post('/backup', verifyToken, settingsController.backupDatabase);

// 还原数据库（需要认证）
router.post('/restore', verifyToken, settingsController.restoreDatabase);

// 获取所有备份文件（需要认证）
router.get('/backups', verifyToken, settingsController.getBackupFiles);

// 删除备份文件（需要认证）
router.delete('/backups/:timestamp', verifyToken, settingsController.deleteBackup);

// 下载备份文件（需要认证）
router.get('/backups/:timestamp/download', verifyToken, settingsController.downloadBackup);

// 从上传文件还原数据库（需要认证）
router.post('/restore-file', verifyToken, upload.single('backupFile'), settingsController.restoreDatabaseFromFile);

// 重置数据（需要认证）
router.post('/reset', verifyToken, settingsController.resetDatabase);

// 设置主页访问密码（需要认证）
router.post('/home-password', verifyToken, settingsController.setHomePassword);

// 验证主页访问密码（不需要认证）
router.post('/verify-home-password', settingsController.verifyHomePassword);

// 检查主页密码是否已设置（不需要认证）
router.get('/home-password-status', settingsController.checkHomePasswordStatus);

module.exports = router;
