const db = require('./db');

// 添加销售记录
function addSale(productId, quantity, totalAmount, callback) {
  const sql = 'INSERT INTO sales (product_id, quantity, total_amount) VALUES (?, ?, ?)';
  db.run(sql, [productId, quantity, totalAmount], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, this.lastID);
  });
}

// 获取销售统计
function getSalesStatistics(callback) {
  // 今日销售统计
  const todaySql = `
    SELECT COUNT(*) as sales_count, SUM(quantity) as total_quantity, SUM(total_amount) as total_amount
    FROM sales
    WHERE DATE(sale_date) = DATE('now')
  `;

  // 累计销售统计
  const totalSql = `
    SELECT COUNT(*) as sales_count, SUM(quantity) as total_quantity, SUM(total_amount) as total_amount
    FROM sales
  `;

  db.serialize(() => {
    let todayStats;
    let totalStats;

    db.get(todaySql, (err, todayRow) => {
      if (err) {
        return callback(err);
      }
      todayStats = todayRow;

      db.get(totalSql, (err, totalRow) => {
        if (err) {
          return callback(err);
        }
        totalStats = totalRow;

        // 获取商品销售情况
        const productSalesSql = `
          SELECT p.id, p.name, COUNT(s.id) as sales_count, SUM(s.quantity) as total_quantity, SUM(s.total_amount) as total_amount
          FROM products p
          LEFT JOIN sales s ON p.id = s.product_id
          GROUP BY p.id
          ORDER BY total_quantity DESC
        `;

        db.all(productSalesSql, (err, productRows) => {
          if (err) {
            return callback(err);
          }

          callback(null, {
            today: todayStats,
            total: totalStats,
            productSales: productRows
          });
        });
      });
    });
  });
}

// 获取商品的销售记录
function getProductSales(productId, callback) {
  const sql = `
    SELECT * FROM sales
    WHERE product_id = ?
    ORDER BY sale_date DESC
  `;
  db.all(sql, [productId], (err, rows) => {
    if (err) {
      return callback(err);
    }
    callback(null, rows);
  });
}

module.exports = {
  addSale,
  getSalesStatistics,
  getProductSales
};
