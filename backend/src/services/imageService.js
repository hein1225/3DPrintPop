const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// 确保上传目录存在
function ensureUploadDir(uploadDir) {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
      logger.info(`成功创建上传目录: ${uploadDir}`);
    } else {
      logger.info(`上传目录已存在: ${uploadDir}`);
    }
  } catch (error) {
    logger.error(`创建上传目录失败: ${uploadDir}`, { error: error.message });
    throw new Error('创建上传目录失败: ' + error.message);
  }
}

// 压缩并保存图片
async function compressAndSaveImage(file, uploadDir, filename) {
  try {
    ensureUploadDir(uploadDir);
    const filepath = path.join(uploadDir, filename);
    logger.info(`开始处理图片: ${filename}`);

    // 检测图片格式
    const imageInfo = await sharp(file.buffer).metadata();
    const format = imageInfo.format || 'jpeg';
    logger.info(`图片格式检测: ${format}`, { width: imageInfo.width, height: imageInfo.height });

    // 压缩图片到合适大小（最大宽度800px，最大高度600px，质量80%）
    const sharpInstance = sharp(file.buffer)
      .resize({ 
        width: 800, 
        height: 600, 
        fit: 'cover',
        withoutEnlargement: true
      });

    // 根据原格式保存
    let processedImage;
    if (format === 'png') {
      processedImage = await sharpInstance
        .png({
          quality: 80,
          compressionLevel: 6
        })
        .toFile(filepath);
    } else {
      processedImage = await sharpInstance
        .jpeg({
          quality: 80,
          mozjpeg: true
        })
        .toFile(filepath);
    }

    logger.info(`图片处理成功: ${filename}`, { 
      outputPath: filepath, 
      size: processedImage.size, 
      width: processedImage.width, 
      height: processedImage.height 
    });

    return filepath;
  } catch (error) {
    logger.error(`图片处理失败: ${filename}`, { error: error.message, stack: error.stack });
    throw new Error('图片处理失败: ' + error.message);
  }
}

// 删除图片
function deleteImage(filepath) {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      logger.info(`图片删除成功: ${filepath}`);
      return true;
    } else {
      logger.warn(`图片文件不存在: ${filepath}`);
      return false;
    }
  } catch (error) {
    logger.error(`图片删除失败: ${filepath}`, { error: error.message });
    throw new Error('图片删除失败: ' + error.message);
  }
}

module.exports = {
  compressAndSaveImage,
  deleteImage,
  ensureUploadDir
};
