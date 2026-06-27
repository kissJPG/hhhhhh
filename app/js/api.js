// ========== 番茄下载器 - API模块 ==========
class FanqieAPI {
  constructor() {
    this.baseHeaders = {
      'User-Agent': CONFIG.USER_AGENT,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // 通用请求方法
  async request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || CONFIG.REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: { ...this.baseHeaders, ...options.headers }
      });
      clearTimeout(timeout);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接');
      }
      throw error;
    }
  }

  // 搜索小说
  async searchBooks(keyword, page = 0) {
    try {
      const params = new URLSearchParams({
        query: keyword,
        page: page,
        size: 20,
        aid: '13'
      });
      
      const url = `${CONFIG.SEARCH_API}?${params.toString()}`;
      const data = await this.request(url);
      
      if (data.code === 0 && data.data) {
        return this.parseSearchResults(data.data);
      }
      return [];
    } catch (error) {
      log('搜索失败:', error);
      throw error;
    }
  }

  // 解析搜索结果
  parseSearchResults(data) {
    const items = data.ret_data || data.book_list || data.items || [];
    return items.map(item => {
      const book = item.book_info || item;
      return {
        id: book.book_id || book.id,
        title: book.book_name || book.title || '未知书名',
        author: book.author || '佚名',
        cover: book.thumb_url || book.cover_url || '',
        status: book.status === 1 ? '连载中' : '已完结',
        wordCount: this.formatWords(book.word_number || book.word_count || 0),
        category: book.category || '',
        description: book.abstract || book.description || '暂无简介',
        latestChapter: book.last_chapter_info?.item_name || '',
        score: book.score || 0
      };
    });
  }

  // 获取书籍详情
  async getBookDetail(bookId) {
    try {
      const params = new URLSearchParams({
        book_id: bookId,
        aid: '13'
      });
      
      const url = `${CONFIG.BOOK_DETAIL_API}?${params.toString()}`;
      const data = await this.request(url);
      
      if (data.code === 0 && data.data) {
        return this.parseBookDetail(data.data);
      }
      throw new Error('获取书籍详情失败');
    } catch (error) {
      log('获取书籍详情失败:', error);
      throw error;
    }
  }

  // 解析书籍详情
  parseBookDetail(data) {
    const book = data.book_info || data;
    return {
      id: book.book_id || book.id,
      title: book.book_name || book.title,
      author: book.author || '佚名',
      cover: book.thumb_url || book.cover_url || '',
      status: book.status === 1 ? '连载中' : '已完结',
      wordCount: this.formatWords(book.word_number || book.word_count || 0),
      category: book.category || '',
      description: book.abstract || book.description || '暂无简介',
      chapterCount: book.total_chapter || book.chapter_count || book.item_count || 0,
      freeChapterCount: book.free_chapter_count || 0
    };
  }

  // 获取章节目录
  async getChapterList(bookId) {
    try {
      const params = new URLSearchParams({
        book_id: bookId,
        aid: '13'
      });
      
      const url = `${CONFIG.CHAPTER_LIST_API}?${params.toString()}`;
      const data = await this.request(url);
      
      if (data.code === 0 && data.data) {
        return this.parseChapterList(data.data);
      }
      throw new Error('获取章节目录失败');
    } catch (error) {
      log('获取章节目录失败:', error);
      throw error;
    }
  }

  // 解析章节目录
  parseChapterList(data) {
    const items = data.item_list || data.chapter_list || [];
    return items.map((item, index) => ({
      id: item.item_id || item.chapter_id || index.toString(),
      title: item.item_name || item.title || `第${index + 1}章`,
      index: index,
      volume: item.volume_name || '',
      price: item.price || 0,
      wordCount: item.word_number || 0,
      isFree: !item.price || item.price === 0,
      isVip: item.need_vip || false,
      updateTime: item.update_time || ''
    }));
  }

  // 获取章节内容
  async getChapterContent(bookId, chapterId) {
    try {
      const params = new URLSearchParams({
        book_id: bookId,
        item_id: chapterId,
        aid: '13'
      });
      
      const url = `${CONFIG.CHAPTER_CONTENT_API}?${params.toString()}`;
      const data = await this.request(url);
      
      if (data.code === 0 && data.data) {
        return this.parseChapterContent(data.data);
      }
      throw new Error('获取章节内容失败');
    } catch (error) {
      log('获取章节内容失败:', error);
      throw error;
    }
  }

  // 解析章节内容
  parseChapterContent(data) {
    let content = data.content || data.text || '';
    // 清理HTML标签
    content = content.replace(/<[^>]+>/g, '');
    // 清理特殊字符
    content = content.replace(/&nbsp;/g, ' ');
    content = content.replace(/&/g, '&');
    content = content.replace(/</g, '<');
    content = content.replace(/>/g, '>');
    content = content.replace(/"/g, '"');
    
    return {
      content: content.trim(),
      title: data.item_name || data.title || '',
      preChapterId: data.prev_item_id || '',
      nextChapterId: data.next_item_id || ''
    };
  }

  // 格式化字数
  formatWords(count) {
    count = parseInt(count) || 0;
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + '万字';
    }
    return count + '字';
  }

  // 获取书籍封面图片URL
  getCoverUrl(coverPath) {
    if (!coverPath) return 'assets/placeholder.svg';
    if (coverPath.startsWith('http')) return coverPath;
    return `https:${coverPath}`;
  }
}

// 创建API实例
const api = new FanqieAPI();
