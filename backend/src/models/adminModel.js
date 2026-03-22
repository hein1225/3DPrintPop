const db = require('./db');

// 检查是否已经设置密码
function checkPasswordSet(callback) {
  const sql = 'SELECT COUNT(*) as count FROM admin';
  db.get(sql, (err, row) => {
    if (err) {
      return callback(err);
    }
    callback(null, row.count > 0);
  });
}

// 创建管理员密码
function createPassword(password, callback) {
  const sql = 'INSERT INTO admin (password_hash) VALUES (?)';
  db.run(sql, [password], (err) => {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

// 获取密码哈希
function getPasswordHash(callback) {
  const sql = 'SELECT password_hash FROM admin LIMIT 1';
  db.get(sql, (err, row) => {
    if (err) {
      return callback(err);
    }
    callback(null, row ? row.password_hash : null);
  });
}

// 更新管理员密码
function updatePassword(password, callback) {
  const sql = 'UPDATE admin SET password_hash = ?';
  db.run(sql, [password], (err) => {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

module.exports = {
  checkPasswordSet,
  createPassword,
  getPasswordHash,
  updatePassword
};
