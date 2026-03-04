const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// 验证JWT令牌
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  logger.info('验证令牌', { authHeader, url: req.url, method: req.method });
  
  const token = authHeader?.split(' ')[1];

  if (!token) {
    logger.warn('未提供认证令牌', { url: req.url, method: req.method });
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  logger.info('令牌验证开始', { tokenLength: token.length });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.error('令牌验证失败', { error: err.message, tokenLength: token.length });
      return res.status(401).json({ message: '无效的认证令牌' });
    }
    logger.info('令牌验证成功', { adminId: decoded.adminId });
    req.adminId = decoded.adminId;
    next();
  });
}

module.exports = {
  verifyToken
};
