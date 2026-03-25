const db = require('./db');

// 获取所有耗材
function getAllMaterials(callback) {
  const sql = 'SELECT * FROM materials ORDER BY created_at DESC';
  db.all(sql, (err, rows) => {
    if (err) {
      return callback(err);
    }
    callback(null, rows);
  });
}

// 获取单个耗材
function getMaterialById(id, callback) {
  const sql = 'SELECT * FROM materials WHERE id = ?';
  db.get(sql, [id], (err, row) => {
    if (err) {
      return callback(err);
    }
    callback(null, row);
  });
}

// 创建耗材
function createMaterial(color, type, pricePerGram, callback) {
  const sql = 'INSERT INTO materials (color, type, price_per_gram) VALUES (?, ?, ?)';
  db.run(sql, [color, type, pricePerGram], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, this.lastID);
  });
}

// 更新耗材
function updateMaterial(id, color, type, pricePerGram, callback) {
  const sql = 'UPDATE materials SET color = ?, type = ?, price_per_gram = ? WHERE id = ?';
  db.run(sql, [color, type, pricePerGram, id], (err) => {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

// 删除耗材
function deleteMaterial(id, callback) {
  const sql = 'DELETE FROM materials WHERE id = ?';
  db.run(sql, [id], (err) => {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

// 获取耗材使用总量
function getMaterialUsageTotal(callback) {
  const sql = `
    SELECT m.id, SUM(pm.weight) as total_weight
    FROM product_materials pm
    JOIN materials m ON pm.material_id = m.id
    GROUP BY m.id
  `;
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('获取耗材使用总量失败:', err);
      return callback(err);
    }
    // 将结果转换为对象，键为materialId，值为使用量
    const usageObject = {};
    if (rows && rows.length > 0) {
      rows.forEach(row => {
        usageObject[row.id] = row.total_weight || 0;
      });
    }
    callback(null, usageObject);
  });
}

module.exports = {
  getAllMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialUsageTotal
};
