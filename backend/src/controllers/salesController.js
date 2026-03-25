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

// 获取所有销售记录
function getAllSales(req, res) {
  salesModel.getAllSales((err, sales) => {
    if (err) {
      return res.status(500).json({ message: '获取销售记录失败' });
    }
    res.json(sales);
  });
}

// 删除销售记录
function deleteSale(req, res) {
  const { id } = req.params;
  
  salesModel.deleteSale(id, (err) => {
    if (err) {
      return res.status(500).json({ message: '删除销售记录失败' });
    }
    res.json({ message: '销售记录删除成功' });
  });
}

// 批量删除销售记录
function deleteSales(req, res) {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ message: '请提供要删除的销售记录ID列表' });
  }
  
  salesModel.deleteSales(ids, (err) => {
    if (err) {
      return res.status(500).json({ message: '批量删除销售记录失败' });
    }
    res.json({ message: '销售记录批量删除成功' });
  });
}

module.exports = {
  addSale,
  getSalesStatistics,
  getProductSales,
  getAllSales,
  deleteSale,
  deleteSales
};
