# 部署教程（小皮面板 + 支付宝当面付）

本文指导将「学好课（Next.js + Prisma + MySQL）」部署到生产环境，并使用小皮面板进行运维管理，同时完成支付宝当面付配置与联调。

## 前置准备

- 服务器（Linux，x86_64 架构），推荐 Ubuntu 22.04/24.04 或 CentOS 8+
- Node.js ≥ 18（生产环境）
- 域名与 HTTPS（生产建议，利于 SEO 与安全）
- 环境变量（`.env`），至少包含：
  - `DATABASE_URL`：`mysql://user:pass@host:port/dbname`
  - `ADMIN_JWT_SECRET`、`SITE_JWT_SECRET`：随机生成的安全字符串
  - `ALIPAY_APP_ID`、`ALIPAY_PRIVATE_KEY`（PKCS8）、`ALIPAY_PUBLIC_KEY`、`ALIPAY_GATEWAY`、`ALIPAY_NOTIFY_URL`
  - 可选：`NEXT_PUBLIC_SITE_URL` 或 `SITE_URL`（如 `https://xuehaoke.top`）

> 支付功能需要在后台「站点设置」完成品牌信息与支付宝密钥配置；并确保回调地址（`ALIPAY_NOTIFY_URL`）公网可访问。

## 使用小皮面板部署（Linux）

- 面板下载与安装：`https://www.xp.cn/download`
  - 通用脚本（示例）：
    ```bash
    # curl 版本
    sudo curl -O https://dl.xp.cn/dl/xp/install.sh && sudo bash install.sh
    # 或 wget 版本
    sudo wget -O install.sh https://dl.xp.cn/dl/xp/install.sh && sudo bash install.sh
    ```
  - 注意：
    - 仅支持 x86_64 架构
    - 建议在干净系统（未安装 Apache/Nginx/PHP/MySQL）上安装
    - 登录面板使用 Chrome/Edge/Firefox

### 步骤 A：安装 MySQL 并创建数据库
- 在小皮面板中安装 MySQL 服务，创建数据库与用户
- 将连接串写入 `.env` 的 `DATABASE_URL`，例如：
  ```
  DATABASE_URL="mysql://xhk_user:strong-password@127.0.0.1:3306/xuehaoke"
  ```
- 初始化 Prisma：
  ```bash
  npx prisma db push
  npx prisma generate
  # 可选：导入示例数据
  node scripts/seed-user-test.js
  ```

### 步骤 B：部署应用与 Node 运行
- 上传代码到服务器（例如 `/srv/xuehaoke`）
- 安装依赖并构建：
  ```bash
  npm ci
  npm run build
  ```
- 启动应用（生产用 PM2 守护）：
  ```bash
  pm2 start npm --name xuehaoke -- start
  pm2 save
  pm2 startup  # 设置系统重启后自动拉起
  ```

### 步骤 C：配置 Nginx 反向代理（小皮面板站点）
- 在小皮面板创建站点并绑定域名（建议开启 HTTPS）
- 将站点反向代理到本地 `http://127.0.0.1:3000`：
  ```nginx
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
  }
  ```
- 在 `.env` 设置 `NEXT_PUBLIC_SITE_URL=https://你的域名`，避免 SEO 中的 HTTP→HTTPS 重定向提示

### 步骤 D：站点设置与支付配置
- 后台 → 站点设置：填写站点名、Logo、SEO 关键词与 Banner
- 支付：参考下文支付宝当面付设置，完成密钥与通知地址配置

## 支付宝当面付设置教程

- 官方文档：`https://opendocs.alipay.com/open/194/106039?pathHash=5b8cf9e6`

### 开通与准备
- 在支付宝开放平台创建应用，并开通「当面付」
- 选择接入方式：门店直连或商家后台转发（本项目为服务端调用，推荐后台转发）
- 准备 RSA2 密钥（1024/2048），并确保使用 PKCS8 格式私钥

### 关键环境变量对应关系
- `ALIPAY_APP_ID`：应用的 AppID
- `ALIPAY_PRIVATE_KEY`：商户私钥（PKCS8）
- `ALIPAY_PUBLIC_KEY`：支付宝公钥（从开放平台下载）
- `ALIPAY_GATEWAY`：网关地址（生产 `https://openapi.alipay.com/gateway.do`；沙箱为 `https://openapi.alipaydev.com/gateway.do`）
- `ALIPAY_NOTIFY_URL`：异步通知地址（公网可访问的 HTTPS URL，如 `https://your-domain/api/pay/alipay/notify`）

### 联调流程（概览）
1. 预下单（当面付）生成二维码：`POST /api/pay/alipay/precreate`
2. 买家扫码支付后，服务端轮询状态：`POST /api/pay/alipay/query`
3. 支付宝异步通知回调：`POST /api/pay/alipay/notify`（校验签名后发放访问授权）
4. 处理交易状态：
   - `TRADE_SUCCESS`：支付成功
   - `TRADE_FINISHED`：交易完成（不可退款）
   - `TRADE_CLOSED`：交易关闭（超时/全额退款）
   - 详情参考官方文档的状态说明与异常处理建议

### 注意事项
- 回调必须使用 HTTPS，且公网可达；务必验证签名与订单号一致性
- 订单号建议全局唯一（本项目生成的 `outTradeNo` 符合要求）
- 沙箱环境使用沙箱网关与测试资金账户，联调成功后切换生产参数

## SEO 与可访问性注意事项

- 使用 `NEXT_PUBLIC_SITE_URL` 设置为生产域名的 HTTPS 地址，避免 Sitemap/Canonical 出现 HTTP→HTTPS 重定向
- 已在代码中强制生产环境优先使用 HTTPS 生成站点链接，利于 Google 索引
- 页面结构采用顺序标题（`h1 → h2`），移动菜单与弹窗具备 ARIA 属性

## 备份与监控

- 定期备份数据库（全量 + 增量）
- 监控错误日志：可在后台「错误日志」或服务端日志查看
- 建议使用反向代理日志与 APM（如 OpenTelemetry）观察性能

## 常见问题

- 白屏或接口失败：检查 `.env` 是否完整、数据库连接是否可达
- 支付二维码不显示：确认外部二维码服务与网络可访问
- GSC 提示重定向：确认生产环境启用 HTTPS，并设置 `NEXT_PUBLIC_SITE_URL=https://your-domain`

