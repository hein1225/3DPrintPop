# 多阶段构建：第一阶段构建前端
FROM node:18-alpine AS frontend-builder

# 设置工作目录
WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./

# 安装前端依赖（构建过程需要devDependencies）
RUN npm install

# 复制前端源代码
COPY frontend/ ./

# 构建前端项目（指定输出目录为dist）
RUN npm run build -- --outDir=dist

# 多阶段构建：第二阶段构建后端
FROM node:18-alpine AS backend-builder

# 设置工作目录
WORKDIR /app/backend

# 复制后端依赖文件
COPY backend/package*.json ./

# 安装后端依赖（使用--only=production减少依赖大小）
RUN npm install --only=production

# 复制后端源代码
COPY backend/ ./

# 从第一阶段复制前端构建产物到后端的public目录
COPY --from=frontend-builder /app/frontend/dist /app/backend/public

# 最终阶段：运行时镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 从后端构建阶段复制文件
COPY --from=backend-builder /app/backend /app

# 创建数据目录（用于SQLite数据库）
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 清理不必要的文件
RUN rm -rf /app/node_modules/.cache

# 启动命令
CMD ["npm", "start"]