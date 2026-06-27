# 🍅 番茄下载器 (Fanqie Downloader)

> 一个现代化的移动端小说下载器，支持浏览器和 Android 原生应用。  
> 专注于番茄小说平台的内容搜索、浏览和一键下载。

[![Build Android APK](https://github.com/kissJPG/hhhhhh/actions/workflows/build-apk.yml/badge.svg)](https://github.com/kissJPG/hhhhhh/actions/workflows/build-apk.yml)

---

## ✨ 功能特性

- 🔍 **在线搜索** — 支持书名、作者、关键词搜索
- 📖 **书籍详情** — 封面、简介、章节目录一目了然
- ⚡ **一键下载** — 支持单章/多章/全书下载为 TXT 文件
- 📥 **下载管理** — 并发队列、断点续传、失败重试
- 🎨 **现代 UI** — Material Design 风格，流畅动画
- 📱 **跨平台** — 支持 PWA / Capacitor Android / 静态网页
- 🌙 **深色模式支持** *(即将推出)*

---

## 🚀 快速开始

### 方式一：直接使用（浏览器）

```bash
npx serve app
# 打开 http://localhost:3000
```

### 方式二：打包 Android APK

```bash
npm install
npx cap init fanqie-downloader com.fanqie.downloader --web-dir=app
npx cap add android
npx cap sync
cd android && ./gradlew assembleDebug
```

APK 位于 `android/app/build/outputs/apk/debug/app-debug.apk`

### 方式三：GitHub Actions 自动构建

1. Fork 本仓库
2. 前往 `Actions` → `Build Android APK` → `Run workflow`
3. 下载构建产物

---

## 📂 项目结构

```
hhhhhh/
├── app/                    # 应用前端
│   ├── index.html          # 主页面
│   ├── css/style.css       # Material Design 样式
│   ├── js/
│   │   ├── config.js       # 全局配置 & 常量
│   │   ├── api.js          # 番茄小说 API 封装
│   │   └── app.js          # 主应用逻辑
│   └── assets/             # 静态资源（SVG 图标等）
├── .github/workflows/
│   └── build-apk.yml       # GitHub Actions 自动构建流程
├── package.json            # Node 依赖 & 脚本
└── capacitor.config.json   # Capacitor 配置
```

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vanilla JS (ES2020+) + HTML5 + CSS3 |
| 打包 | Capacitor + Android Gradle |
| CI/CD | GitHub Actions + Node.js + Java 17 |
| API | 番茄小说 `novel.snssdk.com` |
| 存储 | localStorage + Capacitor Filesystem |

---

## 📦 下载

最新 APK 请前往 [Releases](https://github.com/kissJPG/hhhhhh/releases) 页面下载。

---

## ⚠️ 免责声明

本工具仅供**个人学习与研究**使用。  
下载的内容请于 24 小时内删除，不得用于商业用途。  
使用者需自行承担版权相关责任。

---

## 📝 License

MIT © [kissJPG](https://github.com/kissJPG)
