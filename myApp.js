(function (global) {
  const STORAGE_KEY = '__APP2WEB_PARAMS__';
  const EVENT_CACHE_KEY = '__APP2WEB_EVENT_CACHE__';
  const USER_ID_KEY = '__APP2WEB_USER_ID__';
  const SESSION_ID_KEY = '__APP2WEB_SESSION_ID__';

  const App2WebSDK = {
    config: {},
    queryParams: {},
    eventCache: new Map(),
    offlineQueue: [],
    pageEnterTime: 0,
    userId: null,
    sessionId: null,
    autoTrackedEvents: new Set(),
    initialized: false,

    /** 初始化 SDK */
    init(options = {}) {
      if (this.initialized) {
        if (this.config.debug) this._log('SDK 已初始化，跳过重复初始化');
        return;
      }
      this.initialized = true;
      this.config = Object.assign({
        debug: true,
        storage: 'session', // or 'local'
        deduplicate: true,
        throttleInterval: 3000, // 3秒节流
        maxOfflineQueue: 20,    // 离线队列最大长度
        endpoint: 'http://localhost:3000/api/data',     // 默认事件上报接口
      }, options);

      this.queryParams = this._parseAndStoreParams();

      this.userId = this._getOrCreateId(USER_ID_KEY, 24);
      this.sessionId = this._getOrCreateId(SESSION_ID_KEY, 16, true);

      this._restoreOfflineQueue();
      this._flushOfflineEvents();
      this.pageEnterTime = Date.now();

      if (this.config.debug) {
        this._log('Initialized config:', this.config);
        this._log('Query params:', this.queryParams);
        this._log('UserId:', this.userId, 'SessionId:', this.sessionId);
      }

      window.addEventListener('online', () => {
        this._log('Network online, flushing offline queue...');
        this._flushOfflineEvents();
      });

      // window.addEventListener('beforeunload', () => {
      //   const duration = Date.now() - this.pageEnterTime;
      //   this.trackEvent('page_duration', { duration });
      // });

      // this._setupAutoTrackEvents();
    },

    /** 解析并缓存 URL 参数 */
    _parseAndStoreParams() {
      const storage = this.config.storage === 'local' ? localStorage : sessionStorage;
      const query = new URLSearchParams(window.location.search);
      const stored = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');

      for (const [key, value] of query.entries()) {
        stored[key] = value;
      }

      storage.setItem(STORAGE_KEY, JSON.stringify(stored));
      return stored;
    },

    /** 获取参数 */
    getParam(key) {
      return this.queryParams[key] || null;
    },

    /** 生成或获取用户唯一 ID / Session ID */
    _getOrCreateId(key, length = 16, sessionOnly = false) {
      try {
        const storage = sessionOnly ? sessionStorage : localStorage;
        let id = storage.getItem(key);
        if (!id) {
          id = this._generateId(length);
          storage.setItem(key, id);
          if (this.config.debug) {
            this._log(`Generated new ID for ${key}:`, id);
          }
        }
        return id;
      } catch (e) {
        if (this.config.debug) {
          this._log(`Failed to get/create ID for ${key}:`, e);
        }
        return null;
      }
    },

    /** 简单生成随机 ID */
    _generateId(length = 16) {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },

    /** 节流判断 */
    _isThrottled(eventKey) {
      const now = Date.now();
      const lastTime = this.eventCache.get(eventKey);
      if (!lastTime || now - lastTime > this.config.throttleInterval) {
        this.eventCache.set(eventKey, now);
        return false;
      }
      return true;
    },

    /** 恢复离线事件队列 */
    _restoreOfflineQueue() {
      try {
        const raw = localStorage.getItem(EVENT_CACHE_KEY);
        this.offlineQueue = raw ? JSON.parse(raw) : [];
      } catch (e) {
        this.offlineQueue = [];
      }
    },

    /** 保存离线事件 */
    _persistOfflineQueue() {
      try {
        localStorage.setItem(EVENT_CACHE_KEY, JSON.stringify(this.offlineQueue));
      } catch (e) {
        if (this.config.debug) this._log('Failed to persist queue', e);
      }
    },

    /** 上报事件（支持节流 & 离线缓存） */
    trackEvent(eventName, data = {}) {
      const eventKey = `${eventName}-${JSON.stringify(data)}`;

      if (this.config.deduplicate && this._isThrottled(eventKey)) {
        if (this.config.debug) this._log('Event throttled:', eventName);
        return;
      }

      const payload = {
        event: eventName,
        data,
        timestamp: Date.now(),
        appId: this.config.appId || null,
        trackingId: this.config.trackingId || null,
        userId: this.userId,
        sessionId: this.sessionId,
        source: 'App2WebSDK',
      };

      if (this.config.debug) {
        this._log('Sending event:', payload);
      }

      if (!navigator.onLine) {
        if (this.config.debug) this._log('Offline - queueing event');
        if (this.offlineQueue.length >= this.config.maxOfflineQueue) {
          this.offlineQueue.shift();
        }
        this.offlineQueue.push(payload);
        this._persistOfflineQueue();
        return;
      }

      this._sendEvent(payload);
    },

    /** 实际发送事件 */
    _sendEvent(payload) {
      fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch((err) => {
        if (this.config.debug) this._log('Failed to send event:', err);
        if (this.offlineQueue.length >= this.config.maxOfflineQueue) {
          this.offlineQueue.shift();
        }
        this.offlineQueue.push(payload);
        this._persistOfflineQueue();
      });
    },

    /** 网络恢复后重发离线缓存 */
    _flushOfflineEvents() {
      if (!navigator.onLine || this.offlineQueue.length === 0) return;

      if (this.config.debug) this._log('Flushing offline events');

      const queue = [...this.offlineQueue];
      this.offlineQueue = [];
      this._persistOfflineQueue();

      for (const payload of queue) {
        this._sendEvent(payload);
      }
    },

    /** 新增：设置自动事件监听 */
    _setupAutoTrackEvents() {
      const eventsToTrack = ['click', 'scroll', 'touchstart', 'focus'];
      eventsToTrack.forEach(eventName => {
        const handler = () => {
          if (!this.autoTrackedEvents.has(eventName)) {
            this.autoTrackedEvents.add(eventName);
            this.trackEvent(`auto_event_${eventName}`, { first: true });
            this._log(`Auto-tracked first ${eventName} event`);
          }
          window.removeEventListener(eventName, handler, true);
        };
        window.addEventListener(eventName, handler, true);
      });
    },

    /** 获取所有参数 */
    getAllParams() {
      return this.queryParams;
    },

    /** 内部调试日志 */
    _log(...args) {
      if (this.config.debug) {
        console.log('[App2WebSDK]', ...args);
      }
    },
  };

  // 暴露到全局
  global.MyApp2WebSDK = App2WebSDK;
})(window);
