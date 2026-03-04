const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// 数据库路径
const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../../../data/database.db');

// 确保data目录存在
const fs = require('fs');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Created data directory:', dbDir);
}

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

// 初始化数据库表结构
function initializeDatabase() {
  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON;', (err) => {
    if (err) {
      console.error('Error enabling foreign keys:', err.message);
    } else {
      console.log('Foreign keys enabled.');
    }
  });

  // 创建admin表
  const adminTable = `
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 创建products表
  const productsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image_url TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 创建materials表
  const materialsTable = `
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      color TEXT NOT NULL,
      type TEXT NOT NULL,
      price_per_gram REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // 创建product_materials表
  const productMaterialsTable = `
    CREATE TABLE IF NOT EXISTS product_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      weight REAL NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials (id) ON DELETE CASCADE
    );
  `;

  // 创建printing_details表
  const printingDetailsTable = `
    CREATE TABLE IF NOT EXISTS printing_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      print_time REAL NOT NULL,
      power_consumption REAL NOT NULL,
      electricity_cost REAL NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
  `;

  // 创建pricing表
  const pricingTable = `
    CREATE TABLE IF NOT EXISTS pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      cost_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      profit REAL NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
  `;

  // 创建sales表
  const salesTable = `
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_amount REAL NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
  `;

  // 创建settings表
  const settingsTable = `
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );
  `;

  // 创建recommendations表
  const recommendationsTable = `
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      valid_date DATE NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );
  `;

  // 执行创建表的SQL语句
  db.serialize(() => {
    db.run(adminTable);
    db.run(productsTable);
    db.run(materialsTable);
    db.run(productMaterialsTable);
    db.run(printingDetailsTable);
    db.run(pricingTable);
    db.run(salesTable);
    db.run(settingsTable);
    db.run(recommendationsTable);

    // 设置默认值
    const defaultSettings = [
      { key: 'hourly_power_consumption', value: process.env.HOURLY_POWER_CONSUMPTION || '0.5' },
      { key: 'electricity_price', value: process.env.ELECTRICITY_PRICE || '0.6' }
    ];

    // 插入默认设置
    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    defaultSettings.forEach(setting => {
      insertSetting.run(setting.key, setting.value);
    });
    insertSetting.finalize();

    console.log('Database tables initialized successfully.');
  });
}

module.exports = db;
