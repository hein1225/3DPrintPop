const materialModel = require('../models/materialModel');

// 获取所有耗材
function getAllMaterials(req, res) {
  materialModel.getAllMaterials((err, materials) => {
    if (err) {
      return res.status(500).json({ message: '获取耗材失败' });
    }
    res.json(materials);
  });
}

// 添加耗材
function addMaterial(req, res) {
  const { color, type, pricePerGram } = req.body;

  materialModel.createMaterial(color, type, pricePerGram, (err, materialId) => {
    if (err) {
      return res.status(500).json({ message: '添加耗材失败' });
    }
    res.json({ message: '耗材添加成功', materialId });
  });
}

// 更新耗材
function updateMaterial(req, res) {
  const { id } = req.params;
  const { color, type, pricePerGram } = req.body;

  materialModel.updateMaterial(id, color, type, pricePerGram, (err) => {
    if (err) {
      return res.status(500).json({ message: '更新耗材失败' });
    }
    res.json({ message: '耗材更新成功' });
  });
}

// 删除耗材
function deleteMaterial(req, res) {
  const { id } = req.params;

  materialModel.deleteMaterial(id, (err) => {
    if (err) {
      return res.status(500).json({ message: '删除耗材失败' });
    }
    res.json({ message: '耗材删除成功' });
  });
}

// 获取耗材使用总量
function getMaterialUsageTotal(req, res) {
  materialModel.getMaterialUsageTotal((err, usage) => {
    if (err) {
      return res.status(500).json({ message: '获取耗材使用总量失败' });
    }
    res.json(usage);
  });
}

module.exports = {
  getAllMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialUsageTotal
};
