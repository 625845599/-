(function(global) {
	const STORAGE_KEY = '__APP2WEB_PARAMS__';
	const EVENT_CACHE_KEY = '__APP2WEB_EVENT_CACHE__';
	const USER_ID_KEY = '__APP2WEB_USER_ID__';
	const SESSION_ID_KEY = '__APP2WEB_SESSION_ID__';

	const goCashSdk = {
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
				storage: 'local', // or 'local'
				deduplicate: true,
				throttleInterval: 1500, // 3秒节流
				maxOfflineQueue: 20, // 离线队列最大长度
				// endpoint: 'http://localhost:3000/api/data', //事件上报接口
				endpoint: 'https://test-cw-gateway.snail99.com/cashwall-apis/v1.0/pixel/track', //事件上报接口
				uploadOnce: true, // 同一事件只上传一次
				appId: 6600
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

			window.addEventListener('beforeunload', () => {
				// const duration = Date.now() - this.pageEnterTime;
				// this.trackEvent('page_duration', {
				// 	duration
				// });
			});
			// this._setupAutoTrackEvents();
		},

		// Base64 编码
		_encode(str) {
			try {
				return btoa(unescape(encodeURIComponent(str)));
			} catch (e) {
				this._log('Base64 encode error:', e);
				return str;
			}
		},

		// Base64 解码
		_decode(str) {
			try {
				return decodeURIComponent(escape(atob(str)));
			} catch (e) {
				this._log('Base64 decode error:', e);
				return str;
			}
		},



		/** 解析并缓存 URL 参数 */
		_parseAndStoreParams() {
			const storage = this.config.storage === 'local' ? localStorage : sessionStorage;
			const query = new URLSearchParams(window.location.search);
			const storedRaw = storage.getItem(STORAGE_KEY);
			let stored = {};

			if (storedRaw) {
				try {
					stored = JSON.parse(this._decode(storedRaw));
				} catch (e) {
					stored = {};
				}
			}

			for (const [key, value] of query.entries()) {
				stored[key] = value;
			}

			storage.setItem(STORAGE_KEY, this._encode(JSON.stringify(stored)));
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
				let encodedId = storage.getItem(key);
				let id = encodedId ? this._decode(encodedId) : null;

				if (!id) {
					id = this._generateId(length);
					storage.setItem(key, this._encode(id));
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
			this.offlineQueue = raw ? JSON.parse(this._decode(raw)) : [];
		} catch (e) {
			this.offlineQueue = [];
		}
	},


		/** 保存离线事件 */
		_persistOfflineQueue() {
		try {
				localStorage.setItem(EVENT_CACHE_KEY, this._encode(JSON.stringify(this.offlineQueue)));
			} catch (e) {
				if (this.config.debug) this._log('Failed to persist queue', e);
			}

		},

		_getEventKey(eventName, data) {
			const sortedData = Object.keys(data)
				.sort()
				.reduce((obj, key) => {
					obj[key] = data[key];
					return obj;
				}, {});
			return `${eventName}:${JSON.stringify(sortedData)}`;
		},

		/** 上报事件（支持节流 & 离线缓存） */
		/** 上报事件（支持去重 & 节流 & 离线缓存） */
		trackEvent(eventName, data = {}) {
			const eventKey = this._getEventKey(eventName, data);

			// === 一次性事件上传判断 ===
			if (this.config.uploadOnce) {
				const dedupMap = this._getDedupEventMap();
				if (dedupMap[eventKey]) {
					if (this.config.debug) this._log('Event already tracked once, skipping:', eventKey);
					return;
				}
				dedupMap[eventKey] = true;
				this._setDedupEventMap(dedupMap);
			}

			// === 节流判断 ===
			if (this.config.deduplicate && this._isThrottled(eventKey)) {
				if (this.config.debug) this._log('Event throttled:', eventName);
				return;
			}

			const payload = {
				event: eventName,
				user_id: this.queryParams.userId,
				...data,
				// timestamp: Date.now(),
				// appId: this.config.appId || null,
				// // userId: this.userId,
				// // sessionId: this.sessionId,
				// // source: 'GoCashSDK',
				// ...this.queryParams
			};

			if (this.config.debug) {
				this._log('Sending event:', payload);
			}

			// return

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

		_getDedupEventMap() {
			try {
				const raw = localStorage.getItem('__APP2WEB_DEDUP_EVENTS__');
				return raw ? JSON.parse(this._decode(raw)) : {};
			} catch (e) {
				return {};
			}
		},

		_setDedupEventMap(map) {
			try {
				localStorage.setItem('__APP2WEB_DEDUP_EVENTS__', this._encode(JSON.stringify(map)));
			} catch (e) {
				if (this.config.debug) this._log('Failed to save dedup event map:', e);
			}
		},



		/** 实际发送事件 */
		_sendEvent(payload) {
			console.log("实际发送事件",payload)
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
						this.trackEvent(`auto_event_${eventName}`, {
							first: true
						});
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
	global.GoCash = goCashSdk;
})(window);