const db = require('./db');

// 获取所有设置
function getAllSettings(callback) {
  const sql = 'SELECT * FROM settings';
  db.all(sql, (err, rows) => {
    if (err) {
      return callback(err);
    }
    // 转换为对象格式
    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });
    callback(null, settings);
  });
}

// 获取单个设置
function getSetting(key, callback) {
  const sql = 'SELECT value FROM settings WHERE key = ?';
  db.get(sql, [key], (err, row) => {
    if (err) {
      return callback(err);
    }
    callback(null, row ? row.value : null);
  });
}

// 更新设置
function updateSetting(key, value, callback) {
  const sql = 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)';
  db.run(sql, [key, value], (err) => {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

// 批量更新设置
function updateSettings(settingsObj, callback) {
  db.serialize(() => {
    const updateStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    let errorOccurred = false;

    // 遍历设置对象并执行更新
    for (const [key, value] of Object.entries(settingsObj)) {
      updateStmt.run(key, value, (err) => {
        if (err && !errorOccurred) {
          errorOccurred = true;
          callback(err);
        }
      });
    }

    updateStmt.finalize(() => {
      if (!errorOccurred) {
        callback(null);
      }
    });
  });
}

module.exports = {
  getAllSettings,
  getSetting,
  updateSetting,
  updateSettings
};
