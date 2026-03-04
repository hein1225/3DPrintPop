const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adminModel = require('../models/adminModel');

// 检查是否需要设置密码
function checkPasswordStatus(req, res) {
  adminModel.checkPasswordSet((err, isSet) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' });
    }
    res.json({ passwordSet: isSet });
  });
}

// 设置初始密码
function setInitialPassword(req, res) {
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: '两次输入的密码不一致' });
  }

  // 检查是否已经设置过密码
  adminModel.checkPasswordSet((err, isSet) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' });
    }

    if (isSet) {
      return res.status(400).json({ message: '密码已经设置过' });
    }

    // 加密密码
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ message: '密码加密失败' });
      }

      // 保存密码
      adminModel.createPassword(hashedPassword, (err) => {
        if (err) {
          return res.status(500).json({ message: '保存密码失败' });
        }

        res.json({ message: '密码设置成功' });
      });
    });
  });
}

// 管理员登录
function login(req, res) {
  const { password } = req.body;

  // 获取密码哈希
  adminModel.getPasswordHash((err, passwordHash) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' });
    }

    if (!passwordHash) {
      return res.status(401).json({ message: '密码尚未设置' });
    }

    // 验证密码
    bcrypt.compare(password, passwordHash, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ message: '密码验证失败' });
      }

      if (!isMatch) {
        return res.status(401).json({ message: '密码错误' });
      }

      // 生成JWT令牌，设置30分钟过期
      const token = jwt.sign(
        { adminId: 1 }, // 只有一个管理员，所以固定ID为1
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
      );

      res.json({ message: '登录成功', token });
    });
  });
}

// 修改管理员密码
function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  // 获取当前密码哈希
  adminModel.getPasswordHash((err, passwordHash) => {
    if (err) {
      return res.status(500).json({ message: '服务器错误' });
    }

    if (!passwordHash) {
      return res.status(401).json({ message: '密码尚未设置' });
    }

    // 验证当前密码
    bcrypt.compare(currentPassword, passwordHash, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ message: '密码验证失败' });
      }

      if (!isMatch) {
        return res.status(401).json({ message: '当前密码错误' });
      }

      // 加密新密码
      bcrypt.hash(newPassword, 10, (err, hashedNewPassword) => {
        if (err) {
          return res.status(500).json({ message: '密码加密失败' });
        }

        // 更新密码
        adminModel.updatePassword(hashedNewPassword, (err) => {
          if (err) {
            return res.status(500).json({ message: '更新密码失败' });
          }

          res.json({ message: '密码修改成功' });
        });
      });
    });
  });
}

module.exports = {
  checkPasswordStatus,
  setInitialPassword,
  login,
  changePassword
};
