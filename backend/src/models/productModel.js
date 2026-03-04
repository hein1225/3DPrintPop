const db = require('./db');

// 获取所有商品
function getAllProducts(callback) {
  const sql = `
    SELECT p.*, pr.selling_price
    FROM products p
    LEFT JOIN pricing pr ON p.id = pr.product_id
    ORDER BY p.created_at DESC
  `;
  db.all(sql, (err, rows) => {
    if (err) {
      return callback(err);
    }
    callback(null, rows);
  });
}

// 增加商品数量
function incrementProductQuantity(id, quantity, callback) {
  const sql = `
    UPDATE products 
    SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `;
  db.run(sql, [parseInt(quantity), id], (err) => {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

// 减少商品数量
function decrementProductQuantity(id, quantity, callback) {
  const sql = `
    UPDATE products 
    SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND quantity >= ?
  `;
  db.run(sql, [parseInt(quantity), id, parseInt(quantity)], (err) => {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

// 获取单个商品
function getProductById(id, callback) {
  const sql = 'SELECT * FROM products WHERE id = ?';
  db.get(sql, [id], (err, row) => {
    if (err) {
      return callback(err);
    }
    callback(null, row);
  });
}

// 创建商品
function createProduct(name, imageUrl, quantity, callback) {
  // 默认添加1个库存
  const defaultQuantity = quantity !== undefined ? quantity : 1;
  const sql = 'INSERT INTO products (name, image_url, quantity) VALUES (?, ?, ?)';
  db.run(sql, [name, imageUrl, defaultQuantity], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, this.lastID);
  });
}

// 更新商品
function updateProduct(id, name, imageUrl, callback) {
  const sql = 'UPDATE products SET name = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  db.run(sql, [name, imageUrl, id], (err) => {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

// 删除商品
function deleteProduct(id, callback) {
  const sql = 'DELETE FROM products WHERE id = ?';
  db.run(sql, [id], (err) => {
    if (err) {
      return callback(err);
    }
    callback(null);
  });
}

// 获取商品的耗材使用情况
function getProductMaterials(productId, callback) {
  const sql = `
    SELECT pm.*, m.color, m.type, m.price_per_gram
    FROM product_materials pm
    JOIN materials m ON pm.material_id = m.id
    WHERE pm.product_id = ?
  `;
  db.all(sql, [productId], (err, rows) => {
    if (err) {
      return callback(err);
    }
    callback(null, rows);
  });
}

// 获取商品的打印详情
function getProductPrintingDetails(productId, callback) {
  const sql = 'SELECT * FROM printing_details WHERE product_id = ?';
  db.get(sql, [productId], (err, row) => {
    if (err) {
      return callback(err);
    }
    callback(null, row);
  });
}

// 获取商品的定价信息
function getProductPricing(productId, callback) {
  const sql = 'SELECT * FROM pricing WHERE product_id = ?';
  db.get(sql, [productId], (err, row) => {
    if (err) {
      return callback(err);
    }
    callback(null, row);
  });
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductMaterials,
  getProductPrintingDetails,
  getProductPricing,
  incrementProductQuantity,
  decrementProductQuantity
};
