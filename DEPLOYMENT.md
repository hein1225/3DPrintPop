# 3D打印助手部署指南

## 项目概述
本项目采用前后端分离架构，前端使用React + Vite开发，后端使用Express + SQLite开发。在生产环境中，前端代码会被构建到后端的public目录，由后端Express服务器同时提供前端静态文件和后端API服务，只需要一个端口3000。

## 本地开发环境

### 前端开发
- **端口**: 5173
- **配置文件**: `frontend/vite.config.js`
- **代理设置**: 已配置将所有`/api`请求代理到后端`http://localhost:3000`

### 后端开发
- **端口**: 3000
- **配置文件**: `backend/server.js`
- **静态文件服务**: 提供`public`目录下的静态文件

## 生产环境部署

### 1. 构建前端项目
```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 构建前端项目，输出到后端的public目录
npm run build
```

### 2. 启动后端服务
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 设置环境变量
# 创建.env文件，包含以下内容：
# JWT_SECRET=your_jwt_secret

# 启动后端服务
npm start
```

### 3. 访问应用
- **访问地址**: http://localhost:3000
- **功能**: 后端服务器同时提供前端静态文件和后端API服务

## Zeabur部署指南

### 1. 需要上传到Zeabur的文件

仅需上传`backend/`目录即可，该目录已包含所有必要的代码和资源：
| 文件/目录 | 说明 | 必须上传 |
| --- | --- | --- |
| `backend/` | 后端代码和配置（已包含构建好的前端静态文件） | ✅ |

### 2. Zeabur构建配置

#### 构建命令
```bash
# 安装后端依赖
npm install
```

#### 启动命令
```bash
# 启动后端服务
npm start
```

#### 端口设置
- **暴露端口**: 3000
- **环境变量**: 自动从`.env`文件读取，或在Zeabur控制台设置

### 3. Zeabur环境变量配置

在Zeabur控制台的「环境变量」页面，添加以下环境变量：

| 变量名 | 说明 | 默认值 | 是否必须 |
| --- | --- | --- | --- |
| `PORT` | 后端服务端口 | 3000 | ✅ |
| `JWT_SECRET` | JWT签名密钥 | your-secret-key-here | ✅（生产环境必须修改） |
| `NODE_ENV` | 运行环境 | development | ✅（生产环境建议设置为production） |
| `HOURLY_POWER_CONSUMPTION` | 每小时功耗（度） | 0.5 | ❌ |
| `ELECTRICITY_PRICE` | 电费价格（元/度） | 0.6 | ❌ |

### 4. 部署步骤

1. **创建Zeabur项目**
   - 登录Zeabur控制台
   - 点击「创建项目」
   - 选择「从Git部署」或「上传代码」

2. **上传代码**
   - 方法一：通过Git连接部署
     - 推送代码到GitHub/GitLab仓库
     - 在Zeabur中连接该仓库
   - 方法二：直接上传代码
     - 下载项目的ZIP压缩包
     - 在Zeabur中上传该ZIP文件

3. **配置构建和启动命令**
   - 在「服务」页面，点击「设置」
   - 在「构建」标签页，配置构建命令和启动命令
   - 在「端口」标签页，确保暴露端口3000

4. **配置环境变量**
   - 在「环境变量」标签页，添加所需的环境变量

5. **部署服务**
   - 点击「部署」按钮，等待部署完成
   - 部署完成后，获取分配的域名

6. **访问应用**
   - 使用Zeabur分配的域名访问应用
   - 例如：https://your-app.zeabur.app

### 5. Zeabur部署注意事项

1. **数据库文件**
   - SQLite数据库文件位于`backend/data/database.db`
   - Zeabur的文件系统是临时的，重启服务后会丢失数据
   - **建议**：定期备份数据库文件，或考虑使用Zeabur提供的数据库服务

2. **构建缓存**
   - Zeabur会缓存构建依赖，加速后续部署
   - 如果依赖有更新，会自动重新安装

3. **日志查看**
   - 在Zeabur控制台的「日志」页面，可以查看应用运行日志
   - 后端日志会输出到控制台，便于调试

4. **自动部署**
   - 如果通过Git连接部署，推送代码到仓库会自动触发部署
   - 可以在「触发器」页面配置自动部署规则

## 为什么不能同时使用同一个端口？

根据网络原理，两个不同的服务不能同时监听同一个端口号。在开发环境中，我们使用不同的端口号来区分前后端服务：
- 前端：5173端口，通过代理访问后端API
- 后端：3000端口，提供API服务

在生产环境中，我们将前端代码构建到后端的public目录，由后端Express服务器同时提供前端静态文件和后端API服务，只需要一个端口3000。

## 注意事项

1. **环境变量**: 确保在后端目录中创建了.env文件，并设置了正确的JWT_SECRET
2. **数据库**: 后端会自动创建SQLite数据库文件`data/database.db`
3. **备份**: 定期备份数据库文件，确保数据安全
4. **安全性**: 在生产环境中，建议使用HTTPS和更强的安全设置
5. **Zeabur特有**: Zeabur的文件系统是临时的，重启服务后会丢失数据，需要注意数据库备份

## Docker部署指南

### 1. 环境准备

- **安装Docker**：确保已安装Docker和Docker Compose
  - Windows: 下载并安装 [Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Linux: 按照官方文档安装Docker和Docker Compose
  - Mac: 下载并安装 [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)

- **验证安装**：运行以下命令检查Docker是否正常安装
  ```bash
  docker --version
  docker-compose --version
  ```

### 2. 本地构建和运行

#### 方法一：从本地代码构建

1. **克隆项目**
   ```bash
   git clone https://github.com/hein1225/3DPrintPop.git
   cd 3DPrintPop
   ```

2. **构建Docker镜像**
   ```bash
   docker build -t 3dprintpop .
   ```

3. **运行容器**
   ```bash
   docker run -d \
     --name 3dprintpop \
     -p 3000:3000 \
     -e JWT_SECRET=your-secret-key-here \
     -v app-data:/app/data \
     -v app-uploads:/app/public/uploads \
     3dprintpop
   ```

#### 方法二：使用Docker Compose（推荐）

1. **克隆项目**
   ```bash
   git clone https://github.com/hein1225/3DPrintPop.git
   cd 3DPrintPop
   ```

2. **配置环境变量**
   - 编辑 `docker-compose.yml` 文件，修改 `JWT_SECRET` 为强密钥

3. **启动服务**
   ```bash
   docker-compose up -d
   ```

### 3. 通过GitHub仓库地址构建Docker镜像

#### Docker地址说明

当使用GitHub仓库地址构建Docker镜像时，Docker会直接从GitHub仓库拉取代码并构建镜像，无需先克隆仓库。对于本项目，Docker构建地址就是GitHub仓库地址：

**Docker构建地址**: `https://github.com/hein1225/3DPrintPop.git`

#### 方法一：使用Docker CLI

```bash
docker build -t 3dprintpop https://github.com/hein1225/3DPrintPop.git
```

#### 方法二：使用Docker Compose

1. 创建 `docker-compose.yml` 文件
   ```yaml
   version: "3.8"

   services:
     app:
       build: https://github.com/hein1225/3DPrintPop.git
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - PORT=3000
         - JWT_SECRET=your-secret-key-here
       volumes:
         - app-data:/app/data
         - app-uploads:/app/public/uploads
       restart: unless-stopped

   volumes:
     app-data:
       driver: local
     app-uploads:
       driver: local
   ```

2. 启动服务
   ```bash
   docker-compose up -d
   ```

#### 方法三：使用Docker Hub自动构建

1. **登录Docker Hub**：访问 [Docker Hub](https://hub.docker.com/) 并登录您的账户
2. **创建仓库**：
   - 点击页面右上角的「Create Repository」按钮
   - 填写仓库名称（如 `3dprintpop`）
   - 选择可见性（Public或Private）
   - 点击「Create」按钮
3. **连接GitHub**：
   - 在仓库页面中，点击「Builds」标签页
   - 点击「Link to GitHub」按钮
   - 授权Docker Hub访问您的GitHub账户
   - 搜索并选择仓库 `hein1225/3DPrintPop`
   - 点击「Save」按钮
4. **配置构建规则**：
   - 在「Builds」页面中，点击「Configure Automated Builds」按钮
   - 点击「+ Add Rule」按钮
   - 设置分支（如 `main`）和标签规则
   - 配置构建上下文路径（默认为 `/`）
   - 点击「Save Changes」按钮
5. **触发构建**：
   - 配置完成后，点击「Trigger Build」按钮开始构建
   - 或等待代码推送到GitHub时自动触发构建
6. **获取镜像地址**：
   - 构建完成后，镜像地址格式为 `your-dockerhub-username/3dprintpop:tag`
   - 例如：`username/3dprintpop:latest`
7. **使用镜像**：
   ```bash
   docker pull your-dockerhub-username/3dprintpop:latest
   docker run -d --name 3dprintpop -p 3000:3000 your-dockerhub-username/3dprintpop:latest
   ```

#### 方法四：使用GitHub Actions构建并推送镜像

1. **创建GitHub Actions工作流**：
   - 在项目根目录创建 `.github/workflows/docker-build.yml` 文件
   - 内容如下：
   ```yaml
   name: Docker Build and Push

   on:
     push:
       branches: [ main ]
     pull_request:
       branches: [ main ]

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Login to Docker Hub
           uses: docker/login-action@v2
           with:
             username: ${{ secrets.DOCKERHUB_USERNAME }}
             password: ${{ secrets.DOCKERHUB_TOKEN }}
         
         - name: Build and push
           uses: docker/build-push-action@v4
           with:
             context: .
             push: true
             tags: your-dockerhub-username/3dprintpop:latest
   ```

2. **配置Docker Hub凭证**：
   - 在GitHub仓库的「Settings」→「Secrets and variables」→「Actions」中添加以下 secrets：
     - `DOCKERHUB_USERNAME`：您的Docker Hub用户名
     - `DOCKERHUB_TOKEN`：您的Docker Hub访问令牌（在Docker Hub的「Account Settings」→「Security」中生成）

3. **触发构建**：
   - 推送代码到 `main` 分支或创建Pull Request
   - GitHub Actions会自动构建镜像并推送到Docker Hub

4. **获取镜像地址**：
   - 构建完成后，镜像地址格式为 `your-dockerhub-username/3dprintpop:latest`

5. **使用镜像**：
   ```bash
   docker pull your-dockerhub-username/3dprintpop:latest
   docker run -d --name 3dprintpop -p 3000:3000 your-dockerhub-username/3dprintpop:latest
   ```

### 4. 关联镜像地址

**镜像地址格式**：
- Docker Hub镜像地址：`docker.io/your-dockerhub-username/3dprintpop:tag`
- 例如：`docker.io/username/3dprintpop:latest`

**如何使用镜像地址**：

1. **直接运行容器**：
   ```bash
   docker run -d --name 3dprintpop -p 3000:3000 docker.io/your-dockerhub-username/3dprintpop:latest
   ```

2. **在docker-compose.yml中使用**：
   ```yaml
   version: "3.8"

   services:
     app:
       image: docker.io/your-dockerhub-username/3dprintpop:latest
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - PORT=3000
         - JWT_SECRET=your-secret-key-here
       volumes:
         - app-data:/app/data
         - app-uploads:/app/public/uploads
       restart: unless-stopped

   volumes:
     app-data:
       driver: local
     app-uploads:
       driver: local
   ```

3. **在其他容器平台使用**：
   - 可以将镜像地址复制到Kubernetes、Docker Swarm等容器平台中使用

### 4. 访问应用

- **访问地址**: http://localhost:3000
- **功能**: 应用已完全部署，包含前端和后端服务

### 5. Docker部署注意事项

1. **环境变量**
   - 生产环境中必须修改 `JWT_SECRET` 为强密钥
   - 可根据需要调整 `HOURLY_POWER_CONSUMPTION` 和 `ELECTRICITY_PRICE` 环境变量

2. **数据持久化**
   - 使用Docker卷 `app-data` 持久化SQLite数据库文件
   - 定期备份卷数据，确保数据安全

3. **容器管理**
   - 查看容器状态：`docker ps`
   - 查看日志：`docker logs 3dprintpop`
   - 停止容器：`docker stop 3dprintpop`
   - 启动容器：`docker start 3dprintpop`
   - 重启容器：`docker restart 3dprintpop`

4. **更新应用**
   - 拉取最新代码：`git pull`
   - 重新构建镜像：`docker build -t 3dprintpop .`
   - 重启容器：`docker-compose up -d --build`

### 6. 常见问题

#### Docker构建失败
- 检查网络连接是否正常
- 确保Docker守护进程正在运行
- 查看构建日志，定位具体错误

#### 容器启动失败
- 检查端口是否被占用
- 查看容器日志：`docker logs 3dprintpop`
- 检查环境变量配置是否正确

#### 数据库连接失败
- 确保卷挂载正确：`docker volume inspect app-data`
- 检查容器内数据目录权限

## 常见问题

### 端口被占用
- 检查端口占用情况：`lsof -i :3000`（Linux/Mac）或`netstat -ano | findstr :3000`（Windows）
- 终止占用端口的进程：`kill -9 PID`（Linux/Mac）或`taskkill /PID PID /F`（Windows）

### 数据库连接失败
- 检查数据库文件权限
- 确保data目录存在且有写权限

### 前端无法访问后端API
- 检查代理配置是否正确
- 确保后端服务正在运行
- 检查CORS配置

### Zeabur部署失败
- 检查构建命令是否正确
- 检查环境变量是否配置正确
- 查看日志输出，定位具体错误

## 项目结构

```
3D打印助手/
├── frontend/              # 前端代码
│   ├── src/              # 源代码
│   ├── index.html        # 入口HTML文件
│   ├── vite.config.js    # Vite配置
│   └── package.json      # 前端依赖
├── backend/              # 后端代码
│   ├── src/              # 源代码
│   ├── public/           # 前端构建输出目录
│   ├── data/             # 数据库文件目录
│   ├── .env              # 环境变量配置
│   ├── server.js         # 后端入口文件
│   └── package.json      # 后端依赖
├── Dockerfile            # Docker构建文件
├── docker-compose.yml    # Docker Compose配置文件
├── .dockerignore         # Docker忽略文件
├── DEPLOYMENT.md         # 部署指南
├── README.md             # 项目说明文档
└── .gitignore            # Git忽略配置
```