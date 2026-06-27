// ========== 番茄下载器 - 主应用 ==========
class App {
  constructor() {
    this.currentBook = null;
    this.chapters = [];
    this.selectedChapters = new Set();
    this.downloadQueue = [];
    this.activeDownloads = 0;
    this.state = 'search'; // search | detail | downloads
    this.downloadTaskId = 0;
    
    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.loadDownloadHistory();
    this.navigate('search');
  }

  bindElements() {
    this.els = {
      searchInput: document.getElementById('searchInput'),
      searchBtn: document.getElementById('searchBtn'),
      searchResults: document.getElementById('searchResults'),
      resultsList: document.getElementById('resultsList'),
      bookDetail: document.getElementById('bookDetail'),
      bookCover: document.getElementById('bookCover'),
      bookTitle: document.getElementById('bookTitle'),
      bookAuthor: document.getElementById('bookAuthor'),
      bookStatus: document.getElementById('bookStatus'),
      bookWords: document.getElementById('bookWords'),
      bookDesc: document.getElementById('bookDesc'),
      chapterCount: document.getElementById('chapterCount'),
      chapterList: document.getElementById('chapterList'),
      downloadManager: document.getElementById('downloadManager'),
      downloadQueue: document.getElementById('downloadQueue'),
      emptyState: document.getElementById('emptyState'),
      backBtn: document.getElementById('backBtn'),
      downloadAllBtn: document.getElementById('downloadAllBtn'),
      selectChaptersBtn: document.getElementById('selectChaptersBtn'),
      selectAllCh: document.getElementById('selectAllCh'),
      deselectAllCh: document.getElementById('deselectAllCh'),
      downloadSelected: document.getElementById('downloadSelected'),
      toast: document.getElementById('toast'),
      navItems: document.querySelectorAll('.nav-item')
    };
  }

  bindEvents() {
    // 搜索
    this.els.searchBtn.addEventListener('click', () => this.handleSearch());
    this.els.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });

    // 导航
    this.els.backBtn.addEventListener('click', () => this.navigate('search'));
    this.els.navItems.forEach(item => {
      item.addEventListener('click', () => this.navigate(item.dataset.tab));
    });

    // 书籍操作
    this.els.downloadAllBtn.addEventListener('click', () => this.downloadAllChapters());
    this.els.selectChaptersBtn.addEventListener('click', () => this.toggleChapterSelection());
    this.els.selectAllCh.addEventListener('click', () => this.selectAllChapters(true));
    this.els.deselectAllCh.addEventListener('click', () => this.selectAllChapters(false));
    this.els.downloadSelected.addEventListener('click', () => this.downloadSelectedChapters());
  }

  // ========== 导航 ==========
  navigate(tab) {
    this.state = tab;
    
    // 更新导航高亮
    this.els.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tab);
    });

    // 切换视图
    this.els.searchResults.classList.add('hidden');
    this.els.bookDetail.classList.add('hidden');
    this.els.downloadManager.classList.add('hidden');
    this.els.emptyState.classList.add('hidden');

    switch (tab) {
      case 'search':
        this.els.emptyState.classList.remove('hidden');
        break;
      case 'detail':
        this.els.bookDetail.classList.remove('hidden');
        break;
      case 'downloads':
        this.els.downloadManager.classList.remove('hidden');
        this.renderDownloadQueue();
        break;
    }
  }

  // ========== 搜索 ==========
  async handleSearch() {
    const keyword = this.els.searchInput.value.trim();
    if (!keyword) {
      this.showToast('请输入书名或作者', 'error');
      return;
    }

    this.showLoading(true);
    try {
      const books = await api.searchBooks(keyword);
      this.renderSearchResults(books);
      this.state = 'search';
      this.els.searchResults.classList.remove('hidden');
      this.els.emptyState.classList.add('hidden');
      this.els.bookDetail.classList.add('hidden');
      this.els.downloadManager.classList.add('hidden');
    } catch (error) {
      this.showToast('搜索失败: ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  renderSearchResults(books) {
    if (books.length === 0) {
      this.els.resultsList.innerHTML = '<p class="empty-state">没有找到相关小说</p>';
      return;
    }

    this.els.resultsList.innerHTML = books.map(book => `
      <div class="result-card card" onclick="app.openBookDetail('${book.id}')">
        <img class="book-cover-sm" src="${api.getCoverUrl(book.cover)}" alt="封面" onerror="this.src='assets/placeholder.svg'">
        <div class="result-info">
          <h3>${this.escapeHtml(book.title)}</h3>
          <p>${book.author}</p>
          <p>${book.status} · ${book.wordCount}</p>
          <div class="result-tags">
            ${book.category ? `<span class="tag">${book.category}</span>` : ''}
            ${book.latestChapter ? `<span class="tag">${book.latestChapter}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  // ========== 书籍详情 ==========
  async openBookDetail(bookId) {
    this.showLoading(true);
    try {
      const book = await api.getBookDetail(bookId);
      this.currentBook = book;
      
      // 渲染书籍信息
      this.els.bookCover.src = api.getCoverUrl(book.cover);
      this.els.bookTitle.textContent = book.title;
      this.els.bookAuthor.textContent = `作者：${book.author}`;
      this.els.bookStatus.textContent = `状态：${book.status}`;
      this.els.bookWords.textContent = `字数：${book.wordCount}`;
      this.els.bookDesc.textContent = book.description;
      this.els.chapterCount.textContent = `(共${book.chapterCount}章)`;

      // 加载章节目录
      this.showLoading(true);
      this.chapters = await api.getChapterList(bookId);
      this.selectedChapters.clear();
      this.renderChapterList();
      
      this.navigate('detail');
    } catch (error) {
      this.showToast('获取书籍详情失败: ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  renderChapterList() {
    const limit = Math.min(this.chapters.length, DEFAULT_SETTINGS.maxDownloadPerBook);
    const displayChapters = this.chapters.slice(0, limit);
    
    this.els.chapterList.innerHTML = displayChapters.map(ch => {
      const isSelected = this.selectedChapters.has(ch.id);
      const downloadStatus = this.getChapterDownloadStatus(ch.id);
      return `
        <div class="chapter-item ${isSelected ? 'selected' : ''}" data-chapter-id="${ch.id}" onclick="app.toggleChapter(event, '${ch.id}')">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="app.toggleChapterById('${ch.id}')">
          <span class="ch-title">${this.escapeHtml(ch.title)}</span>
          ${downloadStatus ? `<span class="ch-status ${downloadStatus}">${downloadStatus === 'downloaded' ? '✓' : '•••'}</span>` : ''}
          ${ch.isFree ? '<span class="ch-status">免费</span>' : '<span class="ch-status">VIP</span>'}
        </div>
      `;
    }).join('');
  }

  toggleChapter(event, chapterId) {
    event.preventDefault();
    this.toggleChapterById(chapterId);
  }

  toggleChapterById(chapterId) {
    if (this.selectedChapters.has(chapterId)) {
      this.selectedChapters.delete(chapterId);
    } else {
      this.selectedChapters.add(chapterId);
    }
    this.renderChapterList();
  }

  selectAllChapters(select) {
    const limit = Math.min(this.chapters.length, DEFAULT_SETTINGS.maxDownloadPerBook);
    const displayChapters = this.chapters.slice(0, limit);
    
    if (select) {
      displayChapters.forEach(ch => this.selectedChapters.add(ch.id));
    } else {
      displayChapters.forEach(ch => this.selectedChapters.delete(ch.id));
    }
    this.renderChapterList();
  }

  toggleChapterSelection() {
    const chapterSection = this.els.bookDetail.querySelector('.chapter-section');
    chapterSection.scrollIntoView({ behavior: 'smooth' });
  }

  // ========== 下载 ==========
  downloadAllChapters() {
    const limit = Math.min(this.chapters.length, DEFAULT_SETTINGS.maxDownloadPerBook);
    const toDownload = this.chapters.slice(0, limit);
    this.enqueueDownloads(toDownload);
  }

  downloadSelectedChapters() {
    const toDownload = this.chapters.filter(ch => this.selectedChapters.has(ch.id));
    if (toDownload.length === 0) {
      this.showToast('请先选择要下载的章节', 'error');
      return;
    }
    this.enqueueDownloads(toDownload);
  }

  enqueueDownloads(chapters) {
    chapters.forEach(ch => {
      if (!this.downloadQueue.find(d => d.chapterId === ch.id)) {
        const task = {
          id: ++this.downloadTaskId,
          bookId: this.currentBook.id,
          bookTitle: this.currentBook.title,
          chapterId: ch.id,
          chapterTitle: ch.title,
          status: 'pending', // pending | downloading | completed | failed
          progress: 0
        };
        this.downloadQueue.unshift(task);
      }
    });
    
    this.saveDownloadHistory();
    this.renderDownloadQueue();
    this.processQueue();
    this.showToast(`已添加 ${chapters.length} 章到下载队列`, 'success');
  }

  async processQueue() {
    const pending = this.downloadQueue.filter(d => d.status === 'pending');
    
    for (const task of pending) {
      if (this.activeDownloads >= CONFIG.MAX_CONCURRENT_DOWNLOADS) break;
      
      this.activeDownloads++;
      task.status = 'downloading';
      this.renderDownloadQueue();
      
      try {
        const content = await api.getChapterContent(task.bookId, task.chapterId);
        const fileName = `${task.bookTitle}_${task.chapterTitle}.txt`;
        await this.saveToFile(fileName, content.content);
        task.status = 'completed';
        task.progress = 100;
        this.activeDownloads--;
        this.renderDownloadQueue();
        this.saveDownloadHistory();
        
        // 延迟避免请求过快
        if (CONFIG.DOWNLOAD_DELAY > 0) {
          await this.sleep(CONFIG.DOWNLOAD_DELAY);
        }
      } catch (error) {
        task.status = 'failed';
        task.error = error.message;
        this.activeDownloads--;
        this.renderDownloadQueue();
        this.saveDownloadHistory();
      }
    }
    
    // 继续处理剩余的
    if (this.downloadQueue.some(d => d.status === 'pending')) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  async saveToFile(fileName, content) {
    // 通过Capacitor Filesystem API或浏览器下载
    if (typeof Capacitor !== 'undefined' && Capacitor.Plugins?.Filesystem) {
      const { Filesystem } = Capacitor.Plugins;
      const safeName = fileName.replace(/[\/\\:*?"<>|]/g, '_');
      await Filesystem.writeFile({
        path: `${DEFAULT_SETTINGS.savePath}${safeName}`,
        data: content,
        encoding: 'utf8'
      });
    } else {
      // Web fallback: 使用Blob下载
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace(/[\/\\:*?"<>|]/g, '_');
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  renderDownloadQueue() {
    if (this.downloadQueue.length === 0) {
      this.els.downloadQueue.innerHTML = '<p class="empty-state">暂无下载任务</p>';
      return;
    }

    this.els.downloadQueue.innerHTML = this.downloadQueue.map(task => `
      <div class="download-item">
        <div class="dl-info">
          <div class="dl-title">${this.escapeHtml(task.chapterTitle)}</div>
          <div class="dl-progress-text">
            ${task.status === 'completed' ? '已完成' : 
              task.status === 'downloading' ? `下载中... ${task.progress}%` :
              task.status === 'failed' ? `失败: ${task.error || '未知错误'}` : '等待中...'}
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${task.progress}%"></div>
          </div>
        </div>
        <div class="dl-actions">
          ${task.status === 'failed' ? '<button onclick="app.retryDownload(' + task.id + ')">🔄</button>' : ''}
          ${task.status !== 'downloading' ? '<button onclick="app.removeDownload(' + task.id + ')">✕</button>' : ''}
        </div>
      </div>
    `).join('');
  }

  retryDownload(taskId) {
    const task = this.downloadQueue.find(d => d.id === taskId);
    if (task) {
      task.status = 'pending';
      task.progress = 0;
      this.renderDownloadQueue();
      this.processQueue();
    }
  }

  removeDownload(taskId) {
    this.downloadQueue = this.downloadQueue.filter(d => d.id !== taskId);
    this.saveDownloadHistory();
    this.renderDownloadQueue();
  }

  getChapterDownloadStatus(chapterId) {
    const task = this.downloadQueue.find(d => d.chapterId === chapterId);
    if (!task) return null;
    if (task.status === 'completed') return 'downloaded';
    if (task.status === 'downloading') return 'downloading';
    return null;
  }

  // ========== 存储 ==========
  saveDownloadHistory() {
    try {
      const data = this.downloadQueue.map(d => ({
        id: d.id,
        bookId: d.bookId,
        bookTitle: d.bookTitle,
        chapterId: d.chapterId,
        chapterTitle: d.chapterTitle,
        status: d.status
      }));
      localStorage.setItem(CONFIG.STORAGE_KEYS.DOWNLOADS, JSON.stringify(data));
    } catch (e) {
      log('保存下载历史失败:', e);
    }
  }

  loadDownloadHistory() {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE_KEYS.DOWNLOADS);
      if (data) {
        this.downloadQueue = JSON.parse(data);
        this.downloadQueue.forEach(d => {
          d.progress = d.status === 'completed' ? 100 : 0;
          if (d.status === 'downloading') d.status = 'pending';
        });
        this.downloadTaskId = Math.max(...this.downloadQueue.map(d => d.id), 0);
      }
    } catch (e) {
      log('加载下载历史失败:', e);
    }
  }

  // ========== 工具方法 ==========
  showToast(message, type = '') {
    const toast = this.els.toast;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
  }

  showLoading(show) {
    const existing = document.querySelector('.loading-spinner');
    if (show && !existing) {
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      document.getElementById('mainContent').prepend(spinner);
    } else if (!show && existing) {
      existing.remove();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
