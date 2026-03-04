const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'data/database.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    return;
  }
  console.log('连接到SQLite数据库。');

  // 添加quantity列
  db.run('ALTER TABLE products ADD COLUMN quantity INTEGER NOT NULL DEFAULT 0', (err) => {
    if (err) {
      console.error('添加quantity列失败:', err.message);
    } else {
      console.log('成功添加quantity列到products表');
    }

    // 关闭数据库连接
    db.close((err) => {
      if (err) {
        console.error('关闭数据库失败:', err.message);
        return;
      }
      console.log('关闭数据库连接。');
    });
  });
});
