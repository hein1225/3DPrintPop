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

// 获取耗材使用总量（基于销售记录）
function getMaterialUsageTotal(callback) {
  const sql = `
    SELECT m.color, m.type, SUM(pm.weight * s.quantity) as total_weight
    FROM product_materials pm
    JOIN materials m ON pm.material_id = m.id
    JOIN products p ON pm.product_id = p.id
    JOIN sales s ON p.id = s.product_id
    GROUP BY m.color, m.type
    ORDER BY total_weight DESC
  `;
  db.all(sql, (err, rows) => {
    if (err) {
      return callback(err);
    }
    callback(null, rows);
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
