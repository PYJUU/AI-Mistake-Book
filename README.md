# 专属错题本 (AI Mistake Book)

依赖AI的错题管理与练习web随时随地练习，支持通过文本解析录入题目，并使用加权间隔重复算法优化练习效果。
支持docker，很简单这需要根据你的需求让ai来完成，可以持久化数据data.db。

## 主要功能

- **AI 智能录入**：支持文本解析，方便快速录入错题，当然也可以是练习题目
- **间隔重复算法**：基于加权算法的智能复习计划
- **用户认证**：JWT安全认证系统
- **数据持久化**：SQLite本地数据库存储

## 技术栈

- **前端**：React 19 + Vite + TypeScript + Tailwind CSS
- **后端**：Express + TypeScript
- **数据库**：SQLite (better-sqlite3)
- **AI**：建议使用Google Gemini API 当然也可以使用其他模型，当前支持/chat/completions的格式
- **认证**：JWT

## 快速开始

### 环境要求

- Node.js (推荐 v18+)

### 安装步骤

1. 安装依赖：
   ```bash
   npm install
   ```

2. 配置环境变量，复制 `.env.example` 为 `.env.local` 并填入（可选）：
   ```
   GEMINI_API_KEY=你的Gemini API密钥
   JWT_SECRET=你的JWT密钥（请使用强密码）
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

4. 访问 http://localhost:3000

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm start` | 运行生产版本 |
| `npm run lint` | TypeScript 类型检查 |
| `npm run clean` | 清理构建文件 |

## 项目结构

```
├── src/
│   ├── App.tsx          # 应用主组件
│   ├── main.tsx         # 入口文件
│   ├── api.ts           # API 请求封装
│   ├── types.ts         # 类型定义
│   ├── index.css        # 全局样式
│   ├── lib/             # 工具函数
│   └── pages/           # 页面组件
├── server.ts            # Express 后端服务
├── index.html           # HTML 入口
├── vite.config.ts       # Vite 配置
└── tsconfig.json        # TypeScript 配置
```

## 许可证

详见许可证界面
