# lottery-simulator

幸运抽奖微信小程序 Demo：真实微信登录 + 服务端判奖转盘 + 积分持久化。

技术栈：Taro 4 + React + TypeScript + NutUI React for Taro，附带 Node 登录/抽奖服务。

## 功能说明

- 微信登录后进入主页抽奖转盘
- 奖项与概率（服务端安全随机判奖，客户端不可篡改）：
  1. 现金1元 — 5%
  2. 很遗憾，你没有中奖 — 50%
  3. 给开发者转5元 — 20%
  4. 积分+5 — 15%
  5. 积分+10 — 10%
- 点击抽奖后转盘旋转，指针停在对应扇区，弹窗展示结果
- 不限抽奖次数；积分按 OpenID 在服务端文件中持久化
- **演示抽奖，无真实资金往来**（现金/转账仅为展示文案）

## 你需要准备什么

| 准备项 | 是否必须 | 说明 |
|--------|----------|------|
| [微信小程序账号](https://mp.weixin.qq.com) | 必须 | 拿到 **AppID**、**AppSecret** |
| [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) | 必须 | 导入 `dist` 预览 |
| Node.js 18+ | 必须 | 跑小程序编译与后端 |
| 公网 HTTPS 服务器（阿里云等） | 真机正式域名时需要 | 本地开发可不买 |
| 备案域名 | 国内正式上线常需要 | 配置小程序 request 合法域名 |

本地开发可在开发者工具勾选「不校验合法域名」，后端跑在本机即可联调。

## 登录与抽奖流程

1. 小程序 `Taro.login()` 获取临时 `code`
2. `POST /api/auth/login` → 服务端 `jscode2session` → JWT
3. 启动时有 token 则校验 `GET /api/auth/me`；失败回登录页
4. 主页加载 `GET /api/lottery/profile` 显示积分
5. 点击抽奖 → `POST /api/lottery/draw` → 服务端判奖并更新积分 → 前端按结果旋转转盘并弹窗

## 本地跑通

### 1. 安装依赖

```bash
npm install
cd server && npm install && cd ..
```

### 2. 配置后端密钥

```bash
cp server/.env.example server/.env
```

编辑 `server/.env`：

- `WECHAT_APPID`：小程序 AppID（需与 `project.config.json` 一致）
- `WECHAT_SECRET`：小程序 AppSecret（只放服务端）
- `JWT_SECRET`：任意长随机串
- `PORT`：默认 `3001`

### 3. 配置小程序 AppID

编辑根目录 `project.config.json` 的 `appid`，改成你的真实 AppID。

本地 API 默认：

```
TARO_APP_API_BASE=http://127.0.0.1:3001
```

真机访问本机时改成电脑局域网 IP，并关闭域名校验。

### 4. 启动服务

```bash
npm run server:dev
```

健康检查：`http://127.0.0.1:3001/health`

可选：服务端概率边界单测

```bash
cd server && npx tsx src/lottery.test.ts
```

### 5. 编译微信小程序

```bash
npm run dev:weapp
```

### 6. 用微信开发者工具打开

1. 导入本仓库根目录（`miniprogramRoot` 为 `dist/`）
2. 详情 → 本地设置 → **不校验合法域名**
3. 编译预览

预期：

- 未登录进入登录页
- 登录后进入转盘主页，显示当前积分
- 点击抽奖，转盘旋转后弹窗展示结果；积分奖会累加
- 重启后端后积分仍保留（`server/data/users.json`）
- 退出登录回到登录页

## 正式环境（可选）

1. 将 `server` 部署到任意云主机并开启 HTTPS
2. 公众平台配置 request 合法域名
3. 修改 `.env.production` 中的 `TARO_APP_API_BASE`
4. `npm run build:weapp` 后上传代码

## 目录结构

```
src/
  app.tsx                 # 启动鉴权
  pages/login/            # 登录页
  pages/index/            # 抽奖转盘主页
  services/auth.ts
  services/lottery.ts
  utils/request.ts
  utils/auth.ts
server/
  src/index.ts            # 登录 + 抽奖 API
  src/lottery.ts          # 奖项与判奖
  src/store.ts            # OpenID 积分文件存储
  data/                   # 运行时数据（不入库）
  .env.example
```

## 说明

- AppSecret 绝不可写入小程序前端代码。
- 现金与「给开发者转5元」仅为演示文案，不接入微信支付。
