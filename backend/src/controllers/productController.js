const productModel = require('../models/productModel');
const db = require('../models/db');
const imageService = require('../services/imageService');
const calculationService = require('../services/calculationService');
const settingsModel = require('../models/settingsModel');
const logger = require('../utils/logger');

// 图片上传配置
const multer = require('multer');
const path = require('path');
const upload = multer({ storage: multer.memoryStorage() });

// 获取所有商品
function getAllProducts(req, res) {
  productModel.getAllProducts((err, products) => {
    if (err) {
      return res.status(500).json({ message: '获取商品失败' });
    }
    res.json(products);
  });
}

// 获取单个商品详情
function getProductDetails(req, res) {
  const { id } = req.params;

  db.serialize(() => {
    let product;
    let materials;
    let printingDetails;
    let pricing;

    productModel.getProductById(id, (err, productRow) => {
      if (err) {
        return res.status(500).json({ message: '获取商品信息失败' });
      }
      if (!productRow) {
        return res.status(404).json({ message: '商品不存在' });
      }
      product = productRow;

      productModel.getProductMaterials(id, (err, materialRows) => {
        if (err) {
          return res.status(500).json({ message: '获取耗材信息失败' });
        }
        materials = materialRows;

        productModel.getProductPrintingDetails(id, (err, printingRow) => {
          if (err) {
            return res.status(500).json({ message: '获取打印信息失败' });
          }
          printingDetails = printingRow;

          productModel.getProductPricing(id, (err, pricingRow) => {
            if (err) {
              return res.status(500).json({ message: '获取定价信息失败' });
            }
            pricing = pricingRow;

            res.json({
              product,
              materials,
              printingDetails,
              pricing
            });
          });
        });
      });
    });
  });
}

// 添加商品
async function addProduct(req, res) {
  try {
    logger.info('开始添加商品', { body: req.body });
    const { name, materials, printTime } = req.body;
    const file = req.file;

    if (!file) {
      logger.error('添加商品失败：未提供商品图片', { name, materials, printTime });
      return res.status(400).json({ message: '未提供商品图片' });
    }

    // 压缩并保存图片
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../public/uploads');
    const filename = `${Date.now()}_${path.extname(file.originalname)}`;
    const filePath = await imageService.compressAndSaveImage(file, uploadDir, filename);
    const imageUrl = `/uploads/${filename}`;
    logger.info('图片压缩并保存成功', { filename, imageUrl });

    const showOnHome = req.body.showOnHome === 'false' ? 0 : 1;
    // 创建商品
    productModel.createProduct(name, imageUrl, showOnHome, (err, productId) => {
      if (err) {
        logger.error('创建商品失败', { name, imageUrl, showOnHome, error: err.message });
        imageService.deleteImage(filePath);
        return res.status(500).json({ message: '创建商品失败' });
      }
      logger.info('商品创建成功', { productId, name, imageUrl, showOnHome });

      // 获取设置
      settingsModel.getAllSettings((err, settings) => {
        if (err) {
          logger.error('获取设置失败', { error: err.message });
          return res.status(500).json({ message: '获取设置失败' });
        }

        const hourlyPowerConsumption = parseFloat(settings.hourly_power_consumption) || 0.5;
        const electricityPrice = parseFloat(settings.electricity_price) || 0.6;

        // 计算成本
        try {
          const { powerConsumption, electricityCost, materialCost, costPrice } = calculationService.calculateCostAndProfit(
            parseFloat(printTime),
            JSON.parse(materials).map(m => ({
              weight: parseFloat(m.weight),
              price_per_gram: parseFloat(m.pricePerGram)
            })),
            hourlyPowerConsumption,
            electricityPrice
          );

          logger.info('成本计算成功', { productId, costPrice });

          // 保存打印详情
          db.run(
            'INSERT INTO printing_details (product_id, print_time, power_consumption, electricity_cost) VALUES (?, ?, ?, ?)',
            [productId, printTime, powerConsumption, electricityCost],
            (err) => {
              if (err) {
                logger.error('保存打印详情失败', { productId, error: err.message });
                return res.status(500).json({ message: '保存打印详情失败' });
              }

              // 保存定价信息（不包含售价和利润，这些在销售时输入）
              db.run(
                'INSERT INTO pricing (product_id, cost_price, selling_price, profit) VALUES (?, ?, ?, ?)',
                [productId, costPrice, 0, 0],
                (err) => {
                  if (err) {
                    logger.error('保存定价信息失败', { productId, error: err.message });
                    return res.status(500).json({ message: '保存定价信息失败' });
                  }

                  // 保存耗材使用情况
                  const materialUsage = JSON.parse(materials);
                  const insertMaterialStmt = db.prepare(
                    'INSERT INTO product_materials (product_id, material_id, weight) VALUES (?, ?, ?)'
                  );

                  let errorOccurred = false;

                  materialUsage.forEach((material, index) => {
                    insertMaterialStmt.run(
                      [productId, parseInt(material.materialId), parseFloat(material.weight)],
                      (err) => {
                        if (err && !errorOccurred) {
                          errorOccurred = true;
                          logger.error('保存耗材使用情况失败', { productId, material: material, error: err.message });
                          return res.status(500).json({ message: '保存耗材使用情况失败' });
                        }
                        if (index === materialUsage.length - 1 && !errorOccurred) {
                          insertMaterialStmt.finalize();
                          logger.info('商品添加成功完成', { productId, name });
                          res.json({ message: '商品添加成功', productId });
                        }
                      }
                    );
                  });

                  if (materialUsage.length === 0) {
                    insertMaterialStmt.finalize();
                    logger.info('商品添加成功完成（无耗材）', { productId, name });
                    res.json({ message: '商品添加成功', productId });
                  }
                }
              );
            }
          );
        } catch (error) {
          logger.error('成本计算失败', { productId, error: error.message });
          return res.status(500).json({ message: '成本计算失败', error: error.message });
        }
      });
    });
  } catch (error) {
    logger.error('添加商品失败', { error: error.message, stack: error.stack });
    res.status(500).json({ message: '添加商品失败', error: error.message });
  }
}

// 更新商品
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
  const { name, materials, printTime, showOnHome } = req.body;
  const file = req.file;

    // 检查商品是否存在
    productModel.getProductById(id, (err, product) => {
      if (err) {
        return res.status(500).json({ message: '获取商品信息失败' });
      }
      if (!product) {
        return res.status(404).json({ message: '商品不存在' });
      }

      const oldImageUrl = product.image_url;
      let imageUrl = oldImageUrl;
      let newFilePath;

      // 如果提供了新图片，压缩并保存
      if (file) {
        const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../public/uploads');
        const filename = `${Date.now()}_${path.extname(file.originalname)}`;
        const filePath = uploadDir + '/' + filename;

        imageService.compressAndSaveImage(file, uploadDir, filename)
          .then(filePath => {
            newFilePath = filePath;
            imageUrl = `/uploads/${filename}`;
            updateProductData();
          })
          .catch(err => {
            logger.error('图片处理失败', { error: err.message });
            res.status(500).json({ message: '图片处理失败' });
          });
      } else {
        updateProductData();
      }

      function updateProductData() {
        // 处理showOnHome参数
        const showOnHomeValue = showOnHome === 'false' ? 0 : 1;
        // 更新商品基本信息
        productModel.updateProduct(id, name, imageUrl, showOnHomeValue, (err) => {
          if (err) {
            logger.error('更新商品信息失败', { error: err.message });
            // 如果有新图片，删除它
            if (newFilePath) {
              imageService.deleteImage(newFilePath).catch(deleteErr => {
                logger.error('回滚新图片失败', { error: deleteErr.message });
              });
            }
            return res.status(500).json({ message: '更新商品信息失败' });
          }

          // 获取设置
          settingsModel.getAllSettings((err, settings) => {
            if (err) {
              logger.error('获取设置失败', { error: err.message });
              return res.status(500).json({ message: '获取设置失败' });
            }

            const hourlyPowerConsumption = parseFloat(settings.hourly_power_consumption) || 0.5;
            const electricityPrice = parseFloat(settings.electricity_price) || 0.6;

            // 计算成本
            const { powerConsumption, electricityCost, materialCost, costPrice } = calculationService.calculateCostAndProfit(
              parseFloat(printTime),
              JSON.parse(materials).map(m => ({
                weight: parseFloat(m.weight),
                price_per_gram: parseFloat(m.pricePerGram)
              })),
              hourlyPowerConsumption,
              electricityPrice
            );

            // 更新打印详情
            db.run(
              'UPDATE printing_details SET print_time = ?, power_consumption = ?, electricity_cost = ? WHERE product_id = ?',
              [printTime, powerConsumption, electricityCost, id],
              (err) => {
                if (err) {
                  logger.error('更新打印详情失败', { error: err.message });
                  return res.status(500).json({ message: '更新打印详情失败' });
                }

                // 更新定价信息（只更新成本，售价和利润保持不变）
                db.run(
                  'UPDATE pricing SET cost_price = ? WHERE product_id = ?',
                  [costPrice, id],
                  (err) => {
                    if (err) {
                      logger.error('更新定价信息失败', { error: err.message });
                      return res.status(500).json({ message: '更新定价信息失败' });
                    }

                    // 删除旧的耗材使用情况
                    db.run(
                      'DELETE FROM product_materials WHERE product_id = ?',
                      [id],
                      (err) => {
                        if (err) {
                          logger.error('删除旧耗材使用情况失败', { error: err.message });
                          return res.status(500).json({ message: '删除旧耗材使用情况失败' });
                        }

                        // 保存新的耗材使用情况
                        const materialUsage = JSON.parse(materials);
                        const insertMaterialStmt = db.prepare(
                          'INSERT INTO product_materials (product_id, material_id, weight) VALUES (?, ?, ?)'
                        );

                        let errorOccurred = false;

                        materialUsage.forEach((material, index) => {
                          insertMaterialStmt.run(
                            [id, parseInt(material.materialId), parseFloat(material.weight)],
                            (err) => {
                              if (err && !errorOccurred) {
                                errorOccurred = true;
                                logger.error('保存新耗材使用情况失败', { error: err.message });
                                return res.status(500).json({ message: '保存新耗材使用情况失败' });
                              }
                              if (index === materialUsage.length - 1 && !errorOccurred) {
                                insertMaterialStmt.finalize();
                                
                                // 如果更新了图片，删除旧图片
                                if (oldImageUrl !== imageUrl) {
                                  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../public/uploads');
                                  const oldFilePath = uploadDir + oldImageUrl.replace('/uploads/', '/');
                                  imageService.deleteImage(oldFilePath)
                                    .then(() => {
                                      logger.info('旧图片删除成功', { oldImageUrl });
                                    })
                                    .catch(deleteErr => {
                                      logger.error('删除旧图片失败', { error: deleteErr.message, oldImageUrl });
                                    });
                                }
                                
                                logger.info('商品更新成功', { productId: id });
                                res.json({ message: '商品更新成功' });
                              }
                            }
                          );
                        });

                        if (materialUsage.length === 0) {
                          insertMaterialStmt.finalize();
                          
                          // 如果更新了图片，删除旧图片
                          if (oldImageUrl !== imageUrl) {
                            const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../public/uploads');
                            const oldFilePath = uploadDir + oldImageUrl.replace('/uploads/', '/');
                            imageService.deleteImage(oldFilePath)
                              .then(() => {
                                logger.info('旧图片删除成功', { oldImageUrl });
                              })
                              .catch(deleteErr => {
                                logger.error('删除旧图片失败', { error: deleteErr.message, oldImageUrl });
                              });
                          }
                          
                          logger.info('商品更新成功（无耗材）', { productId: id });
                          res.json({ message: '商品更新成功' });
                        }
                      }
                    );
                  }
                );
              }
            );
          });
        });
      }
    });
  } catch (error) {
    logger.error('更新商品失败', { error: error.message, stack: error.stack });
    res.status(500).json({ message: '更新商品失败', error: error.message });
  }
}

// 删除商品
function deleteProduct(req, res) {
  const { id } = req.params;
  logger.info('开始删除商品', { productId: id });

  productModel.getProductById(id, (err, product) => {
    if (err) {
      logger.error('获取商品信息失败', { productId: id, error: err.message });
      return res.status(500).json({ message: '获取商品信息失败' });
    }
    if (!product) {
      logger.warn('商品不存在', { productId: id });
      return res.status(404).json({ message: '商品不存在' });
    }

    const imageUrl = product.image_url;
    
    // 删除商品（会级联删除相关数据）
    productModel.deleteProduct(id, (err) => {
      if (err) {
        logger.error('删除商品失败', { productId: id, error: err.message });
        return res.status(500).json({ message: '删除商品失败' });
      }

      logger.info('商品数据删除成功', { productId: id });
      
      // 删除图片文件
      const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../public/uploads');
      const filePath = uploadDir + imageUrl.replace('/uploads/', '/');
      
      try {
        imageService.deleteImage(filePath);
        logger.info('图片删除成功', { productId: id, imageUrl });
      } catch (deleteErr) {
        logger.error('删除图片失败', { productId: id, imageUrl, error: deleteErr.message });
      };

      res.json({ message: '商品删除成功' });
    });
  });
}

// 更新商品售价
function updateProductPrice(req, res) {
  const { id } = req.params;
  const { sellingPrice } = req.body;

  // 获取当前成本价
  db.get('SELECT cost_price FROM pricing WHERE product_id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: '获取成本价失败' });
    }
    if (!row) {
      return res.status(404).json({ message: '商品定价信息不存在' });
    }

    const costPrice = row.cost_price;
    const profit = calculationService.calculateProfit(costPrice, parseFloat(sellingPrice));

    // 更新售价和利润
    db.run(
      'UPDATE pricing SET selling_price = ?, profit = ? WHERE product_id = ?',
      [sellingPrice, profit, id],
      (err) => {
        if (err) {
          return res.status(500).json({ message: '更新售价失败' });
        }
        res.json({ message: '售价更新成功' });
      }
    );
  });
}

// 售出一件商品
function sellOneProduct(req, res) {
  const { id } = req.params;
  const { sellingPrice } = req.body;

  // 验证销售价格
  if (!sellingPrice || isNaN(sellingPrice) || parseFloat(sellingPrice) <= 0) {
    return res.status(400).json({ message: '无效的销售价格' });
  }

  // 记录销售
  db.run(
    'INSERT INTO sales (product_id, quantity, total_amount) VALUES (?, ?, ?)',
    [id, 1, parseFloat(sellingPrice)],
    (err) => {
      if (err) {
        return res.status(500).json({ message: '记录销售失败' });
      }
      res.json({ message: '商品售出成功' });
    }
  );
}



// 更新商品显示状态
function updateProductShowStatus(req, res) {
  const { id } = req.params;
  const { showOnHome } = req.body;
  const showOnHomeValue = showOnHome ? 1 : 0;

  logger.info('开始更新商品显示状态', { productId: id, showOnHome, showOnHomeValue });

  productModel.updateProductShowStatus(id, showOnHomeValue, (err) => {
    if (err) {
      logger.error('更新商品显示状态失败', { productId: id, error: err.message });
      return res.status(500).json({ message: '更新商品显示状态失败', error: err.message });
    }
    logger.info('商品显示状态更新成功', { productId: id, showOnHomeValue });
    res.json({ message: '商品显示状态更新成功' });
  });
}

module.exports = {
  upload,
  getAllProducts,
  getProductDetails,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductPrice,
  sellOneProduct,
  updateProductShowStatus
};
