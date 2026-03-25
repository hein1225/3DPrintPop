const db = require('./src/models/db');

// 检查所有表
console.log('检查数据库表结构:');
db.all('SELECT name FROM sqlite_master WHERE type="table"', (err, rows) => {
  if (err) {
    console.error('检查表结构失败:', err);
  } else {
    console.log('存在的表:', rows.map(row => row.name));
    
    // 检查product_materials表结构
    console.log('\n检查product_materials表结构:');
    db.all('PRAGMA table_info(product_materials)', (err, columns) => {
      if (err) {
        console.error('检查product_materials表结构失败:', err);
      } else {
        console.log('product_materials表列:', columns);
      }
      
      // 关闭数据库连接
      db.close();
    });
  }
});