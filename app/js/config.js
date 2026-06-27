// ========== 番茄下载器 - 配置文件 ==========
const CONFIG = {
  // API基础URL（番茄小说相关接口）
  API_BASE: 'https://novel.snssdk.com/api',
  
  // 搜索接口
  SEARCH_API: 'https://novel.snssdk.com/api/novel/channel/homepage/search/search/v1/',
  
  // 书籍详情接口
  BOOK_DETAIL_API: 'https://novel.snssdk.com/api/novel/book/detail/v1/',
  
  // 章节目录接口
  CHAPTER_LIST_API: 'https://novel.snssdk.com/api/novel/book/chapter_list/v1/',
  
  // 章节内容接口
  CHAPTER_CONTENT_API: 'https://novel.snssdk.com/api/novel/book/content/v1/',
  
  // 应用配置
  APP_NAME: '番茄下载器',
  APP_VERSION: '1.0.0',
  
  // 请求配置
  REQUEST_TIMEOUT: 15000,
  MAX_RETRY: 3,
  RETRY_DELAY: 1000,
  
  // 下载配置
  MAX_CONCURRENT_DOWNLOADS: 3,
  DOWNLOAD_DELAY: 500, // 章节间下载间隔ms
  
  // 存储键名
  STORAGE_KEYS: {
    DOWNLOADS: 'fanqie_downloads',
    BOOKMARKS: 'fanqie_bookmarks',
    HISTORY: 'fanqie_search_history',
    SETTINGS: 'fanqie_settings'
  },
  
  // User-Agent
  USER_AGENT: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  
  // 调试模式
  DEBUG: true
};

// 默认设置
const DEFAULT_SETTINGS = {
  autoSaveTxt: true,
  mergeChapters: false,
  maxDownloadPerBook: 500,
  theme: 'light',
  savePath: '/sdcard/Download/Fanqie/'
};

// 日志函数
function log(...args) {
  if (CONFIG.DEBUG) {
    console.log(`[${CONFIG.APP_NAME}]`, ...args);
  }
}
