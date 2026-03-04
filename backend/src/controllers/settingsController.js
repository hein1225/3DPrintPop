const settingsModel = require('../models/settingsModel');
const db = require('../models/db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const calculationService = require('../services/calculationService');
const logger = require('../utils/logger');

// 配置multer用于文件上传
const upload = multer({
  dest: path.join(__dirname, '../../uploads/'),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  }
});

// 获取所有设置
function getAllSettings(req, res) {
  settingsModel.getAllSettings((err, settings) => {
    if (err) {
      return res.status(500).json({ message: '获取设置失败' });
    }
    res.json(settings);
  });
}

// 更新设置
function updateSettings(req, res) {
  const settings = req.body;

  settingsModel.updateSettings(settings, (err) => {
    if (err) {
      return res.status(500).json({ message: '更新设置失败' });
    }

    // 获取更新后的设置
    settingsModel.getAllSettings((err, updatedSettings) => {
      if (err) {
        logger.error('获取更新后的设置失败', { error: err.message });
        // 即使获取设置失败，也要返回成功消息，因为设置已经更新
        return res.json({ message: '设置更新成功，但重新计算商品成本失败' });
      }

      // 重新计算所有商品的成本和利润
      recalculateAllProducts(updatedSettings, (recalcErr) => {
        if (recalcErr) {
          logger.error('重新计算商品成本失败', { error: recalcErr.message });
          // 即使重新计算失败，也要返回成功消息，因为设置已经更新
          return res.json({ message: '设置更新成功，但重新计算商品成本失败' });
        }

        logger.info('所有商品成本重新计算成功');
        res.json({ message: '设置更新成功，所有商品成本已重新计算' });
      });
    });
  });
}

// 重新计算所有商品的成本和利润
function recalculateAllProducts(settings, callback) {
  try {
    const hourlyPowerConsumption = parseFloat(settings.hourly_power_consumption) || 0.5;
    const electricityPrice = parseFloat(settings.electricity_price) || 0.6;

    // 获取所有商品
    db.all('SELECT id, name FROM products', [], (err, products) => {
      if (err) {
        return callback(new Error('获取商品列表失败'));
      }

      // 遍历每个商品，重新计算成本和利润
      let processedCount = 0;
      let errorOccurred = false;

      if (products.length === 0) {
        return callback(null);
      }

      products.forEach((product) => {
        // 获取商品的打印时间
        db.get('SELECT print_time FROM printing_details WHERE product_id = ?', [product.id], (err, printDetails) => {
          if (err || !printDetails) {
            if (!errorOccurred) {
              errorOccurred = true;
              return callback(new Error(`获取商品 ${product.id} 的打印详情失败`));
            }
            return;
          }

          // 获取商品使用的耗材
          db.all('SELECT pm.weight, m.price_per_gram FROM product_materials pm JOIN materials m ON pm.material_id = m.id WHERE pm.product_id = ?', [product.id], (err, materialUsages) => {
            if (err) {
              if (!errorOccurred) {
                errorOccurred = true;
                return callback(new Error(`获取商品 ${product.id} 的耗材使用情况失败`));
              }
              return;
            }

            // 获取当前售价
            db.get('SELECT selling_price FROM pricing WHERE product_id = ?', [product.id], (err, pricing) => {
              if (err || !pricing) {
                if (!errorOccurred) {
                  errorOccurred = true;
                  return callback(new Error(`获取商品 ${product.id} 的定价信息失败`));
                }
                return;
              }

              // 重新计算成本和利润
              const { powerConsumption, electricityCost, materialCost, costPrice } = calculationService.calculateCostAndProfit(
                parseFloat(printDetails.print_time),
                materialUsages,
                hourlyPowerConsumption,
                electricityPrice
              );

              const profit = calculationService.calculateProfit(costPrice, parseFloat(pricing.selling_price));

              // 更新打印详情
              db.run(
                'UPDATE printing_details SET power_consumption = ?, electricity_cost = ? WHERE product_id = ?',
                [powerConsumption, electricityCost, product.id],
                (err) => {
                  if (err) {
                    if (!errorOccurred) {
                      errorOccurred = true;
                      return callback(new Error(`更新商品 ${product.id} 的打印详情失败`));
                    }
                    return;
                  }

                  // 更新定价信息
                  db.run(
                    'UPDATE pricing SET cost_price = ?, profit = ? WHERE product_id = ?',
                    [costPrice, profit, product.id],
                    (err) => {
                      if (err) {
                        if (!errorOccurred) {
                          errorOccurred = true;
                          return callback(new Error(`更新商品 ${product.id} 的定价信息失败`));
                        }
                        return;
                      }

                      processedCount++;
                      if (processedCount === products.length) {
                        callback(null);
                      }
                    }
                  );
                }
              );
            });
          });
        });
      });
    });
  } catch (error) {
    callback(error);
  }
}

// 获取今日推荐和特价
function getRecommendations(req, res) {
  const today = new Date().toISOString().split('T')[0];

  const recommendedSql = `
    SELECT p.*, pr.selling_price
    FROM products p
    JOIN recommendations r ON p.id = r.product_id
    JOIN pricing pr ON p.id = pr.product_id
    WHERE r.type = 'recommended' AND r.valid_date >= ?
    ORDER BY r.id LIMIT 5
  `;

  const specialSql = `
    SELECT p.*, pr.selling_price
    FROM products p
    JOIN recommendations r ON p.id = r.product_id
    JOIN pricing pr ON p.id = pr.product_id
    WHERE r.type = 'special' AND r.valid_date >= ?
    ORDER BY r.id LIMIT 5
  `;

  db.serialize(() => {
    let recommended = [];
    let special = [];

    db.all(recommendedSql, [today], (err, recommendedRows) => {
      if (err) {
        return res.status(500).json({ message: '获取推荐商品失败' });
      }
      recommended = recommendedRows;

      db.all(specialSql, [today], (err, specialRows) => {
        if (err) {
          return res.status(500).json({ message: '获取特价商品失败' });
        }
        special = specialRows;

        res.json({
          recommended,
          special
        });
      });
    });
  });
}

// 设置今日推荐
function setRecommended(req, res) {
  const { productIds } = req.body;
  // 使用当前日期作为有效日期
  const currentDate = new Date().toISOString().split('T')[0];

  // 删除旧的推荐
  db.run('DELETE FROM recommendations WHERE type = ?', ['recommended'], (err) => {
    if (err) {
      logger.error('删除旧推荐失败', { error: err.message });
      return res.status(500).json({ message: '删除旧推荐失败' });
    }

    // 添加新的推荐
    const insertStmt = db.prepare('INSERT INTO recommendations (product_id, type, valid_date) VALUES (?, ?, ?)');
    let errorOccurred = false;

    productIds.forEach((productId, index) => {
      insertStmt.run([productId, 'recommended', currentDate], (err) => {
        if (err && !errorOccurred) {
          errorOccurred = true;
          return res.status(500).json({ message: '添加推荐商品失败' });
        }
        if (index === productIds.length - 1 && !errorOccurred) {
          insertStmt.finalize();
          res.json({ message: '推荐商品设置成功' });
        }
      });
    });

    if (productIds.length === 0) {
      insertStmt.finalize();
      res.json({ message: '推荐商品设置成功' });
    }
  });
}

// 设置今日特价
function setSpecial(req, res) {
  const { productIds } = req.body;
  // 使用当前日期作为有效日期
  const currentDate = new Date().toISOString().split('T')[0];

  // 删除旧的特价
  db.run('DELETE FROM recommendations WHERE type = ?', ['special'], (err) => {
    if (err) {
      logger.error('删除旧特价失败', { error: err.message });
      return res.status(500).json({ message: '删除旧特价失败' });
    }

    // 添加新的特价
    const insertStmt = db.prepare('INSERT INTO recommendations (product_id, type, valid_date) VALUES (?, ?, ?)');
    let errorOccurred = false;

    productIds.forEach((productId, index) => {
      insertStmt.run([productId, 'special', currentDate], (err) => {
        if (err && !errorOccurred) {
          errorOccurred = true;
          return res.status(500).json({ message: '添加特价商品失败' });
        }
        if (index === productIds.length - 1 && !errorOccurred) {
          insertStmt.finalize();
          res.json({ message: '特价商品设置成功' });
        }
      });
    });

    if (productIds.length === 0) {
      insertStmt.finalize();
      res.json({ message: '特价商品设置成功' });
    }
  });
}

// 备份数据库
function backupDatabase(req, res) {
  try {
    // 使用与db.js相同的绝对路径逻辑
    const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../../data/database.db');
    const backupPath = `${dbPath}.backup.${Date.now()}`;

    // 读取数据库文件
    const dbContent = fs.readFileSync(dbPath);
    // 写入备份文件
    fs.writeFileSync(backupPath, dbContent);

    res.json({ message: '数据库备份成功', backupPath: path.basename(backupPath) });
  } catch (error) {
    res.status(500).json({ message: '数据库备份失败', error: error.message });
  }
}

// 还原数据库
function restoreDatabase(req, res) {
  try {
    const { backupFile } = req.body;
    const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../../data/database.db');
    const backupPath = `${dbPath}.backup.${backupFile}`;

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ message: '备份文件不存在' });
    }

    // 读取备份文件
    const backupContent = fs.readFileSync(backupPath);
    // 写入数据库文件
    fs.writeFileSync(dbPath, backupContent);

    res.json({ message: '数据库还原成功' });
  } catch (error) {
    res.status(500).json({ message: '数据库还原失败', error: error.message });
  }
}

// 获取所有备份文件
function getBackupFiles(req, res) {
  try {
    const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../../data/database.db');
    const backupDir = path.dirname(dbPath);
    
    // 确保备份目录存在
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      return res.json([]);
    }
    
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith(path.basename(dbPath) + '.backup.'))
      .sort((a, b) => {
        const aTime = parseInt(a.split('.').pop());
        const bTime = parseInt(b.split('.').pop());
        return bTime - aTime; // 按时间倒序
      })
      .map(file => ({
        name: file,
        timestamp: parseInt(file.split('.').pop())
      }));

    res.json(backupFiles);
  } catch (error) {
    res.status(500).json({ message: '获取备份文件失败', error: error.message });
  }
}

// 删除备份文件
function deleteBackup(req, res) {
  try {
    const { timestamp } = req.params;
    const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../../data/database.db');
    const backupPath = `${dbPath}.backup.${timestamp}`;

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ message: '备份文件不存在' });
    }

    // 删除备份文件
    fs.unlinkSync(backupPath);

    res.json({ message: '备份文件删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除备份文件失败', error: error.message });
  }
}

// 下载备份文件
function downloadBackup(req, res) {
  try {
    const { timestamp } = req.params;
    const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../../data/database.db');
    const backupPath = `${dbPath}.backup.${timestamp}`;

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ message: '备份文件不存在' });
    }

    // 设置下载响应头
    res.setHeader('Content-Disposition', `attachment; filename="backup-${timestamp}.db"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // 读取并发送文件
    const fileStream = fs.createReadStream(backupPath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: '下载备份文件失败', error: error.message });
  }
}

// 从上传文件还原数据库
function restoreDatabaseFromFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '未收到备份文件' });
    }

    const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../../data/database.db');
    const uploadedFilePath = req.file.path;

    // 读取上传的备份文件
    const backupContent = fs.readFileSync(uploadedFilePath);
    // 写入数据库文件
    fs.writeFileSync(dbPath, backupContent);

    // 删除临时上传的文件
    fs.unlinkSync(uploadedFilePath);

    res.json({ message: '数据库还原成功' });
  } catch (error) {
    // 删除临时文件（如果存在）
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: '数据库还原失败', error: error.message });
  }
}

// 重置数据
function resetDatabase(req, res) {
  try {
    db.serialize(() => {
      // 开启事务
      db.run('BEGIN TRANSACTION');

      // 删除所有数据（保留admin和settings表）
      const tablesToClear = ['products', 'materials', 'product_materials', 'printing_details', 'pricing', 'sales', 'recommendations'];
      
      tablesToClear.forEach(table => {
        db.run(`DELETE FROM ${table}`);
      });

      // 重置自增ID
      tablesToClear.forEach(table => {
        db.run(`DELETE FROM sqlite_sequence WHERE name = '${table}'`);
      });

      // 提交事务
      db.run('COMMIT');

      res.json({ message: '数据重置成功' });
    });
  } catch (error) {
    // 回滚事务
    db.run('ROLLBACK');
    res.status(500).json({ message: '数据重置失败', error: error.message });
  }
}

// 设置主页访问密码
function setHomePassword(req, res) {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ message: '密码不能为空' });
  }
  
  // 加密密码
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: '密码加密失败' });
    }
    
    // 保存密码到settings表
    settingsModel.updateSetting('home_page_password', hashedPassword, (err) => {
      if (err) {
        return res.status(500).json({ message: '保存密码失败' });
      }
      res.json({ message: '主页密码设置成功' });
    });
  });
}

// 验证主页访问密码
function verifyHomePassword(req, res) {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ message: '密码不能为空' });
  }
  
  // 获取密码哈希
  settingsModel.getSetting('home_page_password', (err, passwordHash) => {
    if (err) {
      return res.status(500).json({ message: '获取密码失败' });
    }
    
    if (!passwordHash) {
      // 没有设置密码，直接通过
      return res.json({ valid: true });
    }
    
    // 验证密码
    bcrypt.compare(password, passwordHash, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ message: '密码验证失败' });
      }
      
      res.json({ valid: isMatch });
    });
  });
}

// 检查主页密码是否已设置
function checkHomePasswordStatus(req, res) {
  settingsModel.getSetting('home_page_password', (err, passwordHash) => {
    if (err) {
      return res.status(500).json({ message: '获取密码状态失败' });
    }
    res.json({ passwordSet: !!passwordHash });
  });
}

module.exports = {
  getAllSettings,
  updateSettings,
  getRecommendations,
  setRecommended,
  setSpecial,
  backupDatabase,
  restoreDatabase,
  restoreDatabaseFromFile,
  getBackupFiles,
  deleteBackup,
  downloadBackup,
  resetDatabase,
  setHomePassword,
  verifyHomePassword,
  checkHomePasswordStatus
};
