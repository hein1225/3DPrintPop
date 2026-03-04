const salesModel = require('../models/salesModel');

// 添加销售记录
function addSale(req, res) {
  const { productId, quantity, totalAmount } = req.body;

  salesModel.addSale(productId, quantity, totalAmount, (err, saleId) => {
    if (err) {
      return res.status(500).json({ message: '添加销售记录失败' });
    }
    res.json({ message: '销售记录添加成功', saleId });
  });
}

// 获取销售统计
function getSalesStatistics(req, res) {
  salesModel.getSalesStatistics((err, statistics) => {
    if (err) {
      return res.status(500).json({ message: '获取销售统计失败' });
    }
    res.json(statistics);
  });
}

// 获取商品销售记录
function getProductSales(req, res) {
  const { productId } = req.params;

  salesModel.getProductSales(productId, (err, sales) => {
    if (err) {
      return res.status(500).json({ message: '获取销售记录失败' });
    }
    res.json(sales);
  });
}

module.exports = {
  addSale,
  getSalesStatistics,
  getProductSales
};
