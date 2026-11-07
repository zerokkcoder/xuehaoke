# 学好课（资源下载站）

基于 Next.js App Router 的资源下载站，包含前台、用户系统、支付（支付宝当面付）、管理后台与站点设置。

![网站首页预览](docs/home.png)

## 快速开始

- 安装依赖：`npm install`
- 开发启动：`npm run dev`（访问 `http://localhost:3000/`）
- 开发数据库同步：`npx prisma db push && npx prisma generate`
- 生产构建与启动：`npm run build && npm run start`

## 必需环境变量（.env）

- `DATABASE_URL`
- `ADMIN_JWT_SECRET`
- `SITE_JWT_SECRET`
- `ALIPAY_APP_ID`
- `ALIPAY_PRIVATE_KEY`（PKCS8）
- `ALIPAY_PUBLIC_KEY`
- `ALIPAY_GATEWAY`
- `ALIPAY_NOTIFY_URL`

## 主要功能

- 前台：首页、分类/子分类/标签、资源详情、个人中心（支持订单续付）、下载记录
- 后台：站点设置与支付配置、资源管理（含闲鱼一键上架）
- 支付：预下单、查询、回调、超时自动关闭（15分钟）；支付成功自动发放访问授权；首页未支付订单提醒
- 计划任务：定时清理超时未支付订单
- 闲鱼一键上架：后台资源管理里把资源标题/描述/价格/封面图一键填进闲鱼发布页，并回写上架状态（需安装浏览器扩展，见下文）

## 接口简要

- `GET /api/resources`、`GET /api/resources/[id]`
- `POST /api/pay/alipay/precreate`、`POST /api/pay/alipay/query`、`POST /api/pay/alipay/notify`
- `GET /api/cron/close-orders` （关闭超时未支付订单，请添加到计划任务中）
- `PUT /api/admin/resources/[id]` （含闲鱼上架状态字段：`xianyuStatus` / `xianyuItemId` / `xianyuUrl`）
- `GET /api/admin/xianyu-extension` （下载闲鱼上架扩展 zip，运行时从 `extension/` 目录打包）

## 闲鱼一键上架

后台「资源管理」列表每行有「上架闲鱼」按钮，点开后会把该资源的标题、正文（自动剔除站外链接、违禁词替换为谐音）、价格、封面图填入闲鱼发布页，并自动选择分类「笔记资料」。

浏览器不允许网页自动安装扩展，首次需手动加载一次：

1. 登录后台，进入侧边栏「闲鱼扩展」页，点「下载扩展包」
2. 解压 zip，打开 `chrome://extensions`，开启右上角「开发者模式」
3. 点「加载已解压的扩展程序」，选择解压出的目录
4. 在同一个浏览器里登录闲鱼（goofish.com），回到「资源管理」即可使用

说明：

- 扩展源码在 [extension/](extension/) 目录（`manifest.json` + background + 两个 content script），改动后到 `chrome://extensions` 点「重新加载」生效
- 页面上会实时显示扩展「已连接 / 未检测到」；点「一键上架」无反应时先确认扩展已启用且已登录闲鱼
- 闲鱼页面类名为哈希值，脚本按文本/占位符定位元素，页面结构改动后可能需要微调 `extension/content-xianyu.js`
- 违禁词替换规则在 [lib/xianyu.ts](lib/xianyu.ts)，可在弹窗里手动改回
- 勾选「自动点击发布」且发布成功后，资源会自动标记为「已上架」；只填充不发布的需手动改状态。早期手工上架的宝贝可在弹窗里手动填写商品 ID / 链接完成关联
- 自动发布受闲鱼风控影响，遇到滑块验证会退回「仅填充」，由人工点击发布

## 部署提示

- 确保数据库与 `.env` 配置完整；后台站点设置需完成品牌与支付配置。
- 发布时请一并带上 `extension/` 目录（下载扩展 zip 的接口依赖它）。
- 数据库结构变更后需执行 `npx prisma db push && npx prisma generate` 并**重启服务**（Node 进程会缓存旧版 Prisma Client）。
- 闲鱼上架相关字段为增量改动（`resources` 表新增 4 个列，均带默认值或可空），也可直接执行：
  ```sql
  ALTER TABLE `resources`
    ADD COLUMN `xianyu_status`    varchar(191) NOT NULL DEFAULT 'none',
    ADD COLUMN `xianyu_item_id`   varchar(191) DEFAULT NULL,
    ADD COLUMN `xianyu_url`       varchar(191) DEFAULT NULL,
    ADD COLUMN `xianyu_listed_at` datetime(3)  DEFAULT NULL;
  ```
- VIP 每日下载额度相关字段为增量改动（`users` 表新增 2 个列），也可直接执行：
  ```sql
  ALTER TABLE `users`
    ADD COLUMN `daily_download_count` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `daily_download_date`  DATETIME(3) NULL;

  CREATE INDEX `orders_status_idx`       ON `orders`    (`status`);
  CREATE INDEX `orders_created_at_idx`   ON `orders`    (`created_at`);
  CREATE INDEX `resources_updatedAt_idx` ON `resources` (`updatedAt`);
  ```
  > 以上 SQL 可用 `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` 复现，确认为纯增量改动。

## 部署教程
[部署教程](docs/deploy.md)
